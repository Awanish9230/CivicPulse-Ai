import dotenv from 'dotenv';
dotenv.config();

class APIKeyManager {
    private geminiKeys: string[];
    private groqKeys: string[];
    private geminiIndex: number;
    private groqIndex: number;

    constructor() {
        this.geminiKeys = this._parseKeys(process.env.GEMINI_API_KEY);
        this.groqKeys = this._parseKeys(process.env.GROQ_API_KEY);

        this.geminiIndex = 0;
        this.groqIndex = 0;
    }

    private _parseKeys(keyString?: string): string[] {
        if (!keyString) return [];
        return keyString.split(',').map((k) => k.trim()).filter((k) => k.length > 0);
    }

    getGeminiKey(): string | null {
        if (this.geminiKeys.length === 0) {
            console.error("No Gemini API keys found in environment.");
            return null;
        }
        const key = this.geminiKeys[this.geminiIndex];
        this.geminiIndex = (this.geminiIndex + 1) % this.geminiKeys.length;
        return key;
    }

    getGroqKey(): string | null {
        if (this.groqKeys.length === 0) {
            console.error("No Groq API keys found in environment.");
            return null;
        }
        const key = this.groqKeys[this.groqIndex];
        this.groqIndex = (this.groqIndex + 1) % this.groqKeys.length;
        return key;
    }
}

export const apiKeyManager = new APIKeyManager();
