import pandas as pd
import re
from collections import Counter

# Load stuff
fra = pd.read_csv('data/fragrantica/fra_cleaned.csv', sep=';', encoding='latin-1')
fra['Rating Value'] = pd.to_numeric(fra['Rating Value'], errors='coerce')
print(f"========== FRAGRANTICA DATASET ==========")
print(f"Total rows: {len(fra)}, Columns: {list(fra.columns)}\n")

# Check interesting valeus
print("========== CHECK MISSING VALUES ==========")
for col in fra.columns:
    missing = fra[col].isna().sum()
    pct = 100 * missing / len(fra)
    if missing > 0:
        print(f"  {col}: {missing} ({pct:.1f}%)")
print()

print("========== STATS ==========")
print(f"Total perfumes: {len(fra)}")
print(f"Gender distribution:")
for g, cnt in fra['Gender'].value_counts().items():
    print(f"  {g}: {cnt} ({100*cnt/len(fra):.1f}%)")
ratings = fra['Rating Value'].dropna()
print(f"Rating Value: mean={ratings.mean():.3f}, std={ratings.std():.3f}, min={ratings.min():.1f}, max={ratings.max():.1f}")
print()

all_notes = []
for col in ['Top', 'Middle', 'Base']:
    for val in fra[col].dropna():
        for p in re.split(r'[,;|]', str(val)):
            p = p.strip().lower()
            if p and p != 'nan':
                all_notes.append(p)
counter_all = Counter(all_notes)
print("========== TOP 10 NOTES OVERALL (Top+Middle+Base) ==========")
for note, cnt in counter_all.most_common(10):
    print(f"  {note}: {cnt}")
print()

print("========== TOP 5 NOTES FOR WOMEN ==========")
women = fra[fra['Gender'].str.lower() == 'women']
women_notes = []
for col in ['Top', 'Middle', 'Base']:
    for val in women[col].dropna():
        for p in re.split(r'[,;|]', str(val)):
            p = p.strip().lower()
            if p and p != 'nan':
                women_notes.append(p)
for note, cnt in Counter(women_notes).most_common(5):
    print(f"  {note}: {cnt}")

print("========== TOP 5 NOTES FOR MEN ==========")
men = fra[fra['Gender'].str.lower() == 'men']
men_notes = []
for col in ['Top', 'Middle', 'Base']:
    for val in men[col].dropna():
        for p in re.split(r'[,;|]', str(val)):
            p = p.strip().lower()
            if p and p != 'nan':
                men_notes.append(p)
for note, cnt in Counter(men_notes).most_common(5):
    print(f"  {note}: {cnt}")
print()

print("========== TOP 10 NOTES BY AVERAGE RATING (>=50 perfums) ==========")
note_ratings = {}
for _, row in fra.iterrows():
    rating = row['Rating Value']
    if pd.isna(rating):
        continue
    for col in ['Top', 'Middle', 'Base']:
        val = row[col]
        if pd.isna(val):
            continue
        for p in re.split(r'[,;|]', str(val)):
            p = p.strip().lower()
            if p:
                note_ratings.setdefault(p, []).append(rating)

note_avg = {n: (sum(v)/len(v), len(v)) for n, v in note_ratings.items() if len(v) >= 50}
top_rated = sorted(note_avg.items(), key=lambda x: x[1][0], reverse=True)[:10]
for note, (avg, cnt) in top_rated:
    print(f"  {note}: avg={avg:.3f} ({cnt} perfumes)")
print()

print("========== EBAY ==========")
for label, path in [('Mens', 'data/perfume-ecommerce/ebay_mens_perfume.csv'),
                    ('Womens', 'data/perfume-ecommerce/ebay_womens_perfume.csv')]:
    try:
        df = pd.read_csv(path)
        print(f"{label}: {len(df)} listnings, columns: {list(df.columns)}")
        price_cols = [c for c in df.columns if 'price' in c.lower()]
        for pc in price_cols:
            prices = pd.to_numeric(df[pc], errors='coerce').dropna()
            if len(prices) > 0:
                print(f"  {pc}: min={prices.min():.2f}, max={prices.max():.2f}, mean={prices.mean():.2f}")
    except Exception as e:
        print(f"  Error loading {path}: {e}")
