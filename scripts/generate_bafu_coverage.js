const AdmZip = require('../app/node_modules/adm-zip');
const path = require('path');
const fs = require('fs');

// BAFU top-level category → HS 2-digit chapter mapping
// Only categories that correspond to traded goods are mapped.
// Categories like electricity, heat, waste management, water, energy supply
// are services/utilities and don't map to HS goods chapters.
const CATEGORY_TO_HS_CHAPTERS = {
  'agricultural': ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24'],
  'food industry': ['16','17','18','19','20','21','22'],
  'chemicals': ['28','29','30','31','32','33','34','35','36','37','38'],
  'metals': ['72','73','74','75','76','78','79','80','81','82','83'],
  'plastics': ['39','40'],
  'wood': ['44','45','46','47','48','49'],
  'paper+ board': ['48','49'],
  'construction materials': ['25','68','69','70'],
  'construction': ['25','68','69','70','73','76'],
  'building components': ['70','73','76'],
  'building processes': ['73','76'],
  'glass': ['70'],
  'ceramics': ['69'],
  'minerals': ['25','26','71'],
  'textiles': ['50','51','52','53','54','55','56','57','58','59','60','61','62','63'],
  'electronics': ['84','85'],
  'computers & network': ['84','85'],
  'computers &amp; network': ['84','85'],
  'transport systems': ['86','87','88','89'],
  'fuels': ['27'],
  'oil': ['27'],
  'natural gas': ['27'],
  'photovoltaic': ['85'],
  'wind power': ['85'],
  'insulation materials': ['68'],
  'flooring': ['44','68'],
  'private consumption': ['84','85'],
  'mechanical': ['84'],
  'compressed air': ['84'],
};

// GWP-100 values (IPCC AR6)
const GWP = {
  'carbon dioxide, fossil': 1,
  'carbon dioxide, land transformation': 1,
  'methane, fossil': 29.8,
  'methane, biogenic': 27.2,
  'dinitrogen monoxide': 273,
};

const zipPath = path.join(__dirname, '..', 'BAFU-2025 ecospold1.zip');
const zip = new AdmZip(zipPath);
const entries = zip.getEntries().filter(e => e.entryName.endsWith('.xml'));

console.log('Processing', entries.length, 'XML files...');

// Per-HS-chapter data: { processCount, processes: [{name, ghg, unit}] }
const hsChapterData = {};
const unmappedCategories = {};
let totalMapped = 0;
let totalUnmapped = 0;
let totalWithGhg = 0;

