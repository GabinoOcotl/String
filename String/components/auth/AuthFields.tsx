import type { ReactNode } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

import { themeColors } from "@/constants/theme";

type AuthFieldsBase = {
  email: string;
  password: string;
  onEmailChange: (text: string) => void;
  onPasswordChange: (text: string) => void;
  error: string | null;
  /** Shown below the error (e.g. login confirmation hints). */
  info?: string | null;
  /** Rendered after error/info (e.g. resend confirmation link). */
  children?: ReactNode;
};

export type AuthFieldsProps = AuthFieldsBase &
  (
    | { variant: "login" }
    | {
        variant: "signup";
        confirmPassword: string;
        onConfirmPasswordChange: (text: string) => void;
      }
  );

export function AuthFields(props: AuthFieldsProps) {
  const colorScheme = useColorScheme();
  const colors = themeColors[colorScheme === "dark" ? "dark" : "light"];

  const inputColors = {
    color: colors.text,
    backgroundColor: colors.fieldBg,
    borderColor: colors.border,
  };

  const isSignup = props.variant === "signup";

  return (
    <View style={styles.form}>
      <Text style={[styles.label, { color: colors.textMuted }]}>Email</Text>
      <TextInput
        value={props.email}
        onChangeText={props.onEmailChange}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        placeholder="you@example.com"
        placeholderTextColor={colors.textMuted}
        style={[styles.input, inputColors]}
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>Password</Text>
      <TextInput
        value={props.password}
        onChangeText={props.onPasswordChange}
        secureTextEntry
        autoComplete={isSignup ? "new-password" : "password"}
        textContentType={isSignup ? "newPassword" : "password"}
        placeholder={isSignup ? "At least 6 characters" : "••••••••"}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, inputColors]}
      />

      {isSignup ? (
        <>
          <Text style={[styles.label, { color: colors.textMuted }]}>
            Confirm password
          </Text>
          <TextInput
            value={props.confirmPassword}
            onChangeText={props.onConfirmPasswordChange}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            placeholder="Repeat password"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, inputColors]}
          />
        </>
      ) : null}

      {props.error ? (
        <Text
          style={[styles.error, { color: colors.error }]}
          accessibilityRole="alert"
        >
          {props.error}
        </Text>
      ) : null}
      {props.info ? (
        <Text
          style={[styles.info, { color: colors.textMuted }]}
          accessibilityRole="alert"
        >
          {props.info}
        </Text>
      ) : null}
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    marginTop: 32,
    gap: 0,
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
  info: {
    fontSize: 14,
    marginTop: 12,
  },
});
