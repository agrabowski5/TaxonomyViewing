"""
Generate uslci-coverage.json from:
  1. USLCI process list (raw-data/uslci-processes.json) — NAICS codes extracted from process categories
  2. Census Bureau HTS→NAICS concordance (raw-data/imp-code.txt) — reversed to NAICS→HS-6

Concordance chain: USLCI process → NAICS-4+ → NAICS-6 (imp-code.txt) → HS-6

Output: uslci-coverage.json keyed by HS-6 code
  { coverage: { "010121": { naicsCodes, processCount } }, stats: {...} }
"""

import json
import os
import re

RAW_DIR = os.path.join(os.path.dirname(__file__), '..', 'raw-data')
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'app', 'public', 'data')

os.makedirs(OUT_DIR, exist_ok=True)


def parse_uslci_processes():
    """Parse USLCI processes JSON → dict of NAICS code → list of process names."""
    path = os.path.join(RAW_DIR, 'uslci-processes.json')
    with open(path, 'r', encoding='utf-8') as f:
        processes = json.load(f)

    naics_to_processes = {}
    for p in processes:
        category = p.get('category', '')
        matches = re.findall(r'(\d{4,6}):', category)
        for code in matches:
            if len(code) >= 4:
                naics_to_processes.setdefault(code, []).append(p.get('name', ''))

    return naics_to_processes, len(processes)


def parse_census_concordance_reverse(naics_codes):
    """Parse Census imp-code.txt → dict of HS-6 → set of matching NAICS codes."""
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
            for n in naics_codes:
                if naics6.startswith(n):
                    hs_to_naics.setdefault(hs6, set()).add(n)
    return hs_to_naics


def generate():
    print("=== Generating USLCI coverage data ===")

    print("  Parsing USLCI processes...")
    naics_to_processes, total_processes = parse_uslci_processes()
    naics_codes = set(naics_to_processes.keys())
    print(f"  Found {total_processes} processes with {len(naics_codes)} unique NAICS codes")

    print("  Building NAICS→HS-6 mapping from Census concordance...")
    hs_to_naics = parse_census_concordance_reverse(naics_codes)
    print(f"  Found {len(hs_to_naics)} HS-6 codes with USLCI coverage")

    # Build output
    coverage = {}
    for hs6, naics_set in hs_to_naics.items():
        codes = sorted(naics_set)
        process_count = sum(len(naics_to_processes.get(n, [])) for n in codes)
        coverage[hs6] = {
            'naicsCodes': codes,
            'processCount': process_count,
        }

    output = {
        'coverage': coverage,
        'stats': {
            'totalProcesses': total_processes,
            'uniqueNaicsCodes': len(naics_codes),
            'coveredHs6Codes': len(coverage),
            'source': 'NREL U.S. Life Cycle Inventory Database (USLCI) Fall 2025',
        },
    }

    out_path = os.path.join(OUT_DIR, 'uslci-coverage.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False)
    size = os.path.getsize(out_path)
    print(f"  Wrote uslci-coverage.json: {size:,} bytes")
    print(f"  {len(coverage)} HS-6 codes covered by USLCI processes")


if __name__ == '__main__':
    generate()
