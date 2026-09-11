import { guideSchema, type Guide } from "@/lib/types";
import { mockGuide } from "@/lib/mock-data";
import { slugify } from "@/lib/utils";
import { isCloudConfigured } from "@/lib/supabase/config";
import { getSupabaseClient } from "@/lib/supabase/client";
import { findPublishedGuide } from "./cloud-guide-repository";

export type SaveOptions = { publish?: boolean; importOnly?: boolean };
export interface GuideRepository {
  list(): Promise<Guide[]>;
  findBySlug(slug: string): Promise<Guide | null>;
  save(guide: Guide, options?: SaveOptions): Promise<Guide>;
  unpublish?(guide: Guide): Promise<Guide>;
}
export const STORAGE_KEY = "konak.guides.v1";
export function parseStoredGuides(raw: string | null): Guide[] {
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed))
    throw new Error("Kayıt biçimi okunamadı. Tarayıcı verileriniz değiştirilmedi.");
  return parsed.map((item) => guideSchema.parse(item));
}
export function uniqueSlug(name: string, id: string, guides: Guide[]): string {
  const base = slugify(name);
  let slug = base;
  let suffix = 2;
  while (guides.some((g) => g.slug === slug && g.id !== id)) slug = `${base}-${suffix++}`;
  return slug;
}
export class LocalGuideRepository implements GuideRepository {
  constructor(private storage: Pick<Storage, "getItem" | "setItem">) {}
  async list() {
    return parseStoredGuides(this.storage.getItem(STORAGE_KEY));
  }
  async findBySlug(slug: string) {
    return (
      (await this.list()).find((g) => g.slug === slug) ??
      (slug === mockGuide.slug ? structuredClone(mockGuide) : null)
    );
  }
  async save(input: Guide) {
    const guide = guideSchema.parse(input);
    const stored = await this.list();
    const previous = stored.find((g) => g.id === guide.id);
    // Keep printed QR links stable after a property rename; reserve the demo slug.
    const slug = previous?.slug ?? uniqueSlug(guide.name, guide.id, [...stored, mockGuide]);
    const location =
      guide.address
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .slice(-1)[0] || guide.location;
    const result = { ...guide, slug, location, updatedAt: new Date().toISOString() };
    try {
      this.storage.setItem(
        STORAGE_KEY,
        JSON.stringify([...stored.filter((g) => g.id !== guide.id), result]),
      );
    } catch {
      throw new Error("Rehber kaydedilemedi. Tarayıcı depolaması dolu veya engellenmiş olabilir.");
    }
    return result;
  }
}
export function getGuideRepository(): GuideRepository {
  return new LocalGuideRepository(window.localStorage);
}

export async function getGuestGuide(slug: string) {
  if (slug === mockGuide.slug) return structuredClone(mockGuide);
  // A missing or unpublished cloud record must never expose a browser draft.
  if (isCloudConfigured()) return findPublishedGuide(getSupabaseClient(), slug);
  return getGuideRepository().findBySlug(slug);
}
