"""
Generate uslci-coverage.json from:
  1. Full USLCI database ZIP (openLCA JSON-LD format) — GHG emissions extracted per process
  2. Census Bureau HTS→NAICS concordance (raw-data/imp-code.txt) — reversed to NAICS->HS-6

Concordance chain: USLCI process → NAICS-4+ → NAICS-6 (imp-code.txt) → HS-6

Output: uslci-coverage.json keyed by HS-6 code
  { coverage: { "010121": { naicsCodes, processCount, withGhgData, unitStats, topProcesses } }, stats: {...} }
"""

import json
import os
import re
import zipfile
from collections import defaultdict

RAW_DIR = os.path.join(os.path.dirname(__file__), '..', 'raw-data')
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'app', 'public', 'data')
ROOT_DIR = os.path.join(os.path.dirname(__file__), '..')

os.makedirs(OUT_DIR, exist_ok=True)

# GWP-100 values (IPCC AR6)
GWP = {
    'carbon dioxide': 1,
    'methane': 29.8,
    'nitrous oxide': 273,
    'dinitrogen monoxide': 273,
}


def parse_uslci_from_zip():
    """Parse USLCI processes from full ZIP → dict of NAICS code → list of process data."""
    zip_path = os.path.join(ROOT_DIR, 'National_Renewable_Energy_Laboratory-USLCI_Database_Public.zip')
    if not os.path.exists(zip_path):
        # Fall back to metadata-only JSON
        print("  USLCI ZIP not found, falling back to metadata-only uslci-processes.json")
        return parse_uslci_processes_legacy()

    print(f"  Reading USLCI ZIP: {zip_path}")
    z = zipfile.ZipFile(zip_path)
    process_files = [n for n in z.namelist() if n.startswith('processes/') and n.endswith('.json')]
    print(f"  Found {len(process_files)} process files")

    naics_to_processes = {}
    total_with_ghg = 0

    for pf in process_files:
        content = json.loads(z.read(pf))
        name = content.get('name', '')
        category = content.get('category', '')

        # Extract NAICS codes from category (format: "11: Agriculture.../1111: Oilseed...")
        naics_codes = re.findall(r'(\d{4,6}):', category)

        # Find reference product unit and amount
        ref_unit = '?'
        ref_amount = 1.0
        for ex in content.get('exchanges', []):
            flow = ex.get('flow', {})
            if not ex.get('isInput') and flow.get('flowType') == 'PRODUCT_FLOW':
                ref_unit = ex.get('unit', {}).get('name', '?')
                ref_amount = ex.get('amount', 1.0)
                break

        # Sum GHG emissions (output elementary flows to air)
        total_co2e = 0
        for ex in content.get('exchanges', []):
            if ex.get('isInput'):
                continue
            flow = ex.get('flow', {})
            flow_cat = flow.get('category', '').lower()
            if 'elementary' not in flow_cat or 'emission' not in flow_cat:
                continue
            flow_name = flow.get('name', '').lower()
            for ghg_name, gwp in GWP.items():
                if ghg_name in flow_name:
                    val = abs(ex.get('amount', 0))
                    total_co2e += val * gwp
                    break

        # Normalize to per-unit if ref_amount != 1
        if ref_amount != 0 and ref_amount != 1.0:
            total_co2e = total_co2e / abs(ref_amount)

        if total_co2e > 0:
            total_with_ghg += 1

        proc_data = {
            'name': name,
            'ghg': total_co2e,
            'unit': ref_unit,
        }

        for code in naics_codes:
            if len(code) >= 4:
                naics_to_processes.setdefault(code, []).append(proc_data)

    z.close()
    print(f"  Processes with GHG data: {total_with_ghg}")
    return naics_to_processes, len(process_files), total_with_ghg


def parse_uslci_processes_legacy():
    """Legacy fallback: parse metadata-only uslci-processes.json."""
    path = os.path.join(RAW_DIR, 'uslci-processes.json')
    with open(path, 'r', encoding='utf-8') as f:
        processes = json.load(f)

    naics_to_processes = {}
    for p in processes:
        category = p.get('category', '')
        matches = re.findall(r'(\d{4,6}):', category)
        for code in matches:
            if len(code) >= 4:
                naics_to_processes.setdefault(code, []).append({
                    'name': p.get('name', ''),
                    'ghg': 0,
                    'unit': '?',
                })

    return naics_to_processes, len(processes), 0


