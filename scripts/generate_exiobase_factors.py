"""
Generate exiobase-factors.json from ExioML pre-computed emission factors.

Data sources:
  1. ExioML dataset (Zenodo): Pre-computed emission factors from EXIOBASE 3.8.2
     https://zenodo.org/records/10604610
  2. Manual mapping from HS chapters to Exiobase product sectors

Output: exiobase-factors.json keyed by HS 2-digit chapter code
  { "01": { factor, unit, sectors: [...], source } }
"""

import csv
import json
import os

RAW_DIR = os.path.join(os.path.dirname(__file__), '..', 'raw-data')
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'app', 'public', 'data')
EXIOML_FILE = os.path.join(RAW_DIR, 'ExioML_factor_accounting_PxP.csv')

os.makedirs(OUT_DIR, exist_ok=True)

# Mapping from HS 2-digit chapter to Exiobase product sector names.
# Exiobase has ~184 product sectors; HS has 97 chapters.
# This maps each HS chapter to the most relevant Exiobase sectors.
HS_CHAPTER_TO_EXIOBASE = {
    '01': ['Cattle', 'Pigs', 'Poultry', 'Meat animals nec'],
    '02': ['Products of meat cattle', 'Products of meat pigs', 'Products of meat poultry', 'Meat products nec'],
    '03': ['Fish and other fishing products; services incidental of fishing (05)', 'Fish products'],
    '04': ['Dairy products', 'Raw milk', 'Animal products nec'],
    '05': ['Animal products nec', 'Wool, silk-worm cocoons'],
    '06': ['Crops nec', 'Vegetables, fruit, nuts'],
    '07': ['Vegetables, fruit, nuts'],
    '08': ['Vegetables, fruit, nuts'],
    '09': ['Crops nec'],
    '10': ['Paddy rice', 'Wheat', 'Cereal grains nec'],
    '11': ['Food products nec', 'Processed rice'],
    '12': ['Oil seeds'],
    '13': ['Crops nec'],
    '14': ['Plant-based fibers'],
    '15': ['products of Vegetable oils and fats'],
    '16': ['Food products nec', 'Fish products'],
    '17': ['Sugar'],
    '18': ['Food products nec'],
    '19': ['Food products nec'],
    '20': ['Food products nec'],
    '21': ['Food products nec'],
    '22': ['Beverages'],
    '23': ['Food products nec'],
    '24': ['Tobacco products (16)'],
    '25': ['Stone', 'Sand and clay', 'Chemical and fertilizer minerals, salt and other mining and quarrying products n.e.c.'],
    '26': ['Iron ores', 'Copper ores and concentrates', 'Nickel ores and concentrates',
           'Aluminium ores and concentrates', 'Lead, zinc and tin ores and concentrates',
           'Other non-ferrous metal ores and concentrates', 'Precious metal ores and concentrates'],
    '27': ['Crude petroleum and services related to crude oil extraction, excluding surveying',
           'Natural gas and services related to natural gas extraction, excluding surveying',
           'Coking Coal', 'Other Bituminous Coal', 'Sub-Bituminous Coal',
           'Lignite/Brown Coal', 'Anthracite'],
    '28': ['Chemicals nec'],
    '29': ['Chemicals nec'],
    '30': ['Chemicals nec'],
    '31': ['N-fertiliser', 'P- and other fertiliser'],
    '32': ['Chemicals nec'],
    '33': ['Chemicals nec'],
    '34': ['Chemicals nec'],
    '35': ['Chemicals nec'],
    '36': ['Chemicals nec'],
    '37': ['Chemicals nec'],
    '38': ['Chemicals nec'],
    '39': ['Plastics, basic', 'Rubber and plastic products (25)'],
    '40': ['Rubber and plastic products (25)'],
    '41': ['Leather and leather products (19)'],
    '42': ['Leather and leather products (19)'],
    '43': ['Leather and leather products (19)'],
    '44': ['Wood and products of wood and cork (except furniture); articles of straw and plaiting materials (20)',
           'Products of forestry, logging and related services (02)'],
    '45': ['Wood and products of wood and cork (except furniture); articles of straw and plaiting materials (20)'],
    '46': ['Wood and products of wood and cork (except furniture); articles of straw and plaiting materials (20)'],
    '47': ['Pulp'],
    '48': ['Paper and paper products'],
    '49': ['Printed matter and recorded media (22)'],
    '50': ['Textiles (17)', 'Wool, silk-worm cocoons'],
    '51': ['Textiles (17)', 'Wool, silk-worm cocoons'],
    '52': ['Textiles (17)', 'Plant-based fibers'],
    '53': ['Textiles (17)', 'Plant-based fibers'],
    '54': ['Textiles (17)'],
    '55': ['Textiles (17)'],
    '56': ['Textiles (17)'],
    '57': ['Textiles (17)'],
    '58': ['Textiles (17)'],
    '59': ['Textiles (17)'],
    '60': ['Textiles (17)'],
    '61': ['Wearing apparel; furs (18)'],
    '62': ['Wearing apparel; furs (18)'],
    '63': ['Wearing apparel; furs (18)'],
    '64': ['Leather and leather products (19)'],
    '65': ['Wearing apparel; furs (18)'],
    '66': ['Furniture; other manufactured goods n.e.c. (36)'],
    '67': ['Furniture; other manufactured goods n.e.c. (36)'],
    '68': ['Cement, lime and plaster', 'Bricks, tiles and construction products, in baked clay',
           'Other non-metallic mineral products'],
    '69': ['Ceramic goods'],
    '70': ['Glass and glass products'],
    '71': ['Precious metal ores and concentrates', 'Precious metals'],
    '72': ['Basic iron and steel and of ferro-alloys and first products thereof', 'Iron ores'],
    '73': ['Basic iron and steel and of ferro-alloys and first products thereof',
           'Fabricated metal products, except machinery and equipment (28)'],
    '74': ['Copper ores and concentrates', 'Copper products'],
    '75': ['Nickel ores and concentrates'],
    '76': ['Aluminium ores and concentrates', 'Aluminium and aluminium products'],
    '78': ['Lead, zinc and tin ores and concentrates', 'Lead, zinc and tin and products thereof'],
    '79': ['Lead, zinc and tin ores and concentrates', 'Lead, zinc and tin and products thereof'],
    '80': ['Lead, zinc and tin ores and concentrates', 'Lead, zinc and tin and products thereof'],
    '81': ['Other non-ferrous metal ores and concentrates', 'Other non-ferrous metal products'],
    '82': ['Fabricated metal products, except machinery and equipment (28)'],
    '83': ['Fabricated metal products, except machinery and equipment (28)'],
    '84': ['Machinery and equipment n.e.c. (29)'],
    '85': ['Electrical machinery and apparatus n.e.c. (31)',
           'Radio, television and communication equipment and apparatus (32)'],
    '86': ['Other transport equipment (35)'],
    '87': ['Motor vehicles, trailers and semi-trailers (34)'],
    '88': ['Other transport equipment (35)'],
    '89': ['Other transport equipment (35)'],
    '90': ['Medical, precision and optical instruments, watches and clocks (33)'],
    '91': ['Medical, precision and optical instruments, watches and clocks (33)'],
    '92': ['Furniture; other manufactured goods n.e.c. (36)'],
    '93': ['Fabricated metal products, except machinery and equipment (28)'],
    '94': ['Furniture; other manufactured goods n.e.c. (36)'],
    '95': ['Furniture; other manufactured goods n.e.c. (36)'],
    '96': ['Furniture; other manufactured goods n.e.c. (36)'],
    '97': ['Furniture; other manufactured goods n.e.c. (36)'],
}

