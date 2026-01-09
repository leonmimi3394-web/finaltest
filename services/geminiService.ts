import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Transaction } from '../types';

// Initialize the Gemini AI client
export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Models
const MODEL_STANDARD = 'gemini-3-pro-preview'; // Used for chat & thinking
const MODEL_IMAGE = 'gemini-3-pro-preview'; // Used for image analysis

export const analyzeBusinessData = async (
  query: string,
  transactions: Transaction[],
  useThinkingMode: boolean
): Promise<string> => {
  
  // Create a context summary to feed into the AI
  const context = JSON.stringify(transactions.slice(0, 50)); // Limit context size for demo
  const systemInstruction = `
    You are Leon, an expert business consultant for an LED bulb distribution business called 'adbfc'.
    The user speaks Bengali and English. You can reply in the language the user asks in, or English by default.
    Always introduce yourself as Leon if asked.
    
    Data Context (Recent Transactions): ${context}
    
    Key Terms:
    - Munafa: Profit
    - Lite/Bulb Replace Cost: The cost incurred when replacing a faulty bulb under warranty.
    - Sell Price: Price sold to shopkeepers.
    
    If 'Thinking Mode' is enabled, perform a deep analysis of trends, identifying shops with high replacement rates, or suggesting pricing strategies.
  `;

  try {
    const config: any = {
      systemInstruction,
    };

    if (useThinkingMode) {
      config.thinkingConfig = { thinkingBudget: 32768 };
    } 

    // We do NOT set maxOutputTokens for thinking mode as requested
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_STANDARD,
      contents: query,
      config: config
    });

    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error while processing your request. Please try again.";
  }
};

export const analyzeImage = async (
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_IMAGE,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          },
          {
            text: prompt || "Analyze this image relevant to an LED bulb business."
          }
        ]
      }
    });

    return response.text || "Could not analyze image.";
  } catch (error) {
    console.error("Gemini Image API Error:", error);
    return "Error analyzing the image.";
  }
};

// --- Live API Audio Helpers ---

export const decode = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const encode = (bytes: Uint8Array) => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const createBlob = (data: Float32Array): any => { 
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export const decodeAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> => {
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
