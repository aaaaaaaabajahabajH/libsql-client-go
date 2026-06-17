import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
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
  const hasDiscount = product.sale_price && product.sale_price < product.price;
  const displayPrice = hasDiscount ? product.sale_price! : product.price;
  const imageUrl = product.images?.[0];

  const handleAddToCart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addToCart(product);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
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
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>🔧</Text>
          </View>
        )}
        {hasDiscount && (
          <View style={styles.saleBadge}>
            <Text style={styles.saleBadgeText}>
              {Math.round(((product.price - displayPrice) / product.price) * 100)}%
            </Text>
          </View>
        )}
        {product.is_performance && (
          <View style={styles.perfBadge}>
            <Text style={styles.perfBadgeText}>⚡</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.brand, { textAlign: isAr ? "right" : "left" }]} numberOfLines={1}>
          {product.brand}
        </Text>
        <Text style={[styles.name, { textAlign: isAr ? "right" : "left" }]} numberOfLines={2}>
          {name}
        </Text>

        {/* Rating */}
        {product.rating > 0 && (
          <View style={[styles.ratingRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
            <Text style={styles.star}>★</Text>
            <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({product.review_count})</Text>
          </View>
        )}

        {/* Price + Cart */}
        <View style={[styles.priceRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
          <View>
            <Text style={styles.price}>
              {displayPrice.toLocaleString("ar-SA")} {isAr ? "ر.س" : "SAR"}
            </Text>
            {hasDiscount && (
              <Text style={styles.originalPrice}>
                {product.price.toLocaleString("ar-SA")}
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.cartBtn} onPress={handleAddToCart}>
            <Text style={styles.cartBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Stock warning */}
        {product.stock <= (product.low_stock_alert ?? 5) && product.stock > 0 && (
          <Text style={styles.lowStock}>
            {isAr ? `${product.stock} قطع متبقية` : `${product.stock} left`}
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
    height: CARD_WIDTH * 0.75,
    backgroundColor: colors.bg.tertiary,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: {
    fontSize: 36,
  },
  saleBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: colors.error,
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  saleBadgeText: {
    color: "#fff",
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.arabicBold,
  },
  perfBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: colors.orange[500],
    borderRadius: radius.full,
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  perfBadgeText: {
    fontSize: 12,
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
    letterSpacing: 0.5,
  },
  name: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicMedium,
    lineHeight: 18,
  },
  ratingRow: {
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  star: {
    color: colors.warning,
    fontSize: typography.sizes.xs,
  },
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
    marginTop: 4,
  },
  price: {
    fontSize: typography.sizes.md,
    color: colors.orange[500],
    fontFamily: typography.fonts.arabicBold,
  },
  originalPrice: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    fontFamily: typography.fonts.arabic,
    textDecorationLine: "line-through",
  },
  cartBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.blue[500],
    alignItems: "center",
    justifyContent: "center",
  },
  cartBtnText: {
    color: "#fff",
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fonts.arabicBold,
  },
  lowStock: {
    fontSize: typography.sizes.xs,
    color: colors.warning,
    fontFamily: typography.fonts.arabic,
    marginTop: 2,
  },
});
