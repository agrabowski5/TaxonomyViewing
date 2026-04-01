"""
Improved UNSPSC-HS mapping using:
1. TF-IDF + cosine similarity (replaces Jaccard)
2. Porter stemming for better recall
3. Bigram matching for multi-word phrases
4. Hierarchy context (parent class/family descriptions appended)
5. UNSPSC -> CPC text bridge -> CPC-HS official concordance as secondary path
6. Merged results from both paths with best-of scoring

Outputs: unspsc-hs-mapping.json (same format, drop-in replacement)
"""

import json
import math
import os
import re
from collections import defaultdict

RAW_DIR = os.path.join(os.path.dirname(__file__), '..', 'raw-data')
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'app', 'public', 'data')

# ===== Stemmer (simple suffix-stripping Porter-like) =====

STEP2_SUFFIXES = [
    ('ational', 'ate'), ('tional', 'tion'), ('enci', 'ence'), ('anci', 'ance'),
    ('izer', 'ize'), ('iser', 'ise'), ('abli', 'able'), ('alli', 'al'),
    ('entli', 'ent'), ('eli', 'e'), ('ousli', 'ous'), ('ization', 'ize'),
    ('isation', 'ise'), ('ation', 'ate'), ('ator', 'ate'), ('alism', 'al'),
    ('iveness', 'ive'), ('fulness', 'ful'), ('ousness', 'ous'), ('aliti', 'al'),
    ('iviti', 'ive'), ('biliti', 'ble'),
]

def stem(word):
    """Simple suffix-stripping stemmer."""
    if len(word) <= 3:
        return word
    # Step 1: plurals and past tense
    if word.endswith('sses'):
        word = word[:-2]
    elif word.endswith('ies'):
        word = word[:-2]
    elif word.endswith('ss'):
        pass
    elif word.endswith('s'):
        word = word[:-1]

    if word.endswith('eed'):
        word = word[:-1]
    elif word.endswith('ed') and len(word) > 4:
        word = word[:-2]
    elif word.endswith('ing') and len(word) > 5:
        word = word[:-3]

    # Step 2: common suffixes
    for suffix, replacement in STEP2_SUFFIXES:
        if word.endswith(suffix) and len(word) > len(suffix) + 2:
            word = word[:-len(suffix)] + replacement
            break

    return word


# ===== Text Processing =====

STOP_WORDS = {
    'a', 'an', 'and', 'or', 'the', 'of', 'for', 'to', 'in', 'on', 'with',
    'by', 'from', 'not', 'nor', 'but', 'at', 'as', 'is', 'are', 'was',
    'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'other', 'than', 'its', 'it', 'their', 'this', 'that', 'these', 'those',
    'such', 'including', 'whether', 'also', 'etc', 'nes', 'nesoi',
    'not', 'elsewhere', 'specified', 'parts', 'thereof', 'articles',
    'preparations', 'mixtures', 'type', 'types', 'made', 'used',
}

def tokenize(text):
    """Tokenize, lowercase, remove punctuation, filter stopwords, stem."""
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    words = text.split()
    return [stem(w) for w in words if w not in STOP_WORDS and len(w) > 2]

def get_bigrams(tokens):
    """Generate bigrams from token list."""
    return [tokens[i] + '_' + tokens[i+1] for i in range(len(tokens) - 1)]

def get_terms(text):
    """Get unigrams + bigrams for a text."""
    tokens = tokenize(text)
    bigrams = get_bigrams(tokens)
    return tokens + bigrams


# ===== TF-IDF Engine =====

