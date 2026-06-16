import { AuthForm } from "@/components/auth/auth-form";
import { isSupabaseConfigured } from "@/lib/config";

export default function RegisterPage() {
  return <AuthForm mode="register" demoMode={!isSupabaseConfigured} />;
}
