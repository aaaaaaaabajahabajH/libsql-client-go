import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { colors, spacing, radius, typography } from "../../theme";
import { useStore } from "../../store";
import { CartItem, RootStackParamList } from "../../types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function CartScreen() {
  const navigation = useNavigation<Nav>();
  const { cartItems, cartTotal, cartCount, removeFromCart, updateQuantity, clearCart, isLoggedIn } = useStore();
  const language = useStore((s) => s.language);
  const isAr = language === "ar";

  const shipping = cartTotal >= 500 ? 0 : 25;
  const total = cartTotal + shipping;

  const handleRemove = (item: CartItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      isAr ? "حذف من السلة" : "Remove from Cart",
      isAr
        ? `هل تريد حذف "${isAr ? item.product.name_ar : item.product.name_en}" من السلة؟`
        : `Remove "${item.product.name_en}" from cart?`,
      [
        { text: isAr ? "إلغاء" : "Cancel", style: "cancel" },
        {
          text: isAr ? "حذف" : "Remove",
          style: "destructive",
          onPress: () => removeFromCart(item.product.id),
        },
      ]
    );
  };

  const handleCheckout = () => {
    if (!isLoggedIn) {
      Alert.alert(
        isAr ? "تسجيل الدخول مطلوب" : "Login Required",
        isAr ? "يجب تسجيل الدخول للمتابعة" : "Please login to continue",
        [
          { text: isAr ? "إلغاء" : "Cancel", style: "cancel" },
          {
            text: isAr ? "تسجيل الدخول" : "Login",
            onPress: () => navigation.navigate("Main"),
          },
        ]
      );
      return;
    }
    navigation.navigate("Checkout");
  };

  if (cartCount === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Text style={styles.screenTitle}>{isAr ? "سلة التسوق" : "Cart"}</Text>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>{isAr ? "السلة فارغة" : "Your cart is empty"}</Text>
          <Text style={styles.emptySub}>
            {isAr ? "ابدأ التسوق وأضف قطعك المفضلة" : "Start shopping and add your favorite parts"}
          </Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => navigation.navigate("Main")}
          >
            <Text style={styles.shopBtnText}>{isAr ? "تسوق الآن" : "Shop Now"}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={[styles.header, { flexDirection: isAr ? "row-reverse" : "row" }]}>
        <Text style={styles.screenTitle}>
          {isAr ? `السلة (${cartCount})` : `Cart (${cartCount})`}
        </Text>
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              isAr ? "مسح السلة" : "Clear Cart",
              isAr ? "هل تريد مسح كل العناصر؟" : "Clear all items?",
              [
                { text: isAr ? "إلغاء" : "Cancel", style: "cancel" },
                { text: isAr ? "مسح" : "Clear", style: "destructive", onPress: clearCart },
              ]
            );
          }}
        >
          <Text style={styles.clearBtn}>{isAr ? "مسح الكل" : "Clear All"}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={cartItems}
        keyExtractor={(i) => i.product.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const name = isAr ? item.product.name_ar : item.product.name_en;
          const price = item.product.sale_price ?? item.product.price;
          return (
            <View style={styles.cartItem}>
              {/* Image */}
              <View style={styles.itemImage}>
                {item.product.images[0] ? (
                  <Image
                    source={{ uri: item.product.images[0] }}
                    style={styles.itemImg}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={styles.itemImgPlaceholder}>🔧</Text>
                )}
              </View>

              {/* Details */}
              <View style={styles.itemDetails}>
                <Text style={[styles.itemBrand]}>{item.product.brand}</Text>
                <Text style={[styles.itemName, { textAlign: isAr ? "right" : "left" }]} numberOfLines={2}>
                  {name}
                </Text>
                <Text style={styles.itemPrice}>
                  {price.toLocaleString("ar-SA")} {isAr ? "ر.س" : "SAR"}
                </Text>

                {/* Quantity controls */}
                <View style={[styles.qtyRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                  >
                    <Text style={styles.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item)}>
                    <Text style={styles.removeBtnText}>🗑</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Line total */}
              <Text style={styles.lineTotal}>
                {(price * item.quantity).toLocaleString("ar-SA")}
                {"\n"}{isAr ? "ر.س" : "SAR"}
              </Text>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={
          <View style={styles.summary}>
            <View style={[styles.summaryRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
              <Text style={styles.summaryLabel}>{isAr ? "المجموع الفرعي" : "Subtotal"}</Text>
              <Text style={styles.summaryValue}>
                {cartTotal.toLocaleString("ar-SA")} {isAr ? "ر.س" : "SAR"}
              </Text>
            </View>
            <View style={[styles.summaryRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
              <Text style={styles.summaryLabel}>{isAr ? "الشحن" : "Shipping"}</Text>
              <Text style={[styles.summaryValue, shipping === 0 && { color: colors.success }]}>
                {shipping === 0
                  ? isAr ? "مجاني 🎉" : "Free 🎉"
                  : `${shipping} ${isAr ? "ر.س" : "SAR"}`}
              </Text>
            </View>
            {cartTotal < 500 && (
              <Text style={[styles.freeShippingHint, { textAlign: isAr ? "right" : "left" }]}>
                {isAr
                  ? `أضف ${(500 - cartTotal).toLocaleString("ar-SA")} ر.س للشحن المجاني`
                  : `Add ${(500 - cartTotal).toLocaleString("en")} SAR for free shipping`}
              </Text>
            )}
            <View style={styles.totalDivider} />
            <View style={[styles.summaryRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
              <Text style={styles.totalLabel}>{isAr ? "الإجمالي" : "Total"}</Text>
              <Text style={styles.totalValue}>
                {total.toLocaleString("ar-SA")} {isAr ? "ر.س" : "SAR"}
              </Text>
            </View>
          </View>
        }
      />

      {/* Checkout button */}
      <View style={styles.checkoutBar}>
        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
          <LinearGradient
            colors={["#FF6B00", "#FF8C00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.checkoutGradient}
          >
            <Text style={styles.checkoutText}>
              {isAr
                ? `إتمام الطلب · ${total.toLocaleString("ar-SA")} ر.س`
                : `Checkout · ${total.toLocaleString("en")} SAR`}
            </Text>
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
  },
  screenTitle: {
    fontSize: typography.sizes.h3,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicBlack,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  clearBtn: {
    color: colors.error,
    fontFamily: typography.fonts.arabic,
    fontSize: typography.sizes.sm,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicBold,
    textAlign: "center",
  },
  emptySub: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    fontFamily: typography.fonts.arabic,
    textAlign: "center",
    lineHeight: 22,
  },
  shopBtn: {
    backgroundColor: colors.orange[500],
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  shopBtnText: {
    color: "#fff",
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.arabicBold,
  },
  list: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  cartItem: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    backgroundColor: colors.bg.secondary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  itemImg: {
    width: "100%",
    height: "100%",
  },
  itemImgPlaceholder: {
    fontSize: 32,
  },
  itemDetails: {
    flex: 1,
    gap: 4,
  },
  itemBrand: {
    fontSize: typography.sizes.xs,
    color: colors.blue.neon,
    fontFamily: typography.fonts.arabicMedium,
    textTransform: "uppercase",
  },
  itemName: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicMedium,
    lineHeight: 18,
  },
  itemPrice: {
    fontSize: typography.sizes.md,
    color: colors.orange[500],
    fontFamily: typography.fonts.arabicBold,
  },
  qtyRow: {
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bg.tertiary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  qtyBtnText: {
    color: colors.text.primary,
    fontSize: 16,
    fontFamily: typography.fonts.arabicBold,
    lineHeight: 18,
  },
  qtyText: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicBold,
    minWidth: 24,
    textAlign: "center",
  },
  removeBtn: {
    marginLeft: spacing.xs,
    padding: 4,
  },
  removeBtnText: {
    fontSize: 16,
  },
  lineTotal: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicBold,
    textAlign: "center",
    minWidth: 60,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: spacing.md,
  },
  summary: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  summaryRow: {
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    fontFamily: typography.fonts.arabic,
  },
  summaryValue: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicMedium,
  },
  freeShippingHint: {
    fontSize: typography.sizes.sm,
    color: colors.warning,
    fontFamily: typography.fonts.arabic,
  },
  totalDivider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: spacing.xs,
  },
  totalLabel: {
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicBold,
  },
  totalValue: {
    fontSize: typography.sizes.xl,
    color: colors.orange[500],
    fontFamily: typography.fonts.arabicBlack,
  },
  checkoutBar: {
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
  checkoutBtn: {
    borderRadius: radius.full,
    overflow: "hidden",
  },
  checkoutGradient: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  checkoutText: {
    color: "#fff",
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.arabicBold,
  },
});