def parse_census_concordance_reverse(naics_codes):
    """Parse Census imp-code.txt → dict of HS-6 → set of matching NAICS codes.
    Also returns hs_to_naics6: HS-6 → set of actual 6-digit NAICS codes matched,
    and naics4_to_naics6: NAICS-4 → set of 6-digit sub-codes seen in Census data.
    """
    path = os.path.join(RAW_DIR, 'imp-code.txt')
    hs_to_naics = {}
    hs_to_naics6 = {}  # HS-6 → set of actual 6-digit NAICS codes that matched
    naics4_to_naics6 = defaultdict(set)  # NAICS-4 → all 6-digit sub-codes in Census
    naics4_prefixes = {n for n in naics_codes if len(n) == 4}
    with open(path, 'r', encoding='ascii', errors='ignore') as f:
        for line in f:
            if len(line) < 271:
                continue
            hts10 = line[0:10].strip()
            naics6 = line[265:271].strip()
            if not hts10 or not naics6 or not hts10[:6].isdigit() or not naics6.isdigit():
                continue
            hs6 = hts10[:6]
            # Track all 6-digit sub-codes for each NAICS-4 prefix in Census
            prefix4 = naics6[:4]
            if prefix4 in naics4_prefixes:
                naics4_to_naics6[prefix4].add(naics6)
            for n in naics_codes:
                if naics6.startswith(n):
                    hs_to_naics.setdefault(hs6, set()).add(n)
                    hs_to_naics6.setdefault(hs6, set()).add(naics6)
    return hs_to_naics, hs_to_naics6, naics4_to_naics6


def generate():
    print("=== Generating USLCI coverage data ===")

    print("  Parsing USLCI processes...")
    result = parse_uslci_from_zip()
    naics_to_processes, total_processes, total_with_ghg = result
    naics_codes = set(naics_to_processes.keys())
    print(f"  Found {total_processes} processes with {len(naics_codes)} unique NAICS codes")

    print("  Building NAICS->HS-6 mapping from Census concordance...")
    hs_to_naics, hs_to_naics6, naics4_to_naics6 = parse_census_concordance_reverse(naics_codes)
    print(f"  Found {len(hs_to_naics)} HS-6 codes with USLCI coverage")

    # Build output with emission factor data
    coverage = {}
    broad_count = 0
    for hs6, naics_set in hs_to_naics.items():
        codes = sorted(naics_set)

        # Determine if this is a "broad" prefix match:
        # A match is broad if any NAICS-4 code fans out to multiple NAICS-6
        # sub-codes in Census, and NOT all of those sub-codes map to this HS-6.
        # E.g., NAICS 1112 has sub-codes 111211 (Potato) and 111219 (Other Veg/Melon).
        # HS 080711 (watermelon) only maps via 111219, not 111211, so we can't be sure
        # that a USLCI process tagged NAICS 1112 actually belongs here.
        actual_naics6 = hs_to_naics6.get(hs6, set())
        is_broad = False
        for n in codes:
            if len(n) <= 5:
                all_sub = naics4_to_naics6.get(n[:4], set())
                if len(all_sub) > 1:
                    # Check: do ALL sub-codes under this NAICS-4 map to this HS-6?
                    # If not, the match is ambiguous.
                    if not all_sub.issubset(actual_naics6):
                        is_broad = True
                        break

        if is_broad:
            broad_count += 1

        # Collect all processes for this HS-6
        all_procs = []
        for n in codes:
            all_procs.extend(naics_to_processes.get(n, []))

        process_count = len(all_procs)
        procs_with_ghg = [p for p in all_procs if p['ghg'] > 0]

        # Group by unit and compute stats
        by_unit = defaultdict(list)
        for p in procs_with_ghg:
            by_unit[p['unit']].append(p['ghg'])

        unit_stats = {}
        for unit, values in by_unit.items():
            values.sort()
            s = sum(values)
            unit_stats[unit] = {
                'count': len(values),
                'min': round(values[0], 6),
                'max': round(values[-1], 6),
                'avg': round(s / len(values), 6),
                'median': round(values[len(values) // 2], 6),
            }

        # Top 10 processes by GHG (descending)
        procs_with_ghg.sort(key=lambda p: p['ghg'], reverse=True)
        top_processes = [{
            'name': p['name'],
            'ghg': round(p['ghg'], 6),
            'unit': p['unit'],
        } for p in procs_with_ghg[:10]]

        entry = {
            'naicsCodes': codes,
            'processCount': process_count,
            'withGhgData': len(procs_with_ghg),
            'unitStats': unit_stats,
            'topProcesses': top_processes,
        }
        if is_broad:
            entry['broad'] = True
        coverage[hs6] = entry

    print(f"  Broad (ambiguous NAICS prefix) matches: {broad_count} / {len(coverage)}")

    output = {
        'coverage': coverage,
        'stats': {
            'totalProcesses': total_processes,
            'totalWithGhg': total_with_ghg,
            'uniqueNaicsCodes': len(naics_codes),
            'coveredHs6Codes': len(coverage),
            'source': 'NREL U.S. Life Cycle Inventory Database (USLCI)',
            'note': 'GHG values are DIRECT process emissions only (not full supply chain). Uses GWP-100 from IPCC AR6.',
        },
    }

    out_path = os.path.join(OUT_DIR, 'uslci-coverage.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False)
    size = os.path.getsize(out_path)
    print(f"  Wrote uslci-coverage.json: {size:,} bytes")
    print(f"  {len(coverage)} HS-6 codes covered by USLCI processes")
    covered_with_ghg = sum(1 for v in coverage.values() if v['withGhgData'] > 0)
    print(f"  {covered_with_ghg} HS-6 codes with actual GHG emission data")


if __name__ == '__main__':
    generate()
