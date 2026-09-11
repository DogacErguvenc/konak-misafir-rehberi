"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, CheckCircle2, LockKeyhole, Mail } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabaseClient } from "@/lib/supabase/client";
import { accountError } from "@/lib/supabase/errors";
import { useAuth } from "./auth-provider";

export type AuthMode = "login" | "signup" | "forgot" | "reset";
const titles = {
  login: "Tekrar hoş geldiniz.",
  signup: "İyi ev sahipliği burada başlar.",
  forgot: "Şifrenizi yenileyin.",
  reset: "Yeni şifrenizi belirleyin.",
};
export function AuthForm({ mode }: { mode: AuthMode }) {
  const { configured, session, loading, error: sessionError } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [business, setBusiness] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !configured) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const client = getSupabaseClient();
      if (mode === "signup") {
        const { data, error } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { business_name: business.trim() },
            emailRedirectTo: `${window.location.origin}/dashboard/`,
          },
        });
        if (error) throw error;
        setPassword("");
        if (data.session) router.replace("/dashboard");
        else
          setNotice(
            "E-postanıza gelen doğrulama bağlantısını açın. Ardından giriş yapabilirsiniz. Zaten hesabınız varsa giriş ekranını kullanın.",
          );
      } else if (mode === "login") {
        const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        setPassword("");
        router.replace("/dashboard");
      } else if (mode === "forgot") {
        const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/sifre-yenile/`,
        });
        if (error) throw error;
        setNotice("Bu adresle kayıtlı bir hesabınız varsa şifre yenileme bağlantısı gönderildi.");
      } else {
        const { error } = await client.auth.updateUser({ password });
        if (error) throw error;
        setPassword("");
        setNotice("Şifreniz güncellendi. Panelinize dönebilirsiniz.");
      }
    } catch (error) {
      setError(accountError(error));
    } finally {
      setBusy(false);
    }
  }
  const resetReady = mode !== "reset" || Boolean(session);
  return (
    <div className="account-page">
      <Navbar dashboard />
      <main className="account-layout">
        <section className="account-story">
          <span className="section-eyebrow">KONAK · EV SAHİBİ ALANI</span>
          <Building2 size={36} strokeWidth={1.4} />
          <h1>{titles[mode]}</h1>
          <p>
            Bir işletme, tüm evleriniz. Misafirlerinize her ev için güncel ve ayrı bir rehber sunun.
          </p>
          <div className="account-benefits">
            <span>
              <LockKeyhole size={18} /> Yalnızca size ait yönetim alanı
            </span>
            <span>
              <CheckCircle2 size={18} /> Her ev için ayrı rehber ve QR kod
            </span>
          </div>
        </section>
        <section className="account-card" aria-label="Hesap işlemleri">
          {!configured ? (
            <>
              <h2>Hesaplar yakında açılıyor.</h2>
              <p>
                Hesap sistemi henüz bağlanmadı. Şimdilik örnek rehberi inceleyebilir veya bu
                tarayıcıdaki deneme panelini kullanabilirsiniz.
              </p>
              <Button asChild>
                <Link href="/dashboard">Deneme paneline dön</Link>
              </Button>
            </>
          ) : loading ? (
            <p aria-busy="true">Oturumunuz kontrol ediliyor…</p>
          ) : sessionError ? (
            <p role="alert" className="field-error">
              {sessionError}
            </p>
          ) : session && (mode === "login" || mode === "signup") ? (
            <>
              <h2>Oturumunuz açık.</h2>
              <p>{session.user.email}</p>
              <Button asChild>
                <Link href="/dashboard">
                  Panelime git <ArrowRight size={16} />
                </Link>
              </Button>
            </>
          ) : !resetReady ? (
            <>
              <h2>Geçerli bir bağlantı gerekli.</h2>
              <p>Şifre yenileme e-postanızdaki bağlantıyı açın veya yeni bir bağlantı isteyin.</p>
              <Button asChild>
                <Link href="/sifre">Yeni bağlantı iste</Link>
              </Button>
            </>
          ) : (
            <>
              <h2>
                {mode === "signup"
                  ? "Hesap oluştur"
                  : mode === "login"
                    ? "Giriş yap"
                    : "Şifre yenileme"}
              </h2>
              {notice ? (
                <div className="account-notice" role="status">
                  <Mail size={22} />
                  <p>{notice}</p>
                  <Button asChild variant="outline">
                    <Link href={session ? "/dashboard" : "/giris"}>
                      {session ? "Panele dön" : "Giriş ekranına dön"}
                    </Link>
                  </Button>
                </div>
              ) : (
                <form onSubmit={submit} className="account-form">
                  {mode === "signup" && (
                    <label className="form-field" htmlFor="business-name">
                      İşletme adı
                      <Input
                        id="business-name"
                        autoComplete="organization"
                        value={business}
                        onChange={(e) => setBusiness(e.target.value)}
                        minLength={2}
                        maxLength={100}
                        required
                      />
                    </label>
                  )}
                  {mode !== "reset" && (
                    <label className="form-field" htmlFor="account-email">
                      E-posta
                      <Input
                        id="account-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        maxLength={254}
                        required
                      />
                    </label>
                  )}
                  {mode !== "forgot" && (
                    <label className="form-field" htmlFor="account-password">
                      {mode === "reset" ? "Yeni şifre" : "Şifre"}
                      <Input
                        id="account-password"
                        type="password"
                        autoComplete={mode === "login" ? "current-password" : "new-password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={mode === "login" ? 1 : 10}
                        maxLength={128}
                        required
                      />
                      {mode !== "login" && (
                        <span className="field-help">En az 10 karakter kullanın.</span>
                      )}
                    </label>
                  )}
                  {error && (
                    <p className="field-error" role="alert">
                      {error}
                    </p>
                  )}
                  <Button type="submit" disabled={busy}>
                    {busy
                      ? "İşlem yapılıyor…"
                      : mode === "signup"
                        ? "Hesabımı oluştur"
                        : mode === "login"
                          ? "Giriş yap"
                          : mode === "forgot"
                            ? "Yenileme bağlantısı gönder"
                            : "Şifremi güncelle"}
                    <ArrowRight size={16} />
                  </Button>
                </form>
              )}
              <div className="account-links">
                {mode === "login" ? (
                  <>
                    <Link href="/sifre">Şifremi unuttum</Link>
                    <Link href="/kayit">Hesap oluştur</Link>
                  </>
                ) : (
                  <Link href="/giris">Giriş ekranına dön</Link>
                )}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
