# COM-480 Data Visualization — Perfume Project

## Overview
Interactive data visualization exploring perfume composition, popularity, and market value.
Course: COM-480 Data Visualization at EPFL. Team: Alexandre Mourot, Gaël Conde Losada.

## Stack
- **Frontend**: Vanilla HTML/CSS/JS + D3.js v7
- **Data**: Python (pandas) for preprocessing → JSON for D3.js
- **Design**: Elegant/luxe dark theme, scrollytelling narrative
- **Deployment**: GitHub Pages

## Structure
```
website/          # Main website (index.html, css/, js/, assets/)
data/             # Raw datasets (CSV) and processed (JSON)
  fragrantica/    # 24K perfumes: notes, ratings, gender, year, accords
  perfume-ecommerce/  # eBay pricing data (men + women)
  json/           # D3.js-ready JSON files
milestones/       # Milestone documents and figures
src/              # Python scripts for EDA and data processing
```

## Dev Commands
```bash
# Local dev server
cd website && python3 -m http.server 8000

# Data processing
cd src && python3 process_data.py

# Lint/format (if using)
npx prettier --write website/
```

## Key Datasets
- `fra_cleaned.csv`: semicolon-separated, latin-1 encoding, 18 columns
- `ebay_mens_perfume.csv` / `ebay_womens_perfume.csv`: comma-separated

## Visualizations
1. Note Explorer (chord diagram) — note co-occurrence
2. Gender Comparison — men vs women fragrance profiles
3. Rating Bubbles — note frequency vs avg rating
4. Temporal Trends — note popularity by decade
5. Perfume Radar — individual perfume profiles
6. Price Analysis — eBay pricing vs composition
7. Note Flow Sankey — top → middle → base layers
8. Interactive Heatmap — gender × note frequency
