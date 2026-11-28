import { GoogleGenerativeAI } from '@google/generative-ai';
import { apiKeyManager } from '../../utils/apiKeyManager.js';
import { DEPARTMENT_CATEGORY_MAP } from '../../utils/departmentMapping.js';
import type { ComplaintCategory, ComplaintPriority } from './complaint.model.js';

export const MAX_DUPLICATE_RADIUS_METERS = 150;
export const ACTIVE_COMPLAINT_STATUSES = ['Submitted', 'Verified', 'Assigned', 'In Progress'] as const;

const STOPWORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'by', 'for', 'from',
    'has', 'have', 'here', 'in', 'into', 'is', 'it', 'near', 'of', 'on', 'or',
    'our', 'please', 'some', 'that', 'the', 'their', 'there', 'this', 'to',
    'very', 'was', 'were', 'with', 'issue', 'problem', 'complaint', 'area'
]);

const SYNONYM_MAP: Record<string, string> = {
    garbage: 'waste',
    trash: 'waste',
    rubbish: 'waste',
    litter: 'waste',
    dumping: 'waste',
    dump: 'waste',
    pothole: 'road',
    potholes: 'road',
    crater: 'road',
    asphalt: 'road',
    pavement: 'road',
    streetlight: 'light',
    streetlights: 'light',
    lamp: 'light',
    lights: 'light',
    lighting: 'light',
    dark: 'light',
    outage: 'power',
    electricity: 'power',
    electric: 'power',
    transformer: 'power',
    wire: 'power',
    wires: 'power',
    sewer: 'drain',
    sewage: 'drain',
    drainage: 'drain',
    clogged: 'blocked',
    choked: 'blocked',
    overflowing: 'overflow',
    flooded: 'overflow',
    leaking: 'leak',
    leakage: 'leak',
    pipe: 'water',
    pipeline: 'water',
    broken: 'damaged',
    damaged: 'damaged',
    spark: 'sparking',
    sparking: 'sparking',
    stray: 'animal',
    dog: 'animal',
    dogs: 'animal'
};

export interface DuplicateCandidate {
    _id: { toString(): string };
    category: ComplaintCategory;
    description: string;
    location: {
        coordinates: [number, number];
    };
    priority?: ComplaintPriority;
    status?: string;
    reportedBy?: string;
    coReporters?: string[];
    reportCount?: number;
    supportCount?: number;
    imageUrls?: string[];
    createdAt?: Date;
}

export interface DuplicateScoreBreakdown {
    distanceMeters: number;
    textSimilarity: number;
    sameCategory: boolean;
    combinedScore: number;
    decision: 'merge' | 'verify_ai' | 'skip';
    reason: string;
}

export interface SemanticVerifyResult {
    isDuplicate: boolean;
    confidence: number;
    reason: string;
}

export type SemanticVerifier = (
    descA: string,
    descB: string,
    categoryA: ComplaintCategory,
    categoryB: ComplaintCategory,
    distanceMeters: number
) => Promise<SemanticVerifyResult | null>;

export const getRelatedCategories = (category: ComplaintCategory): ComplaintCategory[] => {
    for (const categories of Object.values(DEPARTMENT_CATEGORY_MAP)) {
        if (categories.includes(category)) {
            return categories as ComplaintCategory[];
        }
    }
    return [category];
};

export const haversineDistanceMeters = (
    coordsA: [number, number],
    coordsB: [number, number]
): number => {
    const [lon1, lat1] = coordsA;
    const [lon2, lat2] = coordsB;
    const R = 6371000;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
};

export const normalizeTokens = (text: string): string[] => {
    const rawTokens = text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((token) => token.length > 1 && !STOPWORDS.has(token));

    const mapped = rawTokens.map((token) => {
        if (SYNONYM_MAP[token]) return SYNONYM_MAP[token];
        if (token.endsWith('ing') && token.length > 5) return token.slice(0, -3);
        if (token.endsWith('es') && token.length > 4) return token.slice(0, -2);
        if (token.endsWith('s') && token.length > 3) return token.slice(0, -1);
        return token;
    });

    return Array.from(new Set(mapped));
};

export const computeTextSimilarity = (textA: string, textB: string): number => {
    const tokensA = normalizeTokens(textA);
    const tokensB = normalizeTokens(textB);

    if (tokensA.length === 0 || tokensB.length === 0) return 0;

    const setA = new Set(tokensA);
    const setB = new Set(tokensB);
    let intersection = 0;
    for (const token of setA) {
        if (setB.has(token)) intersection += 1;
    }

    const union = new Set([...setA, ...setB]).size;
    const jaccard = union > 0 ? intersection / union : 0;
    const overlapCoeff = Math.min(setA.size, setB.size) > 0
        ? intersection / Math.min(setA.size, setB.size)
        : 0;

    return Math.round((jaccard * 0.65 + overlapCoeff * 0.35) * 1000) / 1000;
};

