"""
Generate geo_data.json: note family profiles by world region.
Reads fra_cleaned.csv (semicolon-separated, latin-1 encoding).
"""
import csv
import json
from collections import Counter, defaultdict

CSV_PATH = '../data/fragrantica/fra_cleaned.csv'
OUTPUT_PATH = '../docs/data/geo_data.json'

REGIONS = {
    'Europe': [
        'France', 'Italy', 'UK', 'Spain', 'Germany', 'Sweden',
        'Switzerland', 'Netherlands', 'Russia', 'Poland', 'Greece',
        'Denmark', 'Czech Republic', 'Romania', 'Portugal', 'Latvia',
    ],
    'North America': ['USA', 'Canada'],
    'Asia': ['Japan', 'South Korea', 'India', 'Thailand', 'Indonesia', 'Malaysia', 'China', 'Hong Kong', 'Pakistan'],
    'Middle East': ['UAE', 'Oman', 'Arabia saudi', 'Bahrain', 'Turkey', 'Lebanon', 'Egypt', 'Kuwait', 'Qatar', 'Iran'],
    'South America': ['Brazil', 'Argentina'],
}

FAMILIES = {
    'floral': ['rose', 'jasmine', 'lily-of-the-valley', 'iris', 'peony', 'magnolia', 'tuberose', 'orange blossom', 'neroli', 'ylang-ylang', 'gardenia', 'violet', 'lotus', 'osmanthus', 'honeysuckle', 'mimosa', 'freesia', 'geranium', 'carnation', 'heliotrope', 'lilac', 'orchid', 'water lily', 'cherry blossom'],
    'woody': ['sandalwood', 'cedar', 'vetiver', 'patchouli', 'oud', 'agarwood', 'birch', 'guaiac wood', 'driftwood', 'cypress', 'pine', 'teak', 'bamboo', 'rosewood', 'cashmeran'],
    'citrus': ['bergamot', 'lemon', 'orange', 'grapefruit', 'mandarin orange', 'lime', 'yuzu', 'blood orange', 'tangerine', 'citruses', 'citron', 'clementine', 'bitter orange'],
    'spicy': ['pepper', 'cinnamon', 'cardamom', 'ginger', 'saffron', 'nutmeg', 'clove', 'cumin', 'pink pepper', 'black pepper', 'white pepper', 'star anise', 'elemi'],
    'fresh': ['mint', 'green notes', 'green tea', 'basil', 'rosemary', 'thyme', 'lavender', 'sea notes', 'water notes', 'ozone', 'aldehydes', 'ozonic notes', 'marine notes', 'aquatic notes'],
    'sweet': ['vanilla', 'tonka bean', 'caramel', 'honey', 'cocoa', 'chocolate', 'praline', 'sugar', 'marshmallow', 'cotton candy', 'toffee', 'rum'],
    'musky': ['musk', 'amber', 'ambergris', 'benzoin', 'labdanum', 'civet', 'castoreum', 'white musk', 'powdery notes'],
    'fruity': ['apple', 'peach', 'pear', 'plum', 'raspberry', 'strawberry', 'cherry', 'blackberry', 'blueberry', 'coconut', 'mango', 'pineapple', 'watermelon', 'fig', 'lychee', 'passion fruit', 'pomegranate', 'fruity notes', 'black currant'],
}

FAMILY_LIST = ['floral', 'woody', 'citrus', 'spicy', 'fresh', 'sweet', 'musky', 'fruity']

country_to_region = {}
for region, countries in REGIONS.items():
    for c in countries:
        country_to_region[c] = region


def get_family(note):
    lower = note.strip().lower()
    for fam, notes in FAMILIES.items():
        if lower in notes:
            return fam
    return 'other'


def parse_notes(cell):
    if not cell or cell.strip() == '':
        return []
    return [n.strip() for n in cell.split(',') if n.strip()]


print(f"Reading {CSV_PATH}...")
region_families = defaultdict(lambda: defaultdict(int))
region_notes = defaultdict(Counter)
region_counts = defaultdict(int)

with open(CSV_PATH, encoding='latin-1') as f:
    reader = csv.DictReader(f, delimiter=';')
    for row in reader:
        country = row.get('Country', '').strip()
        region = country_to_region.get(country)
        if not region:
            continue

        region_counts[region] += 1

        all_notes = (
            parse_notes(row.get('Top', ''))
            + parse_notes(row.get('Middle', ''))
            + parse_notes(row.get('Base', ''))
        )

        for note in all_notes:
            family = get_family(note)
            if family != 'other':
                region_families[region][family] += 1
            region_notes[region][note.lower()] += 1

regions_output = []
for region in ['Europe', 'North America', 'Asia', 'Middle East', 'South America']:
    if region_counts[region] == 0:
        continue

    families = {}
    for fam in FAMILY_LIST:
        families[fam] = region_families[region].get(fam, 0)

    top_notes = [
        {'note': n, 'count': c}
        for n, c in region_notes[region].most_common(5)
    ]

    regions_output.append({
        'name': region,
        'countries': REGIONS[region],
        'count': region_counts[region],
        'families': families,
        'topNotes': top_notes,
    })

output = {'regions': regions_output, 'families': FAMILY_LIST}

with open(OUTPUT_PATH, 'w') as f:
    json.dump(output, f, indent=2)

print(f"Saved {OUTPUT_PATH}")
for r in regions_output:
    print(f"  {r['name']}: {r['count']} perfumes")
print("Done!")
