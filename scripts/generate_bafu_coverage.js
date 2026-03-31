const AdmZip = require('../app/node_modules/adm-zip');
const path = require('path');
const fs = require('fs');

// BAFU subcategory-level → HS 2-digit chapter mapping
// Uses "category|subCategory" keys for precise mapping, falling back to
// category-only keys when no subcategory match exists.
// Categories like electricity, heat, waste management, water, energy supply
// are services/utilities and don't map to HS goods chapters.

// Subcategory-specific mappings (checked first — "category|subCatPrefix")
// The lookup tries progressively shorter subCategory prefixes to find a match.
const SUBCATEGORY_TO_HS = {
  // Agricultural — split by product type instead of 24-chapter blast
  'agricultural|plant production': ['06','07','08','09','10','11','12','13','14'],
  'agricultural|plant oils': ['15'],
  'agricultural|animal production': ['01','02','03','04','05'],
  'agricultural|food': ['16','19','20','21'],
  'agricultural|other processing': ['16','19','20','21'],
  'agricultural|agricultural means of production\\seed': ['12'],
  'agricultural|agricultural means of production\\mineral fertiliser': ['31'],
  'agricultural|agricultural means of production\\buildings': ['73'],
  'agricultural|agricultural production\\plant protection': ['38'],
  'agricultural|agricultural production\\fuels': ['27'],
  'agricultural|operations': ['84'],
  // Chemicals — split by type
  'chemicals|organic': ['29'],
  'chemicals|organics': ['29'],
  'chemicals|inorganic': ['28'],
  'chemicals|inorganics': ['28'],
  'chemicals|acids (inorganic)': ['28'],
  'chemicals|acids (organic)': ['29'],
  'chemicals|pesticides': ['38'],
  'chemicals|fertilisers (inorganic)': ['31'],
  'chemicals|fertilisers (organic)': ['31'],
  'chemicals|gases': ['28'],
  'chemicals|processing': ['28','29'],
  'chemicals|washing agents': ['34'],
  'chemicals|silicons': ['28'],
  // Metals — split ferro vs non-ferro
  'metals|ferro': ['72','73'],
  'metals|non ferro': ['74','75','76','78','79','80','81'],
  'metals|extraction': ['26','72','74'],
  'metals|alloys': ['72','74'],
  'metals|refinement': ['72','74'],
  'metals|coating': ['73'],
  'metals|chipless shaping': ['73'],
  'metals|chipping': ['73','82'],
  'metals|general manufacturing': ['73','82','83'],
  'metals|welding': ['83'],
  'metals|waste metals': ['72'],
  // Fuels — split by fuel type
  'fuels|coal': ['27'],
  'fuels|oil': ['27'],
  'fuels|natural gas': ['27'],
  'fuels|uranium': ['28'],
  'fuels|lignite': ['27'],
  'fuels|peat': ['27'],
  'fuels|biofuels': ['27'],
  'fuels|hydrogen': ['28'],
  'fuels|synthetic': ['27'],
  // Oil & natural gas (top-level categories)
  'oil|production': ['27'],
  'oil|transport': ['27'],
  'oil|distribution': ['27'],
  'oil|fuels': ['27'],
  'natural gas|production': ['27'],
  'natural gas|transport': ['27'],
  'natural gas|fuels': ['27'],
  'natural gas|power plants': ['27'],
  // Transport — split by mode
  'transport systems|road': ['87'],
  'transport systems|train': ['86'],
  'transport systems|airplane': ['88'],
  'transport systems|ship': ['89'],
  'transport systems|helicopter': ['88'],
  'transport systems|cable car': ['86'],
  'transport systems|pipeline': ['73'],
  'transport systems|transport, obsolete\\road': ['87'],
  'transport systems|transport, obsolete\\rail': ['86'],
  'transport systems|transport, obsolete\\air': ['88'],
  // Construction — split by material
  'construction|concrete': ['25','68'],
  'construction|binders': ['25'],
  'construction|bricks': ['69'],
  'construction|insulation': ['68'],
  'construction|coverings': ['68'],
  'construction|sealing': ['68'],
  'construction|paints': ['32'],
  'construction|kitchen': ['73','94'],
  'construction|ventilation': ['84'],
  'construction|cladding': ['76'],
  'construction materials|concrete': ['25','68'],
  'construction materials|binder': ['25'],
  'construction materials|bricks': ['69'],
  'construction materials|plaster': ['25'],
  'construction materials|plaster base': ['25'],
  'construction materials|glazing': ['70'],
  'construction materials|gypsum materials': ['25'],
  'construction materials|aluminum composite panels': ['76'],
  'construction materials|window profiles': ['76'],
  'construction materials|flax insulation': ['68'],
  'construction materials|hemp lime concrete': ['68'],
  'construction materials|aerogel': ['68'],
  'construction materials|straw bale wall': ['68'],
  'construction materials|rammed earth wall': ['68'],
  'construction materials|misapor': ['68'],
  'construction materials|additives': ['38'],
  'construction materials|subfloors': ['68'],
  'construction materials|sunshade': ['76'],
  'construction materials|hpl': ['39'],
  'construction materials|fiberglass reinforced plastic sheets': ['39'],
  // Building components
  'building components|windows': ['70'],
  'building components|doors': ['44','76'],
  'building components|other material': ['73'],
  // Electronics — split device vs component
  'electronics|component': ['85'],
  'electronics|devices': ['84','85'],
  'electronics|manufacturing': ['85'],
  'electronics|module': ['85'],
  'electronics|production of components': ['85'],
  'electronics|photovoltaic': ['85'],
  'electronics|internet network': ['85'],
  'electronics|waste treatment': ['85'],
  // Plastics — split by type
  'plastics|thermoplasts': ['39'],
  'plastics|thermosets': ['39'],
  'plastics|rubbers': ['40'],
  'plastics|biopolymers': ['39'],
  // Wood — split processing vs raw
  'wood|extraction': ['44'],
  'wood|wooden materials': ['44'],
  'wood|products': ['44'],
  'wood|byproducts': ['44'],
  // Paper
  'paper+ board|pulp': ['47'],
  'paper+ board|graphic paper': ['48'],
  'paper+ board|corrugated board': ['48'],
  'paper+ board|board': ['48'],
  'paper+ board|packaging paper': ['48'],
  'paper+ board|packagings': ['48'],
  'paper+ board|waste paper': ['47'],
};

