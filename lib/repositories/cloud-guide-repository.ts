import type { SupabaseClient } from "@supabase/supabase-js";
import { guideSchema, type Guide } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { accountError } from "@/lib/supabase/errors";
import type { GuideRepository, SaveOptions } from "./guide-repository";

export class CloudGuideRepository implements GuideRepository {
  constructor(
    private client: SupabaseClient,
    private workspaceId: string,
  ) {}
  async list() {
    const { data, error } = await this.client.rpc("list_workspace_guides", {
      p_workspace_id: this.workspaceId,
    });
    if (error) throw new Error(accountError(error));
    return guideSchema.array().parse(data);
  }
  async findBySlug(slug: string) {
    return findPublishedGuide(this.client, slug);
  }
  async save(input: Guide, options: SaveOptions = {}) {
    const guide = guideSchema.parse(input);
    const { data, error } = await this.client.rpc("save_workspace_guide", {
      p_workspace_id: this.workspaceId,
      p_source_id: guide.id,
      p_slug: guide.slug === "taslak" ? slugify(guide.name) : guide.slug,
      p_data: guide,
      p_publish: options.publish ?? true,
      p_import: options.importOnly ?? false,
      p_revision: guide.revision ?? 0,
    });
    if (error) throw new Error(accountError(error));
    return guideSchema.parse(data);
  }
  async unpublish(guide: Guide) {
    const { data, error } = await this.client.rpc("unpublish_workspace_guide", {
      p_workspace_id: this.workspaceId,
      p_source_id: guide.id,
      p_revision: guide.revision ?? 0,
    });
    if (error) throw new Error(accountError(error));
    return guideSchema.parse(data);
  }
}

export async function findPublishedGuide(client: SupabaseClient, slug: string) {
  const { data, error } = await client.rpc("get_published_guide", { p_slug: slug });
  if (error) throw new Error(accountError(error));
  return data === null ? null : guideSchema.parse(data);
}
