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
  cpcAncestors: string[];
  hsAncestors: string[];
  stats: {
    totalProducts: number;
    productsWithCpc: number;
    productsWithHs: number;
    uniqueCpcCodes: number;
    uniqueHsCodes: number;
  };
}

export type TaxonomyType = "hs" | "cn" | "hts" | "ca" | "cpc" | "unspsc" | "t1" | "t2" | "custom";

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
  concordance: ConcordanceData;
  unspscHsMapping: FuzzyMappingData;
  emissionFactors: Record<string, EmissionFactorEntry> | null;
  exiobaseFactors: Record<string, ExiobaseFactorEntry> | null;
  ecoinventMapping: EcoinventMapping | null;
}
