
import { GoogleGenAI, Type } from "@google/genai";
import { CategoryType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function suggestCauses(problem: string) {
  if (!problem) return [];

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Suggest 6 potential root causes for this problem statement using the Fishbone (Ishikawa) method: "${problem}". 
    Categorize them into exactly these categories: ${Object.values(CategoryType).join(", ")}.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING, enum: Object.values(CategoryType) },
                reason: { type: Type.STRING, description: "A concise potential cause (max 10 words)" }
              },
              required: ["category", "reason"]
            }
          }
        },
        required: ["suggestions"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text);
    return data.suggestions || [];
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
}

export async function suggestFiveWhys(problem: string) {
  if (!problem) return [];

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Conduct a "5 Whys" root cause analysis for the following problem: "${problem}". Provide a sequence of 5 logical drill-down questions and answers that lead to a likely root cause.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
              description: "A single step in the 5 Whys chain (e.g. 'Because the machine was not maintained.')"
            }
          }
        },
        required: ["steps"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text);
    return data.steps || [];
  } catch (e) {
    console.error("Failed to parse Gemini response for 5 Whys", e);
    return [];
  }
}
