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
        const [
          hsTree, cpcTree, cnTree, htsTree, caTree,
          hsLookup, cpcLookup, cnLookup, htsLookup, caLookup,
          concordance, unspscTree, unspscLookup, unspscHsMapping,
          t1Tree, t1Lookup, t2Tree, t2Lookup, t3Tree, t3Lookup,
          naicsTree, naicsLookup, isicTree, isicLookup,
          naceTree, naceLookup, cpaTree, cpaLookup,
          beaTree, beaLookup,
        ] = await Promise.all([
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
            fetch(`${base}data/t3-tree.json`).then((r) => r.json()),
            fetch(`${base}data/t3-lookup.json`).then((r) => r.json()),
            fetch(`${base}data/naics-tree.json`).then((r) => r.json()),
            fetch(`${base}data/naics-lookup.json`).then((r) => r.json()),
            fetch(`${base}data/isic-tree.json`).then((r) => r.json()),
            fetch(`${base}data/isic-lookup.json`).then((r) => r.json()),
            fetch(`${base}data/nace-tree.json`).then((r) => r.json()),
            fetch(`${base}data/nace-lookup.json`).then((r) => r.json()),
            fetch(`${base}data/cpa-tree.json`).then((r) => r.json()),
            fetch(`${base}data/cpa-lookup.json`).then((r) => r.json()),
            fetch(`${base}data/bea-tree.json`).then((r) => r.json()),
            fetch(`${base}data/bea-lookup.json`).then((r) => r.json()),
          ]);
        // Optional data — don't block app loading if missing
        const [emissionFactors, exiobaseFactors, exiobaseConcordance, ecoinventMapping, uslciCoverage, bafuCoverage, gabiCoverage,
               naicsHsConcordance, isicCpcConcordance, cpaHsConcordance, beaHsConcordance, beaNaicsConcordance] = await Promise.all([
          fetch(`${base}data/emission-factors.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`${base}data/exiobase-factors.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`${base}data/exiobase-concordance.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`${base}data/ecoinvent-mapping.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`${base}data/uslci-coverage.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`${base}data/bafu-coverage.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`${base}data/gabi-coverage.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`${base}data/naics-hs-concordance.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`${base}data/isic-cpc-concordance.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`${base}data/cpa-hs-concordance.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`${base}data/bea-hs-concordance.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`${base}data/bea-naics-concordance.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);
        setData({
          hsTree, cpcTree, cnTree, htsTree, caTree,
          hsLookup, cpcLookup, cnLookup, htsLookup, caLookup,
          t1Tree, t1Lookup, t2Tree, t2Lookup, t3Tree, t3Lookup,
          naicsTree, naicsLookup, isicTree, isicLookup,
          naceTree, naceLookup, cpaTree, cpaLookup,
          beaTree, beaLookup,
          concordance, unspscTree, unspscLookup, unspscHsMapping,
          naicsHsConcordance, isicCpcConcordance, cpaHsConcordance, beaHsConcordance, beaNaicsConcordance,
          emissionFactors, exiobaseFactors, exiobaseConcordance, ecoinventMapping, uslciCoverage, bafuCoverage, gabiCoverage,
        });
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
