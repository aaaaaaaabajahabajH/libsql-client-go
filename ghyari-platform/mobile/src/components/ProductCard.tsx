import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { colors, spacing, radius, typography } from "../theme";
import { Product } from "../types";
import { useStore } from "../store";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - spacing.md * 3) / 2;

interface Props {
  product: Product;
  onPress: () => void;
}

export default function ProductCard({ product, onPress }: Props) {
  const addToCart = useStore((s) => s.addToCart);
  const language = useStore((s) => s.language);
  const isAr = language === "ar";

  const name = isAr ? product.name_ar : product.name_en;
  const hasDiscount = product.sale_price != null && product.sale_price < product.price;
  const displayPrice = hasDiscount ? product.sale_price! : product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.price - displayPrice) / product.price) * 100)
    : 0;
  const imageUrl = product.images?.[0];

  const handleAddToCart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addToCart(product);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <LinearGradient
            colors={["#0F0F1A", "#141420"]}
            style={styles.imagePlaceholder}
          >
            <Text style={styles.imagePlaceholderText}>🔧</Text>
          </LinearGradient>
        )}

        {/* Bottom gradient overlay */}
        <LinearGradient
          colors={["transparent", "rgba(10,10,15,0.7)"]}
          style={styles.imageOverlay}
        />

        {/* Discount badge */}
        {hasDiscount && discountPct > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discountPct}%</Text>
          </View>
        )}

        {/* Performance badge */}
        {product.is_performance && (
          <View style={styles.perfBadge}>
            <Text style={styles.perfBadgeText}>⚡</Text>
          </View>
        )}

        {/* OEM badge */}
        {product.is_oem && (
          <View style={styles.oemBadge}>
            <Text style={styles.oemText}>OEM</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text
          style={[styles.brand, { textAlign: isAr ? "right" : "left" }]}
          numberOfLines={1}
        >
          {product.brand}
        </Text>
        <Text
          style={[styles.name, { textAlign: isAr ? "right" : "left" }]}
          numberOfLines={2}
        >
          {name}
        </Text>

        {/* Rating */}
        {product.rating > 0 && (
          <View style={[styles.ratingRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
            <Text style={styles.star}>★</Text>
            <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
            {product.review_count > 0 && (
              <Text style={styles.reviewCount}>({product.review_count})</Text>
            )}
          </View>
        )}

        {/* Price row */}
        <View style={[styles.priceRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
          <View>
            <Text style={styles.price}>
              {displayPrice.toLocaleString("ar-SA")}{" "}
              <Text style={styles.currency}>{isAr ? "ر.س" : "SAR"}</Text>
            </Text>
            {hasDiscount && (
              <Text style={styles.originalPrice}>
                {product.price.toLocaleString("ar-SA")}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.cartBtn,
              product.stock === 0 && styles.cartBtnDisabled,
            ]}
            onPress={handleAddToCart}
            disabled={product.stock === 0}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <LinearGradient
              colors={product.stock === 0 ? ["#333", "#444"] : ["#0066FF", "#0088FF"]}
              style={styles.cartBtnGradient}
            >
              <Text style={styles.cartBtnText}>{product.stock === 0 ? "×" : "+"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Low stock */}
        {product.stock > 0 && product.stock <= (product.low_stock_alert ?? 5) && (
          <Text style={[styles.lowStock, { textAlign: isAr ? "right" : "left" }]}>
            ⚠ {isAr ? `${product.stock} فقط` : `Only ${product.stock} left`}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  imageContainer: {
    width: "100%",
    height: CARD_WIDTH * 0.78,
    position: "relative",
    backgroundColor: colors.bg.tertiary,
  },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: { fontSize: 36 },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "35%",
  },
  discountBadge: {
    position: "absolute",
    top: 7,
    left: 7,
    backgroundColor: colors.error,
    borderRadius: radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  discountText: {
    color: "#fff",
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.arabicBold,
  },
  perfBadge: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 26,
    height: 26,
    backgroundColor: "rgba(255,107,0,0.85)",
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  perfBadgeText: { fontSize: 12 },
  oemBadge: {
    position: "absolute",
    bottom: 8,
    left: 7,
    backgroundColor: "rgba(0,255,136,0.2)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.5)",
  },
  oemText: {
    color: colors.success,
    fontSize: 9,
    fontFamily: typography.fonts.arabicBold,
    letterSpacing: 0.5,
  },
  info: {
    padding: spacing.sm,
    gap: 4,
  },
  brand: {
    fontSize: typography.sizes.xs,
    color: colors.blue.neon,
    fontFamily: typography.fonts.arabicMedium,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  name: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicMedium,
    lineHeight: 17,
  },
  ratingRow: {
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  star: { color: colors.warning, fontSize: 11 },
  ratingText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.arabic,
  },
  reviewCount: {
    color: colors.text.muted,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.arabic,
  },
  priceRow: {
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 5,
  },
  price: {
    fontSize: typography.sizes.md,
    color: colors.orange[500],
    fontFamily: typography.fonts.arabicBold,
  },
  currency: {
    fontSize: typography.sizes.xs,
    color: colors.orange[400],
    fontFamily: typography.fonts.arabic,
  },
  originalPrice: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    fontFamily: typography.fonts.arabic,
    textDecorationLine: "line-through",
  },
  cartBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  cartBtnDisabled: { opacity: 0.4 },
  cartBtnGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBtnText: {
    color: "#fff",
    fontSize: 20,
    fontFamily: typography.fonts.arabicBold,
    lineHeight: 22,
    marginTop: -1,
  },
  lowStock: {
    fontSize: typography.sizes.xs,
    color: colors.warning,
    fontFamily: typography.fonts.arabicMedium,
    marginTop: 2,
  },
});
