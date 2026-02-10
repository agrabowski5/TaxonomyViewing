import { useState, useEffect } from "react";
import type { AppData, FuzzyMappingData } from "./types";

export function useData(): { data: AppData | null; loading: boolean; error: string | null } {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const base = import.meta.env.BASE_URL;
        const [hsTree, cpcTree, cnTree, htsTree, caTree, hsLookup, cpcLookup, cnLookup, htsLookup, caLookup, concordance, unspscTree, unspscLookup, unspscHsMapping, t1Tree, t1Lookup, t2Tree, t2Lookup] =
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
            fetch(`${base}data/unspsc-tree.json`).then((r) => r.json()),
            fetch(`${base}data/unspsc-lookup.json`).then((r) => r.json()),
            fetch(`${base}data/unspsc-hs-mapping.json`).then((r) => r.json()) as Promise<FuzzyMappingData>,
            fetch(`${base}data/t1-tree.json`).then((r) => r.json()),
            fetch(`${base}data/t1-lookup.json`).then((r) => r.json()),
            fetch(`${base}data/t2-tree.json`).then((r) => r.json()),
            fetch(`${base}data/t2-lookup.json`).then((r) => r.json()),
          ]);
        // Emission factors are optional — don't block app loading if missing
        const [emissionFactors, exiobaseFactors, ecoinventMapping] = await Promise.all([
          fetch(`${base}data/emission-factors.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`${base}data/exiobase-factors.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`${base}data/ecoinvent-mapping.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);
        setData({ hsTree, cpcTree, cnTree, htsTree, caTree, hsLookup, cpcLookup, cnLookup, htsLookup, caLookup, t1Tree, t1Lookup, t2Tree, t2Lookup, concordance, unspscTree, unspscLookup, unspscHsMapping, emissionFactors, exiobaseFactors, ecoinventMapping });
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
