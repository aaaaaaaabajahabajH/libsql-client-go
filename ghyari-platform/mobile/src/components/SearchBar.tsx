import React, { useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import { colors, spacing, radius, typography } from "../theme";
import { useStore } from "../store";

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChangeText, onSubmit, placeholder }: Props) {
  const inputRef = useRef<TextInput>(null);
  const language = useStore((s) => s.language);
  const isAr = language === "ar";

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔍</Text>
      <TextInput
        ref={inputRef}
        style={[styles.input, { textAlign: isAr ? "right" : "left" }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? (isAr ? "ابحث عن قطعتك..." : "Search parts...")}
        placeholderTextColor={colors.text.muted}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
        writingDirection={isAr ? "rtl" : "ltr"}
      />
      {value.length > 0 && Platform.OS !== "ios" && (
        <TouchableOpacity onPress={() => onChangeText("")} style={styles.clearBtn}>
          <Text style={styles.clearText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: spacing.sm,
  },
  icon: {
    fontSize: 16,
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabic,
    fontSize: typography.sizes.md,
    padding: 0,
  },
  clearBtn: {
    padding: 4,
  },
  clearText: {
    color: colors.text.muted,
    fontSize: 12,
  },
});
