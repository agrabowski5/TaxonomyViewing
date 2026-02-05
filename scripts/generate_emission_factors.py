"""
Generate emission-factors.json by joining:
  1. EPA Supply Chain GHG Emission Factors v1.3 (NAICS-6 → kg CO2e/USD)
  2. Census Bureau HTS→NAICS concordance (HTS-10 → NAICS-6)

Concordance chain: HS-6 ← first 6 digits of HTS-10 → NAICS-6 → Emission Factor
"""

import csv
import json
import os

RAW_DIR = os.path.join(os.path.dirname(__file__), '..', 'raw-data')
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'app', 'public', 'data')

os.makedirs(OUT_DIR, exist_ok=True)


def parse_epa_factors():
    """Parse EPA Supply Chain GHG Emission Factors CSV → dict keyed by NAICS-6."""
    path = os.path.join(RAW_DIR, 'supply-chain-factors.csv')
    factors = {}
    with open(path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            naics = row['2017 NAICS Code'].strip()
            if not naics or len(naics) < 4:
                continue
            try:
                factor_with = float(row['Supply Chain Emission Factors with Margins'])
                factor_without = float(row['Supply Chain Emission Factors without Margins'])
                margins = float(row['Margins of Supply Chain Emission Factors'])
            except (ValueError, KeyError):
                continue
            factors[naics] = {
                'description': row['2017 NAICS Title'].strip(),
                'factor': factor_with,
                'factorWithoutMargins': factor_without,
                'margins': margins,
            }
    return factors


def parse_census_concordance():
    """Parse Census imp-code.txt (fixed-width) → dict of HS-6 → set of NAICS-6."""
    path = os.path.join(RAW_DIR, 'imp-code.txt')
    hs_to_naics = {}
    with open(path, 'r', encoding='ascii', errors='ignore') as f:
        for line in f:
            if len(line) < 271:
                continue
            hts10 = line[0:10].strip()
            naics6 = line[265:271].strip()
            if not hts10 or not naics6 or not hts10[:6].isdigit() or not naics6.isdigit():
                continue
            hs6 = hts10[:6]
            hs_to_naics.setdefault(hs6, set()).add(naics6)
    return hs_to_naics


def generate():
    print("=== Generating emission factors data ===")

    print("  Parsing EPA Supply Chain Factors...")
    naics_factors = parse_epa_factors()
    print(f"  Found {len(naics_factors)} NAICS sectors with emission factors")

    print("  Parsing Census HTS-NAICS concordance...")
    hs_to_naics = parse_census_concordance()
    print(f"  Found {len(hs_to_naics)} HS-6 codes mapped to NAICS sectors")

    # Join: for each HS-6, find the best NAICS emission factor
    emission_factors = {}
    matched = 0
    for hs6, naics_set in hs_to_naics.items():
        best = None
        for naics in naics_set:
            if naics in naics_factors:
                entry = naics_factors[naics]
                if best is None or entry['factor'] > best['factor']:
                    best = {**entry, 'naicsCode': naics}
        if best:
            matched += 1
            emission_factors[hs6] = {
                'factor': best['factor'],
                'unit': 'kg CO2e / 2022 USD',
                'naicsCode': best['naicsCode'],
                'naicsDescription': best['description'],
                'factorWithoutMargins': best['factorWithoutMargins'],
                'margins': best['margins'],
                'source': 'EPA Supply Chain GHG Emission Factors v1.3',
            }

    # Write output
    out_path = os.path.join(OUT_DIR, 'emission-factors.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(emission_factors, f, ensure_ascii=False)
    size = os.path.getsize(out_path)
    print(f"  Wrote emission-factors.json: {size:,} bytes")
    print(f"  {matched} HS-6 codes matched to emission factors out of {len(hs_to_naics)} total")


if __name__ == '__main__':
    generate()
