import { apiKeyManager } from '../utils/apiKeyManager.js';
import logger from '../utils/logger.js';

const cache = new Map();
const MAX_CACHE_SIZE = 500;

export const checkToxicity = async (text) => {
    try {
        const trimmedText = text.trim();
        if (cache.has(trimmedText)) {
            return cache.get(trimmedText);
        }

        const groqKey = apiKeyManager.getGroqKey();
        
        if (!groqKey) {
            logger.warn("No Groq API key configured. Skipping moderation filter.");
            return { isToxic: false, reason: "No API Key" };
        }

        const prompt = `Analyze message for severe toxicity, hate speech, or direct threats. Ignore mild frustration. Return ONLY a valid JSON object with no markdown and no other text: {"isToxic": boolean, "reason": "brief"}. Msg: "${trimmedText}"`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Groq API responded with status ${response.status}: ${errText}`);
        }

        const data = await response.json();
        let content = data.choices[0].message.content;
        
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(content);
        
        if (cache.size >= MAX_CACHE_SIZE) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
        }
        cache.set(trimmedText, result);
        
        return result;
    } catch (error) {
        logger.error("Error during AI Moderation:", error);
        return { isToxic: false, reason: "Moderation Service Error" };
    }
};
