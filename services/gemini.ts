
import { GoogleGenAI, Type } from "@google/genai";
import { Language, Question } from "../types";
import { MONEY_TREE } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Existing categories...
const CATEGORIES = ["Indian Freedom Struggle", "Ancient Indian Science & Medicine", "World Exploration & Voyagers", "Nobel Prizes & Global Awards", "Indian Railways & Infrastructure", "Wildlife & Endangered Species", "Nuclear & Space Programs of India", "Classical Arts & Dance Forms", "Global Economic History", "Inventions & Their Inventors", "Indian Judicial System & Landmarks", "Famous Speeches in History", "Olympic Games Records", "Traditional Cuisines & Origins", "Modern Tech (AI, Quantum, Robotics)", "Geopolitics & UN History", "Flora of the Indian Subcontinent", "Obscure Literary Works", "Indian Cinema's Golden Era", "Architecture of Medieval India"];

export const fetchQuestion = async (level: number, lang: Language, attempt = 0): Promise<Question> => {
  const modelName = level === 15 ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  const languageName = lang === Language.HINDI ? "Hindi" : "English";
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

  const prompt = `Act as an expert KBC quiz master, inspired by Amitabh Bachchan's legendary hosting style.
  Create one unique, factually accurate multiple-choice question.
  CATEGORY: ${category}
  LEVEL: ${level}/15
  LANGUAGE: ${languageName}
  
  Include a dramatic and immersive 'hostIntro' for this question. It should:
  - Be respectful, authoritative, and build intense suspense.
  - Use the player's name (placeholder: {name}) naturally.
  - Sound like a real TV show: "{name} जी, बहुत ही सावधानी से खेल रहे हैं आप। अगला सवाल, ₹${MONEY_TREE.find(m => m.id === level)?.amount || '0'} के लिए, ये रहा आपकी स्क्रीन पर..."
  - For higher levels (10+), make it even more tense and congratulatory.
  
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
          explanation: { type: Type.STRING },
          hostIntro: { type: Type.STRING }
        },
        required: ["text", "options", "correctAnswer", "explanation", "hostIntro"]
      }
    };
    if (level >= 10) config.thinkingConfig = { thinkingBudget: 1000 };

    const response = await ai.models.generateContent({ model: modelName, contents: prompt, config });
    return JSON.parse(response.text || "{}") as Question;
  } catch (error) {
    if (attempt < 2) return fetchQuestion(level, lang, attempt + 1);
    throw error;
  }
};

/**
 * INTENT RECOGNITION: Maps audio to structured JSON commands.
 * Commands: SELECT_OPTION, LOCK_OPTION, USE_LIFELINE, QUIT_GAME, REPEAT_QUESTION
 */
export const recognizeVoiceCommand = async (base64Audio: string, mimeType: string, lang: Language): Promise<any | null> => {
  const isHindi = lang === Language.HINDI;
  const prompt = `You are a KBC Command Intent Recognizer. Analyze the audio for these specific intents:
  1. SELECT_OPTION: user says "Option A", "बी", "विकल्प सी", "मेरा जवाब डी है"
  2. LOCK_OPTION: user says "Option B lock कीजिए", "ए लॉक करो", "Lock Option D", "Final answer", "Lock kiya jaye"
  3. USE_LIFELINE: user says "Audience poll", "50-50", "फिफ्टी फिफ्टी", "Double dip", "Lifeline use karo"
  4. QUIT_GAME: user says "Quit game", "खेल छोड़ना है", "Exit"
  5. REPEAT_QUESTION: user says "Repeat question", "सवाल फिर से बोलो", "Dobara sunao"

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
