import { useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateRoadmap, RoadmapStep } from "../services/ai/aiClient";
import { LOADING_MESSAGES } from "../services/ai/prompts";

const ROADMAP_STORAGE_KEY = "@finmate_roadmap";

export interface OnboardingState {
  currentStep: number;
  moneyGoal: string;
  confidenceLevel: string;
  trackingFrequency: string;
  isLoading: boolean;
  loadingMessage: string;
  roadmap: RoadmapStep[];
  error: string | null;
}

export interface UseOnboardingReturn extends OnboardingState {
  setMoneyGoal: (value: string) => void;
  setConfidenceLevel: (value: string) => void;
  setTrackingFrequency: (value: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  generateRoadmap: () => Promise<void>;
  resetOnboarding: () => void;
  hasExistingRoadmap: boolean;
}

const getRandomLoadingMessage = (): string => {
  const index = Math.floor(Math.random() * LOADING_MESSAGES.length);
  return LOADING_MESSAGES[index];
};

const initialState: OnboardingState = {
  currentStep: 0,
  moneyGoal: "",
  confidenceLevel: "",
  trackingFrequency: "",
  isLoading: false,
  loadingMessage: LOADING_MESSAGES[0],
  roadmap: [],
  error: null,
};

export const useOnboarding = (): UseOnboardingReturn => {
  const [state, setState] = useState<OnboardingState>(initialState);
  const [hasExistingRoadmap, setHasExistingRoadmap] = useState(false);

  // Check for existing roadmap on mount
  const checkExistingRoadmap = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(ROADMAP_STORAGE_KEY);
      setHasExistingRoadmap(!!stored);
      if (stored) {
        const parsed = JSON.parse(stored);
        setState((prev) => ({ ...prev, roadmap: parsed }));
      }
    } catch {
      setHasExistingRoadmap(false);
    }
  }, []);

  useEffect(() => {
    checkExistingRoadmap();
  }, [checkExistingRoadmap]);

  const setMoneyGoal = useCallback((value: string) => {
    setState((prev) => ({ ...prev, moneyGoal: value }));
  }, []);

  const setConfidenceLevel = useCallback((value: string) => {
    setState((prev) => ({ ...prev, confidenceLevel: value }));
  }, []);

  const setTrackingFrequency = useCallback((value: string) => {
    setState((prev) => ({ ...prev, trackingFrequency: value }));
  }, []);

  const nextStep = useCallback(() => {
    setState((prev) => ({ ...prev, currentStep: prev.currentStep + 1 }));
  }, []);

  const prevStep = useCallback(() => {
    setState((prev) => ({ ...prev, currentStep: Math.max(0, prev.currentStep - 1) }));
  }, []);

  const saveRoadmap = useCallback(async (roadmap: RoadmapStep[]) => {
    try {
      await AsyncStorage.setItem(ROADMAP_STORAGE_KEY, JSON.stringify(roadmap));
      setHasExistingRoadmap(true);
    } catch {
      // Silent fail, roadmap will still be shown in memory
    }
  }, []);

  const generateRoadmapAction = useCallback(async () => {
    const { moneyGoal, confidenceLevel, trackingFrequency } = state;

    if (!moneyGoal || !confidenceLevel || !trackingFrequency) {
      setState((prev) => ({ ...prev, error: "Please answer all questions" }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      loadingMessage: getRandomLoadingMessage(),
      error: null,
    }));

    // Start rotating messages
    const messageInterval = setInterval(() => {
      setState((prev) => ({
        ...prev,
        loadingMessage: getRandomLoadingMessage(),
      }));
    }, 3000);

    try {
      const result = await generateRoadmap({
        moneyGoal,
        confidenceLevel,
        trackingFrequency,
      });

      clearInterval(messageInterval);

      await saveRoadmap(result.roadmap);

      setState((prev) => ({
        ...prev,
        isLoading: false,
        roadmap: result.roadmap,
      }));
    } catch (err) {
      clearInterval(messageInterval);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to generate roadmap. Please try again.",
      }));
    }
  }, [state.moneyGoal, state.confidenceLevel, state.trackingFrequency, saveRoadmap]);

  const resetOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(ROADMAP_STORAGE_KEY);
    } catch {
      // Silent fail
    }
    setState(initialState);
    setHasExistingRoadmap(false);
  }, []);

  return {
    ...state,
    setMoneyGoal,
    setConfidenceLevel,
    setTrackingFrequency,
    nextStep,
    prevStep,
    generateRoadmap: generateRoadmapAction,
    resetOnboarding,
    hasExistingRoadmap,
  };
};
