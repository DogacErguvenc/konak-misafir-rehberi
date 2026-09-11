import { AuthForm } from "@/components/auth/auth-form";
export const metadata = { title: "Hesap Oluştur", robots: { index: false } };
export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
