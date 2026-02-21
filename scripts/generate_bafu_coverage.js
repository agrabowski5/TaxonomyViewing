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

const zipPath = path.join(__dirname, '..', 'BAFU-2025 ecospold1.zip');
const zip = new AdmZip(zipPath);
const entries = zip.getEntries().filter(e => e.entryName.endsWith('.xml'));

console.log('Processing', entries.length, 'XML files...');

// Extract categories and count processes per HS chapter
const hsChapterProcesses = {};
const unmappedCategories = {};
let totalMapped = 0;
let totalUnmapped = 0;

for (const entry of entries) {
  const content = entry.getData().toString('utf8');
  const catMatch = content.match(/category="([^"]+)"/);
  if (catMatch === null) continue;

  const topCategory = catMatch[1].toLowerCase();
  const hsChapters = CATEGORY_TO_HS_CHAPTERS[topCategory];

  if (hsChapters) {
    totalMapped++;
    for (const ch of hsChapters) {
      hsChapterProcesses[ch] = (hsChapterProcesses[ch] || 0) + 1;
    }
  } else {
    totalUnmapped++;
    unmappedCategories[topCategory] = (unmappedCategories[topCategory] || 0) + 1;
  }
}

console.log('Mapped processes:', totalMapped);
console.log('Unmapped processes:', totalUnmapped, '(services/energy/waste - expected)');
console.log('HS chapters covered:', Object.keys(hsChapterProcesses).length);

console.log('\nHS chapter coverage:');
for (const [ch, count] of Object.entries(hsChapterProcesses).sort()) {
  console.log('  HS', ch, ':', count, 'processes');
}

console.log('\nUnmapped categories (top 15):');
const unmappedSorted = Object.entries(unmappedCategories).sort((a,b) => b[1] - a[1]);
for (const [cat, count] of unmappedSorted.slice(0, 15)) {
  console.log('  ', count, cat);
}

// Generate coverage JSON
const coverage = {};
for (const [ch, count] of Object.entries(hsChapterProcesses)) {
  coverage[ch] = { processCount: count };
}

const output = {
  coverage,
  stats: {
    totalProcesses: entries.length,
    mappedProcesses: totalMapped,
    unmappedProcesses: totalUnmapped,
    coveredHsChapters: Object.keys(coverage).length,
    source: 'BAFU:2025 Swiss Federal LCI Database (ESU-services/FOEN)',
  },
};

const outPath = path.join(__dirname, '..', 'app', 'public', 'data', 'bafu-coverage.json');
fs.writeFileSync(outPath, JSON.stringify(output));
console.log('\nWrote bafu-coverage.json:', fs.statSync(outPath).size, 'bytes');
