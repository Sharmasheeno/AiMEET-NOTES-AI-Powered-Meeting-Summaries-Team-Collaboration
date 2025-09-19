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
    throw new Error("An error occurred while generating the meeting summary.");
  }
};