// Fallback: category-only mapping (used when no subcategory match found)
const CATEGORY_TO_HS_CHAPTERS = {
  'agricultural': ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15'],
  'food industry': ['16','17','18','19','20','21','22'],
  'chemicals': ['28','29','38'],
  'metals': ['72','73','74','75','76','78','79','80','81','82','83'],
  'plastics': ['39','40'],
  'wood': ['44'],
  'paper+ board': ['48'],
  'construction materials': ['25','68','69','70'],
  'construction': ['25','68','69','70'],
  'building components': ['70','73','76'],
  'building processes': ['73','76'],
  'glass': ['70'],
  'ceramics': ['69'],
  'minerals': ['25','26','71'],
  'textiles': ['50','51','52','53','54','55','56','57','58','59','60','61','62','63'],
  'electronics': ['85'],
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

// Resolve HS chapters using subcategory (precise) then category (fallback)
function resolveHsChapters(category, subCategory) {
  const catLower = category.toLowerCase();
  const subLower = subCategory || '';

  // Try progressively shorter subcategory prefixes for matching
  const subParts = subLower.split('\\');
  for (let len = subParts.length; len > 0; len--) {
    const prefix = subParts.slice(0, len).join('\\').toLowerCase();
    const key = catLower + '|' + prefix;
    if (SUBCATEGORY_TO_HS[key]) return SUBCATEGORY_TO_HS[key];
  }

  // Fallback to category-only
  return CATEGORY_TO_HS_CHAPTERS[catLower] || null;
}

// GWP-100 values (IPCC AR6)
const GWP = {
  'carbon dioxide, fossil': 1,
  'carbon dioxide, land transformation': 1,
  'methane, fossil': 29.8,
  'methane, biogenic': 27.2,
  'dinitrogen monoxide': 273,
};

// ---- Tokenizer for fuzzy matching ----
const STOP_WORDS = new Set([
  'at', 'of', 'in', 'for', 'the', 'and', 'or', 'to', 'a', 'an', 'by', 'from',
  'with', 'on', 'per', 'not', 'no', 'is', 'are', 'was', 'other', 'others',
  'elsewhere', 'specified', 'including', 'excluding', 'thereof', 'whether',
  'plant', 'production', 'processing', 'process', 'processes',
  'mixtures', 'mixture', 'preparations', 'articles', 'parts', 'thereof',
]);

function tokenize(text) {
  return text.toLowerCase()
    .replace(/\{[^}]*\}/g, '')       // strip location tags like {CH}
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

function jaccardSimilarity(tokensA, setB) {
  if (tokensA.length === 0 || setB.size === 0) return 0;
  let intersection = 0;
  const setA = new Set(tokensA);
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }
  return intersection / (setA.size + setB.size - intersection);
}

