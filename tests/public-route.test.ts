import test from "node:test";
import assert from "node:assert/strict";
import { resolvePublicRoute } from "../lib/public-route";
import { LocalGuideRepository } from "../lib/repositories/guide-repository";
import { mockGuide } from "../lib/mock-data";

test("new guide QR paths resolve without a pre-generated HTML file", async () => {
  const entries = new Map<string, string>();
  const repository = new LocalGuideRepository({
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => {
      entries.set(key, value);
    },
  });
  const guide = await repository.save({ ...mockGuide, id: "new-property" });
  assert.equal(guide.slug, "sapanca-doga-bungalov-3");
  for (const ending of ["", "/"]) {
    const route = resolvePublicRoute(`/rehber/${guide.slug}${ending}`);
    assert.deepEqual(route, { kind: "guide", slug: guide.slug });
    if (route.kind === "guide")
      assert.equal((await repository.findBySlug(route.slug))?.id, guide.id);
  }
});

test("homepage and invalid paths do not resolve to an unrelated guide", () => {
  assert.deepEqual(resolvePublicRoute("/"), { kind: "home" });
  for (const pathname of [
    "/unknown",
    "/rehber",
    "/rehber/",
    "/rehber/a/b",
    "/rehber/a%2Fb",
    "/rehber/%",
    "/rehber/..",
    "/rehber/test.js",
  ]) {
    assert.deepEqual(resolvePublicRoute(pathname), { kind: "not-found" });
  }
});

test("a valid but unsaved guide does not fall back to demo content", async () => {
  const repository = new LocalGuideRepository({ getItem: () => null, setItem: () => {} });
  const route = resolvePublicRoute("/rehber/not-saved");
  assert.equal(route.kind, "guide");
  if (route.kind === "guide") assert.equal(await repository.findBySlug(route.slug), null);
});
