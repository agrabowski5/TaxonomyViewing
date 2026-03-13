import { useState, useMemo, useImperativeHandle, forwardRef, Fragment } from "react";
import type { AppData, TreeNode, TaxonomyType, GenericConcordance } from "./types";

export type AboutSectionHandle = {
  openToTab: (tab: "taxonomies" | "lca" | "methods" | "matrix" | "browser" | "concordances") => void;
};

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
  beaNaics: "https://www.bea.gov/sites/default/files/2023-10/BEA-Industry-and-Commodity-Codes-and-NAICS-Concordance.xlsx",
  /* LCA databases */
  ecoinvent: "https://ecoinvent.org/the-ecoinvent-database/",
  epa: "https://www.epa.gov/land-research/us-environmentally-extended-input-output-useeio-technical-content",
  exiobase: "https://zenodo.org/records/10604610",
  uslci: "https://www.nrel.gov/lci/",
  bafu: "https://www.bafu.admin.ch/bafu/en/home/topics/economy-consumption/info-specialists/environmental-data-of-economic-activities.html",
};

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="about-ext-link">
      {children} ↗
    </a>
  );
}

/* =============================== Taxonomy Map Tab =============================== */

function TaxonomyMapTab() {
  return (
    <>
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
              <title>{"HS \u2014 Harmonized System (International)\n4 levels · 5,612 leaves · 6,957 nodes\nOwner: WCO (World Customs Organization)\nData: UN Comtrade\nClick to open data source"}</title>
              <rect x="340" y="50" width="120" height="52" rx="8" fill="#4f46e5" stroke="#f59e0b" strokeWidth="3" />
              <text x="400" y="82" textAnchor="middle" className="about-node-text">HS</text>
            </g>
          </a>
          <text x="400" y="118" textAnchor="middle" className="about-node-detail">4 lvl · 5,612 leaves · 6,957 nodes</text>
          <text x="400" y="130" textAnchor="middle" className="about-node-source">WCO · Data: UN Comtrade</text>

          {/* CN */}
          <a href={URLS.cn} target="_blank" rel="noopener noreferrer">
            <g className="about-node-hover">
              <title>{"CN \u2014 Combined Nomenclature (EU)\n5 lvl · 9,308 leaves · 12,113 nodes\nOwner: European Commission\nData: Finnish Customs\nClick to open data source"}</title>
              <rect x="65" y="85" width="110" height="48" rx="8" fill="#1e40af" />
              <text x="120" y="114" textAnchor="middle" className="about-node-text">CN (EU)</text>
            </g>
          </a>
          <text x="120" y="149" textAnchor="middle" className="about-node-detail">5 lvl · 9,308 leaves · 12,113 nodes</text>
          <text x="120" y="161" textAnchor="middle" className="about-node-source">EU Commission · Data: Finnish Customs</text>

          {/* HTS */}
          <a href={URLS.hts} target="_blank" rel="noopener noreferrer">
            <g className="about-node-hover">
              <title>{"HTS \u2014 Harmonized Tariff Schedule (US)\n12 lvl · 26,655 leaves · 35,593 nodes\nOwner & Data: USITC\nClick to open data source"}</title>
              <rect x="520" y="85" width="110" height="48" rx="8" fill="#92400e" />
              <text x="575" y="114" textAnchor="middle" className="about-node-text">HTS (US)</text>
            </g>
          </a>
          <text x="575" y="149" textAnchor="middle" className="about-node-detail">12 lvl · 26,655 leaves · 35,593 nodes</text>
          <text x="575" y="161" textAnchor="middle" className="about-node-source">USITC</text>

          {/* CA */}
          <a href={URLS.ca} target="_blank" rel="noopener noreferrer">
            <g className="about-node-hover">
              <title>{"CA \u2014 Canadian Customs Tariff\n6 lvl · 10,281 leaves · 19,274 nodes\nOwner & Data: CBSA\nClick to open data source"}</title>
              <rect x="720" y="85" width="110" height="48" rx="8" fill="#9f1239" />
              <text x="775" y="114" textAnchor="middle" className="about-node-text">CA</text>
            </g>
          </a>
          <text x="775" y="149" textAnchor="middle" className="about-node-detail">6 lvl · 10,281 leaves · 19,274 nodes</text>
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
              <title>{"NAICS 2022 \u2014 North American Industry Classification\n5 lvl · 552 leaves · 1,216 nodes\nOwner: US Census / StatCan / INEGI\nData: US Census Bureau\nClick to open data source"}</title>
              <rect x="55" y="250" width="110" height="48" rx="8" fill="#0c4a6e" />
              <text x="110" y="279" textAnchor="middle" className="about-node-text">NAICS</text>
            </g>
          </a>
          <text x="110" y="314" textAnchor="middle" className="about-node-detail">5 lvl · 552 leaves · 1,216 nodes</text>
          <text x="110" y="326" textAnchor="middle" className="about-node-source">US Census / StatCan / INEGI</text>

          {/* CPC */}
          <a href={URLS.cpc} target="_blank" rel="noopener noreferrer">
            <g className="about-node-hover">
              <title>{"CPC 2.1 \u2014 Central Product Classification\n5 lvl · 2,887 leaves · 4,596 nodes\nOwner & Data: UN Statistics Division\nClick to open data source"}</title>
              <rect x="215" y="250" width="110" height="48" rx="8" fill="#0891b2" />
              <text x="270" y="279" textAnchor="middle" className="about-node-text">CPC</text>
            </g>
          </a>
          <text x="270" y="314" textAnchor="middle" className="about-node-detail">5 lvl · 2,887 leaves · 4,596 nodes</text>
          <text x="270" y="326" textAnchor="middle" className="about-node-source">UN Statistics Division</text>

          {/* CPA */}
          <a href={URLS.cpa} target="_blank" rel="noopener noreferrer">
            <g className="about-node-hover">
              <title>{"CPA 2.1 \u2014 Classification of Products by Activity (EU)\n6 lvl · 3,218 leaves · 5,522 nodes\nOwner: Eurostat\nData: EIONET\nClick to open data source"}</title>
              <rect x="375" y="250" width="110" height="48" rx="8" fill="#c2410c" />
              <text x="430" y="279" textAnchor="middle" className="about-node-text">CPA</text>
            </g>
          </a>
          <text x="430" y="314" textAnchor="middle" className="about-node-detail">6 lvl · 3,218 leaves · 5,522 nodes</text>
          <text x="430" y="326" textAnchor="middle" className="about-node-source">Eurostat · Data: EIONET</text>

          {/* BEA */}
          <a href={URLS.bea} target="_blank" rel="noopener noreferrer">
            <g className="about-node-hover">
              <title>{"BEA \u2014 Input-Output Commodity Codes (US)\n3 lvl · 412 leaves · 508 nodes\nOwner & Data: Bureau of Economic Analysis\nClick to open data source"}</title>
              <rect x="535" y="250" width="110" height="48" rx="8" fill="#064e3b" />
              <text x="590" y="279" textAnchor="middle" className="about-node-text">BEA</text>
            </g>
          </a>
          <text x="590" y="314" textAnchor="middle" className="about-node-detail">3 lvl · 412 leaves · 508 nodes</text>
          <text x="590" y="326" textAnchor="middle" className="about-node-source">Bureau of Economic Analysis</text>

          {/* UNSPSC */}
          <a href={URLS.unspsc} target="_blank" rel="noopener noreferrer">
            <g className="about-node-hover">
              <title>{"UNSPSC \u2014 Products & Services Code\n4 lvl · 71,502 leaves · 77,337 nodes\nOwner: UNDP / GS1 US\nData: Oklahoma Open Data\nClick to open data source"}</title>
              <rect x="685" y="250" width="120" height="48" rx="8" fill="#7c3aed" />
              <text x="745" y="279" textAnchor="middle" className="about-node-text">UNSPSC</text>
            </g>
          </a>
          <text x="745" y="314" textAnchor="middle" className="about-node-detail">4 lvl · 71,502 leaves · 77,337 nodes</text>
          <text x="745" y="326" textAnchor="middle" className="about-node-source">UNDP / GS1 US · Data: OK Open Data</text>

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

          {/* BEA <-> NAICS (Official concordance, green solid) */}
          <path d="M 165 274 Q 350 355 535 274" fill="none" stroke="#059669" strokeWidth="2">
            <title>{"BEA\u2194NAICS Concordance\n499 mappings · BEA.gov\nBEA I-O codes to NAICS 2017"}</title>
          </path>
          <text x="350" y="342" textAnchor="middle" className="about-edge-label" fill="#059669">499 BEA-NAICS mappings</text>

          {/* === ROW 2: CPC-CONNECTED === */}

          {/* ISIC */}
          <a href={URLS.isic} target="_blank" rel="noopener noreferrer">
            <g className="about-node-hover">
              <title>{"ISIC Rev. 4 \u2014 Intl Standard Industrial Classification\n4 lvl · 419 leaves · 766 nodes\nOwner & Data: UN Statistics Division\nClick to open data source"}</title>
              <rect x="215" y="385" width="110" height="48" rx="8" fill="#1e1b4b" />
              <text x="270" y="414" textAnchor="middle" className="about-node-text">ISIC</text>
            </g>
          </a>
          <text x="270" y="449" textAnchor="middle" className="about-node-detail">4 lvl · 419 leaves · 766 nodes</text>
          <text x="270" y="461" textAnchor="middle" className="about-node-source">UN Statistics Division</text>

          {/* NACE */}
          <a href={URLS.nace} target="_blank" rel="noopener noreferrer">
            <g className="about-node-hover">
              <title>{"NACE Rev. 2 \u2014 EU Economic Activities\n4 lvl · 615 leaves · 996 nodes\nOwner: Eurostat\nData: EIONET\nClick to open data source"}</title>
              <rect x="425" y="385" width="110" height="48" rx="8" fill="#500724" />
              <text x="480" y="414" textAnchor="middle" className="about-node-text">NACE</text>
            </g>
          </a>
          <text x="480" y="449" textAnchor="middle" className="about-node-detail">4 lvl · 615 leaves · 996 nodes</text>
          <text x="480" y="461" textAnchor="middle" className="about-node-source">Eurostat · Data: EIONET</text>

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
              <td><strong>BEA &harr; NAICS</strong></td>
              <td><span className="about-conc-badge official">Official</span></td>
              <td><ExtLink href={URLS.beaNaics}>BEA-NAICS.xlsx</ExtLink></td>
              <td>499 mappings &mdash; BEA I-O detail codes to NAICS 2017</td>
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
    </>
  );
}

/* =============================== LCA Databases Tab =============================== */