// ---- Load HS-6 lookup for fuzzy matching ----
const hsLookupPath = path.join(__dirname, '..', 'app', 'public', 'data', 'hs-lookup.json');
const hsLookup = JSON.parse(fs.readFileSync(hsLookupPath, 'utf8'));

// Build per-chapter index of HS-6 codes with pre-tokenized descriptions
const chapterToHs6 = {}; // { "27": [ { code: "270112", tokens: Set, desc: "..." }, ... ] }
for (const [code, entry] of Object.entries(hsLookup)) {
  if (code.length !== 6) continue;
  const ch = code.substring(0, 2);
  if (!chapterToHs6[ch]) chapterToHs6[ch] = [];
  const tokens = new Set(tokenize(entry.description));
  if (tokens.size > 0) {
    chapterToHs6[ch].push({ code, tokens, desc: entry.description });
  }
}

// Also build HS-4 index for fallback matching
const chapterToHs4 = {}; // { "27": [ { code: "2701", tokens: Set, desc: "..." }, ... ] }
for (const [code, entry] of Object.entries(hsLookup)) {
  if (code.length !== 4) continue;
  const ch = code.substring(0, 2);
  if (!chapterToHs4[ch]) chapterToHs4[ch] = [];
  const tokens = new Set(tokenize(entry.description));
  if (tokens.size > 0) {
    chapterToHs4[ch].push({ code, tokens, desc: entry.description });
  }
}

const MIN_SIMILARITY = 0.15;  // Minimum Jaccard threshold for a match

// Find best matching HS-6 code for a process name within allowed chapters
function matchProcessToHs6(processName, allowedChapters) {
  const procTokens = tokenize(processName);
  if (procTokens.length === 0) return null;

  let bestCode = null;
  let bestScore = 0;

  // Try HS-6 first
  for (const ch of allowedChapters) {
    const candidates = chapterToHs6[ch] || [];
    for (const c of candidates) {
      const score = jaccardSimilarity(procTokens, c.tokens);
      if (score > bestScore) {
        bestScore = score;
        bestCode = c.code;
      }
    }
  }

  // If HS-6 match is strong enough, use it
  if (bestScore >= MIN_SIMILARITY) return bestCode;

  // Fallback: try HS-4
  bestCode = null;
  bestScore = 0;
  for (const ch of allowedChapters) {
    const candidates = chapterToHs4[ch] || [];
    for (const c of candidates) {
      const score = jaccardSimilarity(procTokens, c.tokens);
      if (score > bestScore) {
        bestScore = score;
        bestCode = c.code;
      }
    }
  }

  if (bestScore >= MIN_SIMILARITY) return bestCode;

  // No good match — fall back to first chapter as HS-2
  return null;
}

// ---- Main processing ----
const zipPath = path.join(__dirname, '..', 'BAFU-2025 ecospold1.zip');
const zip = new AdmZip(zipPath);
const entries = zip.getEntries().filter(e => e.entryName.endsWith('.xml'));

console.log('Processing', entries.length, 'XML files...');

// Per-HS-code data: { processCount, processes: [{name, ghg, unit}] }
// Keys can be HS-6, HS-4, or HS-2 depending on match precision
const hsCodeData = {};
const unmappedCategories = {};
let totalMapped = 0;
let totalUnmapped = 0;
let totalWithGhg = 0;
let totalHs6Matched = 0;
let totalHs4Matched = 0;
let totalChapterOnly = 0;

