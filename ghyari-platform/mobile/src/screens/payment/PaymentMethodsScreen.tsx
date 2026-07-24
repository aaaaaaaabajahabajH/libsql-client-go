import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { colors, spacing, radius, typography } from "../../theme";
import { useStore } from "../../store";
import { RootStackParamList } from "../../types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Method = "cod" | "mada" | "stc_pay" | "apple_pay";

interface PaymentOption {
  id: Method;
  emoji: string;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  colors: [string, string];
  available: boolean;
  badgeAr?: string;
  badgeEn?: string;
}

const OPTIONS: PaymentOption[] = [
  {
    id: "cod",
    emoji: "💵",
    labelAr: "الدفع عند الاستلام",
    labelEn: "Cash on Delivery",
    descAr: "ادفع كاش عند وصول الطلب",
    descEn: "Pay in cash when order arrives",
    colors: ["#0F5132", "#146C43"],
    available: true,
    badgeAr: "الأكثر شعبية",
    badgeEn: "Most Popular",
  },
  {
    id: "mada",
    emoji: "💳",
    labelAr: "مدى",
    labelEn: "Mada Card",
    descAr: "بطاقة مدى — دفع فوري وآمن",
    descEn: "Mada card — instant, secure",
    colors: ["#003399", "#0055CC"],
    available: true,
  },
  {
    id: "stc_pay",
    emoji: "📱",
    labelAr: "STC Pay",
    labelEn: "STC Pay",
    descAr: "الدفع عبر تطبيق STC Pay",
    descEn: "Pay via STC Pay app",
    colors: ["#4B0082", "#6A0DAD"],
    available: true,
  },
  {
    id: "apple_pay",
    emoji: "",
    labelAr: "Apple Pay",
    labelEn: "Apple Pay",
    descAr: "دفع سريع بلمسة واحدة",
    descEn: "Fast one-touch payment",
    colors: ["#000000", "#1a1a1a"],
    available: Platform.OS === "ios",
  },
];

export default function PaymentMethodsScreen() {
  const navigation = useNavigation<Nav>();
  const { paymentMethod, setPaymentMethod } = useStore();
  const language = useStore((s) => s.language);
  const isAr = language === "ar";

  const handleSelect = (m: Method) => {
    Haptics.selectionAsync();
    setPaymentMethod(m);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={[styles.header, { flexDirection: isAr ? "row-reverse" : "row" }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {isAr ? "طرق الدفع" : "Payment Methods"}
        </Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.desc, { textAlign: isAr ? "right" : "left" }]}>
          {isAr
            ? "اختر طريقة الدفع التي تفضّلها. يمكن تغييرها في أي وقت."
            : "Choose your preferred payment method. You can change it anytime."}
        </Text>

        {OPTIONS.map((opt) => {
          const selected = paymentMethod === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              disabled={!opt.available}
              onPress={() => handleSelect(opt.id)}
              activeOpacity={0.85}
              style={[
                styles.card,
                selected && styles.cardSelected,
                !opt.available && styles.cardDisabled,
              ]}
            >
              <LinearGradient
                colors={opt.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconBox}
              >
                {opt.id === "apple_pay" ? (
                  <Text style={[styles.applePayText]}>Pay</Text>
                ) : (
                  <Text style={styles.iconEmoji}>{opt.emoji}</Text>
                )}
              </LinearGradient>

              <View style={[styles.info, { alignItems: isAr ? "flex-end" : "flex-start" }]}>
                <View style={[styles.labelRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
                  <Text style={styles.label}>
                    {isAr ? opt.labelAr : opt.labelEn}
                  </Text>
                  {opt.badgeAr && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {isAr ? opt.badgeAr : opt.badgeEn}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.subLabel, { textAlign: isAr ? "right" : "left" }]}>
                  {opt.available
                    ? isAr ? opt.descAr : opt.descEn
                    : isAr ? "غير متاح على جهازك" : "Not available on your device"}
                </Text>
              </View>

              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Security note */}
        <View style={styles.securityNote}>
          <Text style={styles.securityEmoji}>🔒</Text>
          <Text style={[styles.securityText, { textAlign: isAr ? "right" : "left" }]}>
            {isAr
              ? "جميع المدفوعات مشفّرة ومحمية وفق معايير PCI DSS. غياري لا يحفظ بيانات بطاقتك."
              : "All payments are encrypted and PCI DSS compliant. Ghyari never stores your card data."}
          </Text>
        </View>
      </ScrollView>

      {/* Confirm button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.confirmBtn} onPress={() => navigation.goBack()}>
          <LinearGradient
            colors={["#0066FF", "#00AAFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.confirmGradient}
          >
            <Text style={styles.confirmText}>
              {isAr ? "تأكيد الاختيار" : "Confirm Selection"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  back: {
    color: colors.text.primary,
    fontSize: 30,
    lineHeight: 30,
    minWidth: 30,
  },
  title: {
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicBold,
  },
  scroll: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  desc: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontFamily: typography.fonts.arabic,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border.default,
  },
  cardSelected: {
    borderColor: colors.blue[500],
    backgroundColor: "rgba(0,102,255,0.08)",
  },
  cardDisabled: {
    opacity: 0.4,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: {
    fontSize: 28,
  },
  applePayText: {
    color: "#fff",
    fontFamily: typography.fonts.arabicBold,
    fontSize: 20,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  labelRow: {
    alignItems: "center",
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicBold,
  },
  badge: {
    backgroundColor: "rgba(0,255,136,0.15)",
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.35)",
  },
  badgeText: {
    color: colors.success,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.arabicBold,
  },
  subLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    fontFamily: typography.fonts.arabic,
    lineHeight: 16,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.default,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: colors.blue[500],
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.blue[500],
  },
  securityNote: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: "rgba(0,255,136,0.06)",
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.2)",
    marginTop: spacing.md,
  },
  securityEmoji: { fontSize: 20 },
  securityText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: colors.success,
    fontFamily: typography.fonts.arabic,
    lineHeight: 18,
  },
  bottomBar: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  confirmBtn: {
    borderRadius: radius.full,
    overflow: "hidden",
  },
  confirmGradient: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  confirmText: {
    color: "#fff",
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.arabicBold,
  },
});
