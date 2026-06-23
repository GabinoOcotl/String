import { memo, useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

import { themeColors } from "@/constants/theme";

const DEBOUNCE_MS = 300;

export type CourseSearchBarProps = {
  onQueryChange: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  /** Restores the input when returning to the search step. */
  initialValue?: string;
};

export const CourseSearchBar = memo(function CourseSearchBar({
  onQueryChange,
  placeholder = "Search courses (e.g. math 112)",
  autoFocus = false,
  initialValue = "",
}: CourseSearchBarProps) {
  const colorScheme = useColorScheme();
  const colors = themeColors[colorScheme === "dark" ? "dark" : "light"];
  const [value, setValue] = useState(initialValue);

  const inputColors = useMemo(
    () => ({
      color: colors.text,
      backgroundColor: colors.fieldBg,
      borderColor: colors.border,
    }),
    [colors.text, colors.fieldBg, colors.border],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      onQueryChange(value.trim());
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [value, onQueryChange]);

  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        onChangeText={setValue}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, inputColors]}
        returnKeyType="search"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
  },
});