for (const entry of entries) {
  const content = entry.getData().toString('utf8');

  // Extract reference function attributes
  const refMatch = content.match(/<referenceFunction\s([^>]+)\/>/);
  if (!refMatch) continue;
  const refAttrs = refMatch[1];
  const refName = (refAttrs.match(/\bname="([^"]*)"/) || [])[1] || '';
  const refUnit = (refAttrs.match(/\bunit="([^"]*)"/) || [])[1] || '';
  const refCat = (refAttrs.match(/\bcategory="([^"]*)"/) || [])[1] || '';
  const refSubCat = (refAttrs.match(/\bsubCategory="([^"]*)"/) || [])[1] || '';

  const hsChapters = resolveHsChapters(refCat, refSubCat);

  if (!hsChapters) {
    totalUnmapped++;
    unmappedCategories[refCat.toLowerCase()] = (unmappedCategories[refCat.toLowerCase()] || 0) + 1;
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

  // Try to match process to specific HS-6 code via fuzzy text matching
  const hsCode = matchProcessToHs6(refName, hsChapters);

  if (hsCode) {
    // Matched to a specific HS code (6 or 4 digit)
    if (hsCode.length === 6) totalHs6Matched++;
    else totalHs4Matched++;

    if (!hsCodeData[hsCode]) {
      hsCodeData[hsCode] = { processCount: 0, processes: [], chapters: new Set() };
    }
    hsCodeData[hsCode].processCount++;
    hsCodeData[hsCode].chapters.add(hsCode.substring(0, 2));
    if (totalCO2e > 0) {
      hsCodeData[hsCode].processes.push({ name: refName, ghg: totalCO2e, unit: refUnit });
    }
  } else {
    // No fuzzy match — assign to each allowed chapter (HS-2 level)
    totalChapterOnly++;
    for (const ch of hsChapters) {
      if (!hsCodeData[ch]) {
        hsCodeData[ch] = { processCount: 0, processes: [], chapters: new Set() };
      }
      hsCodeData[ch].processCount++;
      hsCodeData[ch].chapters.add(ch);
      if (totalCO2e > 0) {
        hsCodeData[ch].processes.push({ name: refName, ghg: totalCO2e, unit: refUnit });
      }
    }
  }

  if (totalCO2e > 0) totalWithGhg++;
}

console.log('Mapped processes:', totalMapped);
console.log('  HS-6 fuzzy matched:', totalHs6Matched);
console.log('  HS-4 fuzzy matched:', totalHs4Matched);
console.log('  Chapter-only (no fuzzy match):', totalChapterOnly);
console.log('With GHG data:', totalWithGhg);
console.log('Unmapped processes:', totalUnmapped, '(services/energy/waste - expected)');

console.log('\nUnmapped categories (top 15):');
const unmappedSorted = Object.entries(unmappedCategories).sort((a,b) => b[1] - a[1]);
for (const [cat, count] of unmappedSorted.slice(0, 15)) {
  console.log('  ', count, cat);
}

// Build output: for each HS code, keep all processes by GHG (sorted descending)
// and compute summary stats grouped by reference unit
const coverage = {};
for (const [hsCode, data] of Object.entries(hsCodeData)) {
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
  const topProcesses = procs.slice(0, 50).map(p => ({
    name: p.name.replace(/\s*\{[^}]*\}\s*/g, '').trim(), // strip location tags like {CH}
    ghg: Math.round(p.ghg * 1e6) / 1e6, // 6 decimal places
    unit: p.unit,
  }));

  coverage[hsCode] = {
    processCount: data.processCount,
    withGhgData: procs.length,
    unitStats,
    topProcesses,
  };
}

// Count coverage by key length
const hs6Keys = Object.keys(coverage).filter(k => k.length === 6).length;
const hs4Keys = Object.keys(coverage).filter(k => k.length === 4).length;
const hs2Keys = Object.keys(coverage).filter(k => k.length === 2).length;
console.log('\nCoverage keys:', Object.keys(coverage).length, `(${hs6Keys} HS-6, ${hs4Keys} HS-4, ${hs2Keys} HS-2 chapter)`);

const output = {
  coverage,
  stats: {
    totalProcesses: entries.length,
    mappedProcesses: totalMapped,
    mappedWithGhg: totalWithGhg,
    unmappedProcesses: totalUnmapped,
    hs6Matched: totalHs6Matched,
    hs4Matched: totalHs4Matched,
    chapterOnly: totalChapterOnly,
    coveredHsCodes: Object.keys(coverage).length,
    source: 'BAFU:2025 Swiss Federal LCI Database (ESU-services/FOEN)',
    note: 'GHG values are DIRECT process emissions only (not full supply chain). Uses GWP-100 from IPCC AR6. Processes matched to HS-6 via fuzzy text similarity.',
  },
};

const outPath = path.join(__dirname, '..', 'app', 'public', 'data', 'bafu-coverage.json');
fs.writeFileSync(outPath, JSON.stringify(output));
console.log('\nWrote bafu-coverage.json:', fs.statSync(outPath).size, 'bytes');
