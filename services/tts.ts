
import { GoogleGenAI, Modality } from "@google/genai";
import { Language, Question } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
 * ULTRA-LOW LATENCY: Fetches question and options audio in one stream.
 * Predicts timings to reveal options one-by-one.
 */
export const speakFullQuestionSequence = async (
  level: number,
  question: Question,
  lang: Language,
  onOptionReveal: (key: string) => void,
  onStart?: () => void
): Promise<void> => {
  stopSpeech();
  const ctx = initAudioContext();
  const isHindi = lang === Language.HINDI;

  const text = isHindi
    ? `${question.text}। विकल्प A: ${question.options.A}। विकल्प B: ${question.options.B}। विकल्प C: ${question.options.C}। विकल्प D: ${question.options.D}।`
    : `${question.text}. Option A: ${question.options.A}. Option B: ${question.options.B}. Option C: ${question.options.C}. Option D: ${question.options.D}.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
      
      // Notify that reading is starting now!
      if (onStart) onStart();

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
      currentSource = source;

      const qRatio = question.text.length / text.length;
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
    }
  } catch (error) {
    console.error("TTS Pipeline Error:", error);
    if (onStart) onStart();
    onOptionReveal('A'); onOptionReveal('B'); onOptionReveal('C'); onOptionReveal('D');
  }
};
