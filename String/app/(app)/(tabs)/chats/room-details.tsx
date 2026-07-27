import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
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
  getRoomMembers,
  type RoomMember,
  type RoomSummary,
} from "@/lib/api/rooms";
import { workerConfigError } from "@/lib/api/workerClient";

export default function RoomDetailsScreen() {
  const { roomId, name } = useLocalSearchParams<{
    roomId: string;
    name?: string;
  }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = themeColors[colorScheme === "dark" ? "dark" : "light"];
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const selfId = session?.user?.id;

  const id = typeof roomId === "string" ? roomId : "";
  const paramName = typeof name === "string" ? name : undefined;

  const [room, setRoom] = useState<RoomSummary | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!id) {
        setError("Invalid room.");
        setLoading(false);
        setRefreshing(false);
        return;
      }
      if (!accessToken) {
        setError("Sign in to view members.");
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
        const data = await getRoomMembers(id, accessToken);
        setRoom(data.room);
        setMembers(data.members);
      } catch (err) {
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

  // Prefer the name passed from the chat so the header matches on push;
  // fall back to API fields only when navigating without a name param.
  const displayTitle =
    paramName?.trim() ||
    room?.courseDesignation?.trim() ||
    room?.name?.trim() ||
    "Room details";

  const openProfile = (userId: string) => {
    if (selfId && userId === selfId) {
      router.push("/schedule/profile");
      return;
    }
    router.push({
      pathname: "/chats/profile/[userId]",
      params: { userId },
    });
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerBlock}>
        <Text style={[styles.title, { color: colors.text }]}>{displayTitle}</Text>
        {room?.enrollmentClassNumber != null ? (
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Section {room.enrollmentClassNumber}
            {room.subjectCode && room.courseId
              ? ` · ${room.subjectCode} ${room.courseId}`
              : ""}
          </Text>
        ) : null}
        <Text style={[styles.memberCount, { color: colors.textMuted }]}>
          {members.length} {members.length === 1 ? "member" : "members"}
        </Text>
      </View>

      {error ? (
        <Text style={[styles.error, { color: colors.error }]} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      <FlatList
        data={members}
        keyExtractor={(item) => item.user_id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          !error ? (
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              No members yet.
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.memberRow,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
              pressed && styles.pressed,
            ]}
            onPress={() => openProfile(item.user_id)}
            accessibilityRole="button"
            accessibilityLabel={`View ${item.full_name}'s profile`}
          >
            <View
              style={[
                styles.avatar,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              {item.has_avatar && accessToken ? (
                <Image
                  source={profilePhotoSource(item.user_id, accessToken, "member")}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <Text style={[styles.avatarInitial, { color: colors.primary }]}>
                  {(item.first_name?.trim()[0] ?? item.full_name[0] ?? "?").toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.memberText}>
              <Text style={[styles.memberName, { color: colors.text }]}>
                {item.full_name}
                {selfId === item.user_id ? " (you)" : ""}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBlock: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
  },
  memberCount: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
  },
  error: {
    marginHorizontal: 20,
    marginBottom: 8,
    fontSize: 14,
    textAlign: "center",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 8,
  },
  empty: {
    textAlign: "center",
    marginTop: 24,
    fontSize: 15,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: "700",
  },
  memberText: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
  },
});
