import { readFile } from "node:fs/promises";

export type ChannelProfile = {
  id: string;
  revision: number;
  formats: string[];
  locales: string[];
  mandatoryRemoteConstraintStatus: "verified" | "unknown" | "expired";
};

export type ChannelRecipe = {
  channelId: string;
  formatId: string;
  revision: number;
  stages: string[];
};

export type ChannelRegistry = {
  profiles: ChannelProfile[];
  recipes: ChannelRecipe[];
};

async function readJson<T>(url: URL): Promise<T> {
  return JSON.parse(await readFile(url, "utf8")) as T;
}

export async function loadChannelRegistry(): Promise<ChannelRegistry> {
  const profileCatalog = await readJson<{ profiles: ChannelProfile[] }>(
    new URL("../../../../profiles/channels/catalog.json", import.meta.url)
  );
  const recipeCatalog = await readJson<{ recipes: ChannelRecipe[] }>(
    new URL("../../../../recipes/catalog.json", import.meta.url)
  );
  return {
    profiles: profileCatalog.profiles.map(profile => ({
      ...profile,
      formats: [...profile.formats],
      locales: [...profile.locales]
    })),
    recipes: recipeCatalog.recipes.map(recipe => ({ ...recipe, stages: [...recipe.stages] }))
  };
}

export function validateChannelRegistry(registry: ChannelRegistry): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const profileIds = new Set<string>();
  const recipeKeys = new Set<string>();
  for (const profile of registry.profiles) {
    if (profileIds.has(profile.id)) errors.push(`duplicate-profile:${profile.id}`);
    profileIds.add(profile.id);
    if (["growth", "podcast", "baidu"].includes(profile.id)) {
      errors.push(`non-channel-profile:${profile.id}`);
    }
  }
  for (const recipe of registry.recipes) {
    const key = `${recipe.channelId}/${recipe.formatId}`;
    if (recipeKeys.has(key)) errors.push(`duplicate-recipe:${key}`);
    recipeKeys.add(key);
    const profile = registry.profiles.find(item => item.id === recipe.channelId);
    if (profile === undefined || !profile.formats.includes(recipe.formatId)) {
      errors.push(`orphan-recipe:${key}`);
    }
  }
  for (const profile of registry.profiles) {
    for (const format of profile.formats) {
      const key = `${profile.id}/${format}`;
      if (!recipeKeys.has(key)) errors.push(`missing-recipe:${key}`);
    }
  }
  if (registry.profiles.length !== 16) errors.push("profile-count");
  if (registry.recipes.length !== 39) errors.push("recipe-count");
  return { ok: errors.length === 0, errors };
}

export function resolveChannelRecipe(
  registry: ChannelRegistry,
  input: { channelId: string; formatId: string; requestedAction?: string }
):
  | { status: "resolved"; profile: ChannelProfile; recipe: ChannelRecipe; workingExportAllowed: true }
  | { status: "blocked"; reason: string; workingExportAllowed: true; profile: ChannelProfile; recipe: ChannelRecipe }
  | { status: "unsupported"; reason: string } {
  const profile = registry.profiles.find(item => item.id === input.channelId);
  if (profile === undefined) return { status: "unsupported", reason: "channel-not-registered" };
  const recipe = registry.recipes.find(
    item => item.channelId === input.channelId && item.formatId === input.formatId
  );
  if (recipe === undefined) return { status: "unsupported", reason: "format-not-registered" };
  if (
    input.requestedAction !== undefined
    && !["draft", "export"].includes(input.requestedAction)
    && profile.mandatoryRemoteConstraintStatus !== "verified"
  ) {
    return {
      status: "blocked",
      reason: "mandatory-constraint-unverified",
      workingExportAllowed: true,
      profile,
      recipe
    };
  }
  return { status: "resolved", profile, recipe, workingExportAllowed: true };
}
