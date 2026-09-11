import { guideSchema, type Guide } from "./types";
type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: unknown) => unknown | Promise<unknown>;
};
type ModelContext = {
  registerTool: (tool: Tool, options?: { signal?: AbortSignal }) => void | Promise<void>;
};
export function registerGuideTools(actions: {
  save: (guide: Guide) => Promise<Guide>;
  list: () => Promise<Guide[]>;
  cloud?: boolean;
}) {
  const context = (document as Document & { modelContext?: ModelContext }).modelContext;
  if (!context?.registerTool) return;
  const lifecycle = new AbortController();
  const tools: Tool[] = [
    {
      name: actions.cloud ? "list_workspace_guest_guides" : "list_local_guest_guides",
      title: "List saved guest guides",
      description: actions.cloud
        ? "List guides in the signed-in user's current workspace. Does not reveal Wi-Fi passwords or contact details."
        : "List guides saved in this browser. Does not reveal Wi-Fi passwords or contact details.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async () => ({
        guides: (await actions.list()).map(({ id, name, slug }) => ({ id, name, slug })),
      }),
    },
    {
      name: actions.cloud ? "save_workspace_guest_draft" : "save_local_guest_guide",
      title: actions.cloud
        ? "Save a private guest guide draft"
        : "Save a guest guide in this browser",
      description: actions.cloud
        ? "Validate and save a draft in the current workspace. Existing records require their current revision. Never publishes changes to guests."
        : "Validate and save a complete guide in this browser and display its QR card in the dashboard. This does not publish data across devices.",
      inputSchema: {
        type: "object",
        properties: {
          guide: {
            type: "object",
            description:
              "Complete Guide record with id, slug, name, coverImage, address, location, mapsUrl, wifiName, wifiPassword, whatsapp, checkIn, checkOut, instructions, places, updatedAt.",
          },
        },
        required: ["guide"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute: async (input) => {
        if (!input || typeof input !== "object" || !("guide" in input))
          throw new Error("guide is required");
        const parsed = guideSchema.parse(input.guide);
        const saved = await actions.save(parsed);
        return {
          id: saved.id,
          slug: saved.slug,
          status: actions.cloud ? "draft_saved" : "saved_locally",
        };
      },
    },
  ];
  for (const tool of tools) {
    try {
      void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(
        () => {},
      );
    } catch {
      /* unsupported runtime: ordinary UI remains available */
    }
  }
  return () => lifecycle.abort();
}
