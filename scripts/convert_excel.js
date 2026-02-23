/**
 * Convert Excel files (xlsx/xls) to CSV for Python processing.
 * Run from the app directory where xlsx module is installed.
 */
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const RAW_DIR = path.join(__dirname, '..', 'raw-data');

// 1. NAICS 2022 (xlsx -> csv)
console.log('Converting NAICS 2022...');
const naicsWb = xlsx.readFile(path.join(RAW_DIR, 'naics-2022.xlsx'));
const naicsSheet = naicsWb.Sheets[naicsWb.SheetNames[0]];
const naicsData = xlsx.utils.sheet_to_json(naicsSheet, { header: 1 });
// Skip header row and empty rows, write clean CSV: code,title
const naicsLines = ['code,title'];
for (const row of naicsData) {
  const code = row[1];
  const title = row[2];
  if (code && title && typeof code !== 'string') {
    // code is numeric from xlsx
    naicsLines.push(`${code},"${String(title).trim().replace(/"/g, '""')}"`);
  } else if (code && title && /^\d+$/.test(String(code).trim())) {
    naicsLines.push(`${String(code).trim()},"${String(title).trim().replace(/"/g, '""')}"`);
  }
}
fs.writeFileSync(path.join(RAW_DIR, 'naics-2022-converted.csv'), naicsLines.join('\n'), 'utf8');
console.log(`  NAICS: ${naicsLines.length - 1} rows`);

// 2. BEA I-O codes (xlsx -> csv)
console.log('Converting BEA I-O codes...');
const beaWb = xlsx.readFile(path.join(RAW_DIR, 'bea-io-codes.xlsx'));
const beaSheet = beaWb.Sheets[beaWb.SheetNames[0]];
const beaData = xlsx.utils.sheet_to_json(beaSheet, { header: 1 });
// Row 4 is header: Sector,Description,Summary,Description,...
// Data starts at row 5
const beaLines = ['sector_code,sector_desc,summary_code,summary_desc,detail_code,detail_desc'];
for (let i = 5; i < beaData.length; i++) {
  const row = beaData[i];
  if (!row || !row[0]) continue;
  const sc = String(row[0] || '').trim();
  const sd = String(row[1] || '').trim().replace(/"/g, '""');
  const smc = String(row[2] || '').trim();
  const smd = String(row[3] || '').trim().replace(/"/g, '""');
  const dc = String(row[6] || '').trim();
  const dd = String(row[7] || '').trim().replace(/"/g, '""');
  if (sc && sc !== 'undefined') {
    beaLines.push(`"${sc}","${sd}","${smc}","${smd}","${dc}","${dd}"`);
  }
}
fs.writeFileSync(path.join(RAW_DIR, 'bea-io-codes-converted.csv'), beaLines.join('\n'), 'utf8');
console.log(`  BEA codes: ${beaLines.length - 1} rows`);

// 2b. BEA-NAICS concordance (from same xlsx, col 6=BEA detail, col 11=NAICS code)
console.log('Extracting BEA-NAICS concordance...');
const beaNaicsLines = ['bea_code,naics_code'];
const beaNaicsSeen = new Set();
for (let i = 5; i < beaData.length; i++) {
  const row = beaData[i];
  if (!row || !row[6] || !row[11]) continue;
  const beaCode = String(row[6]).trim();
  const naicsCode = String(row[11]).trim();
  if (!beaCode || !naicsCode || beaCode === 'undefined' || naicsCode === 'undefined') continue;
  const key = `${beaCode}|${naicsCode}`;
  if (beaNaicsSeen.has(key)) continue;
  beaNaicsSeen.add(key);
  beaNaicsLines.push(`"${beaCode}","${naicsCode}"`);
}
fs.writeFileSync(path.join(RAW_DIR, 'bea-naics-concordance.csv'), beaNaicsLines.join('\n'), 'utf8');
console.log(`  BEA-NAICS: ${beaNaicsLines.length - 1} rows`);

// 3. BEA-HS concordance (xls -> csv)
console.log('Converting BEA-HS concordance...');
const beaHsWb = xlsx.readFile(path.join(RAW_DIR, 'bea-hs-concordance.xls'));
const beaHsSheet = beaHsWb.Sheets['HSConcord'];
const beaHsData = xlsx.utils.sheet_to_json(beaHsSheet, { header: 1 });
// Row 2 is header: COMMODITY CODE, COMMODITY CODE DESCRIPTION, HARMCODE, ...
const beaHsLines = ['bea_code,bea_desc,hs_code,hs_desc,weight'];
for (let i = 3; i < beaHsData.length; i++) {
  const row = beaHsData[i];
  if (!row || !row[0]) continue;
  const beaCode = String(row[0] || '').trim().replace(/"/g, '""');
  const beaDesc = String(row[1] || '').trim().replace(/"/g, '""');
  const hsCode = String(row[2] || '').trim();
  const hsDesc = String(row[3] || '').trim().replace(/"/g, '""');
  const weight = String(row[4] || '').trim();
  beaHsLines.push(`"${beaCode}","${beaDesc}","${hsCode}","${hsDesc}","${weight}"`);
}
fs.writeFileSync(path.join(RAW_DIR, 'bea-hs-concordance.csv'), beaHsLines.join('\n'), 'utf8');
console.log(`  BEA-HS: ${beaHsLines.length - 1} rows`);

console.log('Done!');
