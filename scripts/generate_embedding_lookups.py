"""
Build a compact lookup of embedding-derived best matches:
  - keyed by UNSPSC code -> best match in {USEEIO, ECOINVENT, BAFU, HS}
  - keyed by HS-6 code   -> best match in {UNSPSC, USEEIO, ECOINVENT, BAFU}

The full nearest-neighbor data lives in app/public/data/lca-mappings/
(consumed by the Mapping Review tab); this compact lookup is what the
cross-taxonomy comparison panel reads when a node is selected.

Output: app/public/data/embedding-matches.json
  {
    "unspsc": { "<unspsc-code>": {useeio?, ecoinvent?, bafu?, hs?} },
    "hs":     { "<hs-code>":     {unspsc?, useeio?, ecoinvent?, bafu?} }
  }

Each value is {"code", "name", "geo", "sim"}.

Run after `generate_lca_mappings_embeddings.py` regenerates the pair
JSON files.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAPS = ROOT / "app" / "public" / "data" / "lca-mappings"
OUT = ROOT / "app" / "public" / "data" / "embedding-matches.json"


def load(name):
    p = MAPS / name
    if not p.exists():
        return None
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def short_code(path):
    """Strip the DB prefix from a path."""
    if "-" in path:
        return path.split("-", 1)[1]
    return path


def merge(out_dict, fname, side_key):
    """For each row in pair file `fname`, add the `to` side as
    `out_dict[short_code(from)][side_key]`."""
    ds = load(fname)
    if ds is None:
        print(f"  WARN: {fname} not found, skipping")
        return
    for row in ds["rows"]:
        from_code = short_code(row["fromPath"])
        out_dict.setdefault(from_code, {})[side_key] = {
            "code": short_code(row["toPath"]),
            "name": row["toName"],
            "geo": row.get("toGeo", ""),
            "sim": row["similarity"],
        }
    print(f"  {fname}: merged {len(ds['rows']):,} rows -> .{side_key}")


def main():
    unspsc = {}
    merge(unspsc, "UNSPSC2USEEIO.json",    "useeio")
    merge(unspsc, "UNSPSC2ECOINVENT.json", "ecoinvent")
    merge(unspsc, "UNSPSC2BAFU.json",      "bafu")
    merge(unspsc, "UNSPSC2HS.json",        "hs")

    hs = {}
    merge(hs, "HS2UNSPSC.json",    "unspsc")
    merge(hs, "HS2USEEIO.json",    "useeio")
    merge(hs, "HS2ECOINVENT.json", "ecoinvent")
    merge(hs, "HS2BAFU.json",      "bafu")

    out = {"unspsc": unspsc, "hs": hs}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    size_mb = OUT.stat().st_size / 1024 / 1024
    print(f"\nWrote {len(unspsc):,} UNSPSC + {len(hs):,} HS entries -> "
          f"{OUT.relative_to(ROOT)} ({size_mb:.1f} MB)")


if __name__ == "__main__":
    main()
