import { useState, useMemo, Fragment } from "react";
import type { AppData, TreeNode, TaxonomyType } from "./types";

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

          {/* BEA <-> NAICS (Official concordance, green solid) */}
          <path d="M 165 274 Q 350 355 535 274" fill="none" stroke="#059669" strokeWidth="2">
            <title>{"BEA\u2194NAICS Concordance\n499 mappings · BEA.gov\nBEA I-O codes to NAICS 2017"}</title>
          </path>
          <text x="350" y="342" textAnchor="middle" className="about-edge-label" fill="#059669">499 BEA-NAICS mappings</text>

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
              <title>{"ecoinvent v3.10\n4,031 products · 660 CPC codes · 966 HS codes\nLife cycle inventory database\nClick to open data source"}</title>
              <rect x="35" y="185" width="130" height="52" rx="8" fill="#b45309" />
              <text x="100" y="207" textAnchor="middle" className="about-node-text-sm">ecoinvent</text>
              <text x="100" y="224" textAnchor="middle" style={{ fontSize: "8.5px", fill: "#fef3c7" }}>v3.10</text>
            </g>
          </a>
          <text x="100" y="253" textAnchor="middle" className="about-node-detail">4,031 products</text>
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
          <text x="450" y="253" textAnchor="middle" className="about-node-detail">Carbon intensity</text>
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
            <title>{"ecoinvent \u2192 CPC\nDirect code-level mapping\n660 CPC codes matched"}</title>
          </path>
          <text x="115" y="138" textAnchor="start" className="about-edge-label" fill="#059669">660 CPC codes</text>

          {/* ecoinvent -> HS (direct, green solid) */}
          <path d="M 140 185 Q 270 140 400 92" fill="none" stroke="#059669" strokeWidth="2.5">
            <title>{"ecoinvent \u2192 HS\nDirect code-level mapping\n966 HS codes matched"}</title>
          </path>
          <text x="255" y="128" textAnchor="middle" className="about-edge-label" fill="#059669">966 HS codes</text>

          {/* EPA -> NAICS (blue dashed, first hop) */}
          <path d="M 310 185 Q 500 120 695 93" fill="none" stroke="#2563eb" strokeWidth="2" strokeDasharray="7,4">
            <title>{"EPA/USEEIO \u2192 NAICS \u2192 HS\nTwo-hop via Census concordance\nResolution: HS-6 digit"}</title>
          </path>
          <text x="510" y="125" textAnchor="middle" className="about-edge-label" fill="#2563eb">NAICS {"\u2192"} HS-6</text>

          {/* EXIOBASE -> HS (green solid, code-level via concordance) */}
          <path d="M 450 185 Q 442 140 430 92" fill="none" stroke="#059669" strokeWidth="2.5">
            <title>{"EXIOBASE \u2192 HS\nPrecise concordance mapping (5,085 HS-6 codes)\nResolution: HS-6 / CPA via official concordance"}</title>
          </path>
          <text x="462" y="142" textAnchor="start" className="about-edge-label" fill="#059669">HS-6 / CPA</text>

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
          <text x="80" y="360" fontSize="9" fill="#6b7280">ecoinvent (individual product codes)</text>
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
              <td><strong>ecoinvent v3.10</strong></td>
              <td><span className="about-conc-badge official">Code-level</span></td>
              <td>660 CPC + 966 HS codes</td>
              <td>Product inventory (4,031 products)</td>
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
            <strong>ecoinvent v3.10</strong>
            <p>The most comprehensive LCI database. 4,031 products mapped directly to CPC and HS codes. Provides product-level inventory data for environmental assessment.</p>
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
    return { hsCodes: hs6.length >= 6 ? [hs6] : [], cpcCodes: [] };
  }

  // CPC: direct CPC + concordance to HS
  if (taxonomy === "cpc") {
    const hsMappings = data.concordance?.cpcToHs[clean];
    const hsCodes = hsMappings ? hsMappings.map(m => m.code) : [];
    return { hsCodes, cpcCodes: [clean] };
  }

  // UNSPSC: fuzzy mapping to HS
  if (taxonomy === "unspsc") {
    const mappings = data.unspscHsMapping?.unspscToHs[clean];
    const hsCodes = mappings ? mappings.map(m => m.code) : [];
    return { hsCodes, cpcCodes: [] };
  }

  // NAICS: concordance to HS
  if (taxonomy === "naics") {
    const mappings = data.naicsHsConcordance?.forward[clean];
    const hsCodes = mappings ? mappings.map(m => m.code) : [];
    return { hsCodes, cpcCodes: [] };
  }

  // ISIC/NACE: concordance to CPC, then CPC to HS
  if (taxonomy === "isic" || taxonomy === "nace") {
    const cpcMappings = data.isicCpcConcordance?.forward[clean];
    if (!cpcMappings) return { hsCodes: [], cpcCodes: [] };
    const cpcCodes = cpcMappings.map(m => m.code);
    const hsCodes: string[] = [];
    for (const cpc of cpcCodes) {
      const hs = data.concordance?.cpcToHs[cpc];
      if (hs) hsCodes.push(...hs.map(m => m.code));
    }
    return { hsCodes, cpcCodes };
  }

  // CPA: concordance to HS
  if (taxonomy === "cpa") {
    const mappings = data.cpaHsConcordance?.forward[clean];
    const hsCodes = mappings ? mappings.map(m => m.code) : [];
    return { hsCodes, cpcCodes: [] };
  }

  // BEA: concordance to HS
  if (taxonomy === "bea") {
    const mappings = data.beaHsConcordance?.forward[clean];
    const hsCodes = mappings ? mappings.map(m => m.code) : [];
    return { hsCodes, cpcCodes: [] };
  }

  // T1: check origin from ID
  if (taxonomy === "t1") {
    if (node.id.startsWith("t1-svc-")) {
      const cpcCode = clean.startsWith("SVC") ? clean.substring(3) : clean;
      const hsMappings = data.concordance?.cpcToHs[cpcCode];
      const hsCodes = hsMappings ? hsMappings.map(m => m.code) : [];
      return { hsCodes, cpcCodes: [cpcCode] };
    } else {
      const hs6 = clean.substring(0, 6);
      return { hsCodes: hs6.length >= 6 ? [hs6] : [], cpcCodes: [] };
    }
  }

  // T2: check origin from ID
  if (taxonomy === "t2") {
    if (node.id.startsWith("t2-hts-")) {
      const htsCode = clean.startsWith("HTS") ? clean.substring(3) : clean;
      const hs6 = htsCode.substring(0, 6);
      return { hsCodes: hs6.length >= 6 ? [hs6] : [], cpcCodes: [] };
    } else {
      const hsMappings = data.concordance?.cpcToHs[clean];
      const hsCodes = hsMappings ? hsMappings.map(m => m.code) : [];
      return { hsCodes, cpcCodes: [clean] };
    }
  }

  return { hsCodes: [], cpcCodes: [] };
}

