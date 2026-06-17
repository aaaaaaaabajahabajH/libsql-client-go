import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { createOrder } from "../../api/client";
import { colors, spacing, radius, typography } from "../../theme";
import { useStore } from "../../store";
import { RootStackParamList } from "../../types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function CheckoutScreen() {
  const navigation = useNavigation<Nav>();
  const { cartItems, cartTotal, clearCart, user } = useStore();
  const language = useStore((s) => s.language);
  const isAr = language === "ar";

  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const shipping = cartTotal >= 500 ? 0 : 25;
  const total = cartTotal + shipping;

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      Alert.alert(
        isAr ? "العنوان مطلوب" : "Address Required",
        isAr ? "يرجى إدخال عنوان التوصيل" : "Please enter your delivery address"
      );
      return;
    }

    setLoading(true);
    try {
      const result = await createOrder({
        shipping_address_ar: address,
        notes_ar: notes,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      clearCart();
      navigation.replace("OrderSuccess", { orderId: result.order.id });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      Alert.alert(
        isAr ? "خطأ في الطلب" : "Order Error",
        isAr ? `فشل إنشاء الطلب: ${msg}` : `Failed to place order: ${msg}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={[styles.header, { flexDirection: isAr ? "row-reverse" : "row" }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>{isAr ? "‹ السلة" : "‹ Cart"}</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>{isAr ? "تأكيد الطلب" : "Checkout"}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Delivery info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isAr ? "right" : "left" }]}>
            📍 {isAr ? "معلومات التوصيل" : "Delivery Information"}
          </Text>

          {user && (
            <View style={styles.userCard}>
              <Text style={[styles.userCardText, { textAlign: isAr ? "right" : "left" }]}>
                👤 {user.name}
              </Text>
              <Text style={[styles.userCardSub, { textAlign: isAr ? "right" : "left" }]}>
                {user.email}
              </Text>
            </View>
          )}

          <Text style={[styles.inputLabel, { textAlign: isAr ? "right" : "left" }]}>
            {isAr ? "عنوان التوصيل *" : "Delivery Address *"}
          </Text>
          <TextInput
            style={[styles.textInput, { textAlign: isAr ? "right" : "left" }]}
            value={address}
            onChangeText={setAddress}
            placeholder={isAr ? "مثال: الرياض، حي العليا، شارع العروبة" : "e.g., Riyadh, Al Olaya District, Al-Urubah St"}
            placeholderTextColor={colors.text.muted}
            multiline
            numberOfLines={3}
            writingDirection={isAr ? "rtl" : "ltr"}
          />

          <Text style={[styles.inputLabel, { textAlign: isAr ? "right" : "left" }]}>
            {isAr ? "ملاحظات (اختياري)" : "Notes (optional)"}
          </Text>
          <TextInput
            style={[styles.textInput, { textAlign: isAr ? "right" : "left" }]}
            value={notes}
            onChangeText={setNotes}
            placeholder={isAr ? "أي تعليمات خاصة للتوصيل..." : "Any special delivery instructions..."}
            placeholderTextColor={colors.text.muted}
            multiline
            numberOfLines={2}
            writingDirection={isAr ? "rtl" : "ltr"}
          />
        </View>

        {/* Order items */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isAr ? "right" : "left" }]}>
            📦 {isAr ? "ملخص الطلب" : "Order Summary"}
          </Text>
          {cartItems.map((item) => {
            const name = isAr ? item.product.name_ar : item.product.name_en;
            const price = item.product.sale_price ?? item.product.price;
            return (
              <View
                key={item.product.id}
                style={[styles.orderItem, { flexDirection: isAr ? "row-reverse" : "row" }]}
              >
                <Text style={[styles.orderItemName, { flex: 1, textAlign: isAr ? "right" : "left" }]} numberOfLines={1}>
                  {name}
                </Text>
                <Text style={styles.orderItemQty}>×{item.quantity}</Text>
                <Text style={styles.orderItemPrice}>
                  {(price * item.quantity).toLocaleString("ar-SA")} {isAr ? "ر.س" : "SAR"}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Totals */}
        <View style={styles.section}>
          <View style={[styles.totalRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
            <Text style={styles.totalRowLabel}>{isAr ? "المجموع الفرعي" : "Subtotal"}</Text>
            <Text style={styles.totalRowValue}>
              {cartTotal.toLocaleString("ar-SA")} {isAr ? "ر.س" : "SAR"}
            </Text>
          </View>
          <View style={[styles.totalRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
            <Text style={styles.totalRowLabel}>{isAr ? "الشحن" : "Shipping"}</Text>
            <Text style={[styles.totalRowValue, shipping === 0 && { color: colors.success }]}>
              {shipping === 0 ? (isAr ? "مجاني" : "Free") : `${shipping} ${isAr ? "ر.س" : "SAR"}`}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={[styles.totalRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
            <Text style={styles.grandTotalLabel}>{isAr ? "الإجمالي" : "Total"}</Text>
            <Text style={styles.grandTotalValue}>
              {total.toLocaleString("ar-SA")} {isAr ? "ر.س" : "SAR"}
            </Text>
          </View>
        </View>

        {/* Payment note */}
        <View style={styles.paymentNote}>
          <Text style={[styles.paymentNoteText, { textAlign: isAr ? "right" : "left" }]}>
            💳 {isAr ? "الدفع عند الاستلام · آمن ومضمون" : "Cash on Delivery · Safe & Guaranteed"}
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Place order button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.orderBtn}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          <LinearGradient
            colors={["#FF6B00", "#FF8C00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.orderBtnGradient}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.orderBtnText}>
                {isAr ? `تأكيد الطلب · ${total.toLocaleString("ar-SA")} ر.س` : `Place Order · ${total.toLocaleString("en")} SAR`}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  backBtn: {
    color: colors.blue.neon,
    fontFamily: typography.fonts.arabic,
    fontSize: typography.sizes.md,
    minWidth: 60,
  },
  screenTitle: {
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicBold,
  },
  scroll: {
    padding: spacing.md,
    gap: spacing.md,
  },
  section: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicBold,
    marginBottom: spacing.xs,
  },
  userCard: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.active,
  },
  userCardText: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicMedium,
  },
  userCardSub: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    fontFamily: typography.fonts.arabic,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontFamily: typography.fonts.arabicMedium,
  },
  textInput: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.md,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabic,
    fontSize: typography.sizes.md,
    minHeight: 60,
    textAlignVertical: "top",
  },
  orderItem: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  orderItemName: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontFamily: typography.fonts.arabic,
  },
  orderItemQty: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    fontFamily: typography.fonts.arabic,
  },
  orderItemPrice: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicMedium,
    minWidth: 80,
    textAlign: "right",
  },
  totalRow: {
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalRowLabel: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    fontFamily: typography.fonts.arabic,
  },
  totalRowValue: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicMedium,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.default,
  },
  grandTotalLabel: {
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicBold,
  },
  grandTotalValue: {
    fontSize: typography.sizes.xl,
    color: colors.orange[500],
    fontFamily: typography.fonts.arabicBlack,
  },
  paymentNote: {
    backgroundColor: "rgba(0,255,136,0.06)",
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.2)",
  },
  paymentNoteText: {
    fontSize: typography.sizes.sm,
    color: colors.success,
    fontFamily: typography.fonts.arabic,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.bg.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  orderBtn: {
    borderRadius: radius.full,
    overflow: "hidden",
  },
  orderBtnGradient: {
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  orderBtnText: {
    color: "#fff",
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.arabicBold,
  },
});
