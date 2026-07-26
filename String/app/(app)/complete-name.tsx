import { useRouter } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

import { AuthPrimaryButton } from "@/components/auth/AuthPrimaryButton";
import { AuthScreenChrome } from "@/components/auth/AuthScreenChrome";
import { themeColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useNameGate } from "@/contexts/NameGateContext";
import { mapWorkerError } from "@/lib/api/mapWorkerError";
import { updateMyProfile } from "@/lib/api/users";

export default function CompleteNameScreen() {
  const { session } = useAuth();
  const { markNameComplete } = useNameGate();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = themeColors[isDark ? "dark" : "light"];

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    if (!trimmedFirst || !trimmedLast) {
      setError("Please enter your first and last name.");
      return;
    }

    const accessToken = session?.access_token;
    if (!accessToken) {
      setError("Your session expired. Sign in again.");
      return;
    }

    setLoading(true);
    try {
      await updateMyProfile(accessToken, {
        first_name: trimmedFirst,
        last_name: trimmedLast,
      });
      markNameComplete();
      router.replace("/schedule");
    } catch (saveError) {
      setError(mapWorkerError(saveError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreenChrome>
      <Text style={[styles.title, { color: colors.text }]}>
        Complete your name
      </Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Add your name so classmates can recognize you in chat.
      </Text>

      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.textMuted }]}>
          First name
        </Text>
        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          autoComplete="given-name"
          textContentType="givenName"
          placeholder="Ada"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            {
              color: colors.text,
              backgroundColor: colors.fieldBg,
              borderColor: colors.border,
            },
          ]}
        />

        <Text style={[styles.label, { color: colors.textMuted }]}>
          Last name
        </Text>
        <TextInput
          value={lastName}
          onChangeText={setLastName}
          autoComplete="family-name"
          textContentType="familyName"
          placeholder="Lovelace"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            {
              color: colors.text,
              backgroundColor: colors.fieldBg,
              borderColor: colors.border,
            },
          ]}
        />

        {error ? (
          <Text
            style={[styles.error, { color: colors.error }]}
            accessibilityRole="alert"
          >
            {error}
          </Text>
        ) : null}
      </View>

      <AuthPrimaryButton
        label="Save name"
        loading={loading}
        onPress={onSubmit}
      />
    </AuthScreenChrome>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 22,
  },
  form: {
    marginTop: 32,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  error: {
    fontSize: 14,
    marginTop: 12,
  },
});
