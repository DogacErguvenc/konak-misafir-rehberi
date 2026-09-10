"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCheck,
  ChevronDown,
  Eye,
  EyeOff,
  Info,
  LayoutGrid,
  MapPin,
  Plus,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { QrGenerator } from "@/components/dashboard/qr-generator";
import { PropertyImage } from "@/components/guide/guide-view";
import { mockGuide } from "@/lib/mock-data";
import { guideSchema, type Guide, type Place } from "@/lib/types";
import { getGuideRepository } from "@/lib/repositories/guide-repository";
import { cn } from "@/lib/utils";
import { registerGuideTools } from "@/lib/webmcp";
const steps = [
  {
    short: "Ev bilgileri",
    title: "Evinizle tanışalım",
    description: "Misafirinizi karşılayan ilk detayları ekleyin.",
  },
  {
    short: "Erişim & iletişim",
    title: "İlk soruların cevabı, burada",
    description: "Wi-Fi bilgilerinizi ve size ulaşılabilecek numarayı ekleyin.",
  },
  {
    short: "Ev talimatları",
    title: "Evinizin küçük sırları",
    description: "Cihazları ve ev kurallarını kısa, anlaşılır adımlarla anlatın.",
  },
  {
    short: "Çevre önerileri",
    title: "Mahallenizin en güzel yerleri",
    description: "Misafirinize bir yerli gibi keşfetmesi için öneriler bırakın.",
  },
];
const categories: Record<Place["category"], string> = {
  restaurant: "Yeme & içme",
  nature: "Doğa / plaj",
  market: "Market",
  pharmacy: "Eczane",
};
const stepKeys = [
  ["name", "coverImage", "address", "mapsUrl"],
  ["wifiName", "wifiPassword", "whatsapp"],
  ["instructions"],
  ["places"],
];
function newDraft(): Guide {
  return {
    ...structuredClone(mockGuide),
    id: crypto.randomUUID(),
    slug: "taslak",
    updatedAt: new Date().toISOString(),
  };
}
type Errors = Record<string, string>;
function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="field-help">{hint}</p>
      )}
    </div>
  );
}
export function DashboardEditor() {
  const [draft, setDraft] = useState<Guide>(mockGuide);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<Guide | null>(null);
  const [dirty, setDirty] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const savingRef = useRef(false);
  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const list = await getGuideRepository().list();
        if (active) {
          setGuides(list);
          setDraft(list[0] ?? newDraft());
        }
      } catch {
        if (active) {
          setLoadError(
            "Kayıtlar okunamadı. Tarayıcı depolaması engellenmiş veya kayıt verisi bozulmuş olabilir. Var olan verileriniz değiştirilmedi.",
          );
          setDraft(newDraft());
        }
      } finally {
        if (active) setLoaded(true);
      }
    }
    void init();
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function update<K extends keyof Guide>(key: K, value: Guide[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setErrors((prev) => {
      const copy = { ...prev };
      for (const k of Object.keys(copy)) if (k === key || k.startsWith(`${key}.`)) delete copy[k];
      return copy;
    });
  }
  const saveGuide = useCallback(async (input: Guide) => {
    if (savingRef.current) throw new Error("Kaydetme işlemi sürüyor.");
    savingRef.current = true;
    setSaving(true);
    try {
      const result = await getGuideRepository().save(input);
      setDraft(result);
      setSaved(result);
      setGuides(await getGuideRepository().list());
      setDirty(false);
      setErrors({});
      toast.success("Rehber kaydedildi. QR kodunuz hazır!");
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Rehber kaydedilemedi.";
      toast.error(message);
      throw error;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, []);
  useEffect(
    () => registerGuideTools({ save: saveGuide, list: () => getGuideRepository().list() }),
    [saveGuide],
  );
  function validate(target: number, all = false) {
    const parsed = guideSchema.safeParse(draft);
    const relevant = parsed.success
      ? []
      : parsed.error.issues.filter((i) => all || stepKeys[target].includes(String(i.path[0])));
    const next: Errors = {};
    for (const issue of relevant) next[issue.path.join(".")] = issue.message;
    setErrors(next);
    if (relevant.length) {
      const key = String(relevant[0].path[0]);
      const nextStep = stepKeys.findIndex((keys) => keys.includes(key));
      if (all && nextStep >= 0) setStep(nextStep);
      setTimeout(() => document.getElementById(relevant[0].path.join("."))?.focus(), 40);
      return false;
    }
    return true;
  }
  function moveStep(target: number) {
    if (target > step && !validate(step)) return;
    setStep(target);
    setErrors({});
    setTimeout(() => heading.current?.focus(), 30);
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (step < 3) {
      moveStep(step + 1);
      return;
    }
    if (!validate(step, true)) return;
    try {
      await saveGuide(draft);
    } catch {
      /* error shown by saveGuide */
    }
  }
  function switchGuide(next: Guide) {
    if (
      dirty &&
      !window.confirm(
        "Kaydedilmemiş değişiklikleriniz var. Değişiklikleri bırakıp devam edilsin mi?",
      )
    )
      return;
    setDraft(next);
    setStep(0);
    setSaved(null);
    setErrors({});
    setDirty(false);
  }
  function addInstruction() {
    if (draft.instructions.length >= 20) return;
    update("instructions", [
      ...draft.instructions,
      { id: crypto.randomUUID(), title: "", description: "" },
    ]);
  }
  function editInstruction(index: number, key: "title" | "description", value: string) {
    update(
      "instructions",
      draft.instructions.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );
  }
  function addPlace() {
    if (draft.places.length >= 20) return;
    update("places", [
      ...draft.places,
      {
        id: crypto.randomUUID(),
        name: "",
        category: "restaurant",
        distance: "",
        mapsUrl: "",
        imageUrl: "",
      },
    ]);
  }
  function editPlace(index: number, key: keyof Place, value: string) {
    update(
      "places",
      draft.places.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );
  }
  const inputProps = (id: string) => ({
    id,
    "aria-invalid": Boolean(errors[id]),
    "aria-describedby": errors[id] ? `${id}-error` : undefined,
  });
  return (
    <div className="dashboard-page">
      <Navbar dashboard />
      <main className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <span className="section-eyebrow">EV SAHİBİ ALANI</span>
          <div className="workspace-badge">
            <span>K</span>
            <div>
              <strong>Benim evlerim</strong>
              <small>Konak çalışma alanı</small>
            </div>
          </div>
          <div className="sidebar-item">
            <LayoutGrid size={16} />
            Rehberlerim<span>{guides.length}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full text-xs"
            disabled={!loaded}
            onClick={() => switchGuide(newDraft())}
          >
            <Plus size={15} />
            Yeni rehber
          </Button>
          <div className="saved-guides">
            {guides.map((guide) => (
              <button
                key={guide.id}
                type="button"
                onClick={() => switchGuide(guide)}
                className={cn(draft.id === guide.id && "selected")}
              >
                <BookOpen size={14} />
                <span>{guide.name}</span>
              </button>
            ))}
          </div>
          <div className="sidebar-note">
            <Sparkles size={20} />
            <strong>Bir kez hazırlayın.</strong>Misafirinizin ihtiyaç duyduğu bilgiler, her
            konaklamada elinin altında.
          </div>
        </aside>
        <div className="dashboard-content">
          <div className="dashboard-heading">
            <div>
              <span className="section-eyebrow">GÜZEL BİR KONAKLAMA BURADA BAŞLAR</span>
              <h1>{saved ? "Rehberiniz hazır." : "Evinize bir rehber hazırlayın."}</h1>
              <p>
                {saved
                  ? "Küçük detaylar tamam. Sıra misafirinizi karşılamakta."
                  : "Dört kısa adım. Daha rahat misafirler, daha az mesaj."}
              </p>
            </div>
            <span className={cn("draft-label", saved && "saved")}>
              <span />
              {saved ? "Kaydedildi" : dirty ? "Kaydedilmedi" : "Taslak"}
            </span>
          </div>
          {loadError && (
            <div className="storage-error" role="alert">
              {loadError}
            </div>
          )}
          {!loaded ? (
            <div className="editor-card p-8" aria-busy="true">
              Rehberleriniz yükleniyor…
            </div>
          ) : saved ? (
            <section className="save-result">
              <div className="save-result-heading">
                <span className="success-icon">
                  <CheckCheck size={26} />
                </span>
                <h2>İyi ev sahipliğine hoş geldiniz.</h2>
                <p>Rehberinizi görüntüleyin veya evinize özel QR kartını yazdırın.</p>
              </div>
              <QrGenerator guide={saved} />
              <div className="result-buttons">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSaved(null);
                    setStep(0);
                  }}
                >
                  <ArrowLeft size={15} />
                  Rehberi düzenle
                </Button>
                <Button type="button" variant="ghost" onClick={() => switchGuide(newDraft())}>
                  <Plus size={15} />
                  Yeni rehber oluştur
                </Button>
              </div>
            </section>
          ) : (
            <>
              <nav className="stepper" aria-label="Rehber oluşturma adımları">
                {steps.map((item, i) => (
                  <button
                    key={item.short}
                    type="button"
                    className={cn(step === i && "active", step > i && "complete")}
                    aria-current={step === i ? "step" : undefined}
                    onClick={() => moveStep(i)}
                  >
                    <div>
                      <span className="step-number">{step > i ? <Check size={14} /> : i + 1}</span>
                    </div>
                    <span>{item.short}</span>
                  </button>
                ))}
              </nav>
              <div className="editor-layout">
                <form className="editor-card" onSubmit={submit} noValidate>
                  <div className="editor-header">
                    <span className="section-eyebrow">ADIM {step + 1} / 4</span>
                    <h2 ref={heading} tabIndex={-1}>
                      {steps[step].title}
                    </h2>
                    <p>{steps[step].description}</p>
                  </div>
                  <div className="editor-fields">
                    {step === 0 && (
                      <>
                        <Field id="name" label="Evinizin adı" error={errors.name}>
                          <Input
                            {...inputProps("name")}
                            value={draft.name}
                            maxLength={100}
                            onChange={(e) => update("name", e.target.value)}
                            placeholder="Örn. Sapanca Doğa Bungalov #3"
                            autoComplete="organization"
                          />
                        </Field>
                        <Field
                          id="coverImage"
                          label="Kapak görseli bağlantısı"
                          error={errors.coverImage}
                          hint="Evinizi en iyi anlatan yatay bir fotoğraf seçin. HTTPS görsel bağlantısı kullanın."
                        >
                          <Input
                            {...inputProps("coverImage")}
                            value={draft.coverImage}
                            onChange={(e) => update("coverImage", e.target.value)}
                            type="url"
                            placeholder="https://…"
                          />
                          <div className="cover-thumb">
                            <PropertyImage
                              src={draft.coverImage}
                              alt="Ev kapak fotoğrafı önizlemesi"
                            />
                            <span>Misafirinizin ilk göreceği kare</span>
                          </div>
                        </Field>
                        <Field id="address" label="Açık adres" error={errors.address}>
                          <Textarea
                            {...inputProps("address")}
                            value={draft.address}
                            onChange={(e) => update("address", e.target.value)}
                            placeholder="Mahalle, sokak, kapı numarası, ilçe ve il"
                            rows={3}
                            autoComplete="street-address"
                          />
                        </Field>
                        <Field
                          id="mapsUrl"
                          label="Google Haritalar bağlantısı (isteğe bağlı)"
                          error={errors.mapsUrl}
                          hint="Boş bırakırsanız adresinizle harita araması açılır."
                        >
                          <Input
                            {...inputProps("mapsUrl")}
                            value={draft.mapsUrl}
                            onChange={(e) => update("mapsUrl", e.target.value)}
                            type="url"
                            placeholder="https://maps.google.com/…"
                          />
                        </Field>
                      </>
                    )}
                    {step === 1 && (
                      <>
                        <Field id="wifiName" label="Wi-Fi ağ adı" error={errors.wifiName}>
                          <Input
                            {...inputProps("wifiName")}
                            value={draft.wifiName}
                            maxLength={100}
                            onChange={(e) => update("wifiName", e.target.value)}
                            placeholder="Örn. DogaBungalov_3"
                            autoComplete="off"
                          />
                        </Field>
                        <Field
                          id="wifiPassword"
                          label="Wi-Fi şifresi"
                          error={errors.wifiPassword}
                          hint="Misafirleriniz bu şifreyi tek dokunuşla kopyalayabilir."
                        >
                          <div className="password-input">
                            <Input
                              {...inputProps("wifiPassword")}
                              type={showPassword ? "text" : "password"}
                              value={draft.wifiPassword}
                              maxLength={100}
                              onChange={(e) => update("wifiPassword", e.target.value)}
                              autoComplete="off"
                            />
                            <button
                              type="button"
                              aria-label={
                                showPassword ? "Wi-Fi şifresini gizle" : "Wi-Fi şifresini göster"
                              }
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                            </button>
                          </div>
                        </Field>
                        <Field
                          id="whatsapp"
                          label="WhatsApp numaranız"
                          error={errors.whatsapp}
                          hint="Ülke koduyla birlikte girin. Örn. +90 532 123 45 67."
                        >
                          <Input
                            {...inputProps("whatsapp")}
                            value={draft.whatsapp}
                            onChange={(e) => update("whatsapp", e.target.value)}
                            type="tel"
                            autoComplete="tel"
                            placeholder="+90 5XX XXX XX XX"
                          />
                        </Field>
                        <div className="local-notice">
                          <ShieldCheck size={19} className="mb-2" />
                          İlk rehberde örnek bilgiler bulunur. Misafirinize vermeden önce Wi-Fi
                          şifresini ve iletişim numarasını kendi bilgilerinizle değiştirin.
                        </div>
                      </>
                    )}
                    {step === 2 && (
                      <>
                        {draft.instructions.length === 0 && (
                          <p className="field-help">
                            Henüz talimat eklenmedi. İlk ev ipucunuzu aşağıdan ekleyin.
                          </p>
                        )}
                        {draft.instructions.map((item, i) => (
                          <div className="repeating-card" key={item.id}>
                            <div className="repeating-title">
                              TALİMAT {String(i + 1).padStart(2, "0")}
                              <button
                                type="button"
                                aria-label={`${i + 1}. talimatı kaldır`}
                                onClick={() =>
                                  update(
                                    "instructions",
                                    draft.instructions.filter((v) => v.id !== item.id),
                                  )
                                }
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                            <Field
                              id={`instructions.${i}.title`}
                              label="Başlık"
                              error={errors[`instructions.${i}.title`]}
                            >
                              <Input
                                {...inputProps(`instructions.${i}.title`)}
                                value={item.title}
                                maxLength={100}
                                onChange={(e) => editInstruction(i, "title", e.target.value)}
                                placeholder="Örn. Klima ve ısıtma ayarı"
                              />
                            </Field>
                            <Field
                              id={`instructions.${i}.description`}
                              label="Nasıl kullanılır?"
                              error={errors[`instructions.${i}.description`]}
                            >
                              <Textarea
                                {...inputProps(`instructions.${i}.description`)}
                                value={item.description}
                                maxLength={4000}
                                onChange={(e) => editInstruction(i, "description", e.target.value)}
                                rows={5}
                                placeholder="Misafirinize adım adım anlatın…"
                              />
                            </Field>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="add-row"
                          onClick={addInstruction}
                          disabled={draft.instructions.length >= 20}
                        >
                          <Plus size={16} />
                          Yeni talimat ekle
                        </button>
                        <p className="field-help">
                          En fazla 20 talimat ekleyebilirsiniz. Boş bir maddeyi kaydetmeden önce
                          kaldırın.
                        </p>
                      </>
                    )}
                    {step === 3 && (
                      <>
                        {draft.places.length === 0 && (
                          <p className="field-help">
                            Henüz öneri eklenmedi. Favori mekanınızı ekleyebilirsiniz.
                          </p>
                        )}
                        {draft.places.map((item, i) => (
                          <div className="repeating-card" key={item.id}>
                            <div className="repeating-title">
                              ÖNERİ {String(i + 1).padStart(2, "0")}
                              <button
                                type="button"
                                aria-label={`${i + 1}. öneriyi kaldır`}
                                onClick={() =>
                                  update(
                                    "places",
                                    draft.places.filter((v) => v.id !== item.id),
                                  )
                                }
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                            <Field
                              id={`places.${i}.name`}
                              label="Mekan adı"
                              error={errors[`places.${i}.name`]}
                            >
                              <Input
                                {...inputProps(`places.${i}.name`)}
                                value={item.name}
                                maxLength={100}
                                onChange={(e) => editPlace(i, "name", e.target.value)}
                                placeholder="Örn. Göl kenarında kahvaltı"
                              />
                            </Field>
                            <div className="form-row">
                              <Field id={`places.${i}.category`} label="Kategori">
                                <select
                                  id={`places.${i}.category`}
                                  value={item.category}
                                  onChange={(e) => editPlace(i, "category", e.target.value)}
                                >
                                  {Object.entries(categories).map(([value, label]) => (
                                    <option key={value} value={value}>
                                      {label}
                                    </option>
                                  ))}
                                </select>
                              </Field>
                              <Field
                                id={`places.${i}.distance`}
                                label="Mesafe"
                                error={errors[`places.${i}.distance`]}
                              >
                                <Input
                                  {...inputProps(`places.${i}.distance`)}
                                  value={item.distance}
                                  maxLength={40}
                                  onChange={(e) => editPlace(i, "distance", e.target.value)}
                                  placeholder="2 km · 5 dk"
                                />
                              </Field>
                            </div>
                            <Field
                              id={`places.${i}.mapsUrl`}
                              label="Google Haritalar bağlantısı"
                              error={errors[`places.${i}.mapsUrl`]}
                            >
                              <Input
                                {...inputProps(`places.${i}.mapsUrl`)}
                                type="url"
                                value={item.mapsUrl}
                                onChange={(e) => editPlace(i, "mapsUrl", e.target.value)}
                                placeholder="https://maps.google.com/…"
                              />
                            </Field>
                            <Field
                              id={`places.${i}.imageUrl`}
                              label="Fotoğraf bağlantısı (isteğe bağlı)"
                              error={errors[`places.${i}.imageUrl`]}
                            >
                              <Input
                                {...inputProps(`places.${i}.imageUrl`)}
                                type="url"
                                value={item.imageUrl}
                                onChange={(e) => editPlace(i, "imageUrl", e.target.value)}
                                placeholder="https://…"
                              />
                            </Field>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="add-row"
                          onClick={addPlace}
                          disabled={draft.places.length >= 20}
                        >
                          <Plus size={16} />
                          Yeni öneri ekle
                        </button>
                        <p className="field-help">
                          Nöbetçi eczane bilgileri günlük değişir. Güncelliğini kontrol edin veya
                          arama bağlantısı kullanın.
                        </p>
                      </>
                    )}
                  </div>
                  <div className="editor-footer">
                    {step > 0 ? (
                      <Button
                        variant="ghost"
                        type="button"
                        onClick={() => moveStep(step - 1)}
                        disabled={saving}
                      >
                        <ArrowLeft size={15} />
                        Geri
                      </Button>
                    ) : (
                      <span>İstediğiniz zaman düzenleyin.</span>
                    )}
                    <Button type="submit" disabled={saving || Boolean(loadError)}>
                      {saving ? "Kaydediliyor…" : step === 3 ? "Kaydet & QR oluştur" : "Devam et"}
                      {step === 3 ? <QrCode size={16} /> : <ArrowRight size={16} />}
                    </Button>
                  </div>
                </form>
                <aside className="editor-preview">
                  <div className="editor-preview-label">
                    <span>
                      <Smartphone size={14} />
                      MİSAFİR ÖNİZLEMESİ
                    </span>
                    <Eye size={14} />
                  </div>
                  <div className="mini-preview">
                    <div className="mini-preview-photo">
                      <PropertyImage src={draft.coverImage} alt="Rehber kapak önizlemesi" />
                    </div>
                    <div className="mini-preview-copy">
                      <span>Hoş geldiniz,</span>
                      <h3>{draft.name || "Evinizin adı"}</h3>
                      <p>
                        <MapPin size={11} className="inline" />{" "}
                        {draft.address.split(",").pop() || "Evinizin konumu"}
                      </p>
                      <div className="mini-wifi">
                        <Wifi size={20} />
                        <div>
                          <strong>Wi-Fi&apos;ye bağlan</strong>
                          <span>{draft.wifiName || "Wi-Fi ağınız"}</span>
                        </div>
                      </div>
                      <div className="mini-preview-list">
                        {draft.instructions.slice(0, 3).map((item) => (
                          <div key={item.id}>
                            <BookOpen size={13} />
                            <span>{item.title || "Yeni talimat"}</span>
                            <ChevronDown size={12} />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mini-preview-footer">konak.</div>
                  </div>
                  <p className="preview-tip">
                    <Info size={14} />
                    Değişiklikleriniz önizlemeye anında yansır. Tam rehber kaydettikten sonra hazır
                    olur.
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => switchGuide(newDraft())}
                  >
                    <Plus size={14} />
                    Yeni rehber
                  </Button>
                  {guides.length > 0 && (
                    <label className="form-field mt-3">
                      <span className="text-xs">Kayıtlı rehberler</span>
                      <select
                        aria-label="Kayıtlı rehber seç"
                        value={guides.some((g) => g.id === draft.id) ? draft.id : ""}
                        onChange={(e) => {
                          const guide = guides.find((g) => g.id === e.target.value);
                          if (guide) switchGuide(guide);
                        }}
                      >
                        <option value="" disabled>
                          Rehber seçin
                        </option>
                        {guides.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </aside>
              </div>
            </>
          )}
          {!saved && loaded && (
            <div className="mobile-guide-tools">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => switchGuide(newDraft())}
              >
                <Plus size={14} />
                Yeni rehber
              </Button>
              {guides.length > 0 && (
                <select
                  aria-label="Kayıtlı rehber seç"
                  value={guides.some((g) => g.id === draft.id) ? draft.id : ""}
                  onChange={(e) => {
                    const guide = guides.find((g) => g.id === e.target.value);
                    if (guide) switchGuide(guide);
                  }}
                >
                  <option value="" disabled>
                    Kayıtlı rehberler
                  </option>
                  {guides.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
