import { useState, useMemo, useCallback } from "react";
import type { AppData, ConcordanceData, BafuCoverage, BafuCoverageEntry, EcoinventMapping, EcoinventCodeMapping, LookupEntry } from "./types";
import "./EcoinventBafuTool.css";

interface ProductIndex {
  product: string;
  cpcCode: string | null;
  hsCode: string | null;
  cpcEntry: EcoinventCodeMapping | null;
  hsEntry: EcoinventCodeMapping | null;
}

interface ComparisonResult {
  product: ProductIndex;
  t2NodeId: string | null;
  t2Code: string | null;
  t2Name: string | null;
  bafuEntry: BafuCoverageEntry | null;
  bafuKey: string | null;
  bafuKeyLevel: string | null;
  resolvedHsCodes: string[];
  ecoinventCpcCode: string | null;
  ecoinventHsCode: string | null;
}

function buildProductIndex(ecoinvent: EcoinventMapping): ProductIndex[] {
  const seen = new Map<string, ProductIndex>();

  // Index from CPC entries
  for (const [code, entry] of Object.entries(ecoinvent.cpc)) {
    for (const p of entry.products) {
      const key = p.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, { product: p, cpcCode: code, hsCode: null, cpcEntry: entry, hsEntry: null });
      } else {
        const existing = seen.get(key)!;
        if (!existing.cpcCode) {
          existing.cpcCode = code;
          existing.cpcEntry = entry;
        }
      }
    }
  }

  // Enrich with HS entries
  for (const [code, entry] of Object.entries(ecoinvent.hs)) {
    for (const p of entry.products) {
      const key = p.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, { product: p, cpcCode: null, hsCode: code, cpcEntry: null, hsEntry: entry });
      } else {
        const existing = seen.get(key)!;
        if (!existing.hsCode) {
          existing.hsCode = code;
          existing.hsEntry = entry;
        }
      }
    }
  }

  return Array.from(seen.values());
}

