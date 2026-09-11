"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ArrowLeft } from "lucide-react";
import { GuideView } from "./guide-view";
import { mockGuide } from "@/lib/mock-data";
import { getGuestGuide } from "@/lib/repositories/guide-repository";
import { isCloudConfigured } from "@/lib/supabase/config";
import type { Guide } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { resolvePublicRoute } from "@/lib/public-route";
export function GuestLoader({ slug }: { slug: string }) {
  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const route = resolvePublicRoute(window.location.pathname);
    const actualSlug = route.kind === "guide" ? route.slug : slug;
    async function load() {
      if (active) {
        setLoading(true);
        setGuide(null);
        setError("");
      }
      try {
        const found = await getGuestGuide(actualSlug);
        if (active) {
          setGuide(found);
          setError("");
        }
      } catch (error) {
        if (active) {
          if (actualSlug === mockGuide.slug) setGuide(mockGuide);
          else
            setError(
              error instanceof Error
                ? error.message
                : "Rehbere şu anda ulaşılamıyor. Lütfen tekrar deneyin.",
            );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    window.addEventListener("storage", load);
    return () => {
      active = false;
      window.removeEventListener("storage", load);
    };
  }, [slug]);
  useEffect(() => {
    if (guide) document.title = `${guide.name} | Konak`;
  }, [guide]);
  if (loading)
    return (
      <main className="guide-loading" aria-busy="true">
        <BookOpen size={30} />
        <p>Rehberiniz hazırlanıyor…</p>
      </main>
    );
  if (!guide)
    return (
      <main className="guide-not-found">
        <BookOpen size={42} />
        <h1>Bu rehber burada bulunamadı.</h1>
        <p>
          {error ||
            (isCloudConfigured()
              ? "Rehber henüz yayımlanmamış veya yayından kaldırılmış olabilir. Bağlantıyı kontrol edin ya da ev sahibinizle iletişime geçin."
              : "Rehber bağlantısını kontrol edin. Bu deneme sürümünde yeni rehberler oluşturuldukları tarayıcıda saklanır.")}
        </p>
        <div>
          <Button asChild>
            <Link href="/rehber/sapanca-doga-3">Örnek rehberi aç</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft size={16} />
              Panele dön
            </Link>
          </Button>
        </div>
      </main>
    );
  return (
    <main className="guest-page">
      <GuideView guide={guide} />
    </main>
  );
}
