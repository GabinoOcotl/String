import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";

import { AuthFields } from "@/components/auth/AuthFields";
import { AuthPrimaryButton } from "@/components/auth/AuthPrimaryButton";
import { AuthScreenChrome } from "@/components/auth/AuthScreenChrome";
import { themeColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginScreen() {
  const { signIn, resendSignupEmail } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const colors = themeColors[isDark ? "dark" : "light"];

  async function onSubmit() {
    setError(null);
    setInfo(null);
    const emailTrim = email.trim();
    if (!emailTrim || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    const { error: err } = await signIn(emailTrim, password);
    setLoading(false);

    if (err) {
      setError(err.message);
      return;
    }

    router.replace("/home");
  }

  const canResendConfirmation =
    !!error && /email.*confirm/i.test(error) && email.trim().length > 0;

  async function onResendConfirmation() {
    setInfo(null);
    setError(null);
    const emailTrim = email.trim();
    if (!emailTrim) {
      setError("Enter your email first so we can resend the confirmation.");
      return;
    }

    setResending(true);
    const { error: resendError } = await resendSignupEmail(emailTrim);
    setResending(false);

    if (resendError) {
      setError(resendError.message);
      return;
    }

    setInfo("Confirmation email resent. Check your inbox.");
  }

  return (
    <AuthScreenChrome>
      <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Sign in to continue
      </Text>

      <AuthFields
        variant="login"
        email={email}
        password={password}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        error={error}
        info={info}
      >
        {canResendConfirmation ? (
          <Pressable onPress={onResendConfirmation} disabled={resending}>
            <Text style={[styles.link, { color: colors.link, marginTop: 12 }]}>
              {resending ? "Resending confirmation..." : "Resend confirmation email"}
            </Text>
          </Pressable>
        ) : null}
      </AuthFields>

      <AuthPrimaryButton label="Sign in" loading={loading} onPress={onSubmit} />

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          Don&apos;t have an account?{" "}
        </Text>
        <Link href="/signup" asChild>
          <Pressable>
            <Text style={[styles.link, { color: colors.link }]}>Sign up</Text>
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
