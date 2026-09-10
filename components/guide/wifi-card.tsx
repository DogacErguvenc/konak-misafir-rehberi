"use client";
import { useState } from "react";
import { Check, Copy, Wifi } from "lucide-react";
import { toast } from "sonner";
import { getDictionary } from "@/lib/i18n";
import type { Language } from "@/lib/types";
export function WifiCard({
  name,
  password,
  language,
}: {
  name: string;
  password: string;
  language: Language;
}) {
  const [copied, setCopied] = useState(false);
  const t = getDictionary(language);
  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      toast.success(t.copied);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error(t.copyError);
    }
  }
  return (
    <div className="wifi-card">
      <div className="wifi-top">
        <span className="guide-icon wifi-icon">
          <Wifi size={22} />
        </span>
        <div>
          <h3>{t.wifi}</h3>
          <p dir="ltr">{name}</p>
        </div>
        <span className="wifi-wave" aria-hidden="true">
          <Wifi size={49} strokeWidth={1} />
        </span>
      </div>
      <div className="wifi-bottom">
        <code dir="ltr">{password}</code>
        <button type="button" onClick={copy} aria-label={t.copy} className="copy-button">
          {copied ? <Check size={16} /> : <Copy size={16} />}
          <span>{copied ? t.copied : t.copy}</span>
        </button>
      </div>
    </div>
  );
}
