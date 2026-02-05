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
  concordance: ConcordanceData;
}