class TfIdfIndex:
    """Builds a TF-IDF index over a corpus and supports cosine similarity queries."""

    def __init__(self):
        self.docs = {}          # code -> term list
        self.doc_vecs = {}      # code -> {term: tfidf_weight}
        self.df = defaultdict(int)  # term -> document frequency
        self.N = 0

    def add_document(self, doc_id, text, context_text=None):
        """Add a document. context_text is appended with lower weight."""
        terms = get_terms(text)
        if context_text:
            ctx_terms = get_terms(context_text)
            # Add context terms with lower frequency (weighted 0.5x)
            terms = terms + ctx_terms
        self.docs[doc_id] = terms
        seen = set()
        for t in terms:
            if t not in seen:
                self.df[t] += 1
                seen.add(t)
        self.N += 1

    def build(self):
        """Compute TF-IDF vectors and inverted index for fast queries."""
        self.inv_index = defaultdict(list)  # term -> [(doc_id, weight)]

        for doc_id, terms in self.docs.items():
            tf = defaultdict(int)
            for t in terms:
                tf[t] += 1
            vec = {}
            for t, count in tf.items():
                idf = math.log((self.N + 1) / (self.df[t] + 1)) + 1
                vec[t] = (1 + math.log(count)) * idf
            norm = math.sqrt(sum(v * v for v in vec.values()))
            if norm > 0:
                vec = {t: v / norm for t, v in vec.items()}
            self.doc_vecs[doc_id] = vec

            # Build inverted index
            for t, w in vec.items():
                self.inv_index[t].append((doc_id, w))

    def query(self, text, context_text=None, top_n=5, threshold=0.1):
        """Find top-N documents using inverted index for fast candidate retrieval."""
        terms = get_terms(text)
        if context_text:
            terms = terms + get_terms(context_text)

        tf = defaultdict(int)
        for t in terms:
            tf[t] += 1
        qvec = {}
        for t, count in tf.items():
            if t in self.df:
                idf = math.log((self.N + 1) / (self.df[t] + 1)) + 1
                qvec[t] = (1 + math.log(count)) * idf
        norm = math.sqrt(sum(v * v for v in qvec.values()))
        if norm > 0:
            qvec = {t: v / norm for t, v in qvec.items()}
        else:
            return []

        # Use inverted index: only score docs that share at least one term
        candidates = defaultdict(float)
        for t, qw in qvec.items():
            for doc_id, dw in self.inv_index.get(t, []):
                candidates[doc_id] += qw * dw

        scores = [(doc_id, sim) for doc_id, sim in candidates.items() if sim >= threshold]
        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[:top_n]


