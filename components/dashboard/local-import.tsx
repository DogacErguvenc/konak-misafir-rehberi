"use client";
import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getGuideRepository, type GuideRepository } from "@/lib/repositories/guide-repository";
import type { Guide } from "@/lib/types";

export function LocalImport({
  repository,
  workspaceName,
  onImported,
}: {
  repository: GuideRepository;
  workspaceName: string;
  onImported: () => Promise<void>;
}) {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void getGuideRepository()
      .list()
      .then((list) => {
        if (active) setGuides(list);
      })
      .catch(() => {
        if (active)
          setError("Bu tarayıcıdaki eski kayıtlar okunamadı. Mevcut verileriniz değiştirilmedi.");
      });
    return () => {
      active = false;
    };
  }, []);
  async function importSelected() {
    if (busy || !selected.length) return;
    setBusy(true);
    setError("");
    const completed: string[] = [];
    try {
      for (const guide of guides.filter((g) => selected.includes(g.id))) {
        await repository.save(guide, { importOnly: true, publish: false });
        completed.push(guide.id);
      }
      toast.success(
        `${completed.length} rehber hesabınıza aktarıldı. Kontrol edip yayımlayabilirsiniz.`,
      );
    } catch (error) {
      setError(
        `${completed.length} rehber aktarıldı. ${error instanceof Error ? error.message : "Aktarım tamamlanamadı."} Kalanları tekrar deneyebilirsiniz.`,
      );
    } finally {
      setGuides((previous) => previous.filter((g) => !completed.includes(g.id)));
      setSelected((previous) => previous.filter((id) => !completed.includes(id)));
      if (completed.length)
        await onImported().catch(() =>
          setError("Kayıtlar aktarıldı ancak liste yenilenemedi. Sayfayı yenileyin."),
        );
      setBusy(false);
    }
  }
  if (!guides.length && !error) return null;
  return (
    <details className="import-notice">
      <summary>
        <Upload size={17} />
        Bu tarayıcıdaki rehberleri hesabınıza aktarın{guides.length > 0 && ` (${guides.length})`}
      </summary>
      <p>
        Seçtiğiniz rehberler <strong>{workspaceName}</strong> işletmesine taslak olarak aktarılır.
        Eski kayıtlar silinmez; daha önce aktarılan kayıtlar tekrar yazılmaz.
      </p>
      <div className="import-options">
        {guides.map((guide) => (
          <label key={guide.id}>
            <input
              type="checkbox"
              checked={selected.includes(guide.id)}
              disabled={busy}
              onChange={(event) =>
                setSelected((previous) =>
                  event.target.checked
                    ? [...previous, guide.id]
                    : previous.filter((id) => id !== guide.id),
                )
              }
            />
            {guide.name}
          </label>
        ))}
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        disabled={!selected.length || busy}
        onClick={importSelected}
      >
        {busy ? "Aktarılıyor…" : `Seçilenleri aktar (${selected.length})`}
      </Button>
    </details>
  );
}
