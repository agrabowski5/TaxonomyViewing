const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// GaBi/Sphera folder → HS 2-digit chapter mapping
// Only folders that correspond to traded goods/materials are mapped.
// Energy, electricity, heating, transport, waste, and service folders are excluded.
const FOLDER_TO_HS_CHAPTERS = {
  // Chemicals & organic/inorganic intermediates
  'organic intermediate products':        ['29','38'],
  'inorganic intermediate products':      ['28','38'],
  'chemicals':                            ['28','29','30','31','32','33','34','35','36','37','38'],
  'pesticides':                           ['38'],
  'fertilisers':                          ['31'],
  'fertilizers europe':                   ['31'],
  'adhesives':                            ['35'],
  'sealants (sealing compounds)':         ['35'],
  'binder':                               ['38','32'],
  'additions':                            ['38'],
  'solder paste':                         ['38','83'],
  'paint-systems production':             ['32'],
  'exterior paints':                      ['32'],
  'indoor paints':                        ['32'],
  'paint systems wooden windows':         ['32'],
  'paint systems wooden facade':          ['32'],
  'paint systems for metal':              ['32'],
  'coating':                              ['32'],
  'parquet varnish':                      ['32'],
  'dyeing':                               ['32'],
  'printing':                             ['49'],
  'dyed fabric':                          ['54','55','56'],
  'printed fabric':                       ['54','55','56'],
  'dyed and printed fabric':              ['54','55','56'],
  'ipa':                                  ['29'],

  // Plastics & rubber
  'plastic production':                   ['39','40'],
  'plastics':                             ['39','40'],
  '[u-so] plastics':                      ['39','40'],
  'plasticseurope':                       ['39','40'],
  'pvc':                                  ['39'],
  'expanded polystyrene (eps)':           ['39'],
  'extruded polystyrene (xps)':           ['39'],
  'polyurethane rigid foam (pur)':        ['39'],
  'polyethylene foam':                    ['39'],
  'plastic profiles elastic':             ['39'],
  'plastic profiles hard':                ['39'],
  'europur':                              ['39'],
  'isopa':                                ['39'],
  'synthetic rubber':                     ['40'],
  'rubber floor coverings':               ['40'],
  'synthetic leather':                    ['39','42'],
  'carbon fiber reinforced plastics (cfrp)': ['39','68'],
  'carbon fibers (cf)':                   ['68'],
  'melamine resin foam':                  ['39'],
  'total corbion':                        ['39'],
  'euromoulders':                         ['39'],

  // Metals
  'steel':                                ['72','73'],
  'worldsteel 2022':                      ['72','73'],
  'eurofer':                              ['72','73'],
  'carbon steel - semi-finished products':['72'],
  'stainless steel - slab':               ['72'],
  'stainless steel - semi-finished products': ['72'],
  'stainless steel sheet':                ['72','73'],
  'steel rebar':                          ['72','73'],
  'steel sheet':                          ['72','73'],
  'steel sections':                       ['72','73'],
  'scrap-eaf':                            ['72'],
  'dri-eaf':                              ['72'],
  'bf-bot':                               ['72'],
  'bf-bof':                               ['72'],
  'aluminium':                            ['76'],
  'aluminium steps to ingot':             ['76'],
  'aluminium steps to products':          ['76'],
  'european aluminium':                   ['76'],
  'parametric aluminium model':           ['76'],
  'iai 2015':                             ['76'],
  'iai 2019':                             ['76'],
  'iai unit processes 2015':              ['76'],
  'iai unit processes 2019':              ['76'],
  'aa':                                   ['76'],
  'copper':                               ['74'],
  'copper sheets':                        ['74'],
  'forged/cast parts copper and brass':   ['74'],
  'lead':                                 ['78'],
  'zinc':                                 ['79'],
  'tin':                                  ['80'],
  'nickel':                               ['75'],
  'nickel institute':                     ['75'],
  'tungsten':                             ['81'],
  'cobalt':                               ['81'],
  'lithium':                              ['28','81'],
  'magnesium':                            ['81'],
  'manganese':                            ['81'],
  'titanium':                             ['81'],
  'chromium':                             ['81'],
  'cadmium':                              ['81'],
  'molybdenum':                           ['81'],
  'niobium':                              ['81'],
  'tantalum':                             ['81'],
  'zirconium':                            ['81'],
  'bismuth':                              ['81'],
  'gold':                                 ['71'],
  'silver':                               ['71'],
  'palladium':                            ['71'],
  'gallium':                              ['81'],
  'antinomy':                             ['81'],
  'silicon':                              ['28'],
  'ferro silicon':                        ['72'],
  'rare earth oxide (reo)':               ['28'],
  'rare earth metal (rem)':               ['81'],
  'lanthan':                              ['28'],
  'imoa':                                 ['81'],
  'ila':                                  ['78'],
  'iza':                                  ['79'],
  'cast and forged parts':                ['73'],
  'metals':                               ['72','73','74','75','76','78','79','80','81'],
  'metal production':                     ['72','73','74','75','76'],
  'eol recycling metal':                  ['72','73'],

  // Wood & paper
  'wood products':                        ['44'],
  'wood':                                 ['44'],
  'construction sawn lumber':             ['44'],
  'construction solid wood':              ['44'],
  'chipboards':                           ['44'],
  'wood fibreboards':                     ['44'],
  'wood fibre':                           ['44'],
  'lightweight wood fibers panel':        ['44'],
  'glued laminated timber':               ['44'],
  'glued laminated timber board':         ['44'],
  'laminated veneer lumber':              ['44'],
  'laminated wood boards':                ['44'],
  '3-/5- laminated wood panels':          ['44'],
  'plywood':                              ['44'],
  'parquet':                              ['44'],
  'wooden floors':                        ['44'],
  'cork':                                 ['45'],
  'expanded cork (icb)':                  ['45'],
  'paper':                                ['48'],
  'pulp products':                        ['47'],
  'pulp, paper and cardboard':            ['48'],
  'by-products pulp production':          ['47'],
  'supporting products for papermaking':  ['48'],
  'fefco':                                ['48'],
  '[u-so] paper products and refinement': ['48'],

  // Textiles
  'woven fabrics':                        ['50','51','52','53','54','55'],
  'fleeces':                              ['56'],
  'non-woven fabric':                     ['56'],
  'non-woven fabrics':                    ['56'],
  'fiber products':                       ['54','55','56'],
  'cellulose fibres':                     ['54','55'],
  'cotton':                               ['52'],
  'flax fleece':                          ['53'],
  'hemp fleece':                          ['53'],
  'growing of fibre crops':               ['53'],
  'yarns':                                ['54','55','56'],
  'textile processes':                    ['50','51','52','53','54','55','56'],
  'textile production':                   ['50','51','52','53','54','55','56'],
  'textiles and leather':                 ['42','50','51','52','53','54','55','56','61','62','63'],
  'garment production & use':             ['61','62','63'],
  'leather':                              ['42'],

  // Construction materials
  'stones and elements':                  ['25','68'],
  'mortar and concrete':                  ['25','68'],
  'concrete':                             ['25','68'],
  'cement':                               ['25'],
  'lime':                                 ['25'],
  'glass':                                ['70'],
  'transparent boards':                   ['70'],
  'stoneware':                            ['69'],
  'gypsum':                               ['25','68'],
  'plaster':                              ['25','68'],
  'mineral wool':                         ['68'],
  'mineral fibre':                        ['68'],
  'expanded clay':                        ['69'],
  'kaolin':                               ['25'],
  'pumice':                               ['25'],
  'calcium silicate / calcium silicate hydrate': ['25','68'],
  'asphalt':                              ['27','68'],
  'bitumen sheets':                       ['68'],
  'roofing membranes':                    ['39','68'],
  'elastomer roofing membranes':          ['40','68'],
  'eva-roofing membranes':                ['39','68'],
  'underroof membrane':                   ['39','68'],
  'sealing profile':                      ['40','68'],
  'insulation materials':                 ['68'],
  'damp insulation':                      ['68'],
  'exterior insulation and finish system (etic)': ['68'],
  'fibre cement':                         ['68'],
  'resin composite wall panels':          ['39','68'],
  'building elements':                    ['68','73'],
  'roof, facade and wall panels':         ['73','76'],
  'construction pre-products':            ['25','68','73'],
  'in-situ foam from urea-formaldehyde resin': ['39','68'],
  'eol construction materials':           ['25','68'],
  'linoleum':                             ['59'],
  'floor coverings':                      ['57','59'],
  'pvc floor coverings':                  ['39'],
  'synthetic floor coverings':            ['39','59'],
  'laminate':                             ['44'],
  'window and facade components':         ['70','76'],
  'frames/profiles':                      ['76'],
  'drinking water pipes':                 ['73','76'],
  'wastewater pipes':                     ['39','73'],
  'rain drainpipes':                      ['39','73'],
  'plumbing':                             ['73','74'],
  'fittings/fasteners':                   ['73','83'],
  'sanitary ware':                        ['69'],
  'shower and bath tub':                  ['69','73'],
  'stainless steel drinking water pipe':  ['73'],
  'joint gasket tape':                    ['40'],
  'elastomer joint tape':                 ['40'],
  'ivpu':                                 ['39'],
  'eppa':                                 ['39'],
  'spfa':                                 ['39'],
  'zia':                                  ['25'],
  'gcc':                                  ['25'],
  'pcc':                                  ['28'],

  // Electronics & electrical
  'electro':                              ['84','85'],
  'ics':                                  ['85'],
  'ics based on models 2004-2014':        ['85'],
  'connectors':                           ['85'],
  'connectors (pcs.)':                    ['85'],
  'capacitors':                           ['85'],
  'resistors':                            ['85'],
  'transistors':                          ['85'],
  'diodes':                               ['85'],
  'thermistors':                          ['85'],
  'coils / ring core coils':              ['85'],
  'led':                                  ['85'],
  'switches and sockets':                 ['85'],
  'cable':                                ['85'],
  'pwb':                                  ['85'],
  'speakers and microphones':             ['85'],
  'hdd':                                  ['84','85'],
  'ssd':                                  ['85'],
  'flash memory':                         ['85'],
  'ddr memory':                           ['85'],
  'display':                              ['85'],
  'tv':                                   ['85'],
  'mobile phone':                         ['85'],
  'ict product':                          ['84','85'],
  'semiconductor':                        ['85'],
  'connector':                            ['85'],
  'other electronic parts':               ['85'],
  'open ic model':                        ['85'],
  'magnets and ferrites':                 ['85'],
  'magnet':                               ['85'],
  'average populated pwb / ram bar':      ['85'],
  'populated printing wiring boards':     ['85'],
  'parametric pwb sub-plans':             ['85'],
  'electronics':                          ['84','85'],
  'electronics recycling':                ['84','85'],
  'lighting':                             ['85','94'],
  'electric motor':                       ['85'],
  'electric':                             ['85'],
  'fan':                                  ['84'],
  'fan & power pack':                     ['84'],

  // Agriculture & food
  'cereals (except rice), leguminous crops, oil seeds': ['10','11','12'],
  'vegetable and animal oils and fats':   ['15'],
  'growing of vegetables and melons, roots and tubers': ['07'],
  'grain mill products':                  ['11'],
  'sugar':                                ['17'],
  'sugar-/starch products':               ['17'],
  'starches and starch products':         ['11'],
  'dairy products':                       ['04'],
  'cattle':                               ['02','16'],
  'raising of cattle and buffaloes':      ['01'],
  'pig':                                  ['02','16'],
  'poultry':                              ['02','16'],
  'raising of poultry':                   ['01'],
  'raising of sheep and goats':           ['01'],
  'growing of rice':                      ['10'],
  'growing of citrus fruits':             ['08'],
  'growing of pome fruits and stone fruits': ['08'],
  'growing of other tree and bush fruits and nuts': ['08'],
  'growing of oleaginous fruits':         ['12'],
  'growing of grapes':                    ['08','22'],
  'growing of sugar cane':                ['12','17'],
  'growing of other perennial crops':     ['09','12'],
  'growing of other non-perennial crops': ['07','12'],
  'support activities to agriculture and post-harvest': ['01','12'],
  'support activities to forestry and logging': ['44'],
  'forestry and logging':                 ['44'],
  'cocoa, chocolate and sugar confectionery': ['18'],
  'tea':                                  ['09'],
  'spices, aromatic, drug and pharmaceutical crops': ['09'],
  'other food products n.e.c.':           ['21'],
  'oil/fat product':                      ['15'],
  'soft drinks, mineral water and other bottled water': ['22'],
  'fish, crustaceans, molluscs':          ['03','16'],
  'food':                                 ['16','19','20','21'],
  'manufacture of food products':         ['16','19','20','21'],
  'manufacture of grain mill products and starches': ['11'],
  'animal products':                      ['05','16'],
  'agricultural':                         ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24'],
  'cultivation':                          ['06','07','08','09','10','12'],
  'packaging':                            ['39','48','76'],

  // Fuels & petroleum
  'refinery products and fuels':          ['27'],
  'refinery products - blended':          ['27'],
  'crude oil mix':                        ['27'],
  'crude oil domestic':                   ['27'],
  'conventional crude oil [u-so]':        ['27'],
  'fuel material':                        ['27'],
  'fuel production':                      ['27'],
  'fuel oil':                             ['27'],
  'gasoline':                             ['27'],
  'diesel':                               ['27'],
  'cng':                                  ['27'],
  'lng':                                  ['27'],
  'lpg':                                  ['27'],
  'hydrogen':                             ['28'],
  'biofuels (liquid)':                    ['27','38'],
  'biomass (solid) for bioenergy':        ['44'],
  'biogas for bioenergy':                 ['27'],
  'biomethane':                           ['27'],
  'nexbtl':                               ['27'],
  'asphalt institute':                    ['27'],
  'liquefied gas':                        ['27'],
  'wood pellets':                         ['44'],
  'natural graphite':                     ['25'],

  // Batteries
  'battery':                              ['85'],
  'battery materials':                    ['85'],
  'li-ion battery cell':                  ['85'],
  'li-ion battery pack':                  ['85'],
  'lithium-ion lfp battery cell':         ['85'],
  'lithium-ion lfp battery pack':         ['85'],
  'lithium-ion nca battery cell':         ['85'],
  'lithium-ion nca battery pack':         ['85'],
  'lithium-ion nmc battery cell':         ['85'],
  'lithium-ion nmc battery pack':         ['85'],
  'lithium-ion recycling':                ['85'],
  'sodium-ion battery (sib)':             ['85'],
  'cathode active material (cam)':        ['85'],
  'precursor cathode active material (pcam)': ['85'],
  'anode active material':                ['85'],
  'fuel cell':                            ['85'],
  'alkaline cell':                        ['85'],

  // Vehicles & transport equipment
  'truck':                                ['87'],
  'trucks':                               ['87'],
  'passenger car':                        ['87'],
  'train':                                ['86'],
  'railway':                              ['86'],
  'rail':                                 ['86'],
  'ocean-going ship':                     ['89'],
  'inland ship':                          ['89'],
  'ship':                                 ['89'],
  'airplane':                             ['88'],
  'elevator':                             ['84'],
  'escalator':                            ['84'],
  'hybrid':                               ['87'],

  // Machinery & equipment
  'part production':                      ['84'],
  'assembly':                             ['84','85'],
  'assembly line':                        ['84'],
  'conveying modules':                    ['84'],
  'air conditioning/refrigerating machines': ['84'],
  'pipeline':                             ['73'],
  'investment goods':                     ['84'],
};

