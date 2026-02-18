import type { BuilderState, PersistedBuilderData } from "./types";

const STORAGE_KEY = "customTaxonomy_v1";

export function saveBuilderState(state: BuilderState): void {
  const data: PersistedBuilderData = {
    version: 1,
    state,
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function loadBuilderState(): BuilderState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: PersistedBuilderData = JSON.parse(raw);
    if (data.version !== 1) return null;
    return data.state;
  } catch {
    return null;
  }
}

export function clearBuilderState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silently fail
  }
}
