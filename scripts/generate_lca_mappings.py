"""
Convert the 6 cross-database mapping CSVs from Archive (1).zip
into per-dataset JSON files (lazy-loaded by the React app) plus a
small index file.

Input:  %TEMP%/archive_new/{EI2BAFU,EI2USEEIO,BAFU2ECOINVENT,
                           BAFU2USEEIO,USEEIO2BAFU,USEEIO2ECOINVENT}.csv
Output: app/public/data/lca-mappings/{index.json, <key>.json}
"""

import csv
import json
import os
import sys
import tempfile

DATA_DIR = os.path.join(tempfile.gettempdir(), "archive_new")
OUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "app", "public", "data", "lca-mappings",
)

FILES = {
    "EI2BAFU":          ("EI2BAFU.csv",         "ECOINVENT", "BAFU"),
    "EI2USEEIO":        ("EI2USEEIO.csv",       "ECOINVENT", "USEEIO"),
    "BAFU2ECOINVENT":   ("BAFU2ECOINVENT.csv",  "BAFU",      "ECOINVENT"),
    "BAFU2USEEIO":      ("BAFU2USEEIO.csv",     "BAFU",      "USEEIO"),
    "USEEIO2BAFU":      ("USEEIO2BAFU.csv",     "USEEIO",    "BAFU"),
    "USEEIO2ECOINVENT": ("USEEIO2ECOINVENT.csv", "USEEIO",   "ECOINVENT"),
}


def load_csv(path, key):
    rows = []
    with open(path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, r in enumerate(reader):
            from_name = next((v for k, v in r.items() if k.startswith("From name")), "")
            to_name = next((v for k, v in r.items() if k.startswith("To name")), "")
            from_prod = r.get("From Product", "")
            to_prod = r.get("To Product", "")
            row = {
                "id": f"{key}-{i}",
                "fromName": from_name,
                "fromGeo": r.get("From Geography", ""),
                "fromPath": r.get("From path", ""),
                "toName": to_name,
                "toGeo": r.get("To Geography", ""),
                "toPath": r.get("To path", ""),
            }
            # only emit product fields when they differ from name (saves ~40% space)
            if from_prod and from_prod != from_name:
                row["fromProduct"] = from_prod
            if to_prod and to_prod != to_name:
                row["toProduct"] = to_prod
            rows.append(row)
    return rows


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    index = {"datasets": []}
    total = 0
    for key, (fname, from_db, to_db) in FILES.items():
        path = os.path.join(DATA_DIR, fname)
        if not os.path.isfile(path):
            print(f"WARN: missing {path}", file=sys.stderr)
            continue
        rows = load_csv(path, key)

        out_path = os.path.join(OUT_DIR, f"{key}.json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump({"key": key, "fromDb": from_db, "toDb": to_db, "rows": rows},
                      f, ensure_ascii=False, separators=(",", ":"))

        size_kb = os.path.getsize(out_path) / 1024
        index["datasets"].append({
            "key": key,
            "fromDb": from_db,
            "toDb": to_db,
            "label": f"{from_db} → {to_db}",
            "count": len(rows),
            "file": f"{key}.json",
            "sizeKb": round(size_kb, 1),
        })
        total += len(rows)
        print(f"  {key}: {len(rows):,} rows  ({size_kb:,.1f} KB)")

    with open(os.path.join(OUT_DIR, "index.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, separators=(",", ":"))

    print(f"\nWrote {total:,} mappings across {len(index['datasets'])} files -> {OUT_DIR}")


if __name__ == "__main__":
    main()
