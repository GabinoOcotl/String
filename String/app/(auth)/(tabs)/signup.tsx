import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";

import { AuthFields } from "@/components/auth/AuthFields";
import { AuthPrimaryButton } from "@/components/auth/AuthPrimaryButton";
import { AuthScreenChrome } from "@/components/auth/AuthScreenChrome";
import { themeColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const colors = themeColors[isDark ? "dark" : "light"];

  async function onSubmit() {
    setError(null);
    const trimmed = email.trim();
    if (!trimmed || !password) {
      setError("Please enter your email and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { data, error: err } = await signUp(trimmed, password);
    setLoading(false);

    if (err) {
      setError(err.message);
      return;
    }

    if (data.session) {
      router.replace("/home");
      return;
    }

    router.replace({
      pathname: "/verify-email",
      params: { email: trimmed },
    });
  }

  return (
    <AuthScreenChrome>
      <Text style={[styles.title, { color: colors.text }]}>
        Create an account
      </Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Sign up to get started
      </Text>

      <AuthFields
        variant="signup"
        email={email}
        password={password}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        confirmPassword={confirm}
        onConfirmPasswordChange={setConfirm}
        error={error}
      />

      <AuthPrimaryButton
        label="Create account"
        loading={loading}
        onPress={onSubmit}
      />

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          Already have an account?{" "}
        </Text>
        <Link href="/login" asChild>
          <Pressable>
            <Text style={[styles.link, { color: colors.link }]}>Sign in</Text>
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
  subtitle: {
    marginTop: 8,
    fontSize: 16,
  },
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 28,
  },
  footerText: {
    fontSize: 15,
  },
  link: {
    fontSize: 15,
    fontWeight: "600",
  },
});
