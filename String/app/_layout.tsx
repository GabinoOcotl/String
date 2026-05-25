import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { RootErrorBoundary } from "@/components/RootErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";

void SplashScreen.preventAutoHideAsync().catch(() => {});

export { RootErrorBoundary as ErrorBoundary };

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
