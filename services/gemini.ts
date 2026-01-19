
import { GoogleGenAI, Type } from "@google/genai";
import { Language, Question } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Existing categories...
const CATEGORIES = ["Indian Freedom Struggle", "Ancient Indian Science & Medicine", "World Exploration & Voyagers", "Nobel Prizes & Global Awards", "Indian Railways & Infrastructure", "Wildlife & Endangered Species", "Nuclear & Space Programs of India", "Classical Arts & Dance Forms", "Global Economic History", "Inventions & Their Inventors", "Indian Judicial System & Landmarks", "Famous Speeches in History", "Olympic Games Records", "Traditional Cuisines & Origins", "Modern Tech (AI, Quantum, Robotics)", "Geopolitics & UN History", "Flora of the Indian Subcontinent", "Obscure Literary Works", "Indian Cinema's Golden Era", "Architecture of Medieval India"];

export const fetchQuestion = async (level: number, lang: Language, attempt = 0): Promise<Question> => {
  const modelName = level === 15 ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  const difficultyTier = level > 13 ? "expert" : level > 9 ? "high" : level > 4 ? "mid" : "low";
  const languageName = lang === Language.HINDI ? "Hindi" : "English";
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

  const prompt = `Act as an expert KBC quiz master. Create one unique, factually accurate multiple-choice question.
  CATEGORY: ${category}
  LEVEL: ${level}/15
  LANGUAGE: ${languageName}
  Respond with a SINGLE JSON OBJECT ONLY.`;

  try {
    const config: any = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          options: {
            type: Type.OBJECT,
            properties: { A: { type: Type.STRING }, B: { type: Type.STRING }, C: { type: Type.STRING }, D: { type: Type.STRING } },
            required: ["A", "B", "C", "D"]
          },
          correctAnswer: { type: Type.STRING, enum: ["A", "B", "C", "D"] },
          explanation: { type: Type.STRING }
        },
        required: ["text", "options", "correctAnswer", "explanation"]
      }
    };
    if (level >= 10) config.thinkingConfig = { thinkingBudget: 2000 };

    const response = await ai.models.generateContent({ model: modelName, contents: prompt, config });
    return JSON.parse(response.text || "{}") as Question;
  } catch (error) {
    if (attempt < 2) return fetchQuestion(level, lang, attempt + 1);
    throw error;
  }
};

/**
 * INTENT RECOGNITION: Maps audio to structured JSON commands.
 * Commands: SELECT_OPTION, LOCK_OPTION, USE_LIFELINE, QUIT_GAME
 */
export const recognizeVoiceCommand = async (base64Audio: string, mimeType: string, lang: Language): Promise<any | null> => {
  const prompt = `You are a KBC Command Intent Recognizer. Analyze the audio for these specific intents ONLY:
  1. SELECT_OPTION: user says "Option A", "बी", "विकल्प सी"
  2. LOCK_OPTION: user says "Option B lock कीजिए", "ए लॉक करो", "Lock Option D"
  3. USE_LIFELINE: user says "Audience poll", "50-50", "फिफ्टी फिफ्टी", "Flip question"
  4. QUIT_GAME: user says "Quit game", "खेल छोड़ना है", "Exit"

  Rules:
  - If background noise or unclear, return {"intent": "NONE"}.
  - Output VALID JSON ONLY.
  - Return characters A, B, C, D for options.
  - Lifeline keys: 'audiencePoll', 'fiftyFifty', 'doubleDip', 'flipQuestion'
  
  Example Response: {"intent": "LOCK_OPTION", "target": "B"}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { inlineData: { data: base64Audio, mimeType: mimeType } },
        { text: prompt }
      ],
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Intent Recognition Error:", error);
    return null;
  }
};
