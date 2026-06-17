import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { login, register } from "../../api/client";
import { colors, spacing, radius, typography } from "../../theme";
import { useStore } from "../../store";

type Mode = "login" | "register";

export default function AuthScreen() {
  const { setAuth } = useStore();
  const language = useStore((s) => s.language);
  const isAr = language === "ar";

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        isAr ? "بيانات ناقصة" : "Missing Data",
        isAr ? "يرجى إدخال الإيميل وكلمة المرور" : "Please enter email and password"
      );
      return;
    }
    if (mode === "register" && !name.trim()) {
      Alert.alert(
        isAr ? "الاسم مطلوب" : "Name Required",
        isAr ? "يرجى إدخال اسمك" : "Please enter your name"
      );
      return;
    }

    setLoading(true);
    try {
      const result = mode === "login"
        ? await login(email.trim(), password)
        : await register({ email: email.trim(), password, name: name.trim(), phone: phone || undefined });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await setAuth(
        { id: result.user.id, email: result.user.email, name: result.user.name, role: result.user.role },
        result.token
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        isAr ? (mode === "login" ? "خطأ في تسجيل الدخول" : "خطأ في إنشاء الحساب") : (mode === "login" ? "Login Error" : "Register Error"),
        msg
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Logo */}
          <View style={styles.logoSection}>
            <LinearGradient
              colors={["#0066FF", "#FF6B00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoBox}
            >
              <Text style={styles.logoChar}>غ</Text>
            </LinearGradient>
            <Text style={styles.appName}>غياري</Text>
            <Text style={styles.appTagline}>
              {isAr ? "قطع السيارات الأصلية" : "Genuine Auto Parts"}
            </Text>
          </View>

          {/* Tab switch */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, mode === "login" && styles.tabActive]}
              onPress={() => setMode("login")}
            >
              <Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>
                {isAr ? "تسجيل الدخول" : "Login"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === "register" && styles.tabActive]}
              onPress={() => setMode("register")}
            >
              <Text style={[styles.tabText, mode === "register" && styles.tabTextActive]}>
                {isAr ? "حساب جديد" : "Register"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {mode === "register" && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { textAlign: isAr ? "right" : "left" }]}>
                    {isAr ? "الاسم الكامل" : "Full Name"}
                  </Text>
                  <TextInput
                    style={[styles.input, { textAlign: isAr ? "right" : "left" }]}
                    value={name}
                    onChangeText={setName}
                    placeholder={isAr ? "اسمك الكامل" : "Your full name"}
                    placeholderTextColor={colors.text.muted}
                    autoCapitalize="words"
                    writingDirection={isAr ? "rtl" : "ltr"}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { textAlign: isAr ? "right" : "left" }]}>
                    {isAr ? "رقم الجوال (اختياري)" : "Phone (optional)"}
                  </Text>
                  <TextInput
                    style={[styles.input, { textAlign: isAr ? "right" : "left" }]}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+966 5X XXX XXXX"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="phone-pad"
                    writingDirection="ltr"
                  />
                </View>
              </>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { textAlign: isAr ? "right" : "left" }]}>
                {isAr ? "الإيميل" : "Email"}
              </Text>
              <TextInput
                style={[styles.input, { textAlign: isAr ? "right" : "left" }]}
                value={email}
                onChangeText={setEmail}
                placeholder={isAr ? "example@email.com" : "example@email.com"}
                placeholderTextColor={colors.text.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                writingDirection="ltr"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { textAlign: isAr ? "right" : "left" }]}>
                {isAr ? "كلمة المرور" : "Password"}
              </Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, { flex: 1, textAlign: isAr ? "right" : "left" }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={isAr ? "٨ أحرف على الأقل" : "At least 8 characters"}
                  placeholderTextColor={colors.text.muted}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  writingDirection="ltr"
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass((s) => !s)}>
                  <Text style={styles.eyeIcon}>{showPass ? "🙈" : "👁"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {mode === "login" && (
              <TouchableOpacity style={{ alignSelf: isAr ? "flex-start" : "flex-end" }}>
                <Text style={styles.forgotText}>
                  {isAr ? "نسيت كلمة المرور؟" : "Forgot password?"}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
              <LinearGradient
                colors={["#0066FF", "#00AAFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>
                    {mode === "login"
                      ? isAr ? "تسجيل الدخول" : "Login"
                      : isAr ? "إنشاء الحساب" : "Create Account"}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Terms */}
          {mode === "register" && (
            <Text style={[styles.terms, { textAlign: isAr ? "right" : "left" }]}>
              {isAr
                ? "بإنشاء حساب، أنت توافق على شروط الاستخدام وسياسة الخصوصية الخاصة بغياري"
                : "By creating an account, you agree to Ghyari's Terms of Service and Privacy Policy"}
            </Text>
          )}

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  scroll: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  logoSection: {
    alignItems: "center",
    gap: spacing.sm,
    paddingTop: spacing.xl,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  logoChar: {
    fontSize: 36,
    color: "#fff",
    fontFamily: typography.fonts.arabicBlack,
  },
  appName: {
    fontSize: typography.sizes.h2,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicBlack,
  },
  appTagline: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    fontFamily: typography.fonts.arabic,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.full,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: colors.blue[500],
  },
  tabText: {
    fontSize: typography.sizes.md,
    color: colors.text.muted,
    fontFamily: typography.fonts.arabicMedium,
  },
  tabTextActive: {
    color: "#fff",
    fontFamily: typography.fonts.arabicBold,
  },
  form: {
    gap: spacing.md,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontFamily: typography.fonts.arabicMedium,
  },
  input: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.md,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabic,
    fontSize: typography.sizes.md,
    height: 52,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  eyeBtn: {
    padding: spacing.sm,
  },
  eyeIcon: {
    fontSize: 20,
  },
  forgotText: {
    fontSize: typography.sizes.sm,
    color: colors.blue.neon,
    fontFamily: typography.fonts.arabic,
    marginTop: -spacing.xs,
  },
  submitBtn: {
    borderRadius: radius.full,
    overflow: "hidden",
    marginTop: spacing.sm,
  },
  submitGradient: {
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  submitText: {
    color: "#fff",
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.arabicBold,
  },
  terms: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    fontFamily: typography.fonts.arabic,
    lineHeight: 18,
  },
});
