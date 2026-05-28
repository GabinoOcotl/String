import { Redirect } from "expo-router";

import { AuthInitGate } from "@/components/auth/AuthInitGate";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const { session } = useAuth();

  return (
    <AuthInitGate>
      {session ? <Redirect href="/schedule" /> : <Redirect href="/login" />}
    </AuthInitGate>
  );
}
