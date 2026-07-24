import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { fetchDistributors } from "../../api/client";
import { colors, spacing, radius, typography } from "../../theme";
import { useStore } from "../../store";
import { Distributor, RootStackParamList } from "../../types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CITY_EMOJI: Record<string, string> = {
  riyadh: "🕌",
  jeddah: "⛵",
  dammam: "🛢️",
  mecca: "🕋",
  medina: "🌙",
  taif: "🏔️",
  dubai: "🏙️",
  abu_dhabi: "🏛️",
  sharjah: "🌆",
  default: "🏪",
};

function cityKey(city: string): string {
  const lower = city.toLowerCase().trim();
  const map: Record<string, string> = {
    "الرياض": "riyadh", "riyadh": "riyadh",
    "جدة": "jeddah", "jeddah": "jeddah",
    "الدمام": "dammam", "dammam": "dammam",
    "مكة": "mecca", "mecca": "mecca",
    "المدينة": "medina", "medina": "medina",
    "الطائف": "taif", "taif": "taif",
    "دبي": "dubai", "dubai": "dubai",
    "أبوظبي": "abu_dhabi", "abu dhabi": "abu_dhabi",
    "الشارقة": "sharjah", "sharjah": "sharjah",
  };
  return map[lower] ?? "default";
}

export default function DistributorsScreen() {
  const navigation = useNavigation<Nav>();
  const language = useStore((s) => s.language);
  const isAr = language === "ar";

  const { data, isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ["distributors"],
    queryFn: fetchDistributors,
    staleTime: 30 * 60_000,
  });

  const distributors: Distributor[] = data ?? [];

  const handleCall = (phone: string | undefined) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert(
        isAr ? "خطأ" : "Error",
        isAr ? "تعذّر فتح تطبيق الاتصال" : "Could not open phone app"
      );
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { flexDirection: isAr ? "row-reverse" : "row" }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {isAr ? "الموزعون المعتمدون" : "Authorized Distributors"}
        </Text>
        <View style={{ width: 30 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.blue[500]} size="large" style={{ marginTop: 60 }} />
      ) : error ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>⚠️</Text>
          <Text style={styles.emptyTitle}>
            {isAr ? "خطأ في التحميل" : "Failed to load"}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>{isAr ? "إعادة المحاولة" : "Retry"}</Text>
          </TouchableOpacity>
        </View>
      ) : distributors.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🏪</Text>
          <Text style={styles.emptyTitle}>
            {isAr ? "لا يوجد موزعون بعد" : "No distributors yet"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={distributors}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.blue[500]} />
          }
          ListHeaderComponent={
            <View style={styles.hero}>
              <LinearGradient
                colors={["#001433", "#003D99"]}
                style={styles.heroGradient}
              >
                <Text style={styles.heroEmoji}>🚚</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.heroTitle, { textAlign: isAr ? "right" : "left" }]}>
                    {isAr ? "شبكة موزعين معتمدة" : "Certified Distributor Network"}
                  </Text>
                  <Text style={[styles.heroSub, { textAlign: isAr ? "right" : "left" }]}>
                    {isAr
                      ? `${distributors.length}+ موزع في السعودية والإمارات`
                      : `${distributors.length}+ distributors in KSA & UAE`}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* City banner */}
              <View style={styles.cardHeader}>
                <View style={styles.cityIcon}>
                  <Text style={styles.cityEmoji}>{CITY_EMOJI[cityKey(item.city)]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={[styles.nameRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
                    <Text style={styles.name} numberOfLines={1}>
                      {isAr ? item.name_ar : (item.name_en ?? item.name_ar)}
                    </Text>
                    {item.is_verified && (
                      <View style={styles.verified}>
                        <Text style={styles.verifiedText}>✓</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.city, { textAlign: isAr ? "right" : "left" }]}>
                    📍 {item.city} · {item.region}
                  </Text>
                </View>
              </View>

              {/* Rating */}
              {item.rating > 0 && (
                <View style={[styles.ratingRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Text
                      key={s}
                      style={[styles.star, { color: s <= item.rating ? colors.warning : colors.text.muted }]}
                    >
                      ★
                    </Text>
                  ))}
                  <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                </View>
              )}

              {/* Address */}
              {item.address && (
                <Text style={[styles.address, { textAlign: isAr ? "right" : "left" }]}>
                  {item.address}
                </Text>
              )}

              {/* Actions */}
              {item.phone && (
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => handleCall(item.phone)}
                >
                  <LinearGradient
                    colors={["#00A854", "#00CC66"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.callGradient}
                  >
                    <Text style={styles.callText}>
                      📞 {isAr ? "اتصل الآن" : "Call Now"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
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
    minWidth: 30,
  },
  title: {
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicBold,
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  hero: {
    marginBottom: spacing.md,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  heroGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  heroEmoji: { fontSize: 42 },
  heroTitle: {
    fontSize: typography.sizes.lg,
    color: "#fff",
    fontFamily: typography.fonts.arabicBold,
  },
  heroSub: {
    fontSize: typography.sizes.sm,
    color: "rgba(255,255,255,0.7)",
    fontFamily: typography.fonts.arabic,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  cityIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.tertiary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  cityEmoji: { fontSize: 26 },
  nameRow: {
    alignItems: "center",
    gap: 6,
  },
  name: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicBold,
  },
  verified: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedText: {
    color: "#000",
    fontSize: 12,
    fontFamily: typography.fonts.arabicBold,
    lineHeight: 14,
  },
  city: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontFamily: typography.fonts.arabic,
    marginTop: 2,
  },
  ratingRow: {
    alignItems: "center",
    gap: 3,
  },
  star: { fontSize: 14 },
  ratingText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.arabicMedium,
    marginLeft: 6,
  },
  address: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    fontFamily: typography.fonts.arabic,
    lineHeight: 20,
  },
  callBtn: {
    borderRadius: radius.full,
    overflow: "hidden",
    marginTop: spacing.xs,
  },
  callGradient: {
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  callText: {
    color: "#fff",
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.arabicBold,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
    marginTop: 60,
  },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicBold,
  },
  retryBtn: {
    backgroundColor: colors.blue[500],
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  retryText: {
    color: "#fff",
    fontFamily: typography.fonts.arabicBold,
  },
});
