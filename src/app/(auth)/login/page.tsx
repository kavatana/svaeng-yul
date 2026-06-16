import { AuthForm } from "@/components/auth/auth-form";
import { isSupabaseConfigured } from "@/lib/config";

export default function LoginPage() {
  return <AuthForm mode="login" demoMode={!isSupabaseConfigured} />;
}
