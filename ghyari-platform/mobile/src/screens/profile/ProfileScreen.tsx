import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { colors, spacing, radius, typography } from "../../theme";
import { useStore } from "../../store";

interface SettingRowProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
}

function SettingRow({ icon, label, value, onPress, right, danger }: SettingRowProps) {
  const language = useStore((s) => s.language);
  const isAr = language === "ar";

  return (
    <TouchableOpacity
      style={[styles.settingRow, { flexDirection: isAr ? "row-reverse" : "row" }]}
      onPress={onPress}
      disabled={!onPress && !right}
      activeOpacity={0.7}
    >
      <View style={styles.settingIcon}>
        <Text style={styles.settingIconText}>{icon}</Text>
      </View>
      <View style={[styles.settingContent, { alignItems: isAr ? "flex-end" : "flex-start" }]}>
        <Text style={[styles.settingLabel, danger && { color: colors.error }]}>{label}</Text>
        {value && <Text style={styles.settingValue}>{value}</Text>}
      </View>
      {right ?? (onPress && <Text style={[styles.chevron, { transform: [{ scaleX: isAr ? -1 : 1 }] }]}>›</Text>)}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, isLoggedIn, logout, language, setLanguage } = useStore();
  const isAr = language === "ar";

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      isAr ? "تسجيل الخروج" : "Logout",
      isAr ? "هل أنت متأكد من تسجيل الخروج؟" : "Are you sure you want to logout?",
      [
        { text: isAr ? "إلغاء" : "Cancel", style: "cancel" },
        {
          text: isAr ? "خروج" : "Logout",
          style: "destructive",
          onPress: logout,
        },
      ]
    );
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Text style={styles.screenTitle}>{isAr ? "حسابي" : "Profile"}</Text>
        <View style={styles.guestContainer}>
          <LinearGradient
            colors={["#001433", "#003D99"]}
            style={styles.guestCard}
          >
            <Text style={styles.guestEmoji}>👤</Text>
            <Text style={styles.guestTitle}>
              {isAr ? "مرحباً بك في غياري" : "Welcome to Ghyari"}
            </Text>
            <Text style={styles.guestSub}>
              {isAr
                ? "سجّل دخولك لعرض طلباتك والمفضلة وبياناتك الشخصية"
                : "Login to view your orders, wishlist and personal data"}
            </Text>
          </LinearGradient>

          {/* Language toggle still accessible as guest */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { textAlign: isAr ? "right" : "left" }]}>
              {isAr ? "الإعدادات" : "Settings"}
            </Text>
            <View style={styles.card}>
              <SettingRow
                icon="🌐"
                label={isAr ? "اللغة / Language" : "اللغة / Language"}
                value={isAr ? "العربية" : "English"}
                right={
                  <Switch
                    value={!isAr}
                    onValueChange={(v) => setLanguage(v ? "en" : "ar")}
                    trackColor={{ false: colors.blue[500], true: colors.blue[500] }}
                    thumbColor="#fff"
                  />
                }
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>{isAr ? "حسابي" : "Profile"}</Text>

        {/* User card */}
        <LinearGradient
          colors={["#001433", "#003D99"]}
          style={styles.userCard}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>
              {user!.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={[styles.userInfo, { alignItems: isAr ? "flex-end" : "flex-start" }]}>
            <Text style={styles.userName}>{user!.name}</Text>
            <Text style={styles.userEmail}>{user!.email}</Text>
            {user!.role === "admin" && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>
                  ⭐ {isAr ? "مشرف" : "Admin"}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Account settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isAr ? "right" : "left" }]}>
            {isAr ? "الحساب" : "Account"}
          </Text>
          <View style={styles.card}>
            <SettingRow icon="📧" label={isAr ? "الإيميل" : "Email"} value={user!.email} />
            <View style={styles.rowDivider} />
            <SettingRow icon="📱" label={isAr ? "رقم الجوال" : "Phone"} value={isAr ? "غير محدد" : "Not set"} onPress={() => {}} />
            <View style={styles.rowDivider} />
            <SettingRow icon="🔑" label={isAr ? "تغيير كلمة المرور" : "Change Password"} onPress={() => {}} />
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isAr ? "right" : "left" }]}>
            {isAr ? "التفضيلات" : "Preferences"}
          </Text>
          <View style={styles.card}>
            <SettingRow
              icon="🌐"
              label={isAr ? "اللغة / Language" : "اللغة / Language"}
              right={
                <Switch
                  value={!isAr}
                  onValueChange={(v) => setLanguage(v ? "en" : "ar")}
                  trackColor={{ false: colors.blue[500], true: colors.blue[500] }}
                  thumbColor="#fff"
                />
              }
            />
            <View style={styles.rowDivider} />
            <SettingRow icon="🔔" label={isAr ? "الإشعارات" : "Notifications"} right={
              <Switch
                value={true}
                onValueChange={() => {}}
                trackColor={{ false: colors.carbon[600], true: colors.blue[500] }}
                thumbColor="#fff"
              />
            } />
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isAr ? "right" : "left" }]}>
            {isAr ? "الدعم" : "Support"}
          </Text>
          <View style={styles.card}>
            <SettingRow icon="💬" label={isAr ? "تواصل معنا" : "Contact Us"} onPress={() => {}} />
            <View style={styles.rowDivider} />
            <SettingRow icon="📋" label={isAr ? "سياسة الخصوصية" : "Privacy Policy"} onPress={() => {}} />
            <View style={styles.rowDivider} />
            <SettingRow icon="📄" label={isAr ? "شروط الاستخدام" : "Terms of Service"} onPress={() => {}} />
            <View style={styles.rowDivider} />
            <SettingRow icon="ℹ️" label={isAr ? "الإصدار" : "Version"} value="1.0.0" />
          </View>
        </View>

        {/* Logout */}
        <View style={[styles.section, styles.lastSection]}>
          <View style={styles.card}>
            <SettingRow icon="🚪" label={isAr ? "تسجيل الخروج" : "Logout"} onPress={handleLogout} danger />
          </View>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  screenTitle: {
    fontSize: typography.sizes.h3,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicBlack,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  guestContainer: {
    gap: spacing.lg,
    padding: spacing.md,
  },
  guestCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  guestEmoji: { fontSize: 48 },
  guestTitle: {
    fontSize: typography.sizes.xl,
    color: "#fff",
    fontFamily: typography.fonts.arabicBold,
    textAlign: "center",
  },
  guestSub: {
    fontSize: typography.sizes.sm,
    color: "rgba(255,255,255,0.7)",
    fontFamily: typography.fonts.arabic,
    textAlign: "center",
    lineHeight: 20,
  },
  userCard: {
    marginHorizontal: spacing.md,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatarInitial: {
    fontSize: typography.sizes.h2,
    color: "#fff",
    fontFamily: typography.fonts.arabicBlack,
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: typography.sizes.xl,
    color: "#fff",
    fontFamily: typography.fonts.arabicBold,
  },
  userEmail: {
    fontSize: typography.sizes.sm,
    color: "rgba(255,255,255,0.7)",
    fontFamily: typography.fonts.arabic,
  },
  adminBadge: {
    backgroundColor: colors.orange[500],
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  adminBadgeText: {
    fontSize: typography.sizes.xs,
    color: "#fff",
    fontFamily: typography.fonts.arabicBold,
  },
  section: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  lastSection: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    fontFamily: typography.fonts.arabicMedium,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  settingRow: {
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.bg.tertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  settingIconText: {
    fontSize: 18,
  },
  settingContent: {
    flex: 1,
    gap: 2,
  },
  settingLabel: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicMedium,
  },
  settingValue: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    fontFamily: typography.fonts.arabic,
  },
  chevron: {
    fontSize: 22,
    color: colors.text.muted,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginHorizontal: spacing.md,
  },
});
