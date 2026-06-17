import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { fetchProducts, fetchCategories } from "../../api/client";
import { colors, spacing, radius, typography } from "../../theme";
import { useStore } from "../../store";
import ProductCard from "../../components/ProductCard";
import { RootStackParamList } from "../../types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get("window");

const CATEGORY_ICONS: Record<string, string> = {
  brakes: "🔴",
  engine: "⚙️",
  suspension: "🔩",
  electrical: "⚡",
  tires: "🛞",
  exhaust: "💨",
  filters: "🌀",
  tuning: "🏎️",
};

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const language = useStore((s) => s.language);
  const isAr = language === "ar";
  const user = useStore((s) => s.user);
  const cartCount = useStore((s) => s.cartCount);

  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => fetchProducts({ is_featured: true, limit: 10 }),
    staleTime: 5 * 60_000,
  });

  const { data: perfData } = useQuery({
    queryKey: ["products", "performance"],
    queryFn: () => fetchProducts({ is_performance: true, limit: 6 }),
    staleTime: 5 * 60_000,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: Infinity,
  });

  const featured = featuredData?.data ?? [];
  const performance = perfData?.data ?? [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ── Header ── */}
        <View style={[styles.header, { flexDirection: isAr ? "row-reverse" : "row" }]}>
          <View>
            <Text style={[styles.greeting, { textAlign: isAr ? "right" : "left" }]}>
              {isAr
                ? `أهلاً${user ? ` ${user.name.split(" ")[0]}` : ""}! 👋`
                : `Hello${user ? ` ${user.name.split(" ")[0]}` : ""}! 👋`}
            </Text>
            <Text style={[styles.subGreeting, { textAlign: isAr ? "right" : "left" }]}>
              {isAr ? "قطع السيارات الأصلية والتزويد" : "Genuine Parts & Performance"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.cartHeaderBtn}
            onPress={() => navigation.navigate("Main")}
          >
            <Text style={styles.cartIcon}>🛒</Text>
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount > 9 ? "9+" : cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Hero Banner ── */}
        <LinearGradient
          colors={["#001433", "#003D99", "#0066FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroEmoji}>🏎️</Text>
          <Text style={styles.heroTitle}>
            {isAr ? "غياري — قطع السيارات" : "Ghyari — Auto Parts"}
          </Text>
          <Text style={styles.heroSub}>
            {isAr
              ? "أكثر من ٢٠٬٠٠٠ قطعة أصلية · توصيل ٢٤ ساعة"
              : "20,000+ Genuine Parts · 24h Delivery"}
          </Text>
          <TouchableOpacity
            style={styles.heroBtn}
            onPress={() => navigation.navigate("Main")}
          >
            <Text style={styles.heroBtnText}>
              {isAr ? "تسوق الآن ←" : "Shop Now →"}
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* ── Categories ── */}
        {categories && categories.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { textAlign: isAr ? "right" : "left" }]}>
              {isAr ? "الفئات" : "Categories"}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
              {categories.slice(0, 8).map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.categoryChip}
                  onPress={() => navigation.navigate("Main")}
                >
                  <Text style={styles.categoryIcon}>
                    {CATEGORY_ICONS[cat.slug] ?? "🔧"}
                  </Text>
                  <Text style={styles.categoryName}>
                    {isAr ? cat.name_ar : cat.name_en}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Featured Products ── */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { flexDirection: isAr ? "row-reverse" : "row" }]}>
            <Text style={styles.sectionTitle}>
              {isAr ? "منتجات مميزة" : "Featured Products"}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Main")}>
              <Text style={styles.seeAll}>{isAr ? "عرض الكل" : "See All"}</Text>
            </TouchableOpacity>
          </View>
          {featuredLoading ? (
            <ActivityIndicator color={colors.blue[500]} style={styles.loader} />
          ) : featured.length > 0 ? (
            <FlatList
              data={featured}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(p) => p.id}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <View style={{ marginLeft: spacing.md }}>
                  <ProductCard
                    product={item}
                    onPress={() =>
                      navigation.navigate("ProductDetail", {
                        productId: item.id,
                        productName: isAr ? item.name_ar : item.name_en,
                      })
                    }
                  />
                </View>
              )}
            />
          ) : (
            <Text style={styles.emptyText}>
              {isAr ? "لا توجد منتجات مميزة حالياً" : "No featured products yet"}
            </Text>
          )}
        </View>

        {/* ── Performance Section ── */}
        {performance.length > 0 && (
          <View style={styles.section}>
            <LinearGradient
              colors={["rgba(255,107,0,0.12)", "rgba(255,107,0,0.04)"]}
              style={styles.perfSection}
            >
              <View style={[styles.sectionHeader, { flexDirection: isAr ? "row-reverse" : "row" }]}>
                <Text style={[styles.sectionTitle, styles.perfTitle]}>
                  ⚡ {isAr ? "قطع الأداء" : "Performance Parts"}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate("Main")}>
                  <Text style={styles.seeAll}>{isAr ? "عرض الكل" : "See All"}</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={performance}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(p) => p.id}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item }) => (
                  <View style={{ marginLeft: spacing.md }}>
                    <ProductCard
                      product={item}
                      onPress={() =>
                        navigation.navigate("ProductDetail", {
                          productId: item.id,
                          productName: isAr ? item.name_ar : item.name_en,
                        })
                      }
                    />
                  </View>
                )}
              />
            </LinearGradient>
          </View>
        )}

        {/* ── AI Radar Banner ── */}
        <LinearGradient
          colors={["#001433", "#000820"]}
          style={styles.radarBanner}
        >
          <Text style={styles.radarEmoji}>🤖</Text>
          <Text style={[styles.radarTitle, { textAlign: isAr ? "right" : "left" }]}>
            {isAr ? "رادار الذكاء الاصطناعي" : "AI Radar"}
          </Text>
          <Text style={[styles.radarSub, { textAlign: isAr ? "right" : "left" }]}>
            {isAr
              ? "مو لاقي قطعتك؟ اطلبها وراداراتنا الذكي يضيفها خلال أسبوع"
              : "Can't find your part? Request it and our AI adds it within a week"}
          </Text>
        </LinearGradient>

        {/* ── Brands ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isAr ? "right" : "left" }]}>
            {isAr ? "أشهر الماركات" : "Top Brands"}
          </Text>
          <View style={styles.brandsGrid}>
            {["Brembo", "K&N", "HKS", "ARB", "Bosch", "Motul", "Bilstein", "Defi"].map((brand) => (
              <TouchableOpacity
                key={brand}
                style={styles.brandChip}
                onPress={() => navigation.navigate("Main")}
              >
                <Text style={styles.brandName}>{brand}</Text>
              </TouchableOpacity>
            ))}
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
  scroll: {
    paddingBottom: spacing.lg,
  },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  greeting: {
    fontSize: typography.sizes.xl,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicBold,
  },
  subGreeting: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontFamily: typography.fonts.arabic,
    marginTop: 2,
  },
  cartHeaderBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    position: "relative",
  },
  cartIcon: {
    fontSize: 20,
  },
  cartBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: colors.orange[500],
    borderRadius: radius.full,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: typography.fonts.arabicBold,
  },
  hero: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: "center",
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    fontSize: typography.sizes.xxl,
    color: "#fff",
    fontFamily: typography.fonts.arabicBlack,
    textAlign: "center",
  },
  heroSub: {
    fontSize: typography.sizes.sm,
    color: "rgba(255,255,255,0.8)",
    fontFamily: typography.fonts.arabic,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  heroBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.orange[500],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  heroBtnText: {
    color: "#fff",
    fontFamily: typography.fonts.arabicBold,
    fontSize: typography.sizes.md,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionHeader: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicBold,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  seeAll: {
    color: colors.blue.neon,
    fontFamily: typography.fonts.arabic,
    fontSize: typography.sizes.sm,
  },
  categoriesRow: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  categoryChip: {
    alignItems: "center",
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    minWidth: 72,
    gap: 4,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontFamily: typography.fonts.arabic,
    textAlign: "center",
  },
  horizontalList: {
    paddingRight: spacing.md,
  },
  loader: {
    marginTop: spacing.lg,
  },
  emptyText: {
    color: colors.text.muted,
    fontFamily: typography.fonts.arabic,
    textAlign: "center",
    marginTop: spacing.md,
  },
  perfSection: {
    marginHorizontal: spacing.md,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,107,0,0.2)",
  },
  perfTitle: {
    color: colors.orange[500],
    paddingHorizontal: 0,
    marginBottom: 0,
  },
  radarBanner: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(0,102,255,0.2)",
    gap: spacing.xs,
  },
  radarEmoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  radarTitle: {
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicBold,
  },
  radarSub: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontFamily: typography.fonts.arabic,
    lineHeight: 20,
  },
  brandsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  brandChip: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  brandName: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.arabicMedium,
    letterSpacing: 0.5,
  },
});
