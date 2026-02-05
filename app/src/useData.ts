import { useState, useEffect } from "react";
import type { AppData } from "./types";

export function useData(): { data: AppData | null; loading: boolean; error: string | null } {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const base = import.meta.env.BASE_URL;
        const [hsTree, cpcTree, cnTree, htsTree, caTree, hsLookup, cpcLookup, cnLookup, htsLookup, caLookup, concordance] =
          await Promise.all([
            fetch(`${base}data/hs-tree.json`).then((r) => r.json()),
            fetch(`${base}data/cpc-tree.json`).then((r) => r.json()),
            fetch(`${base}data/cn-tree.json`).then((r) => r.json()),
            fetch(`${base}data/hts-tree.json`).then((r) => r.json()),
            fetch(`${base}data/ca-tree.json`).then((r) => r.json()),
            fetch(`${base}data/hs-lookup.json`).then((r) => r.json()),
            fetch(`${base}data/cpc-lookup.json`).then((r) => r.json()),
            fetch(`${base}data/cn-lookup.json`).then((r) => r.json()),
            fetch(`${base}data/hts-lookup.json`).then((r) => r.json()),
            fetch(`${base}data/ca-lookup.json`).then((r) => r.json()),
            fetch(`${base}data/concordance.json`).then((r) => r.json()),
          ]);
        setData({ hsTree, cpcTree, cnTree, htsTree, caTree, hsLookup, cpcLookup, cnLookup, htsLookup, caLookup, concordance });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { data, loading, error };
}
