import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { TreeApi } from "react-arborist";
import { useData } from "./useData";
import { TaxonomyTree } from "./TaxonomyTree";
import { BuilderProvider, useBuilder } from "./builder/context";
import { BuilderBanner } from "./builder/BuilderBanner";
import { BuilderTaxonomyPanel } from "./builder/BuilderTaxonomyPanel";
import { NodeCreationGuide } from "./builder/NodeCreationGuide";

import { MappingsTab } from "./builder/MappingsTab";
import { ExportPanel } from "./builder/ExportPanel";
import { ResetDialog } from "./builder/ResetDialog";
import { BaseTaxonomyDialog } from "./builder/BaseTaxonomyDialog";
import { TaxonomyLibraryDialog } from "./builder/TaxonomyLibraryDialog";
import { AboutSection } from "./AboutSection";
import type { AboutSectionHandle, TabNavContext } from "./AboutSection";
import type { TreeNode, LookupEntry, TaxonomyType, AppData, ConcordanceData, ConcordanceMapping, EmissionFactorEntry, ExiobaseFactorEntry, ExiobaseConcordance, FuzzyMappingData, EcoinventMapping, EcoinventCodeMapping, UslciCoverage, UslciCoverageEntry, BafuCoverage, BafuCoverageEntry, GabiCoverage, GabiCoverageEntry, LciUnitStats, GenericConcordance, CoverageInfo } from "./types";
import type { CustomNode } from "./builder/types";
import "./App.css";
import "./builder/builder.css";

// Color palette for section-based coloring
const SECTION_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316",
  "#eab308", "#84cc16", "#22c55e", "#10b981", "#14b8a6",
  "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", "#a855f7",
  "#d946ef", "#f59e0b", "#10b981", "#0891b2", "#7c3aed",
  "#db2777", "#dc2626",
];

function getSectionColor(index: number): string {
  return SECTION_COLORS[index % SECTION_COLORS.length];
}

function buildColorMap(tree: TreeNode[]): Record<string, string> {
  const colorMap: Record<string, string> = {};
  tree.forEach((section, index) => {
    const color = getSectionColor(index);
    const assignColor = (node: TreeNode) => {
      colorMap[node.id] = color;
      if (node.children) node.children.forEach(assignColor);
    };
    assignColor(section);
  });
  return colorMap;
}

const ALL_TAXONOMIES: TaxonomyType[] = ["hs", "cpc", "cn", "hts", "ca", "unspsc", "t1", "t2", "naics", "isic", "nace", "cpa", "bea"];

const TAXONOMY_INFO: Record<TaxonomyType, { fullName: string; legend: string; taxonomyClass: string; label: string }> = {
  hs: {
    fullName: "Harmonized System (International)",
    legend: "Sections \u2192 Chapters \u2192 Headings \u2192 Subheadings",
    taxonomyClass: "hs",
    label: "HS",
  },
  cpc: {
    fullName: "Central Product Classification Ver. 2.1",
    legend: "Sections \u2192 Divisions \u2192 Groups \u2192 Classes \u2192 Subclasses",
    taxonomyClass: "cpc",
    label: "CPC",
  },
  cn: {
    fullName: "Combined Nomenclature (EU)",
    legend: "Sections \u2192 Chapters \u2192 Headings \u2192 Subheadings \u2192 CN8",
    taxonomyClass: "cn",
    label: "CN",
  },
  hts: {
    fullName: "Harmonized Tariff Schedule (US)",
    legend: "Sections \u2192 Headings \u2192 Subheadings \u2192 Tariff Lines",
    taxonomyClass: "hts",
    label: "HTS",
  },
  ca: {
    fullName: "Canadian Customs Tariff",
    legend: "Sections \u2192 Chapters \u2192 Headings \u2192 Subheadings \u2192 Items",
    taxonomyClass: "ca",
    label: "CA",
  },
  unspsc: {
    fullName: "UN Standard Products and Services Code",
    legend: "Segments \u2192 Families \u2192 Classes \u2192 Commodities",
    taxonomyClass: "unspsc",
    label: "UNSPSC",
  },
  t1: {
    fullName: "Taxonomy 1 (HTS Goods + CPC Services)",
    legend: "Goods: Sections \u2192 Headings \u2192 Tariff Lines | Services: Sections \u2192 Divisions \u2192 Groups",
    taxonomyClass: "t1",
    label: "T1",
  },
  t2: {
    fullName: "Taxonomy 2 (CPC Backbone + HTS Detail)",
    legend: "CPC Sections \u2192 Divisions \u2192 Groups \u2192 Classes \u2192 Subclasses \u2192 HTS Tariff Lines",
    taxonomyClass: "t2",
    label: "T2",
  },
  naics: {
    fullName: "NAICS 2022 (North American Industry Classification)",
    legend: "Sectors \u2192 Subsectors \u2192 Industry Groups \u2192 Industries \u2192 National Industries",
    taxonomyClass: "naics",
    label: "NAICS",
  },
  isic: {
    fullName: "ISIC Rev. 4 (Intl Standard Industrial Classification)",
    legend: "Sections \u2192 Divisions \u2192 Groups \u2192 Classes",
    taxonomyClass: "isic",
    label: "ISIC",
  },
  nace: {
    fullName: "NACE Rev. 2 (EU Economic Activities)",
    legend: "Sections \u2192 Divisions \u2192 Groups \u2192 Classes",
    taxonomyClass: "nace",
    label: "NACE",
  },
  cpa: {
    fullName: "CPA 2.1 (Classification of Products by Activity)",
    legend: "Sections \u2192 Divisions \u2192 Groups \u2192 Classes \u2192 Categories \u2192 Subcategories",
    taxonomyClass: "cpa",
    label: "CPA",
  },
  bea: {
    fullName: "BEA Input-Output Commodity Codes (US)",
    legend: "Sectors \u2192 Summary \u2192 Detail",
    taxonomyClass: "bea",
    label: "BEA",
  },
};

