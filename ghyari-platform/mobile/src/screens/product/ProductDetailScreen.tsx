import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { fetchProduct } from "../../api/client";
import { colors, spacing, radius, typography } from "../../theme";
import { useStore } from "../../store";
import { RootStackParamList } from "../../types";

const { width } = Dimensions.get("window");

type NavProp = NativeStackNavigationProp<RootStackParamList, "ProductDetail">;
type RouteProp_ = RouteProp<RootStackParamList, "ProductDetail">;

export default function ProductDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProp_>();
  const { productId } = route.params;

  const language = useStore((s) => s.language);
  const addToCart = useStore((s) => s.addToCart);
  const cartItems = useStore((s) => s.cartItems);
  const isAr = language === "ar";

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => fetchProduct(productId),
    staleTime: 5 * 60_000,
  });

  const inCart = cartItems.some((i) => i.product.id === productId);
  const displayPrice = product?.sale_price && product.sale_price < product.price
    ? product.sale_price
    : product?.price ?? 0;
  const hasDiscount = product?.sale_price && product.sale_price < product.price;
  const name = product ? (isAr ? product.name_ar : product.name_en) : "";
  const description = product
    ? (isAr ? (product.description_ar ?? "") : (product.description_en ?? ""))
    : "";

  const handleAddToCart = () => {
    if (!product) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addToCart(product, quantity);
    Alert.alert(
      isAr ? "تمت الإضافة ✓" : "Added ✓",
      isAr ? `${name} أُضيف للسلة` : `${name} added to cart`,
      [
        { text: isAr ? "متابعة التسوق" : "Continue", style: "cancel" },
        {
          text: isAr ? "عرض السلة" : "View Cart",
          onPress: () => navigation.navigate("Main"),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={colors.blue[500]} size="large" style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorText}>
            {isAr ? "خطأ في تحميل المنتج" : "Failed to load product"}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.retryText}>{isAr ? "رجوع" : "Go Back"}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.gallery}>
          {product.images.length > 0 ? (
            <>
              <Image
                source={{ uri: product.images[selectedImageIdx] }}
                style={styles.mainImage}
                contentFit="cover"
                transition={200}
              />
              {product.images.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbnails}
                >
                  {product.images.map((img, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => setSelectedImageIdx(idx)}
                      style={[
                        styles.thumbnail,
                        selectedImageIdx === idx && styles.thumbnailActive,
                      ]}
                    >
                      <Image
                        source={{ uri: img }}
                        style={styles.thumbnailImage}
                        contentFit="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderEmoji}>🔧</Text>
            </View>
          )}

          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>{isAr ? "›" : "‹"}</Text>
          </TouchableOpacity>

          {/* Badges */}
          <View style={[styles.badges, { flexDirection: isAr ? "row-reverse" : "row" }]}>
            {product.is_performance && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>⚡ {isAr ? "أداء" : "Performance"}</Text>
              </View>
            )}
            {product.is_tuning && (
              <View style={[styles.badge, styles.badgeTuning]}>
                <Text style={styles.badgeText}>🏎️ {isAr ? "تزويد" : "Tuning"}</Text>
              </View>
            )}
            {product.is_oem && (
              <View style={[styles.badge, styles.badgeOem]}>
                <Text style={styles.badgeText}>✓ OEM</Text>
              </View>
            )}
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.info}>
          {/* Brand + SKU */}
          <View style={[styles.metaRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
            <Text style={styles.brand}>{product.brand}</Text>
            <Text style={styles.sku}>SKU: {product.sku}</Text>
          </View>

          {/* Name */}
          <Text style={[styles.name, { textAlign: isAr ? "right" : "left" }]}>
            {name}
          </Text>

          {/* Rating */}
          {product.rating > 0 && (
            <View style={[styles.ratingRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Text key={s} style={[styles.star, { color: s <= product.rating ? colors.warning : colors.text.muted }]}>
                  ★
                </Text>
              ))}
              <Text style={styles.ratingText}>
                {product.rating.toFixed(1)} ({product.review_count} {isAr ? "تقييم" : "reviews"})
              </Text>
            </View>
          )}

          {/* Price */}
          <LinearGradient
            colors={["rgba(0,102,255,0.08)", "transparent"]}
            style={styles.priceCard}
          >
            <View style={[styles.priceRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
              <View>
                <Text style={styles.price}>
                  {displayPrice.toLocaleString("ar-SA")} {isAr ? "ر.س" : "SAR"}
                </Text>
                {hasDiscount && (
                  <Text style={styles.originalPrice}>
                    {isAr ? "السعر الأصلي: " : "Was: "}
                    {product.price.toLocaleString("ar-SA")} {isAr ? "ر.س" : "SAR"}
                  </Text>
                )}
              </View>
              {hasDiscount && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>
                    {Math.round(((product.price - displayPrice) / product.price) * 100)}% {isAr ? "خصم" : "OFF"}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>

          {/* Stock */}
          <View style={[styles.stockRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
            <View style={[styles.stockDot, { backgroundColor: product.stock > 0 ? colors.success : colors.error }]} />
            <Text style={styles.stockText}>
              {product.stock > 0
                ? product.stock <= (product.low_stock_alert ?? 5)
                  ? isAr ? `${product.stock} قطع متبقية فقط!` : `Only ${product.stock} left!`
                  : isAr ? "متوفر في المخزون" : "In Stock"
                : isAr ? "غير متوفر" : "Out of Stock"}
            </Text>
          </View>

          {/* Description */}
          {description && (
            <View style={styles.descSection}>
              <Text style={[styles.sectionTitle, { textAlign: isAr ? "right" : "left" }]}>
                {isAr ? "الوصف" : "Description"}
              </Text>
              <Text style={[styles.description, { textAlign: isAr ? "right" : "left" }]}>
                {description}
              </Text>
            </View>
          )}

          {/* Compatibility */}
          {product.compatibility && product.compatibility.length > 0 && (
            <View style={styles.descSection}>
              <Text style={[styles.sectionTitle, { textAlign: isAr ? "right" : "left" }]}>
                {isAr ? "التوافق" : "Compatibility"}
              </Text>
              <View style={styles.tagsWrap}>
                {product.compatibility.map((c, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{c}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Specs */}
          <View style={styles.descSection}>
            <Text style={[styles.sectionTitle, { textAlign: isAr ? "right" : "left" }]}>
              {isAr ? "المواصفات" : "Specifications"}
            </Text>
            {[
              { label: isAr ? "الماركة" : "Brand", value: product.brand },
              { label: isAr ? "الفئة" : "Category", value: product.category_id },
              { label: isAr ? "SKU", value: product.sku },
              product.weight_kg ? { label: isAr ? "الوزن" : "Weight", value: `${product.weight_kg} kg` } : null,
              { label: isAr ? "المبيع" : "Sold", value: `${product.sold_count} ${isAr ? "قطعة" : "pcs"}` },
            ].filter(Boolean).map((spec) => (
              <View
                key={spec!.label}
                style={[styles.specRow, { flexDirection: isAr ? "row-reverse" : "row" }]}
              >
                <Text style={styles.specLabel}>{spec!.label}</Text>
                <Text style={styles.specValue}>{spec!.value}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        {/* Quantity */}
        <View style={[styles.qtyRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyText}>{quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => setQuantity((q) => Math.min(product.stock, q + 1))}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.addToCartBtn, product.stock === 0 && styles.addToCartDisabled]}
          onPress={handleAddToCart}
          disabled={product.stock === 0}
        >
          <LinearGradient
            colors={["#FF6B00", "#FF8C00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addToCartGradient}
          >
            <Text style={styles.addToCartText}>
              {product.stock === 0
                ? isAr ? "غير متوفر" : "Out of Stock"
                : inCart
                  ? isAr ? "إضافة المزيد 🛒" : "Add More 🛒"
                  : isAr ? "أضف للسلة 🛒" : "Add to Cart 🛒"}
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
  loader: {
    marginTop: 80,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  errorEmoji: { fontSize: 48 },
  errorText: {
    fontSize: typography.sizes.lg,
    color: colors.text.secondary,
    fontFamily: typography.fonts.arabicMedium,
  },
  retryBtn: {
    backgroundColor: colors.blue[500],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  retryText: {
    color: "#fff",
    fontFamily: typography.fonts.arabicBold,
  },
  gallery: {
    position: "relative",
    backgroundColor: colors.bg.secondary,
  },
  mainImage: {
    width,
    height: width * 0.75,
  },
  imagePlaceholder: {
    width,
    height: width * 0.75,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg.tertiary,
  },
  imagePlaceholderEmoji: { fontSize: 72 },
  thumbnails: {
    padding: spacing.sm,
    gap: spacing.sm,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbnailActive: {
    borderColor: colors.blue[500],
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  backBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    color: "#fff",
    fontSize: 22,
    lineHeight: 26,
  },
  badges: {
    position: "absolute",
    bottom: 12,
    left: 12,
    gap: 6,
  },
  badge: {
    backgroundColor: colors.orange[500],
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeTuning: { backgroundColor: colors.blue[500] },
  badgeOem: { backgroundColor: colors.success },
  badgeText: {
    color: "#fff",
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.arabicBold,
  },
  info: {
    padding: spacing.md,
    gap: spacing.md,
  },
  metaRow: {
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    fontSize: typography.sizes.sm,
    color: colors.blue.neon,
    fontFamily: typography.fonts.arabicBold,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sku: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    fontFamily: typography.fonts.arabic,
  },
  name: {
    fontSize: typography.sizes.h3,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicBold,
    lineHeight: 28,
  },
  ratingRow: {
    alignItems: "center",
    gap: 4,
  },
  star: { fontSize: 16 },
  ratingText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontFamily: typography.fonts.arabic,
    marginLeft: 6,
  },
  priceCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.active,
  },
  priceRow: {
    alignItems: "center",
    justifyContent: "space-between",
  },
  price: {
    fontSize: typography.sizes.h2,
    color: colors.orange[500],
    fontFamily: typography.fonts.arabicBlack,
  },
  originalPrice: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    fontFamily: typography.fonts.arabic,
    textDecorationLine: "line-through",
    marginTop: 2,
  },
  discountBadge: {
    backgroundColor: colors.error,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  discountText: {
    color: "#fff",
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.arabicBold,
  },
  stockRow: {
    alignItems: "center",
    gap: spacing.xs,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stockText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontFamily: typography.fonts.arabic,
  },
  descSection: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicBold,
  },
  description: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    fontFamily: typography.fonts.arabic,
    lineHeight: 24,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  tagText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontFamily: typography.fonts.arabic,
  },
  specRow: {
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  specLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    fontFamily: typography.fonts.arabic,
  },
  specValue: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicMedium,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.bg.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  qtyRow: {
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.full,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: colors.bg.tertiary,
  },
  qtyBtnText: {
    color: colors.text.primary,
    fontSize: 20,
    fontFamily: typography.fonts.arabicBold,
    lineHeight: 22,
  },
  qtyText: {
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicBold,
    minWidth: 28,
    textAlign: "center",
  },
  addToCartBtn: {
    flex: 1,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  addToCartDisabled: {
    opacity: 0.5,
  },
  addToCartGradient: {
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  addToCartText: {
    color: "#fff",
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.arabicBold,
  },
});
