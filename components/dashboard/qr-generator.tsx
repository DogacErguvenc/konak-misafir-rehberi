"use client";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, ExternalLink, House, Printer, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Guide } from "@/lib/types";
export function QrGenerator({ guide }: { guide: Guide }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => setUrl(`${window.location.origin}/rehber/${guide.slug}`), [guide.slug]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Rehber bağlantısı kopyalandı.");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Bağlantıyı seçip elle kopyalayabilirsiniz.");
    }
  }
  return (
    <div className="qr-result-layout">
      <article id="printable-qr" className="qr-print-card">
        <div className="qr-brand">
          <House size={21} />
          konak.
        </div>
        <h3>
          Rahatınıza bakın.
          <br />
          Rehberiniz burada.
        </h3>
        <p>Wi-Fi & Ev Rehberi İçin Okutun</p>
        <div className="qr-svg">
          {url ? (
            <QRCodeSVG
              value={url}
              size={208}
              level="M"
              marginSize={2}
              title={`${guide.name} misafir rehberi QR kodu`}
              bgColor="#ffffff"
              fgColor="#173e31"
            />
          ) : (
            <div style={{ height: 174 }} aria-busy="true" />
          )}
        </div>
        <p className="qr-scan">
          <ScanLine size={15} />
          Kameranızı açın, kodu okutun.
        </p>
        <p className="qr-property">{guide.name}</p>
      </article>
      <div className="qr-actions">
        <label htmlFor="saved-guide-url">Misafir rehberinizin bağlantısı</label>
        <div className="guide-link-box">
          <input
            id="saved-guide-url"
            value={url}
            readOnly
            onFocus={(e) => e.target.select()}
            aria-label="Rehber bağlantısı"
          />
          <button
            type="button"
            onClick={copy}
            disabled={!url}
            aria-label="Rehber bağlantısını kopyala"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
        <Button asChild>
          <a href={url || undefined} target="_blank" rel="noreferrer">
            Rehberi görüntüle
            <ExternalLink size={16} />
          </a>
        </Button>
        <Button type="button" variant="outline" disabled={!url} onClick={() => window.print()}>
          <Printer size={17} />
          QR kartını yazdır / PDF
        </Button>
        <p>
          Yazdırma penceresinde “PDF olarak kaydet” seçeneğini kullanabilirsiniz. Kartı girişe veya
          sehpanın üzerine yerleştirin.
        </p>
        <div className="local-notice">
          <strong>Bu sürümde kayıtlar bu tarayıcıda.</strong>
          <br />
          Yeni rehberin QR kodu başka bir cihazda aynı içeriği açmaz. Cihazlar arası paylaşım için
          Supabase bağlantısı gerekir. Örnek rehber her cihazda görüntülenebilir.
        </div>
      </div>
    </div>
  );
}
