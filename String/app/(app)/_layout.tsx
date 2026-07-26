import { Redirect, Stack, usePathname, type Href } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import { AuthInitGate } from "@/components/auth/AuthInitGate";
import { themeColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { NameGateProvider, useNameGate } from "@/contexts/NameGateContext";
import { ScheduleProvider } from "@/contexts/ScheduleContext";
import { ChatRefreshProvider } from "@/contexts/ChatRefreshContext";
import { mapWorkerError } from "@/lib/api/mapWorkerError";
import {
  getMyProfile,
  profileHasDisplayName,
} from "@/lib/api/users";
import { workerConfigError } from "@/lib/api/workerClient";

const COMPLETE_NAME_HREF = "/complete-name" as Href;

function AppGroupContent() {
  const { session } = useAuth();
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = themeColors[isDark ? "dark" : "light"];
  const {
    nameStatus,
    nameError,
    setNameStatus,
    setNameError,
    refreshNameGate,
    nameCheckAttempt,
  } = useNameGate();

  const accessToken = session?.access_token;
  const onCompleteName = pathname.includes("complete-name");

  useEffect(() => {
    let cancelled = false;

    async function checkProfileName() {
      if (!accessToken) {
        if (!cancelled) {
          setNameStatus("loading");
          setNameError(null);
        }
        return;
      }

      if (workerConfigError) {
        if (!cancelled) {
          setNameError(workerConfigError);
          setNameStatus("error");
        }
        return;
      }

      if (!cancelled) {
        setNameStatus("loading");
        setNameError(null);
      }

      try {
        const profile = await getMyProfile(accessToken);
        if (cancelled) return;
        setNameStatus(profileHasDisplayName(profile) ? "ready" : "needs_name");
      } catch (error) {
        if (cancelled) return;
        setNameError(mapWorkerError(error));
        setNameStatus("error");
      }
    }

    void checkProfileName();
    return () => {
      cancelled = true;
    };
  }, [accessToken, nameCheckAttempt, setNameError, setNameStatus]);

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (nameStatus === "loading") {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (nameStatus === "error") {
    return (
      <View
        style={[
          styles.centered,
          styles.padded,
          { backgroundColor: colors.background },
        ]}
      >
        <Text
          style={[styles.title, { color: colors.text }]}
          accessibilityRole="alert"
        >
          Unable to load profile
        </Text>
        <Text style={[styles.message, { color: colors.textMuted }]}>
          {nameError ?? "Something went wrong."}
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.primary },
            pressed && styles.buttonPressed,
          ]}
          onPress={refreshNameGate}
        >
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
            Try again
          </Text>
        </Pressable>
      </View>
    );
  }

  if (nameStatus === "needs_name" && !onCompleteName) {
    return <Redirect href={COMPLETE_NAME_HREF} />;
  }

  if (nameStatus === "ready" && onCompleteName) {
    return <Redirect href="/schedule" />;
  }

  return (
    <ChatRefreshProvider>
      <ScheduleProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </ScheduleProvider>
    </ChatRefreshProvider>
  );
}

export default function AppGroupLayout() {
  return (
    <AuthInitGate>
      <NameGateProvider>
        <AppGroupContent />
      </NameGateProvider>
    </AuthInitGate>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  padded: {
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  button: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
