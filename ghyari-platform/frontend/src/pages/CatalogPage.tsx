import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, X, Zap, Package } from "lucide-react";
import toast from "react-hot-toast";
import CarCompatibilityFilter from "../components/CarCompatibilityFilter";
import ProductCard from "../components/ProductCard";
import {
  fetchProducts,
  searchProducts,
  fetchCategories,
  submitDemandRequest,
  type Product,
} from "../api/client";
import { colors } from "../theme/colors";

const SORT_OPTIONS = [
  { value: "popular", label: "الأكثر مبيعاً" },
  { value: "newest", label: "الأحدث" },
  { value: "price_asc", label: "السعر: الأقل أولاً" },
  { value: "price_desc", label: "السعر: الأعلى أولاً" },
  { value: "rating", label: "الأعلى تقييماً" },
];

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
  const [carFilter, setCarFilter] = useState<{ car_brand?: string; car_model?: string; year?: string }>({
    car_brand: searchParams.get("car_brand") ?? undefined,
    car_model: searchParams.get("car_model") ?? undefined,
  });
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") ?? "");
  const [isTuning, setIsTuning] = useState(searchParams.get("is_tuning") === "true");
  const [sortBy, setSortBy] = useState(searchParams.get("sort_by") ?? "popular");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Sync URL params
  useEffect(() => {
    const params: Record<string, string> = {};
    if (searchQuery) params.q = searchQuery;
    if (carFilter.car_brand) params.car_brand = carFilter.car_brand;
    if (carFilter.car_model) params.car_model = carFilter.car_model;
    if (selectedCategory) params.category = selectedCategory;
    if (isTuning) params.is_tuning = "true";
    if (sortBy !== "popular") params.sort_by = sortBy;
    setSearchParams(params, { replace: true });
  }, [searchQuery, carFilter, selectedCategory, isTuning, sortBy]);

  // Categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: Infinity,
  });

  // Products query
  const queryParams: Record<string, string | number | boolean> = {
    page,
    limit: 24,
    sort_by: sortBy,
  };
  if (carFilter.car_brand) queryParams.car_brand = carFilter.car_brand;
  if (carFilter.car_model) queryParams.car_model = carFilter.car_model;
  if (selectedCategory) queryParams.category = selectedCategory;
  if (isTuning) queryParams.is_tuning = true;

  const isSearchMode = searchQuery.length >= 2;

  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products", queryParams],
    queryFn: () => fetchProducts(queryParams),
    enabled: !isSearchMode,
    staleTime: 2 * 60 * 1000,
  });

  const { data: searchData, isLoading: isLoadingSearch } = useQuery({
    queryKey: ["search", searchQuery, carFilter.car_brand],
    queryFn: () =>
      searchProducts(searchQuery, carFilter.car_brand ? { car_brand: carFilter.car_brand } : {}),
    enabled: isSearchMode,
    staleTime: 60 * 1000,
    onSuccess: (data) => {
      // Zero results → log to AI Radar
      if (data.count === 0 && searchQuery) {
        submitDemandRequest({
          query_raw: searchQuery,
          car_model_raw: carFilter.car_model,
          signal_type: "search_not_found",
        });
      }
    },
  });

  const products: Product[] = isSearchMode
    ? (searchData?.data ?? [])
    : (productsData?.data ?? []);
  const total = isSearchMode ? (searchData?.count ?? 0) : (productsData?.pagination.total ?? 0);
  const totalPages = productsData?.pagination.total_pages ?? 1;
  const isLoading = isLoadingProducts || isLoadingSearch;

  // Root categories (no parent) and subcategories of selected root
  const rootCategories = categories.filter((c) => !c.parent_id);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
    setPage(1);
  }

  function handleCarFilterChange(filter: { car_brand?: string; car_model?: string; year?: string }) {
    setCarFilter(filter);
    setPage(1);
  }

  function handleCategorySelect(catId: string) {
    setSelectedCategory((prev) => (prev === catId ? "" : catId));
    setPage(1);
  }

  function handleAddToCart(product: Product) {
    toast.success(`تمت الإضافة: ${product.name_ar}`, {
      icon: "🛒",
      duration: 2500,
    });
  }

  function clearSearch() {
    setSearchInput("");
    setSearchQuery("");
    setPage(1);
  }

  const activeFilterCount = [
    carFilter.car_brand, selectedCategory, isTuning ? "tuning" : null,
  ].filter(Boolean).length;

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: colors.background.primary, paddingTop: "80px" }}>
      {/* Page header */}
      <div style={{
        background: `linear-gradient(180deg, ${colors.background.secondary} 0%, ${colors.background.primary} 100%)`,
        borderBottom: `1px solid ${colors.carbon[700]}`,
        padding: "32px 5%",
      }}>
        <h1 style={{
          fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
          fontWeight: 900,
          color: colors.text.primary,
          marginBottom: "6px",
        }}>
          🛒 كتالوج القطع
        </h1>
        <p style={{ color: colors.text.secondary, fontSize: "0.95rem" }}>
          {carFilter.car_brand
            ? `قطع متوافقة مع ${carFilter.car_model ?? carFilter.car_brand}`
            : "تواير · بريكات · بطاريات · أداء · تزويد نيسان"}
        </p>
      </div>

      <div style={{ display: "flex", gap: "0", minHeight: "calc(100vh - 200px)" }}>

        {/* ── Sidebar filters ── */}
        <motion.aside
          initial={false}
          animate={{ width: showFilters ? "300px" : "0px", opacity: showFilters ? 1 : 0 }}
          style={{
            overflow: "hidden",
            flexShrink: 0,
            borderLeft: `1px solid ${colors.carbon[700]}`,
            background: colors.background.secondary,
          }}
        >
          <div style={{ width: "300px", padding: "24px 20px" }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: "20px",
            }}>
              <span style={{ color: colors.text.primary, fontWeight: 700, fontSize: "1rem" }}>
                الفلاتر
              </span>
              <button
                onClick={() => setShowFilters(false)}
                style={{ background: "transparent", border: "none", color: colors.text.muted, cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Car compatibility */}
            <div style={{ marginBottom: "20px" }}>
              <CarCompatibilityFilter
                onFilterChange={handleCarFilterChange}
                initialCarBrand={carFilter.car_brand}
                initialCarModel={carFilter.car_model}
              />
            </div>

            {/* Tuning toggle */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: isTuning ? "rgba(255,107,0,0.1)" : colors.background.tertiary,
                border: `1px solid ${isTuning ? colors.orange[500] : colors.carbon[600]}`,
                borderRadius: "12px", padding: "14px 16px", cursor: "pointer",
                transition: "all 0.3s ease",
              }}>
                <span style={{ display: "flex", alignItems: "center", gap: "8px", color: colors.text.primary, fontSize: "0.9rem" }}>
                  <Zap size={16} color={colors.orange[500]} />
                  تزويد وفتك فقط
                </span>
                <div
                  onClick={() => { setIsTuning((v) => !v); setPage(1); }}
                  style={{
                    width: "42px", height: "24px",
                    background: isTuning ? colors.orange[500] : colors.carbon[500],
                    borderRadius: "12px", position: "relative", cursor: "pointer",
                    transition: "background 0.3s ease",
                  }}
                >
                  <motion.div
                    animate={{ x: isTuning ? 18 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    style={{
                      position: "absolute", top: "2px",
                      width: "20px", height: "20px",
                      background: "#fff", borderRadius: "50%",
                    }}
                  />
                </div>
              </label>
            </div>

            {/* Categories */}
            <div>
              <div style={{ color: colors.text.muted, fontSize: "0.78rem", marginBottom: "10px" }}>
                التصنيفات
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {rootCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    style={{
                      background: selectedCategory === cat.id ? "rgba(0,102,255,0.1)" : "transparent",
                      border: `1px solid ${selectedCategory === cat.id ? colors.blue[500] : "transparent"}`,
                      color: selectedCategory === cat.id ? colors.blue[400] : colors.text.secondary,
                      borderRadius: "10px",
                      padding: "9px 14px",
                      textAlign: "right",
                      cursor: "pointer",
                      fontSize: "0.88rem",
                      fontFamily: "'Tajawal', sans-serif",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {cat.name_ar}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.aside>

        {/* ── Main content ── */}
        <main style={{ flex: 1, padding: "24px 5%", overflow: "hidden" }}>

          {/* Search + toolbar */}
          <div style={{
            display: "flex", gap: "12px", marginBottom: "24px",
            flexWrap: "wrap", alignItems: "center",
          }}>
            {/* Search bar */}
            <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: "240px", position: "relative" }}>
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="ابحث: فلتر هواء، بريكات، تزويد باترول..."
                style={{
                  width: "100%",
                  background: colors.background.secondary,
                  border: `1px solid ${searchInput ? colors.blue[500] : colors.carbon[600]}`,
                  borderRadius: "14px",
                  padding: "12px 46px 12px 16px",
                  color: colors.text.primary,
                  fontSize: "0.9rem",
                  fontFamily: "'Tajawal', sans-serif",
                  outline: "none",
                  transition: "border-color 0.3s ease",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="submit"
                style={{
                  position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
                  background: "transparent", border: "none", cursor: "pointer",
                  color: colors.text.muted, display: "flex",
                }}
              >
                <Search size={18} />
              </button>
              {searchInput && (
                <button
                  type="button"
                  onClick={clearSearch}
                  style={{
                    position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                    background: "transparent", border: "none", cursor: "pointer",
                    color: colors.text.muted, display: "flex",
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </form>

            {/* Filter toggle */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters((v) => !v)}
              style={{
                background: activeFilterCount > 0 ? "rgba(0,102,255,0.15)" : colors.background.secondary,
                border: `1px solid ${activeFilterCount > 0 ? colors.blue[500] : colors.carbon[600]}`,
                color: activeFilterCount > 0 ? colors.blue[400] : colors.text.secondary,
                borderRadius: "14px", padding: "12px 16px",
                cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
                fontFamily: "'Tajawal', sans-serif", fontSize: "0.9rem",
                transition: "all 0.3s ease",
              }}
            >
              <SlidersHorizontal size={16} />
              فلترة
              {activeFilterCount > 0 && (
                <span style={{
                  background: colors.blue[500], color: "#fff",
                  borderRadius: "50%", width: "18px", height: "18px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.7rem", fontWeight: 700,
                }}>
                  {activeFilterCount}
                </span>
              )}
            </motion.button>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              style={{
                background: colors.background.secondary,
                border: `1px solid ${colors.carbon[600]}`,
                color: colors.text.primary,
                borderRadius: "14px", padding: "12px 14px",
                fontFamily: "'Tajawal', sans-serif", fontSize: "0.88rem",
                cursor: "pointer", direction: "rtl",
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Active filter chips */}
          <AnimatePresence>
            {(carFilter.car_brand || selectedCategory || isTuning || searchQuery) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}
              >
                {carFilter.car_brand && (
                  <Chip label={`🚗 ${carFilter.car_model ?? carFilter.car_brand}`}
                    onRemove={() => handleCarFilterChange({})} />
                )}
                {selectedCategory && (
                  <Chip label={categories.find((c) => c.id === selectedCategory)?.name_ar ?? selectedCategory}
                    onRemove={() => setSelectedCategory("")} />
                )}
                {isTuning && (
                  <Chip label="⚡ تزويد وفتك" onRemove={() => setIsTuning(false)} />
                )}
                {searchQuery && (
                  <Chip label={`🔍 "${searchQuery}"`} onRemove={clearSearch} />
                )}
                <button
                  onClick={() => {
                    handleCarFilterChange({});
                    setSelectedCategory("");
                    setIsTuning(false);
                    clearSearch();
                  }}
                  style={{
                    background: "transparent", border: "none",
                    color: colors.text.muted, fontSize: "0.8rem",
                    cursor: "pointer", fontFamily: "'Tajawal', sans-serif",
                  }}
                >
                  مسح الكل
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results count */}
          <div style={{
            color: colors.text.muted, fontSize: "0.82rem", marginBottom: "20px",
            display: "flex", alignItems: "center", gap: "6px",
          }}>
            <Package size={14} />
            {isLoading ? "جاري التحميل..." : `${total.toLocaleString("ar-SA")} منتج`}
          </div>

          {/* Product grid */}
          {isLoading ? (
            <ProductGridSkeleton />
          ) : products.length === 0 ? (
            <EmptyState query={searchQuery} />
          ) : (
            <>
              <motion.div
                layout
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
                  gap: "20px",
                }}
              >
                <AnimatePresence mode="popLayout">
                  {products.map((product, i) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <ProductCard product={product} onAddToCart={handleAddToCart} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Pagination */}
              {!isSearchMode && totalPages > 1 && (
                <div style={{
                  display: "flex", justifyContent: "center", gap: "8px",
                  marginTop: "40px", flexWrap: "wrap",
                }}>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                    <motion.button
                      key={p}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      style={{
                        width: "40px", height: "40px",
                        background: page === p
                          ? `linear-gradient(135deg, ${colors.blue[600]}, ${colors.blue[500]})`
                          : colors.background.secondary,
                        border: `1px solid ${page === p ? colors.blue[500] : colors.carbon[600]}`,
                        color: page === p ? "#fff" : colors.text.secondary,
                        borderRadius: "10px", cursor: "pointer",
                        fontFamily: "'Tajawal', sans-serif", fontSize: "0.9rem",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {p}
                    </motion.button>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        background: "rgba(0,102,255,0.12)",
        border: `1px solid ${colors.blue[700]}`,
        color: colors.blue[300],
        borderRadius: "100px", padding: "4px 12px",
        fontSize: "0.78rem", fontFamily: "'Tajawal', sans-serif",
      }}
    >
      {label}
      <X size={12} style={{ cursor: "pointer" }} onClick={onRemove} />
    </motion.span>
  );
}

function ProductGridSkeleton() {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
      gap: "20px",
    }}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{
          background: colors.background.secondary,
          border: `1px solid ${colors.carbon[700]}`,
          borderRadius: "18px", overflow: "hidden",
          animation: "pulse 1.5s ease-in-out infinite",
        }}>
          <div style={{ height: "180px", background: colors.background.tertiary }} />
          <div style={{ padding: "16px" }}>
            <div style={{ height: "10px", background: colors.carbon[600], borderRadius: "4px", width: "40%", marginBottom: "8px" }} />
            <div style={{ height: "14px", background: colors.carbon[600], borderRadius: "4px", marginBottom: "6px" }} />
            <div style={{ height: "14px", background: colors.carbon[700], borderRadius: "4px", width: "70%", marginBottom: "16px" }} />
            <div style={{ height: "20px", background: colors.carbon[600], borderRadius: "4px", width: "50%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ textAlign: "center", padding: "80px 20px" }}
    >
      <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🔍</div>
      <h3 style={{ color: colors.text.primary, fontSize: "1.3rem", fontWeight: 700, marginBottom: "8px" }}>
        {query ? `لم نجد نتائج لـ "${query}"` : "لا توجد منتجات"}
      </h3>
      <p style={{ color: colors.text.muted, fontSize: "0.9rem", maxWidth: "400px", margin: "0 auto" }}>
        {query
          ? "طلبك سُجِّل وسنضيف هذه القطعة قريباً. يمكنك تجربة كلمات بحث مختلفة."
          : "جرب تغيير الفلاتر أو تصفح تصنيفات أخرى."}
      </p>
    </motion.div>
  );
}
