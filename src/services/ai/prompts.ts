export const ROADMAP_GENERATION_PROMPT = `You are FinMate AI, a friendly and encouraging financial coach for Gen Z users. Your task is to generate a personalized 4-5 step learning roadmap based on the user's financial goals, confidence level, and tracking frequency.

Return ONLY a valid JSON object with no additional text. The JSON should follow this exact structure:
{
  "roadmap": [
    {
      "title": "string (max 60 characters)",
      "description": "string (max 120 characters)",
      "xpValue": number (between 50-200),
      "isLocked": boolean (first step should be false, others should be true)
    }
  ]
}

Guidelines:
- First step should always be unlocked (isLocked: false)
- Subsequent steps should be locked (isLocked: true)
- XP values should increase with each step (50, 75, 100, 125, 150)
- Make titles actionable and Gen Z friendly
- Descriptions should be concise and motivating
- Each step should build upon the previous one
- Consider the user's confidence level when designing difficulty
- Factor in their tracking frequency for practical advice`;

export const CONFIDENCE_LEVELS = [
  { id: "beginner", label: "Beginner", description: "Just started learning about money" },
  { id: "intermediate", label: "Intermediate", description: "Know the basics, want to level up" },
  { id: "advanced", label: "Advanced", description: "Experienced, need advanced strategies" },
] as const;

export const TRACKING_FREQUENCIES = [
  { id: "daily", label: "Daily", description: "Track every expense" },
  { id: "weekly", label: "Weekly", description: "Review once a week" },
  { id: "occasionally", label: "Occasionally", description: "When I remember" },
  { id: "never", label: "Never", description: "First time tracking" },
] as const;

export const MONEY_GOALS = [
  { id: "save", label: "Save Money", description: "Build up my savings" },
  { id: "budget", label: "Budget Better", description: "Manage existing income" },
  { id: "invest", label: "Start Investing", description: "Grow wealth over time" },
  { id: "debt", label: "Pay Off Debt", description: "Become debt-free" },
] as const;

export const LOADING_MESSAGES = [
  "FinMate AI is crunching the numbers...",
  "Analyzing your financial DNA...",
  "Generating your personalized roadmap...",
  "Almost there, smart money moves incoming...",
  "Building your wealth journey...",
];
