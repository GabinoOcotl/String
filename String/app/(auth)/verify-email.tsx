import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";

import { AuthScreenChrome } from "@/components/auth/AuthScreenChrome";
import { themeColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

export default function VerifyEmailScreen() {
  const { resendSignupEmail } = useAuth();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = themeColors[isDark ? "dark" : "light"];

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emailValue = typeof email === "string" ? email : "";

  async function onResend() {
    setMessage(null);
    setError(null);

    if (!emailValue) {
      setError("No email was provided. Go back to sign up and try again.");
      return;
    }

    setLoading(true);
    const { error: resendError } = await resendSignupEmail(emailValue);
    setLoading(false);

    if (resendError) {
      setError(resendError.message);
      return;
    }

    setMessage("Confirmation email sent. Check your inbox (and spam folder).");
  }

  return (
    <AuthScreenChrome>
      <Text style={[styles.title, { color: colors.text }]}>Confirm your email</Text>
      <Text style={[styles.body, { color: colors.textMuted }]}>
        We sent a confirmation link to:
      </Text>
      <Text style={[styles.email, { color: colors.text }]}>{emailValue || "your email"}</Text>
      <Text style={[styles.body, { color: colors.textMuted }]}>
        Open the link in that email, then sign in.
      </Text>

      {error ? (
        <Text style={[styles.error, { color: colors.error }]} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      {message ? (
        <Text style={[styles.message, { color: colors.textMuted }]} accessibilityRole="alert">
          {message}
        </Text>
      ) : null}

      <Pressable
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.primary },
          pressed && styles.buttonPressed,
          loading && styles.buttonDisabled,
        ]}
        onPress={onResend}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Resend confirmation</Text>
        )}
      </Pressable>

      <View style={styles.footer}>
        <Link href="/login" asChild>
          <Pressable>
            <Text style={[styles.link, { color: colors.link }]}>Back to sign in</Text>
          </Pressable>
        </Link>
      </View>
    </AuthScreenChrome>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  body: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 24,
  },
  email: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  button: {
    marginTop: 24,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    marginTop: 20,
    alignItems: "center",
  },
  link: {
    fontSize: 15,
    fontWeight: "600",
  },
  error: {
    fontSize: 14,
    marginTop: 12,
  },
  message: {
    fontSize: 14,
    marginTop: 12,
  },
});