function isEcoinventCovered(resolved: ResolvedLeaf, data: AppData): boolean {
  if (!data.ecoinventMapping) return false;
  for (const cpc of resolved.cpcCodes) {
    if (data.ecoinventMapping.cpc[cpc]) return true;
    for (let len = cpc.length - 1; len >= 2; len--) {
      if (data.ecoinventMapping.cpc[cpc.substring(0, len)]) return true;
    }
  }
  for (const hs of resolved.hsCodes) {
    if (data.ecoinventMapping.hs[hs]) return true;
    for (let len = hs.length - 1; len >= 2; len--) {
      if (data.ecoinventMapping.hs[hs.substring(0, len)]) return true;
    }
  }
  return false;
}

function isEpaCovered(resolved: ResolvedLeaf, data: AppData): boolean {
  if (!data.emissionFactors) return false;
  for (const hs of resolved.hsCodes) {
    if (data.emissionFactors[hs]) return true;
  }
  return false;
}

function isExiobaseCovered(resolved: ResolvedLeaf, data: AppData): boolean {
  // Prefer precise concordance if available
  if (data.exiobaseConcordance) {
    const c = data.exiobaseConcordance;
    for (const hs of resolved.hsCodes) {
      if (c.hsToExio[hs]) return true;
      if (hs.length >= 4 && c.hsToExio[hs.substring(0, 4)]) return true;
    }
    for (const cpc of resolved.cpcCodes) {
      for (let len = cpc.length; len >= 2; len--) {
        if (c.cpaToExio[cpc.substring(0, len)]) return true;
      }
    }
    return false;
  }
  // Fallback: old HS-2 chapter logic
  if (!data.exiobaseFactors) return false;
  for (const hs of resolved.hsCodes) {
    if (data.exiobaseFactors[hs.substring(0, 2)]) return true;
  }
  return false;
}

