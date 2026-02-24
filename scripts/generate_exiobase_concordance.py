"""
Generate exiobase-concordance.json from EXIOBASE concordance files.

Data sources (in raw-data/exiobase-concordances/):
  1. code_to_name.xlsx        — 201 EXIOBASE product codes with names
  2. HS_EXIOBASE2.0.xlsx      — HS-1996 to EXIOBASE product concordance (5,162 rows)
  3. CPA2002_6digit_EXIOBASE_FINAL.xlsx — CPA 2002 to EXIOBASE product concordance (2,620 rows)
  4. ISIC REV. 3 - EXIOBASE2.0.xlsx    — ISIC Rev.3 to EXIOBASE industry codes (523 rows)
  5. NACE1.1 - EXIOBASE2.0_FINAL.xlsx  — NACE 1.1 to EXIOBASE industry codes (848 rows)

Output: exiobase-concordance.json with precise concordance mappings
"""

import json
import os
import pandas as pd

RAW_DIR = os.path.join(os.path.dirname(__file__), '..', 'raw-data', 'exiobase-concordances')
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'app', 'public', 'data')

os.makedirs(OUT_DIR, exist_ok=True)


def load_products():
    """Load EXIOBASE product codes and names from code_to_name.xlsx."""
    path = os.path.join(RAW_DIR, 'code_to_name.xlsx')
    df = pd.read_excel(path)
    products = {}
    for _, row in df.iterrows():
        code = str(row['EXIO_code']).strip()
        name = str(row['ProductTypeName']).strip()
        if code and code != '?' and name and name != '?':
            products[code] = name
    return products


def load_hs_concordance():
    """Load HS-1996 to EXIOBASE concordance.

    HS-1996 codes are 5-digit integers that need zero-padding to 6 digits
    to match modern HS-6 format.
    """
    path = os.path.join(RAW_DIR, 'HS_EXIOBASE2.0.xlsx')
    df = pd.read_excel(path)
    hs_to_exio = {}
    for _, row in df.iterrows():
        hs_raw = row['hs1996']
        exio = row['exiobase_20']
        if pd.isna(hs_raw) or pd.isna(exio):
            continue
        # Zero-pad to 6 digits
        hs6 = str(int(hs_raw)).zfill(6)
        exio_code = str(exio).strip()
        if hs6 not in hs_to_exio:
            hs_to_exio[hs6] = []
        if exio_code not in hs_to_exio[hs6]:
            hs_to_exio[hs6].append(exio_code)
    return hs_to_exio


def load_cpa_concordance():
    """Load CPA 2002 to EXIOBASE concordance.

    CPA codes like '01.11.12' are stripped of dots to become '011112'.
    CPA 2002 shares numeric structure with CPC at 2-4 digit level.
    """
    path = os.path.join(RAW_DIR, 'CPA2002_6digit_EXIOBASE_FINAL.xlsx')
    df = pd.read_excel(path)
    cpa_to_exio = {}
    for _, row in df.iterrows():
        cpa_raw = row['CPA 2002.1']
        exio = row['EXIOBASE_2.0']
        if pd.isna(cpa_raw) or pd.isna(exio):
            continue
        # Strip dots: '01.11.12' -> '011112'
        cpa_code = str(cpa_raw).replace('.', '').strip()
        exio_code = str(exio).strip()
        if cpa_code not in cpa_to_exio:
            cpa_to_exio[cpa_code] = []
        if exio_code not in cpa_to_exio[cpa_code]:
            cpa_to_exio[cpa_code].append(exio_code)
    return cpa_to_exio


def load_isic_concordance():
    """Load ISIC Rev.3 to EXIOBASE concordance.

    EXIOBASE codes are semicolon-separated in a single column.
    """
    path = os.path.join(RAW_DIR, 'ISIC REV. 3 - EXIOBASE2.0.xlsx')
    df = pd.read_excel(path)
    isic_to_exio = {}
    for _, row in df.iterrows():
        isic_raw = row['ISIC REV. 3 - NACE REV. 1']
        exio_raw = row['EXIOBASE 2.0']
        if pd.isna(isic_raw) or pd.isna(exio_raw):
            continue
        isic_code = str(isic_raw).strip()
        if isic_code == 'Source (unique)':
            continue
        # Split semicolons
        exio_codes = [c.strip() for c in str(exio_raw).split(';') if c.strip()]
        if exio_codes:
            isic_to_exio[isic_code] = exio_codes
    return isic_to_exio