// Find a CustomNode by ID in the builder's custom tree
function findCustomNodeById(tree: CustomNode[], id: string): CustomNode | null {
  for (const n of tree) {
    if (n.id === id) return n;
    if (n.children.length > 0) {
      const found = findCustomNodeById(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

// Find the ancestor path (list of IDs from root to parent) for a target node in tree data
function findPathToNode(tree: TreeNode[], targetId: string): string[] {
  const path: string[] = [];
  function search(nodes: TreeNode[]): boolean {
    for (const node of nodes) {
      if (node.id === targetId) return true;
      if (node.children) {
        path.push(node.id);
        if (search(node.children)) return true;
        path.pop();
      }
    }
    return false;
  }
  search(tree);
  return path;
}

// Strip dots, spaces from a code to get pure digits
function stripCode(code: string): string {
  return code.replace(/[\.\s\-]/g, "");
}

// HS-family taxonomies share the same base HS codes (first 6 digits)
const HS_FAMILY: TaxonomyType[] = ["hs", "cn", "hts", "ca"];

// New taxonomy families for concordance-based mapping
const CONCORDANCE_TAXONOMIES: TaxonomyType[] = ["naics", "isic", "nace", "cpa", "bea"];

// Resolve a new-taxonomy code to HS-6 codes via its concordance
function resolveToHsCodes(
  code: string,
  taxonomy: TaxonomyType,
  naicsHsConcordance: GenericConcordance | null,
  isicCpcConcordance: GenericConcordance | null,
  cpaHsConcordance: GenericConcordance | null,
  beaHsConcordance: GenericConcordance | null,
  concordance: ConcordanceData,
): string[] {
  const clean = stripCode(code);
  if (taxonomy === "naics" && naicsHsConcordance) {
    const mappings = naicsHsConcordance.forward[clean];
    if (mappings) return mappings.map((m) => m.code);
  }
  if ((taxonomy === "isic" || taxonomy === "nace") && isicCpcConcordance) {
    // ISIC/NACE -> CPC -> HS (two-hop chain)
    const cpcMappings = isicCpcConcordance.forward[clean];
    if (cpcMappings) {
      const hsCodes: string[] = [];
      for (const cm of cpcMappings) {
        const hsMappings = concordance.cpcToHs[cm.code];
        if (hsMappings) {
          for (const hm of hsMappings) hsCodes.push(hm.code);
        }
      }
      return hsCodes;
    }
  }
  if (taxonomy === "cpa" && cpaHsConcordance) {
    const mappings = cpaHsConcordance.forward[clean];
    if (mappings) return mappings.map((m) => m.code);
  }
  if (taxonomy === "bea" && beaHsConcordance) {
    const mappings = beaHsConcordance.forward[clean];
    if (mappings) return mappings.map((m) => m.code);
  }
  return [];
}

// Resolve an HS-6 code to a new-taxonomy code via reverse concordance
function resolveFromHsCode(
  hsCode: string,
  taxonomy: TaxonomyType,
  naicsHsConcordance: GenericConcordance | null,
  isicCpcConcordance: GenericConcordance | null,
  cpaHsConcordance: GenericConcordance | null,
  beaHsConcordance: GenericConcordance | null,
  concordance: ConcordanceData,
): string | null {
  if (taxonomy === "naics" && naicsHsConcordance) {
    const mappings = naicsHsConcordance.reverse[hsCode];
    if (mappings && mappings.length > 0) return mappings[0].code;
  }
  if ((taxonomy === "isic" || taxonomy === "nace") && isicCpcConcordance) {
    // HS -> CPC -> ISIC/NACE (two-hop reverse)
    const cpcMappings = concordance.hsToCpc[hsCode];
    if (cpcMappings) {
      for (const cm of cpcMappings) {
        const isicMappings = isicCpcConcordance.reverse[cm.code];
        if (isicMappings && isicMappings.length > 0) return isicMappings[0].code;
      }
    }
  }
  if (taxonomy === "cpa" && cpaHsConcordance) {
    const mappings = cpaHsConcordance.reverse[hsCode];
    if (mappings && mappings.length > 0) return mappings[0].code;
  }
  if (taxonomy === "bea" && beaHsConcordance) {
    const mappings = beaHsConcordance.reverse[hsCode];
    if (mappings && mappings.length > 0) return mappings[0].code;
  }
  return null;
}

// T1 helper: detect whether a T1 node originated from HTS or CPC services
function getT1Origin(nodeId: string, lookup: Record<string, LookupEntry>, code: string): "hts" | "cpc" | null {
  // Check node ID prefix first
  if (nodeId.startsWith("t1-svc-")) return "cpc";
  if (nodeId.startsWith("t1-")) {
    // Could be HTS — check lookup for SVC-prefixed key (CPC) vs regular (HTS)
    const svcKey = `SVC${stripCode(code)}`;
    if (lookup[svcKey]?.origin === "cpc") return "cpc";
    return "hts";
  }
  return null;
}

// Get the original code for concordance/HS lookup from a T1 node
function getT1OriginalCode(code: string, origin: "hts" | "cpc", lookup: Record<string, LookupEntry>): string {
  if (origin === "cpc") {
    const svcKey = `SVC${stripCode(code)}`;
    return lookup[svcKey]?.originalCode ?? stripCode(code);
  }
  return code; // HTS codes are used as-is
}

// T2 helper: detect whether a T2 node originated from CPC backbone or HTS detail
function getT2Origin(nodeId: string): "cpc" | "hts" | null {
  if (nodeId.startsWith("t2-hts-")) return "hts";
  if (nodeId.startsWith("t2-")) return "cpc";
  return null;
}

// Extract the HS 6-digit base from any HS-family code
function getHsBase(code: string, taxonomy: TaxonomyType): string | null {
  if (!HS_FAMILY.includes(taxonomy)) return null;
  const clean = stripCode(code);
  // Section-level (Roman numerals) or non-numeric: no mapping
  if (!/^\d+$/.test(clean)) return null;
  // Return up to 6 digits
  return clean.substring(0, Math.min(6, clean.length));
}

interface MappedEntry {
  taxonomy: TaxonomyType;
  code: string;
  description: string;
  nodeId: string | null;
  similarity?: number;
  fuzzy?: boolean;
}

// Find the best matching entry in a target taxonomy for a given HS base code
function findMappedEntry(
  hsBase: string,
  targetTaxonomy: TaxonomyType,
  lookup: Record<string, LookupEntry>,
  concordance?: ConcordanceData,
): MappedEntry | null {
  // CPC uses concordance table, not HS prefix matching
  if (targetTaxonomy === "cpc") {
    if (!concordance) return null;
    for (let len = Math.min(6, hsBase.length); len >= 4; len -= 2) {
      const prefix = hsBase.substring(0, len);
      const mappings = concordance.hsToCpc[prefix];
      if (mappings && mappings.length > 0) {
        // Prefer non-partial matches
        const sorted = [...mappings].sort((a, b) =>
          a.cpcPartial === b.cpcPartial ? 0 : a.cpcPartial ? 1 : -1
        );
        const best = sorted[0];
        const entry = lookup[best.code];
        if (entry) {
          return {
            taxonomy: "cpc",
            code: best.code,
            description: entry.description,
            nodeId: `cpc-${best.code}`,
          };
        }
      }
    }
    return null;
  }

  // Try progressively shorter prefixes: 6-digit, 4-digit, 2-digit
  for (let len = Math.min(6, hsBase.length); len >= 2; len -= 2) {
    const prefix = hsBase.substring(0, len);
    // For HS: lookup keys are pure digits
    if (targetTaxonomy === "hs") {
      if (lookup[prefix]) {
        return {
          taxonomy: targetTaxonomy,
          code: prefix,
          description: lookup[prefix].description,
          nodeId: `hs-${prefix}`,
        };
      }
    }
    // For CN: lookup keys are pure digits (no spaces)
    if (targetTaxonomy === "cn") {
      if (lookup[prefix]) {
        return {
          taxonomy: targetTaxonomy,
          code: prefix,
          description: lookup[prefix].description,
          nodeId: `cn-${prefix}`,
        };
      }
      // CN may have 8-digit codes (prefix + "00") for subheadings without further subdivision
      if (prefix.length === 6) {
        const cn8 = prefix + "00";
        if (lookup[cn8]) {
          return {
            taxonomy: targetTaxonomy,
            code: cn8,
            description: lookup[cn8].description,
            nodeId: `cn-${cn8}`,
          };
        }
      }
    }
    // For HTS: lookup keys have dots (e.g., "0101.21.00")
    if (targetTaxonomy === "hts") {
      // Try exact match first (pure digits as lookup key, e.g., "0101")
      if (lookup[prefix]) {
        return {
          taxonomy: targetTaxonomy,
          code: prefix,
          description: lookup[prefix].description,
          nodeId: `hts-${prefix}`,
        };
      }
      // Try dotted format for 6+ digit codes
      if (prefix.length >= 6) {
        const dotted = `${prefix.substring(0, 4)}.${prefix.substring(4, 6)}.00`;
        if (lookup[dotted]) {
          return {
            taxonomy: targetTaxonomy,
            code: dotted,
            description: lookup[dotted].description,
            nodeId: `hts-${stripCode(dotted)}`,
          };
        }
      }
      // Try 4-digit heading with .00.00 suffix (e.g., "2606" → "2606.00.00")
      if (prefix.length >= 4) {
        const four = prefix.substring(0, 4);
        if (lookup[four]) {
          return {
            taxonomy: targetTaxonomy,
            code: four,
            description: lookup[four].description,
            nodeId: `hts-${four}`,
          };
        }
        const dotted4 = `${four}.00.00`;
        if (lookup[dotted4]) {
          return {
            taxonomy: targetTaxonomy,
            code: dotted4,
            description: lookup[dotted4].description,
            nodeId: `hts-${stripCode(dotted4)}`,
          };
        }
      }
    }
    // For CA: lookup keys have dots (e.g., "01.01", "0101.21.00")
    if (targetTaxonomy === "ca") {
      // Try chapter format "01"
      if (prefix.length === 2 && lookup[prefix]) {
        return {
          taxonomy: targetTaxonomy,
          code: prefix,
          description: lookup[prefix].description,
          nodeId: `ca-${prefix}`,
        };
      }
      // Try heading format "01.01"
      if (prefix.length >= 4) {
        const heading = `${prefix.substring(0, 2)}.${prefix.substring(2, 4)}`;
        if (lookup[heading]) {
          return {
            taxonomy: targetTaxonomy,
            code: heading,
            description: lookup[heading].description,
            nodeId: `ca-${stripCode(heading)}`,
          };
        }
      }
      // Try 8-digit format "0101.21.00"
      if (prefix.length >= 6) {
        const eight = `${prefix.substring(0, 4)}.${prefix.substring(4, 6)}.00`;
        if (lookup[eight]) {
          return {
            taxonomy: targetTaxonomy,
            code: eight,
            description: lookup[eight].description,
            nodeId: `ca-${stripCode(eight)}`,
          };
        }
      }
    }
  }
  return null;
}

// Find fuzzy-matched entries between UNSPSC and HS
function findFuzzyMappedEntries(
  sourceCode: string,
  sourceTaxonomy: TaxonomyType,
  targetTaxonomy: TaxonomyType,
  fuzzyMapping: FuzzyMappingData,
  targetLookup: Record<string, LookupEntry>,
): MappedEntry[] {
  if (sourceTaxonomy === "unspsc" && (targetTaxonomy === "hs" || HS_FAMILY.includes(targetTaxonomy))) {
    // UNSPSC → HS: try progressively shorter codes (8→6→4 digits)
    for (let len = sourceCode.length; len >= 4; len -= 2) {
      const prefix = sourceCode.substring(0, len);
      const matches = fuzzyMapping.unspscToHs[prefix];
      if (matches && matches.length > 0) {
        const results: MappedEntry[] = [];
        for (const m of matches) {
          const entry = targetLookup[m.code];
          if (entry) {
            results.push({
              taxonomy: targetTaxonomy,
              code: m.code,
              description: entry.description,
              nodeId: `hs-${m.code}`,
              similarity: m.similarity,
              fuzzy: true,
            });
          }
        }
        return results;
      }
    }
  }

  if (HS_FAMILY.includes(sourceTaxonomy) && targetTaxonomy === "unspsc") {
    // HS → UNSPSC: try progressively shorter HS codes
    const clean = stripCode(sourceCode);
    for (let len = Math.min(6, clean.length); len >= 4; len -= 2) {
      const prefix = clean.substring(0, len);
      const matches = fuzzyMapping.hsToUnspsc[prefix];
      if (matches && matches.length > 0) {
        const results: MappedEntry[] = [];
        for (const m of matches.slice(0, 5)) {
          const entry = targetLookup[m.code];
          if (entry) {
            results.push({
              taxonomy: "unspsc" as TaxonomyType,
              code: m.code,
              description: entry.description,
              nodeId: `unspsc-${m.code}`,
              similarity: m.similarity,
              fuzzy: true,
            });
          }
        }
        return results;
      }
    }
  }

  return [];
}

// Look up emission factor for a selected node
function getEmissionFactor(
  node: TreeNode,
  taxonomy: TaxonomyType,
  emissionFactors: Record<string, EmissionFactorEntry> | null,
  concordance: ConcordanceData,
): EmissionFactorEntry | null {
  if (!emissionFactors) return null;

  if (HS_FAMILY.includes(taxonomy)) {
    const hsBase = getHsBase(node.code, taxonomy);
    if (!hsBase || hsBase.length < 6) return null;
    return emissionFactors[hsBase] ?? null;
  }

  if (taxonomy === "cpc") {
    const cleanCpc = stripCode(node.code);
    for (let len = cleanCpc.length; len >= 4; len--) {
      const prefix = cleanCpc.substring(0, len);
      const hsMappings = concordance.cpcToHs[prefix];
      if (hsMappings && hsMappings.length > 0) {
        const hsCode = hsMappings[0].code;
        if (emissionFactors[hsCode]) return emissionFactors[hsCode];
      }
    }
  }

  if (taxonomy === "t2") {
    const origin = getT2Origin(node.id);
    if (origin === "hts") {
      const hsBase = getHsBase(node.code, "hts");
      if (hsBase && hsBase.length >= 6) return emissionFactors[hsBase] ?? null;
    } else if (origin === "cpc") {
      const cleanCpc = stripCode(node.code);
      for (let len = cleanCpc.length; len >= 4; len--) {
        const prefix = cleanCpc.substring(0, len);
        const hsMappings = concordance.cpcToHs[prefix];
        if (hsMappings && hsMappings.length > 0) {
          const hsCode = hsMappings[0].code;
          if (emissionFactors[hsCode]) return emissionFactors[hsCode];
        }
      }
    }
  }

  return null;
}

// Look up Exiobase emission factor for a selected node (keyed by HS 2-digit chapter)
function getExiobaseFactor(
  node: TreeNode,
  taxonomy: TaxonomyType,
  exiobaseFactors: Record<string, ExiobaseFactorEntry> | null,
  concordance: ConcordanceData,
): ExiobaseFactorEntry | null {
  if (!exiobaseFactors) return null;

  if (HS_FAMILY.includes(taxonomy)) {
    const hsBase = getHsBase(node.code, taxonomy);
    if (!hsBase || hsBase.length < 2) return null;
    const chapter = hsBase.substring(0, 2);
    return exiobaseFactors[chapter] ?? null;
  }

  if (taxonomy === "cpc") {
    const cleanCpc = stripCode(node.code);
    for (let len = cleanCpc.length; len >= 4; len--) {
      const prefix = cleanCpc.substring(0, len);
      const hsMappings = concordance.cpcToHs[prefix];
      if (hsMappings && hsMappings.length > 0) {
        const chapter = hsMappings[0].code.substring(0, 2);
        if (exiobaseFactors[chapter]) return exiobaseFactors[chapter];
      }
    }
  }

  if (taxonomy === "t1") {
    const origin = getT1Origin(node.id, {} as Record<string, LookupEntry>, node.code);
    if (origin === "hts") {
      const hsBase = getHsBase(node.code, "hts");
      if (hsBase && hsBase.length >= 2) {
        const chapter = hsBase.substring(0, 2);
        return exiobaseFactors[chapter] ?? null;
      }
    }
  }

  if (taxonomy === "t2") {
    const origin = getT2Origin(node.id);
    if (origin === "hts") {
      const hsBase = getHsBase(node.code, "hts");
      if (hsBase && hsBase.length >= 2) {
        const chapter = hsBase.substring(0, 2);
        return exiobaseFactors[chapter] ?? null;
      }
    } else if (origin === "cpc") {
      const cleanCpc = stripCode(node.code);
      for (let len = cleanCpc.length; len >= 4; len--) {
        const prefix = cleanCpc.substring(0, len);
        const hsMappings = concordance.cpcToHs[prefix];
        if (hsMappings && hsMappings.length > 0) {
          const chapter = hsMappings[0].code.substring(0, 2);
          if (exiobaseFactors[chapter]) return exiobaseFactors[chapter];
        }
      }
    }
  }

  return null;
}

/* =============================== Resolution Chain Tracer =============================== */

interface ResolutionStep {
  label: string;       // e.g., "Source node", "HS-6 code", "CPC→HS concordance"
  code: string;        // the actual code at this step
  description?: string; // optional description
  system: string;      // "HS", "CPC", "NAICS", "ISIC", "EXIOBASE", etc.
  concordance?: string; // concordance table ID (for linking to Concordance Browser)
  lcaDb?: string;      // LCA database ID (for linking to LCA Data Browser)
  searchCode?: string; // code to search for when opening the browser
}

interface ResolutionChain {
  steps: ResolutionStep[];
  database: string;
}

function traceResolutionChain(
  node: TreeNode,
  taxonomy: TaxonomyType,
  database: "epa" | "exiobase" | "ecoinvent" | "uslci" | "bafu" | "gabi",
  data: AppData,
): ResolutionChain | null {
  const steps: ResolutionStep[] = [];
  const clean = stripCode(node.code);
  const taxLabel = TAXONOMY_INFO[taxonomy]?.label ?? taxonomy;

  // Step 1: source node
  steps.push({ label: `${taxLabel} node`, code: node.code, description: node.name, system: taxLabel });

  // Classify taxonomy
  const isHs = HS_FAMILY.includes(taxonomy);
  const isT1Hts = taxonomy === "t1" && !node.id.startsWith("t1-svc-");
  const isT2Hts = taxonomy === "t2" && node.id.startsWith("t2-hts-");
  const isCpc = taxonomy === "cpc" || (taxonomy === "t1" && node.id.startsWith("t1-svc-")) || (taxonomy === "t2" && !node.id.startsWith("t2-hts-"));
  const isGenericConc = CONCORDANCE_TAXONOMIES.includes(taxonomy); // naics, isic, nace, cpa, bea

  // Helper: resolve generic concordance taxonomies to HS codes (with chain steps)
  function resolveGenericToHs(): string[] {
    if (taxonomy === "naics" && data.naicsHsConcordance) {
      const mappings = data.naicsHsConcordance.forward[clean];
      if (mappings && mappings.length > 0) {
        const hsCodes = mappings.map(m => m.code);
        steps.push({ label: "NAICS→HS concordance", code: `${clean} → ${hsCodes[0]}${hsCodes.length > 1 ? ` (+${hsCodes.length - 1})` : ""}`, system: "HS", concordance: "naicsHs", searchCode: clean });
        return hsCodes;
      }
    }
    if ((taxonomy === "isic" || taxonomy === "nace") && data.isicCpcConcordance) {
      const cpcMappings = data.isicCpcConcordance.forward[clean];
      if (cpcMappings && cpcMappings.length > 0) {
        const cpcCode = cpcMappings[0].code;
        steps.push({ label: `${taxonomy.toUpperCase()}→CPC concordance`, code: `${clean} → ${cpcCode}`, system: "CPC", concordance: "isicCpc", searchCode: clean });
        const hsMappings = data.concordance?.cpcToHs[cpcCode];
        if (hsMappings && hsMappings.length > 0) {
          const hsCodes = hsMappings.map(m => m.code);
          steps.push({ label: "CPC→HS concordance", code: `${cpcCode} → ${hsCodes[0]}${hsCodes.length > 1 ? ` (+${hsCodes.length - 1})` : ""}`, system: "HS", concordance: "cpcHs", searchCode: cpcCode });
          return hsCodes;
        }
        return []; // CPC found but no HS mapping
      }
    }
    if (taxonomy === "cpa" && data.cpaHsConcordance) {
      const mappings = data.cpaHsConcordance.forward[clean];
      if (mappings && mappings.length > 0) {
        const hsCodes = mappings.map(m => m.code);
        steps.push({ label: "CPA→HS concordance", code: `${clean} → ${hsCodes[0]}${hsCodes.length > 1 ? ` (+${hsCodes.length - 1})` : ""}`, system: "HS", concordance: "cpaHs", searchCode: clean });
        return hsCodes;
      }
    }
    if (taxonomy === "bea" && data.beaHsConcordance) {
      const mappings = data.beaHsConcordance.forward[clean];
      if (mappings && mappings.length > 0) {
        const hsCodes = mappings.map(m => m.code);
        steps.push({ label: "BEA→HS concordance", code: `${clean} → ${hsCodes[0]}${hsCodes.length > 1 ? ` (+${hsCodes.length - 1})` : ""}`, system: "HS", concordance: "beaHs", searchCode: clean });
        return hsCodes;
      }
    }
    return [];
  }

  // Helper: get CPC code from CPC or combined taxonomies
  function getCpcCode(): string | null {
    if (isCpc) {
      if (taxonomy === "t1") return clean.startsWith("SVC") ? clean.substring(3) : clean;
      return clean;
    }
    return null;
  }

  // Helper: resolve CPC to HS via concordance
  function cpcToHs(cpcCode: string): string | null {
    for (let len = cpcCode.length; len >= 4; len--) {
      const prefix = cpcCode.substring(0, len);
      const hsMappings = data.concordance?.cpcToHs[prefix];
      if (hsMappings && hsMappings.length > 0) {
        const hsCode = hsMappings[0].code;
        steps.push({ label: "CPC→HS concordance", code: `${prefix} → ${hsCode}${hsMappings.length > 1 ? ` (+${hsMappings.length - 1})` : ""}`, system: "HS", concordance: "cpcHs", searchCode: prefix });
        return hsCode;
      }
    }
    return null;
  }

  // ========================= EPA/USEEIO =========================
  if (database === "epa") {
    const factors = data.emissionFactors;
    if (!factors) return null;

    // Try direct HS
    if (isHs || isT1Hts || isT2Hts) {
      const hsBase = getHsBase(node.code, isHs ? taxonomy : "hts");
      if (!hsBase || hsBase.length < 6) return null;
      const hs6 = hsBase.substring(0, 6);
      steps.push({ label: "HS-6 code (EPA key)", code: hs6, system: "HS" });
      const ef = factors[hs6];
      if (!ef) return null;
      steps.push({ label: "EPA/USEEIO factor", code: ef.naicsCode, description: ef.naicsDescription, system: "EPA", lcaDb: "epa", searchCode: hs6 });
      return { steps, database: "EPA/USEEIO" };
    }

    // Try CPC→HS
    const cpcCode = getCpcCode();
    if (cpcCode) {
      const hsCode = cpcToHs(cpcCode);
      if (hsCode) {
        const hs6 = hsCode.substring(0, 6);
        if (hs6 !== hsCode) steps.push({ label: "HS-6 extract", code: hs6, system: "HS" });
        const ef = factors[hs6];
        if (ef) {
          steps.push({ label: "EPA/USEEIO factor", code: ef.naicsCode, description: ef.naicsDescription, system: "EPA", lcaDb: "epa", searchCode: hs6 });
          return { steps, database: "EPA/USEEIO" };
        }
      }
      return null;
    }

    // Try generic concordance → HS
    if (isGenericConc) {
      const hsCodes = resolveGenericToHs();
      for (const hs of hsCodes) {
        const hs6Code = hs.substring(0, 6);
        const ef = factors[hs6Code];
        if (ef) {
          if (hs6Code !== hs) steps.push({ label: "HS-6 extract", code: hs6Code, system: "HS" });
          steps.push({ label: "EPA/USEEIO factor", code: ef.naicsCode, description: ef.naicsDescription, system: "EPA", lcaDb: "epa", searchCode: hs6Code });
          return { steps, database: "EPA/USEEIO" };
        }
      }
    }
    return null;
  }

  // ========================= EXIOBASE =========================
  if (database === "exiobase") {
    const c = data.exiobaseConcordance;
    if (!c) return null;

    function addExioProducts(exioCodes: string[], concLabel: string, concId: string, matchCode: string): ResolutionChain {
      const uniqueCodes = [...new Set(exioCodes)];
      const names = uniqueCodes.map(code => c!.products[code] ?? code).slice(0, 3);
      steps.push({ label: concLabel, code: matchCode, system: "EXIOBASE", concordance: concId, searchCode: matchCode });
      const displayCodes = uniqueCodes.slice(0, 3).join(", ");
      const displayNames = names.join("; ");
      steps.push({ label: `EXIOBASE product${uniqueCodes.length > 1 ? "s" : ""} (${uniqueCodes.length})`, code: displayCodes, description: displayNames, system: "EXIOBASE", lcaDb: "exiobase", searchCode: matchCode });
      return { steps, database: "EXIOBASE" };
    }

    // HS-family direct
    if (isHs || isT1Hts || isT2Hts) {
      const hsBase = getHsBase(node.code, isHs ? taxonomy : "hts");
      if (!hsBase) return null;
      for (let len = Math.min(6, hsBase.length); len >= 4; len--) {
        const prefix = hsBase.substring(0, len);
        const exioCodes = c.hsToExio[prefix];
        if (exioCodes && exioCodes.length > 0) {
          if (prefix !== hsBase) steps.push({ label: `HS-${prefix.length} prefix (EXIOBASE key)`, code: prefix, system: "HS" });
          return addExioProducts(exioCodes, "HS→EXIOBASE", "exioHs", prefix);
        }
      }
      return null;
    }

    // CPC: try CPA bridge, then CPC→HS→EXIOBASE
    if (isCpc) {
      const cpcCode = getCpcCode()!;
      // Try CPA direct (CPC codes often overlap with CPA)
      for (let len = cpcCode.length; len >= 2; len--) {
        const prefix = cpcCode.substring(0, len);
        const exioCodes = c.cpaToExio[prefix];
        if (exioCodes && exioCodes.length > 0) {
          return addExioProducts(exioCodes, "CPA→EXIOBASE", "exioCpa", prefix);
        }
      }
      // Try CPC→HS→EXIOBASE
      for (let len = cpcCode.length; len >= 4; len--) {
        const prefix = cpcCode.substring(0, len);
        const hsMappings = data.concordance?.cpcToHs[prefix];
        if (hsMappings) {
          for (const m of hsMappings) {
            const exioCodes = c.hsToExio[m.code];
            if (exioCodes && exioCodes.length > 0) {
              steps.push({ label: "CPC→HS concordance", code: `${prefix} → ${m.code}`, system: "HS", concordance: "cpcHs", searchCode: prefix });
              return addExioProducts(exioCodes, "HS→EXIOBASE", "exioHs", m.code);
            }
          }
        }
      }
      return null;
    }

    // CPA: direct
    if (taxonomy === "cpa") {
      for (let len = clean.length; len >= 2; len--) {
        const prefix = clean.substring(0, len);
        const exioCodes = c.cpaToExio[prefix];
        if (exioCodes && exioCodes.length > 0) {
          return addExioProducts(exioCodes, "CPA→EXIOBASE", "exioCpa", prefix);
        }
      }
      return null;
    }

    // ISIC: direct
    if (taxonomy === "isic") {
      for (let len = clean.length; len >= 1; len--) {
        const prefix = clean.substring(0, len);
        const exioCodes = c.isicToExio[prefix];
        if (exioCodes && exioCodes.length > 0) {
          return addExioProducts(exioCodes, "ISIC→EXIOBASE", "exioIsic", prefix);
        }
      }
      return null;
    }

    // NACE: try naceToExio then isicToExio
    if (taxonomy === "nace") {
      for (let len = clean.length; len >= 1; len--) {
        const prefix = clean.substring(0, len);
        const exioCodes = c.naceToExio[prefix] ?? c.isicToExio[prefix];
        if (exioCodes && exioCodes.length > 0) {
          const concId = c.naceToExio[prefix] ? "exioNace" : "exioIsic";
          return addExioProducts(exioCodes, `${c.naceToExio[prefix] ? "NACE" : "ISIC"}→EXIOBASE`, concId, prefix);
        }
      }
      return null;
    }

    // NAICS/BEA: chain through HS
    if (taxonomy === "naics" || taxonomy === "bea") {
      const hsCodes = resolveGenericToHs();
      for (const hs of hsCodes) {
        for (let len = Math.min(6, hs.length); len >= 4; len--) {
          const prefix = hs.substring(0, len);
          const exioCodes = c.hsToExio[prefix];
          if (exioCodes && exioCodes.length > 0) {
            return addExioProducts(exioCodes, "HS→EXIOBASE", "exioHs", prefix);
          }
        }
      }
    }

    return null;
  }

  // ========================= ecoinvent =========================
  if (database === "ecoinvent") {
    const em = data.ecoinventMapping;
    if (!em) return null;

    // CPC direct + CPC→HS fallback
    if (isCpc) {
      const cpcCode = getCpcCode()!;
      if (em.cpc[cpcCode]) {
        steps.push({ label: "ecoinvent CPC lookup", code: cpcCode, description: `${em.cpc[cpcCode].count} product(s)`, system: "ecoinvent", lcaDb: "ecoinvent", searchCode: cpcCode });
        return { steps, database: "ecoinvent" };
      }
      for (let len = cpcCode.length; len >= 4; len--) {
        const prefix = cpcCode.substring(0, len);
        const hsMappings = data.concordance?.cpcToHs[prefix];
        if (hsMappings && hsMappings.length > 0) {
          const hsCode = hsMappings[0].code;
          steps.push({ label: "CPC→HS concordance", code: `${prefix} → ${hsCode}`, system: "HS", concordance: "cpcHs", searchCode: prefix });
          if (em.hs[hsCode]) {
            steps.push({ label: "ecoinvent HS lookup", code: hsCode, description: `${em.hs[hsCode].count} product(s)`, system: "ecoinvent", lcaDb: "ecoinvent", searchCode: hsCode });
            return { steps, database: "ecoinvent" };
          }
        }
      }
      return null;
    }

    // HS direct
    if (isHs || isT1Hts || isT2Hts) {
      const hsBase = getHsBase(node.code, isHs ? taxonomy : "hts");
      if (hsBase) {
        for (let len = Math.min(6, hsBase.length); len >= 2; len -= 2) {
          const prefix = hsBase.substring(0, len);
          if (em.hs[prefix]) {
            steps.push({ label: `HS-${prefix.length} code (ecoinvent key)`, code: prefix, system: "HS" });
            steps.push({ label: "ecoinvent HS lookup", code: prefix, description: `${em.hs[prefix].count} product(s)`, system: "ecoinvent", lcaDb: "ecoinvent", searchCode: prefix });
            return { steps, database: "ecoinvent" };
          }
        }
      }
      return null;
    }

    // ISIC/NACE direct via ecoinvent ISIC codes
    if (taxonomy === "isic" || taxonomy === "nace") {
      for (let len = Math.min(4, clean.length); len >= 2; len--) {
        const prefix = clean.substring(0, len);
        if (em.isic[prefix]) {
          steps.push({ label: "ecoinvent ISIC lookup", code: prefix, description: `${em.isic[prefix].count} product(s)`, system: "ecoinvent", lcaDb: "ecoinvent", searchCode: prefix });
          return { steps, database: "ecoinvent" };
        }
      }
      return null;
    }

    // CPA: try CPA→HS→ecoinvent
    if (taxonomy === "cpa") {
      // CPA codes often match CPC codes for ecoinvent direct lookup
      if (em.cpc[clean]) {
        steps.push({ label: "ecoinvent CPC lookup (via CPA)", code: clean, description: `${em.cpc[clean].count} product(s)`, system: "ecoinvent", lcaDb: "ecoinvent", searchCode: clean });
        return { steps, database: "ecoinvent" };
      }
      if (data.cpaHsConcordance) {
        const mappings = data.cpaHsConcordance.forward[clean];
        if (mappings && mappings.length > 0) {
          const hsCode = mappings[0].code;
          steps.push({ label: "CPA→HS concordance", code: `${clean} → ${hsCode}`, system: "HS", concordance: "cpaHs", searchCode: clean });
          if (em.hs[hsCode]) {
            steps.push({ label: "ecoinvent HS lookup", code: hsCode, description: `${em.hs[hsCode].count} product(s)`, system: "ecoinvent", lcaDb: "ecoinvent", searchCode: hsCode });
            return { steps, database: "ecoinvent" };
          }
        }
      }
      return null;
    }

    // Generic concordance taxonomies (NAICS, BEA): chain to HS
    if (isGenericConc) {
      const hsCodes = resolveGenericToHs();
      for (const hs of hsCodes) {
        for (let len = Math.min(6, hs.length); len >= 2; len -= 2) {
          const prefix = hs.substring(0, len);
          if (em.hs[prefix]) {
            steps.push({ label: "ecoinvent HS lookup", code: prefix, description: `${em.hs[prefix].count} product(s)`, system: "ecoinvent", lcaDb: "ecoinvent", searchCode: prefix });
            return { steps, database: "ecoinvent" };
          }
        }
      }
    }

    return null;
  }

  // ========================= USLCI / BAFU / GaBi =========================
  if (database === "uslci" || database === "bafu" || database === "gabi") {
    const isUslci = database === "uslci";
    const cov = isUslci ? data.uslciCoverage?.coverage : database === "bafu" ? data.bafuCoverage?.coverage : data.gabiCoverage?.coverage;
    if (!cov) return null;
    const dbLabel = isUslci ? "US LCI" : database === "bafu" ? "BAFU" : "GaBi";
    const lcaDbId = database;

    function lookupHs(hsBase: string): ResolutionChain | null {
      if (isUslci) {
        const hs6 = hsBase.substring(0, 6);
        const entry = cov![hs6];
        if (entry) {
          steps.push({ label: `${dbLabel} HS-6 lookup`, code: hs6, description: `${(entry as UslciCoverageEntry).processCount} process(es)`, system: dbLabel, lcaDb: lcaDbId, searchCode: hs6 });
          return { steps, database: dbLabel };
        }
      } else {
        const ch = hsBase.substring(0, 2);
        const entry = cov![ch];
        if (entry) {
          steps.push({ label: `${dbLabel} HS-2 chapter lookup`, code: ch, description: `${(entry as BafuCoverageEntry).processCount} process(es)`, system: dbLabel, lcaDb: lcaDbId, searchCode: ch });
          return { steps, database: dbLabel };
        }
      }
      return null;
    }

    // HS-family direct
    if (isHs || isT1Hts || isT2Hts) {
      const hsBase = getHsBase(node.code, isHs ? taxonomy : "hts");
      if (!hsBase) return null;
      const lookupKey = isUslci ? hsBase.substring(0, 6) : hsBase.substring(0, 2);
      steps.push({ label: `HS-${lookupKey.length} ${isUslci ? "code" : "chapter"} (${dbLabel} key)`, code: lookupKey, system: "HS" });
      return lookupHs(hsBase);
    }

    // CPC → HS
    if (isCpc) {
      const cpcCode = getCpcCode()!;
      const hsCode = cpcToHs(cpcCode);
      if (hsCode) return lookupHs(hsCode);
      return null;
    }

    // Generic concordance taxonomies → HS
    if (isGenericConc) {
      const hsCodes = resolveGenericToHs();
      for (const hs of hsCodes) {
        const result = lookupHs(hs);
        if (result) return result;
      }
    }

    return null;
  }

  return null;
}

/* =============================== Resolution Chain Display =============================== */

function ResolutionChainToggle({ getChain, onOpenTab }: {
  getChain: () => ResolutionChain | null;
  onOpenTab?: (tab: "concordances" | "browser", ctx?: TabNavContext) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [chain, setChain] = React.useState<ResolutionChain | null>(null);

  const handleToggle = React.useCallback(() => {
    if (!open && !chain) setChain(getChain());
    setOpen(o => !o);
  }, [open, chain, getChain]);

  return (
    <div className="resolution-chain-toggle">
      <button className="resolution-toggle-btn" onClick={handleToggle}>
        {open ? "Hide" : "Show"} resolution path
      </button>
      {open && chain && (
        <div className="resolution-chain">
          <div className="resolution-chain-steps">
            {chain.steps.map((step, i) => (
              <div key={i} className="resolution-step">
                {i > 0 && <div className="resolution-arrow">→</div>}
                <div className="resolution-step-box">
                  <div className="resolution-step-label">{step.label}</div>
                  <div className="resolution-step-code">{step.code}</div>
                  {step.description && <div className="resolution-step-desc">{step.description}</div>}
                  {step.concordance && onOpenTab && (
                    <button className="resolution-link-btn" onClick={() => onOpenTab("concordances", {
                      concordanceId: step.concordance,
                      search: step.searchCode ?? step.code,
                    })}>
                      View in Concordance Browser
                    </button>
                  )}
                  {step.lcaDb && onOpenTab && (
                    <button className="resolution-link-btn" onClick={() => onOpenTab("browser", {
                      lcaDb: step.lcaDb,
                      search: step.searchCode ?? step.code,
                    })}>
                      View in LCA Browser
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {open && !chain && (
        <div className="resolution-chain">
          <div className="resolution-chain-steps">
            <span style={{ color: "#94a3b8", fontStyle: "italic" }}>No resolution path found</span>
          </div>
        </div>
      )}
    </div>
  );
}

function EmissionFactorDisplay({ entry, getChain, onOpenTab }: { entry: EmissionFactorEntry; getChain?: () => ResolutionChain | null; onOpenTab?: (tab: "concordances" | "browser", ctx?: TabNavContext) => void }) {
  const total = entry.factor;
  const prodPct = total > 0 ? (entry.factorWithoutMargins / total) * 100 : 0;
  const marginPct = total > 0 ? (entry.margins / total) * 100 : 0;

  return (
    <div className="emission-factor-card">
      <h4>Carbon Intensity</h4>
      <div className="emission-main">
        <span className="emission-value">{total.toFixed(3)}</span>
        <span className="emission-unit">{entry.unit}</span>
      </div>
      <div className="emission-breakdown">
        <div className="emission-bar">
          <div
            className="emission-bar-prod"
            style={{ width: `${prodPct}%` }}
            title={`Production: ${entry.factorWithoutMargins.toFixed(3)}`}
          />
          <div
            className="emission-bar-margin"
            style={{ width: `${marginPct}%` }}
            title={`Margins: ${entry.margins.toFixed(3)}`}
          />
        </div>
        <div className="emission-legend">
          <span className="legend-prod">Production: {entry.factorWithoutMargins.toFixed(3)}</span>
          <span className="legend-margin">Margins: {entry.margins.toFixed(3)}</span>
        </div>
      </div>
      <div className="emission-naics">
        NAICS {entry.naicsCode}: {entry.naicsDescription}
      </div>
      <div className="emission-source">{entry.source}</div>
      {getChain && <ResolutionChainToggle getChain={getChain} onOpenTab={onOpenTab} />}
    </div>
  );
}

function ExiobaseFactorDisplay({ entry, getChain, onOpenTab }: { entry: ExiobaseFactorEntry; getChain?: () => ResolutionChain | null; onOpenTab?: (tab: "concordances" | "browser", ctx?: TabNavContext) => void }) {
  return (
    <div className="emission-factor-card exiobase-card">
      <h4>Carbon Intensity (EXIOBASE)</h4>
      <div className="emission-main">
        <span className="emission-value">{entry.factor.toFixed(3)}</span>
        <span className="emission-unit">{entry.unit}</span>
      </div>
      <div className="exiobase-sectors">
        {entry.sectors.map((s, i) => (
          <span key={i} className="exiobase-sector-tag">{s}</span>
        ))}
      </div>
      <div className="emission-source">{entry.source}</div>
      {getChain && <ResolutionChainToggle getChain={getChain} onOpenTab={onOpenTab} />}
    </div>
  );
}

interface ExiobaseProductMatch {
  products: { code: string; name: string }[];
  matchedVia: "hs" | "cpa" | "isic" | "nace";
  matchedCode: string;
}

function getExiobaseProducts(
  node: TreeNode,
  taxonomy: TaxonomyType,
  exiobaseConcordance: ExiobaseConcordance | null,
  concordance: ConcordanceData,
): ExiobaseProductMatch | null {
  if (!exiobaseConcordance) return null;
  const c = exiobaseConcordance;

  function toMatch(codes: string[], via: "hs" | "cpa" | "isic" | "nace", matchedCode: string): ExiobaseProductMatch {
    const unique = [...new Set(codes)];
    return {
      products: unique.map(code => ({ code, name: c.products[code] ?? code })),
      matchedVia: via,
      matchedCode,
    };
  }

  // HS-family
  if (HS_FAMILY.includes(taxonomy)) {
    const hsBase = getHsBase(node.code, taxonomy);
    if (!hsBase) return null;
    for (let len = Math.min(6, hsBase.length); len >= 4; len--) {
      const prefix = hsBase.substring(0, len);
      const exioCodes = c.hsToExio[prefix];
      if (exioCodes && exioCodes.length > 0) return toMatch(exioCodes, "hs", prefix);
    }
    return null;
  }

  // CPC: try CPA bridge first, then chain via HS
  if (taxonomy === "cpc") {
    const clean = stripCode(node.code);
    for (let len = clean.length; len >= 2; len--) {
      const prefix = clean.substring(0, len);
      const exioCodes = c.cpaToExio[prefix];
      if (exioCodes && exioCodes.length > 0) return toMatch(exioCodes, "cpa", prefix);
    }
    for (let len = clean.length; len >= 4; len--) {
      const prefix = clean.substring(0, len);
      const hsMappings = concordance.cpcToHs[prefix];
      if (hsMappings) {
        for (const m of hsMappings) {
          const exioCodes = c.hsToExio[m.code];
          if (exioCodes && exioCodes.length > 0) return toMatch(exioCodes, "hs", m.code);
        }
      }
    }
    return null;
  }

  // CPA: direct lookup
  if (taxonomy === "cpa") {
    const clean = stripCode(node.code);
    for (let len = clean.length; len >= 2; len--) {
      const prefix = clean.substring(0, len);
      const exioCodes = c.cpaToExio[prefix];
      if (exioCodes && exioCodes.length > 0) return toMatch(exioCodes, "cpa", prefix);
    }
    return null;
  }

  // ISIC: direct lookup
  if (taxonomy === "isic") {
    const clean = stripCode(node.code);
    for (let len = clean.length; len >= 1; len--) {
      const prefix = clean.substring(0, len);
      const exioCodes = c.isicToExio[prefix];
      if (exioCodes && exioCodes.length > 0) return toMatch(exioCodes, "isic", prefix);
    }
    return null;
  }

  // NACE: try naceToExio then isicToExio
  if (taxonomy === "nace") {
    const clean = stripCode(node.code);
    for (let len = clean.length; len >= 1; len--) {
      const prefix = clean.substring(0, len);
      const exioCodes = c.naceToExio[prefix] ?? c.isicToExio[prefix];
      if (exioCodes && exioCodes.length > 0) return toMatch(exioCodes, "nace", prefix);
    }
    return null;
  }

  // T1: detect origin
  if (taxonomy === "t1") {
    if (node.id.startsWith("t1-svc-")) {
      const cpcCode = node.code.startsWith("SVC") ? stripCode(node.code).substring(3) : stripCode(node.code);
      for (let len = cpcCode.length; len >= 2; len--) {
        const prefix = cpcCode.substring(0, len);
        const exioCodes = c.cpaToExio[prefix];
        if (exioCodes && exioCodes.length > 0) return toMatch(exioCodes, "cpa", prefix);
      }
    } else {
      const hsBase = getHsBase(node.code, "hts");
      if (hsBase) {
        for (let len = Math.min(6, hsBase.length); len >= 4; len--) {
          const prefix = hsBase.substring(0, len);
          const exioCodes = c.hsToExio[prefix];
          if (exioCodes && exioCodes.length > 0) return toMatch(exioCodes, "hs", prefix);
        }
      }
    }
    return null;
  }

  // T2: detect origin
  if (taxonomy === "t2") {
    if (node.id.startsWith("t2-hts-")) {
      const hsBase = getHsBase(node.code, "hts");
      if (hsBase) {
        for (let len = Math.min(6, hsBase.length); len >= 4; len--) {
          const prefix = hsBase.substring(0, len);
          const exioCodes = c.hsToExio[prefix];
          if (exioCodes && exioCodes.length > 0) return toMatch(exioCodes, "hs", prefix);
        }
      }
    } else {
      const clean = stripCode(node.code);
      for (let len = clean.length; len >= 2; len--) {
        const prefix = clean.substring(0, len);
        const exioCodes = c.cpaToExio[prefix];
        if (exioCodes && exioCodes.length > 0) return toMatch(exioCodes, "cpa", prefix);
      }
    }
    return null;
  }

  return null;
}

function ExiobaseProductDisplay({ match, getChain, onOpenTab }: { match: ExiobaseProductMatch; getChain?: () => ResolutionChain | null; onOpenTab?: (tab: "concordances" | "browser", ctx?: TabNavContext) => void }) {
  return (
    <div className="emission-factor-card exiobase-products-card">
      <h4>EXIOBASE Product Mapping</h4>
      <div className="exiobase-match-via">
        Matched via {match.matchedVia.toUpperCase()} {match.matchedCode}
      </div>
      <div className="exiobase-product-list">
        {match.products.slice(0, 8).map((p, i) => (
          <div key={i} className="exiobase-product-item">
            <span className="exiobase-product-code">{p.code}</span>
            <span className="exiobase-product-name">{p.name}</span>
          </div>
        ))}
        {match.products.length > 8 && (
          <div className="exiobase-more">+{match.products.length - 8} more</div>
        )}
      </div>
      {getChain && <ResolutionChainToggle getChain={getChain} onOpenTab={onOpenTab} />}
    </div>
  );
}

// Look up BAFU chapter data for a selected node (keyed by HS 2-digit chapter)
function getBafuChapterData(
  node: TreeNode,
  taxonomy: TaxonomyType,
  bafuCoverage: BafuCoverage | null,
  concordance: ConcordanceData,
): BafuCoverageEntry | null {
  if (!bafuCoverage) return null;
  const cov = bafuCoverage.coverage;

  if (HS_FAMILY.includes(taxonomy)) {
    const hsBase = getHsBase(node.code, taxonomy);
    if (!hsBase || hsBase.length < 2) return null;
    const chapter = hsBase.substring(0, 2);
    return cov[chapter] ?? null;
  }

  if (taxonomy === "cpc") {
    const cleanCpc = stripCode(node.code);
    for (let len = cleanCpc.length; len >= 4; len--) {
      const prefix = cleanCpc.substring(0, len);
      const hsMappings = concordance.cpcToHs[prefix];
      if (hsMappings && hsMappings.length > 0) {
        const chapter = hsMappings[0].code.substring(0, 2);
        if (cov[chapter]) return cov[chapter];
      }
    }
  }

  if (taxonomy === "t1") {
    const origin = getT1Origin(node.id, {} as Record<string, LookupEntry>, node.code);
    if (origin === "hts") {
      const hsBase = getHsBase(node.code, "hts");
      if (hsBase && hsBase.length >= 2) {
        const chapter = hsBase.substring(0, 2);
        return cov[chapter] ?? null;
      }
    }
  }

  if (taxonomy === "t2") {
    const origin = getT2Origin(node.id);
    if (origin === "hts") {
      const hsBase = getHsBase(node.code, "hts");
      if (hsBase && hsBase.length >= 2) {
        const chapter = hsBase.substring(0, 2);
        return cov[chapter] ?? null;
      }
    } else if (origin === "cpc") {
      const cleanCpc = stripCode(node.code);
      for (let len = cleanCpc.length; len >= 4; len--) {
        const prefix = cleanCpc.substring(0, len);
        const hsMappings = concordance.cpcToHs[prefix];
        if (hsMappings && hsMappings.length > 0) {
          const chapter = hsMappings[0].code.substring(0, 2);
          if (cov[chapter]) return cov[chapter];
        }
      }
    }
  }

  return null;
}

function BafuFactorDisplay({ entry, getChain, onOpenTab }: { entry: BafuCoverageEntry; getChain?: () => ResolutionChain | null; onOpenTab?: (tab: "concordances" | "browser", ctx?: TabNavContext) => void }) {
  return <LciFactorDisplay entry={entry} title="Direct Emissions (BAFU)" source="BAFU:2025 (direct process emissions only, GWP-100 AR6)" cardClass="bafu-card" getChain={getChain} onOpenTab={onOpenTab} />;
}

// Look up GaBi chapter data for a selected node (keyed by HS 2-digit chapter, same as BAFU)
function getGabiChapterData(
  node: TreeNode,
  taxonomy: TaxonomyType,
  gabiCoverage: GabiCoverage | null,
  concordance: ConcordanceData,
): GabiCoverageEntry | null {
  if (!gabiCoverage) return null;
  const cov = gabiCoverage.coverage;

  if (HS_FAMILY.includes(taxonomy)) {
    const hsBase = getHsBase(node.code, taxonomy);
    if (!hsBase || hsBase.length < 2) return null;
    const chapter = hsBase.substring(0, 2);
    return cov[chapter] ?? null;
  }

  if (taxonomy === "cpc") {
    const cleanCpc = stripCode(node.code);
    for (let len = cleanCpc.length; len >= 4; len--) {
      const prefix = cleanCpc.substring(0, len);
      const hsMappings = concordance.cpcToHs[prefix];
      if (hsMappings && hsMappings.length > 0) {
        const chapter = hsMappings[0].code.substring(0, 2);
        if (cov[chapter]) return cov[chapter];
      }
    }
  }

  if (taxonomy === "t1") {
    const origin = getT1Origin(node.id, {} as Record<string, LookupEntry>, node.code);
    if (origin === "hts") {
      const hsBase = getHsBase(node.code, "hts");
      if (hsBase && hsBase.length >= 2) {
        const chapter = hsBase.substring(0, 2);
        return cov[chapter] ?? null;
      }
    }
  }

  if (taxonomy === "t2") {
    const origin = getT2Origin(node.id);
    if (origin === "hts") {
      const hsBase = getHsBase(node.code, "hts");
      if (hsBase && hsBase.length >= 2) {
        const chapter = hsBase.substring(0, 2);
        return cov[chapter] ?? null;
      }
    } else if (origin === "cpc") {
      const cleanCpc = stripCode(node.code);
      for (let len = cleanCpc.length; len >= 4; len--) {
        const prefix = cleanCpc.substring(0, len);
        const hsMappings = concordance.cpcToHs[prefix];
        if (hsMappings && hsMappings.length > 0) {
          const chapter = hsMappings[0].code.substring(0, 2);
          if (cov[chapter]) return cov[chapter];
        }
      }
    }
  }

  return null;
}

function GabiFactorDisplay({ entry, getChain, onOpenTab }: { entry: GabiCoverageEntry; getChain?: () => ResolutionChain | null; onOpenTab?: (tab: "concordances" | "browser", ctx?: TabNavContext) => void }) {
  return <LciFactorDisplay entry={entry} title="Direct Emissions (GaBi/Sphera)" source="GaBi/Sphera 2026.1 (direct process emissions only, GWP-100 AR6)" cardClass="gabi-card" getChain={getChain} onOpenTab={onOpenTab} />;
}

function UslciFactorDisplay({ entry, getChain, onOpenTab }: { entry: UslciCoverageEntry; getChain?: () => ResolutionChain | null; onOpenTab?: (tab: "concordances" | "browser", ctx?: TabNavContext) => void }) {
  return <LciFactorDisplay entry={entry} title="Direct Emissions (US LCI)" source="NREL USLCI (direct process emissions only, GWP-100 AR6)" cardClass="uslci-card" getChain={getChain} onOpenTab={onOpenTab} />;
}

// Look up USLCI data for a selected node (keyed by HS-6 code)
function getUslciData(
  node: TreeNode,
  taxonomy: TaxonomyType,
  uslciCoverage: UslciCoverage | null,
  concordance: ConcordanceData,
): UslciCoverageEntry | null {
  if (!uslciCoverage) return null;
  const cov = uslciCoverage.coverage;

  if (HS_FAMILY.includes(taxonomy)) {
    const hsBase = getHsBase(node.code, taxonomy);
    if (!hsBase || hsBase.length < 6) return null;
    return cov[hsBase.substring(0, 6)] ?? null;
  }

  if (taxonomy === "cpc") {
    const cleanCpc = stripCode(node.code);
    for (let len = cleanCpc.length; len >= 4; len--) {
      const prefix = cleanCpc.substring(0, len);
      const hsMappings = concordance.cpcToHs[prefix];
      if (hsMappings && hsMappings.length > 0) {
        const hsCode = hsMappings[0].code;
        if (cov[hsCode]) return cov[hsCode];
      }
    }
  }

  if (taxonomy === "t1") {
    const origin = getT1Origin(node.id, {} as Record<string, LookupEntry>, node.code);
    if (origin === "hts") {
      const hsBase = getHsBase(node.code, "hts");
      if (hsBase && hsBase.length >= 6) return cov[hsBase.substring(0, 6)] ?? null;
    }
  }

  if (taxonomy === "t2") {
    const origin = getT2Origin(node.id);
    if (origin === "hts") {
      const hsBase = getHsBase(node.code, "hts");
      if (hsBase && hsBase.length >= 6) return cov[hsBase.substring(0, 6)] ?? null;
    } else if (origin === "cpc") {
      const cleanCpc = stripCode(node.code);
      for (let len = cleanCpc.length; len >= 4; len--) {
        const prefix = cleanCpc.substring(0, len);
        const hsMappings = concordance.cpcToHs[prefix];
        if (hsMappings && hsMappings.length > 0) {
          const hsCode = hsMappings[0].code;
          if (cov[hsCode]) return cov[hsCode];
        }
      }
    }
  }

  return null;
}

/* ===== Descendant EF Range Aggregation ===== */

interface DbRange {
  min: number;
  max: number;
  count: number;
  unit: string;
}

interface DescendantRanges {
  epa: DbRange | null;
  exiobase: DbRange | null;
  bafu: DbRange | null;
  gabi: DbRange | null;
  uslci: DbRange | null;
  ecoinventCount: number;
  totalLeaves: number;
}

function collectLeafNodes(node: TreeNode): TreeNode[] {
  if (!node.children || node.children.length === 0) return [node];
  const leaves: TreeNode[] = [];
  for (const child of node.children) {
    leaves.push(...collectLeafNodes(child));
  }
  return leaves;
}

function computeDescendantRanges(
  node: TreeNode,
  taxonomy: TaxonomyType,
  data: AppData,
): DescendantRanges {
  const leaves = collectLeafNodes(node);
  const ranges: DescendantRanges = {
    epa: null, exiobase: null, bafu: null, gabi: null, uslci: null,
    ecoinventCount: 0, totalLeaves: leaves.length,
  };

  const epaVals: number[] = [];
  const exioVals: number[] = [];
  const bafuVals: number[] = [];
  const gabiVals: number[] = [];
  const uslciVals: number[] = [];

  for (const leaf of leaves) {
    // EPA
    const ef = getEmissionFactor(leaf, taxonomy, data.emissionFactors, data.concordance);
    if (ef) epaVals.push(ef.factor);

    // EXIOBASE
    const exf = getExiobaseFactor(leaf, taxonomy, data.exiobaseFactors, data.concordance);
    if (exf) exioVals.push(exf.factor);

    // BAFU
    const bf = getBafuChapterData(leaf, taxonomy, data.bafuCoverage, data.concordance);
    if (bf && bf.withGhgData > 0) {
      const kgStats = bf.unitStats["kg"];
      if (kgStats) bafuVals.push(kgStats.median);
    }

    // GaBi
    const gf = getGabiChapterData(leaf, taxonomy, data.gabiCoverage, data.concordance);
    if (gf && gf.processCount > 0) {
      const kgStats = gf.unitStats["kg"];
      if (kgStats) gabiVals.push(kgStats.median);
    }

    // USLCI
    const uf = getUslciData(leaf, taxonomy, data.uslciCoverage, data.concordance);
    if (uf && uf.withGhgData > 0) {
      const kgStats = uf.unitStats["kg"];
      if (kgStats) uslciVals.push(kgStats.median);
    }

    // ecoinvent (just count)
    const eco = getEcoinventInfo(leaf, taxonomy, data.ecoinventMapping, data.concordance);
    if (eco.cpc || eco.hs || eco.isic) ranges.ecoinventCount++;
  }

  if (epaVals.length > 0) {
    ranges.epa = { min: Math.min(...epaVals), max: Math.max(...epaVals), count: epaVals.length, unit: "kg CO₂e / $" };
  }
  if (exioVals.length > 0) {
    ranges.exiobase = { min: Math.min(...exioVals), max: Math.max(...exioVals), count: exioVals.length, unit: "kg CO₂e / EUR" };
  }
  if (bafuVals.length > 0) {
    ranges.bafu = { min: Math.min(...bafuVals), max: Math.max(...bafuVals), count: bafuVals.length, unit: "kg CO₂e / kg" };
  }
  if (gabiVals.length > 0) {
    ranges.gabi = { min: Math.min(...gabiVals), max: Math.max(...gabiVals), count: gabiVals.length, unit: "kg CO₂e / kg" };
  }
  if (uslciVals.length > 0) {
    ranges.uslci = { min: Math.min(...uslciVals), max: Math.max(...uslciVals), count: uslciVals.length, unit: "kg CO₂e / kg" };
  }

  return ranges;
}

function DescendantRangeDisplay({ ranges }: { ranges: DescendantRanges }) {
  const hasAny = ranges.epa || ranges.exiobase || ranges.bafu || ranges.gabi || ranges.uslci || ranges.ecoinventCount > 0;
  if (!hasAny) return null;

  return (
    <div className="descendant-range-card">
      <h4>Emission Factor Range ({ranges.totalLeaves.toLocaleString()} descendant leaves)</h4>
      <div className="dr-rows">
        {ranges.ecoinventCount > 0 && (
          <div className="dr-row">
            <span className="dr-badge dr-ecoinvent">ecoinvent</span>
            <span className="dr-value">{ranges.ecoinventCount} leaf{ranges.ecoinventCount !== 1 ? "s" : ""} with product data</span>
          </div>
        )}
        {ranges.epa && (
          <div className="dr-row">
            <span className="dr-badge dr-epa">EPA/USEEIO</span>
            <span className="dr-value">
              {formatGhg(ranges.epa.min)} – {formatGhg(ranges.epa.max)} {ranges.epa.unit}
            </span>
            <span className="dr-count">({ranges.epa.count} leaves)</span>
          </div>
        )}
        {ranges.exiobase && (
          <div className="dr-row">
            <span className="dr-badge dr-exiobase">EXIOBASE</span>
            <span className="dr-value">
              {formatGhg(ranges.exiobase.min)} – {formatGhg(ranges.exiobase.max)} {ranges.exiobase.unit}
            </span>
            <span className="dr-count">({ranges.exiobase.count} leaves)</span>
          </div>
        )}
        {ranges.uslci && (
          <div className="dr-row">
            <span className="dr-badge dr-uslci">US LCI</span>
            <span className="dr-value">
              {formatGhg(ranges.uslci.min)} – {formatGhg(ranges.uslci.max)} {ranges.uslci.unit}
            </span>
            <span className="dr-count">({ranges.uslci.count} leaves)</span>
          </div>
        )}
        {ranges.bafu && (
          <div className="dr-row">
            <span className="dr-badge dr-bafu">BAFU</span>
            <span className="dr-value">
              {formatGhg(ranges.bafu.min)} – {formatGhg(ranges.bafu.max)} {ranges.bafu.unit}
            </span>
            <span className="dr-count">({ranges.bafu.count} leaves)</span>
          </div>
        )}
        {ranges.gabi && (
          <div className="dr-row">
            <span className="dr-badge dr-gabi">GaBi</span>
            <span className="dr-value">
              {formatGhg(ranges.gabi.min)} – {formatGhg(ranges.gabi.max)} {ranges.gabi.unit}
            </span>
            <span className="dr-count">({ranges.gabi.count} leaves)</span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Format a number with at least 2 significant digits, avoiding "0.000" for small values */
function formatGhg(v: number): string {
  if (v === 0) return "0";
  const abs = Math.abs(v);
  if (abs >= 0.01) return v.toFixed(3);
  // For very small values, use enough decimals to show 2 significant digits
  const digits = Math.max(3, Math.ceil(-Math.log10(abs)) + 1);
  return v.toFixed(digits);
}

function LciFactorDisplay({ entry, title, source, cardClass, getChain, onOpenTab }: {
  entry: { withGhgData: number; unitStats: Record<string, LciUnitStats>; topProcesses: { name: string; ghg: number; unit: string }[] };
  title: string;
  source: string;
  cardClass: string;
  getChain?: () => ResolutionChain | null;
  onOpenTab?: (tab: "concordances" | "browser", ctx?: TabNavContext) => void;
}) {
  if (entry.withGhgData === 0) return null;

  // Find the "kg" unit stats as the most meaningful for goods
  const kgStats = entry.unitStats["kg"];
  const primaryUnit = kgStats ? "kg" : Object.keys(entry.unitStats)[0];
  const primaryStats = kgStats || entry.unitStats[primaryUnit];

  return (
    <div className={`emission-factor-card ${cardClass}`}>
      <h4>{title}</h4>
      {primaryStats && (
        <div className="lci-summary">
          <div className="emission-main">
            <span className="emission-value">{formatGhg(primaryStats.median)}</span>
            <span className="emission-unit">kg CO₂e / {primaryUnit}</span>
          </div>
          <div className="lci-range">
            <span className="lci-range-label">Range:</span>{" "}
            {formatGhg(primaryStats.min)} – {formatGhg(primaryStats.max)} ({primaryStats.count} processes)
          </div>
        </div>
      )}
      {entry.topProcesses.length > 0 && (
        <div className="lci-processes">
          {entry.topProcesses.slice(0, 5).map((p, i) => (
            <div key={i} className="lci-process">
              <span className="lci-process-name">{p.name}</span>
              <span className="lci-process-value">{formatGhg(p.ghg)} kg CO₂e/{p.unit}</span>
            </div>
          ))}
        </div>
      )}
      <div className="emission-source">{source}</div>
      {getChain && <ResolutionChainToggle getChain={getChain} onOpenTab={onOpenTab} />}
    </div>
  );
}

// Look up ecoinvent mapping for a selected node
type EcoinventInfo = {
  cpc: EcoinventCodeMapping | null;
  hs: EcoinventCodeMapping | null;
  isic: EcoinventCodeMapping | null;
  cpcCode: string | null;
  hsCode: string | null;
  isicCode: string | null;
};

function getEcoinventInfo(
  node: TreeNode,
  taxonomy: TaxonomyType,
  ecoinventMapping: EcoinventMapping | null,
  concordance: ConcordanceData,
): EcoinventInfo {
  const empty: EcoinventInfo = { cpc: null, hs: null, isic: null, cpcCode: null, hsCode: null, isicCode: null };
  if (!ecoinventMapping) return empty;

  const clean = stripCode(node.code);

  // Direct CPC lookup (for CPC, T2-CPC backbone)
  if (taxonomy === "cpc") {
    const cpcMatch = ecoinventMapping.cpc[clean] ?? null;
    // Chain to HS via concordance
    let hsMatch: EcoinventCodeMapping | null = null;
    let hsCode: string | null = null;
    for (let len = clean.length; len >= 4; len--) {
      const prefix = clean.substring(0, len);
      const hsMappings = concordance.cpcToHs[prefix];
      if (hsMappings && hsMappings.length > 0) {
        hsCode = hsMappings[0].code;
        hsMatch = ecoinventMapping.hs[hsCode] ?? null;
        break;
      }
    }
    return { cpc: cpcMatch, hs: hsMatch, isic: null, cpcCode: cpcMatch ? clean : null, hsCode, isicCode: null };
  }

  // HS-family: direct HS lookup + chain to CPC via concordance
  if (HS_FAMILY.includes(taxonomy)) {
    const hsBase = getHsBase(node.code, taxonomy);
    if (!hsBase) return empty;
    // Try progressively shorter HS prefixes
    let hsMatch: EcoinventCodeMapping | null = null;
    let matchedHsCode: string | null = null;
    for (let len = Math.min(6, hsBase.length); len >= 2; len -= 2) {
      const prefix = hsBase.substring(0, len);
      if (ecoinventMapping.hs[prefix]) {
        hsMatch = ecoinventMapping.hs[prefix];
        matchedHsCode = prefix;
        break;
      }
    }
    // Chain to CPC
    let cpcMatch: EcoinventCodeMapping | null = null;
    let cpcCode: string | null = null;
    for (let len = Math.min(6, hsBase.length); len >= 4; len -= 2) {
      const prefix = hsBase.substring(0, len);
      const cpcMappings = concordance.hsToCpc[prefix];
      if (cpcMappings && cpcMappings.length > 0) {
        cpcCode = cpcMappings[0].code;
        cpcMatch = ecoinventMapping.cpc[cpcCode] ?? null;
        break;
      }
    }
    return { cpc: cpcMatch, hs: hsMatch, isic: null, cpcCode, hsCode: matchedHsCode, isicCode: null };
  }

  // ISIC / NACE: direct ISIC lookup (NACE numeric codes = ISIC codes)
  if (taxonomy === "isic" || taxonomy === "nace") {
    let isicMatch: EcoinventCodeMapping | null = null;
    let isicCode: string | null = null;
    // Try progressively shorter ISIC prefixes (4 -> 3 -> 2 digit)
    for (let len = Math.min(4, clean.length); len >= 2; len--) {
      const prefix = clean.substring(0, len);
      if (ecoinventMapping.isic[prefix]) {
        isicMatch = ecoinventMapping.isic[prefix];
        isicCode = prefix;
        break;
      }
    }
    return { cpc: null, hs: null, isic: isicMatch, cpcCode: null, hsCode: null, isicCode };
  }

  // NAICS: chain via NAICS→HS concordance, then HS lookup + direct ISIC check
  if (taxonomy === "naics") {
    // NAICS doesn't have direct ecoinvent mapping, but try ISIC prefix match
    // (NAICS codes overlap somewhat with ISIC at 2-digit level)
    return empty;
  }

  // CPA: chain via CPA→HS concordance
  if (taxonomy === "cpa") {
    // CPA codes mirror CPC structure, try direct CPC lookup
    const cpcMatch = ecoinventMapping.cpc[clean] ?? null;
    if (cpcMatch) {
      return { cpc: cpcMatch, hs: null, isic: null, cpcCode: clean, hsCode: null, isicCode: null };
    }
    return empty;
  }

  // T1: detect origin
  if (taxonomy === "t1") {
    const origin = getT1Origin(node.id, {} as Record<string, LookupEntry>, node.code);
    if (origin === "hts") {
      return getEcoinventInfo(node, "hts", ecoinventMapping, concordance);
    }
    if (origin === "cpc") {
      return getEcoinventInfo({ ...node, code: clean }, "cpc", ecoinventMapping, concordance);
    }
  }

  // T2: detect origin
  if (taxonomy === "t2") {
    const origin = getT2Origin(node.id);
    if (origin === "hts") {
      return getEcoinventInfo(node, "hts", ecoinventMapping, concordance);
    }
    if (origin === "cpc") {
      return getEcoinventInfo(node, "cpc", ecoinventMapping, concordance);
    }
  }

  return empty;
}

// Convert raw {nodeId -> {count, key}} into final Map with directionality
function assignDirectionality(raw: Map<string, { count: number; key: string }>): Map<string, CoverageInfo> {
  // Build reverse: DB key -> number of nodes that use it
  const keyUsage = new Map<string, number>();
  for (const { key } of raw.values()) {
    keyUsage.set(key, (keyUsage.get(key) ?? 0) + 1);
  }
  const result = new Map<string, CoverageInfo>();
  for (const [nodeId, { count, key }] of raw) {
    let dir: "1:1" | "1:N" | "N:1";
    if (count > 1) dir = "1:N";
    else if ((keyUsage.get(key) ?? 1) > 1) dir = "N:1";
    else dir = "1:1";
    const shared = keyUsage.get(key) ?? 1;
    result.set(nodeId, { count, dir, shared });
  }
  return result;
}

// Compute ecoinvent coverage for tree nodes (for overlay)
function computeEcoinventCoverage(
  tree: TreeNode[],
  taxonomy: TaxonomyType,
  ecoinventMapping: EcoinventMapping | null,
  strict: boolean,
): Map<string, CoverageInfo> {
  if (!ecoinventMapping) return new Map();
  const raw = new Map<string, { count: number; key: string }>();
  const em = ecoinventMapping;

  function walk(nodes: TreeNode[]) {
    for (const node of nodes) {
      const clean = stripCode(node.code);
      let count = 0;
      let key = "";

      if (taxonomy === "cpc" || (taxonomy === "t2" && getT2Origin(node.id) === "cpc") || (taxonomy === "t1" && node.id.startsWith("t1-svc-"))) {
        if (em.cpc[clean]) { count = em.cpc[clean].count; key = `cpc:${clean}`; }
      } else if (HS_FAMILY.includes(taxonomy) || (taxonomy === "t2" && getT2Origin(node.id) === "hts") || (taxonomy === "t1" && !node.id.startsWith("t1-svc-"))) {
        const hsBase = clean.substring(0, Math.min(6, clean.length));
        if (em.hs[hsBase]) { count = em.hs[hsBase].count; key = `hs:${hsBase}`; }
      } else if (taxonomy === "isic" || taxonomy === "nace") {
        if (em.isic[clean]) { count = em.isic[clean].count; key = `isic:${clean}`; }
        else if (!strict && em.isicAncestors.includes(clean)) { count = 1; key = `isic-anc:${clean}`; }
      } else if (taxonomy === "cpa") {
        if (em.cpc[clean]) { count = em.cpc[clean].count; key = `cpc:${clean}`; }
        else if (!strict && em.cpcAncestors.includes(clean)) { count = 1; key = `cpc-anc:${clean}`; }
      }

      if (count > 0) raw.set(node.id, { count, key });
      if (node.children) walk(node.children);
    }
  }

  walk(tree);
  return assignDirectionality(raw);
}

function computeEpaCoverage(
  tree: TreeNode[],
  taxonomy: TaxonomyType,
  emissionFactors: Record<string, EmissionFactorEntry> | null,
  concordance: ConcordanceData,
  strict: boolean,
): Map<string, CoverageInfo> {
  if (!emissionFactors) return new Map();
  const raw = new Map<string, { count: number; key: string }>();
  const efKeys = new Set(Object.keys(emissionFactors));

  function walk(nodes: TreeNode[]) {
    for (const node of nodes) {
      const clean = stripCode(node.code);
      let matchCount = 0;
      let matchKey = "";
      const minPrefix = strict ? clean.length : 4;

      if (taxonomy === "cpc" || (taxonomy === "t2" && getT2Origin(node.id) === "cpc") || (taxonomy === "t1" && node.id.startsWith("t1-svc-"))) {
        const matched: string[] = [];
        for (let len = clean.length; len >= minPrefix; len--) {
          const prefix = clean.substring(0, len);
          const hsMappings = concordance.cpcToHs[prefix];
          if (hsMappings && hsMappings.length > 0) {
            for (const m of hsMappings) {
              if (efKeys.has(m.code)) { matchCount++; matched.push(m.code); }
            }
            if (matchCount > 0) { matchKey = matched.join(","); break; }
          }
        }
      } else if (taxonomy === "naics") {
        // Direct NAICS match: build reverse index naicsCode → HS keys
        for (let len = clean.length; len >= minPrefix; len--) {
          const prefix = clean.substring(0, len);
          const matches = naicsToEf.get(prefix);
          if (matches && matches.length > 0) {
            matchCount = matches.length;
            matchKey = prefix;
            break;
          }
        }
      } else if (HS_FAMILY.includes(taxonomy) || (taxonomy === "t2" && getT2Origin(node.id) === "hts") || (taxonomy === "t1" && !node.id.startsWith("t1-svc-"))) {
        if (/^\d+$/.test(clean) && clean.length >= 6) {
          const hs6 = clean.substring(0, 6);
          if (efKeys.has(hs6)) { matchCount = 1; matchKey = hs6; }
        }
      }

      if (matchCount > 0) raw.set(node.id, { count: matchCount, key: matchKey });
      if (node.children) walk(node.children);
    }
  }

  // Build NAICS reverse index: naicsCode → list of HS keys that map to it
  const naicsToEf = new Map<string, string[]>();
  if (taxonomy === "naics") {
    for (const [hsKey, entry] of Object.entries(emissionFactors)) {
      if (entry.naicsCode) {
        const list = naicsToEf.get(entry.naicsCode) ?? [];
        list.push(hsKey);
        naicsToEf.set(entry.naicsCode, list);
      }
    }
  }

  walk(tree);
  return assignDirectionality(raw);
}

function computeExiobaseCoverage(
  tree: TreeNode[],
  taxonomy: TaxonomyType,
  exiobaseFactors: Record<string, ExiobaseFactorEntry> | null,
  exiobaseConcordance: ExiobaseConcordance | null,
  concordance: ConcordanceData,
  strict: boolean,
): Map<string, CoverageInfo> {
  const raw = new Map<string, { count: number; key: string }>();

  // Use precise concordance if available
  if (exiobaseConcordance) {
    const hsToExio = exiobaseConcordance.hsToExio;
    const hsKeys = new Set(Object.keys(hsToExio));
    const hsAncestorSet = new Set(exiobaseConcordance.hsAncestors);
    const cpaToExio = exiobaseConcordance.cpaToExio;
    const cpaKeys = new Set(Object.keys(cpaToExio));
    const cpaAncestorSet = new Set(exiobaseConcordance.cpaAncestors);
    const isicToExio = exiobaseConcordance.isicToExio;
    const isicKeys = new Set(Object.keys(isicToExio));
    const naceToExio = exiobaseConcordance.naceToExio;
    const naceKeys = new Set(Object.keys(naceToExio));

    function walkPrecise(nodes: TreeNode[]) {
      for (const node of nodes) {
        const clean = stripCode(node.code);
        let count = 0;
        let key = "";

        const isCpcOrigin = taxonomy === "cpc" || taxonomy === "cpa"
          || (taxonomy === "t2" && getT2Origin(node.id) === "cpc")
          || (taxonomy === "t1" && node.id.startsWith("t1-svc-"));
        const isHsOrigin = HS_FAMILY.includes(taxonomy)
          || (taxonomy === "t2" && getT2Origin(node.id) === "hts")
          || (taxonomy === "t1" && !node.id.startsWith("t1-svc-"));

        if (isHsOrigin) {
          if (/^\d+$/.test(clean) && clean.length >= 4) {
            const hs6 = clean.substring(0, 6);
            const hs4 = clean.substring(0, 4);
            if (clean.length >= 6 && hsKeys.has(hs6)) { count = hsToExio[hs6].length; key = hsToExio[hs6].join(","); }
            else if (!strict && hsKeys.has(hs4)) { count = hsToExio[hs4].length; key = hsToExio[hs4].join(","); }
            else if (!strict && hsAncestorSet.has(clean.substring(0, Math.min(clean.length, 4)))) { count = 1; key = `anc:${clean.substring(0, 4)}`; }
          }
        } else if (isCpcOrigin) {
          // In strict mode, only try exact code length for CPA lookup
          const cpaMin = strict ? clean.length : 2;
          for (let len = clean.length; len >= cpaMin; len--) {
            const prefix = clean.substring(0, len);
            if (cpaKeys.has(prefix)) { count = cpaToExio[prefix].length; key = cpaToExio[prefix].join(","); break; }
            if (!strict && cpaAncestorSet.has(prefix)) { count = 1; key = `cpa-anc:${prefix}`; break; }
          }
          if (count === 0) {
            const matched: string[] = [];
            const cpcMin = strict ? clean.length : 4;
            for (let len = clean.length; len >= cpcMin; len--) {
              const hsMappings = concordance.cpcToHs[clean.substring(0, len)];
              if (hsMappings) {
                for (const m of hsMappings) {
                  if (hsKeys.has(m.code)) { count += hsToExio[m.code].length; matched.push(...hsToExio[m.code]); }
                  else if (!strict && hsKeys.has(m.code.substring(0, 4))) { count += hsToExio[m.code.substring(0, 4)].length; matched.push(...hsToExio[m.code.substring(0, 4)]); }
                }
                if (count > 0) { key = matched.join(","); break; }
              }
            }
          }
        } else if (taxonomy === "isic") {
          const isicMin = strict ? clean.length : 1;
          for (let len = clean.length; len >= isicMin; len--) {
            const prefix = clean.substring(0, len);
            if (isicKeys.has(prefix)) { count = isicToExio[prefix].length; key = isicToExio[prefix].join(","); break; }
          }
        } else if (taxonomy === "nace") {
          const naceMin = strict ? clean.length : 1;
          for (let len = clean.length; len >= naceMin; len--) {
            const prefix = clean.substring(0, len);
            if (naceKeys.has(prefix)) { count = naceToExio[prefix].length; key = naceToExio[prefix].join(","); break; }
            if (isicKeys.has(prefix)) { count = isicToExio[prefix].length; key = isicToExio[prefix].join(","); break; }
          }
        }

        if (count > 0) raw.set(node.id, { count, key });
        if (node.children) walkPrecise(node.children);
      }
    }

    walkPrecise(tree);
    return assignDirectionality(raw);
  }

  // Fallback: old HS-2 chapter logic — disabled in strict mode (chapter-level only)
  if (strict) return new Map();
  if (!exiobaseFactors) return new Map();
  const exKeys = new Set(Object.keys(exiobaseFactors));

  function walk(nodes: TreeNode[]) {
    for (const node of nodes) {
      const clean = stripCode(node.code);
      let matchKey = "";

      if (taxonomy === "cpc" || (taxonomy === "t2" && getT2Origin(node.id) === "cpc") || (taxonomy === "t1" && node.id.startsWith("t1-svc-"))) {
        for (let len = clean.length; len >= 4; len--) {
          const prefix = clean.substring(0, len);
          const hsMappings = concordance.cpcToHs[prefix];
          if (hsMappings && hsMappings.length > 0) {
            const chapter = hsMappings[0].code.substring(0, 2);
            if (exKeys.has(chapter)) matchKey = chapter;
            break;
          }
        }
      } else if (HS_FAMILY.includes(taxonomy) || (taxonomy === "t2" && getT2Origin(node.id) === "hts") || (taxonomy === "t1" && !node.id.startsWith("t1-svc-"))) {
        if (/^\d+$/.test(clean) && clean.length >= 2) {
          const ch = clean.substring(0, 2);
          if (exKeys.has(ch)) matchKey = ch;
        }
      }

      if (matchKey) raw.set(node.id, { count: 1, key: matchKey });
      if (node.children) walk(node.children);
    }
  }

  walk(tree);
  return assignDirectionality(raw);
}

function computeUslciCoverage(
  tree: TreeNode[],
  taxonomy: TaxonomyType,
  uslciCoverage: UslciCoverage | null,
  concordance: ConcordanceData,
  strict: boolean,
): Map<string, CoverageInfo> {
  if (!uslciCoverage) return new Map();
  const raw = new Map<string, { count: number; key: string }>();
  // Use kg-unit process count to match what the comparison panel displays
  const coverageMap = new Map(
    Object.entries(uslciCoverage.coverage)
      .filter(([, entry]) => entry.withGhgData > 0)
      .map(([key, entry]) => [key, entry.unitStats["kg"]?.count ?? entry.withGhgData] as const)
  );

  function walk(nodes: TreeNode[]) {
    for (const node of nodes) {
      const clean = stripCode(node.code);
      let count = 0;
      let matchKey = "";
      const minPrefix = strict ? clean.length : 4;

      if (taxonomy === "cpc" || (taxonomy === "t2" && getT2Origin(node.id) === "cpc") || (taxonomy === "t1" && node.id.startsWith("t1-svc-"))) {
        const matched: string[] = [];
        for (let len = clean.length; len >= minPrefix; len--) {
          const prefix = clean.substring(0, len);
          const hsMappings = concordance.cpcToHs[prefix];
          if (hsMappings && hsMappings.length > 0) {
            for (const m of hsMappings) {
              const pc = coverageMap.get(m.code);
              if (pc) { count += pc; matched.push(m.code); }
            }
            if (count > 0) { matchKey = matched.join(","); break; }
          }
        }
      } else if (taxonomy === "naics") {
        // Direct NAICS match via reverse index
        for (let len = clean.length; len >= minPrefix; len--) {
          const prefix = clean.substring(0, len);
          const matches = naicsToUslci.get(prefix);
          if (matches) {
            for (const m of matches) {
              const pc = coverageMap.get(m);
              if (pc) { count += pc; matchKey = prefix; }
            }
            if (count > 0) break;
          }
        }
      } else if (HS_FAMILY.includes(taxonomy) || (taxonomy === "t2" && getT2Origin(node.id) === "hts") || (taxonomy === "t1" && !node.id.startsWith("t1-svc-"))) {
        if (/^\d+$/.test(clean) && clean.length >= 6) {
          const hs6 = clean.substring(0, 6);
          const pc = coverageMap.get(hs6);
          if (pc) { count = pc; matchKey = hs6; }
        }
      }

      if (count > 0) raw.set(node.id, { count, key: matchKey });
      if (node.children) walk(node.children);
    }
  }

  // Build NAICS reverse index: naicsCode → list of HS keys
  const naicsToUslci = new Map<string, string[]>();
  if (taxonomy === "naics") {
    for (const [hsKey, entry] of Object.entries(uslciCoverage.coverage)) {
      for (const nc of entry.naicsCodes) {
        const list = naicsToUslci.get(nc) ?? [];
        list.push(hsKey);
        naicsToUslci.set(nc, list);
      }
    }
  }

  walk(tree);
  return assignDirectionality(raw);
}

function computeBafuCoverage(
  tree: TreeNode[],
  taxonomy: TaxonomyType,
  bafuCoverage: BafuCoverage | null,
  concordance: ConcordanceData,
  strict: boolean,
): Map<string, CoverageInfo> {
  // BAFU only has HS-2 chapter-level matching — disabled entirely in strict mode
  if (strict) return new Map();
  if (!bafuCoverage) return new Map();
  const raw = new Map<string, { count: number; key: string }>();
  // Use kg-unit process count to match what the comparison panel displays
  const coverageMap = new Map(
    Object.entries(bafuCoverage.coverage)
      .filter(([, entry]) => entry.withGhgData > 0)
      .map(([key, entry]) => [key, entry.unitStats["kg"]?.count ?? entry.withGhgData] as const)
  );

  function walk(nodes: TreeNode[]) {
    for (const node of nodes) {
      const clean = stripCode(node.code);
      let count = 0;
      let matchKey = "";

      if (taxonomy === "cpc" || (taxonomy === "t2" && getT2Origin(node.id) === "cpc") || (taxonomy === "t1" && node.id.startsWith("t1-svc-"))) {
        for (let len = clean.length; len >= 4; len--) {
          const prefix = clean.substring(0, len);
          const hsMappings = concordance.cpcToHs[prefix];
          if (hsMappings && hsMappings.length > 0) {
            const chapter = hsMappings[0].code.substring(0, 2);
            const pc = coverageMap.get(chapter);
            if (pc) { count = pc; matchKey = chapter; }
            break;
          }
        }
      } else if (HS_FAMILY.includes(taxonomy) || (taxonomy === "t2" && getT2Origin(node.id) === "hts") || (taxonomy === "t1" && !node.id.startsWith("t1-svc-"))) {
        if (/^\d+$/.test(clean) && clean.length >= 2) {
          const ch = clean.substring(0, 2);
          const pc = coverageMap.get(ch);
          if (pc) { count = pc; matchKey = ch; }
        }
      }

      if (count > 0) raw.set(node.id, { count, key: matchKey });
      if (node.children) walk(node.children);
    }
  }

  walk(tree);
  return assignDirectionality(raw);
}

function computeGabiCoverage(
  tree: TreeNode[],
  taxonomy: TaxonomyType,
  gabiCoverage: GabiCoverage | null,
  concordance: ConcordanceData,
  strict: boolean,
): Map<string, CoverageInfo> {
  // GaBi only has HS-2 chapter-level matching — disabled entirely in strict mode
  if (strict) return new Map();
  if (!gabiCoverage) return new Map();
  const raw = new Map<string, { count: number; key: string }>();
  const coverageMap = new Map(
    Object.entries(gabiCoverage.coverage)
      .filter(([, entry]) => entry.processCount > 0)
      .map(([key, entry]) => [key, entry.unitStats["kg"]?.count ?? entry.processCount] as const)
  );

  function walk(nodes: TreeNode[]) {
    for (const node of nodes) {
      const clean = stripCode(node.code);
      let count = 0;
      let matchKey = "";

      if (taxonomy === "cpc" || (taxonomy === "t2" && getT2Origin(node.id) === "cpc") || (taxonomy === "t1" && node.id.startsWith("t1-svc-"))) {
        for (let len = clean.length; len >= 4; len--) {
          const prefix = clean.substring(0, len);
          const hsMappings = concordance.cpcToHs[prefix];
          if (hsMappings && hsMappings.length > 0) {
            const chapter = hsMappings[0].code.substring(0, 2);
            const pc = coverageMap.get(chapter);
            if (pc) { count = pc; matchKey = chapter; }
            break;
          }
        }
      } else if (HS_FAMILY.includes(taxonomy) || (taxonomy === "t2" && getT2Origin(node.id) === "hts") || (taxonomy === "t1" && !node.id.startsWith("t1-svc-"))) {
        if (/^\d+$/.test(clean) && clean.length >= 2) {
          const ch = clean.substring(0, 2);
          const pc = coverageMap.get(ch);
          if (pc) { count = pc; matchKey = ch; }
        }
      }

      if (count > 0) raw.set(node.id, { count, key: matchKey });
      if (node.children) walk(node.children);
    }
  }

  walk(tree);
  return assignDirectionality(raw);
}

function EcoinventDisplay({ cpc, hs, isic, cpcCode, hsCode, isicCode, getChain, onOpenTab }: {
  cpc: EcoinventCodeMapping | null;
  hs: EcoinventCodeMapping | null;
  isic: EcoinventCodeMapping | null;
  cpcCode: string | null;
  hsCode: string | null;
  isicCode: string | null;
  getChain?: () => ResolutionChain | null;
  onOpenTab?: (tab: "concordances" | "browser", ctx?: TabNavContext) => void;
}) {
  if (!cpc && !hs && !isic) return null;

  return (
    <div className="ecoinvent-card">
      <h4>ecoinvent v3.12 Mapping</h4>
      {cpc && (
        <div className="ecoinvent-section">
          <div className="ecoinvent-header">
            <span className="ecoinvent-label">CPC {cpcCode}</span>
            <span className={`ecoinvent-type ${cpc.mappingType === "1:1" ? "type-one" : "type-many"}`}>
              {cpc.mappingType}
            </span>
            <span className="ecoinvent-count">{cpc.count} product{cpc.count !== 1 ? "s" : ""}</span>
          </div>
          <div className="ecoinvent-products">
            {cpc.products.slice(0, 5).map((p, i) => (
              <span key={i} className="ecoinvent-product">{p}</span>
            ))}
            {cpc.products.length > 5 && (
              <span className="ecoinvent-more">+{cpc.products.length - 5} more</span>
            )}
          </div>
        </div>
      )}
      {hs && (
        <div className="ecoinvent-section">
          <div className="ecoinvent-header">
            <span className="ecoinvent-label">HS {hsCode}</span>
            <span className={`ecoinvent-type ${hs.mappingType === "1:1" ? "type-one" : "type-many"}`}>
              {hs.mappingType}
            </span>
            <span className="ecoinvent-count">{hs.count} product{hs.count !== 1 ? "s" : ""}</span>
          </div>
          <div className="ecoinvent-products">
            {hs.products.slice(0, 5).map((p, i) => (
              <span key={i} className="ecoinvent-product">{p}</span>
            ))}
            {hs.products.length > 5 && (
              <span className="ecoinvent-more">+{hs.products.length - 5} more</span>
            )}
          </div>
        </div>
      )}
      {isic && (
        <div className="ecoinvent-section">
          <div className="ecoinvent-header">
            <span className="ecoinvent-label">ISIC {isicCode}</span>
            <span className={`ecoinvent-type ${isic.mappingType === "1:1" ? "type-one" : "type-many"}`}>
              {isic.mappingType}
            </span>
            <span className="ecoinvent-count">{isic.count} product{isic.count !== 1 ? "s" : ""}</span>
          </div>
          <div className="ecoinvent-products">
            {isic.products.slice(0, 5).map((p, i) => (
              <span key={i} className="ecoinvent-product">{p}</span>
            ))}
            {isic.products.length > 5 && (
              <span className="ecoinvent-more">+{isic.products.length - 5} more</span>
            )}
          </div>
        </div>
      )}
      {getChain && <ResolutionChainToggle getChain={getChain} onOpenTab={onOpenTab} />}
    </div>
  );
}

// Filter tree data to only include nodes matching a search term (and their ancestors)
function filterTreeData(tree: TreeNode[], term: string): TreeNode[] {
  if (!term.trim()) return tree;
  const lower = term.trim().toLowerCase();

  function nodeMatches(node: TreeNode): boolean {
    return (
      node.code.toLowerCase().includes(lower) ||
      node.name.toLowerCase().includes(lower)
    );
  }

  function filterNodes(nodes: TreeNode[]): TreeNode[] {
    const result: TreeNode[] = [];
    for (const node of nodes) {
      if (nodeMatches(node)) {
        // Node matches: include it with all its children
        result.push(node);
      } else if (node.children) {
        // Node doesn't match: check if any descendants match
        const filteredChildren = filterNodes(node.children);
        if (filteredChildren.length > 0) {
          result.push({ ...node, children: filteredChildren });
        }
      }
    }
    return result;
  }

  return filterNodes(tree);
}

function App() {
  return (
    <BuilderProvider>
      <AppContent />
    </BuilderProvider>
  );
}

function AppContent() {
  const { state: builderState, dispatch: builderDispatch } = useBuilder();
  const { data, loading, error } = useData();
  const [search, setSearch] = useState("");
  const [leftTaxonomy, setLeftTaxonomy] = useState<TaxonomyType>("hs");
  const [rightTaxonomy, setRightTaxonomy] = useState<TaxonomyType>("cpc");
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [selectedFrom, setSelectedFrom] = useState<TaxonomyType | null>(null);
  const [showBaseTaxonomyDialog, setShowBaseTaxonomyDialog] = useState(false);
  const [showLibraryDialog, setShowLibraryDialog] = useState(false);
  const [mappingPanelCollapsed, setMappingPanelCollapsed] = useState(false);
  const [panelHeight, setPanelHeight] = useState(200);
  const [strictMatch, setStrictMatch] = useState(true);
  const [gapHighlight, setGapHighlight] = useState<{
    taxonomy: TaxonomyType;
    db: string;
    dbLabel: string;
    leafIds: Set<string>;
    ancestorIds: Set<string>;
  } | null>(null);
  const aboutRef = useRef<AboutSectionHandle>(null);
  const panelDragging = useRef(false);

  // Resizable bottom panel drag handler
  const handlePanelDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    panelDragging.current = true;
    const startY = e.clientY;
    const startH = panelHeight;
    const onMove = (ev: MouseEvent) => {
      if (!panelDragging.current) return;
      const delta = startY - ev.clientY;
      setPanelHeight(Math.max(80, Math.min(window.innerHeight * 0.7, startH + delta)));
    };
    const onUp = () => {
      panelDragging.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [panelHeight]);

  // Debounced search for performance with large trees
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(timer);
  }, [search]);

  const treeRefs: Record<TaxonomyType, React.RefObject<TreeApi<TreeNode> | null>> = {
    hs: useRef<TreeApi<TreeNode>>(null),
    cn: useRef<TreeApi<TreeNode>>(null),
    hts: useRef<TreeApi<TreeNode>>(null),
    ca: useRef<TreeApi<TreeNode>>(null),
    cpc: useRef<TreeApi<TreeNode>>(null),
    unspsc: useRef<TreeApi<TreeNode>>(null),
    t1: useRef<TreeApi<TreeNode>>(null),
    t2: useRef<TreeApi<TreeNode>>(null),
    naics: useRef<TreeApi<TreeNode>>(null),
    isic: useRef<TreeApi<TreeNode>>(null),
    nace: useRef<TreeApi<TreeNode>>(null),
    cpa: useRef<TreeApi<TreeNode>>(null),
    bea: useRef<TreeApi<TreeNode>>(null),
  };

  const getTreeData = useCallback((taxonomy: TaxonomyType): TreeNode[] => {
    if (!data) return [];
    const map: Record<string, TreeNode[]> = {
      hs: data.hsTree, cn: data.cnTree, hts: data.htsTree, ca: data.caTree, cpc: data.cpcTree, unspsc: data.unspscTree, t1: data.t1Tree, t2: data.t2Tree,
      naics: data.naicsTree, isic: data.isicTree, nace: data.naceTree, cpa: data.cpaTree, bea: data.beaTree,
    };
    return map[taxonomy] ?? [];
  }, [data]);

  const getLookup = useCallback((taxonomy: TaxonomyType): Record<string, LookupEntry> => {
    if (!data) return {};
    const map: Record<string, Record<string, LookupEntry>> = {
      hs: data.hsLookup, cn: data.cnLookup, hts: data.htsLookup, ca: data.caLookup, cpc: data.cpcLookup, unspsc: data.unspscLookup, t1: data.t1Lookup, t2: data.t2Lookup,
      naics: data.naicsLookup, isic: data.isicLookup, nace: data.naceLookup, cpa: data.cpaLookup, bea: data.beaLookup,
    };
    return map[taxonomy] ?? {};
  }, [data]);

  // Compute filtered tree data for each pane
  const isSearching = debouncedSearch.trim().length > 0;

  const leftTreeData = useMemo(
    () => filterTreeData(getTreeData(leftTaxonomy), debouncedSearch),
    [data, leftTaxonomy, debouncedSearch, getTreeData]
  );
  const rightTreeData = useMemo(
    () => filterTreeData(getTreeData(rightTaxonomy), debouncedSearch),
    [data, rightTaxonomy, debouncedSearch, getTreeData]
  );

  // Helper: find concordance-based taxonomy entry from an HS code
  const findConcordanceMappedEntry = useCallback((hsCode: string, targetTax: TaxonomyType): MappedEntry | null => {
    if (!data) return null;
    const targetLookup = getLookup(targetTax);
    for (let len = Math.min(6, hsCode.length); len >= 4; len -= 2) {
      const prefix = hsCode.substring(0, len);
      const code = resolveFromHsCode(prefix, targetTax, data.naicsHsConcordance, data.isicCpcConcordance, data.cpaHsConcordance, data.beaHsConcordance, data.concordance);
      if (code && targetLookup[code]) {
        return {
          taxonomy: targetTax,
          code,
          description: targetLookup[code].description,
          nodeId: `${targetTax}-${code}`,
        };
      }
    }
    return null;
  }, [data, getLookup]);

  // Unified helper: findMappedEntry + concordance fallback
  const findAnyMappedEntry = useCallback((hsCode: string, targetTax: TaxonomyType): MappedEntry | null => {
    if (!data) return null;
    if (CONCORDANCE_TAXONOMIES.includes(targetTax)) {
      return findConcordanceMappedEntry(hsCode, targetTax);
    }
    return findMappedEntry(hsCode, targetTax, getLookup(targetTax), data.concordance);
  }, [data, getLookup, findConcordanceMappedEntry]);

  // Compute mappings from selected node to all other taxonomies
  const mappings = useMemo(() => {
    if (!selectedNode || !selectedFrom || !data) return [];

    // Helper: find T1 mapping entry from an HS base code (for other taxonomies mapping TO T1)
    const findT1Entry = (hsBase: string): MappedEntry | null => {
      const t1Lookup = getLookup("t1");
      // T1's HTS portion uses same lookup keys as HTS
      const htsEntry = findMappedEntry(hsBase, "hts", t1Lookup, data.concordance);
      if (htsEntry) {
        return { ...htsEntry, taxonomy: "t1", nodeId: htsEntry.nodeId ? htsEntry.nodeId.replace("hts-", "t1-") : null };
      }
      return null;
    };

    // Helper: find T2 mapping entry from an HS base code (for other taxonomies mapping TO T2)
    const findT2Entry = (hsBase: string): MappedEntry | null => {
      const t2Lookup = getLookup("t2");
      // T2's HTS detail nodes use HTS{code} keys
      const htsKey = `HTS${hsBase}`;
      if (t2Lookup[htsKey]) {
        return {
          taxonomy: "t2",
          code: t2Lookup[htsKey].code,
          description: t2Lookup[htsKey].description,
          nodeId: `t2-hts-${hsBase}`,
        };
      }
      // Try 8-digit +00 fallback
      const htsKey00 = `HTS${hsBase}00`;
      if (t2Lookup[htsKey00]) {
        return {
          taxonomy: "t2",
          code: t2Lookup[htsKey00].code,
          description: t2Lookup[htsKey00].description,
          nodeId: `t2-hts-${hsBase}00`,
        };
      }
      // Fallback: try CPC backbone via concordance
      const cpcMappings = data.concordance.hsToCpc[hsBase];
      if (cpcMappings && cpcMappings.length > 0) {
        const cpcCode = cpcMappings[0].code;
        if (t2Lookup[cpcCode]) {
          return {
            taxonomy: "t2",
            code: cpcCode,
            description: t2Lookup[cpcCode].description,
            nodeId: `t2-${cpcCode}`,
          };
        }
      }
      return null;
    };

    // Case 1: Source is an HS-family taxonomy
    if (HS_FAMILY.includes(selectedFrom)) {
      const hsBase = getHsBase(selectedNode.code, selectedFrom);
      if (!hsBase) return [];
      const results: MappedEntry[] = [];
      for (const tax of ALL_TAXONOMIES) {
        if (tax === selectedFrom) continue;
        if (tax === "unspsc") {
          const fuzzyEntries = findFuzzyMappedEntries(hsBase, selectedFrom, "unspsc", data.unspscHsMapping, getLookup("unspsc"));
          results.push(...fuzzyEntries);
        } else if (tax === "t1") {
          const entry = findT1Entry(hsBase);
          if (entry) results.push(entry);
        } else if (tax === "t2") {
          const entry = findT2Entry(hsBase);
          if (entry) results.push(entry);
        } else {
          const entry = findAnyMappedEntry(hsBase, tax);
          if (entry) results.push(entry);
        }
      }
      return results;
    }

    // Case 2: Source is CPC - use concordance reverse lookup
    if (selectedFrom === "cpc") {
      const cleanCpc = stripCode(selectedNode.code);
      for (let len = cleanCpc.length; len >= 4; len--) {
        const prefix = cleanCpc.substring(0, len);
        const hsMappings = data.concordance.cpcToHs[prefix];
        if (hsMappings && hsMappings.length > 0) {
          const firstHsCode = hsMappings[0].code;
          const results: MappedEntry[] = [];
          for (const tax of ALL_TAXONOMIES) {
            if (tax === "cpc") continue;
            if (tax === "unspsc") {
              const fuzzyEntries = findFuzzyMappedEntries(firstHsCode, "hs", "unspsc", data.unspscHsMapping, getLookup("unspsc"));
              results.push(...fuzzyEntries);
            } else if (tax === "t1") {
              const entry = findT1Entry(firstHsCode);
              if (entry) results.push(entry);
            } else if (tax === "t2") {
              // T2: try HTS detail first, then CPC backbone
              const htsEntry = findT2Entry(firstHsCode);
              if (htsEntry) results.push(htsEntry);
              else {
                // Direct CPC backbone match
                const t2Lookup = getLookup("t2");
                if (t2Lookup[prefix]) {
                  results.push({
                    taxonomy: "t2",
                    code: prefix,
                    description: t2Lookup[prefix].description,
                    nodeId: `t2-${prefix}`,
                  });
                }
              }
            } else {
              const entry = findAnyMappedEntry(firstHsCode, tax);
              if (entry) results.push(entry);
            }
          }
          return results;
        }
      }
    }

    // Case 3: Source is UNSPSC - use fuzzy mapping to find HS, then chain
    if (selectedFrom === "unspsc") {
      const cleanCode = stripCode(selectedNode.code);
      const hsEntries = findFuzzyMappedEntries(cleanCode, "unspsc", "hs", data.unspscHsMapping, getLookup("hs"));
      if (hsEntries.length === 0) return [];

      const results: MappedEntry[] = [...hsEntries];
      const firstHsCode = hsEntries[0].code;

      for (const tax of ALL_TAXONOMIES) {
        if (tax === "unspsc" || tax === "hs") continue;
        if (tax === "t1") {
          const entry = findT1Entry(firstHsCode);
          if (entry) results.push(entry);
        } else if (tax === "t2") {
          const entry = findT2Entry(firstHsCode);
          if (entry) results.push(entry);
        } else {
          const entry = findAnyMappedEntry(firstHsCode, tax);
          if (entry) results.push(entry);
        }
      }
      return results;
    }

    // Case 4: Source is T1 — detect origin (HTS or CPC) and delegate
    if (selectedFrom === "t1") {
      const t1Lookup = getLookup("t1");
      const origin = getT1Origin(selectedNode.id, t1Lookup, selectedNode.code);
      if (!origin) return [];

      if (origin === "hts") {
        // HTS-origin: same as HS-family mapping
        const hsBase = getHsBase(selectedNode.code, "hts");
        if (!hsBase) return [];
        const results: MappedEntry[] = [];
        for (const tax of ALL_TAXONOMIES) {
          if (tax === "t1") continue;
          if (tax === "unspsc") {
            const fuzzyEntries = findFuzzyMappedEntries(hsBase, "hts", "unspsc", data.unspscHsMapping, getLookup("unspsc"));
            results.push(...fuzzyEntries);
          } else if (tax === "t2") {
            const entry = findT2Entry(hsBase);
            if (entry) results.push(entry);
          } else {
            const entry = findAnyMappedEntry(hsBase, tax);
            if (entry) results.push(entry);
          }
        }
        return results;
      }

      if (origin === "cpc") {
        // CPC-origin: use concordance reverse lookup
        const originalCode = getT1OriginalCode(selectedNode.code, "cpc", t1Lookup);
        for (let len = originalCode.length; len >= 4; len--) {
          const prefix = originalCode.substring(0, len);
          const hsMappings = data.concordance.cpcToHs[prefix];
          if (hsMappings && hsMappings.length > 0) {
            const firstHsCode = hsMappings[0].code;
            const results: MappedEntry[] = [];
            for (const tax of ALL_TAXONOMIES) {
              if (tax === "t1") continue;
              if (tax === "unspsc") {
                const fuzzyEntries = findFuzzyMappedEntries(firstHsCode, "hs", "unspsc", data.unspscHsMapping, getLookup("unspsc"));
                results.push(...fuzzyEntries);
              } else if (tax === "t2") {
                const entry = findT2Entry(firstHsCode);
                if (entry) results.push(entry);
              } else {
                const entry = findAnyMappedEntry(firstHsCode, tax);
                if (entry) results.push(entry);
              }
            }
            return results;
          }
        }
      }
    }

    // Case 5: Source is T2 — detect origin (CPC backbone or HTS detail) and delegate
    if (selectedFrom === "t2") {
      const origin = getT2Origin(selectedNode.id);
      if (!origin) return [];

      if (origin === "hts") {
        // HTS detail node: use HS-family matching
        const hsBase = getHsBase(selectedNode.code, "hts");
        if (!hsBase) return [];
        const results: MappedEntry[] = [];
        for (const tax of ALL_TAXONOMIES) {
          if (tax === "t2") continue;
          if (tax === "unspsc") {
            const fuzzyEntries = findFuzzyMappedEntries(hsBase, "hts", "unspsc", data.unspscHsMapping, getLookup("unspsc"));
            results.push(...fuzzyEntries);
          } else if (tax === "t1") {
            const entry = findT1Entry(hsBase);
            if (entry) results.push(entry);
          } else {
            const entry = findAnyMappedEntry(hsBase, tax);
            if (entry) results.push(entry);
          }
        }
        return results;
      }

      if (origin === "cpc") {
        // CPC backbone node: use concordance reverse lookup
        const cleanCpc = stripCode(selectedNode.code);
        for (let len = cleanCpc.length; len >= 4; len--) {
          const prefix = cleanCpc.substring(0, len);
          const hsMappings = data.concordance.cpcToHs[prefix];
          if (hsMappings && hsMappings.length > 0) {
            const firstHsCode = hsMappings[0].code;
            const results: MappedEntry[] = [];
            for (const tax of ALL_TAXONOMIES) {
              if (tax === "t2") continue;
              if (tax === "unspsc") {
                const fuzzyEntries = findFuzzyMappedEntries(firstHsCode, "hs", "unspsc", data.unspscHsMapping, getLookup("unspsc"));
                results.push(...fuzzyEntries);
              } else if (tax === "t1") {
                const entry = findT1Entry(firstHsCode);
                if (entry) results.push(entry);
              } else {
                const entry = findAnyMappedEntry(firstHsCode, tax);
                if (entry) results.push(entry);
              }
            }
            return results;
          }
        }
      }
    }

    // Case 6: Source is a concordance-based taxonomy (NAICS, ISIC, NACE, CPA, BEA)
    if (CONCORDANCE_TAXONOMIES.includes(selectedFrom)) {
      const clean = stripCode(selectedNode.code);
      const hsCodes = resolveToHsCodes(clean, selectedFrom, data.naicsHsConcordance, data.isicCpcConcordance, data.cpaHsConcordance, data.beaHsConcordance, data.concordance);
      if (hsCodes.length === 0) return [];
      const firstHsCode = hsCodes[0];
      const results: MappedEntry[] = [];
      for (const tax of ALL_TAXONOMIES) {
        if (tax === selectedFrom) continue;
        // Direct BEA↔NAICS shortcut (prefer over HS-hop)
        if (data.beaNaicsConcordance &&
            ((selectedFrom === "bea" && tax === "naics") || (selectedFrom === "naics" && tax === "bea"))) {
          const directMappings = selectedFrom === "bea"
            ? data.beaNaicsConcordance.forward[clean]
            : data.beaNaicsConcordance.reverse[clean];
          if (directMappings && directMappings.length > 0) {
            const targetLookup = getLookup(tax);
            const directCode = directMappings[0].code;
            if (targetLookup[directCode]) {
              results.push({ taxonomy: tax, code: directCode, description: targetLookup[directCode].description, nodeId: `${tax}-${directCode}` });
              continue;
            }
          }
        }
        if (tax === "unspsc") {
          const fuzzyEntries = findFuzzyMappedEntries(firstHsCode, "hs", "unspsc", data.unspscHsMapping, getLookup("unspsc"));
          results.push(...fuzzyEntries);
        } else if (tax === "t1") {
          const entry = findT1Entry(firstHsCode);
          if (entry) results.push(entry);
        } else if (tax === "t2") {
          const entry = findT2Entry(firstHsCode);
          if (entry) results.push(entry);
        } else if (CONCORDANCE_TAXONOMIES.includes(tax)) {
          const entry = findConcordanceMappedEntry(firstHsCode, tax);
          if (entry) results.push(entry);
        } else {
          const entry = findAnyMappedEntry(firstHsCode, tax);
          if (entry) results.push(entry);
        }
      }
      return results;
    }

    return [];
  }, [selectedNode, selectedFrom, data, getLookup, findAnyMappedEntry, findConcordanceMappedEntry]);

  // Compute emission factor for selected node
  const emissionFactor = useMemo(() => {
    if (!selectedNode || !selectedFrom || !data) return null;
    return getEmissionFactor(selectedNode, selectedFrom, data.emissionFactors, data.concordance);
  }, [selectedNode, selectedFrom, data]);

  const exiobaseFactor = useMemo(() => {
    if (!selectedNode || !selectedFrom || !data) return null;
    return getExiobaseFactor(selectedNode, selectedFrom, data.exiobaseFactors, data.concordance);
  }, [selectedNode, selectedFrom, data]);

  const exiobaseProducts = useMemo(() => {
    if (!selectedNode || !selectedFrom || !data) return null;
    return getExiobaseProducts(selectedNode, selectedFrom, data.exiobaseConcordance, data.concordance);
  }, [selectedNode, selectedFrom, data]);

  const bafuFactor = useMemo(() => {
    if (!selectedNode || !selectedFrom || !data) return null;
    return getBafuChapterData(selectedNode, selectedFrom, data.bafuCoverage, data.concordance);
  }, [selectedNode, selectedFrom, data]);

  const gabiFactor = useMemo(() => {
    if (!selectedNode || !selectedFrom || !data) return null;
    return getGabiChapterData(selectedNode, selectedFrom, data.gabiCoverage, data.concordance);
  }, [selectedNode, selectedFrom, data]);

  const uslciFactor = useMemo(() => {
    if (!selectedNode || !selectedFrom || !data) return null;
    return getUslciData(selectedNode, selectedFrom, data.uslciCoverage, data.concordance);
  }, [selectedNode, selectedFrom, data]);

  // Handle node selection: update state + sync other pane
  const handleNodeSelect = useCallback(
    (pane: "left" | "right", node: TreeNode) => {
      const sourceTax = pane === "left" ? leftTaxonomy : rightTaxonomy;
      const otherTax = pane === "left" ? rightTaxonomy : leftTaxonomy;

      setSelectedNode(node);
      setSelectedFrom(sourceTax);

      if (!data) return;

      let mappedNodeId: string | null = null;

      // Helper: find T1 node ID from an HS base code
      const findT1NodeId = (hsBase: string): string | null => {
        const t1Lookup = getLookup("t1");
        const htsEntry = findMappedEntry(hsBase, "hts", t1Lookup, data.concordance);
        return htsEntry?.nodeId ? htsEntry.nodeId.replace("hts-", "t1-") : null;
      };

      // Helper: find T2 node ID from an HS base code (try HTS detail, then CPC backbone)
      const findT2NodeId = (hsBase: string): string | null => {
        const t2Lookup = getLookup("t2");
        // Try HTS detail node first
        const htsKey = `HTS${hsBase}`;
        if (t2Lookup[htsKey]) return `t2-hts-${hsBase}`;
        const htsKey00 = `HTS${hsBase}00`;
        if (t2Lookup[htsKey00]) return `t2-hts-${hsBase}00`;
        // Fallback: CPC backbone via concordance
        const cpcMappings = data.concordance.hsToCpc[hsBase];
        if (cpcMappings && cpcMappings.length > 0) {
          const cpcCode = cpcMappings[0].code;
          if (t2Lookup[cpcCode]) return `t2-${cpcCode}`;
        }
        return null;
      };

      if (HS_FAMILY.includes(sourceTax)) {
        const hsBase = getHsBase(node.code, sourceTax);
        if (hsBase) {
          if (otherTax === "unspsc") {
            const fuzzy = findFuzzyMappedEntries(hsBase, sourceTax, "unspsc", data.unspscHsMapping, getLookup("unspsc"));
            mappedNodeId = fuzzy[0]?.nodeId ?? null;
          } else if (otherTax === "t1") {
            mappedNodeId = findT1NodeId(hsBase);
          } else if (otherTax === "t2") {
            mappedNodeId = findT2NodeId(hsBase);
          } else {
            const mapped = findAnyMappedEntry(hsBase, otherTax);
            mappedNodeId = mapped?.nodeId ?? null;
          }
        }
      } else if (sourceTax === "cpc") {
        const cleanCpc = stripCode(node.code);
        for (let len = cleanCpc.length; len >= 4; len--) {
          const prefix = cleanCpc.substring(0, len);
          const hsMappings = data.concordance.cpcToHs[prefix];
          if (hsMappings && hsMappings.length > 0) {
            if (otherTax === "cpc") break;
            const firstHsCode = hsMappings[0].code;
            if (otherTax === "unspsc") {
              const fuzzy = findFuzzyMappedEntries(firstHsCode, "hs", "unspsc", data.unspscHsMapping, getLookup("unspsc"));
              mappedNodeId = fuzzy[0]?.nodeId ?? null;
            } else if (otherTax === "t1") {
              mappedNodeId = findT1NodeId(firstHsCode);
            } else if (otherTax === "t2") {
              // T2: prefer CPC backbone (direct match), else HTS detail
              const t2Lookup = getLookup("t2");
              if (t2Lookup[prefix]) {
                mappedNodeId = `t2-${prefix}`;
              } else {
                mappedNodeId = findT2NodeId(firstHsCode);
              }
            } else {
              const mapped = findAnyMappedEntry(firstHsCode, otherTax);
              mappedNodeId = mapped?.nodeId ?? null;
            }
            break;
          }
        }
      } else if (sourceTax === "unspsc") {
        const cleanCode = stripCode(node.code);
        const hsEntries = findFuzzyMappedEntries(cleanCode, "unspsc", "hs", data.unspscHsMapping, getLookup("hs"));
        if (hsEntries.length > 0) {
          const firstHsCode = hsEntries[0].code;
          if (otherTax === "hs") {
            mappedNodeId = `hs-${firstHsCode}`;
          } else if (otherTax === "unspsc") {
            // both UNSPSC, no cross-mapping
          } else if (otherTax === "t1") {
            mappedNodeId = findT1NodeId(firstHsCode);
          } else if (otherTax === "t2") {
            mappedNodeId = findT2NodeId(firstHsCode);
          } else {
            const mapped = findAnyMappedEntry(firstHsCode, otherTax);
            mappedNodeId = mapped?.nodeId ?? null;
          }
        }
      } else if (sourceTax === "t1") {
        // T1 source: detect origin and delegate
        const t1Lookup = getLookup("t1");
        const origin = getT1Origin(node.id, t1Lookup, node.code);
        if (origin === "hts") {
          const hsBase = getHsBase(node.code, "hts");
          if (hsBase) {
            if (otherTax === "unspsc") {
              const fuzzy = findFuzzyMappedEntries(hsBase, "hts", "unspsc", data.unspscHsMapping, getLookup("unspsc"));
              mappedNodeId = fuzzy[0]?.nodeId ?? null;
            } else if (otherTax === "t1") {
              // both T1, no cross-mapping
            } else if (otherTax === "t2") {
              mappedNodeId = findT2NodeId(hsBase);
            } else {
              const mapped = findAnyMappedEntry(hsBase, otherTax);
              mappedNodeId = mapped?.nodeId ?? null;
            }
          }
        } else if (origin === "cpc") {
          const originalCode = getT1OriginalCode(node.code, "cpc", t1Lookup);
          for (let len = originalCode.length; len >= 4; len--) {
            const prefix = originalCode.substring(0, len);
            const hsMappings = data.concordance.cpcToHs[prefix];
            if (hsMappings && hsMappings.length > 0) {
              const firstHsCode = hsMappings[0].code;
              if (otherTax === "unspsc") {
                const fuzzy = findFuzzyMappedEntries(firstHsCode, "hs", "unspsc", data.unspscHsMapping, getLookup("unspsc"));
                mappedNodeId = fuzzy[0]?.nodeId ?? null;
              } else if (otherTax === "t1") {
                // both T1
              } else if (otherTax === "t2") {
                mappedNodeId = findT2NodeId(firstHsCode);
              } else {
                const mapped = findAnyMappedEntry(firstHsCode, otherTax);
                mappedNodeId = mapped?.nodeId ?? null;
              }
              break;
            }
          }
        }
      } else if (sourceTax === "t2") {
        // T2 source: detect origin and delegate
        const origin = getT2Origin(node.id);
        if (origin === "hts") {
          // HTS detail node: use HS-family matching
          const hsBase = getHsBase(node.code, "hts");
          if (hsBase) {
            if (otherTax === "unspsc") {
              const fuzzy = findFuzzyMappedEntries(hsBase, "hts", "unspsc", data.unspscHsMapping, getLookup("unspsc"));
              mappedNodeId = fuzzy[0]?.nodeId ?? null;
            } else if (otherTax === "t1") {
              mappedNodeId = findT1NodeId(hsBase);
            } else if (otherTax === "t2") {
              // both T2, no cross-mapping
            } else {
              const mapped = findAnyMappedEntry(hsBase, otherTax);
              mappedNodeId = mapped?.nodeId ?? null;
            }
          }
        } else if (origin === "cpc") {
          // CPC backbone node: use concordance reverse lookup
          const cleanCpc = stripCode(node.code);
          for (let len = cleanCpc.length; len >= 4; len--) {
            const prefix = cleanCpc.substring(0, len);
            const hsMappings = data.concordance.cpcToHs[prefix];
            if (hsMappings && hsMappings.length > 0) {
              const firstHsCode = hsMappings[0].code;
              if (otherTax === "unspsc") {
                const fuzzy = findFuzzyMappedEntries(firstHsCode, "hs", "unspsc", data.unspscHsMapping, getLookup("unspsc"));
                mappedNodeId = fuzzy[0]?.nodeId ?? null;
              } else if (otherTax === "t1") {
                mappedNodeId = findT1NodeId(firstHsCode);
              } else if (otherTax === "t2") {
                // both T2
              } else {
                const mapped = findAnyMappedEntry(firstHsCode, otherTax);
                mappedNodeId = mapped?.nodeId ?? null;
              }
              break;
            }
          }
        }
      } else if (CONCORDANCE_TAXONOMIES.includes(sourceTax)) {
        // Source is NAICS/ISIC/NACE/CPA/BEA: resolve to HS codes via concordance
        const clean = stripCode(node.code);
        const hsCodes = resolveToHsCodes(clean, sourceTax, data.naicsHsConcordance, data.isicCpcConcordance, data.cpaHsConcordance, data.beaHsConcordance, data.concordance);
        if (hsCodes.length > 0) {
          const firstHsCode = hsCodes[0];
          if (otherTax === "unspsc") {
            const fuzzy = findFuzzyMappedEntries(firstHsCode, "hs", "unspsc", data.unspscHsMapping, getLookup("unspsc"));
            mappedNodeId = fuzzy[0]?.nodeId ?? null;
          } else if (otherTax === "t1") {
            mappedNodeId = findT1NodeId(firstHsCode);
          } else if (otherTax === "t2") {
            mappedNodeId = findT2NodeId(firstHsCode);
          } else {
            const mapped = findAnyMappedEntry(firstHsCode, otherTax);
            mappedNodeId = mapped?.nodeId ?? null;
          }
        }
      }

      // Cross-pane sync: open ancestors level by level, then scroll to and select
      if (mappedNodeId) {
        const otherRef = treeRefs[otherTax];
        const treeData = getTreeData(otherTax);
        const ancestorPath = findPathToNode(treeData, mappedNodeId);

        // Open each ancestor sequentially (each needs a re-render before the next is visible)
        let delay = 50;
        for (const ancestorId of ancestorPath) {
          setTimeout(() => {
            const tree = otherRef.current;
            if (tree) {
              const ancestor = tree.get(ancestorId);
              if (ancestor && !ancestor.isOpen) ancestor.open();
            }
          }, delay);
          delay += 80;
        }

        // After all ancestors are opened, scroll to and select the target
        setTimeout(() => {
          const tree = otherRef.current;
          if (tree) {
            const targetNode = tree.get(mappedNodeId!);
            if (targetNode) {
              tree.scrollTo(targetNode.id);
              targetNode.select();
            }
          }
        }, delay + 100);
      }
    },
    [leftTaxonomy, rightTaxonomy, data, getLookup, findAnyMappedEntry, treeRefs, getTreeData]
  );

  // Handle gap drilldown "Show in tree" navigation
  const handleNavigateToNode = useCallback(
    (taxonomy: TaxonomyType, nodeId: string) => {
      // Switch left pane to the target taxonomy if it's not already showing
      if (leftTaxonomy !== taxonomy && rightTaxonomy !== taxonomy) {
        setLeftTaxonomy(taxonomy);
      }

      // Determine which pane has this taxonomy
      const targetPane = leftTaxonomy === taxonomy ? "left" : rightTaxonomy === taxonomy ? "right" : "left";
      const treeRef = treeRefs[taxonomy];
      const treeData = getTreeData(taxonomy);

      // Allow time for taxonomy switch + modal close before navigating
      setTimeout(() => {
        const ancestorPath = findPathToNode(treeData, nodeId);
        let delay = 50;
        for (const ancestorId of ancestorPath) {
          setTimeout(() => {
            const tree = treeRef.current;
            if (tree) {
              const ancestor = tree.get(ancestorId);
              if (ancestor && !ancestor.isOpen) ancestor.open();
            }
          }, delay);
          delay += 80;
        }
        setTimeout(() => {
          const tree = treeRef.current;
          if (tree) {
            const targetNode = tree.get(nodeId);
            if (targetNode) {
              tree.scrollTo(targetNode.id);
              targetNode.select();
            }
          }
        }, delay + 100);
      }, 300);
    },
    [leftTaxonomy, rightTaxonomy, treeRefs, getTreeData]
  );

  // Handle gap highlight activation from Coverage Matrix drilldown
  const handleHighlightGaps = useCallback(
    (taxonomy: TaxonomyType, dbKey: string, dbLabel: string, uncoveredLeafIds: string[]) => {
      // Switch left pane to the target taxonomy
      if (leftTaxonomy !== taxonomy) {
        setLeftTaxonomy(taxonomy);
      }

      const leafIdSet = new Set(uncoveredLeafIds);

      // Build ancestor set: for each uncovered leaf, find all its ancestors
      const treeData = getTreeData(taxonomy);
      const ancestorSet = new Set<string>();
      for (const leafId of uncoveredLeafIds) {
        const path = findPathToNode(treeData, leafId);
        for (const id of path) ancestorSet.add(id);
      }

      setGapHighlight({ taxonomy, db: dbKey, dbLabel, leafIds: leafIdSet, ancestorIds: ancestorSet });
    },
    [leftTaxonomy, getTreeData]
  );

  // Clear gap highlight when taxonomy changes away from highlighted one
  useEffect(() => {
    if (gapHighlight && leftTaxonomy !== gapHighlight.taxonomy) {
      setGapHighlight(null);
    }
  }, [leftTaxonomy, gapHighlight]);

  // Handle builder custom node click → map to left pane via sourceOrigin
  const handleBuilderNodeSelect = useCallback(
    (node: TreeNode) => {
      if (node.id === "custom-root") return;
      const customNode = findCustomNodeById(builderState.customTree, node.id);
      if (!customNode?.sourceOrigin) {
        // New node with no source origin — just show it as selected, no mapping
        setSelectedNode(node);
        setSelectedFrom(null);
        return;
      }

      const origin = customNode.sourceOrigin;
      const sourceTax = origin.taxonomy;
      const otherTax = leftTaxonomy;

      // Create a synthetic node with the original taxonomy's ID/code
      const syntheticNode: TreeNode = {
        id: origin.originalNodeId,
        code: origin.originalCode,
        name: node.name,
        type: node.type,
      };

      setSelectedNode(syntheticNode);
      setSelectedFrom(sourceTax);

      if (!data) return;

      // Reuse the same mapping logic as handleNodeSelect but with explicit sourceTax
      let mappedNodeId: string | null = null;

      const findT1NodeId = (hsBase: string): string | null => {
        const t1Lookup = getLookup("t1");
        const htsEntry = findMappedEntry(hsBase, "hts", t1Lookup, data.concordance);
        return htsEntry?.nodeId ? htsEntry.nodeId.replace("hts-", "t1-") : null;
      };

      const findT2NodeId = (hsBase: string): string | null => {
        const t2Lookup = getLookup("t2");
        const htsKey = `HTS${hsBase}`;
        if (t2Lookup[htsKey]) return `t2-hts-${hsBase}`;
        const htsKey00 = `HTS${hsBase}00`;
        if (t2Lookup[htsKey00]) return `t2-hts-${hsBase}00`;
        const cpcMappings = data.concordance.hsToCpc[hsBase];
        if (cpcMappings && cpcMappings.length > 0) {
          const cpcCode = cpcMappings[0].code;
          if (t2Lookup[cpcCode]) return `t2-${cpcCode}`;
        }
        return null;
      };

      if (HS_FAMILY.includes(sourceTax)) {
        const hsBase = getHsBase(syntheticNode.code, sourceTax);
        if (hsBase) {
          if (otherTax === "unspsc") {
            const fuzzy = findFuzzyMappedEntries(hsBase, sourceTax, "unspsc", data.unspscHsMapping, getLookup("unspsc"));
            mappedNodeId = fuzzy[0]?.nodeId ?? null;
          } else if (otherTax === "t1") {
            mappedNodeId = findT1NodeId(hsBase);
          } else if (otherTax === "t2") {
            mappedNodeId = findT2NodeId(hsBase);
          } else {
            const mapped = findAnyMappedEntry(hsBase, otherTax);
            mappedNodeId = mapped?.nodeId ?? null;
          }
        }
      } else if (sourceTax === "cpc") {
        const cleanCpc = stripCode(syntheticNode.code);
        for (let len = cleanCpc.length; len >= 4; len--) {
          const prefix = cleanCpc.substring(0, len);
          const hsMappings = data.concordance.cpcToHs[prefix];
          if (hsMappings && hsMappings.length > 0) {
            if (otherTax === "cpc") break;
            const firstHsCode = hsMappings[0].code;
            if (otherTax === "unspsc") {
              const fuzzy = findFuzzyMappedEntries(firstHsCode, "hs", "unspsc", data.unspscHsMapping, getLookup("unspsc"));
              mappedNodeId = fuzzy[0]?.nodeId ?? null;
            } else if (otherTax === "t1") {
              mappedNodeId = findT1NodeId(firstHsCode);
            } else if (otherTax === "t2") {
              const t2Lookup = getLookup("t2");
              if (t2Lookup[prefix]) {
                mappedNodeId = `t2-${prefix}`;
              } else {
                mappedNodeId = findT2NodeId(firstHsCode);
              }
            } else {
              const mapped = findAnyMappedEntry(firstHsCode, otherTax);
              mappedNodeId = mapped?.nodeId ?? null;
            }
            break;
          }
        }
      } else if (sourceTax === "t1") {
        const t1Lookup = getLookup("t1");
        const t1Origin = getT1Origin(syntheticNode.id, t1Lookup, syntheticNode.code);
        if (t1Origin === "hts") {
          const hsBase = getHsBase(syntheticNode.code, "hts");
          if (hsBase) {
            if (otherTax === "t2") mappedNodeId = findT2NodeId(hsBase);
            else if (otherTax !== "t1") {
              if (otherTax === "unspsc") {
                const fuzzy = findFuzzyMappedEntries(hsBase, "hts", "unspsc", data.unspscHsMapping, getLookup("unspsc"));
                mappedNodeId = fuzzy[0]?.nodeId ?? null;
              } else {
                const mapped = findAnyMappedEntry(hsBase, otherTax);
                mappedNodeId = mapped?.nodeId ?? null;
              }
            }
          }
        } else if (t1Origin === "cpc") {
          const originalCode = getT1OriginalCode(syntheticNode.code, "cpc", t1Lookup);
          for (let len = originalCode.length; len >= 4; len--) {
            const prefix = originalCode.substring(0, len);
            const hsMappings = data.concordance.cpcToHs[prefix];
            if (hsMappings && hsMappings.length > 0) {
              const firstHsCode = hsMappings[0].code;
              if (otherTax === "t2") mappedNodeId = findT2NodeId(firstHsCode);
              else if (otherTax !== "t1") {
                if (otherTax === "unspsc") {
                  const fuzzy = findFuzzyMappedEntries(firstHsCode, "hs", "unspsc", data.unspscHsMapping, getLookup("unspsc"));
                  mappedNodeId = fuzzy[0]?.nodeId ?? null;
                } else {
                  const mapped = findAnyMappedEntry(firstHsCode, otherTax);
                  mappedNodeId = mapped?.nodeId ?? null;
                }
              }
              break;
            }
          }
        }
      } else if (sourceTax === "t2") {
        const t2Origin = getT2Origin(syntheticNode.id);
        if (t2Origin === "hts") {
          const hsBase = getHsBase(syntheticNode.code, "hts");
          if (hsBase) {
            if (otherTax === "t1") mappedNodeId = findT1NodeId(hsBase);
            else if (otherTax !== "t2") {
              if (otherTax === "unspsc") {
                const fuzzy = findFuzzyMappedEntries(hsBase, "hts", "unspsc", data.unspscHsMapping, getLookup("unspsc"));
                mappedNodeId = fuzzy[0]?.nodeId ?? null;
              } else {
                const mapped = findAnyMappedEntry(hsBase, otherTax);
                mappedNodeId = mapped?.nodeId ?? null;
              }
            }
          }
        } else if (t2Origin === "cpc") {
          const cleanCpc = stripCode(syntheticNode.code);
          for (let len = cleanCpc.length; len >= 4; len--) {
            const prefix = cleanCpc.substring(0, len);
            const hsMappings = data.concordance.cpcToHs[prefix];
            if (hsMappings && hsMappings.length > 0) {
              const firstHsCode = hsMappings[0].code;
              if (otherTax === "t1") mappedNodeId = findT1NodeId(firstHsCode);
              else if (otherTax !== "t2") {
                if (otherTax === "unspsc") {
                  const fuzzy = findFuzzyMappedEntries(firstHsCode, "hs", "unspsc", data.unspscHsMapping, getLookup("unspsc"));
                  mappedNodeId = fuzzy[0]?.nodeId ?? null;
                } else {
                  const mapped = findAnyMappedEntry(firstHsCode, otherTax);
                  mappedNodeId = mapped?.nodeId ?? null;
                }
              }
              break;
            }
          }
        }
      } else if (CONCORDANCE_TAXONOMIES.includes(sourceTax)) {
        const clean = stripCode(syntheticNode.code);
        const hsCodes = resolveToHsCodes(clean, sourceTax, data.naicsHsConcordance, data.isicCpcConcordance, data.cpaHsConcordance, data.beaHsConcordance, data.concordance);
        if (hsCodes.length > 0) {
          const firstHsCode = hsCodes[0];
          if (otherTax === "unspsc") {
            const fuzzy = findFuzzyMappedEntries(firstHsCode, "hs", "unspsc", data.unspscHsMapping, getLookup("unspsc"));
            mappedNodeId = fuzzy[0]?.nodeId ?? null;
          } else if (otherTax === "t1") {
            mappedNodeId = findT1NodeId(firstHsCode);
          } else if (otherTax === "t2") {
            mappedNodeId = findT2NodeId(firstHsCode);
          } else {
            const mapped = findAnyMappedEntry(firstHsCode, otherTax);
            mappedNodeId = mapped?.nodeId ?? null;
          }
        }
      }

      // Cross-pane sync to left pane
      if (mappedNodeId) {
        const otherRef = treeRefs[otherTax];
        const treeData = getTreeData(otherTax);
        const ancestorPath = findPathToNode(treeData, mappedNodeId);
        let delay = 50;
        for (const ancestorId of ancestorPath) {
          setTimeout(() => {
            const tree = otherRef.current;
            if (tree) {
              const ancestor = tree.get(ancestorId);
              if (ancestor && !ancestor.isOpen) ancestor.open();
            }
          }, delay);
          delay += 80;
        }
        setTimeout(() => {
          const tree = otherRef.current;
          if (tree) {
            const targetNode = tree.get(mappedNodeId!);
            if (targetNode) {
              tree.scrollTo(targetNode.id);
              targetNode.select();
            }
          }
        }, delay + 100);
      }
    },
    [builderState.customTree, leftTaxonomy, data, getLookup, findAnyMappedEntry, treeRefs, getTreeData]
  );

  const leftColorMap = useMemo(
    () => buildColorMap(getTreeData(leftTaxonomy)),
    [data, leftTaxonomy, getTreeData]
  );
  const rightColorMap = useMemo(
    () => buildColorMap(getTreeData(rightTaxonomy)),
    [data, rightTaxonomy, getTreeData]
  );

  const mappingInfo = useMemo(
    () => data?.concordance.mappingInfo ?? {},
    [data]
  );

  // EF database coverage sets (always computed, shown as badges on tree nodes)
  const leftEcoinventCoverage = useMemo(
    () => computeEcoinventCoverage(getTreeData(leftTaxonomy), leftTaxonomy, data?.ecoinventMapping ?? null, strictMatch),
    [data, leftTaxonomy, getTreeData, strictMatch]
  );
  const rightEcoinventCoverage = useMemo(
    () => computeEcoinventCoverage(getTreeData(rightTaxonomy), rightTaxonomy, data?.ecoinventMapping ?? null, strictMatch),
    [data, rightTaxonomy, getTreeData, strictMatch]
  );
  const leftEpaCoverage = useMemo(
    () => data ? computeEpaCoverage(getTreeData(leftTaxonomy), leftTaxonomy, data.emissionFactors, data.concordance, strictMatch) : new Map<string, CoverageInfo>(),
    [data, leftTaxonomy, getTreeData, strictMatch]
  );
  const rightEpaCoverage = useMemo(
    () => data ? computeEpaCoverage(getTreeData(rightTaxonomy), rightTaxonomy, data.emissionFactors, data.concordance, strictMatch) : new Map<string, CoverageInfo>(),
    [data, rightTaxonomy, getTreeData, strictMatch]
  );
  const leftExiobaseCoverage = useMemo(
    () => data ? computeExiobaseCoverage(getTreeData(leftTaxonomy), leftTaxonomy, data.exiobaseFactors, data.exiobaseConcordance, data.concordance, strictMatch) : new Map<string, CoverageInfo>(),
    [data, leftTaxonomy, getTreeData, strictMatch]
  );
  const rightExiobaseCoverage = useMemo(
    () => data ? computeExiobaseCoverage(getTreeData(rightTaxonomy), rightTaxonomy, data.exiobaseFactors, data.exiobaseConcordance, data.concordance, strictMatch) : new Map<string, CoverageInfo>(),
    [data, rightTaxonomy, getTreeData, strictMatch]
  );
  const leftUslciCoverage = useMemo(
    () => data ? computeUslciCoverage(getTreeData(leftTaxonomy), leftTaxonomy, data.uslciCoverage, data.concordance, strictMatch) : new Map<string, CoverageInfo>(),
    [data, leftTaxonomy, getTreeData, strictMatch]
  );
  const rightUslciCoverage = useMemo(
    () => data ? computeUslciCoverage(getTreeData(rightTaxonomy), rightTaxonomy, data.uslciCoverage, data.concordance, strictMatch) : new Map<string, CoverageInfo>(),
    [data, rightTaxonomy, getTreeData, strictMatch]
  );
  const leftBafuCoverage = useMemo(
    () => data ? computeBafuCoverage(getTreeData(leftTaxonomy), leftTaxonomy, data.bafuCoverage, data.concordance, strictMatch) : new Map<string, CoverageInfo>(),
    [data, leftTaxonomy, getTreeData, strictMatch]
  );
  const rightBafuCoverage = useMemo(
    () => data ? computeBafuCoverage(getTreeData(rightTaxonomy), rightTaxonomy, data.bafuCoverage, data.concordance, strictMatch) : new Map<string, CoverageInfo>(),
    [data, rightTaxonomy, getTreeData, strictMatch]
  );
  const leftGabiCoverage = useMemo(
    () => data ? computeGabiCoverage(getTreeData(leftTaxonomy), leftTaxonomy, data.gabiCoverage, data.concordance, strictMatch) : new Map<string, CoverageInfo>(),
    [data, leftTaxonomy, getTreeData, strictMatch]
  );
  const rightGabiCoverage = useMemo(
    () => data ? computeGabiCoverage(getTreeData(rightTaxonomy), rightTaxonomy, data.gabiCoverage, data.concordance, strictMatch) : new Map<string, CoverageInfo>(),
    [data, rightTaxonomy, getTreeData, strictMatch]
  );

  // Ecoinvent info for selected node
  const ecoinventInfo = useMemo((): EcoinventInfo => {
    if (!selectedNode || !selectedFrom || !data) return { cpc: null, hs: null, isic: null, cpcCode: null, hsCode: null, isicCode: null };
    return getEcoinventInfo(selectedNode, selectedFrom, data.ecoinventMapping, data.concordance);
  }, [selectedNode, selectedFrom, data]);

  // Lazy resolution chain factories — only computed when user clicks "Show resolution path"
  const getResolutionChain = useCallback((db: "epa" | "exiobase" | "ecoinvent" | "uslci" | "bafu" | "gabi") => {
    if (!selectedNode || !selectedFrom || !data) return null;
    return traceResolutionChain(selectedNode, selectedFrom, db, data);
  }, [selectedNode, selectedFrom, data]);
  const getEpaChain = useCallback(() => getResolutionChain("epa"), [getResolutionChain]);
  const getExiobaseChain = useCallback(() => getResolutionChain("exiobase"), [getResolutionChain]);
  const getEcoinventChain = useCallback(() => getResolutionChain("ecoinvent"), [getResolutionChain]);
  const getUslciChain = useCallback(() => getResolutionChain("uslci"), [getResolutionChain]);
  const getBafuChain = useCallback(() => getResolutionChain("bafu"), [getResolutionChain]);
  const getGabiChain = useCallback(() => getResolutionChain("gabi"), [getResolutionChain]);

  // Helper to open the about panel to a specific tab with optional navigation context
  const openAboutTab = useCallback((tab: "concordances" | "browser", ctx?: TabNavContext) => {
    aboutRef.current?.openToTab(tab, ctx);
  }, []);

  // Aggregate EF ranges across all descendants when a parent node is selected
  const descendantRanges = useMemo((): DescendantRanges | null => {
    if (!selectedNode || !selectedFrom || !data) return null;
    if (!selectedNode.children || selectedNode.children.length === 0) return null;
    return computeDescendantRanges(selectedNode, selectedFrom, data);
  }, [selectedNode, selectedFrom, data]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        Loading taxonomy data...
      </div>
    );
  }

  if (error || !data) {
    return <div className="error">Error: {error || "Unknown error"}</div>;
  }

  const taxonomyOptions = (
    <>
      <optgroup label="Goods / Trade Classifications">
        <option value="hs">HS - Harmonized System (International)</option>
        <option value="cn">CN - Combined Nomenclature (EU)</option>
        <option value="hts">HTS - Harmonized Tariff Schedule (US)</option>
        <option value="ca">Canadian Customs Tariff</option>
      </optgroup>
      <optgroup label="Product Classifications">
        <option value="cpc">CPC - Central Product Classification</option>
        <option value="cpa">CPA - Products by Activity (EU)</option>
        <option value="unspsc">UNSPSC - Products &amp; Services Code</option>
        <option value="bea">BEA - Input-Output Commodities (US)</option>
      </optgroup>
      <optgroup label="Activity / Industry Classifications">
        <option value="naics">NAICS - Industry Classification (NA)</option>
        <option value="isic">ISIC - Industrial Classification (Intl)</option>
        <option value="nace">NACE - Economic Activities (EU)</option>
      </optgroup>
      <optgroup label="Combined Taxonomies">
        <option value="t1">T1 - HTS Goods + CPC Services</option>
        <option value="t2">T2 - CPC Backbone + HTS Detail</option>
      </optgroup>
    </>
  );

  return (
    <div className={`app ${builderState.active && (builderState.guideSidebarOpen || builderState.quickAddActive) ? "app-content-compressed" : ""}`}>
      <header className="app-header">
        <div className="header-text">
          <h1>Taxonomy Explorer</h1>
          <p className="subtitle">
            Compare 13 international trade, product &amp; industry classifications
          </p>
        </div>
        <button
          className={`builder-toggle ${builderState.active ? "active" : ""}`}
          onClick={() => {
            if (builderState.active) {
              builderDispatch({ type: "TOGGLE_RESET_DIALOG" });
            } else {
              builderDispatch({
                type: "ENTER_BUILDER",
                previousRightTaxonomy: rightTaxonomy,
              });
              // Show base taxonomy dialog if custom tree is empty
              if (builderState.customTree.length === 0) {
                setShowBaseTaxonomyDialog(true);
              }
            }
          }}
          title={builderState.active ? "Exit Custom Taxonomy Builder" : "Build a custom taxonomy in the right pane"}
        >
          {builderState.active ? "Exit Builder" : "Build Custom"}
        </button>
        <div className="match-mode-slider-wrap">
          <span className={`match-mode-label ${!strictMatch ? "active" : ""}`}>Relaxed</span>
          <button
            className={`match-mode-track ${strictMatch ? "strict" : ""}`}
            onClick={() => setStrictMatch(s => !s)}
            role="switch"
            aria-checked={strictMatch}
            aria-label="Toggle between relaxed and exact LCA matching"
          >
            <span className="match-mode-thumb" />
          </button>
          <span className={`match-mode-label ${strictMatch ? "active" : ""}`}>Exact</span>
          <span
            className="match-mode-help"
            title={"Relaxed: broader coverage via ancestor fallback, prefix shortening, and chapter-level matching.\nExact: only precise code-level matches — no fallbacks.\n\nClick for full details."}
            onClick={() => aboutRef.current?.openToTab("lca")}
          >?</span>
        </div>
        <div className="search-bar">
          <svg
            className="search-icon"
            viewBox="0 0 20 20"
            fill="currentColor"
            width="16"
            height="16"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            placeholder="Search across both taxonomies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-btn" onClick={() => setSearch("")}>
              ×
            </button>
          )}
        </div>
        <AboutSection ref={aboutRef} data={data} onNavigateToNode={handleNavigateToNode} onHighlightGaps={handleHighlightGaps} />
      </header>

      <BuilderBanner />

      <div className="main-content two-pane" style={{
        paddingBottom: (selectedNode && selectedFrom) || (builderState.active && builderState.selectedCustomNodeId)
          ? (mappingPanelCollapsed ? 40 : panelHeight)
          : 0
      }}>
        {/* Left Pane */}
        <div className="pane-wrapper left-pane">
          <div className="pane-header">
            <h2>Left Taxonomy</h2>
            <select
              className="taxonomy-selector"
              value={leftTaxonomy}
              onChange={(e) => setLeftTaxonomy(e.target.value as TaxonomyType)}
            >
              {taxonomyOptions}
            </select>
          </div>
          <>
            <div className="pane-info">
              <p className="full-name">{TAXONOMY_INFO[leftTaxonomy].fullName}</p>
              <p className="legend">{TAXONOMY_INFO[leftTaxonomy].legend}</p>
            </div>
            <TaxonomyTree
              key={`${leftTaxonomy}-${debouncedSearch}`}
              ref={treeRefs[leftTaxonomy]}
              data={leftTreeData}
              openByDefault={isSearching}
              mappingInfo={mappingInfo}
              onNodeSelect={(node) => handleNodeSelect("left", node)}
              label={TAXONOMY_INFO[leftTaxonomy].label}
              taxonomyClass={TAXONOMY_INFO[leftTaxonomy].taxonomyClass}
              fullName={TAXONOMY_INFO[leftTaxonomy].fullName}
              legend={TAXONOMY_INFO[leftTaxonomy].legend}
              colorMap={leftColorMap}
              ecoinventCoverage={leftEcoinventCoverage}
              epaCoverage={leftEpaCoverage}
              exiobaseCoverage={leftExiobaseCoverage}
              uslciCoverage={leftUslciCoverage}
              bafuCoverage={leftBafuCoverage}
              gabiCoverage={leftGabiCoverage}
              side="left"
              gapHighlight={gapHighlight?.taxonomy === leftTaxonomy ? gapHighlight : undefined}
              onClearGapHighlight={() => setGapHighlight(null)}
            />
          </>
        </div>

        {/* Right Pane */}
        <div className="pane-wrapper right-pane">
          {builderState.active ? (
            <>
              <div className="pane-header builder-pane-header">
                <h2>Custom Taxonomy Builder</h2>
                <div className="builder-header-actions">
                  <button
                    className="builder-export-btn"
                    onClick={() => builderDispatch({ type: "TOGGLE_EXPORT_PANEL" })}
                  >
                    Export
                  </button>
                  <button
                    className="builder-guide-toggle-btn"
                    onClick={() => builderDispatch({ type: "TOGGLE_GUIDE_SIDEBAR" })}
                  >
                    {builderState.guideSidebarOpen ? "Hide Guide" : "Guide"}
                  </button>
                </div>
              </div>
              {builderState.baseTaxonomy && (
                <div className="pane-info builder-pane-info">
                  <p className="full-name">
                    Base: {TAXONOMY_INFO[builderState.baseTaxonomy]?.fullName ?? builderState.baseTaxonomy}
                  </p>
                  <div className="builder-change-legend">
                    <span className="legend-chip legend-original">Original</span>
                    <span className="legend-chip legend-modified">Edited</span>
                    <span className="legend-chip legend-added">New</span>
                  </div>
                </div>
              )}
              <BuilderTaxonomyPanel
                onShowBaseTaxonomyDialog={() => setShowBaseTaxonomyDialog(true)}
                onShowLibrary={() => setShowLibraryDialog(true)}
                searchTerm={debouncedSearch}
                onNodeSelect={handleBuilderNodeSelect}
              />
            </>
          ) : (
            <>
              <div className="pane-header">
                <h2>Right Taxonomy</h2>
                <select
                  className="taxonomy-selector"
                  value={rightTaxonomy}
                  onChange={(e) => setRightTaxonomy(e.target.value as TaxonomyType)}
                >
                  {taxonomyOptions}
                </select>
              </div>
              <div className="pane-info">
                <p className="full-name">{TAXONOMY_INFO[rightTaxonomy].fullName}</p>
                <p className="legend">{TAXONOMY_INFO[rightTaxonomy].legend}</p>
              </div>
              <TaxonomyTree
                key={`${rightTaxonomy}-${debouncedSearch}`}
                ref={treeRefs[rightTaxonomy]}
                data={rightTreeData}
                openByDefault={isSearching}
                mappingInfo={mappingInfo}
                onNodeSelect={(node) => handleNodeSelect("right", node)}
                label={TAXONOMY_INFO[rightTaxonomy].label}
                taxonomyClass={TAXONOMY_INFO[rightTaxonomy].taxonomyClass}
                fullName={TAXONOMY_INFO[rightTaxonomy].fullName}
                legend={TAXONOMY_INFO[rightTaxonomy].legend}
                colorMap={rightColorMap}
                ecoinventCoverage={rightEcoinventCoverage}
                epaCoverage={rightEpaCoverage}
                exiobaseCoverage={rightExiobaseCoverage}
                uslciCoverage={rightUslciCoverage}
                bafuCoverage={rightBafuCoverage}
                gabiCoverage={rightGabiCoverage}
                side="right"
              />
            </>
          )}
        </div>
      </div>

      {/* Mapping Panel */}
      {selectedNode && selectedFrom && (
        <div
          className={`comparison-panel ${mappingPanelCollapsed ? "collapsed" : ""}`}
          style={mappingPanelCollapsed ? undefined : { height: panelHeight }}
        >
          {!mappingPanelCollapsed && (
            <div className="panel-resize-handle" onMouseDown={handlePanelDragStart} />
          )}
          <h3
            className="comparison-panel-header"
            onClick={() => setMappingPanelCollapsed(!mappingPanelCollapsed)}
          >
            <span>
              Cross-Taxonomy Mappings for{" "}
              <span className="mapping-source-label">
                {TAXONOMY_INFO[selectedFrom].label}
              </span>{" "}
              {selectedNode.code}
            </span>
            <button className="comparison-panel-toggle">
              {mappingPanelCollapsed ? "+" : "\u2013"}
            </button>
          </h3>
          {!mappingPanelCollapsed && <div className="comparison-content">
            <div className="comparison-item source-item">
              <h4>{TAXONOMY_INFO[selectedFrom].label}</h4>
              <p className="code">{selectedNode.code}</p>
              <p className="name">{selectedNode.name}</p>
            </div>

            {/* HS-family mappings (single best match per taxonomy, excluding CPC and fuzzy) */}
            {mappings
              .filter((m) => m.taxonomy !== "cpc" && !m.fuzzy)
              .map((m) => (
                <div className="comparison-item mapped-item" key={m.taxonomy}>
                  <h4>{TAXONOMY_INFO[m.taxonomy].label}</h4>
                  <p className="code">{m.code}</p>
                  <p className="name">{m.description}</p>
                </div>
              ))}

            {/* CPC concordance: show all matches when source is HS-family */}
            {HS_FAMILY.includes(selectedFrom) && (() => {
              const hsBase = getHsBase(selectedNode.code, selectedFrom);
              if (!hsBase) return null;
              const allCpc = data.concordance.hsToCpc[hsBase];
              if (!allCpc || allCpc.length === 0) return null;
              const cpcLookup = getLookup("cpc");
              return (
                <div className="comparison-item mapped-item concordance-item">
                  <h4>CPC (Concordance)</h4>
                  {allCpc.map((m, i) => {
                    const entry = cpcLookup[m.code];
                    return (
                      <div key={i} className="concordance-row">
                        <span className="code">{m.code}</span>
                        <span className="name">{entry?.description ?? "Unknown"}</span>
                        {(m.hsPartial || m.cpcPartial) && (
                          <span className="partial-badge">partial</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* HS concordance: show all matches when source is CPC */}
            {selectedFrom === "cpc" && (() => {
              const cleanCpc = stripCode(selectedNode.code);
              const allHs = data.concordance.cpcToHs[cleanCpc];
              if (!allHs || allHs.length === 0) return null;
              const hsLookup = getLookup("hs");
              return (
                <div className="comparison-item mapped-item concordance-item">
                  <h4>HS (Concordance Detail)</h4>
                  {allHs.map((m, i) => {
                    const entry = hsLookup[m.code];
                    return (
                      <div key={i} className="concordance-row">
                        <span className="code">{m.code}</span>
                        <span className="name">{entry?.description ?? "Unknown"}</span>
                        {(m.hsPartial || m.cpcPartial) && (
                          <span className="partial-badge">partial</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* UNSPSC fuzzy matches */}
            {(() => {
              const fuzzyMatches = mappings.filter((m) => m.fuzzy);
              if (fuzzyMatches.length === 0) return null;
              return (
                <div className="comparison-item mapped-item fuzzy-item">
                  <h4>UNSPSC (Fuzzy Text Match)</h4>
                  {fuzzyMatches.map((m, i) => (
                    <div key={i} className="concordance-row">
                      <span className="code">{m.code}</span>
                      <span className="name">{m.description}</span>
                      <span className="fuzzy-badge" title={`Similarity: ${((m.similarity ?? 0) * 100).toFixed(1)}%`}>
                        ~{((m.similarity ?? 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}

            {emissionFactor && (
              <EmissionFactorDisplay entry={emissionFactor} getChain={getEpaChain} onOpenTab={openAboutTab} />
            )}

            {exiobaseFactor && (
              <ExiobaseFactorDisplay entry={exiobaseFactor} getChain={getExiobaseChain} onOpenTab={openAboutTab} />
            )}
            {exiobaseProducts && (
              <ExiobaseProductDisplay match={exiobaseProducts} getChain={getExiobaseChain} onOpenTab={openAboutTab} />
            )}

            {bafuFactor && bafuFactor.withGhgData > 0 && (
              <BafuFactorDisplay entry={bafuFactor} getChain={getBafuChain} onOpenTab={openAboutTab} />
            )}

            {gabiFactor && gabiFactor.processCount > 0 && (
              <GabiFactorDisplay entry={gabiFactor} getChain={getGabiChain} onOpenTab={openAboutTab} />
            )}

            {uslciFactor && uslciFactor.withGhgData > 0 && (
              <UslciFactorDisplay entry={uslciFactor} getChain={getUslciChain} onOpenTab={openAboutTab} />
            )}

            {(ecoinventInfo.cpc || ecoinventInfo.hs || ecoinventInfo.isic) && (
              <EcoinventDisplay
                cpc={ecoinventInfo.cpc}
                hs={ecoinventInfo.hs}
                isic={ecoinventInfo.isic}
                cpcCode={ecoinventInfo.cpcCode}
                hsCode={ecoinventInfo.hsCode}
                isicCode={ecoinventInfo.isicCode}
                getChain={getEcoinventChain}
                onOpenTab={openAboutTab}
              />
            )}

            {descendantRanges && (
              <DescendantRangeDisplay ranges={descendantRanges} />
            )}

            {mappings.length === 0 && !emissionFactor && !exiobaseFactor && !exiobaseProducts && !(bafuFactor && bafuFactor.withGhgData > 0) && !(gabiFactor && gabiFactor.processCount > 0) && !(uslciFactor && uslciFactor.withGhgData > 0) && !ecoinventInfo.cpc && !ecoinventInfo.hs && !ecoinventInfo.isic && (
              <div className="comparison-item no-mapping">
                <p className="name">No mappings found at this level</p>
              </div>
            )}

            {/* Builder: Map-to-custom action */}
            {builderState.active && selectedFrom && selectedNode && (
              <MappingsTab
                mode="map-action"
                sourceNode={selectedNode}
                sourceTaxonomy={selectedFrom}
              />
            )}
          </div>}
        </div>
      )}

      {/* Builder: Show custom node mappings when a custom node is selected */}
      {builderState.active && builderState.selectedCustomNodeId && (
        <div
          className={`comparison-panel ${mappingPanelCollapsed ? "collapsed" : ""}`}
          style={mappingPanelCollapsed ? undefined : { height: panelHeight }}
        >
          {!mappingPanelCollapsed && (
            <div className="panel-resize-handle" onMouseDown={handlePanelDragStart} />
          )}
          <h3
            className="comparison-panel-header"
            onClick={() => setMappingPanelCollapsed(!mappingPanelCollapsed)}
          >
            <span>Custom Node Mappings</span>
            <button className="comparison-panel-toggle">
              {mappingPanelCollapsed ? "+" : "\u2013"}
            </button>
          </h3>
          {!mappingPanelCollapsed && (
            <div className="comparison-content">
              <MappingsTab
                mode="display"
                selectedCustomNodeId={builderState.selectedCustomNodeId}
              />
            </div>
          )}
        </div>
      )}

      {/* Builder overlays */}
      {builderState.active && (
        <NodeCreationGuide />
      )}
      {builderState.showExportPanel && (
        <ExportPanel />
      )}
      {showBaseTaxonomyDialog && (
        <BaseTaxonomyDialog
          onClose={() => setShowBaseTaxonomyDialog(false)}
          getTreeData={getTreeData}
          getLookup={getLookup}
          onOpenLibrary={() => setShowLibraryDialog(true)}
        />
      )}
      {builderState.showResetDialog && (
        <ResetDialog
          onKeep={() => {
            const prev = builderState.previousRightTaxonomy;
            builderDispatch({ type: "EXIT_BUILDER" });
            if (prev) setRightTaxonomy(prev);
          }}
          onClear={() => {
            const prev = builderState.previousRightTaxonomy;
            builderDispatch({ type: "EXIT_BUILDER", clearData: true });
            if (prev) setRightTaxonomy(prev);
          }}
        />
      )}
      {showLibraryDialog && (
        <TaxonomyLibraryDialog
          onClose={() => setShowLibraryDialog(false)}
          showSave={builderState.active}
        />
      )}
    </div>
  );
}

export default App;
