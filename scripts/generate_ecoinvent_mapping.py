"""
Generate ecoinvent mapping JSON from the Database Overview Excel file.
Extracts product-to-CPC and product-to-HS mappings from the Cut-Off AO sheet.
"""
import json
import os
from collections import defaultdict

def generate_ecoinvent_mapping():
    import openpyxl

    excel_path = os.path.join(os.path.dirname(__file__), '..', 'raw-data',
                              'Database-Overview-for-ecoinvent-v3.10.xlsx')
    output_path = os.path.join(os.path.dirname(__file__), '..', 'app', 'public', 'data',
                               'ecoinvent-mapping.json')

    print("Loading ecoinvent database overview...")
    wb = openpyxl.load_workbook(excel_path, read_only=True)
    ws = wb['Cut-Off AO']

    # Build product -> CPC code and product -> HS code mappings
    # Each row is an activity producing a reference product with CPC and optional HS classification
    # Column indices (0-based): Reference Product Name=11, CPC=12, HS2017=13
    product_cpc = {}  # product name -> CPC code
    product_hs = {}   # product name -> HS code
    product_cpc_desc = {}  # product name -> CPC description
    product_hs_desc = {}   # product name -> HS description

    row_count = 0
    for row in ws.iter_rows(min_row=2, values_only=True):
        product = str(row[11]).strip() if row[11] else ''
        cpc_raw = str(row[12]).strip() if row[12] else ''
        hs_raw = str(row[13]).strip() if row[13] else ''

        if not product or product == 'None':
            continue

        # Parse CPC: format is "34110: Hydrocarbons and their..."
        if cpc_raw and cpc_raw != 'None':
            parts = cpc_raw.split(':', 1)
            cpc_code = parts[0].strip()
            cpc_desc = parts[1].strip() if len(parts) > 1 else ''
            product_cpc[product] = cpc_code
            product_cpc_desc[product] = cpc_desc

        # Parse HS: format is "440729: Wood, tropical..." or empty
        if hs_raw and hs_raw != 'None':
            parts = hs_raw.split(':', 1)
            hs_code = parts[0].strip()
            hs_desc = parts[1].strip() if len(parts) > 1 else ''
            product_hs[product] = hs_code
            product_hs_desc[product] = hs_desc

        row_count += 1

    wb.close()
    print(f"  Processed {row_count} rows, {len(product_cpc)} unique products with CPC, {len(product_hs)} with HS")

    # Build reverse maps: code -> list of products
    cpc_to_products = defaultdict(list)
    hs_to_products = defaultdict(list)

    for product, code in product_cpc.items():
        cpc_to_products[code].append(product)
    for product, code in product_hs.items():
        hs_to_products[code].append(product)

    # Build output: for each CPC/HS code, mapping info
    cpc_mappings = {}
    for code, products in sorted(cpc_to_products.items()):
        n = len(products)
        cpc_mappings[code] = {
            "products": sorted(products),
            "count": n,
            "mappingType": "1:1" if n == 1 else f"{n}:1",
        }

    hs_mappings = {}
    for code, products in sorted(hs_to_products.items()):
        n = len(products)
        hs_mappings[code] = {
            "products": sorted(products),
            "count": n,
            "mappingType": "1:1" if n == 1 else f"{n}:1",
        }

    # Also build ancestor coverage: for each CPC/HS code, propagate up to parents
    # CPC: 5-digit -> 4-digit -> 3-digit -> 2-digit -> 1-digit (section)
    # HS: 6-digit -> 4-digit -> 2-digit
    cpc_ancestors = set()
    for code in cpc_to_products:
        for length in range(1, len(code)):
            cpc_ancestors.add(code[:length])

    hs_ancestors = set()
    for code in hs_to_products:
        for length in range(1, len(code)):
            hs_ancestors.add(code[:length])

    result = {
        "cpc": cpc_mappings,
        "hs": hs_mappings,
        "cpcAncestors": sorted(cpc_ancestors),
        "hsAncestors": sorted(hs_ancestors),
        "stats": {
            "totalProducts": len(set(product_cpc.keys()) | set(product_hs.keys())),
            "productsWithCpc": len(product_cpc),
            "productsWithHs": len(product_hs),
            "uniqueCpcCodes": len(cpc_to_products),
            "uniqueHsCodes": len(hs_to_products),
        }
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False)

    file_size = os.path.getsize(output_path) / 1024 / 1024
    print(f"  Output: {output_path} ({file_size:.1f} MB)")
    print(f"  Stats: {result['stats']}")
    print(f"  CPC codes with mappings: {len(cpc_mappings)}")
    print(f"  HS codes with mappings: {len(hs_mappings)}")
    print(f"  CPC ancestor codes: {len(cpc_ancestors)}")
    print(f"  HS ancestor codes: {len(hs_ancestors)}")


if __name__ == '__main__':
    generate_ecoinvent_mapping()