YEAR = '2022'


def load_exioml_factors():
    """Load ExioML PxP data and compute global-average emission intensity per sector."""
    sector_ghg = {}  # total GHG across all regions
    sector_va = {}   # total value added across all regions

    with open(EXIOML_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['Year'] != YEAR:
                continue
            sector = row['sector']
            ghg = float(row['GHG emissions [kg CO2 eq.]'])
            va = float(row['Value Added [M.EUR]'])
            sector_ghg[sector] = sector_ghg.get(sector, 0) + ghg
            sector_va[sector] = sector_va.get(sector, 0) + va

    # Compute intensity: kg CO2e per EUR
    # GHG is in kg CO2 eq., VA is in M.EUR (millions of EUR)
    # intensity = GHG / (VA * 1,000,000)
    intensities = {}
    for sector in sector_ghg:
        va = sector_va.get(sector, 0)
        if va > 0:
            intensities[sector] = sector_ghg[sector] / (va * 1_000_000)
        else:
            intensities[sector] = 0.0

    return intensities


def generate():
    print("=== Generating Exiobase emission factors ===")

    if not os.path.exists(EXIOML_FILE):
        print(f"  ERROR: ExioML file not found at {EXIOML_FILE}")
        print("  Download from: https://zenodo.org/records/10604610/files/ExioML_factor_accounting_PxP.csv")
        return

    print(f"  Loading ExioML factors for year {YEAR}...")
    intensities = load_exioml_factors()
    print(f"  Computed intensities for {len(intensities)} sectors")

    # Build HS-chapter emission factors
    exiobase_factors = {}
    mapped = 0
    for hs_chapter, sector_names in HS_CHAPTER_TO_EXIOBASE.items():
        total_ghg = 0.0
        total_va = 0.0
        matched_sectors = []

        for name in sector_names:
            if name in intensities:
                matched_sectors.append({
                    'name': name,
                    'intensity': round(intensities[name], 4),
                })

        if not matched_sectors:
            continue

        # Use value-added-weighted average of matched sectors
        # Since we only have intensity (not raw GHG/VA), use simple average
        avg_intensity = sum(s['intensity'] for s in matched_sectors) / len(matched_sectors)

        exiobase_factors[hs_chapter] = {
            'factor': round(avg_intensity, 4),
            'unit': f'kg CO2e / {YEAR} EUR',
            'sectors': [s['name'] for s in matched_sectors],
            'source': 'EXIOBASE 3.8.2 via ExioML',
        }
        mapped += 1

    # Write output
    out_path = os.path.join(OUT_DIR, 'exiobase-factors.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(exiobase_factors, f, ensure_ascii=False)
    size = os.path.getsize(out_path)
    print(f"  Wrote exiobase-factors.json: {size:,} bytes")
    print(f"  {mapped} HS chapters mapped to Exiobase emission factors")


if __name__ == '__main__':
    generate()
