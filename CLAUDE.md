# COM-480 Data Visualization — Perfume Project

## Overview
Interactive scrollytelling data visualization exploring perfume composition, popularity, and market value.
Course: COM-480 Data Visualization at EPFL. Team: Alexandre Mourot, Gaël Conde Losada.
Live: https://alexandre-mrt.github.io/com-480-dataviz/

## Stack
- **Frontend**: Vanilla HTML/CSS/JS + D3.js v7 + Scrollama + Lenis
- **Data**: Python (pandas) for preprocessing → JSON for D3.js
- **Design**: Dark luxury theme (#0a0a0a, #c9a96e gold, Cormorant Garamond)
- **Deployment**: GitHub Pages (from /docs)

## Structure
```
docs/             # Deployable website (GitHub Pages source)
  index.html      # Scrollytelling main page
  css/style.css   # Dark luxury theme
  js/main.js      # Scrollama setup, shared utilities
  js/visualizations/  # 8 D3.js visualization modules
  data/           # Pre-processed JSON for D3.js
data/             # Raw CSV datasets
  fragrantica/    # 24K perfumes (semicolon-sep, latin-1)
  perfume-ecommerce/  # eBay pricing
  json/           # Canonical processed JSON
milestones/       # Milestone docs + process book
src/              # Python preprocessing scripts
```

## Dev Commands
```bash
cd docs && python3 -m http.server 8000
cd src && python3 compute_advanced_data.py
```

## Visualizations (8 total)
1. Beeswarm — note frequency constellation (force-directed)
2. Radar — gender comparison (women vs men profiles)
3. Bubbles — frequency vs rating scatter
4. Timeline — stacked area (note family trends by decade)
5. Price — eBay strip chart by gender
6. Chord — note co-occurrence connections
7. Sankey — top → middle → base note flow
8. Heatmap — accord frequency by gender with sorting
