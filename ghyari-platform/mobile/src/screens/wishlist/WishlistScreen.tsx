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
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { colors, spacing, radius, typography } from "../../theme";
import { useStore } from "../../store";
import ProductCard from "../../components/ProductCard";
import { RootStackParamList } from "../../types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function WishlistScreen() {
  const navigation = useNavigation<Nav>();
  const { wishlist, clearWishlist } = useStore();
  const language = useStore((s) => s.language);
  const isAr = language === "ar";

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      isAr ? "مسح المفضلة" : "Clear Wishlist",
      isAr ? "هل تريد مسح كل المفضلة؟" : "Clear all wishlist items?",
      [
        { text: isAr ? "إلغاء" : "Cancel", style: "cancel" },
        { text: isAr ? "مسح" : "Clear", style: "destructive", onPress: clearWishlist },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { flexDirection: isAr ? "row-reverse" : "row" }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={styles.back}>{isAr ? "‹" : "‹"}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          ❤️ {isAr ? `المفضلة (${wishlist.length})` : `Wishlist (${wishlist.length})`}
        </Text>
        {wishlist.length > 0 ? (
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clear}>{isAr ? "مسح" : "Clear"}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {wishlist.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>💔</Text>
          <Text style={styles.emptyTitle}>
            {isAr ? "المفضلة فارغة" : "Wishlist is empty"}
          </Text>
          <Text style={styles.emptySub}>
            {isAr
              ? "اضغط ♡ على أي منتج لحفظه هنا"
              : "Tap ♡ on any product to save it here"}
          </Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => navigation.navigate("Main")}
          >
            <Text style={styles.shopBtnText}>{isAr ? "استكشف المنتجات" : "Explore Products"}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={wishlist}
          numColumns={2}
          keyExtractor={(p) => p.id}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() =>
                navigation.navigate("ProductDetail", {
                  productId: item.id,
                  productName: isAr ? item.name_ar : item.name_en,
                })
              }
            />
          )}
        />
      )}
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
    minWidth: 40,
  },
  title: {
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicBold,
    flex: 1,
    textAlign: "center",
  },
  clear: {
    color: colors.error,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.arabic,
    minWidth: 40,
    textAlign: "right",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyEmoji: { fontSize: 72 },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicBold,
  },
  emptySub: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    fontFamily: typography.fonts.arabic,
    textAlign: "center",
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
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  row: {
    justifyContent: "space-between",
  },
});