for (const entry of entries) {
  const content = entry.getData().toString('utf8');

  // Extract reference function attributes
  const refMatch = content.match(/<referenceFunction\s([^>]+)\/>/);
  if (!refMatch) continue;
  const refAttrs = refMatch[1];
  const refName = (refAttrs.match(/\bname="([^"]*)"/) || [])[1] || '';
  const refUnit = (refAttrs.match(/\bunit="([^"]*)"/) || [])[1] || '';
  const refCat = (refAttrs.match(/\bcategory="([^"]*)"/) || [])[1] || '';

  const topCategory = refCat.toLowerCase();
  const hsChapters = CATEGORY_TO_HS_CHAPTERS[topCategory];

  if (!hsChapters) {
    totalUnmapped++;
    unmappedCategories[topCategory] = (unmappedCategories[topCategory] || 0) + 1;
    continue;
  }

  totalMapped++;

  // Extract GHG emissions from exchange blocks (outputGroup=4, category="emissions to air")
  const exchangeBlocks = content.match(/<exchange\s[\s\S]*?<\/exchange>/g) || [];
  let totalCO2e = 0;

  for (const block of exchangeBlocks) {
    if (!/<outputGroup>4<\/outputGroup>/.test(block)) continue;
    const cat = (block.match(/\bcategory="([^"]*)"/) || [])[1] || '';
    if (!cat.toLowerCase().includes('emissions to air')) continue;

    const name = (block.match(/\bname="([^"]*)"/) || [])[1] || '';
    const value = parseFloat((block.match(/\bmeanValue="([^"]*)"/) || [])[1] || '0');
    if (isNaN(value) || value <= 0) continue;

    const nameLower = name.toLowerCase();
    for (const [ghgName, gwp] of Object.entries(GWP)) {
      if (nameLower.includes(ghgName)) {
        totalCO2e += value * gwp;
        break;
      }
    }
  }

  for (const ch of hsChapters) {
    if (!hsChapterData[ch]) {
      hsChapterData[ch] = { processCount: 0, processes: [] };
    }
    hsChapterData[ch].processCount++;
    if (totalCO2e > 0) {
      hsChapterData[ch].processes.push({
        name: refName,
        ghg: totalCO2e,
        unit: refUnit,
      });
    }
  }

  if (totalCO2e > 0) totalWithGhg++;
}

console.log('Mapped processes:', totalMapped);
console.log('With GHG data:', totalWithGhg);
console.log('Unmapped processes:', totalUnmapped, '(services/energy/waste - expected)');
console.log('HS chapters covered:', Object.keys(hsChapterData).length);

console.log('\nHS chapter coverage:');
for (const [ch, data] of Object.entries(hsChapterData).sort()) {
  const withGhg = data.processes.length;
  console.log('  HS', ch, ':', data.processCount, 'processes,', withGhg, 'with GHG data');
}

console.log('\nUnmapped categories (top 15):');
const unmappedSorted = Object.entries(unmappedCategories).sort((a,b) => b[1] - a[1]);
for (const [cat, count] of unmappedSorted.slice(0, 15)) {
  console.log('  ', count, cat);
}

// Build output: for each chapter, keep top 10 processes by GHG (sorted descending)
// and compute summary stats grouped by reference unit
const coverage = {};
for (const [ch, data] of Object.entries(hsChapterData)) {
  const procs = data.processes;

  // Group by unit and compute stats
  const byUnit = {};
  for (const p of procs) {
    if (!byUnit[p.unit]) byUnit[p.unit] = [];
    byUnit[p.unit].push(p.ghg);
  }

  const unitStats = {};
  for (const [unit, values] of Object.entries(byUnit)) {
    values.sort((a, b) => a - b);
    const sum = values.reduce((s, v) => s + v, 0);
    unitStats[unit] = {
      count: values.length,
      min: values[0],
      max: values[values.length - 1],
      avg: sum / values.length,
      median: values[Math.floor(values.length / 2)],
    };
  }

  // Top 10 processes by GHG (descending)
  procs.sort((a, b) => b.ghg - a.ghg);
  const topProcesses = procs.slice(0, 10).map(p => ({
    name: p.name.replace(/\s*\{[^}]*\}\s*/g, '').trim(), // strip location tags like {CH}
    ghg: Math.round(p.ghg * 1e6) / 1e6, // 6 decimal places
    unit: p.unit,
  }));

  coverage[ch] = {
    processCount: data.processCount,
    withGhgData: procs.length,
    unitStats,
    topProcesses,
  };
}

const output = {
  coverage,
  stats: {
    totalProcesses: entries.length,
    mappedProcesses: totalMapped,
    mappedWithGhg: totalWithGhg,
    unmappedProcesses: totalUnmapped,
    coveredHsChapters: Object.keys(coverage).length,
    source: 'BAFU:2025 Swiss Federal LCI Database (ESU-services/FOEN)',
    note: 'GHG values are DIRECT process emissions only (not full supply chain). Uses GWP-100 from IPCC AR6.',
  },
};

const outPath = path.join(__dirname, '..', 'app', 'public', 'data', 'bafu-coverage.json');
fs.writeFileSync(outPath, JSON.stringify(output));
console.log('\nWrote bafu-coverage.json:', fs.statSync(outPath).size, 'bytes');
