import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { colors, typography } from "../theme";
import { useStore } from "../store";
import { RootStackParamList, TabParamList } from "../types";

// Screens
import HomeScreen from "../screens/home/HomeScreen";
import CatalogScreen from "../screens/catalog/CatalogScreen";
import CartScreen from "../screens/cart/CartScreen";
import OrdersScreen from "../screens/orders/OrdersScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import AuthScreen from "../screens/auth/AuthScreen";
import ProductDetailScreen from "../screens/product/ProductDetailScreen";
import CheckoutScreen from "../screens/checkout/CheckoutScreen";
import OrderSuccessScreen from "../screens/orders/OrderSuccessScreen";
import WishlistScreen from "../screens/wishlist/WishlistScreen";
import BarcodeScannerScreen from "../screens/scanner/BarcodeScannerScreen";
import PaymentMethodsScreen from "../screens/payment/PaymentMethodsScreen";
import DistributorsScreen from "../screens/distributors/DistributorsScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

interface TabIconProps {
  emoji: string;
  focused: boolean;
  badge?: number;
}

function TabIcon({ emoji, focused, badge }: TabIconProps) {
  return (
    <View style={tabStyles.container}>
      <Text style={[tabStyles.emoji, focused && tabStyles.emojiFocused]}>{emoji}</Text>
      {badge != null && badge > 0 && (
        <View style={tabStyles.badge}>
          <Text style={tabStyles.badgeText}>{badge > 9 ? "9+" : badge}</Text>
        </View>
      )}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  emoji: {
    fontSize: 22,
    opacity: 0.5,
  },
  emojiFocused: {
    opacity: 1,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: colors.orange[500],
    borderRadius: 999,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontFamily: typography.fonts.arabicBold,
    lineHeight: 10,
  },
});

function MainTabs() {
  const cartCount = useStore((s) => s.cartCount);
  const isLoggedIn = useStore((s) => s.isLoggedIn);
  const language = useStore((s) => s.language);
  const isAr = language === "ar";

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg.secondary,
          borderTopColor: colors.border.default,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 84 : 64,
          paddingBottom: Platform.OS === "ios" ? 24 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.blue[500],
        tabBarInactiveTintColor: colors.text.muted,
        tabBarLabelStyle: {
          fontFamily: typography.fonts.arabicMedium,
          fontSize: 10,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: isAr ? "الرئيسية" : "Home",
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Catalog"
        component={CatalogScreen}
        options={{
          tabBarLabel: isAr ? "القطع" : "Parts",
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔧" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarLabel: isAr ? "السلة" : "Cart",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🛒" focused={focused} badge={cartCount} />
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          tabBarLabel: isAr ? "طلباتي" : "Orders",
          tabBarIcon: ({ focused }) => <TabIcon emoji="📦" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={isLoggedIn ? ProfileScreen : AuthScreen}
        options={{
          tabBarLabel: isAr ? "حسابي" : "Profile",
          tabBarIcon: ({ focused }) => <TabIcon emoji={isLoggedIn ? "👤" : "🔐"} focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg.primary },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: colors.bg.primary,
            },
            headerTintColor: colors.text.primary,
            headerTitleStyle: {
              fontFamily: typography.fonts.arabicBold,
              fontSize: typography.sizes.md,
            },
            headerBackTitle: "",
          }}
          getId={({ params }) => params.productId}
        />
        <Stack.Screen
          name="Checkout"
          component={CheckoutScreen}
          options={{
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="OrderSuccess"
          component={OrderSuccessScreen}
          options={{
            animation: "fade",
            gestureEnabled: false,
          }}
        />
        <Stack.Screen name="Wishlist" component={WishlistScreen} />
        <Stack.Screen
          name="BarcodeScanner"
          component={BarcodeScannerScreen}
          options={{ animation: "slide_from_bottom", gestureEnabled: true }}
        />
        <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
        <Stack.Screen name="Distributors" component={DistributorsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
