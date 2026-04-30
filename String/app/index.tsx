import { Redirect } from "expo-router";

import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const { session, initialized } = useAuth();

  if (!initialized) {
    return null;
  }

  if (session) {
    return <Redirect href="/home" />;
  }

  return <Redirect href="/login" />;
}