function LcaDatabasesTab() {
  return (
    <>
      <p className="about-intro">
        This diagram shows how 5 life-cycle assessment databases connect to the
        taxonomy system. Each database maps to taxonomies at a different resolution
        &mdash; from individual product codes to broad HS chapters.
        Click any node to visit its data source.
      </p>

      <h3>LCA Database Connections</h3>
      <div className="about-diagram-container">
        <svg viewBox="0 0 900 420" className="about-diagram">

          {/* === Background Region: Taxonomy Bridge Nodes === */}
          <rect x="30" y="10" width="840" height="120" rx="12" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1.5" />
          <text x="450" y="30" textAnchor="middle" className="about-region-label" fill="#166534">
            Taxonomy Entry Points
          </text>

          {/* CPC */}
          <a href={URLS.cpc} target="_blank" rel="noopener noreferrer">
            <g className="about-node-hover">
              <title>{"CPC 2.1 \u2014 Central Product Classification\n4,596 codes · UN Stats\nClick to open data source"}</title>
              <rect x="120" y="45" width="110" height="48" rx="8" fill="#0891b2" />
              <text x="175" y="74" textAnchor="middle" className="about-node-text">CPC</text>
            </g>
          </a>
          <text x="175" y="108" textAnchor="middle" className="about-node-detail">4,596 codes</text>

          {/* HS */}
          <a href={URLS.hs} target="_blank" rel="noopener noreferrer">
            <g className="about-node-hover">
              <title>{"HS \u2014 Harmonized System\n6,940 codes · UN Comtrade\nClick to open data source"}</title>
              <rect x="370" y="40" width="120" height="52" rx="8" fill="#4f46e5" stroke="#f59e0b" strokeWidth="3" />
              <text x="430" y="72" textAnchor="middle" className="about-node-text">HS</text>
            </g>
          </a>
          <text x="430" y="108" textAnchor="middle" className="about-node-detail">6,940 codes</text>

          {/* NAICS */}
          <a href={URLS.naics} target="_blank" rel="noopener noreferrer">
            <g className="about-node-hover">
              <title>{"NAICS 2022 \u2014 North American Industry Classification\n2,122 codes · US Census Bureau\nClick to open data source"}</title>
              <rect x="640" y="45" width="110" height="48" rx="8" fill="#0c4a6e" />
              <text x="695" y="74" textAnchor="middle" className="about-node-text">NAICS</text>
            </g>
          </a>
          <text x="695" y="108" textAnchor="middle" className="about-node-detail">2,122 codes</text>

          {/* Taxonomy bridge connectors: CPC <-> HS <-> NAICS */}
          <line x1="230" y1="69" x2="370" y2="66" stroke="#059669" strokeWidth="1.5" strokeDasharray="4,3">
            <title>{"CPC\u2194HS concordance (5,843 mappings)"}</title>
          </line>
          <text x="300" y="60" textAnchor="middle" className="about-edge-label" fill="#059669">concordance</text>

          <line x1="490" y1="66" x2="640" y2="69" stroke="#059669" strokeWidth="1.5" strokeDasharray="4,3">
            <title>{"NAICS\u2194HS concordance (imp-code.txt)"}</title>
          </line>
          <text x="565" y="60" textAnchor="middle" className="about-edge-label" fill="#059669">concordance</text>

          {/* === DIVIDER LABEL === */}
          <text x="450" y="158" textAnchor="middle" fontSize="11" fill="#6b7280" fontStyle="italic">
            LCA / Environmental Databases
          </text>

          {/* === ROW 1: LCA DATABASE NODES === */}

          {/* ecoinvent */}
          <a href={URLS.ecoinvent} target="_blank" rel="noopener noreferrer">
            <g className="about-node-hover">
              <title>{"ecoinvent v3.12\n4,399 products · 677 CPC codes · 993 HS codes · 180 ISIC codes\nLife cycle inventory database\nClick to open data source"}</title>
              <rect x="35" y="185" width="130" height="52" rx="8" fill="#b45309" />
              <text x="100" y="207" textAnchor="middle" className="about-node-text-sm">ecoinvent</text>
              <text x="100" y="224" textAnchor="middle" style={{ fontSize: "8.5px", fill: "#fef3c7" }}>v3.12</text>
            </g>
          </a>
          <text x="100" y="253" textAnchor="middle" className="about-node-detail">4,399 products</text>
          <text x="100" y="265" textAnchor="middle" className="about-node-source">ecoinvent.org</text>

          {/* EPA / USEEIO */}
          <a href={URLS.epa} target="_blank" rel="noopener noreferrer">
            <g className="about-node-hover">
              <title>{"EPA / USEEIO v2.1\nUS Environmentally-Extended Input-Output Model\nEmission factors: kg CO\u2082e / 2022 USD\nClick to open data source"}</title>
              <rect x="210" y="185" width="130" height="52" rx="8" fill="#15803d" />
              <text x="275" y="207" textAnchor="middle" className="about-node-text-sm">EPA/USEEIO</text>
              <text x="275" y="224" textAnchor="middle" style={{ fontSize: "8.5px", fill: "#dcfce7" }}>v2.1</text>
            </g>
          </a>
          <text x="275" y="253" textAnchor="middle" className="about-node-detail">Emission factors</text>
          <text x="275" y="265" textAnchor="middle" className="about-node-source">EPA.gov</text>

          {/* EXIOBASE */}
          <a href={URLS.exiobase} target="_blank" rel="noopener noreferrer">
            <g className="about-node-hover">
              <title>{"EXIOBASE 3.8.2\nMulti-Regional Input-Output database\nCarbon intensity: kg CO\u2082e / 2022 EUR\nClick to open data source"}</title>
              <rect x="385" y="185" width="130" height="52" rx="8" fill="#6d28d9" />
              <text x="450" y="207" textAnchor="middle" className="about-node-text-sm">EXIOBASE</text>
              <text x="450" y="224" textAnchor="middle" style={{ fontSize: "8.5px", fill: "#ede9fe" }}>3.8.2</text>
            </g>
          </a>
          <text x="450" y="253" textAnchor="middle" className="about-node-detail">190 products</text>
          <text x="450" y="265" textAnchor="middle" className="about-node-source">Zenodo</text>

          {/* USLCI */}
          <a href={URLS.uslci} target="_blank" rel="noopener noreferrer">
            <g className="about-node-hover">
              <title>{"US LCI (NREL)\nUS Life Cycle Inventory Database\n~3,000 processes via NAICS codes\nClick to open data source"}</title>
              <rect x="560" y="185" width="130" height="52" rx="8" fill="#0369a1" />
              <text x="625" y="207" textAnchor="middle" className="about-node-text-sm">US LCI</text>
              <text x="625" y="224" textAnchor="middle" style={{ fontSize: "8.5px", fill: "#e0f2fe" }}>NREL</text>
            </g>
          </a>
          <text x="625" y="253" textAnchor="middle" className="about-node-detail">~3,000 processes</text>
          <text x="625" y="265" textAnchor="middle" className="about-node-source">NREL</text>

          {/* BAFU */}
          <a href={URLS.bafu} target="_blank" rel="noopener noreferrer">
            <g className="about-node-hover">
              <title>{"BAFU:2025 (Swiss FOEN)\nSwiss Federal LCI Database\n~3,000 processes mapped to HS chapters\nClick to open data source"}</title>
              <rect x="735" y="185" width="130" height="52" rx="8" fill="#be123c" />
              <text x="800" y="207" textAnchor="middle" className="about-node-text-sm">BAFU:2025</text>
              <text x="800" y="224" textAnchor="middle" style={{ fontSize: "8.5px", fill: "#fce7f3" }}>Swiss FOEN</text>
            </g>
          </a>
          <text x="800" y="253" textAnchor="middle" className="about-node-detail">~3,000 processes</text>
          <text x="800" y="265" textAnchor="middle" className="about-node-source">FOEN</text>

          {/* === CONNECTION LINES === */}

          {/* ecoinvent -> CPC (direct, green solid) */}
          <path d="M 100 185 Q 130 140 175 93" fill="none" stroke="#059669" strokeWidth="2.5">
            <title>{"ecoinvent \u2192 CPC\nDirect code-level mapping\n677 CPC codes matched"}</title>
          </path>
          <text x="115" y="138" textAnchor="start" className="about-edge-label" fill="#059669">677 CPC codes</text>

          {/* ecoinvent -> HS (direct, green solid) */}
          <path d="M 140 185 Q 270 140 400 92" fill="none" stroke="#059669" strokeWidth="2.5">
            <title>{"ecoinvent \u2192 HS\nDirect code-level mapping\n993 HS codes matched"}</title>
          </path>
          <text x="255" y="128" textAnchor="middle" className="about-edge-label" fill="#059669">993 HS codes</text>

          {/* ecoinvent ISIC note (no line — ISIC node is in the taxonomy diagram above) */}
          <text x="100" y="277" textAnchor="middle" className="about-node-source" fill="#b45309">+ 180 ISIC codes</text>

          {/* EPA -> NAICS (blue dashed, first hop) */}
          <path d="M 310 185 Q 500 120 695 93" fill="none" stroke="#2563eb" strokeWidth="2" strokeDasharray="7,4">
            <title>{"EPA/USEEIO \u2192 NAICS \u2192 HS\nTwo-hop via Census concordance\nResolution: HS-6 digit"}</title>
          </path>
          <text x="510" y="125" textAnchor="middle" className="about-edge-label" fill="#2563eb">NAICS {"\u2192"} HS-6</text>

          {/* EXIOBASE -> HS (green solid, code-level via concordance) */}
          <path d="M 450 185 Q 442 140 430 92" fill="none" stroke="#059669" strokeWidth="2.5">
            <title>{"EXIOBASE \u2192 HS\nPrecise concordance (5,085 HS-6 codes)\nResolution: HS-6 via official concordance"}</title>
          </path>
          <text x="462" y="148" textAnchor="start" className="about-edge-label" fill="#059669">5,085 HS-6</text>

          {/* EXIOBASE -> CPC (green solid, via CPA concordance) */}
          <path d="M 410 185 Q 300 140 200 93" fill="none" stroke="#7c3aed" strokeWidth="2" strokeDasharray="6,3">
            <title>{"EXIOBASE \u2192 CPC (via CPA)\n2,608 CPA codes mapped to EXIOBASE products\nCPA 2002 \u2248 CPC at 2-4 digit level"}</title>
          </path>
          <text x="290" y="148" textAnchor="middle" className="about-edge-label" fill="#7c3aed">2,608 CPA</text>

          {/* USLCI -> NAICS (blue dashed, first hop) */}
          <path d="M 660 185 Q 678 140 695 93" fill="none" stroke="#2563eb" strokeWidth="2" strokeDasharray="7,4">
            <title>{"US LCI \u2192 NAICS \u2192 HS\nTwo-hop via Census concordance\nResolution: HS-6 digit"}</title>
          </path>
          <text x="695" y="145" textAnchor="start" className="about-edge-label" fill="#2563eb">NAICS {"\u2192"} HS-6</text>

          {/* BAFU -> HS (orange dotted, chapter-level) */}
          <path d="M 770 185 Q 600 120 470 92" fill="none" stroke="#d97706" strokeWidth="2.5" strokeDasharray="3,3">
            <title>{"BAFU \u2192 HS\nChapter-level approximate mapping\nResolution: HS-2 chapters"}</title>
          </path>
          <text x="640" y="120" textAnchor="middle" className="about-edge-label" fill="#d97706">HS-2 chapters</text>

          {/* === RESOLUTION ANNOTATIONS === */}
          <rect x="30" y="290" width="840" height="120" rx="10" fill="#fafafa" stroke="#e5e7eb" strokeWidth="1" />
          <text x="450" y="312" textAnchor="middle" fontSize="11" fontWeight="600" fill="#374151">Mapping Resolution Comparison</text>

          {/* Fine-grained bar */}
          <rect x="80" y="325" width="360" height="22" rx="4" fill="#dcfce7" stroke="#059669" strokeWidth="1" />
          <text x="260" y="340" textAnchor="middle" fontSize="10" fontWeight="600" fill="#166534">Code-level (CPC / HS-6)</text>
          <text x="80" y="360" fontSize="9" fill="#6b7280">ecoinvent (individual CPC/HS/ISIC product codes)</text>
          <text x="80" y="372" fontSize="9" fill="#6b7280">EPA/USEEIO, US LCI (HS-6 via NAICS)</text>
          <text x="80" y="384" fontSize="9" fill="#6b7280">EXIOBASE (HS-6 + CPA via official concordance)</text>

          {/* Coarse-grained bar */}
          <rect x="480" y="325" width="360" height="22" rx="4" fill="#fef9c3" stroke="#d97706" strokeWidth="1" />
          <text x="660" y="340" textAnchor="middle" fontSize="10" fontWeight="600" fill="#854d0e">Chapter-level (HS-2)</text>
          <text x="480" y="360" fontSize="9" fill="#6b7280">BAFU (category {"\u2192"} HS-2 chapter mapping)</text>

        </svg>
      </div>

      <div className="about-legend">
        <h4>Legend</h4>
        <div className="about-legend-grid">
          <div className="about-legend-item">
            <span className="about-legend-line solid" style={{ borderColor: "#059669" }}></span>
            <span>Direct code-level mapping</span>
          </div>
          <div className="about-legend-item">
            <span className="about-legend-line dashed" style={{ borderColor: "#7c3aed" }}></span>
            <span>CPA concordance (CPC bridge)</span>
          </div>
          <div className="about-legend-item">
            <span className="about-legend-line dashed" style={{ borderColor: "#2563eb" }}></span>
            <span>Via NAICS concordance (2-hop)</span>
          </div>
          <div className="about-legend-item">
            <span className="about-legend-line dotted" style={{ borderColor: "#d97706" }}></span>
            <span>Chapter-level approximate mapping</span>
          </div>
        </div>
      </div>

      <div className="about-concordance-details">
        <h4>Database Details</h4>
        <table className="about-concordance-table">
          <thead>
            <tr>
              <th>Database</th>
              <th>Resolution</th>
              <th>Coverage</th>
              <th>Data Type</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>ecoinvent v3.12</strong></td>
              <td><span className="about-conc-badge official">Code-level</span></td>
              <td>677 CPC + 993 HS + 180 ISIC codes</td>
              <td>Product inventory (4,399 products)</td>
            </tr>
            <tr>
              <td><strong>EPA / USEEIO v2.1</strong></td>
              <td><span className="about-conc-badge official">HS-6</span></td>
              <td>Via NAICS {"\u2192"} HS concordance</td>
              <td>Emission factors (kg CO&#8322;e / 2022 USD)</td>
            </tr>
            <tr>
              <td><strong>EXIOBASE 3.8.2</strong></td>
              <td><span className="about-conc-badge official">HS-6 / CPA</span></td>
              <td>Official concordance (5,085 HS + 2,608 CPA codes)</td>
              <td>Carbon intensity (kg CO&#8322;e / 2022 EUR)</td>
            </tr>
            <tr>
              <td><strong>US LCI (NREL)</strong></td>
              <td><span className="about-conc-badge official">HS-6</span></td>
              <td>~3,000 processes via NAICS</td>
              <td>Process-level LCI data</td>
            </tr>
            <tr>
              <td><strong>BAFU:2025</strong></td>
              <td><span className="about-conc-badge fuzzy">HS-2 chapter</span></td>
              <td>Category {"\u2192"} HS chapter mapping</td>
              <td>Process-level LCI data (~3,000 processes)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="about-details">
        <h4>Database Sources</h4>
        <div className="about-details-grid">
          <div className="about-detail-card" style={{ borderLeftColor: "#b45309" }}>
            <strong>ecoinvent v3.12</strong>
            <p>The most comprehensive LCI database. 4,399 products mapped directly to CPC, HS, and ISIC codes. Provides product-level inventory data for environmental assessment.</p>
            <ExtLink href={URLS.ecoinvent}>Data source</ExtLink>
          </div>
          <div className="about-detail-card" style={{ borderLeftColor: "#15803d" }}>
            <strong>EPA / USEEIO v2.1</strong>
            <p>US Environmentally-Extended Input-Output model. Provides supply-chain greenhouse gas emission factors (kg CO&#8322;e per 2022 USD) linked via NAICS-to-HS concordance.</p>
            <ExtLink href={URLS.epa}>Data source</ExtLink>
          </div>
          <div className="about-detail-card" style={{ borderLeftColor: "#6d28d9" }}>
            <strong>EXIOBASE 3.8.2</strong>
            <p>Multi-regional input-output database. Carbon intensity factors (kg CO&#8322;e per 2022 EUR) with official concordance tables mapping 5,085 HS-6 codes, 2,608 CPA codes, 502 ISIC codes, and 664 NACE codes to 190 EXIOBASE product categories.</p>
            <ExtLink href={URLS.exiobase}>Data source</ExtLink>
          </div>
          <div className="about-detail-card" style={{ borderLeftColor: "#0369a1" }}>
            <strong>US LCI (NREL)</strong>
            <p>US Life Cycle Inventory Database from the National Renewable Energy Laboratory. ~3,000 processes mapped to HS-6 codes via NAICS concordance.</p>
            <ExtLink href={URLS.uslci}>Data source</ExtLink>
          </div>
          <div className="about-detail-card" style={{ borderLeftColor: "#be123c" }}>
            <strong>BAFU:2025 (Swiss FOEN)</strong>
            <p>Swiss Federal Office for the Environment LCI database. ~3,000 processes mapped to HS-2 chapters via category-to-chapter correspondence.</p>
            <ExtLink href={URLS.bafu}>Data source</ExtLink>
          </div>
        </div>
      </div>

      <div className="about-details" style={{ marginTop: 20 }}>
        <h4>Coverage Mapping Rules</h4>
        <p style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.7, marginBottom: 12 }}>
          Each tree node is evaluated <strong>independently</strong> &mdash; coverage is never propagated
          from a parent node down to its children. A node receives a badge only if it has its own
          concordance chain to the database. When a parent and child both show the same badge, each
          found the match through its own code.
        </p>
        <table className="about-concordance-table" style={{ fontSize: 11.5 }}>
          <thead>
            <tr>
              <th>Database</th>
              <th>Leaf Nodes</th>
              <th>Parent / Ancestor Nodes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>ecoinvent</strong></td>
              <td>
                Direct lookup: the node&rsquo;s own CPC, HS-6, or ISIC code must exist in the
                ecoinvent product mapping. No prefix shortening &mdash; exact code or nothing.
              </td>
              <td>
                Ancestor fallback: ecoinvent ships explicit ancestor lists (e.g., if ISIC <code>0111</code> has
                products, <code>011</code>, <code>01</code>, and <code>0</code> are listed as ancestors). Parent
                nodes are marked only if they appear in this pre-computed list &mdash; this is upward marking
                from leaves, not downward propagation.
              </td>
            </tr>
            <tr>
              <td><strong>EPA / USEEIO</strong></td>
              <td>
                <strong>HS-family:</strong> extract the 6-digit HS base code and look it up directly in the
                emission factor table. No match at HS-4 or HS-2 level.<br />
                <strong>NAICS:</strong> direct reverse-index lookup (NAICS code &rarr; factors). Tries
                progressively shorter prefixes (6 &rarr; 4 digits) until a match is found.<br />
                <strong>CPC:</strong> concordance chain &mdash; CPC code &rarr; HS-6 via CPC-HS concordance,
                then HS-6 must exist in the factor table.
              </td>
              <td>
                No ancestor mechanism. Parent nodes (e.g., HS-4 heading <code>0102</code>) have no 6-digit
                code, so they never match. Only 6-digit leaf codes can receive a badge.
              </td>
            </tr>
            <tr>
              <td><strong>EXIOBASE</strong></td>
              <td>
                <strong>HS-family:</strong> tries HS-6, then HS-4 in the concordance table. Count = number
                of EXIOBASE product categories mapped to that code.<br />
                <strong>CPC/CPA:</strong> tries progressively shorter CPA prefixes in the CPA-EXIO concordance.
                Falls back to CPC &rarr; HS &rarr; EXIO concordance chain.<br />
                <strong>ISIC/NACE:</strong> direct ISIC-EXIO or NACE-EXIO concordance lookup.
              </td>
              <td>
                Ancestor fallback: EXIOBASE provides explicit HS and CPA ancestor lists. If a node&rsquo;s code
                has no direct match but appears in the ancestor set, it is marked with count&nbsp;=&nbsp;1. This
                means &ldquo;at least one descendant has coverage&rdquo; &mdash; it does not push coverage downward.
              </td>
            </tr>
            <tr>
              <td><strong>US LCI (NREL)</strong></td>
              <td>
                <strong>HS-family:</strong> exact HS-6 lookup in the USLCI coverage map. Count = number of
                processes with GHG data (kg unit).<br />
                <strong>NAICS:</strong> direct reverse-index lookup (NAICS code &rarr; HS keys in USLCI).
                Tries shorter prefixes (6 &rarr; 4).<br />
                <strong>CPC:</strong> concordance chain CPC &rarr; HS-6, then HS-6 must exist in coverage map.
              </td>
              <td>
                No ancestor mechanism. Only nodes whose code resolves to an exact HS-6 match (or NAICS
                reverse match) receive a badge.
              </td>
            </tr>
            <tr>
              <td><strong>BAFU:2025</strong></td>
              <td>
                <strong>HS-family:</strong> extract the 2-digit chapter from the node&rsquo;s code and look up
                in the BAFU chapter map. Every node under the same chapter gets the same data independently.<br />
                <strong>CPC:</strong> concordance chain CPC &rarr; HS-6, extract chapter, then chapter lookup.
              </td>
              <td>
                No ancestor mechanism. The chapter match is intentionally coarse &mdash; both HS-2 <code>01</code> and
                HS-6 <code>010121</code> independently extract chapter <code>01</code> and match the same BAFU entry.
                This is not propagation; each node derives its own chapter.
              </td>
            </tr>
          </tbody>
        </table>

        <h4 style={{ marginTop: 16 }}>Badge Directionality</h4>
        <table className="about-concordance-table" style={{ fontSize: 11.5 }}>
          <thead>
            <tr>
              <th>Badge</th>
              <th>Meaning</th>
              <th>Example</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>1:1</strong></td>
              <td>Exclusive match &mdash; exactly one taxonomy node maps to one database entry, and vice versa.</td>
              <td>HS <code>010121</code> &rarr; 1 ecoinvent product; that product maps only to <code>010121</code>.</td>
            </tr>
            <tr>
              <td><strong>1:N</strong></td>
              <td>Fan-out &mdash; this taxonomy node maps to N database entries (e.g., 1 HS code &rarr; 5 ecoinvent products).</td>
              <td>HS <code>100630</code> &rarr; 12 ecoinvent products (different rice varieties).</td>
            </tr>
            <tr>
              <td><strong>N:1</strong></td>
              <td>Fan-in &mdash; N taxonomy nodes all share the same single database entry. The N value shown is the total sharing count within the visible taxonomy.</td>
              <td>47 HS codes all map to the same BAFU chapter <code>01</code> entry.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

/* =============================== Coverage Matrix Tab =============================== */

const TAXONOMY_GROUPS: { group: string; items: { key: TaxonomyType; label: string }[] }[] = [
  {
    group: "Trade / Tariff",
    items: [
      { key: "hs", label: "HS" },
      { key: "cn", label: "CN (EU)" },
      { key: "hts", label: "HTS (US)" },
      { key: "ca", label: "CA" },
    ],
  },
  {
    group: "Product",
    items: [
      { key: "cpc", label: "CPC" },
      { key: "cpa", label: "CPA" },
      { key: "unspsc", label: "UNSPSC" },
    ],
  },
  {
    group: "Industry",
    items: [
      { key: "naics", label: "NAICS" },
      { key: "isic", label: "ISIC" },
      { key: "nace", label: "NACE" },
    ],
  },
  {
    group: "Economic / I-O",
    items: [
      { key: "bea", label: "BEA" },
    ],
  },
  {
    group: "Combined",
    items: [
      { key: "t1", label: "Taxonomy 1" },
      { key: "t2", label: "Taxonomy 2" },
    ],
  },
];

const DB_COLUMNS = [
  { key: "ecoinvent", label: "ecoinvent" },
  { key: "epa", label: "EPA/USEEIO" },
  { key: "exiobase", label: "EXIOBASE" },
  { key: "uslci", label: "US LCI" },
  { key: "bafu", label: "BAFU" },
];

function mStripCode(code: string): string {
  return code.replace(/[\.\s\-]/g, "");
}

function collectLeaves(nodes: TreeNode[]): TreeNode[] {
  const leaves: TreeNode[] = [];
  function walk(n: TreeNode) {
    if (!n.children || n.children.length === 0) {
      leaves.push(n);
    } else {
      for (const c of n.children) walk(c);
    }
  }
  for (const n of nodes) walk(n);
  return leaves;
}

interface ResolvedLeaf {
  hsCodes: string[];
  isicCodes: string[];
  cpcCodes: string[];
}

function resolveLeaf(
  node: TreeNode,
  taxonomy: TaxonomyType,
  data: AppData,
): ResolvedLeaf {
  const clean = mStripCode(node.code);

  // HS-family: direct HS-6
  if (taxonomy === "hs" || taxonomy === "cn" || taxonomy === "hts" || taxonomy === "ca") {
    const hs6 = clean.substring(0, 6);
    return { hsCodes: hs6.length >= 6 ? [hs6] : [], isicCodes: [], cpcCodes: [] };
  }

  // CPC: direct CPC + concordance to HS
  if (taxonomy === "cpc") {
    const hsMappings = data.concordance?.cpcToHs[clean];
    const hsCodes = hsMappings ? hsMappings.map(m => m.code) : [];
    return { hsCodes, isicCodes: [], cpcCodes: [clean] };
  }

  // UNSPSC: fuzzy mapping to HS
  if (taxonomy === "unspsc") {
    const mappings = data.unspscHsMapping?.unspscToHs[clean];
    const hsCodes = mappings ? mappings.map(m => m.code) : [];
    return { hsCodes, isicCodes: [], cpcCodes: [] };
  }

  // NAICS: concordance to HS
  if (taxonomy === "naics") {
    const mappings = data.naicsHsConcordance?.forward[clean];
    const hsCodes = mappings ? mappings.map(m => m.code) : [];
    return { hsCodes, isicCodes: [], cpcCodes: [] };
  }

  // ISIC/NACE: concordance to CPC, then CPC to HS; also direct ISIC code
  if (taxonomy === "isic" || taxonomy === "nace") {
    const cpcMappings = data.isicCpcConcordance?.forward[clean];
    const cpcCodes = cpcMappings ? cpcMappings.map(m => m.code) : [];
    const hsCodes: string[] = [];
    for (const cpc of cpcCodes) {
      const hs = data.concordance?.cpcToHs[cpc];
      if (hs) hsCodes.push(...hs.map(m => m.code));
    }
    return { hsCodes, isicCodes: [clean], cpcCodes };
  }

  // CPA: concordance to HS
  if (taxonomy === "cpa") {
    const mappings = data.cpaHsConcordance?.forward[clean];
    const hsCodes = mappings ? mappings.map(m => m.code) : [];
    return { hsCodes, isicCodes: [], cpcCodes: [] };
  }

  // BEA: concordance to HS
  if (taxonomy === "bea") {
    const mappings = data.beaHsConcordance?.forward[clean];
    const hsCodes = mappings ? mappings.map(m => m.code) : [];
    return { hsCodes, isicCodes: [], cpcCodes: [] };
  }

  // T1: check origin from ID
  if (taxonomy === "t1") {
    if (node.id.startsWith("t1-svc-")) {
      const cpcCode = clean.startsWith("SVC") ? clean.substring(3) : clean;
      const hsMappings = data.concordance?.cpcToHs[cpcCode];
      const hsCodes = hsMappings ? hsMappings.map(m => m.code) : [];
      return { hsCodes, isicCodes: [], cpcCodes: [cpcCode] };
    } else {
      const hs6 = clean.substring(0, 6);
      return { hsCodes: hs6.length >= 6 ? [hs6] : [], isicCodes: [], cpcCodes: [] };
    }
  }

  // T2: check origin from ID
  if (taxonomy === "t2") {
    if (node.id.startsWith("t2-hts-")) {
      const htsCode = clean.startsWith("HTS") ? clean.substring(3) : clean;
      const hs6 = htsCode.substring(0, 6);
      return { hsCodes: hs6.length >= 6 ? [hs6] : [], isicCodes: [], cpcCodes: [] };
    } else {
      const hsMappings = data.concordance?.cpcToHs[clean];
      const hsCodes = hsMappings ? hsMappings.map(m => m.code) : [];
      return { hsCodes, isicCodes: [], cpcCodes: [clean] };
    }
  }

  return { hsCodes: [], isicCodes: [], cpcCodes: [] };
}

// Resolve*Key functions return the source-level data key (or null if not covered).
// This enables both coverage checking (key !== null) and specificity tracking (count unique keys).

function resolveEcoinventKey(resolved: ResolvedLeaf, data: AppData): string | null {
  if (!data.ecoinventMapping) return null;
  for (const cpc of resolved.cpcCodes) {
    if (data.ecoinventMapping.cpc[cpc]) return `cpc:${cpc}`;
    for (let len = cpc.length - 1; len >= 2; len--) {
      const prefix = cpc.substring(0, len);
      if (data.ecoinventMapping.cpc[prefix]) return `cpc:${prefix}`;
    }
  }
  for (const hs of resolved.hsCodes) {
    if (data.ecoinventMapping.hs[hs]) return `hs:${hs}`;
    for (let len = hs.length - 1; len >= 2; len--) {
      const prefix = hs.substring(0, len);
      if (data.ecoinventMapping.hs[prefix]) return `hs:${prefix}`;
    }
  }
  for (const isic of resolved.isicCodes) {
    if (data.ecoinventMapping.isic[isic]) return `isic:${isic}`;
    for (let len = isic.length - 1; len >= 2; len--) {
      const prefix = isic.substring(0, len);
      if (data.ecoinventMapping.isic[prefix]) return `isic:${prefix}`;
    }
  }
  return null;
}

function resolveEpaKey(resolved: ResolvedLeaf, data: AppData): string | null {
  if (!data.emissionFactors) return null;
  for (const hs of resolved.hsCodes) {
    const entry = data.emissionFactors[hs];
    if (entry) return entry.naicsCode; // source-level key: the NAICS sector
  }
  return null;
}

function resolveExiobaseKey(resolved: ResolvedLeaf, data: AppData): string | null {
  if (data.exiobaseConcordance) {
    const c = data.exiobaseConcordance;
    for (const hs of resolved.hsCodes) {
      if (c.hsToExio[hs]) return c.hsToExio[hs][0]; // first EXIO product code
      if (hs.length >= 4 && c.hsToExio[hs.substring(0, 4)]) return c.hsToExio[hs.substring(0, 4)][0];
    }
    for (const cpc of resolved.cpcCodes) {
      for (let len = cpc.length; len >= 2; len--) {
        const prefix = cpc.substring(0, len);
        if (c.cpaToExio[prefix]) return c.cpaToExio[prefix][0];
      }
    }
    return null;
  }
  if (!data.exiobaseFactors) return null;
  for (const hs of resolved.hsCodes) {
    const ch = hs.substring(0, 2);
    if (data.exiobaseFactors[ch]) return ch; // HS-2 chapter as fallback key
  }
  return null;
}

function resolveUslciKey(resolved: ResolvedLeaf, data: AppData): string | null {
  if (!data.uslciCoverage) return null;
  for (const hs of resolved.hsCodes) {
    const entry = data.uslciCoverage.coverage[hs];
    if (entry) return entry.naicsCodes[0] ?? hs; // source NAICS code
  }
  return null;
}

function resolveBafuKey(resolved: ResolvedLeaf, data: AppData): string | null {
  if (!data.bafuCoverage) return null;
  for (const hs of resolved.hsCodes) {
    const ch = hs.substring(0, 2);
    if (data.bafuCoverage.coverage[ch]) return ch; // HS-2 chapter
  }
  return null;
}

interface MatrixCell {
  covered: number;
  total: number;
  pct: number;
  uniqueKeys: number;
  specificPct: number; // uniqueKeys / covered * 100
}

interface MatrixRow {
  totalNodes: number;
  leafCount: number;
  cells: Record<string, MatrixCell>;
}

function countAllNodes(nodes: TreeNode[]): number {
  let count = 0;
  function walk(n: TreeNode) {
    count++;
    if (n.children) for (const c of n.children) walk(c);
  }
  for (const n of nodes) walk(n);
  return count;
}

function computeMatrix(data: AppData): Record<string, MatrixRow> {
  const result: Record<string, MatrixRow> = {};

  const treeMap: Record<string, TreeNode[]> = {
    hs: data.hsTree, cn: data.cnTree, hts: data.htsTree, ca: data.caTree,
    cpc: data.cpcTree, cpa: data.cpaTree, unspsc: data.unspscTree,
    naics: data.naicsTree, isic: data.isicTree, nace: data.naceTree,
    bea: data.beaTree, t1: data.t1Tree, t2: data.t2Tree,
  };

  const dbResolvers: [string, (r: ResolvedLeaf, d: AppData) => string | null][] = [
    ["ecoinvent", resolveEcoinventKey],
    ["epa", resolveEpaKey],
    ["exiobase", resolveExiobaseKey],
    ["uslci", resolveUslciKey],
    ["bafu", resolveBafuKey],
  ];

  for (const [taxKey, tree] of Object.entries(treeMap)) {
    if (!tree || tree.length === 0) continue;

    const leaves = collectLeaves(tree);
    const counts: Record<string, number> = {};
    const keySets: Record<string, Set<string>> = {};
    for (const [dbKey] of dbResolvers) {
      counts[dbKey] = 0;
      keySets[dbKey] = new Set();
    }

    for (const leaf of leaves) {
      const resolved = resolveLeaf(leaf, taxKey as TaxonomyType, data);
      for (const [dbKey, resolveFn] of dbResolvers) {
        const key = resolveFn(resolved, data);
        if (key !== null) {
          counts[dbKey]++;
          keySets[dbKey].add(key);
        }
      }
    }

    const cells: Record<string, MatrixCell> = {};
    for (const [dbKey] of dbResolvers) {
      const covered = counts[dbKey];
      const uniqueKeys = keySets[dbKey].size;
      cells[dbKey] = {
        covered,
        total: leaves.length,
        pct: leaves.length > 0 ? (covered / leaves.length) * 100 : 0,
        uniqueKeys,
        specificPct: covered > 0 ? (uniqueKeys / covered) * 100 : 0,
      };
    }

    result[taxKey] = { totalNodes: countAllNodes(tree), leafCount: leaves.length, cells };
  }

  return result;
}

function heatColor(pct: number): string {
  if (pct === 0) return "#f8fafc";
  if (pct < 5) return "#fef2f2";
  if (pct < 15) return "#fef9c3";
  if (pct < 35) return "#d9f99d";
  if (pct < 65) return "#86efac";
  return "#22c55e";
}

function specificityColor(pct: number): string {
  if (pct === 0) return "#f8fafc";
  if (pct < 5) return "#fef2f2";
  if (pct < 15) return "#fef9c3";
  if (pct < 35) return "#dbeafe";
  if (pct < 65) return "#93c5fd";
  return "#3b82f6";
}

type MatrixMode = "coverage" | "specificity" | "leafCoverage";

function leafCoverageColor(pct: number): string {
  if (pct === 0) return "#f8fafc";
  if (pct < 2) return "#fef2f2";
  if (pct < 5) return "#fef9c3";
  if (pct < 15) return "#ede9fe";
  if (pct < 35) return "#c4b5fd";
  return "#8b5cf6";
}

/* =============================== Resolution Methods Tab =============================== */

type MethodTag = "direct" | "hs6" | "hs2" | "conc" | "2hop" | "fuzzy" | "none";

interface MethodCell {
  tag: MethodTag;
  chain: string;   // e.g. "CPC → HS-6 → NAICS"
  note: string;    // e.g. "~400 NAICS sectors"
}

const METHOD_LABELS: Record<MethodTag, { label: string; color: string; bg: string }> = {
  direct: { label: "Direct", color: "#065f46", bg: "#d1fae5" },
  hs6:    { label: "HS-6",   color: "#1e40af", bg: "#dbeafe" },
  hs2:    { label: "HS-2",   color: "#92400e", bg: "#fef3c7" },
  conc:   { label: "1-hop",  color: "#5b21b6", bg: "#ede9fe" },
  "2hop": { label: "2-hop",  color: "#9d174d", bg: "#fce7f3" },
  fuzzy:  { label: "Fuzzy",  color: "#6b7280", bg: "#f3f4f6" },
  none:   { label: "—",      color: "#9ca3af", bg: "#f9fafb" },
};

/* Build the full taxonomy × database method matrix.
   Each cell describes the concordance chain used. */
function buildMethodMatrix(): Record<string, Record<string, MethodCell>> {
  const m: Record<string, Record<string, MethodCell>> = {};

  const hsFamily = ["hs", "cn", "hts", "ca"];
  const noSupport: MethodCell = { tag: "none", chain: "—", note: "No concordance path" };

  for (const tx of hsFamily) {
    m[tx] = {
      ecoinvent: { tag: "hs6", chain: "HS-6 lookup + ancestor fallback", note: "993 HS codes; inherits parent if exact miss" },
      epa:       { tag: "hs6", chain: "HS-6 → NAICS → factor", note: "~400 NAICS sectors; no fallback" },
      exiobase:  { tag: "hs6", chain: "HS-6 → EXIO product (HS-4 fallback)", note: "~190 product categories" },
      uslci:     { tag: "hs6", chain: "HS-6 → NAICS → process", note: "~59 NAICS sectors" },
      bafu:      { tag: "hs2", chain: "HS-2 chapter lookup", note: "81 chapters; very coarse" },
    };
  }

  m["cpc"] = {
    ecoinvent: { tag: "direct", chain: "Direct CPC lookup + ancestors", note: "677 CPC codes; best fit (native)" },
    epa:       { tag: "conc", chain: "CPC → HS-6 → NAICS → factor", note: "CPC-to-HS concordance table" },
    exiobase:  { tag: "conc", chain: "CPC ≈ CPA → EXIO; fallback CPC → HS → EXIO", note: "CPA bridge at 2-4 digits" },
    uslci:     { tag: "conc", chain: "CPC → HS-6 → NAICS → process", note: "Same concordance as EPA path" },
    bafu:      { tag: "conc", chain: "CPC → HS-6 → HS-2 chapter", note: "First HS match → chapter" },
  };

  m["cpa"] = {
    ecoinvent: { tag: "direct", chain: "CPA treated as CPC → lookup + ancestors", note: "CPA ≈ CPC at 2-4 digits" },
    epa:       { tag: "conc", chain: "CPA → HS-6 → NAICS → factor", note: "CPA-to-HS concordance" },
    exiobase:  { tag: "direct", chain: "CPA → EXIO (direct concordance)", note: "2,608 CPA codes mapped" },
    uslci:     { tag: "conc", chain: "CPA → HS-6 → NAICS → process", note: "Via CPA-to-HS concordance" },
    bafu:      { tag: "conc", chain: "CPA → HS-6 → HS-2 chapter", note: "Via CPA-to-HS concordance" },
  };

  m["unspsc"] = {
    ecoinvent: noSupport,
    epa:       { tag: "fuzzy", chain: "Fuzzy text → HS-6 → NAICS", note: "Jaccard similarity; ~4.4% match rate" },
    exiobase:  { tag: "fuzzy", chain: "Fuzzy text → HS-6 → EXIO", note: "Same fuzzy HS path" },
    uslci:     { tag: "fuzzy", chain: "Fuzzy text → HS-6 → NAICS", note: "Same fuzzy HS path" },
    bafu:      { tag: "fuzzy", chain: "Fuzzy text → HS-6 → HS-2", note: "Same fuzzy HS path" },
  };

  m["naics"] = {
    ecoinvent: noSupport,
    epa:       { tag: "direct", chain: "Direct NAICS → factor (prefix match)", note: "343 NAICS sectors in EPA/USEEIO" },
    exiobase:  { tag: "conc", chain: "NAICS → HS-6 → EXIO product", note: "Via NAICS-to-HS concordance" },
    uslci:     { tag: "direct", chain: "Direct NAICS → process (prefix match)", note: "38 NAICS sectors in USLCI" },
    bafu:      { tag: "conc", chain: "NAICS → HS-6 → HS-2 chapter", note: "Via NAICS-to-HS concordance" },
  };

  m["isic"] = {
    ecoinvent: { tag: "direct", chain: "Direct ISIC lookup + ancestors", note: "180 ISIC codes" },
    epa:       { tag: "2hop", chain: "ISIC → CPC → HS-6 → NAICS", note: "Two concordance hops" },
    exiobase:  { tag: "direct", chain: "Direct ISIC → EXIO concordance", note: "502 ISIC codes mapped" },
    uslci:     { tag: "2hop", chain: "ISIC → CPC → HS-6 → NAICS", note: "Two concordance hops" },
    bafu:      { tag: "2hop", chain: "ISIC → CPC → HS-6 → HS-2", note: "Two concordance hops" },
  };

  m["nace"] = {
    ecoinvent: { tag: "direct", chain: "NACE numeric = ISIC → lookup + ancestors", note: "Reuses ISIC codes" },
    epa:       { tag: "2hop", chain: "NACE → CPC → HS-6 → NAICS", note: "Via ISIC-CPC concordance" },
    exiobase:  { tag: "direct", chain: "NACE → EXIO (direct + ISIC fallback)", note: "664 NACE codes mapped" },
    uslci:     { tag: "2hop", chain: "NACE → CPC → HS-6 → NAICS", note: "Via ISIC-CPC concordance" },
    bafu:      { tag: "2hop", chain: "NACE → CPC → HS-6 → HS-2", note: "Via ISIC-CPC concordance" },
  };

  m["bea"] = {
    ecoinvent: noSupport,
    epa:       { tag: "conc", chain: "BEA → HS-6 → NAICS → factor", note: "Via BEA-to-HS concordance" },
    exiobase:  { tag: "conc", chain: "BEA → HS-6 → EXIO product", note: "Via BEA-to-HS concordance" },
    uslci:     { tag: "conc", chain: "BEA → HS-6 → NAICS → process", note: "Via BEA-to-HS concordance" },
    bafu:      { tag: "conc", chain: "BEA → HS-6 → HS-2 chapter", note: "Via BEA-to-HS concordance" },
  };

  for (const tk of ["t1", "t2"]) {
    m[tk] = {
      ecoinvent: { tag: "hs6", chain: "HTS-origin → HS-6; CPC-origin → CPC direct", note: "Split by node origin" },
      epa:       { tag: "hs6", chain: "HTS-origin → HS-6 → NAICS; CPC → HS-6 → NAICS", note: "Split by node origin" },
      exiobase:  { tag: "hs6", chain: "HTS-origin → HS-6 → EXIO; CPC → CPA/HS → EXIO", note: "Split by node origin" },
      uslci:     { tag: "hs6", chain: "HTS-origin → HS-6 → NAICS; CPC → HS-6 → NAICS", note: "Split by node origin" },
      bafu:      { tag: "hs2", chain: "HTS-origin → HS-2; CPC → HS → HS-2", note: "Split by node origin" },
    };
  }

  return m;
}

const METHOD_MATRIX = buildMethodMatrix();

function ResolutionMethodsTab() {
  return (
    <>
      <p className="about-intro">
        How each taxonomy resolves to each LCA database. Each cell shows the <strong>concordance chain</strong> and
        resolution granularity. Hover for details.
      </p>

      <div className="rm-legend">
        {(Object.entries(METHOD_LABELS) as [MethodTag, { label: string; color: string; bg: string }][])
          .filter(([k]) => k !== "none")
          .map(([tag, { label, color, bg }]) => (
            <span key={tag} className="rm-badge" style={{ color, backgroundColor: bg }}>{label}</span>
          ))}
      </div>

      <div className="coverage-matrix-wrapper">
        <table className="coverage-matrix rm-table">
          <thead>
            <tr>
              <th className="cm-tax-header">Taxonomy</th>
              {DB_COLUMNS.map(db => (
                <th key={db.key} className="cm-db-header">{db.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TAXONOMY_GROUPS.map(group => (
              <Fragment key={group.group}>
                <tr className="cm-group-row">
                  <td colSpan={1 + DB_COLUMNS.length}>{group.group}</td>
                </tr>
                {group.items.map(item => {
                  const row = METHOD_MATRIX[item.key];
                  if (!row) return null;
                  return (
                    <tr key={item.key} className="cm-data-row">
                      <td className="cm-tax-name">{item.label}</td>
                      {DB_COLUMNS.map(db => {
                        const cell = row[db.key];
                        if (!cell) return <td key={db.key} className="cm-cell" />;
                        const style = METHOD_LABELS[cell.tag];
                        return (
                          <td
                            key={db.key}
                            className="rm-cell"
                            title={`${cell.chain}\n${cell.note}`}
                          >
                            <span className="rm-badge" style={{ color: style.color, backgroundColor: style.bg }}>
                              {style.label}
                            </span>
                            <div className="rm-chain">{cell.chain}</div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="about-details" style={{ marginTop: 16 }}>
        <h4>Method Legend</h4>
        <ul style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.8, paddingLeft: 20 }}>
          <li><strong>Direct</strong> &mdash; Code exists natively in the database (e.g., ecoinvent uses CPC). Ancestor inheritance walks up the hierarchy if the exact code is missing.</li>
          <li><strong>HS-6</strong> &mdash; Extract the 6-digit HS base code and look it up. CN/HTS/CA 8-digit detail is truncated. No fallback if the HS-6 is absent.</li>
          <li><strong>HS-2</strong> &mdash; Match at 2-digit chapter level only. Very broad: all codes under chapter &ldquo;01&rdquo; share one data point.</li>
          <li><strong>1-hop</strong> &mdash; One concordance table bridges the taxonomy to HS (e.g., CPC&rarr;HS, NAICS&rarr;HS, CPA&rarr;HS), then HS resolves to the database.</li>
          <li><strong>2-hop</strong> &mdash; Two concordance tables chained (e.g., ISIC&rarr;CPC&rarr;HS). Fan-out at each hop can reduce specificity.</li>
          <li><strong>Fuzzy</strong> &mdash; Jaccard text similarity matching (threshold 0.3, top 3). Only ~4.4% of UNSPSC codes match anything.</li>
        </ul>
      </div>
    </>
  );
}

function CoverageMatrixTab({ data }: { data: AppData | null }) {
  const [mode, setMode] = useState<MatrixMode>("leafCoverage");

  const matrix = useMemo(() => {
    if (!data) return null;
    return computeMatrix(data);
  }, [data]);

  if (!matrix) {
    return <p style={{ textAlign: "center", padding: 32, color: "#6b7280" }}>Loading data&hellip;</p>;
  }

  return (
    <>
      {/* ---- Metric explanation with equation + diagram ---- */}
      <div className="cm-metric-explainer">
        {mode === "coverage" && (<>
          <div className="cm-equation-block">
            <span className="cm-equation-label">Reachability</span>
            <span className="cm-equation">=</span>
            <span className="cm-equation-frac">
              <span className="cm-frac-num">covered leaves</span>
              <span className="cm-frac-den">total leaves</span>
            </span>
          </div>
          <p className="cm-metric-desc">
            What percentage of a taxonomy&rsquo;s most-specific codes (leaf nodes) can be resolved to <em>at least one</em> LCA data entry. A leaf counts as &ldquo;covered&rdquo; regardless of how many entries match or how specific they are.
          </p>
          {/* Mini tree diagram */}
          <svg className="cm-tree-diagram" viewBox="0 0 340 150" aria-label="Reachability diagram">
            <circle cx="170" cy="20" r="10" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1.5" />
            <text x="170" y="24" textAnchor="middle" fontSize="9" fill="#6b7280">root</text>
            <line x1="170" y1="30" x2="80" y2="60" stroke="#d1d5db" strokeWidth="1.5" />
            <line x1="170" y1="30" x2="260" y2="60" stroke="#d1d5db" strokeWidth="1.5" />
            <circle cx="80" cy="68" r="9" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1.5" />
            <circle cx="260" cy="68" r="9" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1.5" />
            <line x1="80" y1="77" x2="40" y2="110" stroke="#d1d5db" strokeWidth="1.5" />
            <line x1="80" y1="77" x2="120" y2="110" stroke="#d1d5db" strokeWidth="1.5" />
            <line x1="260" y1="77" x2="220" y2="110" stroke="#d1d5db" strokeWidth="1.5" />
            <line x1="260" y1="77" x2="300" y2="110" stroke="#d1d5db" strokeWidth="1.5" />
            <circle cx="40" cy="118" r="10" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
            <text x="40" y="122" textAnchor="middle" fontSize="8" fontWeight="700" fill="#16a34a">&#x2713;</text>
            <circle cx="120" cy="118" r="10" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
            <text x="120" y="122" textAnchor="middle" fontSize="8" fontWeight="700" fill="#16a34a">&#x2713;</text>
            <circle cx="220" cy="118" r="10" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
            <text x="220" y="122" textAnchor="middle" fontSize="8" fontWeight="700" fill="#16a34a">&#x2713;</text>
            <circle cx="300" cy="118" r="10" fill="#fef2f2" stroke="#ef4444" strokeWidth="2" />
            <text x="300" y="122" textAnchor="middle" fontSize="8" fontWeight="700" fill="#ef4444">&#x2717;</text>
            <text x="170" y="147" textAnchor="middle" fontSize="11" fontWeight="600" fill="#374151">Reachability = 3 / 4 = 75%</text>
          </svg>

          <details className="cm-edge-details">
            <summary className="cm-edge-summary">Edge Cases &amp; Examples</summary>

            <h4 className="cm-edge-heading">Parent Has LCA Entry</h4>
            <p className="cm-metric-desc">
              A parent node having an LCA database match does <strong>not</strong> propagate coverage to its children.
              Each leaf is evaluated <strong>independently</strong> using its own code through the concordance chain.
            </p>
            <svg className="cm-tree-diagram" viewBox="0 0 420 200" aria-label="Parent coverage does not propagate">
              <circle cx="210" cy="28" r="14" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
              <text x="210" y="32" textAnchor="middle" fontSize="8" fontWeight="700" fill="#92400e">01</text>
              <text x="262" y="22" fontSize="8" fill="#92400e" fontWeight="600">parent &ldquo;01&rdquo;</text>
              <text x="262" y="33" fontSize="8" fill="#92400e">has ecoinvent match</text>
              <line x1="200" y1="42" x2="110" y2="78" stroke="#d1d5db" strokeWidth="1.5" />
              <line x1="210" y1="42" x2="210" y2="78" stroke="#d1d5db" strokeWidth="1.5" />
              <line x1="220" y1="42" x2="310" y2="78" stroke="#d1d5db" strokeWidth="1.5" />
              <circle cx="110" cy="90" r="12" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
              <text x="110" y="94" textAnchor="middle" fontSize="7" fontWeight="700" fill="#16a34a">0101</text>
              <circle cx="210" cy="90" r="12" fill="#fef2f2" stroke="#ef4444" strokeWidth="2" />
              <text x="210" y="94" textAnchor="middle" fontSize="7" fontWeight="700" fill="#ef4444">0102</text>
              <circle cx="310" cy="90" r="12" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
              <text x="310" y="94" textAnchor="middle" fontSize="7" fontWeight="700" fill="#16a34a">0103</text>
              <text x="110" y="116" textAnchor="middle" fontSize="7" fill="#16a34a">own HS-6 match</text>
              <text x="210" y="116" textAnchor="middle" fontSize="7" fill="#ef4444">no HS-6 match</text>
              <text x="310" y="116" textAnchor="middle" fontSize="7" fill="#16a34a">own HS-6 match</text>
              <line x1="210" y1="42" x2="210" y2="64" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="195" y1="52" x2="225" y2="68" stroke="#ef4444" strokeWidth="2" />
              <line x1="225" y1="52" x2="195" y2="68" stroke="#ef4444" strokeWidth="2" />
              <rect x="30" y="135" width="360" height="52" rx="6" fill="#fff7ed" stroke="#f59e0b" strokeWidth="1" />
              <text x="210" y="153" textAnchor="middle" fontSize="10" fontWeight="600" fill="#92400e">Parent &ldquo;01&rdquo; has data, but leaf &ldquo;0102&rdquo; is NOT covered</text>
              <text x="210" y="168" textAnchor="middle" fontSize="9" fill="#78716c">Each leaf resolves through its own code &mdash; no downward inheritance</text>
              <text x="210" y="181" textAnchor="middle" fontSize="9" fill="#78716c">Reachability = 2 / 3 = 67% (parent&rsquo;s match is irrelevant)</text>
            </svg>

            <h4 className="cm-edge-heading">Ancestor Code Inheritance</h4>
            <p className="cm-metric-desc">
              Some databases (e.g., ecoinvent) only have entries at a <strong>broader code level</strong> (e.g., CPC &ldquo;011&rdquo;) rather than the
              leaf&rsquo;s exact code (e.g., &ldquo;0111&rdquo;). The matrix uses <strong>prefix matching</strong>: the leaf tries progressively shorter
              prefixes of its own code until it finds a database entry. This is the leaf resolving <em>itself</em>, not a parent pushing data down.
            </p>
            <svg className="cm-tree-diagram" viewBox="0 0 420 210" aria-label="Ancestor code inheritance">
              <text x="330" y="14" textAnchor="middle" fontSize="9" fontWeight="600" fill="#6b7280">ECOINVENT DATABASE</text>
              <rect x="290" y="25" width="80" height="24" rx="5" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
              <text x="330" y="41" textAnchor="middle" fontSize="8" fontWeight="600" fill="#1e40af">CPC &ldquo;011&rdquo;</text>
              <text x="330" y="62" fontSize="7" fill="#6b7280" textAnchor="middle">(3-digit group)</text>
              <text x="100" y="14" textAnchor="middle" fontSize="9" fontWeight="600" fill="#6b7280">TAXONOMY TREE</text>
              <circle cx="100" cy="35" r="10" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1.5" />
              <text x="100" y="39" textAnchor="middle" fontSize="8" fill="#6b7280">01</text>
              <line x1="100" y1="45" x2="100" y2="65" stroke="#d1d5db" strokeWidth="1.5" />
              <circle cx="100" cy="75" r="10" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1.5" />
              <text x="100" y="79" textAnchor="middle" fontSize="8" fill="#6b7280">011</text>
              <line x1="93" y1="85" x2="60" y2="115" stroke="#d1d5db" strokeWidth="1.5" />
              <line x1="107" y1="85" x2="140" y2="115" stroke="#d1d5db" strokeWidth="1.5" />
              <circle cx="60" cy="125" r="12" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
              <text x="60" y="129" textAnchor="middle" fontSize="7" fontWeight="700" fill="#16a34a">0111</text>
              <circle cx="140" cy="125" r="12" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
              <text x="140" y="129" textAnchor="middle" fontSize="7" fontWeight="700" fill="#16a34a">0112</text>
              <path d="M 72 122 Q 200 80 288 37" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="4,3" markerEnd="url(#arrowGreen)" />
              <path d="M 152 122 Q 200 110 288 40" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="4,3" markerEnd="url(#arrowGreen)" />
              <defs>
                <marker id="arrowGreen" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto"><polygon points="0 0, 6 2, 0 4" fill="#22c55e" /></marker>
              </defs>
              <text x="210" y="95" textAnchor="middle" fontSize="7" fill="#16a34a" fontWeight="600">exact &ldquo;0111&rdquo; not found</text>
              <text x="210" y="106" textAnchor="middle" fontSize="7" fill="#16a34a">prefix &ldquo;011&rdquo; matches!</text>
              <rect x="30" y="148" width="360" height="52" rx="6" fill="#ecfdf5" stroke="#22c55e" strokeWidth="1" />
              <text x="210" y="166" textAnchor="middle" fontSize="10" fontWeight="600" fill="#065f46">Leaf &ldquo;0111&rdquo; covered via its prefix code &ldquo;011&rdquo;</text>
              <text x="210" y="181" textAnchor="middle" fontSize="9" fill="#6b7280">The leaf walks up its own code hierarchy to find data</text>
              <text x="210" y="194" textAnchor="middle" fontSize="9" fill="#6b7280">Both leaves are &ldquo;covered&rdquo; but share 1 record (low specificity)</text>
            </svg>

            <h4 className="cm-edge-heading">No Concordance Path</h4>
            <p className="cm-metric-desc">
              Some taxonomy-database combinations have no concordance chain at all. For example,
              <strong>ecoinvent</strong> has no NAICS mapping and <strong>UNSPSC</strong> has no ecoinvent path.
              These leaves can never be reached regardless of prefix matching.
            </p>
            <svg className="cm-tree-diagram" viewBox="0 0 420 160" aria-label="No concordance path">
              <text x="100" y="14" textAnchor="middle" fontSize="9" fontWeight="600" fill="#6b7280">NAICS LEAVES</text>
              <text x="330" y="14" textAnchor="middle" fontSize="9" fontWeight="600" fill="#6b7280">ECOINVENT</text>
              <circle cx="100" cy="42" r="10" fill="#fef2f2" stroke="#ef4444" strokeWidth="2" />
              <text x="60" y="46" textAnchor="end" fontSize="7" fill="#374151">111110</text>
              <circle cx="100" cy="72" r="10" fill="#fef2f2" stroke="#ef4444" strokeWidth="2" />
              <text x="60" y="76" textAnchor="end" fontSize="7" fill="#374151">111120</text>
              <circle cx="100" cy="102" r="10" fill="#fef2f2" stroke="#ef4444" strokeWidth="2" />
              <text x="60" y="106" textAnchor="end" fontSize="7" fill="#374151">111130</text>
              <rect x="280" y="50" width="100" height="30" rx="5" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1.5" />
              <text x="330" y="69" textAnchor="middle" fontSize="8" fill="#9ca3af">no NAICS index</text>
              <line x1="110" y1="72" x2="200" y2="65" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="190" y1="58" x2="210" y2="72" stroke="#ef4444" strokeWidth="2" />
              <line x1="210" y1="58" x2="190" y2="72" stroke="#ef4444" strokeWidth="2" />
              <rect x="30" y="122" width="360" height="28" rx="6" fill="#fef2f2" stroke="#ef4444" strokeWidth="1" />
              <text x="210" y="140" textAnchor="middle" fontSize="10" fontWeight="600" fill="#991b1b">Reachability = 0% &mdash; no concordance path exists</text>
            </svg>
          </details>
        </>)}

        {mode === "specificity" && (<>
          <div className="cm-equation-block">
            <span className="cm-equation-label">Specificity</span>
            <span className="cm-equation">=</span>
            <span className="cm-equation-frac">
              <span className="cm-frac-num">unique source-level data entries</span>
              <span className="cm-frac-den">covered leaves</span>
            </span>
          </div>
          <p className="cm-metric-desc">
            Among the leaves that matched, how many <em>distinct</em> database records back them. 100% means every covered leaf maps to its own unique record. Low values mean many leaves share the same broad sector or category.
          </p>
          <p className="cm-metric-note">
            <strong>Source-level data entry</strong> = the distinct record in each database that a leaf resolves to. Examples: an ecoinvent CPC/HS product code, a NAICS sector (EPA, USLCI), an EXIOBASE product category, or an HS-2 chapter (BAFU).
          </p>
          {/* Specificity diagram: 4 covered leaves mapping to 2 unique DB records */}
          <svg className="cm-tree-diagram" viewBox="0 0 340 170" aria-label="Specificity diagram">
            <text x="80" y="12" textAnchor="middle" fontSize="9" fontWeight="600" fill="#6b7280">TAXONOMY LEAVES</text>
            <text x="260" y="12" textAnchor="middle" fontSize="9" fontWeight="600" fill="#6b7280">DATABASE RECORDS</text>
            <circle cx="80" cy="40" r="10" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
            <text x="55" y="44" textAnchor="end" fontSize="8" fill="#374151">leaf A</text>
            <circle cx="80" cy="70" r="10" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
            <text x="55" y="74" textAnchor="end" fontSize="8" fill="#374151">leaf B</text>
            <circle cx="80" cy="100" r="10" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
            <text x="55" y="104" textAnchor="end" fontSize="8" fill="#374151">leaf C</text>
            <circle cx="80" cy="130" r="10" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
            <text x="55" y="134" textAnchor="end" fontSize="8" fill="#374151">leaf D</text>
            <rect x="240" y="45" width="50" height="22" rx="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
            <text x="265" y="60" textAnchor="middle" fontSize="8" fontWeight="600" fill="#1e40af">rec #1</text>
            <rect x="240" y="95" width="50" height="22" rx="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
            <text x="265" y="110" textAnchor="middle" fontSize="8" fontWeight="600" fill="#1e40af">rec #2</text>
            <line x1="90" y1="40" x2="238" y2="54" stroke="#9ca3af" strokeWidth="1" markerEnd="url(#arrowhead)" />
            <line x1="90" y1="70" x2="238" y2="56" stroke="#9ca3af" strokeWidth="1" markerEnd="url(#arrowhead)" />
            <line x1="90" y1="100" x2="238" y2="58" stroke="#9ca3af" strokeWidth="1" markerEnd="url(#arrowhead)" />
            <line x1="90" y1="130" x2="238" y2="106" stroke="#9ca3af" strokeWidth="1" markerEnd="url(#arrowhead)" />
            <defs><marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto"><polygon points="0 0, 6 2, 0 4" fill="#9ca3af" /></marker></defs>
            <text x="170" y="163" textAnchor="middle" fontSize="11" fontWeight="600" fill="#374151">Specificity = 2 unique / 4 covered = 50%</text>
          </svg>

          <details className="cm-edge-details">
            <summary className="cm-edge-summary">Edge Cases &amp; Examples</summary>

            <h4 className="cm-edge-heading">Coarse Database (HS-2 Chapter Level)</h4>
            <p className="cm-metric-desc">
              When a database like <strong>BAFU</strong> maps at the HS-2 chapter level, hundreds of leaf codes resolve to the same
              record. Reachability may be high, but specificity is very low &mdash; indicating the data is not granular.
            </p>
            <svg className="cm-tree-diagram" viewBox="0 0 420 185" aria-label="Coarse database specificity">
              <text x="100" y="14" textAnchor="middle" fontSize="9" fontWeight="600" fill="#6b7280">HS CHAPTER &ldquo;01&rdquo; LEAVES</text>
              <text x="330" y="14" textAnchor="middle" fontSize="9" fontWeight="600" fill="#6b7280">BAFU DATABASE</text>
              <circle cx="100" cy="38" r="10" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
              <text x="60" y="42" textAnchor="end" fontSize="7" fill="#374151">010121</text>
              <circle cx="100" cy="62" r="10" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
              <text x="60" y="66" textAnchor="end" fontSize="7" fill="#374151">010129</text>
              <circle cx="100" cy="86" r="10" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
              <text x="60" y="90" textAnchor="end" fontSize="7" fill="#374151">010221</text>
              <circle cx="100" cy="110" r="10" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
              <text x="60" y="114" textAnchor="end" fontSize="7" fill="#374151">010290</text>
              <text x="100" y="135" textAnchor="middle" fontSize="8" fill="#6b7280">... 50+ more</text>
              <rect x="290" y="62" width="80" height="26" rx="5" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
              <text x="330" y="79" textAnchor="middle" fontSize="8" fontWeight="600" fill="#92400e">ch. &ldquo;01&rdquo;</text>
              <line x1="110" y1="38" x2="288" y2="72" stroke="#9ca3af" strokeWidth="1" markerEnd="url(#arrowhead)" />
              <line x1="110" y1="62" x2="288" y2="74" stroke="#9ca3af" strokeWidth="1" markerEnd="url(#arrowhead)" />
              <line x1="110" y1="86" x2="288" y2="76" stroke="#9ca3af" strokeWidth="1" markerEnd="url(#arrowhead)" />
              <line x1="110" y1="110" x2="288" y2="78" stroke="#9ca3af" strokeWidth="1" markerEnd="url(#arrowhead)" />
              <rect x="30" y="148" width="360" height="28" rx="6" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1" />
              <text x="210" y="166" textAnchor="middle" fontSize="10" fontWeight="600" fill="#92400e">50+ leaves &rarr; 1 record = very low specificity (~2%)</text>
            </svg>

            <h4 className="cm-edge-heading">Granular Database (Product-Level)</h4>
            <p className="cm-metric-desc">
              When a database like <strong>ecoinvent</strong> maps at the product level, each covered leaf often resolves to its own
              unique CPC or HS code. This yields high specificity &mdash; the data is precise per product.
            </p>
            <svg className="cm-tree-diagram" viewBox="0 0 420 170" aria-label="Granular database specificity">
              <text x="100" y="14" textAnchor="middle" fontSize="9" fontWeight="600" fill="#6b7280">TAXONOMY LEAVES</text>
              <text x="330" y="14" textAnchor="middle" fontSize="9" fontWeight="600" fill="#6b7280">ECOINVENT RECORDS</text>
              <circle cx="100" cy="42" r="10" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
              <text x="60" y="46" textAnchor="end" fontSize="7" fill="#374151">01111</text>
              <circle cx="100" cy="72" r="10" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
              <text x="60" y="76" textAnchor="end" fontSize="7" fill="#374151">01112</text>
              <circle cx="100" cy="102" r="10" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
              <text x="60" y="106" textAnchor="end" fontSize="7" fill="#374151">01120</text>
              <rect x="290" y="30" width="80" height="22" rx="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
              <text x="330" y="45" textAnchor="middle" fontSize="7" fontWeight="600" fill="#1e40af">CPC 01111</text>
              <rect x="290" y="60" width="80" height="22" rx="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
              <text x="330" y="75" textAnchor="middle" fontSize="7" fontWeight="600" fill="#1e40af">CPC 01112</text>
              <rect x="290" y="90" width="80" height="22" rx="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
              <text x="330" y="105" textAnchor="middle" fontSize="7" fontWeight="600" fill="#1e40af">CPC 01120</text>
              <line x1="110" y1="42" x2="288" y2="41" stroke="#22c55e" strokeWidth="1.5" markerEnd="url(#arrowGreen2)" />
              <line x1="110" y1="72" x2="288" y2="71" stroke="#22c55e" strokeWidth="1.5" markerEnd="url(#arrowGreen2)" />
              <line x1="110" y1="102" x2="288" y2="101" stroke="#22c55e" strokeWidth="1.5" markerEnd="url(#arrowGreen2)" />
              <defs>
                <marker id="arrowGreen2" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto"><polygon points="0 0, 6 2, 0 4" fill="#22c55e" /></marker>
              </defs>
              <rect x="30" y="130" width="360" height="28" rx="6" fill="#ecfdf5" stroke="#22c55e" strokeWidth="1" />
              <text x="210" y="148" textAnchor="middle" fontSize="10" fontWeight="600" fill="#065f46">3 leaves &rarr; 3 unique records = 100% specificity</text>
            </svg>

            <h4 className="cm-edge-heading">Prefix Matching Reduces Specificity</h4>
            <p className="cm-metric-desc">
              When multiple leaves resolve to the <strong>same ancestor code</strong> via prefix matching,
              they all share one data record. Reachability is high, but specificity drops &mdash; revealing
              the database lacks granular data at the leaf level.
            </p>
            <svg className="cm-tree-diagram" viewBox="0 0 420 180" aria-label="Prefix matching reduces specificity">
              <text x="100" y="14" textAnchor="middle" fontSize="9" fontWeight="600" fill="#6b7280">TAXONOMY LEAVES</text>
              <text x="330" y="14" textAnchor="middle" fontSize="9" fontWeight="600" fill="#6b7280">ECOINVENT DATABASE</text>
              <circle cx="100" cy="40" r="10" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
              <text x="60" y="44" textAnchor="end" fontSize="7" fill="#374151">0111</text>
              <circle cx="100" cy="68" r="10" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
              <text x="60" y="72" textAnchor="end" fontSize="7" fill="#374151">0112</text>
              <circle cx="100" cy="96" r="10" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
              <text x="60" y="100" textAnchor="end" fontSize="7" fill="#374151">0113</text>
              <rect x="290" y="56" width="80" height="24" rx="5" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
              <text x="330" y="72" textAnchor="middle" fontSize="8" fontWeight="600" fill="#92400e">CPC &ldquo;011&rdquo;</text>
              <text x="330" y="95" fontSize="7" fill="#6b7280" textAnchor="middle">prefix match</text>
              <line x1="110" y1="40" x2="288" y2="64" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" markerEnd="url(#arrowAmber)" />
              <line x1="110" y1="68" x2="288" y2="68" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" markerEnd="url(#arrowAmber)" />
              <line x1="110" y1="96" x2="288" y2="72" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" markerEnd="url(#arrowAmber)" />
              <defs>
                <marker id="arrowAmber" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto"><polygon points="0 0, 6 2, 0 4" fill="#f59e0b" /></marker>
              </defs>
              <rect x="30" y="115" width="360" height="48" rx="6" fill="#fff7ed" stroke="#f59e0b" strokeWidth="1" />
              <text x="210" y="133" textAnchor="middle" fontSize="10" fontWeight="600" fill="#92400e">3 covered, 1 unique record = 33% specificity</text>
              <text x="210" y="150" textAnchor="middle" fontSize="9" fill="#78716c">All 3 leaves matched via prefix &ldquo;011&rdquo; &mdash; same data for all</text>
            </svg>
          </details>
        </>)}

        {mode === "leafCoverage" && (<>
          <div className="cm-equation-block">
            <span className="cm-equation-label">Leaf Coverage</span>
            <span className="cm-equation">=</span>
            <span className="cm-equation-frac">
              <span className="cm-frac-num">unique source-level data entries</span>
              <span className="cm-frac-den">total leaves</span>
            </span>
          </div>
          <p className="cm-metric-desc">
            How many distinct database records exist relative to <em>all</em> leaf nodes. Combines breadth and granularity &mdash; a database scores high only if it covers many leaves <strong>and</strong> provides unique data for each.
          </p>
          <p className="cm-metric-note">
            Leaf Coverage = Reachability &times; Specificity. It penalizes both gaps (uncovered leaves) and coarseness (many leaves sharing one record).
          </p>
          <svg className="cm-tree-diagram" viewBox="0 0 340 170" aria-label="Leaf Coverage diagram">
            <text x="80" y="12" textAnchor="middle" fontSize="9" fontWeight="600" fill="#6b7280">ALL LEAVES</text>
            <text x="260" y="12" textAnchor="middle" fontSize="9" fontWeight="600" fill="#6b7280">DATABASE RECORDS</text>
            <circle cx="80" cy="35" r="10" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
            <text x="55" y="39" textAnchor="end" fontSize="8" fill="#374151">leaf A</text>
            <circle cx="80" cy="62" r="10" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
            <text x="55" y="66" textAnchor="end" fontSize="8" fill="#374151">leaf B</text>
            <circle cx="80" cy="89" r="10" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
            <text x="55" y="93" textAnchor="end" fontSize="8" fill="#374151">leaf C</text>
            <circle cx="80" cy="116" r="10" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
            <text x="55" y="120" textAnchor="end" fontSize="8" fill="#374151">leaf D</text>
            <circle cx="80" cy="143" r="10" fill="#fef2f2" stroke="#ef4444" strokeWidth="2" />
            <text x="55" y="147" textAnchor="end" fontSize="8" fill="#9ca3af">leaf E</text>
            <rect x="240" y="38" width="50" height="22" rx="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
            <text x="265" y="53" textAnchor="middle" fontSize="8" fontWeight="600" fill="#1e40af">rec #1</text>
            <rect x="240" y="88" width="50" height="22" rx="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
            <text x="265" y="103" textAnchor="middle" fontSize="8" fontWeight="600" fill="#1e40af">rec #2</text>
            <line x1="90" y1="35" x2="238" y2="47" stroke="#9ca3af" strokeWidth="1" markerEnd="url(#arrowhead)" />
            <line x1="90" y1="62" x2="238" y2="49" stroke="#9ca3af" strokeWidth="1" markerEnd="url(#arrowhead)" />
            <line x1="90" y1="89" x2="238" y2="51" stroke="#9ca3af" strokeWidth="1" markerEnd="url(#arrowhead)" />
            <line x1="90" y1="116" x2="238" y2="99" stroke="#9ca3af" strokeWidth="1" markerEnd="url(#arrowhead)" />
            <line x1="90" y1="143" x2="130" y2="143" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" />
            <text x="138" y="147" fontSize="8" fill="#ef4444">no match</text>
            <text x="170" y="167" textAnchor="middle" fontSize="11" fontWeight="600" fill="#374151">Leaf Coverage = 2 unique / 5 total = 40%</text>
          </svg>

          <details className="cm-edge-details">
            <summary className="cm-edge-summary">Edge Cases &amp; Examples</summary>

            <h4 className="cm-edge-heading">High Reachability, Low Leaf Coverage</h4>
            <p className="cm-metric-desc">
              A database can &ldquo;reach&rdquo; many leaves but provide the <strong>same data point</strong> for all of them.
              Reachability looks great, but Leaf Coverage reveals the true data granularity is poor.
            </p>
            <svg className="cm-tree-diagram" viewBox="0 0 420 195" aria-label="High reach low leaf coverage">
              <text x="100" y="14" textAnchor="middle" fontSize="9" fontWeight="600" fill="#6b7280">ALL 5 LEAVES</text>
              <text x="330" y="14" textAnchor="middle" fontSize="9" fontWeight="600" fill="#6b7280">DATABASE</text>
              <circle cx="100" cy="35" r="10" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
              <text x="60" y="39" textAnchor="end" fontSize="7" fill="#374151">leaf A</text>
              <circle cx="100" cy="58" r="10" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
              <text x="60" y="62" textAnchor="end" fontSize="7" fill="#374151">leaf B</text>
              <circle cx="100" cy="81" r="10" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
              <text x="60" y="85" textAnchor="end" fontSize="7" fill="#374151">leaf C</text>
              <circle cx="100" cy="104" r="10" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
              <text x="60" y="108" textAnchor="end" fontSize="7" fill="#374151">leaf D</text>
              <circle cx="100" cy="127" r="10" fill="#fef2f2" stroke="#ef4444" strokeWidth="2" />
              <text x="60" y="131" textAnchor="end" fontSize="7" fill="#9ca3af">leaf E</text>
              <rect x="290" y="62" width="80" height="26" rx="5" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
              <text x="330" y="79" textAnchor="middle" fontSize="8" fontWeight="600" fill="#92400e">1 record</text>
              <line x1="110" y1="35" x2="288" y2="72" stroke="#9ca3af" strokeWidth="1" markerEnd="url(#arrowhead)" />
              <line x1="110" y1="58" x2="288" y2="74" stroke="#9ca3af" strokeWidth="1" markerEnd="url(#arrowhead)" />
              <line x1="110" y1="81" x2="288" y2="75" stroke="#9ca3af" strokeWidth="1" markerEnd="url(#arrowhead)" />
              <line x1="110" y1="104" x2="288" y2="77" stroke="#9ca3af" strokeWidth="1" markerEnd="url(#arrowhead)" />
              <line x1="110" y1="127" x2="150" y2="127" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" />
              <text x="158" y="131" fontSize="7" fill="#ef4444">no match</text>
              <rect x="30" y="148" width="360" height="40" rx="6" fill="#fff7ed" stroke="#f59e0b" strokeWidth="1" />
              <text x="210" y="162" textAnchor="middle" fontSize="9" fontWeight="600" fill="#92400e">Reachability = 4/5 = 80% &mdash; but Leaf Coverage = 1/5 = 20%</text>
              <text x="210" y="177" textAnchor="middle" fontSize="8" fill="#78716c">4 leaves share 1 record &mdash; all get the same data point</text>
            </svg>

            <h4 className="cm-edge-heading">Comparing Two Databases</h4>
            <p className="cm-metric-desc">
              Leaf Coverage is the best single metric for comparing databases. A database with lower reachability but
              higher specificity can have <strong>better</strong> Leaf Coverage than one that reaches more leaves with coarse data.
            </p>
            <svg className="cm-tree-diagram" viewBox="0 0 420 200" aria-label="Comparing databases via leaf coverage">
              <text x="210" y="14" textAnchor="middle" fontSize="9" fontWeight="600" fill="#6b7280">SAME 4 TAXONOMY LEAVES</text>
              {/* DB A: coarse, 4/4 reached, 1 unique */}
              <text x="105" y="35" textAnchor="middle" fontSize="9" fontWeight="600" fill="#92400e">Database A (coarse)</text>
              <circle cx="50" cy="58" r="8" fill="#dcfce7" stroke="#22c55e" strokeWidth="1.5" />
              <circle cx="80" cy="58" r="8" fill="#dcfce7" stroke="#22c55e" strokeWidth="1.5" />
              <circle cx="110" cy="58" r="8" fill="#dcfce7" stroke="#22c55e" strokeWidth="1.5" />
              <circle cx="140" cy="58" r="8" fill="#dcfce7" stroke="#22c55e" strokeWidth="1.5" />
              <rect x="70" y="80" width="60" height="20" rx="4" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1" />
              <text x="100" y="93" textAnchor="middle" fontSize="7" fontWeight="600" fill="#92400e">1 record</text>
              <line x1="50" y1="66" x2="82" y2="80" stroke="#9ca3af" strokeWidth="0.8" />
              <line x1="80" y1="66" x2="92" y2="80" stroke="#9ca3af" strokeWidth="0.8" />
              <line x1="110" y1="66" x2="102" y2="80" stroke="#9ca3af" strokeWidth="0.8" />
              <line x1="140" y1="66" x2="118" y2="80" stroke="#9ca3af" strokeWidth="0.8" />
              <text x="105" y="118" textAnchor="middle" fontSize="9" fill="#92400e">Reach 100% &middot; Spec 25% &middot; <tspan fontWeight="700">LC 25%</tspan></text>
              {/* DB B: granular, 3/4 reached, 3 unique */}
              <text x="315" y="35" textAnchor="middle" fontSize="9" fontWeight="600" fill="#065f46">Database B (granular)</text>
              <circle cx="260" cy="58" r="8" fill="#dcfce7" stroke="#22c55e" strokeWidth="1.5" />
              <circle cx="290" cy="58" r="8" fill="#dcfce7" stroke="#22c55e" strokeWidth="1.5" />
              <circle cx="320" cy="58" r="8" fill="#dcfce7" stroke="#22c55e" strokeWidth="1.5" />
              <circle cx="350" cy="58" r="8" fill="#fef2f2" stroke="#ef4444" strokeWidth="1.5" />
              <rect x="245" y="80" width="40" height="18" rx="3" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1" />
              <text x="265" y="92" textAnchor="middle" fontSize="6" fontWeight="600" fill="#1e40af">rec 1</text>
              <rect x="290" y="80" width="40" height="18" rx="3" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1" />
              <text x="310" y="92" textAnchor="middle" fontSize="6" fontWeight="600" fill="#1e40af">rec 2</text>
              <rect x="335" y="80" width="40" height="18" rx="3" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1" />
              <text x="355" y="92" textAnchor="middle" fontSize="6" fontWeight="600" fill="#1e40af">rec 3</text>
              <line x1="260" y1="66" x2="265" y2="80" stroke="#22c55e" strokeWidth="0.8" />
              <line x1="290" y1="66" x2="310" y2="80" stroke="#22c55e" strokeWidth="0.8" />
              <line x1="320" y1="66" x2="355" y2="80" stroke="#22c55e" strokeWidth="0.8" />
              <text x="315" y="118" textAnchor="middle" fontSize="9" fill="#065f46">Reach 75% &middot; Spec 100% &middot; <tspan fontWeight="700">LC 75%</tspan></text>
              {/* Winner box */}
              <rect x="30" y="135" width="360" height="52" rx="6" fill="#ecfdf5" stroke="#22c55e" strokeWidth="1" />
              <text x="210" y="153" textAnchor="middle" fontSize="10" fontWeight="600" fill="#065f46">Database B wins on Leaf Coverage (75% vs 25%)</text>
              <text x="210" y="168" textAnchor="middle" fontSize="9" fill="#78716c">Lower reach but much higher granularity &mdash; more useful data</text>
              <text x="210" y="181" textAnchor="middle" fontSize="9" fill="#78716c">Leaf Coverage captures both dimensions in a single metric</text>
            </svg>

            <h4 className="cm-edge-heading">Parent Entry Does Not Affect Leaf Coverage</h4>
            <p className="cm-metric-desc">
              Just like Reachability, Leaf Coverage only counts leaf nodes. A parent having a database entry
              does <strong>not</strong> add to the unique record count for its children &mdash; only the leaf&rsquo;s own resolved record counts.
            </p>
            <svg className="cm-tree-diagram" viewBox="0 0 420 180" aria-label="Parent does not affect leaf coverage">
              <circle cx="210" cy="25" r="13" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
              <text x="210" y="29" textAnchor="middle" fontSize="8" fontWeight="700" fill="#92400e">01</text>
              <text x="258" y="20" fontSize="7" fill="#92400e">has DB entry</text>
              <text x="258" y="31" fontSize="7" fill="#92400e">(doesn&rsquo;t count)</text>
              <line x1="200" y1="38" x2="130" y2="68" stroke="#d1d5db" strokeWidth="1.5" />
              <line x1="220" y1="38" x2="290" y2="68" stroke="#d1d5db" strokeWidth="1.5" />
              <circle cx="130" cy="78" r="11" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
              <text x="130" y="82" textAnchor="middle" fontSize="7" fontWeight="700" fill="#16a34a">0101</text>
              <circle cx="290" cy="78" r="11" fill="#fef2f2" stroke="#ef4444" strokeWidth="2" />
              <text x="290" y="82" textAnchor="middle" fontSize="7" fontWeight="700" fill="#ef4444">0102</text>
              <text x="130" y="102" textAnchor="middle" fontSize="7" fill="#16a34a">resolves to rec #1</text>
              <text x="290" y="102" textAnchor="middle" fontSize="7" fill="#ef4444">no match</text>
              <rect x="30" y="118" width="360" height="50" rx="6" fill="#f9fafb" stroke="#d1d5db" strokeWidth="1" />
              <text x="210" y="136" textAnchor="middle" fontSize="10" fontWeight="600" fill="#374151">Leaf Coverage = 1 unique / 2 total = 50%</text>
              <text x="210" y="151" textAnchor="middle" fontSize="9" fill="#78716c">Parent &ldquo;01&rdquo; has data but is not a leaf &mdash; excluded from the metric</text>
              <text x="210" y="164" textAnchor="middle" fontSize="9" fill="#78716c">Only leaf &ldquo;0101&rdquo;&rsquo;s own resolved record is counted</text>
            </svg>
          </details>
        </>)}
      </div>

      <div className="cm-mode-toggle">
        <button className={`cm-mode-btn ${mode === "coverage" ? "cm-mode-active" : ""}`} onClick={() => setMode("coverage")}>
          Reachability
        </button>
        <button className={`cm-mode-btn ${mode === "specificity" ? "cm-mode-active" : ""}`} onClick={() => setMode("specificity")}>
          Specificity
        </button>
        <button className={`cm-mode-btn ${mode === "leafCoverage" ? "cm-mode-active" : ""}`} onClick={() => setMode("leafCoverage")}>
          Leaf Coverage
        </button>
      </div>

      <div className="coverage-matrix-wrapper">
        <table className="coverage-matrix">
          <thead>
            <tr>
              <th className="cm-tax-header">Taxonomy</th>
              <th className="cm-leaf-header">Nodes</th>
              <th className="cm-leaf-header">Leaves</th>
              {DB_COLUMNS.map(db => (
                <th key={db.key} className="cm-db-header">{db.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TAXONOMY_GROUPS.map(group => (
              <Fragment key={group.group}>
                <tr className="cm-group-row">
                  <td colSpan={3 + DB_COLUMNS.length}>{group.group}</td>
                </tr>
                {group.items.map(item => {
                  const row = matrix[item.key];
                  if (!row) return null;
                  return (
                    <tr key={item.key} className="cm-data-row">
                      <td className="cm-tax-name">{item.label}</td>
                      <td className="cm-leaf-count">{row.totalNodes.toLocaleString()}</td>
                      <td className="cm-leaf-count">{row.leafCount.toLocaleString()}</td>
                      {DB_COLUMNS.map(db => {
                        const cell = row.cells[db.key];
                        if (!cell) return <td key={db.key} className="cm-cell" />;
                        if (mode === "coverage") {
                          return (
                            <td
                              key={db.key}
                              className="cm-cell"
                              style={{ backgroundColor: heatColor(cell.pct) }}
                              title={`${item.label} \u00d7 ${db.label}: ${cell.covered.toLocaleString()} / ${cell.total.toLocaleString()} leaves (${cell.pct.toFixed(1)}%)`}
                            >
                              <div className="cm-pct">{cell.pct < 0.05 ? "0%" : `${cell.pct.toFixed(1)}%`}</div>
                              <div className="cm-count">{cell.covered.toLocaleString()} / {cell.total.toLocaleString()}</div>
                            </td>
                          );
                        }
                        if (mode === "specificity") {
                          const sp = cell.specificPct;
                          return (
                            <td
                              key={db.key}
                              className="cm-cell"
                              style={{ backgroundColor: cell.covered === 0 ? "#f8fafc" : specificityColor(sp) }}
                              title={`${item.label} \u00d7 ${db.label}: ${cell.uniqueKeys.toLocaleString()} unique entries / ${cell.covered.toLocaleString()} covered leaves (${sp.toFixed(1)}% specificity)`}
                            >
                              <div className="cm-pct">{cell.covered === 0 ? "n/a" : `${sp.toFixed(1)}%`}</div>
                              <div className="cm-count">{cell.uniqueKeys.toLocaleString()} / {cell.covered.toLocaleString()}</div>
                            </td>
                          );
                        }
                        // Leaf Coverage mode: unique keys / total leaves
                        const dp = cell.total > 0 ? (cell.uniqueKeys / cell.total) * 100 : 0;
                        return (
                          <td
                            key={db.key}
                            className="cm-cell"
                            style={{ backgroundColor: cell.uniqueKeys === 0 ? "#f8fafc" : leafCoverageColor(dp) }}
                            title={`${item.label} \u00d7 ${db.label}: ${cell.uniqueKeys.toLocaleString()} unique entries / ${cell.total.toLocaleString()} total leaves (${dp.toFixed(1)}% leaf coverage)`}
                          >
                            <div className="cm-pct">{cell.uniqueKeys === 0 ? "0%" : `${dp.toFixed(1)}%`}</div>
                            <div className="cm-count">{cell.uniqueKeys.toLocaleString()} / {cell.total.toLocaleString()}</div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cm-legend">
        <span className="cm-legend-label">0%</span>
        <div className={mode === "coverage" ? "cm-gradient" : mode === "specificity" ? "cm-gradient-blue" : "cm-gradient-purple"} />
        <span className="cm-legend-label">100%</span>
      </div>

      <div className="about-details" style={{ marginTop: 16 }}>
        <h4>Notes</h4>
        <ul style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.6, paddingLeft: 20 }}>
          <li><strong>Leaf nodes</strong> are the most specific codes in each hierarchy (no children).</li>
          {mode === "coverage" && (
            <>
              <li><strong>ecoinvent</strong> is checked via direct CPC/HS/ISIC code mapping (with parent-code inheritance).</li>
              <li><strong>EPA/USEEIO</strong> and <strong>US LCI</strong> are checked at HS-6 resolution (via NAICS concordance).</li>
              <li><strong>EXIOBASE</strong> uses precise HS-6/CPA concordance tables; <strong>BAFU</strong> is checked at HS-2 chapter level.</li>
              <li><strong>UNSPSC</strong> uses fuzzy text matching (~4.4% of codes have HS mappings).</li>
              <li><strong>ISIC/NACE</strong> resolve through CPC (ISIC&rarr;CPC concordance), then CPC&rarr;HS.</li>
            </>
          )}
          {mode === "specificity" && (
            <>
              <li><strong>Specificity</strong> = unique source data entries / covered leaves. 100% means every covered leaf has its own distinct data entry.</li>
              <li><strong>ecoinvent</strong>: source key is the matched CPC/HS/ISIC code (product-level).</li>
              <li><strong>EPA/USEEIO</strong> and <strong>US LCI</strong>: source key is the underlying NAICS sector (~400 and ~59 sectors respectively). Multiple HS-6 codes share the same sector factor.</li>
              <li><strong>EXIOBASE</strong>: source key is the EXIOBASE product category (~190 categories). Many HS codes map to the same category.</li>
              <li><strong>BAFU</strong>: source key is the HS-2 chapter (~81 chapters). Very coarse &mdash; each chapter covers hundreds of leaf codes.</li>
            </>
          )}
          {mode === "leafCoverage" && (
            <>
              <li><strong>Leaf Coverage</strong> = unique source-level data entries / total leaves. Shows what fraction of the taxonomy gets a distinct data point.</li>
              <li>Leaf Coverage combines coverage breadth with data granularity &mdash; a database scores high only if it both covers many leaves <em>and</em> provides distinct data for them.</li>
              <li>Compare with <strong>Reachability</strong> (how many leaves match anything) and <strong>Specificity</strong> (how unique the data is among matched leaves).</li>
            </>
          )}
        </ul>
      </div>
    </>
  );
}

/* =============================== LCA Data Browser Tab =============================== */

type LcaDb = "ecoinvent" | "epa" | "exiobase" | "uslci" | "bafu";
const LCA_DB_OPTIONS: { key: LcaDb; label: string; color: string }[] = [
  { key: "ecoinvent", label: "ecoinvent v3.12", color: "#b45309" },
  { key: "epa", label: "EPA / USEEIO v2.1", color: "#15803d" },
  { key: "exiobase", label: "EXIOBASE 3.8.2", color: "#6d28d9" },
  { key: "uslci", label: "US LCI (NREL)", color: "#0369a1" },
  { key: "bafu", label: "BAFU:2025", color: "#be123c" },
];

// Multi-word search: every whitespace-separated term must appear somewhere in the text
function matchesSearch(terms: string[], ...fields: string[]): boolean {
  if (terms.length === 0) return true;
  const joined = fields.join(" ").toLowerCase();
  return terms.every(t => joined.includes(t));
}

const PAGE_SIZE = 200;

function LcaDataBrowserTab({ data }: { data: AppData | null }) {
  const [db, setDb] = useState<LcaDb>("ecoinvent");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const searchTerms = useMemo(() => search.toLowerCase().split(/\s+/).filter(Boolean), [search]);

  const rows = useMemo(() => {
    if (!data) return [];

    if (db === "ecoinvent" && data.ecoinventMapping) {
      const em = data.ecoinventMapping;
      const out: { code: string; system: string; products: string[]; count: number; type: string; isAncestor: boolean }[] = [];
      for (const [code, info] of Object.entries(em.cpc)) {
        out.push({ code, system: "CPC", products: info.products, count: info.count, type: info.mappingType, isAncestor: em.cpcAncestors.includes(code) });
      }
      for (const [code, info] of Object.entries(em.hs)) {
        out.push({ code, system: "HS", products: info.products, count: info.count, type: info.mappingType, isAncestor: em.hsAncestors.includes(code) });
      }
      for (const [code, info] of Object.entries(em.isic)) {
        out.push({ code, system: "ISIC", products: info.products, count: info.count, type: info.mappingType, isAncestor: em.isicAncestors.includes(code) });
      }
      if (searchTerms.length) {
        return out.filter(r => matchesSearch(searchTerms, r.code, r.system, ...r.products));
      }
      return out;
    }

    if (db === "epa" && data.emissionFactors) {
      const out: { hs: string; naics: string; desc: string; factor: number; production: number; margins: number; unit: string }[] = [];
      for (const [hs, entry] of Object.entries(data.emissionFactors)) {
        out.push({ hs, naics: entry.naicsCode, desc: entry.naicsDescription, factor: entry.factor, production: entry.factorWithoutMargins, margins: entry.margins, unit: entry.unit });
      }
      if (searchTerms.length) {
        return out.filter(r => matchesSearch(searchTerms, r.hs, r.naics, r.desc));
      }
      return out;
    }

    if (db === "exiobase") {
      // Merge concordance product data with chapter-level emission factors
      const ec = data.exiobaseConcordance;
      const ef = data.exiobaseFactors;

      if (ec) {
        // hsToExio etc. map taxonomy codes → product CODES (e.g., "p01.l")
        // ec.products maps product code → product name
        // Build reverse: product CODE → taxonomy codes
        const prodHsCodes = new Map<string, string[]>();
        const prodCpaCodes = new Map<string, string[]>();
        const prodIsicCodes = new Map<string, string[]>();
        const prodNaceCodes = new Map<string, string[]>();
        for (const [code, prodCodes] of Object.entries(ec.hsToExio)) {
          for (const pc of prodCodes) { const l = prodHsCodes.get(pc) ?? []; l.push(code); prodHsCodes.set(pc, l); }
        }
        for (const [code, prodCodes] of Object.entries(ec.cpaToExio)) {
          for (const pc of prodCodes) { const l = prodCpaCodes.get(pc) ?? []; l.push(code); prodCpaCodes.set(pc, l); }
        }
        for (const [code, prodCodes] of Object.entries(ec.isicToExio)) {
          for (const pc of prodCodes) { const l = prodIsicCodes.get(pc) ?? []; l.push(code); prodIsicCodes.set(pc, l); }
        }
        for (const [code, prodCodes] of Object.entries(ec.naceToExio)) {
          for (const pc of prodCodes) { const l = prodNaceCodes.get(pc) ?? []; l.push(code); prodNaceCodes.set(pc, l); }
        }
        // Iterate by product code, resolve to name
        const uniqueCodes = [...new Set(Object.keys(ec.products))].sort();
        const out: { product: string; hsCodes: string[]; cpaCodes: string[]; isicCodes: string[]; naceCodes: string[]; factor: number | null; unit: string }[] = [];
        for (const pc of uniqueCodes) {
          const name = ec.products[pc] ?? pc;
          const hsCodes = prodHsCodes.get(pc) ?? [];
          let factor: number | null = null;
          let unit = "";
          if (ef) {
            for (const hs of hsCodes) {
              const ch = hs.substring(0, 2);
              if (ef[ch]) { factor = ef[ch].factor; unit = ef[ch].unit; break; }
            }
          }
          out.push({
            product: `${name} (${pc})`,
            hsCodes,
            cpaCodes: prodCpaCodes.get(pc) ?? [],
            isicCodes: prodIsicCodes.get(pc) ?? [],
            naceCodes: prodNaceCodes.get(pc) ?? [],
            factor,
            unit,
          });
        }
        if (searchTerms.length) {
          return out.filter(r => matchesSearch(searchTerms,
            r.product,
            ...r.hsCodes, ...r.cpaCodes, ...r.isicCodes, ...r.naceCodes,
          ));
        }
        return out;
      }

      // Fallback: show chapter-level factors only
      if (ef) {
        const out: { product: string; hsCodes: string[]; cpaCodes: string[]; isicCodes: string[]; naceCodes: string[]; factor: number | null; unit: string }[] = [];
        for (const [ch, entry] of Object.entries(ef)) {
          out.push({
            product: entry.sectors.join("; "),
            hsCodes: [ch],
            cpaCodes: [],
            isicCodes: [],
            naceCodes: [],
            factor: entry.factor,
            unit: entry.unit,
          });
        }
        if (searchTerms.length) {
          return out.filter(r => matchesSearch(searchTerms, r.product, ...r.hsCodes));
        }
        return out;
      }
      return [];
    }

    if (db === "uslci" && data.uslciCoverage) {
      const out: { hs: string; naics: string; processes: number; withGhg: number; processDetails: { name: string; ghg: number; unit: string }[] }[] = [];
      for (const [hs, entry] of Object.entries(data.uslciCoverage.coverage)) {
        out.push({
          hs,
          naics: entry.naicsCodes.join(", "),
          processes: entry.processCount,
          withGhg: entry.withGhgData,
          processDetails: entry.topProcesses,
        });
      }
      if (searchTerms.length) {
        return out.filter(r => matchesSearch(searchTerms, r.hs, r.naics, ...r.processDetails.map(p => p.name)));
      }
      return out;
    }

    if (db === "bafu" && data.bafuCoverage) {
      const out: { chapter: string; processes: number; withGhg: number; unitSummary: string; processDetails: { name: string; ghg: number; unit: string }[] }[] = [];
      for (const [ch, entry] of Object.entries(data.bafuCoverage.coverage)) {
        // Build unit summary with ranges
        const unitParts: string[] = [];
        for (const [unit, stats] of Object.entries(entry.unitStats)) {
          unitParts.push(`${unit}: ${stats.count} (${stats.min.toFixed(4)}\u2013${stats.max.toFixed(4)})`);
        }
        out.push({
          chapter: ch,
          processes: entry.processCount,
          withGhg: entry.withGhgData,
          unitSummary: unitParts.join("; "),
          processDetails: entry.topProcesses,
        });
      }
      if (searchTerms.length) {
        return out.filter(r => matchesSearch(searchTerms, r.chapter, r.unitSummary, ...r.processDetails.map(p => p.name)));
      }
      return out;
    }

    return [];
  }, [data, db, searchTerms]);

  const dbInfo = LCA_DB_OPTIONS.find(d => d.key === db)!;

  return (
    <>
      <p className="about-intro">
        Browse the raw entries in each LCA database. Select a database and use the search box to filter.
      </p>

      <div className="lca-browser-controls">
        <div className="lca-browser-tabs">
          {LCA_DB_OPTIONS.map(opt => (
            <button
              key={opt.key}
              className={`lca-db-tab ${db === opt.key ? "active" : ""}`}
              style={db === opt.key ? { backgroundColor: opt.color, color: "#fff", borderColor: opt.color } : {}}
              onClick={() => { setDb(opt.key); setSearch(""); setVisibleCount(PAGE_SIZE); }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="lca-browser-search">
          <input
            type="text"
            placeholder={`Search ${dbInfo.label}...`}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
            className="lca-search-input"
          />
          <span className="lca-result-count">{rows.length.toLocaleString()} entries</span>
        </div>
      </div>

      {/* Stats summary bar */}
      <div className="lca-stats-bar">
        {db === "ecoinvent" && data?.ecoinventMapping && (
          <>{data.ecoinventMapping.stats.totalProducts.toLocaleString()} products &middot; {data.ecoinventMapping.stats.uniqueCpcCodes} CPC &middot; {data.ecoinventMapping.stats.uniqueHsCodes} HS &middot; {data.ecoinventMapping.stats.uniqueIsicCodes} ISIC codes</>
        )}
        {db === "epa" && <>EPA Supply Chain GHG Emission Factors v1.3 &middot; kg CO2e / 2022 USD</>}
        {db === "exiobase" && data?.exiobaseConcordance && (
          <>{data.exiobaseConcordance.stats.uniqueExioProducts} products &middot; {data.exiobaseConcordance.stats.hsCodesMatched} HS &middot; {data.exiobaseConcordance.stats.cpaCodesMatched} CPA &middot; {data.exiobaseConcordance.stats.isicCodesMatched} ISIC &middot; {data.exiobaseConcordance.stats.naceCodesMatched} NACE codes</>
        )}
        {db === "uslci" && data?.uslciCoverage && (
          <>{data.uslciCoverage.stats.totalProcesses.toLocaleString()} processes &middot; {data.uslciCoverage.stats.totalWithGhg} w/ GHG &middot; {data.uslciCoverage.stats.uniqueNaicsCodes} NAICS &middot; {data.uslciCoverage.stats.coveredHs6Codes.toLocaleString()} HS-6 codes</>
        )}
        {db === "bafu" && data?.bafuCoverage && (
          <>{data.bafuCoverage.stats.totalProcesses.toLocaleString()} total processes &middot; {data.bafuCoverage.stats.mappedProcesses.toLocaleString()} mapped &middot; {data.bafuCoverage.stats.mappedWithGhg.toLocaleString()} w/ GHG &middot; {data.bafuCoverage.stats.coveredHsChapters} HS chapters</>
        )}
      </div>

      <div className="lca-browser-table-wrapper">
        {db === "ecoinvent" && (
          <table className="lca-browser-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>System</th>
                <th>Count</th>
                <th>Mapping</th>
                <th>Ancestor</th>
                <th>Products</th>
              </tr>
            </thead>
            <tbody>
              {(rows as { code: string; system: string; products: string[]; count: number; type: string; isAncestor: boolean }[]).slice(0, visibleCount).map((r, i) => (
                <tr key={i}>
                  <td className="lca-code">{r.code}</td>
                  <td><span className="lca-system-badge" style={{ backgroundColor: r.system === "CPC" ? "#0891b2" : r.system === "HS" ? "#4f46e5" : "#0c4a6e" }}>{r.system}</span></td>
                  <td className="lca-num">{r.count}</td>
                  <td><span className={`lca-mapping-badge ${r.type === "1:1" ? "lca-m-one" : "lca-m-many"}`}>{r.type}</span></td>
                  <td className="lca-num">{r.isAncestor && <span className="conc-partial-badge">ancestor</span>}</td>
                  <td className="lca-products">{r.products.join("; ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {db === "epa" && (
          <table className="lca-browser-table">
            <thead>
              <tr>
                <th>HS-6</th>
                <th>NAICS</th>
                <th>NAICS Description</th>
                <th>Total Factor</th>
                <th>Production</th>
                <th>Margins</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody>
              {(rows as { hs: string; naics: string; desc: string; factor: number; production: number; margins: number; unit: string }[]).slice(0, visibleCount).map((r, i) => (
                <tr key={i}>
                  <td className="lca-code">{r.hs}</td>
                  <td className="lca-code">{r.naics}</td>
                  <td>{r.desc}</td>
                  <td className="lca-num">{r.factor.toFixed(3)}</td>
                  <td className="lca-num">{r.production.toFixed(3)}</td>
                  <td className="lca-num">{r.margins.toFixed(3)}</td>
                  <td className="lca-unit">{r.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {db === "exiobase" && (
          <table className="lca-browser-table">
            <thead>
              <tr>
                <th>EXIOBASE Product</th>
                <th>Factor</th>
                <th>HS Codes</th>
                <th>CPA Codes</th>
                <th>ISIC Codes</th>
                <th>NACE Codes</th>
              </tr>
            </thead>
            <tbody>
              {(rows as { product: string; hsCodes: string[]; cpaCodes: string[]; isicCodes: string[]; naceCodes: string[]; factor: number | null; unit: string }[]).slice(0, visibleCount).map((r, i) => (
                <tr key={i}>
                  <td className="lca-products">{r.product}</td>
                  <td className="lca-num" title={r.unit}>{r.factor !== null ? r.factor.toFixed(3) : <span className="lca-none">&mdash;</span>}</td>
                  <td className="lca-code-list">{r.hsCodes.length > 0 ? r.hsCodes.join(", ") : <span className="lca-none">&mdash;</span>}</td>
                  <td className="lca-code-list">{r.cpaCodes.length > 0 ? r.cpaCodes.join(", ") : <span className="lca-none">&mdash;</span>}</td>
                  <td className="lca-code-list">{r.isicCodes.length > 0 ? r.isicCodes.join(", ") : <span className="lca-none">&mdash;</span>}</td>
                  <td className="lca-code-list">{r.naceCodes.length > 0 ? r.naceCodes.join(", ") : <span className="lca-none">&mdash;</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {db === "uslci" && (
          <table className="lca-browser-table">
            <thead>
              <tr>
                <th>HS-6</th>
                <th>NAICS</th>
                <th title="Total LCI processes mapped to this HS-6 code">Processes</th>
                <th title="Processes that have GHG emission data (direct process emissions, GWP-100 AR6)">w/ GHG</th>
                <th title="Process names with GHG values in parentheses where available (kg CO2e per functional unit)">Process Details</th>
              </tr>
            </thead>
            <tbody>
              {(rows as { hs: string; naics: string; processes: number; withGhg: number; processDetails: { name: string; ghg: number; unit: string }[] }[]).slice(0, visibleCount).map((r, i) => (
                <tr key={i}>
                  <td className="lca-code">{r.hs}</td>
                  <td className="lca-code">{r.naics}</td>
                  <td className="lca-num">{r.processes}</td>
                  <td className="lca-num">{r.withGhg}</td>
                  <td className="lca-products">{r.processDetails.map(p =>
                    p.ghg > 0 ? `${p.name} (${p.ghg.toFixed(4)} ${p.unit})` : p.name
                  ).join("; ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {db === "bafu" && (
          <table className="lca-browser-table">
            <thead>
              <tr>
                <th>HS Ch.</th>
                <th title="Total LCI processes mapped to this HS-2 chapter">Processes</th>
                <th title="Processes that have GHG emission data (direct process emissions, GWP-100 AR6)">w/ GHG</th>
                <th title="Reference units with count and value ranges (min-max)">Unit Ranges</th>
                <th title="Process names with GHG values in parentheses where available (kg CO2e per functional unit)">Process Details</th>
              </tr>
            </thead>
            <tbody>
              {(rows as { chapter: string; processes: number; withGhg: number; unitSummary: string; processDetails: { name: string; ghg: number; unit: string }[] }[]).slice(0, visibleCount).map((r, i) => (
                <tr key={i}>
                  <td className="lca-code">{r.chapter}</td>
                  <td className="lca-num">{r.processes}</td>
                  <td className="lca-num">{r.withGhg}</td>
                  <td className="lca-unit" title={r.unitSummary}>{r.unitSummary}</td>
                  <td className="lca-products">{r.processDetails.map(p =>
                    p.ghg > 0 ? `${p.name} (${p.ghg.toFixed(4)} ${p.unit})` : p.name
                  ).join("; ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {rows.length > visibleCount && (
          <div className="lca-load-more-wrap">
            <span className="lca-load-more-info">Showing {visibleCount.toLocaleString()} of {rows.length.toLocaleString()} entries</span>
            <button className="lca-load-more-btn" onClick={() => setVisibleCount(v => v + PAGE_SIZE)}>
              Load {Math.min(PAGE_SIZE, rows.length - visibleCount).toLocaleString()} more
            </button>
            <button className="lca-load-more-btn lca-load-all" onClick={() => setVisibleCount(rows.length)}>
              Show all
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* =============================== Concordance Browser Tab =============================== */

type ConcordanceId = "cpcHs" | "naicsHs" | "isicCpc" | "cpaHs" | "beaHs" | "beaNaics" | "unspscHs" | "exioHs" | "exioCpa" | "exioIsic" | "exioNace";

const CONCORDANCE_OPTIONS: { key: ConcordanceId; label: string; from: string; to: string; color: string }[] = [
  { key: "cpcHs",    label: "CPC \u2194 HS",      from: "CPC",    to: "HS",     color: "#0891b2" },
  { key: "naicsHs",  label: "NAICS \u2192 HS",     from: "NAICS",  to: "HS",     color: "#7c3aed" },
  { key: "isicCpc",  label: "ISIC \u2192 CPC",     from: "ISIC",   to: "CPC",    color: "#0c4a6e" },
  { key: "cpaHs",    label: "CPA \u2192 HS",       from: "CPA",    to: "HS",     color: "#b45309" },
  { key: "beaHs",    label: "BEA \u2192 HS",       from: "BEA",    to: "HS",     color: "#be123c" },
  { key: "beaNaics", label: "BEA \u2192 NAICS",    from: "BEA",    to: "NAICS",  color: "#9f1239" },
  { key: "unspscHs", label: "UNSPSC \u2192 HS",    from: "UNSPSC", to: "HS",     color: "#6b7280" },
  { key: "exioHs",   label: "HS \u2192 EXIOBASE",  from: "HS",     to: "EXIO",   color: "#059669" },
  { key: "exioCpa",  label: "CPA \u2192 EXIOBASE", from: "CPA",    to: "EXIO",   color: "#047857" },
  { key: "exioIsic", label: "ISIC \u2192 EXIOBASE",from: "ISIC",   to: "EXIO",   color: "#065f46" },
  { key: "exioNace", label: "NACE \u2192 EXIOBASE",from: "NACE",   to: "EXIO",   color: "#064e3b" },
];

function ConcordanceBrowserTab({ data }: { data: AppData | null }) {
  const [conc, setConc] = useState<ConcordanceId>("cpcHs");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const searchTerms = useMemo(() => search.toLowerCase().split(/\s+/).filter(Boolean), [search]);

  const rows = useMemo(() => {
    if (!data) return [];

    if (conc === "cpcHs" && data.concordance) {
      const out: { from: string; to: string; partial: string }[] = [];
      for (const [cpc, mappings] of Object.entries(data.concordance.cpcToHs)) {
        for (const m of mappings) {
          out.push({ from: cpc, to: m.code, partial: m.hsPartial || m.cpcPartial ? "partial" : "" });
        }
      }
      if (searchTerms.length) return out.filter(r => matchesSearch(searchTerms, r.from, r.to, r.partial));
      return out;
    }

    if (conc === "unspscHs" && data.unspscHsMapping) {
      const out: { from: string; to: string; similarity: string }[] = [];
      for (const [unspsc, mappings] of Object.entries(data.unspscHsMapping.unspscToHs)) {
        for (const m of mappings) {
          out.push({ from: unspsc, to: m.code, similarity: (m.similarity * 100).toFixed(1) + "%" });
        }
      }
      if (searchTerms.length) return out.filter(r => matchesSearch(searchTerms, r.from, r.to));
      return out;
    }

    // EXIOBASE concordances
    if (conc === "exioHs" && data.exiobaseConcordance) {
      const out: { from: string; to: string }[] = [];
      for (const [hs, prods] of Object.entries(data.exiobaseConcordance.hsToExio)) {
        for (const p of prods) out.push({ from: hs, to: p });
      }
      if (searchTerms.length) return out.filter(r => matchesSearch(searchTerms, r.from, r.to));
      return out;
    }
    if (conc === "exioCpa" && data.exiobaseConcordance) {
      const out: { from: string; to: string }[] = [];
      for (const [cpa, prods] of Object.entries(data.exiobaseConcordance.cpaToExio)) {
        for (const p of prods) out.push({ from: cpa, to: p });
      }
      if (searchTerms.length) return out.filter(r => matchesSearch(searchTerms, r.from, r.to));
      return out;
    }
    if (conc === "exioIsic" && data.exiobaseConcordance) {
      const out: { from: string; to: string }[] = [];
      for (const [isic, prods] of Object.entries(data.exiobaseConcordance.isicToExio)) {
        for (const p of prods) out.push({ from: isic, to: p });
      }
      if (searchTerms.length) return out.filter(r => matchesSearch(searchTerms, r.from, r.to));
      return out;
    }
    if (conc === "exioNace" && data.exiobaseConcordance) {
      const out: { from: string; to: string }[] = [];
      for (const [nace, prods] of Object.entries(data.exiobaseConcordance.naceToExio)) {
        for (const p of prods) out.push({ from: nace, to: p });
      }
      if (searchTerms.length) return out.filter(r => matchesSearch(searchTerms, r.from, r.to));
      return out;
    }

    // GenericConcordance types
    const gcMap: Record<string, GenericConcordance | null> = {
      naicsHs: data.naicsHsConcordance,
      isicCpc: data.isicCpcConcordance,
      cpaHs: data.cpaHsConcordance,
      beaHs: data.beaHsConcordance,
      beaNaics: data.beaNaicsConcordance,
    };
    const gc = gcMap[conc];
    if (gc) {
      const out: { from: string; to: string; partial: string }[] = [];
      for (const [code, mappings] of Object.entries(gc.forward)) {
        for (const m of mappings) {
          out.push({ from: code, to: m.code, partial: m.partial ? "partial" : "" });
        }
      }
      if (searchTerms.length) return out.filter(r => matchesSearch(searchTerms, r.from, r.to, r.partial));
      return out;
    }

    return [];
  }, [data, conc, searchTerms]);

  const concMeta = CONCORDANCE_OPTIONS.find(c => c.key === conc)!;
  const hasPartial = conc === "cpcHs" || conc === "naicsHs" || conc === "isicCpc" || conc === "cpaHs" || conc === "beaHs" || conc === "beaNaics";
  const hasSimilarity = conc === "unspscHs";

  return (
    <>
      <div className="lca-browser-controls">
        <div className="lca-db-tabs">
          {CONCORDANCE_OPTIONS.map(c => (
            <button
              key={c.key}
              className={`lca-db-tab ${conc === c.key ? "lca-db-active" : ""}`}
              style={conc === c.key ? { backgroundColor: c.color, borderColor: c.color } : {}}
              onClick={() => { setConc(c.key); setSearch(""); setVisibleCount(PAGE_SIZE); }}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <input
            type="text"
            placeholder="Search codes..."
            value={search}
            onChange={e => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
            className="lca-search-input"
          />
          <span className="lca-result-count">{rows.length.toLocaleString()} mappings</span>
        </div>
      </div>

      <div className="lca-browser-table-wrapper">
        <table className="lca-browser-table">
          <thead>
            <tr>
              <th>{concMeta.from} Code</th>
              <th>{concMeta.to} Code</th>
              {hasPartial && <th>Partial</th>}
              {hasSimilarity && <th>Similarity</th>}
            </tr>
          </thead>
          <tbody>
            {(rows as any[]).slice(0, visibleCount).map((r, i) => (
              <tr key={i}>
                <td className="lca-code">{r.from}</td>
                <td className="lca-code">{r.to}</td>
                {hasPartial && <td className="lca-num">{r.partial && <span className="conc-partial-badge">partial</span>}</td>}
                {hasSimilarity && <td className="lca-num">{r.similarity}</td>}
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length > visibleCount && (
          <div className="lca-load-more-wrap">
            <span className="lca-load-more-info">Showing {visibleCount.toLocaleString()} of {rows.length.toLocaleString()} mappings</span>
            <button className="lca-load-more-btn" onClick={() => setVisibleCount(v => v + PAGE_SIZE)}>
              Load {Math.min(PAGE_SIZE, rows.length - visibleCount).toLocaleString()} more
            </button>
            <button className="lca-load-more-btn lca-load-all" onClick={() => setVisibleCount(rows.length)}>
              Show all
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* =============================== Build Info =============================== */

declare const __BUILD_HASH__: string;
declare const __BUILD_DATE__: string;

const BUILD_ID = `${typeof __BUILD_DATE__ !== "undefined" ? __BUILD_DATE__ : "dev"}-${typeof __BUILD_HASH__ !== "undefined" ? __BUILD_HASH__ : "local"}`;

function reportBugUrl() {
  const subject = encodeURIComponent(`[Bug] Taxonomy Explorer (build ${BUILD_ID})`);
  const body = encodeURIComponent(
    `Build: ${BUILD_ID}\n` +
    `URL: ${window.location.href}\n` +
    `Browser: ${navigator.userAgent}\n\n` +
    `--- Describe the bug below ---\n\n\n\n` +
    `--- Please attach screenshots if applicable ---\n`
  );
  return `mailto:agrabowski5@gmail.com?subject=${subject}&body=${body}`;
}

/* =============================== Main Component =============================== */

export const AboutSection = forwardRef<AboutSectionHandle, { data: AppData | null }>(function AboutSection({ data }, ref) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"taxonomies" | "lca" | "methods" | "matrix" | "browser" | "concordances">("taxonomies");

  useImperativeHandle(ref, () => ({
    openToTab(t) { setTab(t); setOpen(true); },
  }));

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
          <h2>Data Sources &amp; Connections</h2>
          <div className="about-header-actions">
            <a
              className="report-bug-btn"
              href={reportBugUrl()}
              title={`Report a bug (build ${BUILD_ID})`}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                <path fillRule="evenodd" d="M6.56 1.14a.75.75 0 01.177 1.045A3.987 3.987 0 006 4h8a3.987 3.987 0 00-.737-2.315.75.75 0 111.222-.87c.58.816.965 1.777 1.07 2.81.49.18.905.502 1.195.925a.75.75 0 01-1.248.832A.75.75 0 0015 5H5a.75.75 0 00-.502.192.75.75 0 01-1.248-.832c.29-.423.705-.745 1.195-.925a5.487 5.487 0 011.07-2.81.75.75 0 011.045-.177zM4.75 7a.75.75 0 01.75.75v.508c0 .891-.356 1.746-.988 2.375l-.063.063v2.054c0 2.329 1.886 4.25 4.301 4.25h2.5c2.415 0 4.301-1.921 4.301-4.25v-2.054l-.063-.063A3.353 3.353 0 0114.5 8.258V7.75a.75.75 0 011.5 0v.508c0 1.29.516 2.527 1.433 3.439l.067.067v.986c0 3.129-2.527 5.75-5.75 5.75h-2.5c-3.223 0-5.75-2.621-5.75-5.75v-.986l.067-.067A4.853 4.853 0 005 8.258V7.75A.75.75 0 014.75 7z" clipRule="evenodd" />
              </svg>
              Report Bug
            </a>
            <span className="build-label">build {BUILD_ID}</span>
          </div>
          <button className="about-close" onClick={() => setOpen(false)}>&times;</button>
        </div>

        <div className="about-body">
          <div className="about-tabs">
            <button
              className={`about-tab ${tab === "taxonomies" ? "active" : ""}`}
              onClick={() => setTab("taxonomies")}
            >
              Taxonomy Map
            </button>
            <button
              className={`about-tab ${tab === "lca" ? "active" : ""}`}
              onClick={() => setTab("lca")}
            >
              LCA Databases
            </button>
            <button
              className={`about-tab ${tab === "methods" ? "active" : ""}`}
              onClick={() => setTab("methods")}
            >
              Resolution Methods
            </button>
            <button
              className={`about-tab ${tab === "matrix" ? "active" : ""}`}
              onClick={() => setTab("matrix")}
            >
              Coverage Matrix
            </button>
            <button
              className={`about-tab ${tab === "browser" ? "active" : ""}`}
              onClick={() => setTab("browser")}
            >
              LCA Data Browser
            </button>
            <button
              className={`about-tab ${tab === "concordances" ? "active" : ""}`}
              onClick={() => setTab("concordances")}
            >
              Concordance Browser
            </button>
          </div>

          {tab === "taxonomies" && <TaxonomyMapTab />}
          {tab === "lca" && <LcaDatabasesTab />}
          {tab === "methods" && <ResolutionMethodsTab />}
          {tab === "matrix" && <CoverageMatrixTab data={data} />}
          {tab === "browser" && <LcaDataBrowserTab data={data} />}
          {tab === "concordances" && <ConcordanceBrowserTab data={data} />}
        </div>
      </div>
    </div>
  );
});

