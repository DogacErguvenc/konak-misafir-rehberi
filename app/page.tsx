import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Globe2,
  House,
  MousePointer2,
  QrCode,
  ScanLine,
  Smartphone,
  Sparkles,
  Wifi,
} from "lucide-react";
import { Navbar, Logo } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { GuideView } from "@/components/guide/guide-view";
import { mockGuide } from "@/lib/mock-data";
export default function Home() {
  return (
    <div className="landing-page">
      <Navbar />
      <main>
        <section className="landing-hero">
          <div className="hero-copy">
            <span className="eyebrow-pill">
              <span className="tiny-spark">
                <Sparkles size={13} />
              </span>{" "}
              DAHA AZ MESAJ. DAHA İYİ KONAKLAMA.
            </span>
            <h1>
              İyi ev sahipliği,
              <br />
              <span>küçük detaylarda.</span>
            </h1>
            <p className="hero-intro">
              Misafirlerinize WhatsApp’tan 50 satır mesaj atmayı bırakın. Evinize özel dijital
              rehberinizi <strong>5 dakikada oluşturun.</strong>
            </p>
            <div className="hero-ctas">
              <Button asChild size="lg" className="hero-primary">
                <Link href="/dashboard">
                  Ücretsiz Rehberini Oluştur
                  <ArrowUpRight size={19} />
                </Link>
              </Button>
              <Link className="text-cta" href="/rehber/sapanca-doga-3">
                Örnek rehberi keşfet
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="hero-promises">
              <span>
                <Check size={14} />
                Kredi kartı gerekmez
              </span>
              <span>
                <Check size={14} />
                Uygulama indirmeden
              </span>
            </div>
            <div className="hero-bottom">
              <div className="stacked-icons">
                <span>
                  <House size={19} />
                </span>
                <span>
                  <Wifi size={19} />
                </span>
                <span>
                  <HeartIcon />
                </span>
              </div>
              <p>
                Wi-Fi şifresinden en iyi kahvaltı noktasına.
                <br />
                <strong>Misafirinizin ihtiyacı olan her şey, tek bir yerde.</strong>
              </p>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-orbit orbit-one" />
            <div className="visual-orbit orbit-two" />
            <div className="preview-caption">
              <span className="preview-dot" /> CANLI REHBER ÖNİZLEMESİ
            </div>
            <div className="phone-device">
              <div className="phone-status">
                <span>9:41</span>
                <div className="phone-camera" />
                <span>
                  <Wifi size={12} />
                  <span className="battery" />
                </span>
              </div>
              <div className="phone-screen">
                <GuideView guide={mockGuide} embedded />
              </div>
              <div className="phone-home" />
            </div>
            <div className="floating-note wifi-note">
              <span>
                <Wifi size={22} />
              </span>
              <div>
                <strong>“Wi-Fi şifresi neydi?”</strong>
                <small>Artık tek dokunuşla.</small>
              </div>
              <Check size={17} className="note-check" />
            </div>
            <div className="floating-note qr-note">
              <span>
                <QrCode size={31} />
              </span>
              <div>
                <strong>Bir QR. Bütün ev.</strong>
                <small>Okut, keşfet, keyfini çıkar.</small>
              </div>
            </div>
            <div className="preview-hint">
              <MousePointer2 size={16} />
              <span>Gerçek bir rehber. İçine tıklayın.</span>
            </div>
          </div>
        </section>
        <section className="benefit-strip" aria-label="Rehber özellikleri">
          <div>
            <Wifi />
            <span>Wi-Fi & ev bilgileri</span>
          </div>
          <div>
            <House />
            <span>Cihaz kullanım kılavuzları</span>
          </div>
          <div>
            <Globe2 />
            <span>TR / EN / AR arayüz</span>
          </div>
          <div>
            <ScanLine />
            <span>Tek QR ile anında erişim</span>
          </div>
        </section>
        <section id="nasil-calisir" className="how-section">
          <div className="how-heading">
            <span className="section-eyebrow">SİZ EVİNİZİ HAZIRLAYIN. REHBER BİZDE.</span>
            <h2>
              Misafiriniz gelmeden,
              <br />
              her şey hazır.
            </h2>
            <Link href="/dashboard">
              İlk rehberini oluştur
              <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="how-steps">
            {[
              {
                no: "01",
                title: "Evinizi anlatın",
                text: "Ev bilgilerinizi, Wi-Fi şifrenizi ve küçük ipuçlarınızı ekleyin.",
                Icon: House,
              },
              {
                no: "02",
                title: "QR kodunuzu yerleştirin",
                text: "Size özel rehber kartını yazdırıp evinizde görünür bir yere koyun.",
                Icon: QrCode,
              },
              {
                no: "03",
                title: "Misafiriniz keyfini çıkarsın",
                text: "İndirme yok, kayıt yok. Evinizin rehberi her an elinin altında.",
                Icon: Smartphone,
              },
            ].map(({ no, title, text, Icon }) => (
              <article key={no}>
                <div className="step-icon">
                  <Icon size={22} />
                  <span>{no}</span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <Logo compact />
        <span>Güzel konaklamalar burada başlar.</span>
        <Link href="/dashboard">
          Ev sahibi paneli
          <ChevronRight size={15} />
        </Link>
        <small>© 2026 Konak</small>
      </footer>
    </div>
  );
}
function HeartIcon() {
  return <Sparkles size={19} />;
}
