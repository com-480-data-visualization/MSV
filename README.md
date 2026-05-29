# The Anatomy of Scent

*Making scents of 24,000 perfumes — a statistical journey through the invisible art of fragrance.*

**Live site**: [com-480-dataviz.vercel.app](https://com-480-dataviz.vercel.app)

| Student | SCIPER |
| --- | --- |
| Rayane Charif Chefchaouni | 339839 |
| Gaël Conde Losada | 329871 |
| Alexandre Jean Marcel Mourot | 346365 |

[Milestone 1](#milestone-1) | [Milestone 2](#milestone-2) | [Milestone 3](#milestone-3)

## About

This project analyzes 24,063 perfumes from the Fragrantica dataset and 2,000+ eBay listings to uncover patterns in fragrance composition, gender preferences, temporal trends, geographic differences, and market pricing. The story is told through a scrollytelling website with 10 interactive D3.js visualizations.

## Visualizations

| # | Section | Type | Interaction |
| --- | --- | --- | --- |
| 1 | The Building Blocks | Force-directed beeswarm | Hover bubbles for note details |
| 2 | His & Hers | Dual radar charts | Hover axes, toggle unisex overlay |
| 3 | The Ratings Game | Scatter/bubble chart | Hover dots for note + rating |
| 4 | Fifty Years of Fragrance | Stacked area chart | Hover to explore decade trends |
| 5 | The Price of Scent | Beeswarm strip plot | Hover for brand + price + type |
| 6a | Note Connections | Chord diagram | Hover notes for strongest pairings |
| 6b | Flow of Fragrance | Sankey diagram | Hover to trace note layers |
| 7 | The Geography of Scent | World map + radar chart | Hover map regions, click step cards |
| 8 | The Full Picture | Interactive heatmap | Click accords for co-occurrence |

## Technical Setup

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3.8+ (only needed if regenerating data from raw CSVs)

### Running locally

```bash
git clone https://github.com/com-480-data-visualization/MSV.git
cd MSV/docs
python3 -m http.server 8000
# Open http://localhost:8000
```

### Data preprocessing (optional)

The processed JSON files are already included in `docs/data/`. To regenerate from raw CSVs, download the datasets from Kaggle (links below) and place them in `data/`, then:

```bash
cd src
pip3 install pandas
python3 compute_advanced_data.py
python3 compute_geo_data.py
```

## Project Structure

```
docs/                     # Deployable website (served by Vercel)
  index.html              # Scrollytelling main page (8 sections + hero + footer)
  css/style.css           # Dark luxury theme (Cormorant Garamond + DM Sans)
  js/main.js              # Scrollama setup, navigation, shared utilities
  js/visualizations/      # One module per D3.js visualization (10 files)
    beeswarm.js            # Force-directed note frequency constellation
    radar.js               # Gender comparison spider charts
    bubbles.js             # Rating vs frequency scatter
    timeline.js            # Stacked area temporal trends
    price.js               # eBay price strip plot
    chord.js               # Note co-occurrence chord diagram
    sankey.js              # Top→middle→base note flow
    geo-radar.js           # Geographic radar utilities
    geo-map.js             # World choropleth + radar integration
    heatmap.js             # Accord frequency interactive heatmap
  data/                   # Pre-processed JSON files for D3.js (8 files)
data/                     # Raw datasets (not tracked — download from Kaggle)
milestones/               # Milestone reports + process book
src/                      # Python preprocessing scripts
```

## Tech Stack

- **D3.js v7** — all 10 interactive visualizations
- **Scrollama** — scroll-driven narrative transitions (IntersectionObserver)
- **TopoJSON** — world map geographic data (CDN)
- **d3-sankey** — Sankey diagram layout
- **Vanilla HTML/CSS/JS** — no framework, no build step
- **Python + pandas** — data preprocessing pipeline
- **Vercel** — static deployment from `/docs`

## Data Sources

Raw datasets are not included in the repository (too large). Download from Kaggle:

- [Fragrantica Fragrance Dataset](https://www.kaggle.com/datasets/olgagmiufana1/fragrantica-com-fragrance-dataset) (~24K perfumes with notes, ratings, accords, gender, year, country)
- [Perfume E-Commerce Dataset 2024](https://www.kaggle.com/datasets/kanchana1990/perfume-e-commerce-dataset-2024) (~2K eBay listings with pricing)

## Milestone 1 (20th March, 5pm)

**10% of the final grade**

See [milestones/Milestone1.md](milestones/Milestone1.md) for the full report including dataset description, problematic, EDA, and related work.

## Milestone 2 (17th April, 5pm)

**10% of the final grade**

See [milestones/Milestone2.md](milestones/Milestone2.md) for the project goal, visualization sketches, tools, and MVP breakdown.

## Milestone 3 (29th May, 5pm)

**80% of the final grade**

- **Process book**: [milestones/ProcessBook.pdf](milestones/ProcessBook.pdf)
- **Screencast**: [YouTube](https://youtu.be/mkwQGziD9j0) | [screencast.mp4](screencast.mp4)

## Late policy

- < 24h: 80% of the grade for the milestone
- < 48h: 70% of the grade for the milestone
