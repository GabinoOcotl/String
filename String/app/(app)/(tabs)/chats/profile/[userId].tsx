import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import { themeColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { mapWorkerError } from "@/lib/api/mapWorkerError";
import { profilePhotoSource } from "@/lib/api/profilePhotos";
import {
  classDisplayName,
  getUserPublicProfile,
  type ProfileClass,
  type PublicUserProfile,
} from "@/lib/api/users";
import { workerConfigError } from "@/lib/api/workerClient";

function ClassList({
  title,
  items,
  emptyLabel,
  colors,
}: {
  title: string;
  items: ProfileClass[];
  emptyLabel: string;
  colors: (typeof themeColors)["light"];
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {items.length === 0 ? (
        <Text style={[styles.emptyClass, { color: colors.textMuted }]}>
          {emptyLabel}
        </Text>
      ) : (
        items.map((item) => (
          <View
            key={item.id}
            style={[
              styles.classRow,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            <Text style={[styles.className, { color: colors.text }]}>
              {classDisplayName(item)}
            </Text>
            {item.enrollment_class_number != null ? (
              <Text style={[styles.classMeta, { color: colors.textMuted }]}>
                Section {item.enrollment_class_number}
              </Text>
            ) : null}
          </View>
        ))
      )}
    </View>
  );
}

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = themeColors[colorScheme === "dark" ? "dark" : "light"];
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const selfId = session?.user?.id;

  const id = typeof userId === "string" ? userId : "";

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!id) {
        setError("Invalid profile.");
        setLoading(false);
        setRefreshing(false);
        return;
      }
      if (!accessToken) {
        setError("Sign in to view profiles.");
        setLoading(false);
        setRefreshing(false);
        return;
      }
      if (workerConfigError) {
        setError(workerConfigError);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const data = await getUserPublicProfile(id, accessToken);
        setProfile(data);
      } catch (err) {
        setProfile(null);
        setError(mapWorkerError(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id, accessToken],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (selfId && id && selfId === id) {
      router.replace("/schedule/profile");
    }
  }, [selfId, id, router]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: profile?.full_name?.trim() || "Profile",
    });
  }, [navigation, profile?.full_name]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View
        style={[
          styles.centered,
          styles.padded,
          { backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.errorTitle, { color: colors.text }]}>
          Profile unavailable
        </Text>
        <Text style={[styles.errorBody, { color: colors.textMuted }]}>
          {error ?? "This profile could not be loaded."}
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.retryButton,
            { backgroundColor: colors.primary },
            pressed && styles.pressed,
          ]}
          onPress={() => void load()}
        >
          <Text style={[styles.retryLabel, { color: colors.onPrimary }]}>
            Try again
          </Text>
        </Pressable>
      </View>
    );
  }

  const displayInitial = (
    profile.first_name?.trim()[0] ??
    profile.full_name[0] ??
    "?"
  ).toUpperCase();

  const sharedIds = new Set(profile.shared_classes.map((c) => c.id));
  const otherClasses = profile.classes.filter((c) => !sharedIds.has(c.id));
  const allShared =
    profile.shared_classes.length > 0 && otherClasses.length === 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void load(true)}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <View
        style={[
          styles.avatar,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {profile.has_avatar && accessToken ? (
          <Image
            source={profilePhotoSource(profile.id, accessToken, "profile")}
            style={styles.avatarImage}
            contentFit="cover"
            accessibilityLabel="Profile photo"
          />
        ) : (
          <Text style={[styles.fallbackText, { color: colors.primary }]}>
            {displayInitial}
          </Text>
        )}
      </View>

      <Text style={[styles.name, { color: colors.text }]}>{profile.full_name}</Text>
      <Text style={[styles.email, { color: colors.textMuted }]}>{profile.email}</Text>

      <Text style={[styles.bioLabel, { color: colors.textMuted }]}>Bio</Text>
      <Text style={[styles.bio, { color: colors.text }]}>
        {profile.description?.trim() || "No bio yet"}
      </Text>

      {error ? (
        <Text style={[styles.inlineError, { color: colors.error }]} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      {allShared ? (
        <ClassList
          title="Classes you share"
          items={profile.shared_classes}
          emptyLabel="No shared classes."
          colors={colors}
        />
      ) : (
        <>
          <ClassList
            title="Classes you share"
            items={profile.shared_classes}
            emptyLabel="No classes in common."
            colors={colors}
          />
          <ClassList
            title="All their classes"
            items={profile.classes}
            emptyLabel="No classes listed."
            colors={colors}
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 48,
    alignItems: "center",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  padded: {
    padding: 24,
  },
  avatar: {
    width: 120,
    height: 120,
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
  name: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  email: {
    marginTop: 6,
    fontSize: 15,
    textAlign: "center",
  },
  bioLabel: {
    alignSelf: "stretch",
    marginTop: 24,
    fontSize: 13,
    fontWeight: "600",
  },
  bio: {
    alignSelf: "stretch",
    marginTop: 8,
    fontSize: 16,
    lineHeight: 22,
  },
  inlineError: {
    marginTop: 12,
    fontSize: 14,
    textAlign: "center",
  },
  section: {
    alignSelf: "stretch",
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
  },
  emptyClass: {
    fontSize: 14,
  },
  classRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  className: {
    fontSize: 15,
    fontWeight: "600",
  },
  classMeta: {
    marginTop: 2,
    fontSize: 13,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  errorBody: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  retryLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.85,
  },
});