export const scoreDuplicateCandidate = (
    input: { category: ComplaintCategory; description: string; coordinates: [number, number] },
    candidate: DuplicateCandidate
): DuplicateScoreBreakdown => {
    const distanceMeters = haversineDistanceMeters(input.coordinates, candidate.location.coordinates);
    const sameCategory = input.category === candidate.category;
    const related = sameCategory || getRelatedCategories(input.category).includes(candidate.category);

    if (!related || distanceMeters > MAX_DUPLICATE_RADIUS_METERS) {
        return {
            distanceMeters,
            textSimilarity: 0,
            sameCategory,
            combinedScore: 0,
            decision: 'skip',
            reason: 'Outside radius or unrelated department'
        };
    }

    const textSimilarity = computeTextSimilarity(input.description, candidate.description);
    const distanceScore = Math.max(0, 1 - distanceMeters / MAX_DUPLICATE_RADIUS_METERS);
    const categoryBonus = sameCategory ? 0.15 : 0;
    const combinedScore = Math.round(
        (distanceScore * 0.42 + textSimilarity * 0.43 + categoryBonus) * 1000
    ) / 1000;

    if (sameCategory && distanceMeters <= 20 && textSimilarity >= 0.12) {
        return {
            distanceMeters,
            textSimilarity,
            sameCategory,
            combinedScore,
            decision: 'merge',
            reason: `Exact-location match (${distanceMeters}m away)`
        };
    }

    if (sameCategory && distanceMeters <= 55 && textSimilarity >= 0.28) {
        return {
            distanceMeters,
            textSimilarity,
            sameCategory,
            combinedScore,
            decision: 'merge',
            reason: `Strong local text & category match (${distanceMeters}m away)`
        };
    }

    if (distanceMeters <= 120 && textSimilarity >= 0.48) {
        return {
            distanceMeters,
            textSimilarity,
            sameCategory,
            combinedScore,
            decision: 'merge',
            reason: `High semantic description match (${distanceMeters}m away)`
        };
    }

    if ((distanceMeters <= 120 && textSimilarity >= 0.14) || (sameCategory && distanceMeters <= 75 && textSimilarity > 0)) {
        return {
            distanceMeters,
            textSimilarity,
            sameCategory,
            combinedScore,
            decision: 'verify_ai',
            reason: `Borderline match requiring semantic check (${distanceMeters}m away)`
        };
    }

    return {
        distanceMeters,
        textSimilarity,
        sameCategory,
        combinedScore,
        decision: 'skip',
        reason: 'Low text similarity; likely distinct issue'
    };
};

export const verifySemanticDuplicateWithAI: SemanticVerifier = async (
    descA,
    descB,
    categoryA,
    categoryB,
    distanceMeters
) => {
    try {
        const geminiKey = apiKeyManager.getGeminiKey();
        if (!geminiKey) return null;

        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: { responseMimeType: 'application/json' }
        });

        const prompt = `You are a civic complaint deduplication engine. Determine whether Complaint A and Complaint B describe the SAME physical municipal issue.
Complaint A (${categoryA}): "${descA}"
Complaint B (${categoryB}): "${descB}"
Distance apart: ${distanceMeters} meters.
Return strict JSON: {"isDuplicate": boolean, "confidence": number (0 to 1), "reason": "brief reason"}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(text) as Partial<SemanticVerifyResult>;

        if (typeof parsed.isDuplicate === 'boolean') {
            return {
                isDuplicate: parsed.isDuplicate,
                confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
                reason: typeof parsed.reason === 'string' ? parsed.reason : 'AI semantic assessment'
            };
        }
        return null;
    } catch {
        return null;
    }
};

export interface MatchedDuplicateResult<T extends DuplicateCandidate = DuplicateCandidate> {
    candidate: T;
    score: DuplicateScoreBreakdown;
    matchedBy: 'heuristic' | 'ai';
}

export const detectBestDuplicateMatch = async <T extends DuplicateCandidate>(
    input: { category: ComplaintCategory; description: string; coordinates: [number, number] },
    candidates: T[],
    aiVerifier: SemanticVerifier = verifySemanticDuplicateWithAI
): Promise<MatchedDuplicateResult<T> | null> => {
    const scored = candidates
        .map((candidate) => ({
            candidate,
            score: scoreDuplicateCandidate(input, candidate)
        }))
        .filter((entry) => entry.score.decision !== 'skip')
        .sort((a, b) => b.score.combinedScore - a.score.combinedScore);

    for (const entry of scored) {
        if (entry.score.decision === 'merge') {
            return {
                candidate: entry.candidate,
                score: entry.score,
                matchedBy: 'heuristic'
            };
        }

        if (entry.score.decision === 'verify_ai') {
            const aiResult = await aiVerifier(
                input.description,
                entry.candidate.description,
                input.category,
                entry.candidate.category,
                entry.score.distanceMeters
            );

            if (aiResult) {
                if (aiResult.isDuplicate && aiResult.confidence >= 0.6) {
                    return {
                        candidate: entry.candidate,
                        score: {
                            ...entry.score,
                            reason: aiResult.reason
                        },
                        matchedBy: 'ai'
                    };
                }
                continue;
            }

            // Deterministic fallback if Gemini is offline or rate-limited
            if (entry.score.combinedScore >= 0.5) {
                return {
                    candidate: entry.candidate,
                    score: entry.score,
                    matchedBy: 'heuristic'
                };
            }
        }
    }

    return null;
};

const PRIORITY_RANK: Record<ComplaintPriority, number> = {
    Low: 1,
    Medium: 2,
    High: 3,
    Critical: 4
};

export const getEscalatedPriorityForCount = (
    currentPriority: ComplaintPriority = 'Medium',
    reportCount: number
): ComplaintPriority => {
    let target: ComplaintPriority = currentPriority;
    if (reportCount >= 5) {
        target = 'Critical';
    } else if (reportCount >= 3) {
        target = 'High';
    } else if (reportCount >= 2) {
        target = 'Medium';
    }
    return PRIORITY_RANK[target] > PRIORITY_RANK[currentPriority] ? target : currentPriority;
};

export const formatDuplicateHeadline = (reportCount: number): string => {
    if (reportCount <= 1) {
        return '1 person has reported this issue';
    }
    return `${reportCount} people have reported this issue`;
};