// Read the Excel file
const xlsxPath = path.join(__dirname, '..', 'raw-data', 'Sphera-Dataset-List-MLC-Databases-2026.1-Edition.xlsx');
if (!fs.existsSync(xlsxPath)) {
  console.error('Sphera Excel file not found at', xlsxPath);
  process.exit(1);
}

const wb = XLSX.readFile(xlsxPath);
const ws = wb.Sheets['Dataset List 2026.1'];
const data = XLSX.utils.sheet_to_json(ws, { range: 3, defval: '' });

console.log('Processing', data.length, 'GaBi/Sphera dataset rows...');

// Deduplicate by GUID (same process may appear with different countries)
const seen = new Set();
const uniqueRows = [];
for (const d of data) {
  const guid = d['GUID'] || '';
  const name = d['Name'] || '';
  const key = guid || name; // fallback to name if no GUID
  if (!seen.has(key)) {
    seen.add(key);
    uniqueRows.push(d);
  }
}
console.log('Unique processes (by GUID):', uniqueRows.length);

// Build per-HS-chapter data
const hsChapterData = {};
const unmappedFolders = {};
let totalMapped = 0;
let totalUnmapped = 0;

for (const d of data) {
  const folder = (d['Folder'] || '').trim();
  const name = (d['Name'] || '').trim();
  if (!folder || !name) continue;

  const folderLower = folder.toLowerCase();
  const hsChapters = FOLDER_TO_HS_CHAPTERS[folderLower];

  if (!hsChapters) {
    totalUnmapped++;
    unmappedFolders[folder] = (unmappedFolders[folder] || 0) + 1;
    continue;
  }

  totalMapped++;

  for (const ch of hsChapters) {
    if (!hsChapterData[ch]) {
      hsChapterData[ch] = { processCount: 0, processes: [] };
    }
    hsChapterData[ch].processCount++;
    hsChapterData[ch].processes.push({
      name: name.substring(0, 120),
      unit: (d['Further quantitative specifications'] || '').substring(0, 60) || '-',
    });
  }
}

