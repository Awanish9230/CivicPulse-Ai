import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import ApiError from '../../utils/ApiError.js';

export interface EnvVariableItem {
    key: string;
    value: string;
    maskedValue: string;
    isSecret: boolean;
    restartRecommended: boolean;
}

const ENV_KEY_PATTERN = /^[A-Z_][A-Z0-9_]*$/;

const SECRET_KEY_HINT = /(SECRET|KEY|TOKEN|PASSWORD|PASS|URI|AUTH|PRIVATE|WEBHOOK|SMTP|SID|SALT|API)/i;

const BOOT_TIME_KEYS = new Set([
    'PORT',
    'MONGODB_URI',
    'NODE_ENV',
    'CORS_ORIGIN',
    'JWT_SECRET',
    'ACCESS_TOKEN_SECRET',
    'REFRESH_TOKEN_SECRET'
]);

export const resolveServerEnvPath = (): string => {
    const directEnv = path.resolve(process.cwd(), '.env');
    if (fsSync.existsSync(directEnv)) {
        return directEnv;
    }

    const nestedServerEnv = path.resolve(process.cwd(), 'server', '.env');
    if (fsSync.existsSync(nestedServerEnv)) {
        return nestedServerEnv;
    }

    return directEnv;
};

export const normalizeEnvKey = (rawKey: string): string => {
    const key = rawKey.trim().toUpperCase();
    if (!ENV_KEY_PATTERN.test(key)) {
        throw new ApiError(
            400,
            'Environment variable key must start with A-Z or _ and contain only A-Z, 0-9, and _'
        );
    }
    return key;
};

export const formatEnvValue = (value: string): string => {
    const normalized = String(value ?? '').replace(/\r\n/g, '\n');
    if (/[\s#"'\n\r`=$\\]/.test(normalized) || normalized === '') {
        const escaped = normalized
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n');
        return `"${escaped}"`;
    }
    return normalized;
};

export const maskEnvValue = (value: string, isSecret: boolean): string => {
    if (!isSecret) return value;
    if (!value) return '';
    if (value.length <= 6) return '••••••';
    return `${value.slice(0, 3)}${'•'.repeat(Math.min(12, Math.max(4, value.length - 6)))}${value.slice(-3)}`;
};

const toEnvItem = (key: string, value: string): EnvVariableItem => {
    const isSecret = SECRET_KEY_HINT.test(key);
    return {
        key,
        value,
        maskedValue: maskEnvValue(value, isSecret),
        isSecret,
        restartRecommended: BOOT_TIME_KEYS.has(key)
    };
};

const readParsedEnvFile = async (envPath: string): Promise<{ raw: string; parsed: Record<string, string> }> => {
    try {
        const raw = await fs.readFile(envPath, 'utf8');
        const parsed = dotenv.parse(raw);
        return { raw, parsed };
    } catch (err: unknown) {
        if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') {
            return { raw: '', parsed: {} };
        }
        throw err;
    }
};

export const listEnvVariables = async (envFilePath?: string): Promise<{
    envPath: string;
    variables: EnvVariableItem[];
}> => {
    const envPath = envFilePath || resolveServerEnvPath();
    const { parsed } = await readParsedEnvFile(envPath);

    const variables = Object.keys(parsed)
        .sort((a, b) => a.localeCompare(b))
        .map((key) => toEnvItem(key, parsed[key] ?? ''));

    return {
        envPath,
        variables
    };
};

const writeUpdatedEnvLines = async (
    envPath: string,
    rawContent: string,
    updates: Record<string, string>,
    deletes: Set<string> = new Set()
): Promise<void> => {
    const lines = rawContent ? rawContent.split(/\r?\n/) : [];
    const seen = new Set<string>();
    const nextLines: string[] = [];

    for (const line of lines) {
        const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
        if (!match) {
            nextLines.push(line);
            continue;
        }

        const existingKey = match[1].toUpperCase();
        if (deletes.has(existingKey)) {
            continue;
        }

        if (Object.prototype.hasOwnProperty.call(updates, existingKey)) {
            if (!seen.has(existingKey)) {
                nextLines.push(`${existingKey}=${formatEnvValue(updates[existingKey])}`);
                seen.add(existingKey);
            }
            continue;
        }

        nextLines.push(line);
    }

    for (const [key, value] of Object.entries(updates)) {
        if (!seen.has(key) && !deletes.has(key)) {
            nextLines.push(`${key}=${formatEnvValue(value)}`);
            seen.add(key);
        }
    }

    const cleaned = nextLines.join('\n').replace(/\n+$/, '') + '\n';
    await fs.mkdir(path.dirname(envPath), { recursive: true });
    await fs.writeFile(envPath, cleaned, 'utf8');
};

export const upsertEnvVariable = async (
    rawKey: string,
    rawValue: unknown,
    envFilePath?: string
) => {
    const key = normalizeEnvKey(rawKey);
    const value = rawValue === undefined || rawValue === null ? '' : String(rawValue);
    const envPath = envFilePath || resolveServerEnvPath();

    const { raw } = await readParsedEnvFile(envPath);
    await writeUpdatedEnvLines(envPath, raw, { [key]: value });

    process.env[key] = value;

    const list = await listEnvVariables(envPath);
    return {
        updated: toEnvItem(key, value),
        ...list
    };
};

export const bulkUpsertEnvVariables = async (
    entries: Array<{ key: string; value: unknown }>,
    envFilePath?: string
) => {
    if (!Array.isArray(entries) || entries.length === 0) {
        throw new ApiError(400, 'At least one environment variable entry is required');
    }

    const normalizedUpdates: Record<string, string> = {};
    for (const entry of entries) {
        const key = normalizeEnvKey(String(entry.key ?? ''));
        normalizedUpdates[key] = entry.value === undefined || entry.value === null ? '' : String(entry.value);
    }

    const envPath = envFilePath || resolveServerEnvPath();
    const { raw } = await readParsedEnvFile(envPath);
    await writeUpdatedEnvLines(envPath, raw, normalizedUpdates);

    for (const [key, value] of Object.entries(normalizedUpdates)) {
        process.env[key] = value;
    }

    return listEnvVariables(envPath);
};

export const deleteEnvVariable = async (rawKey: string, envFilePath?: string) => {
    const key = normalizeEnvKey(rawKey);
    const envPath = envFilePath || resolveServerEnvPath();
    const { raw, parsed } = await readParsedEnvFile(envPath);

    if (!Object.prototype.hasOwnProperty.call(parsed, key)) {
        throw new ApiError(404, `Environment variable ${key} not found in .env`);
    }

    await writeUpdatedEnvLines(envPath, raw, {}, new Set([key]));
    delete process.env[key];

    return listEnvVariables(envPath);
};
