// Coverage info per node: count = matched DB entries, dir = mapping direction
// shared = how many taxonomy nodes map to the same DB entry (for N:1)
export type CoverageInfo = { count: number; dir: "1:1" | "1:N" | "N:1"; shared: number };

export interface TreeNode {
  id: string;
  code: string;
  name: string;
  type: string;
  children?: TreeNode[];
}

export interface LookupEntry {
  code: string;
  description: string;
  section?: string;
  sectionName?: string;
  level: number;
  type: string;
  origin?: string;
  originalCode?: string;
}

export interface ConcordanceMapping {
  code: string;
  hsPartial: boolean;
  cpcPartial: boolean;
}

export interface MappingInfo {
  count: number;
  type: "1:1" | "1:N";
}

export interface ConcordanceData {
  hsToCpc: Record<string, ConcordanceMapping[]>;
  cpcToHs: Record<string, ConcordanceMapping[]>;
  mappingInfo: Record<string, MappingInfo>;
}

export interface FuzzyMapping {
  code: string;
  similarity: number;
}

export interface FuzzyMappingData {
  unspscToHs: Record<string, FuzzyMapping[]>;
  hsToUnspsc: Record<string, FuzzyMapping[]>;
}

export interface EmissionFactorEntry {
  factor: number;
  unit: string;
  naicsCode: string;
  naicsDescription: string;
  factorWithoutMargins: number;
  margins: number;
  source: string;
}

export interface ExiobaseFactorEntry {
  factor: number;
  unit: string;
  sectors: string[];
  source: string;
}

export interface EcoinventCodeMapping {
  products: string[];
  count: number;
  mappingType: string;
}

export interface EcoinventMapping {
  cpc: Record<string, EcoinventCodeMapping>;
  hs: Record<string, EcoinventCodeMapping>;
  isic: Record<string, EcoinventCodeMapping>;
  cpcAncestors: string[];
  hsAncestors: string[];
  isicAncestors: string[];
  stats: {
    totalProducts: number;
    productsWithCpc: number;
    productsWithHs: number;
    productsWithIsic: number;
    uniqueCpcCodes: number;
    uniqueHsCodes: number;
    uniqueIsicCodes: number;
  };
}

export interface LciUnitStats {
  count: number;
  min: number;
  max: number;
  avg: number;
  median: number;
}

export interface LciProcess {
  name: string;
  ghg: number;
  unit: string;
}

export interface UslciCoverageEntry {
  naicsCodes: string[];
  processCount: number;
  withGhgData: number;
  unitStats: Record<string, LciUnitStats>;
  topProcesses: LciProcess[];
  broad?: boolean;
}

export interface UslciCoverage {
  coverage: Record<string, UslciCoverageEntry>;
  stats: {
    totalProcesses: number;
    totalWithGhg: number;
    uniqueNaicsCodes: number;
    coveredHs6Codes: number;
    source: string;
    note: string;
  };
}

export interface BafuCoverageEntry {
  processCount: number;
  withGhgData: number;
  unitStats: Record<string, LciUnitStats>;
  topProcesses: LciProcess[];
}

export interface BafuCoverage {
  coverage: Record<string, BafuCoverageEntry>;
  stats: {
    totalProcesses: number;
    mappedProcesses: number;
    mappedWithGhg: number;
    unmappedProcesses: number;
    coveredHsChapters: number;
    coveredHsCodes?: number;
    hs6Matched?: number;
    hs4Matched?: number;
    chapterOnly?: number;
    source: string;
    note: string;
  };
}

export interface GabiCoverageEntry {
  processCount: number;
  withGhgData: number;
  unitStats: Record<string, LciUnitStats>;
  topProcesses: LciProcess[];
}

export interface GabiCoverage {
  coverage: Record<string, GabiCoverageEntry>;
  stats: {
    totalProcesses: number;
    mappedProcesses: number;
    mappedWithGhg: number;
    unmappedProcesses: number;
    coveredHsChapters: number;
    source: string;
    note: string;
  };
}

export interface ExiobaseConcordance {
  products: Record<string, string>;
  hsToExio: Record<string, string[]>;
  cpaToExio: Record<string, string[]>;
  isicToExio: Record<string, string[]>;
  naceToExio: Record<string, string[]>;
  hsAncestors: string[];
  cpaAncestors: string[];
  stats: {
    hsCodesMatched: number;
    cpaCodesMatched: number;
    isicCodesMatched: number;
    naceCodesMatched: number;
    uniqueExioProducts: number;
    totalExioProducts: number;
  };
}

export interface GenericConcordance {
  forward: Record<string, { code: string; partial?: boolean }[]>;
  reverse: Record<string, { code: string; partial?: boolean }[]>;
}

export type TaxonomyType = "hs" | "cn" | "hts" | "ca" | "cpc" | "unspsc" | "t1" | "t2"
  | "naics" | "isic" | "nace" | "cpa" | "bea";

export interface AppData {
  hsTree: TreeNode[];
  cpcTree: TreeNode[];
  cnTree: TreeNode[];
  htsTree: TreeNode[];
  caTree: TreeNode[];
  hsLookup: Record<string, LookupEntry>;
  cpcLookup: Record<string, LookupEntry>;
  cnLookup: Record<string, LookupEntry>;
  htsLookup: Record<string, LookupEntry>;
  caLookup: Record<string, LookupEntry>;
  unspscTree: TreeNode[];
  unspscLookup: Record<string, LookupEntry>;
  t1Tree: TreeNode[];
  t1Lookup: Record<string, LookupEntry>;
  t2Tree: TreeNode[];
  t2Lookup: Record<string, LookupEntry>;
  naicsTree: TreeNode[];
  naicsLookup: Record<string, LookupEntry>;
  isicTree: TreeNode[];
  isicLookup: Record<string, LookupEntry>;
  naceTree: TreeNode[];
  naceLookup: Record<string, LookupEntry>;
  cpaTree: TreeNode[];
  cpaLookup: Record<string, LookupEntry>;
  beaTree: TreeNode[];
  beaLookup: Record<string, LookupEntry>;
  concordance: ConcordanceData;
  unspscHsMapping: FuzzyMappingData;
  naicsHsConcordance: GenericConcordance | null;
  isicCpcConcordance: GenericConcordance | null;
  cpaHsConcordance: GenericConcordance | null;
  beaHsConcordance: GenericConcordance | null;
  beaNaicsConcordance: GenericConcordance | null;
  emissionFactors: Record<string, EmissionFactorEntry> | null;
  exiobaseFactors: Record<string, ExiobaseFactorEntry> | null;
  exiobaseConcordance: ExiobaseConcordance | null;
  ecoinventMapping: EcoinventMapping | null;
  uslciCoverage: UslciCoverage | null;
  bafuCoverage: BafuCoverage | null;
  gabiCoverage: GabiCoverage | null;
}
