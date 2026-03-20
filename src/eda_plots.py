import pandas as pd
import re
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')
from collections import Counter
import numpy as np
import os

os.makedirs('milestones/figures', exist_ok=True)

fra = pd.read_csv('data/fragrantica/fra_cleaned.csv', sep=';', encoding='latin-1')
fra['Rating Value'] = pd.to_numeric(fra['Rating Value'], errors='coerce')

def parse_notes(series):
    notes = []
    for val in series.dropna():
        for p in re.split(r'[,;|]', str(val)):
            p = p.strip().lower()
            if p and p != 'nan':
                notes.append(p)
    return notes

all_notes = []
for col in ['Top', 'Middle', 'Base']:
    all_notes.extend(parse_notes(fra[col]))
top10 = Counter(all_notes).most_common(10)
notes, counts = zip(*top10)

fig, ax = plt.subplots(figsize=(8, 4.5))
bars = ax.barh(list(reversed(notes)), list(reversed(counts)), color='#6B5B95')
ax.set_xlabel('Occurrences', fontsize=11)
ax.set_title('Top 10 Most Common Fragrance Notes', fontsize=13, fontweight='bold')
ax.bar_label(bars, padding=4, fontsize=9)
ax.set_xlim(0, max(counts) * 1.15)
plt.tight_layout()
plt.savefig('milestones/figures/top10_notes.png', dpi=130, bbox_inches='tight')
plt.close()
print("Saved top10_notes.png")

women = fra[fra['Gender'].str.lower() == 'women']
men   = fra[fra['Gender'].str.lower() == 'men']

women_notes = []
men_notes   = []
for col in ['Top', 'Middle', 'Base']:
    women_notes.extend(parse_notes(women[col]))
    men_notes.extend(parse_notes(men[col]))

top5_women = Counter(women_notes).most_common(5)
top5_men   = Counter(men_notes).most_common(5)

fig, axes = plt.subplots(1, 2, figsize=(10, 4))
for ax, data, title, color in [
    (axes[0], top5_women, "Women's Top 5 Notes", '#E8A0BF'),
    (axes[1], top5_men,   "Men's Top 5 Notes",   '#6B9AC4'),
]:
    ns, cs = zip(*data)
    bars = ax.barh(list(reversed(ns)), list(reversed(cs)), color=color)
    ax.set_title(title, fontsize=12, fontweight='bold')
    ax.set_xlabel('Occurrences', fontsize=10)
    ax.bar_label(bars, padding=3, fontsize=9)
    ax.set_xlim(0, max(cs) * 1.2)

plt.suptitle('Top Notes by Gender', fontsize=13, fontweight='bold', y=1.02)
plt.tight_layout()
plt.savefig('milestones/figures/notes_by_gender.png', dpi=130, bbox_inches='tight')
plt.close()
print("Saved notes_by_gender.png")

top10_set = [n for n, _ in top10]
genders = {'Women': women, 'Men': men, 'Unisex': fra[fra['Gender'].str.lower() == 'unisex']}

matrix = {}
for gender_label, subset in genders.items():
    sub_notes = []
    for col in ['Top', 'Middle', 'Base']:
        sub_notes.extend(parse_notes(subset[col]))
    total = len(sub_notes)
    cnt = Counter(sub_notes)
    matrix[gender_label] = [100 * cnt.get(n, 0) / total for n in top10_set]

df_heat = pd.DataFrame(matrix, index=top10_set)

fig, ax = plt.subplots(figsize=(6, 5))
im = ax.imshow(df_heat.values, aspect='auto', cmap='YlOrRd')
ax.set_xticks(range(len(genders)))
ax.set_xticklabels(list(genders.keys()), fontsize=11)
ax.set_yticks(range(len(top10_set)))
ax.set_yticklabels(top10_set, fontsize=10)
plt.colorbar(im, ax=ax, label='% of notes in category')
for i in range(len(top10_set)):
    for j in range(len(genders)):
        ax.text(j, i, f"{df_heat.values[i, j]:.1f}%", ha='center', va='center', fontsize=8, color='black')
ax.set_title('Note Frequency by Gender (%)', fontsize=12, fontweight='bold')
plt.tight_layout()
plt.savefig('milestones/figures/note_heatmap.png', dpi=130, bbox_inches='tight')
plt.close()
print("Saved note_heatmap.png")