function searchProducts(index: ProductIndex[], query: string): ProductIndex[] {
  if (!query.trim()) return [];
  // Strip common ecoinvent prefixes
  const cleaned = query.toLowerCase()
    .replace(/^market\s+for\s+/i, "")
    .replace(/^treatment\s+of\s+/i, "")
    .replace(/^production\s+of\s+/i, "")
    .trim();
  if (!cleaned) return [];

  const tokens = cleaned.split(/\s+/).filter(t => t.length > 1);

  const scored = index
    .map(entry => {
      const name = entry.product.toLowerCase();
      // Exact match
      if (name === cleaned) return { entry, score: 100 };
      // Starts with
      if (name.startsWith(cleaned)) return { entry, score: 80 };
      // Contains full query
      if (name.includes(cleaned)) return { entry, score: 60 };
      // All tokens present
      const allTokens = tokens.every(t => name.includes(t));
      if (allTokens) return { entry, score: 40 };
      // Some tokens present
      const matchCount = tokens.filter(t => name.includes(t)).length;
      if (matchCount > 0) return { entry, score: matchCount / tokens.length * 30 };
      return { entry, score: 0 };
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 50).map(s => s.entry);
}

function resolveToHsCodes(
  cpcCode: string | null,
  hsCode: string | null,
  concordance: ConcordanceData,
): string[] {
  const codes: string[] = [];

  // Direct HS code from ecoinvent
  if (hsCode) codes.push(hsCode);

  // CPC → HS via concordance
  if (cpcCode) {
    for (let len = cpcCode.length; len >= 3; len--) {
      const prefix = cpcCode.substring(0, len);
      const mappings = concordance.cpcToHs[prefix];
      if (mappings && mappings.length > 0) {
        for (const m of mappings) {
          if (!codes.includes(m.code)) codes.push(m.code);
        }
        break;
      }
    }
  }

  return codes;
}

function findBafuEntry(
  hsCodes: string[],
  bafuCoverage: BafuCoverage,
): { entry: BafuCoverageEntry; key: string; level: string } | null {
  // Try each HS code with HS-6 → HS-4 → HS-2 fallback
  for (const hs of hsCodes) {
    for (let len = Math.min(6, hs.length); len >= 2; len -= 2) {
      const key = hs.substring(0, len);
      const entry = bafuCoverage.coverage[key];
      if (entry) {
        const level = len === 6 ? "HS-6" : len === 4 ? "HS-4" : "HS-2";
        return { entry, key, level };
      }
    }
  }
  return null;
}

function findT2Node(
  cpcCode: string | null,
  hsCode: string | null,
  t2Lookup: Record<string, LookupEntry>,
): { id: string; code: string; name: string } | null {
  // Try CPC code directly (T2 backbone is CPC)
  if (cpcCode) {
    for (let len = cpcCode.length; len >= 3; len--) {
      const prefix = cpcCode.substring(0, len);
      const entry = t2Lookup[prefix];
      if (entry) {
        return { id: `t2-${prefix}`, code: prefix, name: entry.description };
      }
    }
  }
  // Try HS code (T2 has HTS detail nodes keyed as HTS{code})
  if (hsCode) {
    const htsKey = `HTS${hsCode}`;
    const entry = t2Lookup[htsKey];
    if (entry) {
      return { id: `t2-hts-${hsCode}`, code: hsCode, name: entry.description };
    }
    // Try shorter prefixes
    for (let len = Math.min(6, hsCode.length); len >= 4; len--) {
      const prefix = hsCode.substring(0, len);
      const key = `HTS${prefix}`;
      const entry2 = t2Lookup[key];
      if (entry2) {
        return { id: `t2-hts-${prefix}`, code: prefix, name: entry2.description };
      }
    }
  }
  return null;
}

function formatGhg(v: number): string {
  if (v >= 100) return v.toFixed(1);
  if (v >= 1) return v.toFixed(3);
  if (v >= 0.001) return v.toFixed(5);
  return v.toExponential(2);
}

function ResultCard({ result, hsLookup }: { result: ComparisonResult; hsLookup: Record<string, LookupEntry> }) {
  const [expanded, setExpanded] = useState(false);

  const bafuKgStats = result.bafuEntry?.unitStats?.["kg"];

  return (
    <div className="ebt-card">
      <div className="ebt-card-header" onClick={() => setExpanded(!expanded)}>
        <span className="ebt-product-name">{result.product.product}</span>
        <span className="ebt-expand-icon">{expanded ? "▾" : "▸"}</span>
      </div>

      <div className="ebt-card-badges">
        {result.product.cpcCode && (
          <span className="ebt-badge ebt-badge-cpc">CPC {result.product.cpcCode}</span>
        )}
        {result.product.hsCode && (
          <span className="ebt-badge ebt-badge-hs">HS {result.product.hsCode}</span>
        )}
        {result.product.cpcEntry && (
          <span className="ebt-badge ebt-badge-type">{result.product.cpcEntry.mappingType}</span>
        )}
      </div>

      {/* Comparison summary - always visible */}
      <div className="ebt-comparison">
        <div className="ebt-col">
          <div className="ebt-col-label">T2 Node</div>
          {result.t2NodeId ? (
            <div className="ebt-col-value ebt-match">
              <span className="ebt-code">{result.t2Code}</span>
              <span className="ebt-desc">{result.t2Name}</span>
            </div>
          ) : (
            <div className="ebt-col-value ebt-no-match">No T2 match</div>
          )}
        </div>

        <div className="ebt-col">
          <div className="ebt-col-label">BAFU Data</div>
          {result.bafuEntry ? (
            <div className="ebt-col-value ebt-match">
              <span className="ebt-code">{result.bafuKey} ({result.bafuKeyLevel})</span>
              <span className="ebt-desc">
                {result.bafuEntry.processCount} process(es), {result.bafuEntry.withGhgData} with GHG
              </span>
              {bafuKgStats && (
                <span className="ebt-ghg">
                  {formatGhg(bafuKgStats.median)} kg CO₂e/kg (median)
                </span>
              )}
            </div>
          ) : (
            <div className="ebt-col-value ebt-no-match">No BAFU match</div>
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="ebt-detail">
          <div className="ebt-detail-section">
            <h4>Resolution Chain</h4>
            <div className="ebt-chain">
              <span className="ebt-chain-step">ecoinvent: "{result.product.product}"</span>
              {result.ecoinventCpcCode && (
                <><span className="ebt-chain-arrow">→</span><span className="ebt-chain-step">CPC {result.ecoinventCpcCode}</span></>
              )}
              {result.resolvedHsCodes.length > 0 && (
                <><span className="ebt-chain-arrow">→</span><span className="ebt-chain-step">HS {result.resolvedHsCodes.join(", ")}</span></>
              )}
              {result.bafuKey && (
                <><span className="ebt-chain-arrow">→</span><span className="ebt-chain-step ebt-chain-bafu">BAFU [{result.bafuKeyLevel}] {result.bafuKey}</span></>
              )}
            </div>
            {result.resolvedHsCodes.length > 0 && (
              <div className="ebt-hs-descriptions">
                {result.resolvedHsCodes.slice(0, 5).map(hs => {
                  const desc = hsLookup[hs]?.description || hsLookup[hs.substring(0, 4)]?.description || hsLookup[hs.substring(0, 2)]?.description;
                  return desc ? <div key={hs} className="ebt-hs-desc"><span className="ebt-code">{hs}</span> {desc}</div> : null;
                })}
              </div>
            )}
          </div>

          {result.bafuEntry && result.bafuEntry.topProcesses.length > 0 && (
            <div className="ebt-detail-section">
              <h4>BAFU Top Processes</h4>
              <table className="ebt-process-table">
                <thead>
                  <tr><th>Process</th><th>GHG (kg CO₂e)</th><th>Unit</th></tr>
                </thead>
                <tbody>
                  {result.bafuEntry.topProcesses.map((p, i) => (
                    <tr key={i}>
                      <td>{p.name}</td>
                      <td className="ebt-num">{formatGhg(p.ghg)}</td>
                      <td>/{p.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {bafuKgStats && (
            <div className="ebt-detail-section">
              <h4>BAFU GHG Stats (per kg)</h4>
              <div className="ebt-stats-grid">
                <div><span className="ebt-stat-label">Min</span> {formatGhg(bafuKgStats.min)}</div>
                <div><span className="ebt-stat-label">Median</span> {formatGhg(bafuKgStats.median)}</div>
                <div><span className="ebt-stat-label">Avg</span> {formatGhg(bafuKgStats.avg)}</div>
                <div><span className="ebt-stat-label">Max</span> {formatGhg(bafuKgStats.max)}</div>
                <div><span className="ebt-stat-label">Count</span> {bafuKgStats.count}</div>
              </div>
            </div>
          )}

          <div className="ebt-detail-section">
            <h4>Match Quality</h4>
            <div className="ebt-quality">
              {result.bafuKeyLevel === "HS-6" && <span className="ebt-quality-badge ebt-q-good">Precise (HS-6)</span>}
              {result.bafuKeyLevel === "HS-4" && <span className="ebt-quality-badge ebt-q-moderate">Moderate (HS-4)</span>}
              {result.bafuKeyLevel === "HS-2" && <span className="ebt-quality-badge ebt-q-broad">Broad (HS-2 chapter)</span>}
              {!result.bafuEntry && <span className="ebt-quality-badge ebt-q-none">No BAFU data</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function EcoinventBafuTool({ data }: { data: AppData }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const productIndex = useMemo(() => {
    if (!data.ecoinventMapping) return [];
    return buildProductIndex(data.ecoinventMapping);
  }, [data.ecoinventMapping]);

  const searchResults = useMemo(() => {
    return searchProducts(productIndex, query);
  }, [productIndex, query]);

  const comparisonResults = useMemo((): ComparisonResult[] => {
    if (!data.concordance || !data.bafuCoverage) return [];

    return searchResults.map(product => {
      const hsCodes = resolveToHsCodes(product.cpcCode, product.hsCode, data.concordance);
      const bafu = data.bafuCoverage ? findBafuEntry(hsCodes, data.bafuCoverage) : null;
      const t2 = data.t2Lookup ? findT2Node(product.cpcCode, product.hsCode, data.t2Lookup) : null;

      return {
        product,
        t2NodeId: t2?.id ?? null,
        t2Code: t2?.code ?? null,
        t2Name: t2?.name ?? null,
        bafuEntry: bafu?.entry ?? null,
        bafuKey: bafu?.key ?? null,
        bafuKeyLevel: bafu?.level ?? null,
        resolvedHsCodes: hsCodes,
        ecoinventCpcCode: product.cpcCode,
        ecoinventHsCode: product.hsCode,
      };
    });
  }, [searchResults, data]);

  // Summary stats
  const stats = useMemo(() => {
    if (comparisonResults.length === 0) return null;
    const withBafu = comparisonResults.filter(r => r.bafuEntry !== null).length;
    const withT2 = comparisonResults.filter(r => r.t2NodeId !== null).length;
    const hs6 = comparisonResults.filter(r => r.bafuKeyLevel === "HS-6").length;
    const hs4 = comparisonResults.filter(r => r.bafuKeyLevel === "HS-4").length;
    const hs2 = comparisonResults.filter(r => r.bafuKeyLevel === "HS-2").length;
    return { total: comparisonResults.length, withBafu, withT2, hs6, hs4, hs2 };
  }, [comparisonResults]);

  const hsLookup = data.hsLookup || {};

  if (!open) {
    return (
      <button className="ebt-toggle" onClick={() => setOpen(true)} title="ecoinvent ↔ BAFU Comparison Tool">
        ⚗
      </button>
    );
  }

  return (
    <div className="ebt-overlay" onClick={() => setOpen(false)}>
      <div className="ebt-panel" onClick={(e) => e.stopPropagation()}>
        <div className="ebt-header">
          <h2>ecoinvent ↔ BAFU Comparison</h2>
          <button className="ebt-close" onClick={() => setOpen(false)}>&times;</button>
        </div>

        <div className="ebt-search-area">
          <input
            type="text"
            className="ebt-search-input"
            placeholder='Search ecoinvent products (e.g. "market for zinc", "polyethylene", "steel")...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button className="ebt-search-clear" onClick={() => setQuery("")}>×</button>
          )}
        </div>

        {stats && (
          <div className="ebt-summary">
            <span>{stats.total} results</span>
            <span className="ebt-summary-sep">·</span>
            <span>{stats.withT2} with T2 match</span>
            <span className="ebt-summary-sep">·</span>
            <span>{stats.withBafu} with BAFU data</span>
            {stats.withBafu > 0 && (
              <>
                <span className="ebt-summary-sep">·</span>
                <span className="ebt-summary-quality">
                  {stats.hs6 > 0 && <span className="ebt-q-good">{stats.hs6} precise</span>}
                  {stats.hs4 > 0 && <span className="ebt-q-moderate">{stats.hs4} moderate</span>}
                  {stats.hs2 > 0 && <span className="ebt-q-broad">{stats.hs2} broad</span>}
                </span>
              </>
            )}
          </div>
        )}

        <div className="ebt-results">
          {query && comparisonResults.length === 0 && (
            <div className="ebt-empty">No ecoinvent products match "{query}"</div>
          )}
          {!query && (
            <div className="ebt-empty">
              Enter an ecoinvent product name to find matching BAFU emission data.
              <br /><br />
              This tool searches ecoinvent products, resolves them through CPC/HS concordances
              to find the closest BAFU process data, and shows the match quality (HS-6 precise,
              HS-4 moderate, or HS-2 broad chapter-level).
            </div>
          )}
          {comparisonResults.map((result, i) => (
            <ResultCard key={`${result.product.product}-${i}`} result={result} hsLookup={hsLookup} />
          ))}
        </div>
      </div>
    </div>
  );
}