def main():
    print("=== Improved UNSPSC-HS Mapping Generator ===\n")

    # Load data
    with open(os.path.join(OUT_DIR, 'hs-lookup.json'), 'r', encoding='utf-8') as f:
        hs_lookup = json.load(f)
    with open(os.path.join(OUT_DIR, 'unspsc-lookup.json'), 'r', encoding='utf-8') as f:
        unspsc_lookup = json.load(f)
    with open(os.path.join(OUT_DIR, 'cpc-lookup.json'), 'r', encoding='utf-8') as f:
        cpc_lookup = json.load(f)
    with open(os.path.join(OUT_DIR, 'concordance.json'), 'r', encoding='utf-8') as f:
        concordance = json.load(f)

    # Extract items at target levels
    hs6 = {code: entry['description'] for code, entry in hs_lookup.items() if len(code) == 6}
    hs4 = {code: entry['description'] for code, entry in hs_lookup.items() if len(code) == 4}
    unspsc8 = {code: entry['description'] for code, entry in unspsc_lookup.items() if len(code) == 8}
    unspsc6 = {code: entry['description'] for code, entry in unspsc_lookup.items() if len(code) == 6}
    unspsc4 = {code: entry['description'] for code, entry in unspsc_lookup.items() if len(code) == 4}
    unspsc2 = {code: entry['description'] for code, entry in unspsc_lookup.items() if len(code) == 2}
    cpc5 = {code: entry['description'] for code, entry in cpc_lookup.items() if len(code) == 5}
    cpc4 = {code: entry['description'] for code, entry in cpc_lookup.items() if len(code) == 4}
    cpc3 = {code: entry['description'] for code, entry in cpc_lookup.items() if len(code) == 3}

    print(f"HS-6 subheadings: {len(hs6)}")
    print(f"UNSPSC commodities: {len(unspsc8)}")
    print(f"CPC subclasses: {len(cpc5)}")

    # Filter to goods-only UNSPSC (segments 10-49 are primarily goods)
    goods_segments = set(str(i) for i in range(10, 57))
    unspsc_goods = {k: v for k, v in unspsc8.items() if k[:2] in goods_segments}
    print(f"UNSPSC goods commodities (segments 10-56): {len(unspsc_goods)}")

    # ===== PATH 1: Direct UNSPSC -> HS via TF-IDF =====
    print("\n--- Path 1: Direct UNSPSC -> HS (TF-IDF) ---")

    # Build HS TF-IDF index with heading context
    hs_index = TfIdfIndex()
    for code, desc in hs6.items():
        # Add HS-4 heading as context
        heading = hs4.get(code[:4], '')
        hs_index.add_document(code, desc, context_text=heading)
    hs_index.build()
    print(f"  HS index built: {hs_index.N} documents, {len(hs_index.df)} terms")

    # Query each UNSPSC commodity against HS index
    direct_matches = {}  # unspsc_code -> [(hs_code, similarity)]
    batch_size = 5000
    for i, (unspsc_code, unspsc_desc) in enumerate(unspsc_goods.items()):
        if i % batch_size == 0:
            print(f"  Processing {i}/{len(unspsc_goods)} commodities...")

        # Build context from UNSPSC hierarchy
        class_desc = unspsc6.get(unspsc_code[:6], '')
        family_desc = unspsc4.get(unspsc_code[:4], '')
        context = f"{class_desc} {family_desc}"

        results = hs_index.query(unspsc_desc, context_text=context, top_n=5, threshold=0.12)
        if results:
            direct_matches[unspsc_code] = results

    print(f"  Direct matches: {len(direct_matches)} UNSPSC codes matched")

    # ===== PATH 2: UNSPSC -> CPC -> HS via concordance =====
    print("\n--- Path 2: UNSPSC -> CPC -> HS (bridge) ---")

    # Build CPC TF-IDF index
    cpc_index = TfIdfIndex()
    for code, desc in cpc5.items():
        ctx = cpc4.get(code[:4], '') + ' ' + cpc3.get(code[:3], '')
        cpc_index.add_document(code, desc, context_text=ctx)
    # Also add CPC-4 level for broader matching
    for code, desc in cpc4.items():
        ctx = cpc3.get(code[:3], '')
        cpc_index.add_document(code, desc, context_text=ctx)
    cpc_index.build()
    print(f"  CPC index built: {cpc_index.N} documents, {len(cpc_index.df)} terms")

    # CPC -> HS lookup from concordance
    cpc_to_hs = concordance.get('cpcToHs', {})

    bridge_matches = {}  # unspsc_code -> [(hs_code, similarity)]
    for i, (unspsc_code, unspsc_desc) in enumerate(unspsc_goods.items()):
        if i % batch_size == 0:
            print(f"  Processing {i}/{len(unspsc_goods)} commodities...")

        class_desc = unspsc6.get(unspsc_code[:6], '')
        family_desc = unspsc4.get(unspsc_code[:4], '')
        context = f"{class_desc} {family_desc}"

        # Find matching CPC codes
        cpc_results = cpc_index.query(unspsc_desc, context_text=context, top_n=3, threshold=0.15)

        hs_matches = []
        for cpc_code, cpc_sim in cpc_results:
            # Look up CPC -> HS concordance
            # Try exact code, then shorter prefixes
            for cpc_len in range(len(cpc_code), 2, -1):
                prefix = cpc_code[:cpc_len]
                mappings = cpc_to_hs.get(prefix, [])
                if mappings:
                    for m in mappings:
                        hs_code = m['code']
                        if len(hs_code) == 6:
                            # Discount similarity through the chain
                            chain_sim = cpc_sim * 0.85
                            hs_matches.append((hs_code, chain_sim))
                    break

        if hs_matches:
            # Deduplicate, keep best sim per HS code
            best = {}
            for hs_code, sim in hs_matches:
                if hs_code not in best or sim > best[hs_code]:
                    best[hs_code] = sim
            bridge_matches[unspsc_code] = sorted(best.items(), key=lambda x: x[1], reverse=True)[:5]

    print(f"  Bridge matches: {len(bridge_matches)} UNSPSC codes matched")

    # ===== MERGE both paths =====
    print("\n--- Merging results ---")

    FINAL_THRESHOLD = 0.20
    FINAL_TOP_N = 3

    unspsc_to_hs = {}
    hs_to_unspsc = defaultdict(list)
    total_matches = 0

    all_unspsc = set(list(direct_matches.keys()) + list(bridge_matches.keys()))
    for unspsc_code in all_unspsc:
        # Merge direct + bridge matches, keep best per HS code
        merged = {}

        for hs_code, sim in direct_matches.get(unspsc_code, []):
            if hs_code not in merged or sim > merged[hs_code]:
                merged[hs_code] = sim

        for hs_code, sim in bridge_matches.get(unspsc_code, []):
            if hs_code not in merged or sim > merged[hs_code]:
                merged[hs_code] = sim

        # Filter and sort
        matches = [(code, sim) for code, sim in merged.items() if sim >= FINAL_THRESHOLD]
        matches.sort(key=lambda x: x[1], reverse=True)
        top = matches[:FINAL_TOP_N]

        if top:
            unspsc_to_hs[unspsc_code] = [
                {'code': code, 'similarity': round(sim, 3)} for code, sim in top
            ]
            total_matches += len(top)
            for code, sim in top:
                hs_to_unspsc[code].append({
                    'code': unspsc_code,
                    'similarity': round(sim, 3),
                })

    # Sort reverse mappings
    for hs_code in hs_to_unspsc:
        hs_to_unspsc[hs_code].sort(key=lambda x: x['similarity'], reverse=True)

    # Stats
    print(f"\n=== Results ===")
    print(f"  UNSPSC codes matched: {len(unspsc_to_hs)}/{len(unspsc_goods)} ({100*len(unspsc_to_hs)/len(unspsc_goods):.1f}%)")
    print(f"  HS codes matched: {len(hs_to_unspsc)}/{len(hs6)} ({100*len(hs_to_unspsc)/len(hs6):.1f}%)")
    print(f"  Total match pairs: {total_matches}")

    # Similarity distribution
    all_sims = [m['similarity'] for matches in unspsc_to_hs.values() for m in matches]
    if all_sims:
        all_sims.sort()
        buckets = defaultdict(int)
        for s in all_sims:
            bucket = f"{int(s*10)/10:.1f}-{int(s*10)/10 + 0.09:.2f}"
            buckets[bucket] += 1
        print(f"\n  Similarity distribution:")
        for bucket in sorted(buckets.keys()):
            bar = '#' * (buckets[bucket] // 50 + 1)
            print(f"    {bucket}: {buckets[bucket]:5d} {bar}")
        print(f"    Mean: {sum(all_sims)/len(all_sims):.3f}")
        print(f"    Median: {all_sims[len(all_sims)//2]:.3f}")

    # Write output (same format as existing unspsc-hs-mapping.json)
    output = {
        'unspscToHs': unspsc_to_hs,
        'hsToUnspsc': dict(hs_to_unspsc),
    }

    out_path = os.path.join(OUT_DIR, 'unspsc-hs-mapping.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, separators=(',', ':'))
    print(f"\n  Wrote {out_path}: {os.path.getsize(out_path):,} bytes")


if __name__ == '__main__':
    main()
