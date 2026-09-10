"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ArrowLeft } from "lucide-react";
import { GuideView } from "./guide-view";
import { mockGuide } from "@/lib/mock-data";
import { getGuideRepository } from "@/lib/repositories/guide-repository";
import type { Guide } from "@/lib/types";
import { Button } from "@/components/ui/button";
export function GuestLoader({ slug }: { slug: string }) {
  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const actualSlug = decodeURIComponent(
      window.location.pathname.split("/").filter(Boolean)[1] || slug,
    );
    async function load() {
      try {
        const found = await getGuideRepository().findBySlug(actualSlug);
        if (active) {
          setGuide(found);
          setError("");
        }
      } catch {
        if (active) {
          if (actualSlug === mockGuide.slug) setGuide(mockGuide);
          else setError("Tarayıcı kayıtlarına erişilemedi.");
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
            "Rehber bağlantısını kontrol edin. Bu MVP’de yeni rehberler yalnızca oluşturuldukları tarayıcıda saklanır."}
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
