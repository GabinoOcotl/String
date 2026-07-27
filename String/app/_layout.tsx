import "react-native-gesture-handler";

import Ionicons from "@expo/vector-icons/Ionicons";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { RootErrorBoundary } from "@/components/RootErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";

void SplashScreen.preventAutoHideAsync().catch(() => {});

export { RootErrorBoundary as ErrorBoundary };

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
