import { useState } from "react";

/* Data-source URLs for every taxonomy and concordance */
const URLS = {
  hs: "https://github.com/datasets/harmonized-system",
  cn: "https://tilastot.tulli.fi",
  hts: "https://hts.usitc.gov",
  ca: "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/",
  naics: "https://www.census.gov/naics/",
  cpc: "https://unstats.un.org/unsd/classifications/Econ/cpc",
  cpa: "https://dd.eionet.europa.eu/vocabulary/eurostat/cpa2_1/csv",
  bea: "https://www.bea.gov/industry/input-output-accounts-data",
  unspsc: "https://data.ok.gov/dataset/unspsc-codes",
  isic: "https://unstats.un.org/unsd/classifications/Econ/Download/In%20Text/ISIC_Rev_4_english_structure.Txt",
  nace: "https://dd.eionet.europa.eu/vocabulary/eurostat/nace_r2/csv",
  /* concordances */
  cpcHs: "https://unstats.un.org/unsd/classifications/Econ/tables/CPC/CPCv21_HS2017/CPC21-HS2017.csv",
  naicsHs: "https://www.census.gov/foreign-trade/schedules/b/2025/imp-code.txt",
  isicCpc: "https://unstats.un.org/unsd/classifications/Econ/tables/CPC/CPCv21_ISIC4/cpc21-isic4.txt",
  cpaHs: "https://ec.europa.eu/eurostat/ramon/relations/index.cfm",
  beaHs: "https://apps.bea.gov/industry/xls/HSConcord.xls",
};

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="about-ext-link">
      {children} ↗
    </a>
  );
}

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
          <h2>Taxonomy Map &amp; Data Sources</h2>
          <button className="about-close" onClick={() => setOpen(false)}>&times;</button>
        </div>

        <div className="about-body">
          <p className="about-intro">
            This diagram shows all 11 classification systems and how they connect
            via concordance tables, shared code bases, and fuzzy matching.
            Click any node to visit its data source. Links to concordance files
            are in the table below the diagram.
          </p>

          <h3>Taxonomy Interconnection Map</h3>
          <div className="about-diagram-container">
            <svg viewBox="0 0 900 500" className="about-diagram">

              {/* === Background Region: HS-Family === */}
              <rect x="30" y="15" width="840" height="145" rx="12" fill="#eef2ff" stroke="#c7d2fe" strokeWidth="1.5" />
              <text x="450" y="38" textAnchor="middle" className="about-region-label">
                HS-Family Taxonomies (Shared 6-Digit Base)
              </text>

              {/* === ROW 0: HS-FAMILY NODES === */}

              {/* HS — hub node, gold border */}
              <a href={URLS.hs} target="_blank" rel="noopener noreferrer">
                <g className="about-node-hover">
                  <title>{"HS \u2014 Harmonized System (International)\n6,940 codes · UN Comtrade\nClick to open data source"}</title>
                  <rect x="340" y="50" width="120" height="52" rx="8" fill="#4f46e5" stroke="#f59e0b" strokeWidth="3" />
                  <text x="400" y="82" textAnchor="middle" className="about-node-text">HS</text>
                </g>
              </a>
              <text x="400" y="118" textAnchor="middle" className="about-node-detail">6,940 codes</text>
              <text x="400" y="130" textAnchor="middle" className="about-node-source">UN Comtrade (hub)</text>

              {/* CN */}
              <a href={URLS.cn} target="_blank" rel="noopener noreferrer">
                <g className="about-node-hover">
                  <title>{"CN \u2014 Combined Nomenclature (EU)\n12,113 codes · Finnish Customs\nClick to open data source"}</title>
                  <rect x="65" y="85" width="110" height="48" rx="8" fill="#1e40af" />
                  <text x="120" y="114" textAnchor="middle" className="about-node-text">CN (EU)</text>
                </g>
              </a>
              <text x="120" y="149" textAnchor="middle" className="about-node-detail">12,113 codes</text>
              <text x="120" y="161" textAnchor="middle" className="about-node-source">Finnish Customs</text>

              {/* HTS */}
              <a href={URLS.hts} target="_blank" rel="noopener noreferrer">
                <g className="about-node-hover">
                  <title>{"HTS \u2014 Harmonized Tariff Schedule (US)\n29,675 codes · USITC\nClick to open data source"}</title>
                  <rect x="520" y="85" width="110" height="48" rx="8" fill="#92400e" />
                  <text x="575" y="114" textAnchor="middle" className="about-node-text">HTS (US)</text>
                </g>
              </a>
              <text x="575" y="149" textAnchor="middle" className="about-node-detail">29,675 codes</text>
              <text x="575" y="161" textAnchor="middle" className="about-node-source">USITC</text>

              {/* CA */}
              <a href={URLS.ca} target="_blank" rel="noopener noreferrer">
                <g className="about-node-hover">
                  <title>{"CA \u2014 Canadian Customs Tariff\n19,252 codes · CBSA\nClick to open data source"}</title>
                  <rect x="720" y="85" width="110" height="48" rx="8" fill="#9f1239" />
                  <text x="775" y="114" textAnchor="middle" className="about-node-text">CA</text>
                </g>
              </a>
              <text x="775" y="149" textAnchor="middle" className="about-node-detail">19,252 codes</text>
              <text x="775" y="161" textAnchor="middle" className="about-node-source">CBSA</text>

              {/* HS-family connector lines (dashed indigo) */}
              <line x1="340" y1="80" x2="175" y2="100" stroke="#6366f1" strokeWidth="2.5" strokeDasharray="8,4">
                <title>{"Shared 6-digit HS base codes\nCN extends HS with EU-specific 8-digit codes"}</title>
              </line>
              <text x="248" y="80" textAnchor="middle" className="about-edge-label">6-digit</text>

              <line x1="460" y1="80" x2="520" y2="100" stroke="#6366f1" strokeWidth="2.5" strokeDasharray="8,4">
                <title>{"Shared 6-digit HS base codes\nHTS extends HS with US-specific tariff lines"}</title>
              </line>
              <text x="495" y="82" textAnchor="middle" className="about-edge-label">6-digit</text>

              <line x1="460" y1="84" x2="720" y2="100" stroke="#6366f1" strokeWidth="2.5" strokeDasharray="8,4">
                <title>{"Shared 6-digit HS base codes\nCA extends HS with Canadian tariff items"}</title>
              </line>
              <text x="600" y="82" textAnchor="middle" className="about-edge-label">6-digit</text>

              {/* === ROW 1: DIRECT HS CONCORDANCES === */}

              {/* NAICS */}
              <a href={URLS.naics} target="_blank" rel="noopener noreferrer">
                <g className="about-node-hover">
                  <title>{"NAICS 2022 \u2014 North American Industry Classification\n2,122 codes · US Census Bureau\nClick to open data source"}</title>
                  <rect x="55" y="250" width="110" height="48" rx="8" fill="#0c4a6e" />
                  <text x="110" y="279" textAnchor="middle" className="about-node-text">NAICS</text>
                </g>
              </a>
              <text x="110" y="314" textAnchor="middle" className="about-node-detail">2,122 codes</text>
              <text x="110" y="326" textAnchor="middle" className="about-node-source">US Census Bureau</text>

              {/* CPC */}
              <a href={URLS.cpc} target="_blank" rel="noopener noreferrer">
                <g className="about-node-hover">
                  <title>{"CPC 2.1 \u2014 Central Product Classification\n4,596 codes · UN Statistics Division\nClick to open data source"}</title>
                  <rect x="215" y="250" width="110" height="48" rx="8" fill="#0891b2" />
                  <text x="270" y="279" textAnchor="middle" className="about-node-text">CPC</text>
                </g>
              </a>
              <text x="270" y="314" textAnchor="middle" className="about-node-detail">4,596 codes</text>
              <text x="270" y="326" textAnchor="middle" className="about-node-source">UN Stats</text>

              {/* CPA */}
              <a href={URLS.cpa} target="_blank" rel="noopener noreferrer">
                <g className="about-node-hover">
                  <title>{"CPA 2.1 \u2014 Classification of Products by Activity (EU)\n5,522 codes · Eurostat / EIONET\nClick to open data source"}</title>
                  <rect x="375" y="250" width="110" height="48" rx="8" fill="#c2410c" />
                  <text x="430" y="279" textAnchor="middle" className="about-node-text">CPA</text>
                </g>
              </a>
              <text x="430" y="314" textAnchor="middle" className="about-node-detail">5,522 codes</text>
              <text x="430" y="326" textAnchor="middle" className="about-node-source">Eurostat / EIONET</text>

              {/* BEA */}
              <a href={URLS.bea} target="_blank" rel="noopener noreferrer">
                <g className="about-node-hover">
                  <title>{"BEA \u2014 Input-Output Commodity Codes (US)\n500 codes · Bureau of Economic Analysis\nClick to open data source"}</title>
                  <rect x="535" y="250" width="110" height="48" rx="8" fill="#064e3b" />
                  <text x="590" y="279" textAnchor="middle" className="about-node-text">BEA</text>
                </g>
              </a>
              <text x="590" y="314" textAnchor="middle" className="about-node-detail">500 codes</text>
              <text x="590" y="326" textAnchor="middle" className="about-node-source">BEA.gov</text>

              {/* UNSPSC */}
              <a href={URLS.unspsc} target="_blank" rel="noopener noreferrer">
                <g className="about-node-hover">
                  <title>{"UNSPSC \u2014 Products & Services Code\n77,337 codes · Oklahoma Open Data\nClick to open data source"}</title>
                  <rect x="685" y="250" width="120" height="48" rx="8" fill="#7c3aed" />
                  <text x="745" y="279" textAnchor="middle" className="about-node-text">UNSPSC</text>
                </g>
              </a>
              <text x="745" y="314" textAnchor="middle" className="about-node-detail">77,337 codes</text>
              <text x="745" y="326" textAnchor="middle" className="about-node-source">Oklahoma Open Data</text>

              {/* === ROW 1 CONNECTION LINES: HS -> each === */}

              {/* HS -> NAICS (Official concordance, green solid) */}
              <path d="M 370 102 Q 240 175 110 250" fill="none" stroke="#059669" strokeWidth="2">
                <title>{"NAICS\u2194HS Concordance\nSource: US Census Bureau imp-code.txt"}</title>
              </path>
              <text x="220" y="170" textAnchor="middle" className="about-edge-label" fill="#059669">imp-code.txt</text>

              {/* HS -> CPC (Official concordance, green solid) */}
              <path d="M 385 102 Q 328 175 270 250" fill="none" stroke="#059669" strokeWidth="2">
                <title>{"CPC\u2194HS Concordance\n5,843 mappings · UN Stats"}</title>
              </path>
              <text x="312" y="180" textAnchor="middle" className="about-edge-label" fill="#059669">5,843 mappings</text>

              {/* HS -> CPA (Official concordance, green solid) */}
              <path d="M 410 102 Q 420 175 430 250" fill="none" stroke="#059669" strokeWidth="2">
                <title>{"CPA\u2194HS Concordance\nSource: Eurostat RAMON"}</title>
              </path>
              <text x="435" y="180" textAnchor="middle" className="about-edge-label" fill="#059669">Eurostat RAMON</text>

              {/* HS -> BEA (Official concordance, green solid) */}
              <path d="M 430 102 Q 510 175 590 250" fill="none" stroke="#059669" strokeWidth="2">
                <title>{"BEA\u2194HS Concordance\nSource: BEA.gov HSConcord.xls"}</title>
              </path>
              <text x="525" y="170" textAnchor="middle" className="about-edge-label" fill="#059669">HSConcord.xls</text>

              {/* HS -> UNSPSC (Fuzzy matching, red dashed) */}
              <path d="M 445 102 Q 595 175 745 250" fill="none" stroke="#dc2626" strokeWidth="2" strokeDasharray="6,4">
                <title>{"UNSPSC\u2194HS Fuzzy Text Matching\nJaccard similarity \u2265 0.3, top 3\n~4.4% coverage"}</title>
              </path>
              <text x="615" y="165" textAnchor="middle" className="about-edge-label" fill="#dc2626">Fuzzy (Jaccard ~4.4%)</text>

              {/* === ROW 2: CPC-CONNECTED === */}

              {/* ISIC */}
              <a href={URLS.isic} target="_blank" rel="noopener noreferrer">
                <g className="about-node-hover">
                  <title>{"ISIC Rev. 4 \u2014 Intl Standard Industrial Classification\n766 codes · UN Statistics Division\nClick to open data source"}</title>
                  <rect x="215" y="385" width="110" height="48" rx="8" fill="#1e1b4b" />
                  <text x="270" y="414" textAnchor="middle" className="about-node-text">ISIC</text>
                </g>
              </a>
              <text x="270" y="449" textAnchor="middle" className="about-node-detail">766 codes</text>
              <text x="270" y="461" textAnchor="middle" className="about-node-source">UN Stats</text>

              {/* NACE */}
              <a href={URLS.nace} target="_blank" rel="noopener noreferrer">
                <g className="about-node-hover">
                  <title>{"NACE Rev. 2 \u2014 EU Economic Activities\n996 codes · Eurostat / EIONET\nClick to open data source"}</title>
                  <rect x="425" y="385" width="110" height="48" rx="8" fill="#500724" />
                  <text x="480" y="414" textAnchor="middle" className="about-node-text">NACE</text>
                </g>
              </a>
              <text x="480" y="449" textAnchor="middle" className="about-node-detail">996 codes</text>
              <text x="480" y="461" textAnchor="middle" className="about-node-source">Eurostat / EIONET</text>

              {/* CPC -> ISIC (Official concordance, green solid) */}
              <line x1="270" y1="298" x2="270" y2="385" stroke="#059669" strokeWidth="2">
                <title>{"ISIC\u2194CPC Concordance\nSource: UN Stats ISIC4-CPC21.txt"}</title>
              </line>
              <text x="288" y="345" textAnchor="start" className="about-edge-label" fill="#059669">ISIC4-CPC21.txt</text>

              {/* ISIC <-> NACE (Structural identity, teal dotted) */}
              <line x1="325" y1="409" x2="425" y2="409" stroke="#0891b2" strokeWidth="2.5" strokeDasharray="3,3">
                <title>{"NACE \u2248 ISIC \u2014 Structural Identity\nIdentical numeric codes at 2/3/4 digits"}</title>
              </line>
              <text x="375" y="400" textAnchor="middle" className="about-edge-label" fill="#0891b2">{"\u2248 same codes"}</text>

            </svg>
          </div>

          <div className="about-legend">
            <h4>Legend</h4>
            <div className="about-legend-grid">
              <div className="about-legend-item">
                <span className="about-legend-line dashed" style={{ borderColor: "#6366f1" }}></span>
                <span>Shared 6-digit HS base codes</span>
              </div>
              <div className="about-legend-item">
                <span className="about-legend-line solid" style={{ borderColor: "#059669" }}></span>
                <span>Official concordance table</span>
              </div>
              <div className="about-legend-item">
                <span className="about-legend-line dashed" style={{ borderColor: "#dc2626" }}></span>
                <span>Fuzzy text matching (Jaccard similarity)</span>
              </div>
              <div className="about-legend-item">
                <span className="about-legend-line dotted" style={{ borderColor: "#0891b2" }}></span>
                <span>Structural identity (same numeric codes)</span>
              </div>
            </div>
          </div>

          <div className="about-concordance-details">
            <h4>Concordance Details</h4>
            <table className="about-concordance-table">
              <thead>
                <tr>
                  <th>Connection</th>
                  <th>Type</th>
                  <th>Source File</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>HS &harr; CN / HTS / CA</strong></td>
                  <td><span className="about-conc-badge shared">Shared Code</span></td>
                  <td>Inherent structure</td>
                  <td>First 6 digits identical; national extensions add 8-10 digit detail</td>
                </tr>
                <tr>
                  <td><strong>CPC &harr; HS</strong></td>
                  <td><span className="about-conc-badge official">Official</span></td>
                  <td><ExtLink href={URLS.cpcHs}>CPC21-HS2017.csv</ExtLink></td>
                  <td>5,843 mappings from UN Statistics Division</td>
                </tr>
                <tr>
                  <td><strong>NAICS &harr; HS</strong></td>
                  <td><span className="about-conc-badge official">Official</span></td>
                  <td><ExtLink href={URLS.naicsHs}>imp-code.txt</ExtLink></td>
                  <td>HTS-10 to NAICS-6 from US Census Bureau</td>
                </tr>
                <tr>
                  <td><strong>ISIC &harr; CPC</strong></td>
                  <td><span className="about-conc-badge official">Official</span></td>
                  <td><ExtLink href={URLS.isicCpc}>ISIC4-CPC21.txt</ExtLink></td>
                  <td>UN Statistics Division concordance</td>
                </tr>
                <tr>
                  <td><strong>CPA &harr; HS</strong></td>
                  <td><span className="about-conc-badge official">Official</span></td>
                  <td><ExtLink href={URLS.cpaHs}>Eurostat RAMON</ExtLink></td>
                  <td>CPA2008 &harr; HS2007 correspondence tables</td>
                </tr>
                <tr>
                  <td><strong>BEA &harr; HS</strong></td>
                  <td><span className="about-conc-badge official">Official</span></td>
                  <td><ExtLink href={URLS.beaHs}>HSConcord.xls</ExtLink></td>
                  <td>BEA Input-Output to HS concordance</td>
                </tr>
                <tr>
                  <td><strong>NACE &asymp; ISIC</strong></td>
                  <td><span className="about-conc-badge structural">Structural</span></td>
                  <td>Inherent</td>
                  <td>NACE Rev.2 uses identical codes to ISIC Rev.4 at 2/3/4 digits</td>
                </tr>
                <tr>
                  <td><strong>UNSPSC &harr; HS</strong></td>
                  <td><span className="about-conc-badge fuzzy">Fuzzy</span></td>
                  <td>Computed</td>
                  <td>Jaccard similarity &ge; 0.3, top 3 matches, ~4.4% coverage</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="about-details">
            <h4>Taxonomy Sources</h4>
            <div className="about-details-grid">
              <div className="about-detail-card" style={{ borderLeftColor: "#4f46e5" }}>
                <strong>HS &mdash; Harmonized System</strong>
                <p>6,940 codes from UN Comtrade. The international standard for classifying traded goods. All HS-family taxonomies share the first 6 digits.</p>
                <ExtLink href={URLS.hs}>Data source</ExtLink>
              </div>
              <div className="about-detail-card" style={{ borderLeftColor: "#1e40af" }}>
                <strong>CN &mdash; Combined Nomenclature (EU)</strong>
                <p>12,113 codes from Finnish Customs. Extends HS with EU-specific 8-digit codes for tariff and statistical purposes.</p>
                <ExtLink href={URLS.cn}>Data source</ExtLink>
              </div>
              <div className="about-detail-card" style={{ borderLeftColor: "#92400e" }}>
                <strong>HTS &mdash; Harmonized Tariff Schedule (US)</strong>
                <p>29,675 codes from the US International Trade Commission (USITC). Extends HS with US-specific tariff lines.</p>
                <ExtLink href={URLS.hts}>Data source</ExtLink>
              </div>
              <div className="about-detail-card" style={{ borderLeftColor: "#9f1239" }}>
                <strong>CA &mdash; Canadian Customs Tariff</strong>
                <p>19,252 codes from Canada Border Services Agency (CBSA). Canada's extension of the HS system.</p>
                <ExtLink href={URLS.ca}>Data source</ExtLink>
              </div>
              <div className="about-detail-card" style={{ borderLeftColor: "#0891b2" }}>
                <strong>CPC &mdash; Central Product Classification</strong>
                <p>4,596 codes from UN Statistics Division (Ver. 2.1). Covers both goods and services. Linked to HS via UN concordance table with 5,843 mappings.</p>
                <ExtLink href={URLS.cpc}>Data source</ExtLink>
              </div>
              <div className="about-detail-card" style={{ borderLeftColor: "#7c3aed" }}>
                <strong>UNSPSC &mdash; Products &amp; Services Code</strong>
                <p>77,337 codes from Oklahoma Open Data. Connected to HS via fuzzy text matching (Jaccard similarity threshold 0.3, ~4.4% coverage).</p>
                <ExtLink href={URLS.unspsc}>Data source</ExtLink>
              </div>
              <div className="about-detail-card" style={{ borderLeftColor: "#0c4a6e" }}>
                <strong>NAICS &mdash; North American Industry Classification</strong>
                <p>2,122 codes from US Census Bureau (2022 edition). Industry classification linked to HS via Census Bureau imp-code.txt concordance.</p>
                <ExtLink href={URLS.naics}>Data source</ExtLink>
              </div>
              <div className="about-detail-card" style={{ borderLeftColor: "#1e1b4b" }}>
                <strong>ISIC &mdash; Intl Standard Industrial Classification</strong>
                <p>766 codes from UN Stats (Rev. 4). Global industry classification with official concordance to CPC.</p>
                <ExtLink href={URLS.isic}>Data source</ExtLink>
              </div>
              <div className="about-detail-card" style={{ borderLeftColor: "#500724" }}>
                <strong>NACE &mdash; EU Economic Activities</strong>
                <p>996 codes from Eurostat/EIONET (Rev. 2). EU implementation of ISIC &mdash; identical numeric code structure.</p>
                <ExtLink href={URLS.nace}>Data source</ExtLink>
              </div>
              <div className="about-detail-card" style={{ borderLeftColor: "#c2410c" }}>
                <strong>CPA &mdash; Classification of Products by Activity</strong>
                <p>5,522 codes from Eurostat/EIONET (2.1). EU product classification linked to HS via Eurostat RAMON concordance.</p>
                <ExtLink href={URLS.cpa}>Data source</ExtLink>
              </div>
              <div className="about-detail-card" style={{ borderLeftColor: "#064e3b" }}>
                <strong>BEA &mdash; Input-Output Commodity Codes</strong>
                <p>~500 codes from BEA.gov. US economic analysis classification linked to HS via BEA concordance.</p>
                <ExtLink href={URLS.bea}>Data source</ExtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
