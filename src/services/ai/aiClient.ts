import { ROADMAP_GENERATION_PROMPT } from "./prompts";

export type AIProvider = "gemini" | "ollama";

export interface RoadmapStep {
  title: string;
  description: string;
  xpValue: number;
  isLocked: boolean;
}

export interface RoadmapResponse {
  roadmap: RoadmapStep[];
}

export interface OnboardingData {
  moneyGoal: string;
  confidenceLevel: string;
  trackingFrequency: string;
}

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent";

const OLLAMA_API_URL = "http://localhost:11434/api/generate";

const getGeminiApiKey = (): string => {
  return process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
};

const buildPrompt = (data: OnboardingData): string => {
  return `${ROADMAP_GENERATION_PROMPT}

User Details:
- Money Goal: ${data.moneyGoal}
- Confidence Level: ${data.confidenceLevel}
- Tracking Frequency: ${data.trackingFrequency}

Generate a personalized roadmap that matches these preferences.`;
};

const parseAIResponse = (text: string): RoadmapResponse => {
  let jsonStr = text.trim();

  // Try to extract JSON from markdown code blocks
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  // Try to find JSON object in the response
  const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    jsonStr = objectMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed.roadmap && Array.isArray(parsed.roadmap)) {
      return parsed as RoadmapResponse;
    }
  } catch {
    // Continue to fallback
  }

  // Return a default roadmap if parsing fails
  return {
    roadmap: [
      { title: "Set Up Your Budget", description: "Create a simple budget using the 50/30/20 rule", xpValue: 50, isLocked: false },
      { title: "Track Your Expenses", description: "Log all spending for one week", xpValue: 75, isLocked: true },
      { title: "Build an Emergency Fund", description: "Save 1,000 INR for unexpected costs", xpValue: 100, isLocked: true },
      { title: "Automate Your Savings", description: "Set up automatic transfers to savings", xpValue: 125, isLocked: true },
      { title: "Explore Investment Basics", description: "Learn about ETFs and index funds", xpValue: 150, isLocked: true },
    ],
  };
};

export const generateRoadmapWithGemini = async (data: OnboardingData): Promise<RoadmapResponse> => {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    console.warn("Gemini API key not found, using fallback roadmap");
    return parseAIResponse("");
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: buildPrompt(data),
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

  return parseAIResponse(text);
};

export const generateRoadmapWithOllama = async (data: OnboardingData): Promise<RoadmapResponse> => {
  const response = await fetch(OLLAMA_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama3.2",
      prompt: buildPrompt(data),
      stream: false,
      format: "json",
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status}`);
  }

  const result = await response.json();
  return parseAIResponse(result.response || "");
};

export const generateRoadmap = async (
  data: OnboardingData,
  provider: AIProvider = "gemini"
): Promise<RoadmapResponse> => {
  if (provider === "ollama") {
    return generateRoadmapWithOllama(data);
  }

  return generateRoadmapWithGemini(data);
};
