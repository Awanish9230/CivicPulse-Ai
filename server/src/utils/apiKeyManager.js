import dotenv from 'dotenv';
dotenv.config();

class APIKeyManager {
    constructor() {
        this.geminiKeys = this._parseKeys(process.env.GEMINI_API_KEY);
        this.groqKeys = this._parseKeys(process.env.GROQ_API_KEY);
        
        this.geminiIndex = 0;
        this.groqIndex = 0;
    }

    _parseKeys(keyString) {
        if (!keyString) return [];
        return keyString.split(',').map(k => k.trim()).filter(k => k.length > 0);
    }

    getGeminiKey() {
        if (this.geminiKeys.length === 0) {
            console.error("No Gemini API keys found in environment.");
            return null;
        }
        const key = this.geminiKeys[this.geminiIndex];
        this.geminiIndex = (this.geminiIndex + 1) % this.geminiKeys.length; // Round robin
        return key;
    }

    getGroqKey() {
        if (this.groqKeys.length === 0) {
            console.error("No Groq API keys found in environment.");
            return null;
        }
        const key = this.groqKeys[this.groqIndex];
        this.groqIndex = (this.groqIndex + 1) % this.groqKeys.length; // Round robin
        return key;
    }
}

export const apiKeyManager = new APIKeyManager();
