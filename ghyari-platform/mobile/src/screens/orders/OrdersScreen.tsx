import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getOrders } from "../../api/client";
import { colors, spacing, radius, typography } from "../../theme";
import { useStore } from "../../store";
import { RootStackParamList } from "../../types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_CONFIG: Record<string, { labelAr: string; labelEn: string; color: string; emoji: string }> = {
  pending:    { labelAr: "في الانتظار", labelEn: "Pending",    color: colors.warning, emoji: "⏳" },
  confirmed:  { labelAr: "مؤكد",        labelEn: "Confirmed",  color: colors.blue[500], emoji: "✅" },
  processing: { labelAr: "يُعالج",       labelEn: "Processing", color: colors.blue.neon, emoji: "⚙️" },
  shipped:    { labelAr: "تم الشحن",    labelEn: "Shipped",    color: "#00D4FF", emoji: "🚚" },
  delivered:  { labelAr: "تم التوصيل", labelEn: "Delivered",  color: colors.success, emoji: "📦" },
  cancelled:  { labelAr: "ملغي",        labelEn: "Cancelled",  color: colors.error, emoji: "❌" },
};

export default function OrdersScreen() {
  const navigation = useNavigation<Nav>();
  const { isLoggedIn } = useStore();
  const language = useStore((s) => s.language);
  const isAr = language === "ar";

  const { data, isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
    enabled: isLoggedIn,
    staleTime: 30_000,
  });

  const orders = data?.orders ?? [];

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Text style={styles.screenTitle}>{isAr ? "طلباتي" : "My Orders"}</Text>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔐</Text>
          <Text style={styles.emptyTitle}>
            {isAr ? "سجّل دخولك لرؤية طلباتك" : "Login to see your orders"}
          </Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate("Main")}
          >
            <Text style={styles.loginBtnText}>{isAr ? "تسجيل الدخول" : "Login"}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.screenTitle}>{isAr ? "طلباتي" : "My Orders"}</Text>

      {isLoading ? (
        <ActivityIndicator color={colors.blue[500]} size="large" style={styles.loader} />
      ) : error ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>⚠️</Text>
          <Text style={styles.emptyTitle}>{isAr ? "خطأ في تحميل الطلبات" : "Failed to load orders"}</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => refetch()}>
            <Text style={styles.loginBtnText}>{isAr ? "إعادة المحاولة" : "Retry"}</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>{isAr ? "لا توجد طلبات بعد" : "No orders yet"}</Text>
          <Text style={styles.emptySub}>
            {isAr ? "ابدأ التسوق وستظهر طلباتك هنا" : "Start shopping and your orders will appear here"}
          </Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate("Main")}>
            <Text style={styles.loginBtnText}>{isAr ? "تسوق الآن" : "Shop Now"}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.blue[500]}
            />
          }
          renderItem={({ item }) => {
            const status = STATUS_CONFIG[item.status] ?? { labelAr: item.status, labelEn: item.status, color: colors.text.muted, emoji: "📋" };
            const date = new Date(item.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });

            return (
              <View style={styles.orderCard}>
                {/* Header */}
                <View style={[styles.orderHeader, { flexDirection: isAr ? "row-reverse" : "row" }]}>
                  <Text style={styles.orderId}>
                    #{item.id.slice(-8).toUpperCase()}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: `${status.color}20`, borderColor: `${status.color}50` }]}>
                    <Text style={styles.statusEmoji}>{status.emoji}</Text>
                    <Text style={[styles.statusText, { color: status.color }]}>
                      {isAr ? status.labelAr : status.labelEn}
                    </Text>
                  </View>
                </View>

                {/* Date */}
                <Text style={[styles.orderDate, { textAlign: isAr ? "right" : "left" }]}>
                  {date}
                </Text>

                {/* Total */}
                <View style={[styles.orderFooter, { flexDirection: isAr ? "row-reverse" : "row" }]}>
                  <Text style={styles.orderTotalLabel}>
                    {isAr ? "الإجمالي" : "Total"}
                  </Text>
                  <Text style={styles.orderTotal}>
                    {item.total.toLocaleString("ar-SA")} {isAr ? "ر.س" : "SAR"}
                  </Text>
                </View>

                {/* Track order */}
                <View style={styles.trackContainer}>
                  {["pending", "confirmed", "processing", "shipped", "delivered"].map((s, idx) => {
                    const statuses = ["pending", "confirmed", "processing", "shipped", "delivered"];
                    const currentIdx = statuses.indexOf(item.status);
                    const isActive = idx <= currentIdx;
                    return (
                      <View key={s} style={styles.trackStep}>
                        <View style={[styles.trackDot, isActive && { backgroundColor: colors.blue[500] }]} />
                        {idx < 4 && (
                          <View style={[styles.trackLine, isActive && idx < currentIdx && { backgroundColor: colors.blue[500] }]} />
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  screenTitle: {
    fontSize: typography.sizes.h3,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicBlack,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  loader: {
    marginTop: 60,
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
  loginBtn: {
    backgroundColor: colors.blue[500],
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  loginBtnText: {
    color: "#fff",
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.arabicBold,
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  orderCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: spacing.sm,
  },
  orderHeader: {
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderId: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicBold,
    letterSpacing: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusEmoji: { fontSize: 12 },
  statusText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.arabicMedium,
  },
  orderDate: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    fontFamily: typography.fonts.arabic,
  },
  orderFooter: {
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  orderTotalLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontFamily: typography.fonts.arabic,
  },
  orderTotal: {
    fontSize: typography.sizes.lg,
    color: colors.orange[500],
    fontFamily: typography.fonts.arabicBold,
  },
  trackContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: spacing.xs,
  },
  trackStep: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  trackDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border.default,
  },
  trackLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border.default,
  },
});
