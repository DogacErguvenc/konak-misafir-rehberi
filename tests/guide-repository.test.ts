import test from "node:test";
import assert from "node:assert/strict";
import {
  LocalGuideRepository,
  STORAGE_KEY,
  parseStoredGuides,
} from "../lib/repositories/guide-repository";
import { mockGuide } from "../lib/mock-data";
import { guideSchema } from "../lib/types";
import { slugify, safeUrl, whatsappUrl } from "../lib/utils";
class MemoryStorage {
  data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}
const draft = (id: string, name = "Kaş Deniz Villası") => ({
  ...structuredClone(mockGuide),
  id,
  name,
  slug: "taslak",
});
test("Turkish names become readable URL slugs", () => {
  assert.equal(slugify("Çeşme IŞIK — Villa #3"), "cesme-isik-villa-3");
  assert.equal(slugify("🌿"), "ev-rehberi");
});
test("same-name properties get unique slugs; updates preserve printed QR URLs", async () => {
  const storage = new MemoryStorage();
  const repo = new LocalGuideRepository(storage);
  const first = await repo.save(draft("a"));
  const second = await repo.save(draft("b"));
  assert.equal(first.slug, "kas-deniz-villasi");
  assert.equal(second.slug, "kas-deniz-villasi-2");
  const renamed = await repo.save({ ...first, name: "Bodrum Bahçe" });
  assert.equal(renamed.slug, first.slug);
  const reopened = new LocalGuideRepository(storage);
  assert.equal((await reopened.findBySlug(first.slug))?.name, "Bodrum Bahçe");
  assert.equal((await reopened.list()).length, 2);
});
test("demo remains available without persisted data and unknown guides return null", async () => {
  const repo = new LocalGuideRepository(new MemoryStorage());
  assert.equal((await repo.findBySlug(mockGuide.slug))?.id, mockGuide.id);
  assert.equal(await repo.findBySlug("unknown"), null);
  assert.equal((await repo.list()).length, 0);
});
test("corrupted storage does not get silently overwritten", async () => {
  const storage = new MemoryStorage();
  storage.setItem(STORAGE_KEY, "broken-json");
  const repo = new LocalGuideRepository(storage);
  await assert.rejects(() => repo.save(draft("a")));
  assert.equal(storage.getItem(STORAGE_KEY), "broken-json");
  assert.throws(() => parseStoredGuides('{"unexpected":true}'));
});
test("storage write failure is reported and never presented as a successful save", async () => {
  const repo = new LocalGuideRepository({
    getItem: () => null,
    setItem: () => {
      throw new Error("QuotaExceededError");
    },
  });
  await assert.rejects(() => repo.save(draft("a")), /kaydedilemedi/);
});
test("blank required fields and unsafe URLs are rejected before storing", async () => {
  const storage = new MemoryStorage();
  const repo = new LocalGuideRepository(storage);
  await assert.rejects(() =>
    repo.save({ ...draft("a"), name: "", coverImage: "javascript:alert(1)" }),
  );
  assert.equal(storage.getItem(STORAGE_KEY), null);
  assert.equal(
    guideSchema.safeParse({
      ...draft("b"),
      places: [{ ...mockGuide.places[0], mapsUrl: "data:text/html,test" }],
    }).success,
    false,
  );
});
test("external links only accept http(s); WhatsApp accepts Turkish number formats", () => {
  assert.equal(safeUrl("javascript:alert(1)"), "#");
  assert.equal(safeUrl("https://maps.google.com/"), "https://maps.google.com/");
  for (const phone of ["0532 123 45 67", "5321234567", "+90 532 123 45 67", "00905321234567"])
    assert.equal(whatsappUrl(phone, "Merhaba"), "https://wa.me/905321234567?text=Merhaba");
});
