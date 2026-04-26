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


def build_source(prefix, target_files):
    """Build a {code: {<target>: match}} dict for one source taxonomy
    by merging the listed pair files."""
    out = {}
    for target_key, fname in target_files.items():
        merge(out, fname, target_key)
    return out


def main():
    out = {
        "unspsc": build_source("UNSPSC", {
            "useeio":    "UNSPSC2USEEIO.json",
            "ecoinvent": "UNSPSC2ECOINVENT.json",
            "bafu":      "UNSPSC2BAFU.json",
            "hs":        "UNSPSC2HS.json",
        }),
        "hs": build_source("HS", {
            "unspsc":    "HS2UNSPSC.json",
            "useeio":    "HS2USEEIO.json",
            "ecoinvent": "HS2ECOINVENT.json",
            "bafu":      "HS2BAFU.json",
        }),
    }
    # 6 new taxonomy sources, each connecting to the same 5 hub DBs.
    # Pair file naming convention: <SRC>2{HS,UNSPSC,USEEIO,EI,BAFU}.json
    for src_key, src_prefix in [
        ("cpc",   "CPC"),   ("naics", "NAICS"),
        ("isic",  "ISIC"),  ("nace",  "NACE"),
        ("cpa",   "CPA"),   ("bea",   "BEA"),
    ]:
        out[src_key] = build_source(src_prefix, {
            "hs":        f"{src_prefix}2HS.json",
            "unspsc":    f"{src_prefix}2UNSPSC.json",
            "useeio":    f"{src_prefix}2USEEIO.json",
            "ecoinvent": f"{src_prefix}2EI.json",
            "bafu":      f"{src_prefix}2BAFU.json",
        })

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    size_mb = OUT.stat().st_size / 1024 / 1024
    summary = ", ".join(f"{k}={len(v):,}" for k, v in out.items())
    print(f"\nWrote {summary} -> {OUT.relative_to(ROOT)} ({size_mb:.1f} MB)")


if __name__ == "__main__":
    main()
