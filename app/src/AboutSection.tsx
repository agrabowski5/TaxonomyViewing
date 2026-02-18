import { useState } from "react";

export function AboutSection() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button className="about-toggle" onClick={() => setOpen(true)} title="About this app">
        ?
      </button>
    );
  }

  return (
    <div className="about-overlay" onClick={() => setOpen(false)}>
      <div className="about-panel" onClick={(e) => e.stopPropagation()}>
        <div className="about-header">
          <h2>About Taxonomy Explorer</h2>
          <button className="about-close" onClick={() => setOpen(false)}>×</button>
        </div>

        <div className="about-body">
          <p className="about-intro">
            Taxonomy Explorer is a tool for comparing international trade and product
            classification systems side-by-side, with cross-taxonomy mapping, ecoinvent
            environmental data integration, and a custom taxonomy builder.
          </p>

          <h3>Data Source Interconnections</h3>
          <div className="about-diagram-container">
            <svg viewBox="0 0 900 620" className="about-diagram">
              {/* Background regions */}
              <rect x="30" y="20" width="340" height="260" rx="12" fill="#eef2ff" stroke="#c7d2fe" strokeWidth="1.5" />
              <text x="200" y="46" textAnchor="middle" className="about-region-label">HS-Family Taxonomies</text>

              <rect x="30" y="310" width="340" height="130" rx="12" fill="#ecfeff" stroke="#a5f3fc" strokeWidth="1.5" />
              <text x="200" y="336" textAnchor="middle" className="about-region-label">Product Classifications</text>

              <rect x="530" y="20" width="340" height="200" rx="12" fill="#fef3c7" stroke="#fcd34d" strokeWidth="1.5" />
              <text x="700" y="46" textAnchor="middle" className="about-region-label">Combined Taxonomies</text>

              <rect x="530" y="250" width="340" height="130" rx="12" fill="#fef2f2" stroke="#fca5a5" strokeWidth="1.5" />
              <text x="700" y="276" textAnchor="middle" className="about-region-label">Environmental Data</text>

              <rect x="530" y="410" width="340" height="100" rx="12" fill="#f0fdf4" stroke="#86efac" strokeWidth="1.5" />
              <text x="700" y="436" textAnchor="middle" className="about-region-label">Concordance / Mappings</text>

              {/* HS (center of HS-family) */}
              <g>
                <rect x="148" y="70" width="105" height="50" rx="8" fill="#6366f1" />
                <text x="200" y="100" textAnchor="middle" className="about-node-text">HS</text>
                <text x="200" y="135" textAnchor="middle" className="about-node-detail">6,940 codes</text>
                <text x="200" y="148" textAnchor="middle" className="about-node-source">UN Comtrade</text>
              </g>

              {/* CN/EU */}
              <g>
                <rect x="55" y="170" width="105" height="50" rx="8" fill="#1e40af" />
                <text x="107" y="200" textAnchor="middle" className="about-node-text">CN (EU)</text>
                <text x="107" y="235" textAnchor="middle" className="about-node-detail">12,113 codes</text>
                <text x="107" y="248" textAnchor="middle" className="about-node-source">Finnish Customs</text>
              </g>

              {/* HTS/US */}
              <g>
                <rect x="185" y="170" width="105" height="50" rx="8" fill="#92400e" />
                <text x="237" y="200" textAnchor="middle" className="about-node-text">HTS (US)</text>
                <text x="237" y="235" textAnchor="middle" className="about-node-detail">29,675 codes</text>
                <text x="237" y="248" textAnchor="middle" className="about-node-source">USITC</text>
              </g>

              {/* Canadian */}
              <g>
                <rect x="250" y="80" width="105" height="50" rx="8" fill="#9f1239" />
                <text x="302" y="110" textAnchor="middle" className="about-node-text">CA</text>
                <text x="302" y="145" textAnchor="middle" className="about-node-detail">19,252 codes</text>
                <text x="302" y="158" textAnchor="middle" className="about-node-source">CBSA</text>
              </g>

              {/* HS → CN, HTS, CA arrows (shared 6-digit base) */}
              <line x1="175" y1="120" x2="120" y2="170" stroke="#6366f1" strokeWidth="2" strokeDasharray="6,3" markerEnd="url(#arrowBlue)" />
              <line x1="225" y1="120" x2="237" y2="170" stroke="#6366f1" strokeWidth="2" strokeDasharray="6,3" markerEnd="url(#arrowBlue)" />
              <line x1="253" y1="95" x2="250" y2="95" stroke="#6366f1" strokeWidth="2" strokeDasharray="6,3" markerEnd="url(#arrowBlue)" />
              <text x="135" y="165" textAnchor="middle" className="about-edge-label">6-digit</text>
              <text x="255" y="165" textAnchor="middle" className="about-edge-label">6-digit</text>

              {/* CPC */}
              <g>
                <rect x="55" y="350" width="105" height="50" rx="8" fill="#0891b2" />
                <text x="107" y="380" textAnchor="middle" className="about-node-text">CPC</text>
                <text x="107" y="415" textAnchor="middle" className="about-node-detail">4,596 codes</text>
                <text x="107" y="428" textAnchor="middle" className="about-node-source">UN Stats</text>
              </g>

              {/* UNSPSC */}
              <g>
                <rect x="210" y="350" width="120" height="50" rx="8" fill="#7c3aed" />
                <text x="270" y="380" textAnchor="middle" className="about-node-text">UNSPSC</text>
                <text x="270" y="415" textAnchor="middle" className="about-node-detail">77,337 codes</text>
                <text x="270" y="428" textAnchor="middle" className="about-node-source">Oklahoma Open Data</text>
              </g>

              {/* Concordance CPC↔HS */}
              <g>
                <rect x="560" y="450" width="140" height="44" rx="8" fill="#059669" />
                <text x="630" y="470" textAnchor="middle" className="about-node-text-sm">CPC↔HS</text>
                <text x="630" y="484" textAnchor="middle" className="about-node-text-sm">Concordance</text>
              </g>
              <text x="630" y="507" textAnchor="middle" className="about-node-detail">5,843 mappings (UN)</text>

              {/* Fuzzy UNSPSC↔HS */}
              <g>
                <rect x="720" y="450" width="130" height="44" rx="8" fill="#7c3aed" opacity="0.8" />
                <text x="785" y="470" textAnchor="middle" className="about-node-text-sm">UNSPSC↔HS</text>
                <text x="785" y="484" textAnchor="middle" className="about-node-text-sm">Fuzzy Match</text>
              </g>
              <text x="785" y="507" textAnchor="middle" className="about-node-detail">Jaccard ≥ 0.3</text>

              {/* Concordance arrows */}
              <path d="M 160 375 Q 400 420 560 472" fill="none" stroke="#059669" strokeWidth="2" markerEnd="url(#arrowGreen)" />
              <path d="M 200 95 Q 400 60 560 472" fill="none" stroke="#059669" strokeWidth="2" strokeDasharray="4,4" markerEnd="url(#arrowGreen)" />

              {/* Fuzzy arrows */}
              <path d="M 330 375 Q 500 440 720 472" fill="none" stroke="#7c3aed" strokeWidth="2" strokeDasharray="4,4" markerEnd="url(#arrowPurple)" />
              <path d="M 253 95 Q 480 30 720 472" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="4,4" markerEnd="url(#arrowPurple)" />

              {/* T1 (HTS Goods + CPC Services) */}
              <g>
                <rect x="555" y="70" width="145" height="50" rx="8" fill="#d97706" />
                <text x="627" y="100" textAnchor="middle" className="about-node-text">T1</text>
                <text x="627" y="135" textAnchor="middle" className="about-node-detail">31,595 codes</text>
                <text x="627" y="148" textAnchor="middle" className="about-node-source">HTS goods + CPC services</text>
              </g>

              {/* T2 (CPC Backbone + HTS Detail) */}
              <g>
                <rect x="720" y="70" width="135" height="50" rx="8" fill="#b45309" />
                <text x="787" y="100" textAnchor="middle" className="about-node-text">T2</text>
                <text x="787" y="135" textAnchor="middle" className="about-node-detail">24,428 codes</text>
                <text x="787" y="148" textAnchor="middle" className="about-node-source">CPC backbone + HTS detail</text>
              </g>

              {/* HTS → T1 */}
              <path d="M 290 195 Q 430 120 555 95" fill="none" stroke="#d97706" strokeWidth="2.5" markerEnd="url(#arrowAmber)" />
              <text x="420" y="135" textAnchor="middle" className="about-edge-label-bold">HTS sections I-XXII</text>

              {/* CPC → T1 */}
              <path d="M 107 350 Q 300 280 555 95" fill="none" stroke="#d97706" strokeWidth="2.5" markerEnd="url(#arrowAmber)" />
              <text x="300" y="300" textAnchor="middle" className="about-edge-label-bold">CPC sections 5-9</text>

              {/* CPC → T2 */}
              <path d="M 160 355 Q 450 250 720 95" fill="none" stroke="#b45309" strokeWidth="2.5" markerEnd="url(#arrowAmberDark)" />
              <text x="460" y="250" textAnchor="middle" className="about-edge-label-bold">CPC backbone</text>

              {/* HTS → T2 */}
              <path d="M 290 185 Q 530 100 720 90" fill="none" stroke="#b45309" strokeWidth="2" strokeDasharray="6,3" markerEnd="url(#arrowAmberDark)" />
              <text x="520" y="100" textAnchor="middle" className="about-edge-label">HTS detail under leaves</text>

              {/* ecoinvent */}
              <g>
                <rect x="580" y="290" width="135" height="50" rx="8" fill="#f59e0b" />
                <text x="647" y="320" textAnchor="middle" className="about-node-text">ecoinvent</text>
                <text x="647" y="355" textAnchor="middle" className="about-node-detail">4,031 products</text>
                <text x="647" y="368" textAnchor="middle" className="about-node-source">v3.10 Cut-Off</text>
              </g>

              {/* ecoinvent → CPC */}
              <path d="M 580 315 Q 370 340 160 370" fill="none" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrowAmber)" />
              <text x="370" y="348" textAnchor="middle" className="about-edge-label">660 CPC codes</text>

              {/* ecoinvent → HS */}
              <path d="M 620 290 Q 420 190 253 100" fill="none" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrowAmber)" />
              <text x="440" y="188" textAnchor="middle" className="about-edge-label">966 HS codes</text>

              {/* Emission factors */}
              <g>
                <rect x="735" y="290" width="120" height="50" rx="8" fill="#dc2626" opacity="0.85" />
                <text x="795" y="320" textAnchor="middle" className="about-node-text-sm">Emission</text>
                <text x="795" y="334" textAnchor="middle" className="about-node-text-sm">Factors</text>
              </g>

              {/* Custom Taxonomy Builder */}
              <g>
                <rect x="80" y="480" width="260" height="60" rx="12" fill="#fffbeb" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6,4" />
                <text x="210" y="507" textAnchor="middle" className="about-custom-label">Custom Taxonomy Builder</text>
                <text x="210" y="525" textAnchor="middle" className="about-node-detail">User-defined nodes, meta-parameters,</text>
                <text x="210" y="537" textAnchor="middle" className="about-node-detail">cross-taxonomy mappings, decision trails</text>
              </g>

              {/* Custom ↔ all taxonomies (dashed) */}
              <path d="M 210 480 L 200 120" fill="none" stroke="#d97706" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.5" />
              <path d="M 170 480 L 107 400" fill="none" stroke="#d97706" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.5" />
              <path d="M 260 480 L 270 400" fill="none" stroke="#d97706" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.5" />

              {/* Arrow markers */}
              <defs>
                <marker id="arrowBlue" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <path d="M 0 0 L 8 3 L 0 6 Z" fill="#6366f1" />
                </marker>
                <marker id="arrowGreen" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <path d="M 0 0 L 8 3 L 0 6 Z" fill="#059669" />
                </marker>
                <marker id="arrowPurple" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <path d="M 0 0 L 8 3 L 0 6 Z" fill="#7c3aed" />
                </marker>
                <marker id="arrowAmber" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <path d="M 0 0 L 8 3 L 0 6 Z" fill="#f59e0b" />
                </marker>
                <marker id="arrowAmberDark" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <path d="M 0 0 L 8 3 L 0 6 Z" fill="#b45309" />
                </marker>
              </defs>
            </svg>
          </div>

          <div className="about-legend">
            <h4>Legend</h4>
            <div className="about-legend-grid">
              <div className="about-legend-item">
                <span className="about-legend-line solid" style={{ borderColor: "#6366f1" }}></span>
                <span>Shared 6-digit HS base codes</span>
              </div>
              <div className="about-legend-item">
                <span className="about-legend-line solid" style={{ borderColor: "#d97706" }}></span>
                <span>Taxonomy composition (direct source)</span>
              </div>
              <div className="about-legend-item">
                <span className="about-legend-line dashed" style={{ borderColor: "#059669" }}></span>
                <span>CPC↔HS concordance table (UN)</span>
              </div>
              <div className="about-legend-item">
                <span className="about-legend-line dashed" style={{ borderColor: "#7c3aed" }}></span>
                <span>Fuzzy text matching (Jaccard similarity)</span>
              </div>
              <div className="about-legend-item">
                <span className="about-legend-line solid" style={{ borderColor: "#f59e0b" }}></span>
                <span>ecoinvent product-to-code mapping</span>
              </div>
              <div className="about-legend-item">
                <span className="about-legend-line dashed" style={{ borderColor: "#d97706" }}></span>
                <span>Custom taxonomy user mappings</span>
              </div>
            </div>
          </div>

          <div className="about-details">
            <h4>Data Sources</h4>
            <div className="about-details-grid">
              <div className="about-detail-card" style={{ borderLeftColor: "#6366f1" }}>
                <strong>HS — Harmonized System</strong>
                <p>6,940 codes from UN Comtrade. The international standard for classifying traded goods. All HS-family taxonomies (CN, HTS, CA) share the first 6 digits.</p>
              </div>
              <div className="about-detail-card" style={{ borderLeftColor: "#1e40af" }}>
                <strong>CN — Combined Nomenclature (EU)</strong>
                <p>12,113 codes from Finnish Customs. Extends HS with EU-specific 8-digit codes for tariff and statistical purposes.</p>
              </div>
              <div className="about-detail-card" style={{ borderLeftColor: "#92400e" }}>
                <strong>HTS — Harmonized Tariff Schedule (US)</strong>
                <p>29,675 codes from the US International Trade Commission (USITC). Extends HS with US-specific tariff lines.</p>
              </div>
              <div className="about-detail-card" style={{ borderLeftColor: "#9f1239" }}>
                <strong>CA — Canadian Customs Tariff</strong>
                <p>19,252 codes from Canada Border Services Agency (CBSA). Canada's extension of the HS system.</p>
              </div>
              <div className="about-detail-card" style={{ borderLeftColor: "#0891b2" }}>
                <strong>CPC — Central Product Classification</strong>
                <p>4,596 codes from UN Statistics Division (Ver. 2.1). Covers both goods and services. Linked to HS via a UN concordance table with 5,843 mappings.</p>
              </div>
              <div className="about-detail-card" style={{ borderLeftColor: "#7c3aed" }}>
                <strong>UNSPSC — Products &amp; Services Code</strong>
                <p>77,337 codes from Oklahoma Open Data. Connected to HS via fuzzy text matching (Jaccard similarity threshold 0.3, top 3 matches).</p>
              </div>
              <div className="about-detail-card" style={{ borderLeftColor: "#d97706" }}>
                <strong>T1 — HTS Goods + CPC Services</strong>
                <p>31,595 codes. A combined taxonomy using HTS sections I-XXII for goods and CPC sections 5-9 for services, providing unified goods+services coverage.</p>
              </div>
              <div className="about-detail-card" style={{ borderLeftColor: "#b45309" }}>
                <strong>T2 — CPC Backbone + HTS Detail</strong>
                <p>24,428 codes. Uses the full CPC tree as a backbone structure, with HTS tariff lines nested under CPC goods leaf nodes via the concordance table.</p>
              </div>
              <div className="about-detail-card" style={{ borderLeftColor: "#f59e0b" }}>
                <strong>ecoinvent v3.10</strong>
                <p>4,031 products mapped to 660 CPC codes and 966 HS codes (from the Cut-Off Activity Overview). Provides environmental impact data as a coverage overlay.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
