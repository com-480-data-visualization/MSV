# The Anatomy of Scent

An interactive data visualization exploring what makes a perfume attractive, how composition influences popularity, and what trends define modern perfumery.

**Live site**: [com-480-dataviz.vercel.app](https://com-480-dataviz.vercel.app)

| Student | SCIPER |
| --- | --- |
| Gaël Conde Losada | 329871 |
| Alexandre Jean Marcel Mourot | 346365 |

[Milestone 1](#milestone-1) | [Milestone 2](#milestone-2) | [Milestone 3](#milestone-3)

## About

This project analyzes 24,063 perfumes from the Fragrantica dataset and 2,000+ eBay listings to uncover patterns in fragrance composition, gender preferences, temporal trends, and market pricing. The story is told through a scrollytelling website with 8 interactive D3.js visualizations.

## Visualizations

| Visualization | Type | Data Source |
| --- | --- | --- |
| Note Frequency | Force-directed beeswarm | notes_stats.json |
| Gender Comparison | Dual radar charts | notes_stats.json |
| Rating vs Popularity | Scatter/bubble chart | notes_stats.json |
| Temporal Trends | Stacked area chart | temporal_trends.json |
| Price Analysis | Strip/beeswarm plot | price_data.json |
| Note Connections | Chord diagram | chord_data.json |
| Note Flow | Sankey diagram | sankey_data.json |
| Accord Heatmap | Interactive heatmap | accords_data.json |

## Technical Setup

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3.8+ (only for data preprocessing)
- A local HTTP server (Python built-in or similar)

### Running locally

```bash
# Clone the repository
git clone https://github.com/alexandre-mrt/com-480-dataviz.git
cd com-480-dataviz

# Start a local server in the website directory
cd website
python3 -m http.server 8000

# Open http://localhost:8000 in your browser
```

### Data preprocessing (optional)

The processed JSON files are already included in `website/data/`. To regenerate from raw CSVs:

```bash
cd src
pip3 install pandas
python3 compute_advanced_data.py
```

## Project Structure

```
website/                  # Deployable website
  index.html              # Main page with scrollytelling structure
  css/style.css           # Dark luxury theme styles
  js/main.js              # Scrollama setup, navigation, shared utilities
  js/visualizations/      # One file per D3.js visualization
  data/                   # Processed JSON files for D3.js
data/                     # Raw datasets
  fragrantica/            # Fragrantica perfume dataset (24K entries)
  perfume-ecommerce/      # eBay pricing dataset
  json/                   # Processed JSON (canonical copies)
milestones/               # Course milestone documents
src/                      # Python preprocessing scripts
```

## Tech Stack

- **D3.js v7** for all visualizations
- **Scrollama** for scroll-driven interactions (IntersectionObserver)
- **Lenis** for smooth momentum scrolling
- **Vanilla HTML/CSS/JS** (no build tools, no framework)
- **Python + pandas** for data preprocessing
- **GitHub Pages** for hosting

## Data Sources

- [Fragrantica Fragrance Dataset](https://www.kaggle.com/datasets/olgagmiufana1/fragrantica-com-fragrance-dataset) (~24K perfumes with notes, ratings, accords, gender, year)
- [Perfume E-Commerce Dataset 2024](https://www.kaggle.com/datasets/kanchana1990/perfume-e-commerce-dataset-2024) (~2K eBay listings with pricing)

## Milestone 1 (20th March, 5pm)

**10% of the final grade**

See [milestones/Milestone1.md](milestones/Milestone1.md) for the full report including dataset description, problematic, EDA, and related work.

## Milestone 2 (17th April, 5pm)

**10% of the final grade**

See [milestones/Milestone2.md](milestones/Milestone2.md) for the project goal, visualization sketches, tools, and MVP breakdown.

## Milestone 3 (30th May, 5pm)

**80% of the final grade**

Process book: [milestones/ProcessBook.pdf](milestones/ProcessBook.pdf)

## Late policy

- < 24h: 80% of the grade for the milestone
- < 48h: 70% of the grade for the milestone
