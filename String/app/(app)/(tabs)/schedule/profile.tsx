import { Image } from "expo-image";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import { themeColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import {
  deleteProfilePhoto,
  profilePhotoSource,
  uploadProfilePhoto,
} from "@/lib/api/profilePhotos";
import { mapWorkerError } from "@/lib/api/mapWorkerError";
import { workerConfigError } from "@/lib/api/workerClient";
import { GENERIC_AUTH_ERROR, mapAuthError } from "@/lib/authErrors";

export default function ScheduleProfileScreen() {
  const { session, user, signOut } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = themeColors[isDark ? "dark" : "light"];

  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<"upload" | "delete" | "signout" | null>(
    null,
  );
  const [hasPhoto, setHasPhoto] = useState(true);
  const [photoVersion, setPhotoVersion] = useState("initial");
  const [retryUri, setRetryUri] = useState<string | null>(null);

  async function onSignOut() {
    setError(null);
    setBusyAction("signout");
    try {
      const { error: signOutError } = await signOut();
      if (signOutError) {
        setError(mapAuthError(signOutError));
        return;
      }
      router.replace("/login");
    } catch {
      setError(GENERIC_AUTH_ERROR);
    } finally {
      setBusyAction(null);
    }
  }

  async function compressAndUpload(uri: string) {
    const accessToken = session?.access_token;
    if (!accessToken) {
      setError("Your session expired. Sign in again.");
      return;
    }

    setBusyAction("upload");
    setError(null);
    try {
      const context = ImageManipulator.ImageManipulator.manipulate(uri);
      context.resize({ width: 1024, height: null });
      const rendered = await context.renderAsync();
      const compressed = await rendered.saveAsync({
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      const result = await uploadProfilePhoto(accessToken, compressed.uri);
      setPhotoVersion(result.updatedAt);
      setHasPhoto(true);
      setRetryUri(null);
    } catch (uploadError) {
      setRetryUri(uri);
      setError(mapWorkerError(uploadError));
    } finally {
      setBusyAction(null);
    }
  }

  async function onChoosePhoto() {
    setError(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        if (!permission.canAskAgain) {
          Alert.alert(
            "Photos permission is off",
            "Open settings to allow String to choose a profile photo.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open settings", onPress: () => void Linking.openSettings() },
            ],
          );
          setError("Photo access is disabled. Enable it in Settings to choose a photo.");
        } else {
          setError("Photo access is needed. Tap Choose profile photo to try again.");
        }
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        exif: false,
      });
      if (result.canceled || !result.assets[0]) return;

      await compressAndUpload(result.assets[0].uri);
    } catch {
      setError("The photo library is unavailable right now. Try again.");
    }
  }

  function onDeletePhoto() {
    Alert.alert("Delete profile photo?", "Your fallback avatar will be shown instead.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => void confirmDeletePhoto(),
      },
    ]);
  }

  async function confirmDeletePhoto() {
    const accessToken = session?.access_token;
    if (!accessToken) {
      setError("Your session expired. Sign in again.");
      return;
    }

    setBusyAction("delete");
    setError(null);
    try {
      await deleteProfilePhoto(accessToken);
      setHasPhoto(false);
      setRetryUri(null);
    } catch (deleteError) {
      setError(mapWorkerError(deleteError));
    } finally {
      setBusyAction(null);
    }
  }

  const isBusy = busyAction !== null;
  const canLoadPhoto =
    hasPhoto && !workerConfigError && user?.id && session?.access_token;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Account</Text>
      <View
        style={[
          styles.avatar,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {canLoadPhoto ? (
          <Image
            source={profilePhotoSource(user.id, session.access_token, photoVersion)}
            style={styles.avatarImage}
            contentFit="cover"
            transition={150}
            onError={() => setHasPhoto(false)}
            accessibilityLabel="Profile photo"
          />
        ) : (
          <Text style={[styles.fallbackText, { color: colors.primary }]}>
            {(user?.email?.[0] ?? "?").toUpperCase()}
          </Text>
        )}
      </View>
      <Text style={[styles.email, { color: colors.textMuted }]}>
        {user?.email ?? "Signed in"}
      </Text>

      {error ? (
        <Text style={[styles.error, { color: colors.error }]} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      <Pressable
        style={({ pressed }) => [
          styles.primaryButton,
          { backgroundColor: colors.primary },
          pressed && styles.buttonPressed,
          isBusy && styles.buttonDisabled,
        ]}
        onPress={onChoosePhoto}
        disabled={isBusy}
        accessibilityRole="button"
      >
        {busyAction === "upload" ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.onPrimary} />
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>
              Uploading...
            </Text>
          </View>
        ) : (
          <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>
            {hasPhoto ? "Replace profile photo" : "Choose profile photo"}
          </Text>
        )}
      </Pressable>

      {retryUri ? (
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            { borderColor: colors.border },
            pressed && styles.buttonPressed,
            isBusy && styles.buttonDisabled,
          ]}
          onPress={() => void compressAndUpload(retryUri)}
          disabled={isBusy}
        >
          <Text style={[styles.buttonText, { color: colors.primary }]}>
            Retry upload
          </Text>
        </Pressable>
      ) : null}

      {hasPhoto ? (
        <Pressable
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.buttonPressed,
            isBusy && styles.buttonDisabled,
          ]}
          onPress={onDeletePhoto}
          disabled={isBusy}
        >
          <Text style={[styles.buttonText, { color: colors.error }]}>
            {busyAction === "delete" ? "Deleting..." : "Delete profile photo"}
          </Text>
        </Pressable>
      ) : null}

      <Pressable
        style={({ pressed }) => [
          styles.secondaryButton,
          { borderColor: colors.border },
          pressed && styles.buttonPressed,
          isBusy && styles.buttonDisabled,
        ]}
        onPress={onSignOut}
        disabled={isBusy}
      >
        <Text style={[styles.buttonText, { color: colors.primary }]}>
          {busyAction === "signout" ? "Signing out..." : "Sign out"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  avatar: {
    width: 120,
    height: 120,
    marginTop: 20,
    borderRadius: 60,
    borderWidth: 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  fallbackText: {
    fontSize: 42,
    fontWeight: "700",
  },
  email: {
    marginTop: 8,
    fontSize: 16,
    textAlign: "center",
  },
  error: {
    marginTop: 16,
    fontSize: 14,
    textAlign: "center",
  },
  primaryButton: {
    minWidth: 220,
    marginTop: 24,
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  secondaryButton: {
    minWidth: 220,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  deleteButton: {
    minWidth: 220,
    marginTop: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
