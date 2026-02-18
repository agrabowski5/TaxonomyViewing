import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { TreeApi } from "react-arborist";
import { useData } from "./useData";
import { TaxonomyTree } from "./TaxonomyTree";
import { BuilderProvider, useBuilder } from "./builder/context";
import { BuilderBanner } from "./builder/BuilderBanner";
import { BuilderTaxonomyPanel } from "./builder/BuilderTaxonomyPanel";
import { NodeCreationGuide } from "./builder/NodeCreationGuide";
import { MetaParameterModal } from "./builder/MetaParameterModal";
import { MappingsTab } from "./builder/MappingsTab";
import { ExportPanel } from "./builder/ExportPanel";
import { ResetDialog } from "./builder/ResetDialog";
import { AboutSection } from "./AboutSection";
import type { TreeNode, LookupEntry, TaxonomyType, ConcordanceData, ConcordanceMapping, EmissionFactorEntry, ExiobaseFactorEntry, FuzzyMappingData, EcoinventMapping, EcoinventCodeMapping } from "./types";
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

const ALL_TAXONOMIES: TaxonomyType[] = ["hs", "cpc", "cn", "hts", "ca", "unspsc", "t1", "t2"];

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
  custom: {
    fullName: "Custom Taxonomy (Builder)",
    legend: "Build your own classification hierarchy",
    taxonomyClass: "custom",
    label: "CUSTOM",
  },
};

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
      // Try 4-digit dotted
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

function EmissionFactorDisplay({ entry }: { entry: EmissionFactorEntry }) {
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
    </div>
  );
}

function ExiobaseFactorDisplay({ entry }: { entry: ExiobaseFactorEntry }) {
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
    </div>
  );
}

// Look up ecoinvent mapping for a selected node
function getEcoinventInfo(
  node: TreeNode,
  taxonomy: TaxonomyType,
  ecoinventMapping: EcoinventMapping | null,
  concordance: ConcordanceData,
): { cpc: EcoinventCodeMapping | null; hs: EcoinventCodeMapping | null; cpcCode: string | null; hsCode: string | null } {
  if (!ecoinventMapping) return { cpc: null, hs: null, cpcCode: null, hsCode: null };

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
    return { cpc: cpcMatch, hs: hsMatch, cpcCode: cpcMatch ? clean : null, hsCode };
  }

  // HS-family: direct HS lookup + chain to CPC via concordance
  if (HS_FAMILY.includes(taxonomy)) {
    const hsBase = getHsBase(node.code, taxonomy);
    if (!hsBase) return { cpc: null, hs: null, cpcCode: null, hsCode: null };
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
    return { cpc: cpcMatch, hs: hsMatch, cpcCode, hsCode: matchedHsCode };
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

  return { cpc: null, hs: null, cpcCode: null, hsCode: null };
}

// Compute ecoinvent coverage for tree nodes (for overlay)
function computeEcoinventCoverage(
  tree: TreeNode[],
  taxonomy: TaxonomyType,
  ecoinventMapping: EcoinventMapping | null,
): Set<string> {
  if (!ecoinventMapping) return new Set();
  const covered = new Set<string>();
  const em = ecoinventMapping;
  const cpcAncestorSet = new Set(em.cpcAncestors);
  const hsAncestorSet = new Set(em.hsAncestors);

  function walk(nodes: TreeNode[]) {
    for (const node of nodes) {
      const clean = stripCode(node.code);
      let hasCoverage = false;

      if (taxonomy === "cpc" || (taxonomy === "t2" && getT2Origin(node.id) === "cpc") || (taxonomy === "t1" && node.id.startsWith("t1-svc-"))) {
        hasCoverage = !!em.cpc[clean] || cpcAncestorSet.has(clean);
      } else if (HS_FAMILY.includes(taxonomy) || (taxonomy === "t2" && getT2Origin(node.id) === "hts") || (taxonomy === "t1" && !node.id.startsWith("t1-svc-"))) {
        const hsBase = clean.substring(0, Math.min(6, clean.length));
        hasCoverage = !!em.hs[hsBase] || hsAncestorSet.has(hsBase);
      } else if (taxonomy === "unspsc") {
        hasCoverage = false;
      }

      if (hasCoverage) {
        covered.add(node.id);
      }

      if (node.children) {
        walk(node.children);
        // If any child is covered, parent is covered too
        for (const child of node.children) {
          if (covered.has(child.id)) {
            covered.add(node.id);
            break;
          }
        }
      }
    }
  }

  walk(tree);
  return covered;
}

