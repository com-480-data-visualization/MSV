# The Anatomy of Scent

An interactive data visualization exploring what makes a perfume attractive, how composition influences popularity, and what trends define modern perfumery.

| Student | SCIPER |
| --- | --- |
| Gaël Conde Losada | 329871 |
| Alexandre Jean Marcel Mourot | 346365 |

[Milestone 1](#milestone-1) | [Milestone 2](#milestone-2) | [Milestone 3](#milestone-3)

## About

This project analyzes 24,063 perfumes from the Fragrantica dataset and 2,000+ eBay listings to uncover patterns in fragrance composition, gender preferences, temporal trends, and market pricing. We are building a scrollytelling website with interactive D3.js visualizations.

## Technical Setup

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3.8+ (only for data preprocessing)
- A local HTTP server (Python built-in or similar)

### Running locally

```bash
# Clone the repository
git clone https://github.com/com-480-data-visualization/MSV.git
cd MSV

# Start a local server in the website directory
cd docs
python3 -m http.server 8000

# Open http://localhost:8000 in your browser
```

### Data preprocessing (optional)

The processed JSON files are already included in `docs/data/`. To regenerate from raw CSVs:

```bash
cd src
pip3 install pandas
python3 compute_advanced_data.py
```

## Project Structure

```
docs/                     # Website (deployable)
  index.html              # Main page with scrollytelling structure
  css/style.css           # Dark luxury theme styles
  js/main.js              # Scrollama setup, navigation, shared utilities
  js/visualizations/      # D3.js visualization modules
  data/                   # Processed JSON files for D3.js
data/                     # Raw datasets
  fragrantica/            # Fragrantica perfume dataset (24K entries)
  perfume-ecommerce/      # eBay pricing dataset
milestones/               # Course milestone documents
src/                      # Python preprocessing scripts
```

## Tech Stack

- **D3.js v7** for all visualizations
- **Scrollama** for scroll-driven interactions (IntersectionObserver)
- **Vanilla HTML/CSS/JS** (no build tools, no framework)
- **Python + pandas** for data preprocessing

## Data Sources

- [Fragrantica Fragrance Dataset](https://www.kaggle.com/datasets/olgagmiufana1/fragrantica-com-fragrance-dataset) (~24K perfumes with notes, ratings, accords, gender, year)
- [Perfume E-Commerce Dataset 2024](https://www.kaggle.com/datasets/kanchana1990/perfume-e-commerce-dataset-2024) (~2K eBay listings with pricing)

## Milestone 1 (20th March, 5pm)

**10% of the final grade**

See [milestones/Milestone1.md](milestones/Milestone1.md) for the full report including dataset description, problematic, EDA, and related work.

## Milestone 2 (1st May, 5pm)

**10% of the final grade**

See [milestones/Milestone2.md](milestones/Milestone2.md) for the project goal, visualization sketches, tools, and MVP breakdown.

## Milestone 3 (30th May, 5pm)

**80% of the final grade**

*Coming soon.*
