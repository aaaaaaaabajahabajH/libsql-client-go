import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { lookupBarcode } from "../../api/client";
import { colors, spacing, radius, typography } from "../../theme";
import { useStore } from "../../store";
import { RootStackParamList } from "../../types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get("window");
const FRAME_SIZE = width * 0.72;

export default function BarcodeScannerScreen() {
  const navigation = useNavigation<Nav>();
  const language = useStore((s) => s.language);
  const isAr = language === "ar";
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [looking, setLooking] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  const scanLine = useSharedValue(0);
  useEffect(() => {
    scanLine.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);
  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLine.value * (FRAME_SIZE - 4) }],
  }));

  const handleBarcode = useCallback(
    async (data: string) => {
      if (!scanning || looking) return;
      setScanning(false);
      setLooking(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const product = await lookupBarcode(data);
      setLooking(false);
      if (product) {
        navigation.replace("ProductDetail", {
          productId: product.id,
          productName: isAr ? product.name_ar : product.name_en,
        });
      } else {
        Alert.alert(
          isAr ? "لم يتم العثور على القطعة" : "Part not found",
          isAr
            ? `الباركود ${data} غير موجود في قاعدة البيانات. جرب البحث اليدوي.`
            : `Barcode ${data} not in database. Try manual search.`,
          [
            {
              text: isAr ? "مسح مرة أخرى" : "Scan again",
              onPress: () => setScanning(true),
            },
            {
              text: isAr ? "بحث يدوي" : "Manual search",
              onPress: () => navigation.replace("Main"),
            },
          ]
        );
      }
    },
    [scanning, looking, navigation, isAr]
  );

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={colors.blue[500]} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={[styles.header, { flexDirection: isAr ? "row-reverse" : "row" }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
            <Text style={styles.close}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {isAr ? "مسح الباركود" : "Barcode Scanner"}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.permission}>
          <Text style={styles.permEmoji}>📷</Text>
          <Text style={styles.permTitle}>
            {isAr ? "نحتاج إذن الكاميرا" : "Camera permission required"}
          </Text>
          <Text style={styles.permSub}>
            {isAr
              ? "للمسح الفوري لباركود قطع الغيار"
              : "To scan auto part barcodes instantly"}
          </Text>
          <TouchableOpacity
            style={styles.permBtn}
            onPress={async () => {
              const res = await requestPermission();
              if (!res.granted) {
                Alert.alert(
                  isAr ? "الإذن مرفوض" : "Permission denied",
                  isAr
                    ? "فعّل الإذن من إعدادات النظام"
                    : "Enable it in system settings",
                  [
                    { text: isAr ? "إلغاء" : "Cancel", style: "cancel" },
                    {
                      text: isAr ? "افتح الإعدادات" : "Open Settings",
                      onPress: () => Linking.openSettings(),
                    },
                  ]
                );
              }
            }}
          >
            <Text style={styles.permBtnText}>
              {isAr ? "السماح باستخدام الكاميرا" : "Grant Camera Access"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={flashOn}
        barcodeScannerSettings={{
          barcodeTypes: [
            "ean13",
            "ean8",
            "upc_a",
            "upc_e",
            "code128",
            "code39",
            "qr",
          ],
        }}
        onBarcodeScanned={scanning ? (r) => handleBarcode(r.data) : undefined}
      />

      {/* Dark overlay with cutout */}
      <View style={styles.overlay}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={styles.frame}>
            {/* Corners */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            {/* Scan line */}
            {scanning && (
              <Animated.View style={[styles.scanLine, scanStyle]}>
                <LinearGradient
                  colors={["transparent", "#00AAFF", "transparent"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.scanGradient}
                />
              </Animated.View>
            )}
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>

      {/* Header */}
      <SafeAreaView edges={["top"]} style={styles.headerWrapper}>
        <View style={[styles.header, { flexDirection: isAr ? "row-reverse" : "row" }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={10}>
            <Text style={styles.close}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {isAr ? "مسح الباركود" : "Scan Barcode"}
          </Text>
          <TouchableOpacity
            onPress={() => setFlashOn((f) => !f)}
            style={styles.iconBtn}
            hitSlop={10}
          >
            <Text style={styles.close}>{flashOn ? "💡" : "🔦"}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Bottom hint */}
      <SafeAreaView edges={["bottom"]} style={styles.hintWrapper}>
        <View style={styles.hintCard}>
          {looking ? (
            <>
              <ActivityIndicator color={colors.blue[500]} />
              <Text style={styles.hintText}>
                {isAr ? "جاري البحث عن القطعة..." : "Looking up the part..."}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.hintEmoji}>🎯</Text>
              <Text style={styles.hintText}>
                {isAr
                  ? "وجّه الكاميرا نحو باركود القطعة"
                  : "Point the camera at the part barcode"}
              </Text>
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  headerWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  close: {
    color: "#fff",
    fontSize: 18,
  },
  title: {
    fontSize: typography.sizes.lg,
    color: "#fff",
    fontFamily: typography.fonts.arabicBold,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  overlayMiddle: {
    flexDirection: "row",
    height: FRAME_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  corner: {
    position: "absolute",
    width: 32,
    height: 32,
    borderColor: colors.blue.neon,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: radius.md },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: radius.md },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: radius.md },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: radius.md },
  scanLine: {
    position: "absolute",
    top: 0,
    left: 8,
    right: 8,
    height: 3,
  },
  scanGradient: {
    flex: 1,
    borderRadius: 2,
  },
  hintWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  hintCard: {
    backgroundColor: "rgba(15,15,26,0.92)",
    borderRadius: radius.xl,
    padding: spacing.md,
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.active,
  },
  hintEmoji: { fontSize: 24 },
  hintText: {
    color: "#fff",
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.arabicMedium,
    textAlign: "center",
  },
  permission: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  permEmoji: { fontSize: 72 },
  permTitle: {
    fontSize: typography.sizes.xl,
    color: colors.text.primary,
    fontFamily: typography.fonts.arabicBold,
    textAlign: "center",
  },
  permSub: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    fontFamily: typography.fonts.arabic,
    textAlign: "center",
  },
  permBtn: {
    backgroundColor: colors.blue[500],
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    marginTop: spacing.md,
  },
  permBtnText: {
    color: "#fff",
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.arabicBold,
  },
});
