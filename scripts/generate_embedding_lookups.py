"""
Build a compact lookup of embedding-derived best matches between UNSPSC
and the three LCA databases (USEEIO, ECOINVENT, BAFU). The full
nearest-neighbor data lives in app/public/data/lca-mappings/*.json (used
by the Mapping Review tab); this lookup is what the cross-taxonomy
comparison panel reads when a UNSPSC node is selected.

Output: app/public/data/embedding-matches.json
  {
    "unspsc": {
       "<unspsc-code>": {
         "useeio":    {"code", "name", "geo", "sim"} | null,
         "ecoinvent": {"code", "name", "geo", "sim"} | null,
         "bafu":      {"code", "name", "geo", "sim"} | null
       }, ...
    }
  }

Run after `generate_lca_mappings_embeddings.py` regenerates the pair
JSON files.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAPS = ROOT / "app" / "public" / "data" / "lca-mappings"
OUT = ROOT / "app" / "public" / "data" / "embedding-matches.json"


def load(name):
    with open(MAPS / name, encoding="utf-8") as f:
        return json.load(f)


def short_code(path):
    """Strip the DB prefix from a path."""
    if "-" in path:
        return path.split("-", 1)[1]
    return path


def main():
    sources = {
        "useeio":    "UNSPSC2USEEIO.json",
        "ecoinvent": "UNSPSC2ECOINVENT.json",
        "bafu":      "UNSPSC2BAFU.json",
    }

    matches = {}
    for db, fname in sources.items():
        ds = load(fname)
        for row in ds["rows"]:
            unspsc_code = short_code(row["fromPath"])
            entry = matches.setdefault(unspsc_code, {})
            entry[db] = {
                "code": short_code(row["toPath"]),
                "name": row["toName"],
                "geo": row.get("toGeo", ""),
                "sim": row["similarity"],
            }
        print(f"  {db}: merged {len(ds['rows']):,} rows")

    out = {"unspsc": matches}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    size_mb = OUT.stat().st_size / 1024 / 1024
    print(f"\nWrote {len(matches):,} UNSPSC entries -> {OUT.relative_to(ROOT)} ({size_mb:.1f} MB)")


if __name__ == "__main__":
    main()
