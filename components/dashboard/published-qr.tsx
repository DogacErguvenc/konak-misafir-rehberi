"use client";
import { useEffect, useId, useState } from "react";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QrGenerator } from "./qr-generator";
import type { Guide } from "@/lib/types";
import type { GuideRepository } from "@/lib/repositories/guide-repository";

export function PublishedQr({
  slug,
  repository,
}: {
  slug: string;
  repository: Pick<GuideRepository, "findBySlug">;
}) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;
    setGuide(null);
    setError("");
    setLoading(true);
    // Always read the published snapshot; opening a QR never saves editor changes.
    void repository
      .findBySlug(slug)
      .then((published) => {
        if (!active) return;
        if (published) setGuide(published);
        else setError("Rehber şu anda yayında değil. Güncel durum için paneli yenileyin.");
      })
      .catch(() => {
        if (active) setError("QR bilgileri yüklenemedi. Kapatıp tekrar deneyebilirsiniz.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, repository, slug]);

  return (
    <div className="mb-6">
      <Button
        type="button"
        variant="outline"
        className="published-qr-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setGuide(null);
          setError("");
          setLoading(!open);
          setOpen(!open);
        }}
      >
        <QrCode size={16} />
        {open ? "QR kodunu kapat" : "Yayımdaki QR kodunu aç"}
      </Button>
      {open && (
        <section id={panelId} className="save-result mt-4" aria-label="Yayımdaki rehberin QR kodu">
          {loading && <p role="status">Yayımdaki rehber yükleniyor…</p>}
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
          {guide && <QrGenerator guide={guide} cloud />}
        </section>
      )}
    </div>
  );
}
