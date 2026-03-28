"""
Compute advanced data files for chord diagram and sankey visualization.
Pre-processes the 12MB perfumes.json so the browser doesn't have to.
"""
import json
from collections import Counter, defaultdict

print("Loading perfumes.json...")
with open('../data/json/perfumes.json', 'r') as f:
    perfumes = json.load(f)
print(f"Loaded {len(perfumes)} perfumes")

# ── Helper: get note family ──
FAMILIES = {
    'floral': ['rose', 'jasmine', 'lily-of-the-valley', 'iris', 'peony', 'magnolia', 'tuberose', 'orange blossom', 'neroli', 'ylang-ylang', 'gardenia', 'violet', 'lotus', 'osmanthus', 'honeysuckle', 'mimosa', 'freesia', 'geranium', 'carnation', 'heliotrope', 'lilac', 'orchid', 'water lily', 'bulgarian rose', 'egyptian jasmine', 'turkish rose', 'cherry blossom'],
    'woody': ['sandalwood', 'cedar', 'vetiver', 'patchouli', 'oud', 'agarwood', 'birch', 'guaiac wood', 'driftwood', 'cypress', 'pine', 'teak', 'bamboo', 'rosewood', 'cashmeran', 'blonde woods', 'white woods', 'eucalyptus'],
    'citrus': ['bergamot', 'lemon', 'orange', 'grapefruit', 'mandarin orange', 'lime', 'yuzu', 'blood orange', 'tangerine', 'citruses', 'citron', 'clementine', 'bitter orange'],
    'spicy': ['pepper', 'cinnamon', 'cardamom', 'ginger', 'saffron', 'nutmeg', 'clove', 'cumin', 'pink pepper', 'black pepper', 'white pepper', 'star anise', 'elemi'],
    'fresh': ['mint', 'green notes', 'green tea', 'basil', 'rosemary', 'thyme', 'lavender', 'sea notes', 'water notes', 'ozone', 'aldehydes', 'ozonic notes', 'marine notes', 'aquatic notes'],
    'sweet': ['vanilla', 'tonka bean', 'caramel', 'honey', 'cocoa', 'chocolate', 'praline', 'sugar', 'marshmallow', 'cotton candy', 'toffee', 'rum'],
    'musky': ['musk', 'amber', 'ambergris', 'benzoin', 'labdanum', 'civet', 'castoreum', 'white musk', 'powdery notes'],
    'fruity': ['apple', 'peach', 'pear', 'plum', 'raspberry', 'strawberry', 'cherry', 'blackberry', 'blueberry', 'coconut', 'mango', 'pineapple', 'watermelon', 'fig', 'lychee', 'passion fruit', 'pomegranate', 'fruity notes', 'black currant', 'red apple', 'guarana', 'guava'],
}

def get_family(note):
    lower = note.lower()
    for fam, notes in FAMILIES.items():
        if lower in notes:
            return fam
    return 'other'

# ── 1. Co-occurrence matrix for chord diagram ──
print("Computing co-occurrence matrix...")
all_notes_flat = []
for p in perfumes:
    notes = (p.get('topNotes') or []) + (p.get('middleNotes') or []) + (p.get('baseNotes') or [])
    all_notes_flat.extend([n.lower() for n in notes])

note_counts = Counter(all_notes_flat)
top_notes = [n for n, _ in note_counts.most_common(15)]

cooccurrence = defaultdict(int)
for p in perfumes:
    notes = set()
    for n in (p.get('topNotes') or []) + (p.get('middleNotes') or []) + (p.get('baseNotes') or []):
        lower = n.lower()
        if lower in top_notes:
            notes.add(lower)
    notes_list = sorted(notes)
    for i in range(len(notes_list)):
        for j in range(i + 1, len(notes_list)):
            cooccurrence[(notes_list[i], notes_list[j])] += 1

# Build matrix
matrix = []
for i, n1 in enumerate(top_notes):
    row = []
    for j, n2 in enumerate(top_notes):
        if i == j:
            row.append(0)
        elif i < j:
            row.append(cooccurrence.get((n1, n2), 0))
        else:
            row.append(cooccurrence.get((n2, n1), 0))
    matrix.append(row)

chord_data = {
    'notes': top_notes,
    'families': [get_family(n) for n in top_notes],
    'matrix': matrix,
    'noteFrequencies': {n: note_counts[n] for n in top_notes}
}

with open('../website/data/chord_data.json', 'w') as f:
    json.dump(chord_data, f)
print(f"Saved chord_data.json ({len(top_notes)} notes)")

# ── 2. Sankey flow data ──
print("Computing sankey flow data...")

# Get top notes per layer
layer_counts = {'top': Counter(), 'middle': Counter(), 'base': Counter()}
for p in perfumes:
    for n in (p.get('topNotes') or []):
        layer_counts['top'][n.lower()] += 1
    for n in (p.get('middleNotes') or []):
        layer_counts['middle'][n.lower()] += 1
    for n in (p.get('baseNotes') or []):
        layer_counts['base'][n.lower()] += 1

top_8_top = [n for n, _ in layer_counts['top'].most_common(8)]
top_8_mid = [n for n, _ in layer_counts['middle'].most_common(8)]
top_8_base = [n for n, _ in layer_counts['base'].most_common(8)]

# Compute flows
top_to_mid = defaultdict(int)
mid_to_base = defaultdict(int)

for p in perfumes:
    t_notes = set(n.lower() for n in (p.get('topNotes') or []))
    m_notes = set(n.lower() for n in (p.get('middleNotes') or []))
    b_notes = set(n.lower() for n in (p.get('baseNotes') or []))

    for tn in t_notes:
        if tn in top_8_top:
            for mn in m_notes:
                if mn in top_8_mid:
                    top_to_mid[(tn, mn)] += 1
    for mn in m_notes:
        if mn in top_8_mid:
            for bn in b_notes:
                if bn in top_8_base:
                    mid_to_base[(mn, bn)] += 1

# Build nodes and links
nodes = []
node_index = {}
for layer, notes in [('top', top_8_top), ('middle', top_8_mid), ('base', top_8_base)]:
    for note in notes:
        key = f"{layer}_{note}"
        node_index[key] = len(nodes)
        nodes.append({
            'name': note,
            'layer': layer,
            'family': get_family(note),
            'frequency': layer_counts[layer][note]
        })

links = []
for (tn, mn), count in sorted(top_to_mid.items(), key=lambda x: -x[1])[:30]:
    links.append({
        'source': node_index[f"top_{tn}"],
        'target': node_index[f"middle_{mn}"],
        'value': count
    })
for (mn, bn), count in sorted(mid_to_base.items(), key=lambda x: -x[1])[:30]:
    links.append({
        'source': node_index[f"middle_{mn}"],
        'target': node_index[f"base_{bn}"],
        'value': count
    })

sankey_data = {'nodes': nodes, 'links': links}
with open('../website/data/sankey_data.json', 'w') as f:
    json.dump(sankey_data, f)
print(f"Saved sankey_data.json ({len(nodes)} nodes, {len(links)} links)")

# ── 3. Enhanced notes data with families pre-computed ──
print("Computing enhanced notes data...")
with open('../data/json/notes_stats.json', 'r') as f:
    notes_stats = json.load(f)

for layer in ['top', 'middle', 'base']:
    for entry in notes_stats[layer]:
        entry['family'] = get_family(entry['note'])

with open('../website/data/notes_stats_enhanced.json', 'w') as f:
    json.dump(notes_stats, f)
print("Saved notes_stats_enhanced.json")

print("Done!")
