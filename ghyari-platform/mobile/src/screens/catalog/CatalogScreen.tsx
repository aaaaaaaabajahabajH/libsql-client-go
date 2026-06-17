import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { fetchProducts, searchProducts, submitDemandSignal } from "../../api/client";
import { colors, spacing, radius, typography } from "../../theme";
import { useStore } from "../../store";
import ProductCard from "../../components/ProductCard";
import SearchBar from "../../components/SearchBar";
import CarFilterModal from "../../components/CarFilterModal";
import { RootStackParamList, Product } from "../../types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SORT_OPTIONS = [
  { id: "newest", labelAr: "الأحدث", labelEn: "Newest" },
  { id: "price_asc", labelAr: "الأرخص", labelEn: "Lowest Price" },
  { id: "price_desc", labelAr: "الأغلى", labelEn: "Highest Price" },
  { id: "rating", labelAr: "الأعلى تقييماً", labelEn: "Top Rated" },
];

export default function CatalogScreen() {
  const navigation = useNavigation<Nav>();
  const language = useStore((s) => s.language);
  const isAr = language === "ar";
  const { selectedCarBrand, selectedCarModel, selectedCarBrandName, selectedCarModelName } = useStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showCarFilter, setShowCarFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const isSearching = debouncedQuery.length >= 2;

  // Search query
  const { data: searchData, isFetching: searchLoading } = useQuery({
    queryKey: ["search", debouncedQuery, selectedCarBrand, selectedCarModel],
    queryFn: () =>
      searchProducts({
        q: debouncedQuery,
        car_brand: selectedCarBrand ?? undefined,
        car_model: selectedCarModel ?? undefined,
        limit: 40,
      }),
    enabled: isSearching,
    staleTime: 60_000,
  });

  // Send AI Radar signal when no results found
  useEffect(() => {
    if (searchData && searchData.count === 0 && debouncedQuery.length >= 2) {
      submitDemandSignal({
        query_raw: debouncedQuery,
        car_model_raw: selectedCarModelName ?? undefined,
        signal_type: "search_not_found",
      });
    }
  }, [searchData, debouncedQuery, selectedCarModelName]);

  // Products query (paginated)
  const {
    data: productsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: productsLoading,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ["products", "catalog", selectedCarBrand, selectedCarModel, sortBy],
    queryFn: ({ pageParam = 1 }) =>
      fetchProducts({
        page: pageParam,
        limit: 20,
        car_brand: selectedCarBrand ?? undefined,
        car_model: selectedCarModel ?? undefined,
        sort: sortBy,
      }),
    getNextPageParam: (last) => {
      if (last.pagination.page < last.pagination.total_pages) {
        return last.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !isSearching,
    staleTime: 2 * 60_000,
  });

  const allProducts: Product[] = productsData?.pages.flatMap((p) => p.data) ?? [];
  const displayProducts = isSearching ? (searchData?.data ?? []) : allProducts;
  const isLoading = isSearching ? searchLoading : productsLoading;

  const loadMore = useCallback(() => {
    if (!isSearching && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [isSearching, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* Search */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmit={() => setDebouncedQuery(searchQuery)}
      />

      {/* Car filter + Sort */}
      <View style={[styles.filterRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
        <TouchableOpacity
          style={[styles.filterChip, (selectedCarBrand) && styles.filterChipActive]}
          onPress={() => setShowCarFilter(true)}
        >
          <Text style={styles.filterChipIcon}>🚗</Text>
          <Text style={[styles.filterChipText, selectedCarBrand && styles.filterChipTextActive]}>
            {selectedCarBrandName
              ? `${selectedCarBrandName}${selectedCarModelName ? ` · ${selectedCarModelName}` : ""}`
              : isAr ? "نوع سيارتك" : "Your Car"}
          </Text>
          {selectedCarBrand && <Text style={styles.filterChipClear}>✕</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sortChip}
          onPress={() => setShowSort((s) => !s)}
        >
          <Text style={styles.filterChipIcon}>↕️</Text>
          <Text style={styles.filterChipText}>
            {SORT_OPTIONS.find((o) => o.id === sortBy)?.[isAr ? "labelAr" : "labelEn"]}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sort options dropdown */}
      {showSort && (
        <View style={styles.sortDropdown}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              style={[styles.sortOption, sortBy === opt.id && styles.sortOptionActive]}
              onPress={() => {
                setSortBy(opt.id);
                setShowSort(false);
              }}
            >
              <Text style={[styles.sortOptionText, sortBy === opt.id && styles.sortOptionTextActive]}>
                {isAr ? opt.labelAr : opt.labelEn}
              </Text>
              {sortBy === opt.id && <Text style={styles.sortCheck}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Results count */}
      {isSearching && searchData && (
        <View style={styles.resultsCount}>
          <Text style={[styles.resultsText, { textAlign: isAr ? "right" : "left" }]}>
            {searchData.count === 0
              ? isAr ? "لا توجد نتائج — طلبنا بالذكاء الاصطناعي 🤖" : "No results — sent to AI Radar 🤖"
              : isAr ? `${searchData.count} نتيجة` : `${searchData.count} results`}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={[styles.titleRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
        <Text style={styles.screenTitle}>{isAr ? "القطع" : "Parts"}</Text>
        {!isSearching && productsData && (
          <Text style={styles.totalCount}>
            {productsData.pages[0]?.pagination.total ?? 0}
            {isAr ? " قطعة" : " items"}
          </Text>
        )}
      </View>

      <FlatList
        data={displayProducts}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.blue[500]} size="large" style={styles.loader} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={[styles.emptyText, { textAlign: isAr ? "right" : "left" }]}>
                {isAr ? "لا توجد قطع متطابقة" : "No matching parts"}
              </Text>
            </View>
          )
        }
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
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator color={colors.blue[500]} style={styles.footerLoader} />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.blue[500]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <CarFilterModal visible={showCarFilter} onClose={() => setShowCarFilter(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  titleRow: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  screenTitle: {
    fontSize: typography.sizes.h2,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicBlack,
  },
  totalCount: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    fontFamily: typography.fonts.arabic,
  },
  listHeader: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  filterRow: {
    alignItems: "center",
    gap: spacing.sm,
  },
  filterChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  filterChipActive: {
    borderColor: colors.border.active,
    backgroundColor: "rgba(0,102,255,0.1)",
  },
  filterChipIcon: {
    fontSize: 14,
  },
  filterChipText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontFamily: typography.fonts.arabic,
  },
  filterChipTextActive: {
    color: colors.blue.neon,
  },
  filterChipClear: {
    color: colors.text.muted,
    fontSize: 12,
  },
  sortChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  sortDropdown: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: "hidden",
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  sortOptionActive: {
    backgroundColor: "rgba(0,102,255,0.1)",
  },
  sortOptionText: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    fontFamily: typography.fonts.arabic,
  },
  sortOptionTextActive: {
    color: colors.blue.neon,
    fontFamily: typography.fonts.arabicMedium,
  },
  sortCheck: {
    color: colors.blue[500],
    fontSize: 16,
  },
  resultsCount: {
    marginTop: spacing.xs,
  },
  resultsText: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    fontFamily: typography.fonts.arabic,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  row: {
    paddingHorizontal: spacing.md,
    justifyContent: "space-between",
  },
  loader: {
    marginTop: 60,
  },
  footerLoader: {
    marginVertical: spacing.lg,
  },
  empty: {
    alignItems: "center",
    marginTop: 60,
    gap: spacing.md,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: typography.sizes.lg,
    color: colors.text.muted,
    fontFamily: typography.fonts.arabicMedium,
  },
});
