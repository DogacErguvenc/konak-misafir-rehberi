import { AuthForm } from "@/components/auth/auth-form";
export const metadata = { title: "Giriş Yap", robots: { index: false } };
export default function LoginPage() {
  return <AuthForm mode="login" />;
}
