import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { fetchCarBrands, fetchCarModels } from "../api/client";
import { colors, spacing, radius, typography } from "../theme";
import { useStore } from "../store";
import { CarBrand, CarModel } from "../types";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function CarFilterModal({ visible, onClose }: Props) {
  const { selectedCarBrand, selectedCarModel, selectedCarBrandName, selectedCarModelName, setCarFilter } = useStore();
  const language = useStore((s) => s.language);
  const isAr = language === "ar";

  const [step, setStep] = useState<"brand" | "model">("brand");
  const [tempBrand, setTempBrand] = useState<CarBrand | null>(null);

  const { data: brands, isLoading: brandsLoading } = useQuery({
    queryKey: ["carBrands"],
    queryFn: fetchCarBrands,
    staleTime: Infinity,
    enabled: visible,
  });

  const { data: models, isLoading: modelsLoading } = useQuery({
    queryKey: ["carModels", tempBrand?.id],
    queryFn: () => fetchCarModels(tempBrand!.id),
    staleTime: 30 * 60_000,
    enabled: !!tempBrand,
  });

  const handleBrandSelect = (brand: CarBrand) => {
    setTempBrand(brand);
    setStep("model");
  };

  const handleModelSelect = (model: CarModel) => {
    setCarFilter(
      tempBrand!.id,
      isAr ? tempBrand!.name_ar : tempBrand!.name_en,
      model.id,
      isAr ? model.name_ar : model.name_en
    );
    onClose();
    setStep("brand");
    setTempBrand(null);
  };

  const handleClear = () => {
    setCarFilter(null, null, null, null);
    setStep("brand");
    setTempBrand(null);
    onClose();
  };

  const handleClose = () => {
    setStep("brand");
    setTempBrand(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { flexDirection: isAr ? "row-reverse" : "row" }]}>
          <TouchableOpacity onPress={step === "model" ? () => setStep("brand") : handleClose}>
            <Text style={styles.backBtn}>{step === "model" ? (isAr ? "← ماركات" : "← Brands") : (isAr ? "إغلاق" : "Close")}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {step === "brand"
              ? (isAr ? "اختر ماركة سيارتك" : "Select Car Brand")
              : (isAr ? `موديلات ${tempBrand?.name_ar}` : `${tempBrand?.name_en} Models`)}
          </Text>
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearBtn}>{isAr ? "مسح" : "Clear"}</Text>
          </TouchableOpacity>
        </View>

        {/* Current selection */}
        {(selectedCarBrand || selectedCarModel) && (
          <View style={styles.currentSelection}>
            <Text style={styles.currentSelectionText}>
              {isAr ? "الاختيار الحالي: " : "Current: "}
              {selectedCarBrandName}
              {selectedCarModelName ? ` · ${selectedCarModelName}` : ""}
            </Text>
          </View>
        )}

        {/* Brand list */}
        {step === "brand" && (
          brandsLoading ? (
            <ActivityIndicator color={colors.blue[500]} style={styles.loader} />
          ) : (
            <FlatList
              data={brands}
              keyExtractor={(b) => b.id}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.item,
                    selectedCarBrand === item.id && styles.itemSelected,
                    { flexDirection: isAr ? "row-reverse" : "row" },
                  ]}
                  onPress={() => handleBrandSelect(item)}
                >
                  {item.is_popular && <Text style={styles.popularBadge}>⭐ </Text>}
                  <Text style={[styles.itemText, { textAlign: isAr ? "right" : "left" }]}>
                    {isAr ? item.name_ar : item.name_en}
                  </Text>
                  <Text style={styles.chevron}>{isAr ? "‹" : "›"}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )
        )}

        {/* Model list */}
        {step === "model" && (
          modelsLoading ? (
            <ActivityIndicator color={colors.blue[500]} style={styles.loader} />
          ) : (
            <FlatList
              data={models}
              keyExtractor={(m) => m.id}
              contentContainerStyle={styles.list}
              ListHeaderComponent={
                <TouchableOpacity
                  style={[styles.item, { flexDirection: isAr ? "row-reverse" : "row" }]}
                  onPress={() => handleModelSelect({ id: "", brand_id: tempBrand!.id, name_ar: "كل الموديلات", name_en: "All Models", year_from: 0, body_type: "", is_popular: false })}
                >
                  <Text style={[styles.itemText, styles.allModels, { textAlign: isAr ? "right" : "left" }]}>
                    {isAr ? "كل الموديلات" : "All Models"}
                  </Text>
                </TouchableOpacity>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.item,
                    selectedCarModel === item.id && styles.itemSelected,
                    { flexDirection: isAr ? "row-reverse" : "row" },
                  ]}
                  onPress={() => handleModelSelect(item)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemText, { textAlign: isAr ? "right" : "left" }]}>
                      {isAr ? item.name_ar : item.name_en}
                    </Text>
                    <Text style={[styles.yearText, { textAlign: isAr ? "right" : "left" }]}>
                      {item.year_from}{item.year_to ? ` - ${item.year_to}` : "+"}
                    </Text>
                  </View>
                  {selectedCarModel === item.id && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  title: {
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicBold,
    flex: 1,
    textAlign: "center",
  },
  backBtn: {
    color: colors.blue.neon,
    fontFamily: typography.fonts.arabic,
    fontSize: typography.sizes.md,
    minWidth: 60,
  },
  clearBtn: {
    color: colors.error,
    fontFamily: typography.fonts.arabic,
    fontSize: typography.sizes.md,
    minWidth: 40,
    textAlign: "right",
  },
  currentSelection: {
    backgroundColor: colors.bg.secondary,
    padding: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.active,
  },
  currentSelectionText: {
    color: colors.blue.neon,
    fontFamily: typography.fonts.arabic,
    fontSize: typography.sizes.sm,
    textAlign: "center",
  },
  loader: {
    marginTop: 40,
  },
  list: {
    padding: spacing.md,
  },
  item: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    borderRadius: radius.md,
  },
  itemSelected: {
    backgroundColor: "rgba(0, 102, 255, 0.12)",
  },
  itemText: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicMedium,
  },
  allModels: {
    color: colors.blue.neon,
    fontFamily: typography.fonts.arabicBold,
  },
  yearText: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    fontFamily: typography.fonts.arabic,
    marginTop: 2,
  },
  chevron: {
    color: colors.text.muted,
    fontSize: 18,
  },
  check: {
    color: colors.blue[500],
    fontSize: 18,
    fontFamily: typography.fonts.arabicBold,
  },
  popularBadge: {
    fontSize: 12,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.default,
    marginHorizontal: spacing.sm,
  },
});
