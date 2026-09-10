"use client";
import { useEffect, useId, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  Clock3,
  Compass,
  Globe2,
  Heart,
  House,
  MapPin,
  MessageCircle,
  Navigation,
  ShoppingBag,
  Pill,
  Trees,
  Utensils,
  ImageOff,
} from "lucide-react";
import { WifiCard } from "@/components/guide/wifi-card";
import { InstructionsAccordion } from "@/components/guide/instructions-accordion";
import { ThemeToggle } from "@/components/navbar";
import { getDictionary } from "@/lib/i18n";
import { safeUrl, whatsappUrl, cn } from "@/lib/utils";
import type { Guide, Language, Place } from "@/lib/types";
export function PropertyImage({
  src,
  alt,
  className = "",
  eager = false,
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return failed || !src ? (
    <div className={cn("image-fallback", className)} role="img" aria-label={alt}>
      <ImageOff size={28} />
      <span>Görsel yüklenemedi</span>
    </div>
  ) : (
    <img
      src={safeUrl(src, "")}
      alt={alt}
      className={className}
      loading={eager ? "eager" : "lazy"}
      onError={() => setFailed(true)}
    />
  );
}
const categoryIcons = { restaurant: Utensils, nature: Trees, market: ShoppingBag, pharmacy: Pill };
export function GuideView({
  guide,
  embedded = false,
  initialLanguage = "tr",
}: {
  guide: Guide;
  embedded?: boolean;
  initialLanguage?: Language;
}) {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [filter, setFilter] = useState<"all" | Place["category"]>("all");
  const [tab, setTab] = useState("home");
  const uid = useId().replace(/:/g, "");
  const t = getDictionary(language);
  const maps =
    guide.mapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(guide.address)}`;
  function jump(target: string) {
    setTab(target);
    document
      .getElementById(`${uid}-${target}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  return (
    <div
      className={cn("guest-shell", embedded && "guest-embedded")}
      dir={language === "ar" ? "rtl" : "ltr"}
      lang={language}
    >
      <div className="guest-topbar">
        <a href="/" className="guest-wordmark">
          <House size={18} />
          <span>konak.</span>
        </a>
        <div className="guest-tools">
          {!embedded && <ThemeToggle />}
          <label className="language-picker">
            <Globe2 size={15} />
            <select
              aria-label="Rehber dili / Guide language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
            >
              <option value="tr">TR</option>
              <option value="en">EN</option>
              <option value="ar">AR</option>
            </select>
            <ChevronDown size={12} />
          </label>
        </div>
      </div>
      <div id={`${uid}-home`} className="guide-hero">
        <PropertyImage src={guide.coverImage} alt={guide.name} eager />
        <div className="guide-hero-shade" />
        <span className="guide-hero-tag">
          <MapPin size={12} />
          {guide.location || guide.address.split(",").pop()}
        </span>
        <div className="guide-welcome">
          <p>{t.welcome}</p>
          <h1>{guide.name}</h1>
          <span>{t.subtitle}</span>
        </div>
      </div>
      <div className="guest-content">
        <div className="stay-times">
          <span>
            <Clock3 size={15} />
            {t.checkin}
            <strong>{guide.checkIn}</strong>
          </span>
          <span>
            {t.checkout}
            <strong>{guide.checkOut}</strong>
          </span>
        </div>
        {language !== "tr" && <p className="language-note">{t.contentNote}</p>}
        <WifiCard name={guide.wifiName} password={guide.wifiPassword} language={language} />
        <div className="quick-actions">
          <a href={safeUrl(maps)} target="_blank" rel="noreferrer">
            <Navigation size={20} />
            <span>{t.directions}</span>
            <ArrowUpRight size={14} />
          </a>
          <a href={whatsappUrl(guide.whatsapp, t.message)} target="_blank" rel="noreferrer">
            <MessageCircle size={20} />
            <span>{t.contact}</span>
            <ArrowUpRight size={14} />
          </a>
        </div>
        <section className="guide-section">
          <div className="section-eyebrow">
            <span>01</span> {t.guide}
          </div>
          <h2>{t.essentials}</h2>
          <p className="section-description">{t.essentialNote}</p>
          <InstructionsAccordion instructions={guide.instructions} />
        </section>
        <section id={`${uid}-nearby`} className="guide-section">
          <div className="section-eyebrow">
            <span>02</span> {t.nearby.toLocaleUpperCase(language)}
          </div>
          <h2>{t.explore}</h2>
          <p className="section-description">{t.exploreNote}</p>
          <div className="place-filters" role="group" aria-label={t.explore}>
            {(["all", "restaurant", "nature", "market", "pharmacy"] as const).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
                className={cn(filter === key && "active")}
              >
                {t[key]}
              </button>
            ))}
          </div>
          <div className="places-grid">
            {guide.places
              .filter((p) => filter === "all" || p.category === filter)
              .map((place) => {
                const Icon = categoryIcons[place.category];
                return (
                  <article className="place-card" key={place.id}>
                    {place.imageUrl ? (
                      <div className="place-photo">
                        <PropertyImage src={place.imageUrl} alt={place.name} />
                        <span>{t[place.category]}</span>
                      </div>
                    ) : (
                      <div className={`place-placeholder ${place.category}`}>
                        <Icon size={30} />
                        <span>{t[place.category]}</span>
                      </div>
                    )}
                    <div className="place-copy">
                      <h3>{place.name}</h3>
                      <p>
                        <MapPin size={12} />
                        {place.distance}
                      </p>
                      <a href={safeUrl(place.mapsUrl)} target="_blank" rel="noreferrer">
                        {t.map}
                        <ArrowUpRight size={14} />
                      </a>
                    </div>
                  </article>
                );
              })}
          </div>
          {!guide.places.some((p) => filter === "all" || p.category === filter) && (
            <p className="empty-message">{t.empty}</p>
          )}
        </section>
        <section id={`${uid}-help`} className="host-contact">
          <span className="host-avatar">
            <Heart size={23} />
          </span>
          <div>
            <span className="section-eyebrow">{t.host}</span>
            <h3>{t.hostNote}</h3>
            <a href={whatsappUrl(guide.whatsapp, t.message)} target="_blank" rel="noreferrer">
              {t.whatsapp}
              <ArrowUpRight size={14} />
            </a>
          </div>
        </section>
        <footer className="guest-footer">
          <span>
            <House size={15} />
            konak.
          </span>
          <p>{t.powered}</p>
          {guide.id === "demo-sapanca" && <small>{t.demo}</small>}
        </footer>
      </div>
      <nav className="guest-bottom-nav" aria-label={t.guide}>
        {[
          { id: "home", label: t.home, Icon: BookOpen },
          { id: "nearby", label: t.nearby, Icon: Compass },
          { id: "help", label: t.help, Icon: MessageCircle },
        ].map(({ id, label, Icon }) => (
          <button
            type="button"
            className={cn(tab === id && "active")}
            onClick={() => jump(id)}
            key={id}
          >
            <Icon size={19} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
