/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Type } from "@google/genai";
import { MeetingNotes } from '../types';

export const summarizeTranscription = async (transcription: string): Promise<MeetingNotes> => {
  if (!transcription.trim()) {
    return {
      summary: "No speech was detected.",
      actionItems: [],
      keyDecisions: [],
    };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

  const prompt = `
    You are an expert meeting assistant. Your task is to analyze the following meeting transcription and extract key information.
    Provide a concise summary of the meeting.
    List all clear action items, assigning them to a person if mentioned.
    List all key decisions that were made.

    If no action items or key decisions are found, return an empty array for those fields.

    Meeting Transcription:
    ---
    ${transcription}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A concise summary of the entire meeting conversation."
            },
            actionItems: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
                description: "A specific task or action to be completed after the meeting."
              },
              description: "A list of all action items identified in the meeting."
            },
            keyDecisions: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
                description: "A significant decision made during the meeting."
              },
              description: "A list of all key decisions made during the meeting."
            }
          },
          required: ["summary", "actionItems", "keyDecisions"]
        },
      },
    });

    const jsonText = response.text.trim();
    // Basic validation to ensure the response is valid JSON
    if (jsonText.startsWith('{') && jsonText.endsWith('}')) {
        const parsedNotes: MeetingNotes = JSON.parse(jsonText);
        return parsedNotes;
    } else {
        console.error("Received non-JSON response from Gemini:", jsonText);
        throw new Error("Failed to parse the meeting summary. The AI returned an unexpected format.");
    }
  } catch (error) {
    console.error("Error summarizing transcription with Gemini:", error);
    if (error instanceof Error && (error.message.toLowerCase().includes('fetch failed') || error.message.toLowerCase().includes('network'))) {
        throw new Error("Summarization failed due to a network issue. Please check your internet connection and try again.");
    }
    throw new Error("An error occurred while generating the meeting summary. The AI service may be temporarily unavailable.");
  }
};


export const generateImageFromPrompt = async (prompt: string, aspectRatio: string): Promise<string> => {
  if (!prompt.trim()) {
    throw new Error("Prompt cannot be empty.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  
  try {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return base64ImageBytes;
    } else {
        throw new Error("Image generation failed. The model did not return an image.");
    }

  } catch (error) {
    console.error("Error generating image with Gemini:", error);
    if (error instanceof Error && error.message.includes('prompt was blocked')) {
        throw new Error("The prompt was blocked for safety reasons. Please modify your prompt and try again.");
    }
    throw new Error("An error occurred while generating the image.");
  }
};