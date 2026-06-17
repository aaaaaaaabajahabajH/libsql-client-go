import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from "react-native-reanimated";
import { colors, spacing, radius, typography } from "../../theme";
import { useStore } from "../../store";
import { RootStackParamList } from "../../types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route_ = RouteProp<RootStackParamList, "OrderSuccess">;

export default function OrderSuccessScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route_>();
  const { orderId } = route.params;
  const language = useStore((s) => s.language);
  const isAr = language === "ar";

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    scale.value = withSpring(1, { damping: 8, stiffness: 120 });
    opacity.value = withDelay(100, withSpring(1));
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <LinearGradient
        colors={["#0A0A0F", "#001A0A", "#0A0A0F"]}
        style={styles.gradient}
      >
        <Animated.View style={[styles.content, animStyle]}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successTitle}>
            {isAr ? "تم إرسال طلبك!" : "Order Placed!"}
          </Text>
          <Text style={[styles.successSub, { textAlign: isAr ? "right" : "left" }]}>
            {isAr
              ? "شكراً لك! سيتم التواصل معك خلال ٢٤ ساعة لتأكيد الطلب والتوصيل."
              : "Thank you! We'll contact you within 24 hours to confirm your order and delivery."}
          </Text>

          <View style={styles.orderIdCard}>
            <Text style={styles.orderIdLabel}>
              {isAr ? "رقم الطلب" : "Order ID"}
            </Text>
            <Text style={styles.orderIdValue}>
              #{orderId.slice(-8).toUpperCase()}
            </Text>
          </View>

          <View style={styles.steps}>
            {[
              { emoji: "✅", labelAr: "تأكيد الطلب", labelEn: "Order Confirmed" },
              { emoji: "📦", labelAr: "التجهيز", labelEn: "Preparing" },
              { emoji: "🚚", labelAr: "الشحن", labelEn: "Shipping" },
              { emoji: "🏠", labelAr: "التوصيل", labelEn: "Delivery" },
            ].map((step, i) => (
              <View key={i} style={styles.step}>
                <View style={[styles.stepDot, i === 0 && styles.stepDotActive]}>
                  <Text style={styles.stepEmoji}>{step.emoji}</Text>
                </View>
                <Text style={styles.stepLabel}>
                  {isAr ? step.labelAr : step.labelEn}
                </Text>
                {i < 3 && <View style={styles.stepLine} />}
              </View>
            ))}
          </View>
        </Animated.View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.ordersBtn}
            onPress={() => navigation.navigate("Main")}
          >
            <LinearGradient
              colors={["#0066FF", "#00AAFF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.btnText}>
                {isAr ? "عرض طلباتي" : "View My Orders"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shopMoreBtn}
            onPress={() => navigation.navigate("Main")}
          >
            <Text style={styles.shopMoreText}>
              {isAr ? "متابعة التسوق" : "Continue Shopping"}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  gradient: {
    flex: 1,
    justifyContent: "space-between",
    padding: spacing.xl,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  successEmoji: {
    fontSize: 80,
  },
  successTitle: {
    fontSize: typography.sizes.h1,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicBlack,
    textAlign: "center",
  },
  successSub: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    fontFamily: typography.fonts.arabic,
    lineHeight: 24,
    maxWidth: 320,
    textAlign: "center",
  },
  orderIdCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.2)",
    width: "100%",
    gap: spacing.xs,
  },
  orderIdLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    fontFamily: typography.fonts.arabic,
  },
  orderIdValue: {
    fontSize: typography.sizes.h3,
    color: colors.success,
    fontFamily: typography.fonts.arabicBlack,
    letterSpacing: 2,
  },
  steps: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: spacing.md,
  },
  step: {
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  stepDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg.secondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  stepDotActive: {
    backgroundColor: "rgba(0,255,136,0.15)",
    borderColor: colors.success,
  },
  stepEmoji: {
    fontSize: 16,
  },
  stepLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    fontFamily: typography.fonts.arabic,
    textAlign: "center",
  },
  stepLine: {
    position: "absolute",
    top: 18,
    left: "60%",
    right: "-60%",
    height: 1,
    backgroundColor: colors.border.default,
    zIndex: -1,
  },
  actions: {
    gap: spacing.sm,
  },
  ordersBtn: {
    borderRadius: radius.full,
    overflow: "hidden",
  },
  btnGradient: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.arabicBold,
  },
  shopMoreBtn: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  shopMoreText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.arabic,
  },
});
