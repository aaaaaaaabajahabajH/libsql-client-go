import React, { useEffect } from "react";
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  FadeInDown,
} from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { fetchProducts, fetchCategories } from "../../api/client";
import { colors, spacing, radius, typography } from "../../theme";
import { useStore } from "../../store";
import ProductCard from "../../components/ProductCard";
import { Category, RootStackParamList } from "../../types";

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
  default: "🔧",
};

const STATS = [
  { value: "20K+", labelAr: "قطعة", labelEn: "Parts" },
  { value: "500+", labelAr: "ماركة", labelEn: "Brands" },
  { value: "24H", labelAr: "توصيل", labelEn: "Delivery" },
  { value: "100%", labelAr: "أصلية", labelEn: "Genuine" },
];

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={statStyles.card}>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  value: {
    fontSize: typography.sizes.lg,
    color: colors.orange[500],
    fontFamily: typography.fonts.arabicBlack,
  },
  label: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    fontFamily: typography.fonts.arabic,
    marginTop: 2,
  },
});

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const language = useStore((s) => s.language);
  const isAr = language === "ar";
  const user = useStore((s) => s.user);
  const cartCount = useStore((s) => s.cartCount);

  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      false
    );
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

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
        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={[styles.header, { flexDirection: isAr ? "row-reverse" : "row" }]}>
            <View>
              <Text style={[styles.greeting, { textAlign: isAr ? "right" : "left" }]}>
                {user
                  ? isAr ? `مرحباً ${user.name.split(" ")[0]} 👋` : `Hi ${user.name.split(" ")[0]} 👋`
                  : isAr ? "أهلاً بك في غياري 👋" : "Welcome to Ghyari 👋"}
              </Text>
              <Text style={[styles.subGreeting, { textAlign: isAr ? "right" : "left" }]}>
                {isAr ? "قطع السيارات الأصلية والتزويد" : "Genuine Auto Parts & Performance"}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                style={styles.cartHeaderBtn}
                onPress={() => navigation.navigate("BarcodeScanner")}
              >
                <Text style={styles.cartIcon}>📷</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cartHeaderBtn}
                onPress={() => navigation.navigate("Wishlist")}
              >
                <Text style={styles.cartIcon}>❤</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* ── Hero Banner ── */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <LinearGradient
            colors={["#001040", "#0033AA", "#0055FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            {/* Background decoration */}
            <View style={styles.heroBgCircle1} />
            <View style={styles.heroBgCircle2} />

            <View style={styles.heroContent}>
              <View style={styles.heroLeft}>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>
                    {isAr ? "🔥 الأكثر مبيعاً" : "🔥 Best Sellers"}
                  </Text>
                </View>
                <Text style={[styles.heroTitle, { textAlign: isAr ? "right" : "left" }]}>
                  {isAr ? "قطع سيارات\nأصلية مضمونة" : "Genuine Auto\nParts Guaranteed"}
                </Text>
                <Text style={[styles.heroSub, { textAlign: isAr ? "right" : "left" }]}>
                  {isAr ? "توصيل خلال ٢٤ ساعة" : "Delivery in 24 hours"}
                </Text>
                <TouchableOpacity
                  style={styles.heroBtn}
                  onPress={() => navigation.navigate("Main")}
                >
                  <Text style={styles.heroBtnText}>
                    {isAr ? "تسوق الآن ←" : "Shop Now →"}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.heroEmoji}>🏎️</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Stats Bar ── */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <View style={styles.statsBar}>
            {STATS.map((s, i) => (
              <React.Fragment key={s.value}>
                <StatCard value={s.value} label={isAr ? s.labelAr : s.labelEn} />
                {i < STATS.length - 1 && <View style={styles.statDivider} />}
              </React.Fragment>
            ))}
          </View>
        </Animated.View>

        {/* ── Categories ── */}
        {categories && categories.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.section}>
            <View style={[styles.sectionHeader, { flexDirection: isAr ? "row-reverse" : "row" }]}>
              <Text style={styles.sectionTitle}>{isAr ? "الفئات" : "Categories"}</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Main")}>
                <Text style={styles.seeAll}>{isAr ? "الكل" : "All"}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesRow}>
              {categories.slice(0, 8).map((cat: Category) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.categoryChip}
                  onPress={() => navigation.navigate("Main")}
                  activeOpacity={0.75}
                >
                  <View style={styles.categoryIconWrapper}>
                    <Text style={styles.categoryIcon}>
                      {CATEGORY_ICONS[cat.slug] ?? CATEGORY_ICONS.default}
                    </Text>
                  </View>
                  <Text style={styles.categoryName} numberOfLines={1}>
                    {isAr ? cat.name_ar : cat.name_en}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* ── Featured Products ── */}
        <Animated.View entering={FadeInDown.delay(350).duration(500)} style={styles.section}>
          <View style={[styles.sectionHeader, { flexDirection: isAr ? "row-reverse" : "row" }]}>
            <Text style={styles.sectionTitle}>
              ⭐ {isAr ? "منتجات مميزة" : "Featured Products"}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Main")}>
              <Text style={styles.seeAll}>{isAr ? "عرض الكل" : "See All"}</Text>
            </TouchableOpacity>
          </View>
          {featuredLoading ? (
            <ActivityIndicator color={colors.blue[500]} style={styles.loader} size="large" />
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
                    onPress={() => navigation.navigate("ProductDetail", {
                      productId: item.id,
                      productName: isAr ? item.name_ar : item.name_en,
                    })}
                  />
                </View>
              )}
            />
          ) : (
            <Text style={styles.emptyText}>
              {isAr ? "لا توجد منتجات مميزة حالياً" : "No featured products yet"}
            </Text>
          )}
        </Animated.View>

        {/* ── Performance Parts ── */}
        {performance.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.section}>
            <LinearGradient
              colors={["rgba(255,107,0,0.10)", "rgba(255,107,0,0.03)", "transparent"]}
              style={styles.perfSection}
            >
              <View style={[styles.sectionHeader, { flexDirection: isAr ? "row-reverse" : "row" }]}>
                <View style={[styles.perfTitleRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
                  <View style={styles.perfBadgeDot} />
                  <Text style={[styles.sectionTitle, { color: colors.orange[500], marginBottom: 0 }]}>
                    {isAr ? "قطع الأداء" : "Performance Parts"}
                  </Text>
                </View>
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
                      onPress={() => navigation.navigate("ProductDetail", {
                        productId: item.id,
                        productName: isAr ? item.name_ar : item.name_en,
                      })}
                    />
                  </View>
                )}
              />
            </LinearGradient>
          </Animated.View>
        )}

        {/* ── Distributors CTA ── */}
        <Animated.View entering={FadeInDown.delay(430).duration(500)}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.radarBannerWrapper}
            onPress={() => navigation.navigate("Distributors")}
          >
            <LinearGradient
              colors={["#001233", "#003A99"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.radarBanner}
            >
              <Text style={styles.radarEmoji}>🚚</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.radarTitle, { textAlign: isAr ? "right" : "left" }]}>
                  {isAr ? "الموزعون المعتمدون" : "Authorized Distributors"}
                </Text>
                <Text style={[styles.radarSub, { textAlign: isAr ? "right" : "left" }]}>
                  {isAr
                    ? "شبكة من الموزعين في السعودية والإمارات · اتصل مباشرة"
                    : "Network across KSA & UAE · Call directly"}
                </Text>
              </View>
              <Text style={styles.radarArrow}>{isAr ? "‹" : "›"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ── AI Radar Banner ── */}
        <Animated.View entering={FadeInDown.delay(450).duration(500)}>
          <TouchableOpacity activeOpacity={0.9} style={styles.radarBannerWrapper}>
            <LinearGradient
              colors={["#000C2A", "#001060", "#000C2A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.radarBanner}
            >
              <Animated.Text style={[styles.radarEmoji, pulseStyle]}>🤖</Animated.Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.radarTitle, { textAlign: isAr ? "right" : "left" }]}>
                  {isAr ? "رادار الذكاء الاصطناعي" : "AI Radar"}
                </Text>
                <Text style={[styles.radarSub, { textAlign: isAr ? "right" : "left" }]}>
                  {isAr
                    ? "مو لاقي قطعتك؟ اطلبها — يضيفها الذكاء الاصطناعي خلال أسبوع"
                    : "Can't find your part? Request it — our AI adds it within a week"}
                </Text>
              </View>
              <Text style={styles.radarArrow}>{isAr ? "‹" : "›"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Top Brands ── */}
        <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.section}>
          <Text style={[styles.sectionTitle, { paddingHorizontal: spacing.md }]}>
            {isAr ? "أشهر الماركات" : "Top Brands"}
          </Text>
          <View style={styles.brandsGrid}>
            {["Brembo", "K&N", "HKS", "ARB", "Bosch", "Motul", "Bilstein", "Defi"].map((brand) => (
              <TouchableOpacity key={brand} style={styles.brandChip}
                onPress={() => navigation.navigate("Main")} activeOpacity={0.7}>
                <Text style={styles.brandName}>{brand}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <View style={{ height: spacing.xxl * 2 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  scroll: { paddingBottom: spacing.lg },
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
    width: 44, height: 44,
    alignItems: "center", justifyContent: "center",
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  cartIcon: { fontSize: 20 },
  cartBadge: {
    position: "absolute", top: -2, right: -2,
    backgroundColor: colors.orange[500],
    borderRadius: radius.full,
    minWidth: 18, height: 18,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: "#fff", fontSize: 10,
    fontFamily: typography.fonts.arabicBold,
  },
  // Hero
  hero: {
    marginHorizontal: spacing.md, marginTop: spacing.sm,
    borderRadius: radius.xl, padding: spacing.lg,
    overflow: "hidden",
  },
  heroBgCircle1: {
    position: "absolute", width: 200, height: 200,
    borderRadius: 100, backgroundColor: "rgba(0,100,255,0.15)",
    right: -60, top: -60,
  },
  heroBgCircle2: {
    position: "absolute", width: 150, height: 150,
    borderRadius: 75, backgroundColor: "rgba(255,107,0,0.1)",
    right: 20, bottom: -50,
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroLeft: { flex: 1, gap: spacing.sm },
  heroBadge: {
    backgroundColor: "rgba(255,107,0,0.2)",
    borderRadius: radius.full,
    paddingHorizontal: 12, paddingVertical: 4,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255,107,0,0.4)",
  },
  heroBadgeText: {
    color: colors.orange[500],
    fontFamily: typography.fonts.arabicMedium,
    fontSize: typography.sizes.xs,
  },
  heroTitle: {
    fontSize: typography.sizes.xl,
    color: "#fff",
    fontFamily: typography.fonts.arabicBlack,
    lineHeight: 30,
  },
  heroSub: {
    fontSize: typography.sizes.sm,
    color: "rgba(255,255,255,0.7)",
    fontFamily: typography.fonts.arabic,
  },
  heroBtn: {
    backgroundColor: colors.orange[500],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    alignSelf: "flex-start",
  },
  heroBtnText: {
    color: "#fff",
    fontFamily: typography.fonts.arabicBold,
    fontSize: typography.sizes.sm,
  },
  heroEmoji: { fontSize: 56 },
  // Stats
  statsBar: {
    flexDirection: "row",
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.xl,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border.default,
    marginVertical: spacing.xs,
  },
  // Sections
  section: { marginTop: spacing.lg },
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
    marginBottom: spacing.xs,
  },
  seeAll: {
    color: colors.blue.neon,
    fontFamily: typography.fonts.arabic,
    fontSize: typography.sizes.sm,
  },
  categoriesRow: { paddingHorizontal: spacing.md, gap: spacing.sm },
  categoryChip: {
    alignItems: "center",
    width: 76,
    gap: spacing.xs,
  },
  categoryIconWrapper: {
    width: 56, height: 56,
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  categoryIcon: { fontSize: 26 },
  categoryName: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontFamily: typography.fonts.arabic,
    textAlign: "center",
  },
  horizontalList: { paddingRight: spacing.md },
  loader: { marginTop: spacing.lg },
  emptyText: {
    color: colors.text.muted,
    fontFamily: typography.fonts.arabic,
    textAlign: "center",
    marginTop: spacing.md,
  },
  perfSection: {
    marginHorizontal: spacing.md,
    borderRadius: radius.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255,107,0,0.18)",
  },
  perfTitleRow: {
    alignItems: "center",
    gap: spacing.xs,
  },
  perfBadgeDot: {
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: colors.orange[500],
  },
  // AI Radar
  radarBannerWrapper: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  radarBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(0,102,255,0.25)",
  },
  radarEmoji: { fontSize: 36 },
  radarTitle: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicBold,
    marginBottom: 3,
  },
  radarSub: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontFamily: typography.fonts.arabic,
    lineHeight: 19,
  },
  radarArrow: {
    color: colors.blue.neon,
    fontSize: 22,
  },
  // Brands
  brandsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.xs,
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
