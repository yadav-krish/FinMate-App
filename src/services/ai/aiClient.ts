import { ROADMAP_GENERATION_PROMPT } from "./prompts";

export type AIProvider = "gemini" | "ollama";

export interface RoadmapStep {
  title: string;
  description: string;
  xpValue: number;
  isLocked: boolean;
  moduleId?: string;
  level?: "beginner" | "intermediate" | "advanced";
  estimatedMinutes?: number;
  whyThisModule?: string;
  actionItems?: string[];
}

export interface RoadmapResponse {
  roadmap: RoadmapStep[];
}

export interface OnboardingData {
  moneyGoal: string;
  confidenceLevel: string;
  trackingFrequency: string;
}

interface LearningModule {
  id: string;
  title: string;
  level: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  sourceUrl: string;
}

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent";

const OLLAMA_API_URL = "http://localhost:11434/api/generate";

const LEVEL_ORDER: Record<LearningModule["level"], number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

const GOAL_MODULE_PREFERENCES: Record<string, string[]> = {
  save: [
    "budgeting",
    "saving-investing",
    "financial-planning",
    "banking",
    "digital-finance",
  ],
  budget: [
    "budgeting",
    "consumer-skills",
    "banking",
    "digital-finance",
    "financial-planning",
  ],
  invest: [
    "saving-investing",
    "risk-management",
    "economic-principles",
    "retirement",
    "real-estate",
  ],
  debt: [
    "credit-debt",
    "loans",
    "budgeting",
    "financial-planning",
    "consumer-skills",
  ],
};

const getGeminiApiKey = (): string => {
  return process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
};

const getModuleCatalog = (): LearningModule[] => {
  try {
    const modules =
      require("../../../assets/JSON Format Modules.json") as LearningModule[];
    if (!Array.isArray(modules)) {
      return [];
    }
    return modules;
  } catch {
    return [];
  }
};

const getAllowedLevelsForUser = (
  confidenceLevel: string,
): LearningModule["level"][] => {
  if (confidenceLevel === "beginner") {
    return ["beginner", "intermediate"];
  }

  if (confidenceLevel === "intermediate") {
    return ["beginner", "intermediate", "advanced"];
  }

  return ["beginner", "intermediate", "advanced"];
};

const rankModulesForUser = (
  modules: LearningModule[],
  data: OnboardingData,
): LearningModule[] => {
  const preferredIds = GOAL_MODULE_PREFERENCES[data.moneyGoal] ?? [];

  return [...modules].sort((a, b) => {
    const aPriority = preferredIds.includes(a.id)
      ? preferredIds.indexOf(a.id)
      : preferredIds.length + 1;
    const bPriority = preferredIds.includes(b.id)
      ? preferredIds.indexOf(b.id)
      : preferredIds.length + 1;

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    const levelDiff = LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level];
    if (levelDiff !== 0) {
      return levelDiff;
    }

    return a.estimatedMinutes - b.estimatedMinutes;
  });
};

const buildModuleContext = (data: OnboardingData): string => {
  const allModules = getModuleCatalog();
  const allowedLevels = getAllowedLevelsForUser(data.confidenceLevel);

  const filtered = allModules.filter((module) =>
    allowedLevels.includes(module.level),
  );
  const ranked = rankModulesForUser(filtered, data).slice(0, 12);

  return JSON.stringify(ranked, null, 2);
};

const buildPrompt = (data: OnboardingData): string => {
  const moduleContext = buildModuleContext(data);

  return `${ROADMAP_GENERATION_PROMPT}

User Details:
- Money Goal: ${data.moneyGoal}
- Confidence Level: ${data.confidenceLevel}
- Tracking Frequency: ${data.trackingFrequency}

Available Modules (from app content catalog):
${moduleContext}

Generate a personalized roadmap that matches these preferences and uses the available modules above in a logical sequence.`;
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
      {
        title: "Build Your Budget Foundation",
        description:
          "Start with a realistic weekly budget based on your actual expenses.",
        xpValue: 50,
        isLocked: false,
        moduleId: "budgeting",
        level: "beginner",
        estimatedMinutes: 15,
        whyThisModule:
          "Budgeting is the base skill that makes every money goal easier.",
        actionItems: ["List all fixed expenses", "Set a weekly spending cap"],
      },
      {
        title: "Optimize Daily Spending",
        description:
          "Identify small spending leaks and redirect cash toward your goal.",
        xpValue: 75,
        isLocked: true,
        moduleId: "consumer-skills",
        level: "beginner",
        estimatedMinutes: 15,
        whyThisModule:
          "Better buying decisions create instant savings without more income.",
        actionItems: [
          "Audit last 7 days of purchases",
          "Cut one non-essential category",
        ],
      },
      {
        title: "Strengthen Your Savings System",
        description:
          "Use automation to save consistently, even with a busy routine.",
        xpValue: 100,
        isLocked: true,
        moduleId: "saving-investing",
        level: "beginner",
        estimatedMinutes: 15,
        whyThisModule: "Automated saving removes willpower from the process.",
        actionItems: [
          "Create an auto-transfer",
          "Set an emergency fund mini-target",
        ],
      },
      {
        title: "Plan Milestones Like a Pro",
        description:
          "Translate your goal into monthly milestones you can track clearly.",
        xpValue: 125,
        isLocked: true,
        moduleId: "financial-planning",
        level: "intermediate",
        estimatedMinutes: 15,
        whyThisModule: "Clear milestones improve consistency and confidence.",
        actionItems: ["Set a 30-day target", "Define a review checkpoint"],
      },
      {
        title: "Protect Progress From Setbacks",
        description:
          "Add risk-aware habits so one emergency does not derail your plan.",
        xpValue: 150,
        isLocked: true,
        moduleId: "risk-management",
        level: "intermediate",
        estimatedMinutes: 15,
        whyThisModule: "Financial resilience keeps your roadmap sustainable.",
        actionItems: ["Build a buffer rule", "Create a fallback plan"],
      },
    ],
  };
};

export const generateRoadmapWithGemini = async (
  data: OnboardingData,
): Promise<RoadmapResponse> => {
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

export const generateRoadmapWithOllama = async (
  data: OnboardingData,
): Promise<RoadmapResponse> => {
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
  provider: AIProvider = "gemini",
): Promise<RoadmapResponse> => {
  if (provider === "ollama") {
    return generateRoadmapWithOllama(data);
  }

  return generateRoadmapWithGemini(data);
};
