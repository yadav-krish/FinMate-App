import { useEffect, useState } from "react";
import { Pressable, Text, View, ScrollView } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RoadmapStep } from "../services/ai/aiClient";

const ROADMAP_STORAGE_KEY = "@finmate_roadmap";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

interface RoadmapCardProps {
  step: RoadmapStep;
  index: number;
  total: number;
}

function RoadmapCard({ step, index, total }: RoadmapCardProps) {
  const isLocked = step.isLocked;

  return (
    <View className="relative">
      {/* Timeline connector */}
      {index < total - 1 && (
        <View className="absolute left-6 top-full z-10 h-6 w-0.5 bg-emerald-500/30" />
      )}

      <View
        className={`relative rounded-3xl border p-5 ${
          isLocked
            ? "border-slate-800/50 bg-slate-900/30"
            : "border-emerald-500/20 bg-slate-900"
        }`}
      >
        <View className="flex-row items-start gap-4">
          {/* Step indicator */}
          <View
            className={`h-10 w-10 rounded-full items-center justify-center ${
              isLocked ? "bg-slate-800" : "bg-emerald-500/20"
            }`}
          >
            {isLocked ? (
              <Text className="text-sm font-bold text-slate-600">🔒</Text>
            ) : (
              <Text className="text-sm font-bold text-emerald-300">{index + 1}</Text>
            )}
          </View>

          <View className="flex-1">
            <View className="flex-row items-start justify-between">
              <Text
                className={`flex-1 text-base font-semibold leading-tight ${
                  isLocked ? "text-slate-500" : "text-white"
                }`}
              >
                {step.title}
              </Text>
            </View>
            <Text
              className={`mt-2 text-sm leading-relaxed ${
                isLocked ? "text-slate-600" : "text-slate-300"
              }`}
            >
              {step.description}
            </Text>

            {!isLocked && (
              <View className="mt-4 flex-row items-center gap-2">
                <View className="rounded-full bg-emerald-500/20 px-3 py-1.5">
                  <Text className="text-xs font-bold text-emerald-300">+{step.xpValue} XP</Text>
                </View>
                <View className="rounded-full bg-emerald-500/10 px-3 py-1.5">
                  <Text className="text-xs font-medium text-emerald-400/80">In Progress</Text>
                </View>
              </View>
            )}

            {isLocked && (
              <View className="mt-3 rounded-full bg-slate-800/50 px-3 py-1.5 self-start">
                <Text className="text-xs text-slate-600">Locked</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

export default function HomeScreen({ navigation }: Props) {
  const [roadmap, setRoadmap] = useState<RoadmapStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkRoadmap = async () => {
      try {
        const stored = await AsyncStorage.getItem(ROADMAP_STORAGE_KEY);
        if (stored) {
          setRoadmap(JSON.parse(stored));
        }
      } catch {
        // Silent fail
      } finally {
        setIsLoading(false);
      }
    };

    checkRoadmap();

    // Refresh when screen comes into focus
    const unsubscribe = navigation.addListener("focus", checkRoadmap);
    return unsubscribe;
  }, [navigation]);

  const hasRoadmap = roadmap.length > 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-950 px-6 pt-12 items-center justify-center">
        <Text className="text-slate-400">Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-950 px-6 pt-12" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-3xl font-bold text-white">FinMate</Text>
          <Text className="mt-1 text-sm text-slate-400">{getGreeting()}</Text>
        </View>
        <View className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1">
          <Text className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
            Beta
          </Text>
        </View>
      </View>

      <Text className="mt-4 text-base text-slate-200">
        Your AI-powered money coach for Gen Z.
      </Text>

      {/* Conditional: Start Here Card (only if no roadmap) */}
      {!hasRoadmap && (
        <View className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <View className="flex-row items-center gap-2">
            <View className="h-2 w-2 rounded-full bg-emerald-400" />
            <Text className="text-xs uppercase tracking-widest text-emerald-300">Start here</Text>
          </View>
          <Text className="mt-3 text-lg font-semibold text-white">
            Build your money roadmap
          </Text>
          <Text className="mt-2 text-sm text-slate-300">
            Complete onboarding to get a personalized learning roadmap and smart money insights.
          </Text>
          <Pressable
            className="mt-5 items-center rounded-full bg-emerald-400 px-4 py-3"
            onPress={() => navigation.navigate("Onboarding")}
          >
            <Text className="text-sm font-semibold text-slate-950">Start onboarding</Text>
          </Pressable>
        </View>
      )}

      {/* AI Roadmap Timeline (only if roadmap exists) */}
      {hasRoadmap && (
        <View className="mt-8">
          <View className="flex-row items-center gap-2">
            <View className="h-2 w-2 rounded-full bg-emerald-400" />
            <Text className="text-xs uppercase tracking-widest text-emerald-300">
              Your AI Roadmap
            </Text>
          </View>
          <Text className="mt-2 text-lg font-semibold text-white">
            Your personalized journey
          </Text>
          <Text className="mt-1 text-sm text-slate-400">
            Complete steps to unlock new lessons and earn XP
          </Text>

          <View className="mt-6 gap-4">
            {roadmap.map((step, index) => (
              <RoadmapCard
                key={index}
                step={step}
                index={index}
                total={roadmap.length}
              />
            ))}
          </View>
        </View>
      )}

      {/* Today's Lesson (hidden if roadmap exists) */}
      {!hasRoadmap && (
        <View className="mt-6">
          <Text className="text-sm uppercase tracking-widest text-slate-400">Today</Text>
          <View className="mt-3 rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <Text className="text-base font-semibold text-white">
              Learn the basics of budgeting
            </Text>
            <Text className="mt-2 text-sm text-slate-300">
              10-minute lesson + 2 quick questions.
            </Text>
            <View className="mt-4 flex-row items-center justify-between">
              <Text className="text-xs uppercase tracking-widest text-slate-400">Progress</Text>
              <Text className="text-sm font-semibold text-emerald-300">0%</Text>
            </View>
            <View className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <View className="h-2 w-0 bg-emerald-400" />
            </View>
          </View>
        </View>
      )}

      {/* Quick Stats */}
      <View className="mt-6 flex-row gap-3">
        <View className="flex-1 rounded-3xl border border-slate-800 bg-slate-900 p-4">
          <Text className="text-xs uppercase tracking-widest text-slate-400">Goal</Text>
          <Text className="mt-2 text-base font-semibold text-white">Save 5,000 INR</Text>
          <Text className="mt-1 text-xs text-slate-400">Due in 3 months</Text>
        </View>
        <View className="flex-1 rounded-3xl border border-slate-800 bg-slate-900 p-4">
          <Text className="text-xs uppercase tracking-widest text-slate-400">Budget</Text>
          <Text className="mt-2 text-base font-semibold text-white">1,200 INR</Text>
          <Text className="mt-1 text-xs text-slate-400">Left this week</Text>
        </View>
      </View>

      <View className="h-8" />
    </ScrollView>
  );
}
