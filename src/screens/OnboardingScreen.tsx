import { useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useOnboarding } from "../hooks/useOnboarding";
import {
  CONFIDENCE_LEVELS,
  TRACKING_FREQUENCIES,
  MONEY_GOALS,
} from "../services/ai/prompts";

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

interface OptionSelectorProps {
  options: readonly { id: string; label: string; description: string }[];
  selected: string;
  onSelect: (id: string) => void;
}

function OptionSelector({ options, selected, onSelect }: OptionSelectorProps) {
  return (
    <View className="mt-3 gap-2">
      {options.map((option) => {
        const isSelected = selected === option.id;
        return (
          <Pressable
            key={option.id}
            className={`rounded-xl border p-4 transition-colors ${
              isSelected
                ? "border-emerald-500/30 bg-emerald-500/10"
                : "border-slate-700/50 bg-slate-800/30"
            }`}
            onPress={() => onSelect(option.id)}
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text
                  className={`font-semibold ${isSelected ? "text-emerald-300" : "text-white"}`}
                >
                  {option.label}
                </Text>
                <Text className="mt-1 text-xs text-slate-400">
                  {option.description}
                </Text>
              </View>
              <View
                className={`h-5 w-5 rounded-full border-2 ${
                  isSelected
                    ? "border-emerald-400 bg-emerald-400"
                    : "border-slate-600"
                }`}
              >
                {isSelected && (
                  <View className="h-full w-full rounded-full bg-emerald-400" />
                )}
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

interface LoadingStateProps {
  message: string;
}

function LoadingState({ message }: LoadingStateProps) {
  return (
    <View className="flex-1 items-center justify-center">
      <View className="rounded-3xl border border-emerald-500/20 bg-slate-900/80 p-8">
        <ActivityIndicator size="large" color="#34d399" className="mb-4" />
        <Text className="text-center text-base font-medium text-emerald-300">
          {message}
        </Text>
        <Text className="mt-2 text-center text-xs text-slate-400">
          This usually takes a few seconds...
        </Text>
      </View>
    </View>
  );
}

export default function OnboardingScreen({ navigation }: Props) {
  const {
    currentStep,
    moneyGoal,
    confidenceLevel,
    trackingFrequency,
    isLoading,
    loadingMessage,
    error,
    setMoneyGoal,
    setConfidenceLevel,
    setTrackingFrequency,
    nextStep,
    prevStep,
    generateRoadmap: handleGenerateRoadmap,
    roadmap,
  } = useOnboarding();

  // Show loading state
  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-950">
        <LoadingState message={loadingMessage} />
      </View>
    );
  }

  // Show generated roadmap preview
  if (roadmap.length > 0) {
    return (
      <ScrollView className="flex-1 bg-slate-950 px-6 pt-16">
        <Text className="text-2xl font-bold text-white">Your Roadmap</Text>
        <Text className="mt-2 text-sm text-slate-300">
          Here's your personalized financial journey!
        </Text>

        <View className="mt-6 gap-4">
          {roadmap.map((step, index) => (
            <View
              key={index}
              className={`relative rounded-3xl border p-5 ${
                step.isLocked
                  ? "border-slate-800 bg-slate-900/50"
                  : "border-emerald-500/20 bg-slate-900"
              }`}
            >
              {/* Timeline connector */}
              {index < roadmap.length - 1 && (
                <View className="absolute left-6 top-full h-4 w-0.5 bg-slate-700" />
              )}

              <View className="flex-row items-start gap-4">
                {/* Step number */}
                <View
                  className={`h-8 w-8 rounded-full items-center justify-center ${
                    step.isLocked ? "bg-slate-800" : "bg-emerald-500/20"
                  }`}
                >
                  <Text
                    className={`text-sm font-bold ${step.isLocked ? "text-slate-500" : "text-emerald-300"}`}
                  >
                    {index + 1}
                  </Text>
                </View>

                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text
                      className={`text-base font-semibold ${step.isLocked ? "text-slate-400" : "text-white"}`}
                    >
                      {step.title}
                    </Text>
                    {step.isLocked && (
                      <View className="rounded-full bg-slate-800 px-2 py-1">
                        <Text className="text-xs text-slate-500">Locked</Text>
                      </View>
                    )}
                  </View>
                  <Text
                    className={`mt-1 text-sm ${step.isLocked ? "text-slate-500" : "text-slate-300"}`}
                  >
                    {step.description}
                  </Text>

                  {!!step.estimatedMinutes && (
                    <View className="mt-2 self-start rounded-full bg-slate-800/70 px-3 py-1.5">
                      <Text className="text-xs text-slate-300">
                        {step.level ? `${step.level} • ` : ""}
                        {step.estimatedMinutes} min
                      </Text>
                    </View>
                  )}

                  {!!step.whyThisModule && (
                    <View className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                      <Text className="text-xs uppercase tracking-widest text-slate-500">
                        Why this step
                      </Text>
                      <Text
                        className={`mt-1 text-xs ${step.isLocked ? "text-slate-600" : "text-slate-300"}`}
                      >
                        {step.whyThisModule}
                      </Text>
                    </View>
                  )}

                  {!!step.actionItems?.length && (
                    <View className="mt-3 gap-1">
                      {step.actionItems.slice(0, 2).map((item, itemIndex) => (
                        <Text
                          key={`${step.moduleId ?? index}-${itemIndex}`}
                          className={`text-xs ${step.isLocked ? "text-slate-600" : "text-slate-300"}`}
                        >
                          • {item}
                        </Text>
                      ))}
                    </View>
                  )}

                  {!step.isLocked && (
                    <View className="mt-3 flex-row items-center gap-2">
                      <View className="rounded-full bg-emerald-500/20 px-3 py-1">
                        <Text className="text-xs font-semibold text-emerald-300">
                          +{step.xpValue} XP
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>

        <Pressable
          className="mt-8 items-center rounded-full bg-emerald-400 px-4 py-4"
          onPress={() => navigation.navigate("Home")}
        >
          <Text className="text-sm font-semibold text-slate-950">
            Start Learning
          </Text>
        </Pressable>

        <View className="h-8" />
      </ScrollView>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <Text className="text-sm text-slate-400">Step 1 of 3</Text>
            <Text className="mt-2 text-xl font-bold text-white">
              What's your money goal?
            </Text>
            <OptionSelector
              options={MONEY_GOALS}
              selected={moneyGoal}
              onSelect={setMoneyGoal}
            />
          </>
        );
      case 1:
        return (
          <>
            <Text className="text-sm text-slate-400">Step 2 of 3</Text>
            <Text className="mt-2 text-xl font-bold text-white">
              How confident are you with budgeting?
            </Text>
            <OptionSelector
              options={CONFIDENCE_LEVELS}
              selected={confidenceLevel}
              onSelect={setConfidenceLevel}
            />
          </>
        );
      case 2:
        return (
          <>
            <Text className="text-sm text-slate-400">Step 3 of 3</Text>
            <Text className="mt-2 text-xl font-bold text-white">
              How often do you track expenses?
            </Text>
            <OptionSelector
              options={TRACKING_FREQUENCIES}
              selected={trackingFrequency}
              onSelect={setTrackingFrequency}
            />
          </>
        );
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!moneyGoal;
      case 1:
        return !!confidenceLevel;
      case 2:
        return !!trackingFrequency;
      default:
        return false;
    }
  };

  return (
    <View className="flex-1 bg-slate-950 px-6 pt-16">
      <View className="flex-row items-center justify-between">
        {currentStep > 0 ? (
          <Pressable onPress={prevStep} className="p-2 -ml-2">
            <Text className="text-sm text-slate-400">← Back</Text>
          </Pressable>
        ) : (
          <View className="w-10" />
        )}
        <Text className="text-sm text-slate-500">{currentStep + 1}/3</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="mt-6 flex-1" showsVerticalScrollIndicator={false}>
        {renderStep()}

        {error && (
          <View className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
            <Text className="text-sm text-red-300">{error}</Text>
          </View>
        )}
      </ScrollView>

      <View className="mt-4 pb-8">
        {currentStep < 2 ? (
          <Pressable
            className={`items-center rounded-full px-4 py-4 ${
              canProceed() ? "bg-emerald-400" : "bg-slate-800"
            }`}
            onPress={nextStep}
            disabled={!canProceed()}
          >
            <Text
              className={`text-sm font-semibold ${canProceed() ? "text-slate-950" : "text-slate-500"}`}
            >
              Continue
            </Text>
          </Pressable>
        ) : (
          <Pressable
            className={`items-center rounded-full px-4 py-4 ${
              canProceed() ? "bg-emerald-400" : "bg-slate-800"
            }`}
            onPress={handleGenerateRoadmap}
            disabled={!canProceed()}
          >
            <Text
              className={`text-sm font-semibold ${canProceed() ? "text-slate-950" : "text-slate-500"}`}
            >
              Generate My Roadmap
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