function isUslciCovered(resolved: ResolvedLeaf, data: AppData): boolean {
  if (!data.uslciCoverage) return false;
  for (const hs of resolved.hsCodes) {
    if (data.uslciCoverage.coverage[hs]) return true;
  }
  return false;
}

function isBafuCovered(resolved: ResolvedLeaf, data: AppData): boolean {
  if (!data.bafuCoverage) return false;
  for (const hs of resolved.hsCodes) {
    if (data.bafuCoverage.coverage[hs.substring(0, 2)]) return true;
  }
  return false;
}

interface MatrixRow {
  leafCount: number;
  cells: Record<string, { covered: number; total: number; pct: number }>;
}

function computeMatrix(data: AppData): Record<string, MatrixRow> {
  const result: Record<string, MatrixRow> = {};

  const treeMap: Record<string, TreeNode[]> = {
    hs: data.hsTree, cn: data.cnTree, hts: data.htsTree, ca: data.caTree,
    cpc: data.cpcTree, cpa: data.cpaTree, unspsc: data.unspscTree,
    naics: data.naicsTree, isic: data.isicTree, nace: data.naceTree,
    bea: data.beaTree, t1: data.t1Tree, t2: data.t2Tree,
  };

  const dbChecks: [string, (r: ResolvedLeaf, d: AppData) => boolean][] = [
    ["ecoinvent", isEcoinventCovered],
    ["epa", isEpaCovered],
    ["exiobase", isExiobaseCovered],
    ["uslci", isUslciCovered],
    ["bafu", isBafuCovered],
  ];

  for (const [taxKey, tree] of Object.entries(treeMap)) {
    if (!tree || tree.length === 0) continue;

    const leaves = collectLeaves(tree);
    const counts: Record<string, number> = {};
    for (const [dbKey] of dbChecks) counts[dbKey] = 0;

    for (const leaf of leaves) {
      const resolved = resolveLeaf(leaf, taxKey as TaxonomyType, data);
      for (const [dbKey, checkFn] of dbChecks) {
        if (checkFn(resolved, data)) counts[dbKey]++;
      }
    }

    const cells: Record<string, { covered: number; total: number; pct: number }> = {};
    for (const [dbKey] of dbChecks) {
      cells[dbKey] = {
        covered: counts[dbKey],
        total: leaves.length,
        pct: leaves.length > 0 ? (counts[dbKey] / leaves.length) * 100 : 0,
      };
    }

    result[taxKey] = { leafCount: leaves.length, cells };
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

function CoverageMatrixTab({ data }: { data: AppData | null }) {
  const matrix = useMemo(() => {
    if (!data) return null;
    return computeMatrix(data);
  }, [data]);

  if (!matrix) {
    return <p style={{ textAlign: "center", padding: 32, color: "#6b7280" }}>Loading data&hellip;</p>;
  }

  return (
    <>
      <p className="about-intro">
        This matrix shows what percentage of each taxonomy&rsquo;s leaf nodes
        can be resolved to LCA data from each database, via the concordance
        chains described in the other tabs.
      </p>

      <div className="coverage-matrix-wrapper">
        <table className="coverage-matrix">
          <thead>
            <tr>
              <th className="cm-tax-header">Taxonomy</th>
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
                  <td colSpan={2 + DB_COLUMNS.length}>{group.group}</td>
                </tr>
                {group.items.map(item => {
                  const row = matrix[item.key];
                  if (!row) return null;
                  return (
                    <tr key={item.key} className="cm-data-row">
                      <td className="cm-tax-name">{item.label}</td>
                      <td className="cm-leaf-count">{row.leafCount.toLocaleString()}</td>
                      {DB_COLUMNS.map(db => {
                        const cell = row.cells[db.key];
                        if (!cell) return <td key={db.key} className="cm-cell" />;
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
        <div className="cm-gradient" />
        <span className="cm-legend-label">100%</span>
      </div>

      <div className="about-details" style={{ marginTop: 16 }}>
        <h4>Notes</h4>
        <ul style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.6, paddingLeft: 20 }}>
          <li><strong>Leaf nodes</strong> are the most specific codes in each hierarchy (no children).</li>
          <li><strong>ecoinvent</strong> is checked via direct CPC/HS code mapping (with parent-code inheritance).</li>
          <li><strong>EPA/USEEIO</strong> and <strong>US LCI</strong> are checked at HS-6 resolution (via NAICS concordance).</li>
          <li><strong>EXIOBASE</strong> uses precise HS-6/CPA concordance tables; <strong>BAFU</strong> is checked at HS-2 chapter level.</li>
          <li><strong>UNSPSC</strong> uses fuzzy text matching (~4.4% of codes have HS mappings).</li>
          <li><strong>ISIC/NACE</strong> resolve through CPC (ISIC&rarr;CPC concordance), then CPC&rarr;HS.</li>
        </ul>
      </div>
    </>
  );
}

/* =============================== Main Component =============================== */

export function AboutSection({ data }: { data: AppData | null }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"taxonomies" | "lca" | "matrix">("taxonomies");

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
              className={`about-tab ${tab === "matrix" ? "active" : ""}`}
              onClick={() => setTab("matrix")}
            >
              Coverage Matrix
            </button>
          </div>

          {tab === "taxonomies" && <TaxonomyMapTab />}
          {tab === "lca" && <LcaDatabasesTab />}
          {tab === "matrix" && <CoverageMatrixTab data={data} />}
        </div>
      </div>
    </div>
  );
}

/* =============================== Standalone Coverage Panel =============================== */

export function CoveragePanel({ data }: { data: AppData | null }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button className="coverage-toggle" onClick={() => setOpen(true)} title="Coverage Matrix">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="1" width="4" height="4" rx="0.5" opacity="0.3"/>
          <rect x="6" y="1" width="4" height="4" rx="0.5" opacity="0.6"/>
          <rect x="11" y="1" width="4" height="4" rx="0.5" opacity="0.9"/>
          <rect x="1" y="6" width="4" height="4" rx="0.5" opacity="0.5"/>
          <rect x="6" y="6" width="4" height="4" rx="0.5" opacity="0.8"/>
          <rect x="11" y="6" width="4" height="4" rx="0.5" opacity="0.4"/>
          <rect x="1" y="11" width="4" height="4" rx="0.5" opacity="0.7"/>
          <rect x="6" y="11" width="4" height="4" rx="0.5" opacity="0.3"/>
          <rect x="11" y="11" width="4" height="4" rx="0.5" opacity="0.6"/>
        </svg>
        Coverage
      </button>
    );
  }

  return (
    <div className="about-overlay" onClick={() => setOpen(false)}>
      <div className="about-panel" onClick={(e) => e.stopPropagation()}>
        <div className="about-header">
          <h2>LCA Coverage Matrix</h2>
          <button className="about-close" onClick={() => setOpen(false)}>&times;</button>
        </div>
        <div className="about-body">
          <CoverageMatrixTab data={data} />
        </div>
      </div>
    </div>
  );
}
