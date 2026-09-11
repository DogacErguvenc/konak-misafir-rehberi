import { AuthForm } from "@/components/auth/auth-form";
export const metadata = { title: "Şifre Yenileme", robots: { index: false } };
export default function ResetPage() {
  return <AuthForm mode="reset" />;
}