console.log('Mapped rows:', totalMapped);
console.log('Unmapped rows:', totalUnmapped, '(energy/services/discontinued - expected)');
console.log('HS chapters covered:', Object.keys(hsChapterData).length);

console.log('\nHS chapter coverage:');
for (const [ch, chData] of Object.entries(hsChapterData).sort()) {
  console.log('  HS', ch, ':', chData.processCount, 'processes');
}

console.log('\nUnmapped folders (top 20):');
const unmappedSorted = Object.entries(unmappedFolders).sort((a, b) => b[1] - a[1]);
for (const [f, c] of unmappedSorted.slice(0, 20)) {
  console.log(' ', c, f);
}

// Build output
const coverage = {};
for (const [ch, chData] of Object.entries(hsChapterData)) {
  // Deduplicate process names per chapter, keep top 10
  const nameSet = new Set();
  const uniqueProcs = [];
  for (const p of chData.processes) {
    if (!nameSet.has(p.name)) {
      nameSet.add(p.name);
      uniqueProcs.push(p);
    }
  }

  const topProcesses = uniqueProcs.slice(0, 10).map(p => ({
    name: p.name,
    ghg: 0, // GaBi dataset list doesn't include GHG data
    unit: p.unit,
  }));

  coverage[ch] = {
    processCount: chData.processCount,
    withGhgData: 0, // No inline GHG data in the dataset list
    unitStats: {},
    topProcesses,
  };
}

const output = {
  coverage,
  stats: {
    totalProcesses: data.length,
    mappedProcesses: totalMapped,
    mappedWithGhg: 0,
    unmappedProcesses: totalUnmapped,
    coveredHsChapters: Object.keys(coverage).length,
    source: 'GaBi/Sphera MLC Databases 2026.1 Edition',
    note: 'Process-level coverage only (no inline GHG emission data). Dataset list from Sphera documentation.',
  },
};

const outPath = path.join(__dirname, '..', 'app', 'public', 'data', 'gabi-coverage.json');
fs.writeFileSync(outPath, JSON.stringify(output));
console.log('\nWrote gabi-coverage.json:', fs.statSync(outPath).size, 'bytes');
