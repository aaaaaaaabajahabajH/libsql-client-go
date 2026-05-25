import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { fetchCarBrands, fetchCarModels, type CarBrand, type CarModel } from "../api/client";
import { colors } from "../theme/colors";

interface Props {
  onFilterChange: (filter: { car_brand?: string; car_model?: string; year?: string }) => void;
  initialCarBrand?: string;
  initialCarModel?: string;
}

const CAR_BRAND_ICONS: Record<string, string> = {
  nissan: "🔵",
  toyota: "🔴",
  lexus: "⭐",
  hyundai: "🔷",
  kia: "🟢",
  gmc: "🦅",
  ford: "🔵",
  infiniti: "♾️",
};

export default function CarCompatibilityFilter({ onFilterChange, initialCarBrand, initialCarModel }: Props) {
  const [selectedBrand, setSelectedBrand] = useState<string>(initialCarBrand ?? "");
  const [selectedModel, setSelectedModel] = useState<string>(initialCarModel ?? "");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: brands = [] } = useQuery({
    queryKey: ["car-brands"],
    queryFn: fetchCarBrands,
    staleTime: Infinity,
  });

  const { data: models = [] } = useQuery({
    queryKey: ["car-models", selectedBrand],
    queryFn: () => fetchCarModels(selectedBrand),
    enabled: !!selectedBrand,
    staleTime: Infinity,
  });

  // Generate year range for the selected model
  const selectedModelData = models.find((m) => m.id === selectedModel);
  const years: number[] = [];
  if (selectedModelData) {
    const from = selectedModelData.year_from;
    const to = selectedModelData.year_to ?? new Date().getFullYear();
    for (let y = to; y >= from; y--) years.push(y);
  }

  function handleBrandSelect(brandId: string) {
    setSelectedBrand(brandId);
    setSelectedModel("");
    setSelectedYear("");
    onFilterChange({ car_brand: brandId });
  }

  function handleModelSelect(modelId: string) {
    setSelectedModel(modelId);
    setSelectedYear("");
    const model = models.find((m) => m.id === modelId);
    onFilterChange({ car_brand: selectedBrand, car_model: model?.name_en });
  }

  function handleYearSelect(year: string) {
    setSelectedYear(year);
    const model = models.find((m) => m.id === selectedModel);
    onFilterChange({ car_brand: selectedBrand, car_model: model?.name_en, year });
  }

  function handleReset() {
    setSelectedBrand("");
    setSelectedModel("");
    setSelectedYear("");
    onFilterChange({});
  }

  const popularBrands = brands.filter((b) => b.is_popular);
  const selectedBrandData = brands.find((b) => b.id === selectedBrand);

  return (
    <div
      dir="rtl"
      style={{
        background: colors.background.secondary,
        border: `1px solid ${selectedBrand ? colors.blue[700] : colors.carbon[600]}`,
        borderRadius: "20px",
        padding: "20px",
        transition: "border-color 0.3s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: selectedBrand ? "16px" : "0",
          cursor: "pointer",
        }}
        onClick={() => !selectedBrand && setIsExpanded((v) => !v)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.3rem" }}>🚗</span>
          <div>
            <div style={{ color: colors.text.primary, fontWeight: 700, fontSize: "0.95rem" }}>
              {selectedBrandData
                ? `${CAR_BRAND_ICONS[selectedBrand] ?? "🚗"} ${selectedBrandData.name_ar}`
                : "اختر سيارتك"}
            </div>
            {selectedModel && (
              <div style={{ color: colors.blue[400], fontSize: "0.8rem" }}>
                {models.find((m) => m.id === selectedModel)?.name_ar}
                {selectedYear && ` · ${selectedYear}`}
              </div>
            )}
            {!selectedBrand && (
              <div style={{ color: colors.text.muted, fontSize: "0.8rem" }}>
                شاهد القطع المتوافقة مع سيارتك فقط
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {selectedBrand && (
            <button
              onClick={(e) => { e.stopPropagation(); handleReset(); }}
              style={{
                background: "transparent",
                border: `1px solid ${colors.carbon[500]}`,
                color: colors.text.muted,
                borderRadius: "8px",
                padding: "4px 10px",
                fontSize: "0.75rem",
                cursor: "pointer",
              }}
            >
              إعادة
            </button>
          )}
          {!selectedBrand && (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              style={{ color: colors.text.muted, fontSize: "1rem" }}
            >
              ▼
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {(isExpanded || selectedBrand) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: "hidden" }}
          >
            {/* Step 1: Brand selection */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ color: colors.text.muted, fontSize: "0.78rem", marginBottom: "8px" }}>
                ١. الماركة
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {popularBrands.map((brand) => (
                  <motion.button
                    key={brand.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleBrandSelect(brand.id)}
                    style={{
                      background:
                        selectedBrand === brand.id
                          ? `linear-gradient(135deg, ${colors.blue[600]}, ${colors.blue[500]})`
                          : colors.background.tertiary,
                      border: `1px solid ${selectedBrand === brand.id ? colors.blue[500] : colors.carbon[600]}`,
                      color: selectedBrand === brand.id ? "#fff" : colors.text.secondary,
                      borderRadius: "10px",
                      padding: "8px 14px",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontFamily: "'Tajawal', sans-serif",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span>{CAR_BRAND_ICONS[brand.id] ?? "🚗"}</span>
                    {brand.name_ar}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Step 2: Model selection */}
            <AnimatePresence>
              {selectedBrand && models.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ marginBottom: "16px" }}
                >
                  <div style={{ color: colors.text.muted, fontSize: "0.78rem", marginBottom: "8px" }}>
                    ٢. الموديل
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {models.filter((m) => m.is_popular).map((model) => (
                      <motion.button
                        key={model.id}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleModelSelect(model.id)}
                        style={{
                          background:
                            selectedModel === model.id
                              ? `linear-gradient(135deg, ${colors.orange[600]}, ${colors.orange[500]})`
                              : colors.background.tertiary,
                          border: `1px solid ${selectedModel === model.id ? colors.orange[500] : colors.carbon[600]}`,
                          color: selectedModel === model.id ? "#fff" : colors.text.secondary,
                          borderRadius: "10px",
                          padding: "8px 14px",
                          fontSize: "0.85rem",
                          cursor: "pointer",
                          fontFamily: "'Tajawal', sans-serif",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {model.name_ar}
                        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", marginRight: "4px" }}>
                          {model.year_from}+
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 3: Year selection */}
            <AnimatePresence>
              {selectedModel && years.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <div style={{ color: colors.text.muted, fontSize: "0.78rem", marginBottom: "8px" }}>
                    ٣. السنة (اختياري)
                  </div>
                  <select
                    value={selectedYear}
                    onChange={(e) => handleYearSelect(e.target.value)}
                    style={{
                      background: colors.background.tertiary,
                      border: `1px solid ${selectedYear ? colors.blue[500] : colors.carbon[600]}`,
                      color: colors.text.primary,
                      borderRadius: "10px",
                      padding: "9px 14px",
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      fontFamily: "'Tajawal', sans-serif",
                      width: "160px",
                      direction: "rtl",
                    }}
                  >
                    <option value="">كل السنوات</option>
                    {years.map((y) => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </select>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
