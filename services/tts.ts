
import { GoogleGenAI, Modality } from "@google/genai";
import { Language, Question } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return audioContext;
};

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const stopSpeech = () => {
  if (currentSource) {
    try {
      currentSource.stop();
    } catch (e) {}
    currentSource = null;
  }
};

/**
 * Generic speech function for host responses (locking, lifelines, etc.)
 */
export const speakHostResponse = async (
  text: string,
  onStart?: () => void,
  attempt = 0
): Promise<void> => {
  stopSpeech();
  const ctx = initAudioContext();
  
  try {
    const ttsAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ttsAi.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
            prebuiltVoiceConfig: { voiceName: 'Fenrir' },
          },
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    const base64Audio = part?.inlineData?.data;
    
    if (base64Audio) {
      const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
      if (onStart) onStart();
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
      currentSource = source;
      return new Promise((resolve) => {
        source.onended = () => {
          currentSource = null;
          resolve();
        };
      });
    } else {
      console.error("Host TTS Response Part:", JSON.stringify(part, null, 2));
      console.error("Full Host Response:", JSON.stringify(response, null, 2));
      throw new Error("No audio data in response");
    }
  } catch (error) {
    console.error(`Host Speech Error (Attempt ${attempt + 1}):`, error);
    if (attempt < 2) {
      await new Promise(r => setTimeout(r, 1000));
      return speakHostResponse(text, onStart, attempt + 1);
    }
  }
};

export const prefetchQuestionAudio = async (
  playerName: string,
  question: Question,
  lang: Language
): Promise<AudioBuffer | null> => {
  const ctx = initAudioContext();
  const isHindi = lang === Language.HINDI;
  const clean = (str: string) => str.replace(/[*_#]/g, '').trim();

  const hostIntro = question.hostIntro ? question.hostIntro.replace(/{name}/g, playerName) : null;
  const intro = hostIntro ? `${clean(hostIntro)} ` : (isHindi ? `${playerName} जी, आपका अगला सवाल यह रहा: ` : `${playerName}, here is your next question: `);

  const text = isHindi
    ? `${intro}${clean(question.text)}। विकल्प ए: ${clean(question.options.A)}। विकल्प बी: ${clean(question.options.B)}। विकल्प सी: ${clean(question.options.C)}। विकल्प डी: ${clean(question.options.D)}।`
    : `${intro}${clean(question.text)}. Option A: ${clean(question.options.A)}. Option B: ${clean(question.options.B)}. Option C: ${clean(question.options.C)}. Option D: ${clean(question.options.D)}.`;

  try {
    const ttsAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ttsAi.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
    }
  } catch (error) {
    console.error("Audio prefetch error:", error);
  }
  return null;
};

/**
 * ULTRA-LOW LATENCY: Fetches question and options audio in one stream.
 */
export const speakFullQuestionSequence = async (
  level: number,
  playerName: string,
  question: Question,
  lang: Language,
  onOptionReveal: (key: string) => void,
  onStart?: () => void,
  attempt = 0,
  prefetchedBuffer: AudioBuffer | null = null
): Promise<void> => {
  stopSpeech();
  const ctx = initAudioContext();
  const isHindi = lang === Language.HINDI;

  // Clean text: remove any special characters that might confuse the TTS engine
  const clean = (str: string) => str.replace(/[*_#]/g, '').trim();

  const hostIntro = question.hostIntro ? question.hostIntro.replace(/{name}/g, playerName) : null;
  const intro = hostIntro ? `${clean(hostIntro)} ` : (isHindi ? `${playerName} जी, आपका अगला सवाल यह रहा: ` : `${playerName}, here is your next question: `);

  const text = isHindi
    ? `${intro}${clean(question.text)}। विकल्प ए: ${clean(question.options.A)}। विकल्प बी: ${clean(question.options.B)}। विकल्प सी: ${clean(question.options.C)}। विकल्प डी: ${clean(question.options.D)}।`
    : `${intro}${clean(question.text)}. Option A: ${clean(question.options.A)}. Option B: ${clean(question.options.B)}. Option C: ${clean(question.options.C)}. Option D: ${clean(question.options.D)}.`;

  try {
    let audioBuffer: AudioBuffer;
    
    if (prefetchedBuffer) {
      audioBuffer = prefetchedBuffer;
    } else {
      // Create a fresh instance to ensure the latest API key is used
      const ttsAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const response = await ttsAi.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              // Using Fenrir for a deep male voice
              prebuiltVoiceConfig: { voiceName: 'Fenrir' },
            },
          },
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.[0];
      const base64Audio = part?.inlineData?.data;
      
      if (base64Audio) {
        audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
      } else {
        throw new Error("No audio data in response");
      }
    }
    
    if (onStart) onStart();

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start();
    currentSource = source;

    const qRatio = (intro.length + question.text.length) / text.length;
    const qDuration = audioBuffer.duration * qRatio;
    const remaining = audioBuffer.duration - qDuration;
    const optDuration = remaining / 4;

    setTimeout(() => onOptionReveal('A'), qDuration * 1000);
    setTimeout(() => onOptionReveal('B'), (qDuration + optDuration) * 1000);
    setTimeout(() => onOptionReveal('C'), (qDuration + optDuration * 2) * 1000);
    setTimeout(() => onOptionReveal('D'), (qDuration + optDuration * 3) * 1000);

    return new Promise((resolve) => {
      source.onended = () => {
        currentSource = null;
        resolve();
      };
    });
  } catch (error) {
    console.error(`TTS Pipeline Error (Attempt ${attempt + 1}):`, error);
    
    // Retry logic for transient 500 errors
    if (attempt < 2 && !prefetchedBuffer) {
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      return speakFullQuestionSequence(level, playerName, question, lang, onOptionReveal, onStart, attempt + 1);
    }

    if (onStart) onStart();
    onOptionReveal('A'); onOptionReveal('B'); onOptionReveal('C'); onOptionReveal('D');
  }
};