def load_nace_concordance():
    """Load NACE 1.1 to EXIOBASE concordance.

    Uses the 'Code' column for NACE codes and 'EXIOBASE CODES' for mappings.
    EXIOBASE codes are semicolon-separated.
    """
    path = os.path.join(RAW_DIR, 'NACE1.1 - EXIOBASE2.0_FINAL.xlsx')
    df = pd.read_excel(path)
    nace_to_exio = {}
    for _, row in df.iterrows():
        nace_raw = row.get('Code') or row.get('Unnamed: 1')
        exio_raw = row.get('EXIOBASE CODES')
        if pd.isna(nace_raw) or pd.isna(exio_raw):
            continue
        nace_code = str(nace_raw).strip()
        # Split semicolons
        exio_codes = [c.strip() for c in str(exio_raw).split(';') if c.strip()]
        if exio_codes:
            nace_to_exio[nace_code] = exio_codes
    return nace_to_exio


def compute_ancestors(code_dict):
    """Compute all ancestor prefixes from a set of codes.

    For HS-6 code '010111', ancestors are '01011', '0101', '010', '01', '0'.
    Used for parent-node coverage inheritance in the tree view.
    """
    ancestors = set()
    for code in code_dict:
        for length in range(len(code) - 1, 0, -1):
            prefix = code[:length]
            ancestors.add(prefix)
    return sorted(ancestors)


def generate():
    print("=== Generating EXIOBASE concordance ===")

    # 1. Products
    print("  Loading EXIOBASE product codes...")
    products = load_products()
    print(f"  {len(products)} product codes loaded")

    # 2. HS concordance
    print("  Loading HS -> EXIOBASE concordance...")
    hs_to_exio = load_hs_concordance()
    print(f"  {len(hs_to_exio)} HS-6 codes mapped")

    # 3. CPA concordance
    print("  Loading CPA -> EXIOBASE concordance...")
    cpa_to_exio = load_cpa_concordance()
    print(f"  {len(cpa_to_exio)} CPA codes mapped")

    # 4. ISIC concordance
    print("  Loading ISIC -> EXIOBASE concordance...")
    isic_to_exio = load_isic_concordance()
    print(f"  {len(isic_to_exio)} ISIC codes mapped")

    # 5. NACE concordance
    print("  Loading NACE -> EXIOBASE concordance...")
    nace_to_exio = load_nace_concordance()
    print(f"  {len(nace_to_exio)} NACE codes mapped")

    # 6. Ancestors
    print("  Computing ancestor prefixes...")
    hs_ancestors = compute_ancestors(hs_to_exio)
    cpa_ancestors = compute_ancestors(cpa_to_exio)
    print(f"  {len(hs_ancestors)} HS ancestors, {len(cpa_ancestors)} CPA ancestors")

    # Collect unique EXIOBASE product codes across all mappings
    all_exio = set()
    for codes in hs_to_exio.values():
        all_exio.update(codes)
    for codes in cpa_to_exio.values():
        all_exio.update(codes)

    stats = {
        'hsCodesMatched': len(hs_to_exio),
        'cpaCodesMatched': len(cpa_to_exio),
        'isicCodesMatched': len(isic_to_exio),
        'naceCodesMatched': len(nace_to_exio),
        'uniqueExioProducts': len(all_exio),
        'totalExioProducts': len(products),
    }

    output = {
        'products': products,
        'hsToExio': hs_to_exio,
        'cpaToExio': cpa_to_exio,
        'isicToExio': isic_to_exio,
        'naceToExio': nace_to_exio,
        'hsAncestors': hs_ancestors,
        'cpaAncestors': cpa_ancestors,
        'stats': stats,
    }

    out_path = os.path.join(OUT_DIR, 'exiobase-concordance.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False)
    size = os.path.getsize(out_path)
    print(f"\n  Wrote exiobase-concordance.json: {size:,} bytes")
    print(f"  Stats: {json.dumps(stats, indent=2)}")


if __name__ == '__main__':
    generate()