function EcoinventDisplay({ cpc, hs, cpcCode, hsCode }: {
  cpc: EcoinventCodeMapping | null;
  hs: EcoinventCodeMapping | null;
  cpcCode: string | null;
  hsCode: string | null;
}) {
  if (!cpc && !hs) return null;

  return (
    <div className="ecoinvent-card">
      <h4>ecoinvent v3.10 Mapping</h4>
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
  const [ecoinventOverlay, setEcoinventOverlay] = useState(false);

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
    custom: useRef<TreeApi<TreeNode>>(null),
  };

  const getTreeData = useCallback((taxonomy: TaxonomyType): TreeNode[] => {
    if (taxonomy === "custom") return [];
    if (!data) return [];
    const map: Record<string, TreeNode[]> = {
      hs: data.hsTree, cn: data.cnTree, hts: data.htsTree, ca: data.caTree, cpc: data.cpcTree, unspsc: data.unspscTree, t1: data.t1Tree, t2: data.t2Tree,
    };
    return map[taxonomy] ?? [];
  }, [data]);

  const getLookup = useCallback((taxonomy: TaxonomyType): Record<string, LookupEntry> => {
    if (taxonomy === "custom") return {};
    if (!data) return {};
    const map: Record<string, Record<string, LookupEntry>> = {
      hs: data.hsLookup, cn: data.cnLookup, hts: data.htsLookup, ca: data.caLookup, cpc: data.cpcLookup, unspsc: data.unspscLookup, t1: data.t1Lookup, t2: data.t2Lookup,
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
          const entry = findMappedEntry(hsBase, tax, getLookup(tax), data.concordance);
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
              const entry = findMappedEntry(firstHsCode, tax, getLookup(tax), data.concordance);
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
          const entry = findMappedEntry(firstHsCode, tax, getLookup(tax), data.concordance);
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
            const entry = findMappedEntry(hsBase, tax, getLookup(tax), data.concordance);
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
                const entry = findMappedEntry(firstHsCode, tax, getLookup(tax), data.concordance);
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
            const entry = findMappedEntry(hsBase, tax, getLookup(tax), data.concordance);
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
                const entry = findMappedEntry(firstHsCode, tax, getLookup(tax), data.concordance);
                if (entry) results.push(entry);
              }
            }
            return results;
          }
        }
      }
    }

    return [];
  }, [selectedNode, selectedFrom, data, getLookup]);

  // Compute emission factor for selected node
  const emissionFactor = useMemo(() => {
    if (!selectedNode || !selectedFrom || !data) return null;
    return getEmissionFactor(selectedNode, selectedFrom, data.emissionFactors, data.concordance);
  }, [selectedNode, selectedFrom, data]);

  const exiobaseFactor = useMemo(() => {
    if (!selectedNode || !selectedFrom || !data) return null;
    return getExiobaseFactor(selectedNode, selectedFrom, data.exiobaseFactors, data.concordance);
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
            const mapped = findMappedEntry(hsBase, otherTax, getLookup(otherTax), data.concordance);
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
              const mapped = findMappedEntry(firstHsCode, otherTax, getLookup(otherTax), data.concordance);
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
            const mapped = findMappedEntry(firstHsCode, otherTax, getLookup(otherTax), data.concordance);
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
              const mapped = findMappedEntry(hsBase, otherTax, getLookup(otherTax), data.concordance);
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
                const mapped = findMappedEntry(firstHsCode, otherTax, getLookup(otherTax), data.concordance);
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
              const mapped = findMappedEntry(hsBase, otherTax, getLookup(otherTax), data.concordance);
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
                const mapped = findMappedEntry(firstHsCode, otherTax, getLookup(otherTax), data.concordance);
                mappedNodeId = mapped?.nodeId ?? null;
              }
              break;
            }
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
    [leftTaxonomy, rightTaxonomy, data, getLookup, treeRefs, getTreeData]
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

  // Ecoinvent coverage sets for overlay
  const leftEcoinventCoverage = useMemo(
    () => ecoinventOverlay ? computeEcoinventCoverage(getTreeData(leftTaxonomy), leftTaxonomy, data?.ecoinventMapping ?? null) : new Set<string>(),
    [ecoinventOverlay, data, leftTaxonomy, getTreeData]
  );
  const rightEcoinventCoverage = useMemo(
    () => ecoinventOverlay ? computeEcoinventCoverage(getTreeData(rightTaxonomy), rightTaxonomy, data?.ecoinventMapping ?? null) : new Set<string>(),
    [ecoinventOverlay, data, rightTaxonomy, getTreeData]
  );

  // Ecoinvent info for selected node
  const ecoinventInfo = useMemo(() => {
    if (!selectedNode || !selectedFrom || !data) return { cpc: null, hs: null, cpcCode: null, hsCode: null };
    return getEcoinventInfo(selectedNode, selectedFrom, data.ecoinventMapping, data.concordance);
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
      <option value="hs">HS - Harmonized System (International)</option>
      <option value="cpc">CPC - Central Product Classification</option>
      <option value="cn">CN - Combined Nomenclature (EU)</option>
      <option value="hts">HTS - Harmonized Tariff Schedule (US)</option>
      <option value="ca">Canadian Customs Tariff</option>
      <option value="unspsc">UNSPSC - Products &amp; Services Code</option>
      <option value="t1">T1 - HTS Goods + CPC Services</option>
      <option value="t2">T2 - CPC Backbone + HTS Detail</option>
      {builderState.active && (
        <option value="custom">Custom Taxonomy (Builder)</option>
      )}
    </>
  );

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-text">
          <h1>Taxonomy Explorer</h1>
          <p className="subtitle">
            Compare HS, CPC, CN, HTS, Canadian &amp; UNSPSC classifications
          </p>
        </div>
        <button
          className={`ecoinvent-toggle ${ecoinventOverlay ? "active" : ""}`}
          onClick={() => setEcoinventOverlay(!ecoinventOverlay)}
          title="Toggle ecoinvent coverage overlay"
        >
          <span className="ecoinvent-toggle-dot" />
          ecoinvent
        </button>
        <button
          className={`builder-toggle ${builderState.active ? "active" : ""}`}
          onClick={() => {
            if (builderState.active) {
              builderDispatch({ type: "TOGGLE_RESET_DIALOG" });
            } else {
              builderDispatch({
                type: "ENTER_BUILDER",
                savedAppState: { leftTaxonomy, rightTaxonomy },
              });
            }
          }}
          title="Toggle Custom Taxonomy Builder mode"
        >
          ⚗ Build Custom
        </button>
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
        <AboutSection />
      </header>

      <BuilderBanner />

      <div className="main-content two-pane">
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
          {leftTaxonomy === "custom" ? (
            <BuilderTaxonomyPanel />
          ) : (
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
                ecoinventCoverage={ecoinventOverlay ? leftEcoinventCoverage : undefined}
              />
            </>
          )}
        </div>

        {/* Right Pane */}
        <div className="pane-wrapper right-pane">
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
          {rightTaxonomy === "custom" ? (
            <BuilderTaxonomyPanel />
          ) : (
            <>
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
                ecoinventCoverage={ecoinventOverlay ? rightEcoinventCoverage : undefined}
              />
            </>
          )}
        </div>
      </div>

      {/* Mapping Panel */}
      {selectedNode && selectedFrom && (
        <div className="comparison-panel">
          <h3>
            Cross-Taxonomy Mappings for{" "}
            <span className="mapping-source-label">
              {TAXONOMY_INFO[selectedFrom].label}
            </span>{" "}
            {selectedNode.code}
          </h3>
          <div className="comparison-content">
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
              <EmissionFactorDisplay entry={emissionFactor} />
            )}

            {exiobaseFactor && (
              <ExiobaseFactorDisplay entry={exiobaseFactor} />
            )}

            {(ecoinventInfo.cpc || ecoinventInfo.hs) && (
              <EcoinventDisplay
                cpc={ecoinventInfo.cpc}
                hs={ecoinventInfo.hs}
                cpcCode={ecoinventInfo.cpcCode}
                hsCode={ecoinventInfo.hsCode}
              />
            )}

            {mappings.length === 0 && !emissionFactor && !exiobaseFactor && !ecoinventInfo.cpc && !ecoinventInfo.hs && (
              <div className="comparison-item no-mapping">
                <p className="name">No mappings found at this level</p>
              </div>
            )}

            {/* Builder: Map-to-custom action */}
            {builderState.active && selectedFrom && selectedFrom !== "custom" && selectedNode && (
              <MappingsTab
                mode="map-action"
                sourceNode={selectedNode}
                sourceTaxonomy={selectedFrom}
              />
            )}
          </div>
        </div>
      )}

      {/* Builder: Show custom node mappings when a custom node is selected */}
      {builderState.active && builderState.selectedCustomNodeId && (
        <div className="comparison-panel">
          <h3>
            Custom Node Mappings
          </h3>
          <div className="comparison-content">
            <MappingsTab
              mode="display"
              selectedCustomNodeId={builderState.selectedCustomNodeId}
            />
          </div>
        </div>
      )}

      {/* Builder overlays */}
      {builderState.active && (
        <NodeCreationGuide />
      )}
      {builderState.showMetaModal && (
        <MetaParameterModal />
      )}
      {builderState.showExportPanel && (
        <ExportPanel />
      )}
      {builderState.showResetDialog && (
        <ResetDialog
          onKeep={() => {
            builderDispatch({ type: "EXIT_BUILDER" });
            if (builderState.savedAppState) {
              setLeftTaxonomy(builderState.savedAppState.leftTaxonomy);
              setRightTaxonomy(builderState.savedAppState.rightTaxonomy);
            }
          }}
          onClear={() => {
            builderDispatch({ type: "EXIT_BUILDER" });
            if (builderState.savedAppState) {
              setLeftTaxonomy(builderState.savedAppState.leftTaxonomy);
              setRightTaxonomy(builderState.savedAppState.rightTaxonomy);
            }
          }}
        />
      )}
    </div>
  );
}

export default App;
