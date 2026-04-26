"""
Build a draft "USEEIO trunk → UNSPSC branches → ECOINVENT/BAFU leaves"
backbone taxonomy from the embedding-derived nearest-neighbor mappings.

For each USEEIO sector, attach the UNSPSC entries whose closest USEEIO
match is that sector. For each of those UNSPSC entries, attach the
ECOINVENT and BAFU process entities whose closest UNSPSC match is that
UNSPSC. Children at each level are sorted by similarity (best first) so
the strongest-confidence matches surface immediately.

Inputs:
  app/public/data/lca-mappings/UNSPSC2USEEIO.json   (UNSPSC -> best USEEIO)
  app/public/data/lca-mappings/EI2UNSPSC.json       (ECOINVENT -> best UNSPSC)
  app/public/data/lca-mappings/BAFU2UNSPSC.json     (BAFU -> best UNSPSC)

Outputs:
  app/public/data/t3-tree.json
  app/public/data/t3-lookup.json
"""

import json
import os
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAPS_DIR = ROOT / "app" / "public" / "data" / "lca-mappings"
OUT_DIR = ROOT / "app" / "public" / "data"


def load(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def main():
    unspsc2useeio = load(MAPS_DIR / "UNSPSC2USEEIO.json")
    ei2unspsc = load(MAPS_DIR / "EI2UNSPSC.json")
    bafu2unspsc = load(MAPS_DIR / "BAFU2UNSPSC.json")

    # USEEIO sector entries (toPath, toName) — gather unique
    useeio_entries = {}  # path -> {name}
    for r in unspsc2useeio["rows"]:
        useeio_entries.setdefault(r["toPath"], {"name": r["toName"]})

    # UNSPSC entries grouped under their parent USEEIO sector
    unspsc_under_useeio = defaultdict(list)  # useeio_path -> [(unspsc_path, name, sim, level_label)]
    unspsc_meta = {}  # unspsc_path -> {name, level_label, useeio_parent, sim}
    for r in unspsc2useeio["rows"]:
        u_path = r["fromPath"]
        u_name = r["fromName"]
        useeio_path = r["toPath"]
        sim = r["similarity"]
        level_label = r.get("fromProduct", "")
        unspsc_meta[u_path] = {
            "name": u_name, "level_label": level_label,
            "useeio_parent": useeio_path, "sim": sim,
        }
        unspsc_under_useeio[useeio_path].append((u_path, u_name, sim, level_label))

    # ECOINVENT + BAFU entries grouped under their parent UNSPSC
    ei_under_unspsc = defaultdict(list)
    for r in ei2unspsc["rows"]:
        ei_under_unspsc[r["toPath"]].append({
            "path": r["fromPath"], "name": r["fromName"],
            "geo": r.get("fromGeo", ""), "product": r.get("fromProduct", ""),
            "sim": r["similarity"], "origin": "ei",
        })
    bafu_under_unspsc = defaultdict(list)
    for r in bafu2unspsc["rows"]:
        bafu_under_unspsc[r["toPath"]].append({
            "path": r["fromPath"], "name": r["fromName"],
            "geo": r.get("fromGeo", ""), "product": r.get("fromProduct", ""),
            "sim": r["similarity"], "origin": "bafu",
        })

    # Build the tree
    tree = []
    lookup = {}
    used_ids = set()

    def make_id(prefix, base):
        nid = f"{prefix}{base}"
        if nid not in used_ids:
            used_ids.add(nid)
            return nid
        i = 2
        while f"{nid}-d{i}" in used_ids:
            i += 1
        nid2 = f"{nid}-d{i}"
        used_ids.add(nid2)
        return nid2

    # Stable order: USEEIO sectors sorted by code (everything after the dash)
    useeio_sorted = sorted(
        useeio_entries.items(),
        key=lambda kv: kv[0].split("-", 1)[1] if "-" in kv[0] else kv[0],
    )

    for useeio_path, useeio_info in useeio_sorted:
        useeio_code = useeio_path.split("-", 1)[1] if "-" in useeio_path else useeio_path
        useeio_name = useeio_info["name"]
        useeio_id = make_id("t3-", useeio_code)
        lookup[useeio_id] = {
            "code": useeio_code, "description": useeio_name,
            "level": 1, "type": "useeio_sector", "origin": "useeio",
            "section": "USEEIO", "sectionName": "USEEIO Industries",
        }

        # Children: UNSPSC under this sector, sorted by similarity desc
        unspsc_children = sorted(
            unspsc_under_useeio.get(useeio_path, []),
            key=lambda t: -t[2],
        )

        unspsc_node_list = []
        for u_path, u_name, sim, level_label in unspsc_children:
            u_code = u_path.split("-", 1)[1] if "-" in u_path else u_path
            u_id = make_id("t3-u-", u_code)
            lookup[u_id] = {
                "code": u_code, "description": u_name,
                "level": 2, "type": level_label.split(" ")[0] if level_label else "unspsc",
                "origin": "unspsc", "section": "USEEIO",
                "sectionName": useeio_name,
                "originalCode": u_code,
            }

            # Grandchildren: EI and BAFU under this UNSPSC, sorted by similarity desc
            leaves = []
            for entry in ei_under_unspsc.get(u_path, []) + bafu_under_unspsc.get(u_path, []):
                leaves.append(entry)
            leaves.sort(key=lambda e: -e["sim"])

            leaf_nodes = []
            for entry in leaves:
                origin = entry["origin"]
                # Trim UUID for code display, full path stays in id
                short_code = entry["path"].replace("ecoinvent-", "").replace("bafu-", "")[:12]
                leaf_id = make_id(f"t3-{origin}-", entry["path"].split("-", 1)[1] if "-" in entry["path"] else entry["path"])
                geo = entry["geo"]
                display_name = f"{entry['name']} ({geo})" if geo else entry["name"]
                lookup[leaf_id] = {
                    "code": short_code,
                    "description": display_name,
                    "level": 3,
                    "type": "ecoinvent_process" if origin == "ei" else "bafu_process",
                    "origin": origin,
                    "section": "USEEIO",
                    "sectionName": useeio_name,
                    "originalCode": entry["path"],
                }
                leaf_nodes.append({
                    "id": leaf_id,
                    "code": short_code,
                    "name": display_name,
                    "type": "ecoinvent_process" if origin == "ei" else "bafu_process",
                })

            u_node = {
                "id": u_id,
                "code": u_code,
                "name": u_name,
                "type": "unspsc",
            }
            if leaf_nodes:
                u_node["children"] = leaf_nodes
            unspsc_node_list.append(u_node)

        sector_node = {
            "id": useeio_id,
            "code": useeio_code,
            "name": useeio_name,
            "type": "useeio_sector",
        }
        if unspsc_node_list:
            sector_node["children"] = unspsc_node_list
        tree.append(sector_node)

    tree_path = OUT_DIR / "t3-tree.json"
    lookup_path = OUT_DIR / "t3-lookup.json"
    with open(tree_path, "w", encoding="utf-8") as f:
        json.dump(tree, f, ensure_ascii=False, separators=(",", ":"))
    with open(lookup_path, "w", encoding="utf-8") as f:
        json.dump(lookup, f, ensure_ascii=False, separators=(",", ":"))

    # Stats
    n_sectors = len(tree)
    n_unspsc = sum(len(s.get("children", [])) for s in tree)
    n_leaves = sum(len(c.get("children", [])) for s in tree for c in s.get("children", []))
    print(f"USEEIO sectors:  {n_sectors:>6,}")
    print(f"UNSPSC entries:  {n_unspsc:>6,}")
    print(f"EI+BAFU leaves:  {n_leaves:>6,}")
    print(f"Tree   -> {tree_path.relative_to(ROOT)} ({tree_path.stat().st_size / 1024 / 1024:.1f} MB)")
    print(f"Lookup -> {lookup_path.relative_to(ROOT)} ({lookup_path.stat().st_size / 1024 / 1024:.1f} MB)")


if __name__ == "__main__":
    main()
