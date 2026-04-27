"""
Replicate the embedding-based cross-database mapping process.

For each of ECOINVENT / BAFU / USEEIO:
  1. Collect every distinct entity (by `path`) that appears in the
     existing Archive CSVs. Each entity carries name, product, geography.
     (The original prompt also used `description`; the Archive CSVs don't
     ship descriptions, so we just embed name+product+geography. Add a
     description field here if you wire in a richer source.)
  2. Embed each entity using the `embeddinggemma:latest` model via a local
     Ollama server (POST /api/embeddings). Embeddings are cached to .npy
     files so reruns are cheap.
  3. For each ordered pair (FROM, TO), find every FROM entity's nearest
     TO entity by cosine similarity.
  4. Write per-pair JSON files in the same shape as the existing
     app/public/data/lca-mappings/<KEY>.json (so the React tab picks them
     up with no further changes), plus an updated index.json. A
     `similarity` field is added per row.

Prerequisites:
  - `pip install numpy requests`
  - Ollama installed and running locally:
      ollama serve
      ollama pull embeddinggemma:latest
  - The existing Archive-derived JSON files at app/public/data/lca-mappings/
    (used as the entity pool). If you want to replicate from raw LCA dumps
    instead, add a loader in collect_entities() and skip the Archive read.

Usage:
  python scripts/generate_lca_mappings_embeddings.py
  # optional flags:
  python scripts/generate_lca_mappings_embeddings.py --pairs EI2BAFU,EI2USEEIO
  python scripts/generate_lca_mappings_embeddings.py --model embeddinggemma:latest
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

try:
    import numpy as np
except ImportError:
    sys.exit("numpy is required: pip install numpy")

try:
    import requests
except ImportError:
    sys.exit("requests is required: pip install requests")


SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent
DATA_DIR = ROOT / "app" / "public" / "data" / "lca-mappings"
EMB_CACHE_DIR = ROOT / "raw-data" / "lca-embeddings-cache"
EMB_CACHE_DIR.mkdir(parents=True, exist_ok=True)

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
DEFAULT_MODEL = "embeddinggemma:latest"

# (key, fromDb, toDb)
PAIRS = [
    ("EI2BAFU",          "ECOINVENT", "BAFU"),
    ("EI2USEEIO",        "ECOINVENT", "USEEIO"),
    ("BAFU2ECOINVENT",   "BAFU",      "ECOINVENT"),
    ("BAFU2USEEIO",      "BAFU",      "USEEIO"),
    ("USEEIO2BAFU",      "USEEIO",    "BAFU"),
    ("USEEIO2ECOINVENT", "USEEIO",    "ECOINVENT"),
    # UNSPSC <-> LCA databases
    ("UNSPSC2ECOINVENT", "UNSPSC",    "ECOINVENT"),
    ("UNSPSC2BAFU",      "UNSPSC",    "BAFU"),
    ("UNSPSC2USEEIO",    "UNSPSC",    "USEEIO"),
    ("EI2UNSPSC",        "ECOINVENT", "UNSPSC"),
    ("BAFU2UNSPSC",      "BAFU",      "UNSPSC"),
    ("USEEIO2UNSPSC",    "USEEIO",    "UNSPSC"),
    # HS (international goods) <-> {UNSPSC, USEEIO, ECOINVENT, BAFU}
    ("HS2UNSPSC",        "HS",        "UNSPSC"),
    ("HS2USEEIO",        "HS",        "USEEIO"),
    ("HS2ECOINVENT",     "HS",        "ECOINVENT"),
    ("HS2BAFU",          "HS",        "BAFU"),
    ("UNSPSC2HS",        "UNSPSC",    "HS"),
    ("USEEIO2HS",        "USEEIO",    "HS"),
    ("EI2HS",            "ECOINVENT", "HS"),
    ("BAFU2HS",          "BAFU",      "HS"),
]

# Auto-generate the 6 new code-system pairs against each of the 5 hub DBs
_HUB_DBS = ["HS", "UNSPSC", "USEEIO", "ECOINVENT", "BAFU"]
_HUB_KEY = {"HS": "HS", "UNSPSC": "UNSPSC", "USEEIO": "USEEIO",
            "ECOINVENT": "EI", "BAFU": "BAFU"}
for _src in ["CPC", "NAICS", "ISIC", "NACE", "CPA", "BEA"]:
    for _dst in _HUB_DBS:
        PAIRS.append((f"{_src}2{_HUB_KEY[_dst]}", _src, _dst))

# HS-family tariff lines (CN-8, HTS-10, CA-10) get their own embeddings
# rather than relying on HS-6 fallback.
for _src in ["CN", "HTS", "CA"]:
    for _dst in _HUB_DBS:
        PAIRS.append((f"{_src}2{_HUB_KEY[_dst]}", _src, _dst))

UNSPSC_LOOKUP = ROOT / "app" / "public" / "data" / "unspsc-lookup.json"
HS_LOOKUP = ROOT / "app" / "public" / "data" / "hs-lookup.json"

# Generic per-taxonomy lookup files. Path format mirrors React tree node IDs.
GENERIC_LOOKUPS = {
    "CPC":   (ROOT / "app" / "public" / "data" / "cpc-lookup.json",   "cpc-"),
    "NAICS": (ROOT / "app" / "public" / "data" / "naics-lookup.json", "naics-"),
    "ISIC":  (ROOT / "app" / "public" / "data" / "isic-lookup.json",  "isic-"),
    "NACE":  (ROOT / "app" / "public" / "data" / "nace-lookup.json",  "nace-"),
    "CPA":   (ROOT / "app" / "public" / "data" / "cpa-lookup.json",   "cpa-"),
    "BEA":   (ROOT / "app" / "public" / "data" / "bea-lookup.json",   "bea-"),
    "CN":    (ROOT / "app" / "public" / "data" / "cn-lookup.json",    "cn-"),
    "HTS":   (ROOT / "app" / "public" / "data" / "hts-lookup.json",   "hts-"),
    "CA":    (ROOT / "app" / "public" / "data" / "ca-lookup.json",    "ca-"),
}


# ---------------------------------------------------------------------------
# 1. Collect entities
# ---------------------------------------------------------------------------

def _load_archive_pool():
    """Pool ECOINVENT/BAFU/USEEIO entities from the existing per-pair
    Archive-derived JSON files. Each file is read only for those rows
    whose from/to DB matches one of those three databases. Same path may
    appear in multiple files; first value wins."""
    pool = {"ECOINVENT": {}, "BAFU": {}, "USEEIO": {}}
    archive_keys = {"EI2BAFU", "EI2USEEIO", "BAFU2ECOINVENT",
                    "BAFU2USEEIO", "USEEIO2BAFU", "USEEIO2ECOINVENT"}
    for key, from_db, to_db in PAIRS:
        if key not in archive_keys:
            continue
        path = DATA_DIR / f"{key}.json"
        if not path.exists():
            print(f"  WARN: missing {path}", file=sys.stderr)
            continue
        with open(path, encoding="utf-8") as f:
            ds = json.load(f)
        for row in ds["rows"]:
            for side, db in (("from", from_db), ("to", to_db)):
                p = row[f"{side}Path"]
                if not p or p in pool[db]:
                    continue
                pool[db][p] = {
                    "name": row[f"{side}Name"],
                    "product": row.get(f"{side}Product", row[f"{side}Name"]),
                    "geo": row[f"{side}Geo"],
                }
    return pool


def _load_unspsc_pool():
    """Build a UNSPSC entity pool from app/public/data/unspsc-lookup.json.
    Path is `unspsc-<code>` to mirror the React tree id format.

    UNSPSC hierarchy: segment (2-digit) > family (4) > class (6) >
    commodity (8). The leaf description on its own ("Bull semen") is
    often ambiguous to an embedding model, so we synthesize a parent
    path from the code itself ("Live Plant and Animal Material > Live
    animals > Cattle > Bull semen") and feed that as the embedding
    context. Each ancestor's description comes from the same lookup
    table, so this is purely a smarter text composition — no extra
    data sources needed."""
    if not UNSPSC_LOOKUP.exists():
        print(f"  WARN: {UNSPSC_LOOKUP} missing — skipping UNSPSC", file=sys.stderr)
        return {}
    with open(UNSPSC_LOOKUP, encoding="utf-8") as f:
        lookup = json.load(f)

    def parent_codes(code):
        """Return ancestor codes from segment to immediate parent."""
        if len(code) >= 8:   return [code[:2], code[:4], code[:6]]
        if len(code) >= 6:   return [code[:2], code[:4]]
        if len(code) >= 4:   return [code[:2]]
        return []

    pool = {}
    for code, entry in lookup.items():
        desc = entry.get("description", "").strip()
        if not desc:
            continue
        level_label = entry.get("type", "")
        # Build parent path "Segment > Family > Class > Commodity"
        ancestor_descs = []
        for pcode in parent_codes(code):
            pentry = lookup.get(pcode)
            if pentry and pentry.get("description"):
                ancestor_descs.append(pentry["description"].strip())
        path_str = " > ".join(ancestor_descs + [desc]) if ancestor_descs else desc
        pool[f"unspsc-{code}"] = {
            "name": desc,
            # `product` is concatenated into the embedding text. The
            # parent path is the new disambiguating signal; level/code
            # remain so the model can still see the granularity.
            "product": f"{path_str} ({level_label} {code})" if level_label else path_str,
            "geo": "",
        }
    return pool


def _load_hs_pool():
    """Build an HS entity pool from app/public/data/hs-lookup.json. Path is
    `hs-<code>` to mirror the React tree id format. Embedding text uses
    description plus the section name for hierarchical context."""
    if not HS_LOOKUP.exists():
        print(f"  WARN: {HS_LOOKUP} missing — skipping HS", file=sys.stderr)
        return {}
    with open(HS_LOOKUP, encoding="utf-8") as f:
        lookup = json.load(f)
    pool = {}
    for code, entry in lookup.items():
        desc = entry.get("description", "").strip()
        if not desc:
            continue
        section_name = entry.get("sectionName", "").strip()
        level_label = entry.get("type", "")
        # Embedding text: name = description; product slot carries
        # section context + level so the model sees the hierarchy.
        product_parts = []
        if section_name:
            product_parts.append(section_name)
        if level_label:
            product_parts.append(f"{level_label} {code}")
        pool[f"hs-{code}"] = {
            "name": desc,
            "product": " - ".join(product_parts) if product_parts else code,
            "geo": "",
        }
    return pool


def _load_generic_taxonomy_pool(lookup_path, id_prefix):
    """Build an entity pool from any taxonomy whose lookup matches the
    {code, description, sectionName, type} schema. Embedding text is
    description + section context + level/code, mirroring the HS loader."""
    if not lookup_path.exists():
        print(f"  WARN: {lookup_path} missing — skipping", file=sys.stderr)
        return {}
    with open(lookup_path, encoding="utf-8") as f:
        lookup = json.load(f)
    pool = {}
    for code, entry in lookup.items():
        desc = entry.get("description", "").strip()
        if not desc:
            continue
        section_name = entry.get("sectionName", "").strip()
        level_label = entry.get("type", "")
        product_parts = []
        if section_name and section_name != desc:
            product_parts.append(section_name)
        if level_label:
            product_parts.append(f"{level_label} {code}")
        pool[f"{id_prefix}{code}"] = {
            "name": desc,
            "product": " - ".join(product_parts) if product_parts else code,
            "geo": "",
        }
    return pool


def collect_entities():
    """Return {db_name: {path: {"name", "product", "geo"}}} for every DB
    referenced by the active PAIRS list."""
    needed = {db for _, fdb, tdb in PAIRS for db in (fdb, tdb)}
    pool = {}
    if any(db in needed for db in ("ECOINVENT", "BAFU", "USEEIO")):
        pool.update(_load_archive_pool())
    if "UNSPSC" in needed:
        pool["UNSPSC"] = _load_unspsc_pool()
    if "HS" in needed:
        pool["HS"] = _load_hs_pool()
    for db_name, (lookup_path, id_prefix) in GENERIC_LOOKUPS.items():
        if db_name in needed:
            pool[db_name] = _load_generic_taxonomy_pool(lookup_path, id_prefix)
    for db in sorted(needed):
        items = pool.get(db, {})
        print(f"  {db}: {len(items):,} unique entities")
    return pool


def embedding_text(entity):
    """Compose the string fed to the embedding model."""
    parts = [entity["name"]]
    if entity["product"] and entity["product"] != entity["name"]:
        parts.append(entity["product"])
    if entity["geo"]:
        parts.append(entity["geo"])
    return " | ".join(parts)


# ---------------------------------------------------------------------------
# 2. Embed via Ollama
# ---------------------------------------------------------------------------

def check_ollama(model):
    try:
        r = requests.get(f"{OLLAMA_URL}/api/tags", timeout=3)
        r.raise_for_status()
    except Exception as e:
        sys.exit(f"Cannot reach Ollama at {OLLAMA_URL} ({e}). "
                 f"Start it with `ollama serve`.")
    tags = r.json().get("models", [])
    names = [t.get("name", "") for t in tags]
    if model not in names:
        sys.exit(f"Model `{model}` not pulled. Run: ollama pull {model}\n"
                 f"Available: {names}")


def embed_batch(model, texts):
    r = requests.post(
        f"{OLLAMA_URL}/api/embed",
        json={"model": model, "input": texts},
        timeout=600,
    )
    r.raise_for_status()
    return r.json()["embeddings"]


def embed_db(db_name, entities, model, batch_size=64):
    """Returns (paths, matrix) where matrix is L2-normalized (N, D).
    Uses /api/embed (batched) for ~100x throughput vs single-prompt calls.
    Caches partial progress every batch so an interrupt doesn't lose hours."""
    cache_path = EMB_CACHE_DIR / f"{db_name}__{model.replace(':', '_').replace('/', '_')}.npz"

    paths_sorted = sorted(entities.keys())
    texts = [embedding_text(entities[p]) for p in paths_sorted]

    if cache_path.exists():
        try:
            blob = np.load(cache_path, allow_pickle=True)
            cached_paths = list(blob["paths"])
            cached_vecs = blob["vecs"]
            if cached_paths == paths_sorted and cached_vecs.shape[0] == len(paths_sorted):
                print(f"  {db_name}: loaded {len(paths_sorted):,} cached embeddings")
                return paths_sorted, cached_vecs
            # Partial cache: same prefix, fewer rows -> resume
            if (cached_vecs.shape[0] < len(paths_sorted)
                    and cached_paths == paths_sorted[:cached_vecs.shape[0]]):
                print(f"  {db_name}: resuming from cached prefix "
                      f"({cached_vecs.shape[0]:,}/{len(paths_sorted):,})")
                vecs_list = [cached_vecs]
                start = cached_vecs.shape[0]
            else:
                print(f"  {db_name}: cache stale (entity set changed), re-embedding")
                vecs_list = []
                start = 0
        except Exception as e:
            print(f"  {db_name}: cache unreadable ({e}), re-embedding")
            vecs_list = []
            start = 0
    else:
        vecs_list = []
        start = 0

    print(f"  {db_name}: embedding {len(paths_sorted) - start:,} of "
          f"{len(paths_sorted):,} entities with {model} (batch={batch_size})...")
    t0 = time.time()
    n = len(texts)
    SAVE_EVERY = 10  # checkpoint every N batches

    last_print = 0
    batch_idx = 0
    for i in range(start, n, batch_size):
        chunk = texts[i:i + batch_size]
        try:
            embs = embed_batch(model, chunk)
        except Exception as e:
            print(f"    batch starting at {i} failed: {e}; retrying in 2s")
            time.sleep(2)
            embs = embed_batch(model, chunk)
        vecs_list.append(np.asarray(embs, dtype=np.float32))
        batch_idx += 1

        done = i + len(chunk)
        if done - last_print >= 500 or done == n:
            elapsed = time.time() - t0
            new_done = done - start
            rate = new_done / max(elapsed, 1e-6)
            eta = (n - done) / max(rate, 1e-6)
            print(f"    {done:>6,}/{n:,}  rate={rate:5.1f}/s  ETA={eta:6.0f}s")
            last_print = done

        if batch_idx % SAVE_EVERY == 0:
            partial = np.concatenate(vecs_list, axis=0)
            np.savez_compressed(
                cache_path,
                paths=np.asarray(paths_sorted[:partial.shape[0]]),
                vecs=partial,
            )

    arr = np.concatenate(vecs_list, axis=0) if vecs_list else np.zeros((0, 0), dtype=np.float32)
    norms = np.linalg.norm(arr, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    arr = arr / norms
    np.savez_compressed(cache_path, paths=np.asarray(paths_sorted), vecs=arr)
    print(f"  {db_name}: cached -> {cache_path.relative_to(ROOT)}")
    return paths_sorted, arr


# ---------------------------------------------------------------------------
# 3. Nearest-neighbor matching
# ---------------------------------------------------------------------------

def nearest_match(from_paths, from_vecs, to_paths, to_vecs, batch=512):
    """For each from-vector, return (best_to_idx, best_sim). Both vec
    matrices are L2-normalized, so cosine == dot product."""
    n = from_vecs.shape[0]
    best_idx = np.zeros(n, dtype=np.int32)
    best_sim = np.zeros(n, dtype=np.float32)
    to_t = to_vecs.T  # (D, M)
    for start in range(0, n, batch):
        end = min(start + batch, n)
        sims = from_vecs[start:end] @ to_t  # (batch, M)
        best_idx[start:end] = np.argmax(sims, axis=1)
        best_sim[start:end] = sims[np.arange(end - start), best_idx[start:end]]
    return best_idx, best_sim


# ---------------------------------------------------------------------------
# 4. Write outputs
# ---------------------------------------------------------------------------

def write_pair(key, from_db, to_db, from_pool, to_pool, from_paths, from_vecs,
               to_paths, to_vecs):
    best_idx, best_sim = nearest_match(from_paths, from_vecs, to_paths, to_vecs)
    rows = []
    for i, fp in enumerate(from_paths):
        tp = to_paths[best_idx[i]]
        fe, te = from_pool[fp], to_pool[tp]
        row = {
            "id": f"{key}-{i}",
            "fromName": fe["name"],
            "fromGeo": fe["geo"],
            "fromPath": fp,
            "toName": te["name"],
            "toGeo": te["geo"],
            "toPath": tp,
            "similarity": round(float(best_sim[i]), 4),
        }
        if fe["product"] and fe["product"] != fe["name"]:
            row["fromProduct"] = fe["product"]
        if te["product"] and te["product"] != te["name"]:
            row["toProduct"] = te["product"]
        rows.append(row)

    out_path = DATA_DIR / f"{key}.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump({"key": key, "fromDb": from_db, "toDb": to_db, "rows": rows},
                  f, ensure_ascii=False, separators=(",", ":"))
    size_kb = out_path.stat().st_size / 1024
    print(f"  {key}: {len(rows):,} rows  ({size_kb:,.1f} KB)")
    return {
        "key": key, "fromDb": from_db, "toDb": to_db,
        "label": f"{from_db} → {to_db}",
        "count": len(rows),
        "file": f"{key}.json",
        "sizeKb": round(size_kb, 1),
    }


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default=DEFAULT_MODEL,
                    help=f"Ollama embedding model (default: {DEFAULT_MODEL})")
    ap.add_argument("--pairs", default=",".join(p[0] for p in PAIRS),
                    help="Comma-separated pair keys to (re)compute")
    ap.add_argument("--batch", type=int, default=64,
                    help="Embedding batch size (default 64)")
    args = ap.parse_args()

    selected = set(args.pairs.split(","))
    pairs = [p for p in PAIRS if p[0] in selected]
    if not pairs:
        sys.exit(f"No pairs selected. Known: {[p[0] for p in PAIRS]}")

    check_ollama(args.model)

    print("Collecting entities from existing Archive-derived JSON...")
    pool = collect_entities()

    needed_dbs = sorted({db for _, fdb, tdb in pairs for db in (fdb, tdb)})
    embeddings = {}
    print(f"\nEmbedding databases: {needed_dbs}")
    for db in needed_dbs:
        embeddings[db] = embed_db(db, pool[db], args.model, batch_size=args.batch)

    print("\nMatching pairs...")
    index_entries = []
    for key, fdb, tdb in pairs:
        fpaths, fvecs = embeddings[fdb]
        tpaths, tvecs = embeddings[tdb]
        index_entries.append(
            write_pair(key, fdb, tdb, pool[fdb], pool[tdb],
                       fpaths, fvecs, tpaths, tvecs)
        )

    # Merge into existing index, preserving entries we didn't recompute
    index_path = DATA_DIR / "index.json"
    existing = {"datasets": []}
    if index_path.exists():
        with open(index_path, encoding="utf-8") as f:
            existing = json.load(f)
    by_key = {e["key"]: e for e in existing["datasets"]}
    for entry in index_entries:
        by_key[entry["key"]] = entry
    out_index = {"datasets": [by_key[k] for k in by_key]}
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(out_index, f, ensure_ascii=False, separators=(",", ":"))
    print(f"\nWrote index -> {index_path.relative_to(ROOT)}")
    print("Done. Restart the dev server (or wait for HMR) and open the Mapping Review tab.")


if __name__ == "__main__":
    main()
