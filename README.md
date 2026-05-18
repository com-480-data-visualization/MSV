# The Anatomy of Scent

An interactive scrollytelling data visualization exploring what makes a perfume attractive, how composition influences popularity, and what trends define modern perfumery.

**Live site**: [com-480-dataviz.vercel.app](https://com-480-dataviz.vercel.app)

| Student | SCIPER |
| --- | --- |
| Rayane Charif Chefchaouni | 339839 |
| Gaël Conde Losada | 329871 |
| Alexandre Jean Marcel Mourot | 346365 |

[Milestone 1](#milestone-1) | [Milestone 2](#milestone-2) | [Milestone 3](#milestone-3)

## About

This project analyzes 24,063 perfumes from the Fragrantica dataset and 2,000+ eBay listings to uncover patterns in fragrance composition, gender preferences, temporal trends, and market pricing. The story is told through a scrollytelling website with 8 interactive D3.js visualizations.

## Visualizations

| # | Visualization | Type | Data Source |
| --- | --- | --- | --- |
| 1 | The Building Blocks | Force-directed beeswarm | notes_stats.json |
| 2 | His & Hers | Dual radar charts | notes_stats.json |
| 3 | The Ratings Game | Scatter/bubble chart | notes_stats.json |
| 4 | Fifty Years of Fragrance | Stacked area chart | temporal_trends.json |
| 5 | The Price of Scent | Beeswarm strip plot | price_data.json |
| 6a | Note Connections | Chord diagram | chord_data.json |
| 6b | Flow of Fragrance | Sankey diagram | sankey_data.json |
| 7 | The Full Picture | Interactive heatmap | accords_data.json |

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
```

## Project Structure

```
docs/                     # Deployable website (served by Vercel)
  index.html              # Scrollytelling main page
  css/style.css           # Dark luxury theme (Cormorant Garamond + DM Sans)
  js/main.js              # Scrollama setup, navigation, shared utilities
  js/visualizations/      # One module per D3.js visualization (8 files)
  data/                   # Pre-processed JSON files for D3.js
data/                     # Raw datasets (not tracked — download from Kaggle)
milestones/               # Milestone reports + process book
src/                      # Python preprocessing scripts
```

## Tech Stack

- **D3.js v7** — all 8 interactive visualizations
- **Scrollama** — scroll-driven narrative transitions (IntersectionObserver)
- **d3-sankey** — Sankey diagram layout
- **Vanilla HTML/CSS/JS** — no framework, no build step
- **Python + pandas** — data preprocessing pipeline
- **Vercel** — static deployment from `/docs`

## Data Sources

Raw datasets are not included in the repository (too large). Download from Kaggle:

- [Fragrantica Fragrance Dataset](https://www.kaggle.com/datasets/olgagmiufana1/fragrantica-com-fragrance-dataset) (~24K perfumes with notes, ratings, accords, gender, year)
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
- **Screencast**: *TODO — add link*

## Late policy

- < 24h: 80% of the grade for the milestone
- < 48h: 70% of the grade for the milestone
