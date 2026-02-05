"""
Generate tree and lookup JSON files for all 5 taxonomies:
  HS (international), CPC, CN (EU), HTS (US), Canadian Customs Tariff

Reads raw data from ../raw-data/ and writes JSON to ../app/public/data/
"""

import csv
import json
import os
import re
import sys

RAW_DIR = os.path.join(os.path.dirname(__file__), '..', 'raw-data')
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'app', 'public', 'data')

os.makedirs(OUT_DIR, exist_ok=True)


def write_json(filename, data):
    path = os.path.join(OUT_DIR, filename)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False)
    size = os.path.getsize(path)
    print(f"  Wrote {filename}: {size:,} bytes")


# ─────────────────────────────────────────────
# 1. HS (Harmonized System)
# ─────────────────────────────────────────────
def generate_hs():
    print("\n=== Generating HS data ===")

    # Load sections
    sections = {}
    with open(os.path.join(RAW_DIR, 'hs-sections.csv'), 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            sections[row['section'].strip()] = row['name'].strip()

    # Load codes
    codes = []
    with open(os.path.join(RAW_DIR, 'hs-codes.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            codes.append(row)

    # Build chapter -> section mapping
    chapter_to_section = {}
    for code in codes:
        if code['level'] == '2':  # chapter
            chapter_to_section[code['hscode']] = code['section']

    # Build tree
    tree = []
    section_nodes = {}  # section roman -> node
    chapter_nodes = {}  # chapter code -> node
    heading_nodes = {}  # heading code -> node

    # Create section nodes
    for section_roman, section_name in sections.items():
        node = {
            'id': f'hs-section-{section_roman}',
            'code': section_roman,
            'name': section_name.title() if section_name[0].islower() else section_name,
            'type': 'section',
            'children': []
        }
        section_nodes[section_roman] = node
        tree.append(node)

    # Process codes
    for code in codes:
        level = code['level']
        hscode = code['hscode']
        desc = code['description']
        section = code['section']
        parent = code['parent']

        if level == '2':  # chapter
            node = {
                'id': f'hs-{hscode}',
                'code': hscode,
                'name': desc,
                'type': 'chapter',
                'children': []
            }
            chapter_nodes[hscode] = node
            if section in section_nodes:
                section_nodes[section]['children'].append(node)
        elif level == '4':  # heading
            node = {
                'id': f'hs-{hscode}',
                'code': hscode,
                'name': desc,
                'type': 'heading',
                'children': []
            }
            heading_nodes[hscode] = node
            if parent in chapter_nodes:
                chapter_nodes[parent]['children'].append(node)
        elif level == '6' or level == '5':  # subheading
            node = {
                'id': f'hs-{hscode}',
                'code': hscode,
                'name': desc,
                'type': 'subheading'
            }
            if parent in heading_nodes:
                heading_nodes[parent]['children'].append(node)

    # Remove empty children arrays from leaf nodes
    def clean_tree(nodes):
        for node in nodes:
            if 'children' in node:
                if len(node['children']) == 0:
                    del node['children']
                else:
                    clean_tree(node['children'])

    clean_tree(tree)

    # Build lookup
    lookup = {}
    for code in codes:
        hscode = code['hscode']
        section = code['section']
        level_map = {'2': 'chapter', '4': 'heading', '5': 'subheading', '6': 'subheading'}
        lookup[hscode] = {
            'code': hscode,
            'description': code['description'],
            'section': section,
            'sectionName': sections.get(section, ''),
            'level': int(code['level']),
            'type': level_map.get(code['level'], 'unknown')
        }

    write_json('hs-tree.json', tree)
    write_json('hs-lookup.json', lookup)
    print(f"  HS: {len(tree)} sections, {len(codes)} total codes")


# ─────────────────────────────────────────────
# 2. CPC (Central Product Classification)
# ─────────────────────────────────────────────
def generate_cpc():
    print("\n=== Generating CPC data ===")

    codes = []
    with open(os.path.join(RAW_DIR, 'cpc-structure.txt'), 'r', encoding='latin-1') as f:
        reader = csv.reader(f)
        next(reader)  # skip header
        for row in reader:
            if len(row) >= 2:
                codes.append({'code': row[0].strip(), 'title': row[1].strip()})

    level_names = {1: 'section', 2: 'division', 3: 'group', 4: 'class', 5: 'subclass'}

    # Build tree
    tree = []
    nodes_by_code = {}

    for entry in codes:
        code = entry['code']
        title = entry['title']
        level = len(code)
        type_name = level_names.get(level, 'item')

        node = {
            'id': f'cpc-{code}',
            'code': code,
            'name': title,
            'type': type_name,
        }

        if level < 5:
            node['children'] = []

        nodes_by_code[code] = node

        if level == 1:
            tree.append(node)
        else:
            parent_code = code[:-1]
            if parent_code in nodes_by_code:
                parent = nodes_by_code[parent_code]
                if 'children' not in parent:
                    parent['children'] = []
                parent['children'].append(node)

    # Clean empty children
    def clean_tree(nodes):
        for node in nodes:
            if 'children' in node:
                if len(node['children']) == 0:
                    del node['children']
                else:
                    clean_tree(node['children'])

    clean_tree(tree)

    # Build lookup
    lookup = {}
    for entry in codes:
        code = entry['code']
        level = len(code)
        # Find section
        section_code = code[0] if code else ''
        section_name = ''
        if section_code in nodes_by_code:
            section_name = nodes_by_code[section_code]['name']

        lookup[code] = {
            'code': code,
            'description': entry['title'],
            'section': section_code,
            'sectionName': section_name,
            'level': level,
            'type': level_names.get(level, 'item')
        }

    write_json('cpc-tree.json', tree)
    write_json('cpc-lookup.json', lookup)
    print(f"  CPC: {len(tree)} sections, {len(codes)} total codes")


# ─────────────────────────────────────────────
# 3. CN (EU Combined Nomenclature)
# ─────────────────────────────────────────────
def generate_cn():
    print("\n=== Generating CN data ===")
    try:
        import openpyxl
    except ImportError:
        print("  ERROR: openpyxl not installed. Run: pip install openpyxl")
        return

    wb = openpyxl.load_workbook(os.path.join(RAW_DIR, 'cn-2025.xlsx'))
    ws = wb[wb.sheetnames[0]]

    rows = []
    for row in ws.iter_rows(min_row=2, values_only=True):  # skip header
        cnkey, cn, dashes, dm, su = row[0], row[1], row[2], row[3], row[4] if len(row) > 4 else None
        if dm:
            rows.append({
                'cnkey': str(cnkey) if cnkey else '',
                'cn': str(cn).strip() if cn else '',
                'dashes': str(dashes).strip() if dashes else '',
                'description': str(dm).strip(),
                'su': str(su).strip() if su else ''
            })

    # Parse CN codes and build tree
    tree = []
    section_nodes = {}
    chapter_nodes = {}
    heading_nodes = {}
    subheading_nodes = {}
    cn8_nodes = {}

    # HS section mapping (chapter -> section)
    hs_sections = {}
    with open(os.path.join(RAW_DIR, 'hs-sections.csv'), 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            hs_sections[row['section'].strip()] = row['name'].strip()

    current_section = None

    for row in rows:
        cn_code = row['cn']
        desc = row['description']
        dashes = row['dashes']

        # Skip the overall title row
        if cn_code == '' and dashes == '' and 'COMBINED NOMENCLATURE' in desc:
            continue

        # Section (Roman numeral)
        if cn_code and re.match(r'^[IVX]+$', cn_code):
            current_section = cn_code
            section_name = desc
            # Clean up section name (remove "SECTION I - " prefix)
            section_name = re.sub(r'^SECTION\s+[IVX]+\s*[-–]\s*', '', section_name)
            node = {
                'id': f'cn-section-{cn_code}',
                'code': cn_code,
                'name': section_name,
                'type': 'section',
                'children': []
            }
            section_nodes[cn_code] = node
            tree.append(node)
            continue

        # Chapter (2-digit)
        if cn_code and re.match(r'^\d{2}$', cn_code):
            chapter_name = desc
            # Clean up "CHAPTER X - " prefix
            chapter_name = re.sub(r'^CHAPTER\s+\d+\s*[-–]\s*', '', chapter_name)
            node = {
                'id': f'cn-{cn_code}',
                'code': cn_code,
                'name': chapter_name,
                'type': 'chapter',
                'children': []
            }
            chapter_nodes[cn_code] = node
            if current_section and current_section in section_nodes:
                section_nodes[current_section]['children'].append(node)
            continue

        # Heading (4-digit)
        if cn_code and re.match(r'^\d{4}$', cn_code):
            node = {
                'id': f'cn-{cn_code}',
                'code': cn_code,
                'name': desc,
                'type': 'heading',
                'children': []
            }
            heading_nodes[cn_code] = node
            chapter = cn_code[:2]
            if chapter in chapter_nodes:
                chapter_nodes[chapter]['children'].append(node)
            continue

        # 6-digit subheading (format: "0101 21" or "0101 29")
        clean_cn = cn_code.replace(' ', '')
        if cn_code and re.match(r'^\d{4}\s+\d{2}$', cn_code):
            node = {
                'id': f'cn-{clean_cn}',
                'code': clean_cn,
                'name': desc,
                'type': 'subheading',
                'children': []
            }
            subheading_nodes[clean_cn] = node
            heading = clean_cn[:4]
            if heading in heading_nodes:
                heading_nodes[heading]['children'].append(node)
            continue

        # 8-digit CN code (format: "0101 21 00")
        if cn_code and re.match(r'^\d{4}\s+\d{2}\s+\d{2}$', cn_code):
            node = {
                'id': f'cn-{clean_cn}',
                'code': clean_cn,
                'name': desc,
                'type': 'cn8'
            }
            cn8_nodes[clean_cn] = node
            subheading = clean_cn[:6]
            if subheading in subheading_nodes:
                subheading_nodes[subheading]['children'].append(node)
            elif clean_cn[:4] in heading_nodes:
                heading_nodes[clean_cn[:4]]['children'].append(node)
            continue

    # Clean empty children
    def clean_tree(nodes):
        for node in nodes:
            if 'children' in node:
                if len(node['children']) == 0:
                    del node['children']
                else:
                    clean_tree(node['children'])

    clean_tree(tree)

    # Build lookup
    lookup = {}

    def add_to_lookup(nodes, section='', section_name=''):
        for node in nodes:
            if node['type'] == 'section':
                section = node['code']
                section_name = node['name']
            code = node['code']
            level_map = {'section': 1, 'chapter': 2, 'heading': 4, 'subheading': 6, 'cn8': 8}
            lookup[code] = {
                'code': code,
                'description': node['name'],
                'section': section,
                'sectionName': section_name,
                'level': level_map.get(node['type'], 0),
                'type': node['type']
            }
            if 'children' in node:
                add_to_lookup(node['children'], section, section_name)

    add_to_lookup(tree)

    write_json('cn-tree.json', tree)
    write_json('cn-lookup.json', lookup)
    count = sum(1 for _ in lookup)
    print(f"  CN: {len(tree)} sections, {count} total codes")


# ─────────────────────────────────────────────
# 4. HTS (US Harmonized Tariff Schedule)
# ─────────────────────────────────────────────
def generate_hts():
    print("\n=== Generating HTS data ===")

    with open(os.path.join(RAW_DIR, 'hts-2026.json'), 'r', encoding='utf-8') as f:
        raw = json.load(f)

    # Load HS sections for section-level grouping
    hs_sections = {}
    with open(os.path.join(RAW_DIR, 'hs-sections.csv'), 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            hs_sections[row['section'].strip()] = row['name'].strip()

    # HS chapter to section mapping
    chapter_to_section = {
        '01': 'I', '02': 'I', '03': 'I', '04': 'I', '05': 'I',
        '06': 'II', '07': 'II', '08': 'II', '09': 'II', '10': 'II', '11': 'II', '12': 'II', '13': 'II', '14': 'II',
        '15': 'III',
        '16': 'IV', '17': 'IV', '18': 'IV', '19': 'IV', '20': 'IV', '21': 'IV', '22': 'IV', '23': 'IV', '24': 'IV',
        '25': 'V', '26': 'V', '27': 'V',
        '28': 'VI', '29': 'VI', '30': 'VI', '31': 'VI', '32': 'VI', '33': 'VI', '34': 'VI', '35': 'VI', '36': 'VI', '37': 'VI', '38': 'VI',
        '39': 'VII', '40': 'VII',
        '41': 'VIII', '42': 'VIII', '43': 'VIII',
        '44': 'IX', '45': 'IX', '46': 'IX',
        '47': 'X', '48': 'X', '49': 'X',
        '50': 'XI', '51': 'XI', '52': 'XI', '53': 'XI', '54': 'XI', '55': 'XI', '56': 'XI', '57': 'XI', '58': 'XI', '59': 'XI', '60': 'XI', '61': 'XI', '62': 'XI', '63': 'XI',
        '64': 'XII', '65': 'XII', '66': 'XII', '67': 'XII',
        '68': 'XIII', '69': 'XIII', '70': 'XIII',
        '71': 'XIV',
        '72': 'XV', '73': 'XV', '74': 'XV', '75': 'XV', '76': 'XV', '78': 'XV', '79': 'XV', '80': 'XV', '81': 'XV', '82': 'XV', '83': 'XV',
        '84': 'XVI', '85': 'XVI',
        '86': 'XVII', '87': 'XVII', '88': 'XVII', '89': 'XVII',
        '90': 'XVIII', '91': 'XVIII', '92': 'XVIII',
        '93': 'XIX',
        '94': 'XX', '95': 'XX', '96': 'XX',
        '97': 'XXI',
        '98': 'XXII', '99': 'XXII',
    }

    # Build tree using indent-based hierarchy
    tree = []
    section_nodes = {}
    # Stack to track parent at each indent level
    stack = []  # list of (indent_level, node)

    # First pass: create section nodes
    for section_roman, section_name in hs_sections.items():
        node = {
            'id': f'hts-section-{section_roman}',
            'code': section_roman,
            'name': section_name.title() if section_name[0].islower() else section_name,
            'type': 'section',
            'children': []
        }
        section_nodes[section_roman] = node
        tree.append(node)

    # Add US-specific sections for chapters 98-99
    if 'XXII' not in section_nodes:
        node = {
            'id': 'hts-section-XXII',
            'code': 'XXII',
            'name': 'Special Classification Provisions',
            'type': 'section',
            'children': []
        }
        section_nodes['XXII'] = node
        tree.append(node)

    # Second pass: process HTS entries
    current_chapter = None
    chapter_nodes_map = {}

    for item in raw:
        htsno = item.get('htsno', '').strip()
        indent = int(item.get('indent', 0))
        desc = item.get('description', '').strip()
        superior = item.get('superior')

        if not desc:
            continue

        # Clean description - remove trailing colons
        clean_desc = desc.rstrip(':').strip()

        # Determine code and type
        if htsno:
            clean_code = htsno.replace('.', '')
            code_len = len(clean_code)
        else:
            clean_code = ''
            code_len = 0

        # Determine node type
        if code_len == 4:
            node_type = 'heading'
            current_chapter = clean_code[:2]
        elif code_len == 6:
            node_type = 'subheading'
        elif code_len == 8:
            node_type = 'tariff_8'
        elif code_len == 10:
            node_type = 'tariff_10'
        else:
            node_type = 'group'

        # Create node
        node_id = f'hts-{clean_code}' if clean_code else f'hts-group-{len(stack)}-{hash(desc) % 100000}'
        node = {
            'id': node_id,
            'code': htsno if htsno else '',
            'name': clean_desc,
            'type': node_type,
        }

        # For headings and groups, add children array
        if superior or node_type in ('heading', 'subheading', 'group'):
            node['children'] = []

        # Find parent based on indent level
        # Pop stack until we find a parent with lower indent
        while stack and stack[-1][0] >= indent:
            stack.pop()

        if stack:
            parent_node = stack[-1][1]
            if 'children' not in parent_node:
                parent_node['children'] = []
            parent_node['children'].append(node)
        else:
            # Top-level: attach to section
            if current_chapter is None and code_len >= 2:
                current_chapter = clean_code[:2]
            section = chapter_to_section.get(current_chapter or clean_code[:2], 'I')
            if section in section_nodes:
                section_nodes[section]['children'].append(node)

        # Push to stack if this node can have children
        if 'children' in node:
            stack.append((indent, node))

    # Clean empty children
    def clean_tree(nodes):
        for node in nodes:
            if 'children' in node:
                if len(node['children']) == 0:
                    del node['children']
                else:
                    clean_tree(node['children'])

    clean_tree(tree)

    # Build lookup
    lookup = {}

    def add_to_lookup(nodes, section='', section_name=''):
        for node in nodes:
            if node['type'] == 'section':
                section = node['code']
                section_name = node['name']
            code = node['code']
            if code and node['type'] != 'section':
                lookup[code] = {
                    'code': code,
                    'description': node['name'],
                    'section': section,
                    'sectionName': section_name,
                    'level': len(code.replace('.', '')),
                    'type': node['type']
                }
            if 'children' in node:
                add_to_lookup(node['children'], section, section_name)

    add_to_lookup(tree)

    write_json('hts-tree.json', tree)
    write_json('hts-lookup.json', lookup)
    print(f"  HTS: {len(tree)} sections, {len(lookup)} total codes in lookup")


# ─────────────────────────────────────────────
# 5. Canadian Customs Tariff
# ─────────────────────────────────────────────
def generate_canadian():
    print("\n=== Generating Canadian Tariff data ===")

    try:
        import pyodbc
    except ImportError:
        print("  ERROR: pyodbc not installed. Run: pip install pyodbc")
        return

    dbpath = os.path.join(RAW_DIR, '01-99-2025-0-eng.accdb')
    dbpath = os.path.abspath(dbpath)
    driver = 'Microsoft Access Driver (*.mdb, *.accdb)'
    conn = pyodbc.connect(f'Driver={{{driver}}};DBQ={dbpath};')
    cursor = conn.cursor()
    cursor.execute('SELECT TARIFF, DESC1, DESC2, DESC3 FROM TPHS ORDER BY TARIFF')

    rows = []
    for row in cursor.fetchall():
        tariff = str(row[0]).strip() if row[0] else ''
        desc1 = str(row[1]).strip() if row[1] else ''
        desc2 = str(row[2]).strip() if row[2] else ''
        desc3 = str(row[3]).strip() if row[3] else ''
        desc = desc1
        if desc2 and desc2 != 'None':
            desc += ' ' + desc2
        if desc3 and desc3 != 'None':
            desc += ' ' + desc3
        if tariff and desc:
            rows.append({'tariff': tariff, 'description': desc.strip()})

    conn.close()

    # Load HS sections
    hs_sections = {}
    with open(os.path.join(RAW_DIR, 'hs-sections.csv'), 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            hs_sections[row['section'].strip()] = row['name'].strip()

    chapter_to_section = {
        '01': 'I', '02': 'I', '03': 'I', '04': 'I', '05': 'I',
        '06': 'II', '07': 'II', '08': 'II', '09': 'II', '10': 'II', '11': 'II', '12': 'II', '13': 'II', '14': 'II',
        '15': 'III',
        '16': 'IV', '17': 'IV', '18': 'IV', '19': 'IV', '20': 'IV', '21': 'IV', '22': 'IV', '23': 'IV', '24': 'IV',
        '25': 'V', '26': 'V', '27': 'V',
        '28': 'VI', '29': 'VI', '30': 'VI', '31': 'VI', '32': 'VI', '33': 'VI', '34': 'VI', '35': 'VI', '36': 'VI', '37': 'VI', '38': 'VI',
        '39': 'VII', '40': 'VII',
        '41': 'VIII', '42': 'VIII', '43': 'VIII',
        '44': 'IX', '45': 'IX', '46': 'IX',
        '47': 'X', '48': 'X', '49': 'X',
        '50': 'XI', '51': 'XI', '52': 'XI', '53': 'XI', '54': 'XI', '55': 'XI', '56': 'XI', '57': 'XI', '58': 'XI', '59': 'XI', '60': 'XI', '61': 'XI', '62': 'XI', '63': 'XI',
        '64': 'XII', '65': 'XII', '66': 'XII', '67': 'XII',
        '68': 'XIII', '69': 'XIII', '70': 'XIII',
        '71': 'XIV',
        '72': 'XV', '73': 'XV', '74': 'XV', '75': 'XV', '76': 'XV', '78': 'XV', '79': 'XV', '80': 'XV', '81': 'XV', '82': 'XV', '83': 'XV',
        '84': 'XVI', '85': 'XVI',
        '86': 'XVII', '87': 'XVII', '88': 'XVII', '89': 'XVII',
        '90': 'XVIII', '91': 'XVIII', '92': 'XVIII',
        '93': 'XIX',
        '94': 'XX', '95': 'XX', '96': 'XX',
        '97': 'XXI',
        '98': 'XXII', '99': 'XXII',
    }

    # Build tree
    tree = []
    section_nodes = {}
    chapter_nodes_map = {}
    heading_nodes_map = {}
    subheading_nodes_map = {}
    tariff8_nodes_map = {}

    # Create section nodes
    for section_roman, section_name in hs_sections.items():
        node = {
            'id': f'ca-section-{section_roman}',
            'code': section_roman,
            'name': section_name.title() if section_name[0].islower() else section_name,
            'type': 'section',
            'children': []
        }
        section_nodes[section_roman] = node
        tree.append(node)

    # Add special section for ch 98-99
    if 'XXII' not in section_nodes:
        node = {
            'id': 'ca-section-XXII',
            'code': 'XXII',
            'name': 'Special Classification Provisions',
            'type': 'section',
            'children': []
        }
        section_nodes['XXII'] = node
        tree.append(node)

    for row in rows:
        tariff = row['tariff']
        desc = row['description']

        # Remove dots and determine level
        clean = tariff.replace('.', '')
        parts = tariff.split('.')

        # Determine type based on code structure
        if re.match(r'^\d{2}\.\d{2}$', tariff):
            # Heading: 01.01 -> 0101
            code = clean
            node = {
                'id': f'ca-{code}',
                'code': tariff,
                'name': desc,
                'type': 'heading',
                'children': []
            }
            heading_nodes_map[code] = node
            chapter = code[:2]
            section = chapter_to_section.get(chapter, 'I')
            # Create chapter node if not exists
            if chapter not in chapter_nodes_map:
                ch_node = {
                    'id': f'ca-{chapter}',
                    'code': chapter,
                    'name': f'Chapter {chapter}',
                    'type': 'chapter',
                    'children': []
                }
                chapter_nodes_map[chapter] = ch_node
                if section in section_nodes:
                    section_nodes[section]['children'].append(ch_node)
            chapter_nodes_map[chapter]['children'].append(node)

        elif re.match(r'^\d{4}\.\d$', tariff):
            # Intermediate grouping like 0101.2 -> group
            heading = clean[:4]
            node = {
                'id': f'ca-group-{clean}',
                'code': tariff,
                'name': desc,
                'type': 'group',
                'children': []
            }
            if heading in heading_nodes_map:
                heading_nodes_map[heading]['children'].append(node)
            # Store for child attachment
            subheading_nodes_map[clean] = node

        elif re.match(r'^\d{4}\.\d{2}\.\d{2}$', tariff):
            # 8-digit: 0101.21.00
            code_8 = clean
            code_6 = clean[:6]
            node = {
                'id': f'ca-{code_8}',
                'code': tariff,
                'name': desc,
                'type': 'subheading',
                'children': []
            }
            tariff8_nodes_map[code_8] = node
            # Find parent: try group first, then heading
            parent_found = False
            # Check for group parent (e.g., 01012 for 01012100)
            for gcode in sorted(subheading_nodes_map.keys(), key=len, reverse=True):
                if code_6.startswith(gcode):
                    subheading_nodes_map[gcode]['children'].append(node)
                    parent_found = True
                    break
            if not parent_found:
                heading = code_8[:4]
                if heading in heading_nodes_map:
                    heading_nodes_map[heading]['children'].append(node)

        elif re.match(r'^\d{4}\.\d{2}\.\d{2}\.\d{2}$', tariff):
            # 10-digit: 0101.21.00.00
            code_10 = clean
            code_8 = clean[:8]
            node = {
                'id': f'ca-{code_10}',
                'code': tariff,
                'name': desc,
                'type': 'tariff_item',
            }
            if code_8 in tariff8_nodes_map:
                tariff8_nodes_map[code_8]['children'].append(node)

    # Clean empty children
    def clean_tree(nodes):
        for node in nodes:
            if 'children' in node:
                if len(node['children']) == 0:
                    del node['children']
                else:
                    clean_tree(node['children'])

    clean_tree(tree)

    # Build lookup
    lookup = {}

    def add_to_lookup(nodes, section='', section_name=''):
        for node in nodes:
            if node['type'] == 'section':
                section = node['code']
                section_name = node['name']
            code = node['code']
            if code and node['type'] != 'section':
                clean = code.replace('.', '')
                lookup[code] = {
                    'code': code,
                    'description': node['name'],
                    'section': section,
                    'sectionName': section_name,
                    'level': len(clean),
                    'type': node['type']
                }
            if 'children' in node:
                add_to_lookup(node['children'], section, section_name)

    add_to_lookup(tree)

    write_json('ca-tree.json', tree)
    write_json('ca-lookup.json', lookup)
    print(f"  Canadian: {len(tree)} sections, {len(lookup)} total codes in lookup")


# ─────────────────────────────────────────────
# Generate concordance (stub - HS <-> CPC)
# ─────────────────────────────────────────────
def generate_concordance():
    print("\n=== Generating concordance data ===")
    # Keep existing concordance structure but empty for now
    concordance = {
        'hsToCpc': {},
        'cpcToHs': {},
        'mappingInfo': {}
    }
    write_json('concordance.json', concordance)


if __name__ == '__main__':
    print("Generating taxonomy data...")
    generate_hs()
    generate_cpc()
    generate_cn()
    generate_hts()
    generate_canadian()
    generate_concordance()
    print("\nDone!")
