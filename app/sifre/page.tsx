import { AuthForm } from "@/components/auth/auth-form";
export const metadata = { title: "Şifremi Unuttum", robots: { index: false } };
export default function ForgotPage() {
  return <AuthForm mode="forgot" />;
}
