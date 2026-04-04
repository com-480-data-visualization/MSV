# Milestone 2 — The Anatomy of Scent

**COM-480 Data Visualization** | Alexandre Mourot (346365), Gaël Conde Losada (329871)

## Project Goal

Our project tells the story of what goes into a perfume and why some compositions work better than others. We use the Fragrantica dataset (about 24,000 perfumes with notes, ratings, accords, gender, release year) together with an eBay pricing dataset (~2,000 listings) to look at this from multiple angles: what notes are most common, how men's and women's perfumes differ, whether popular notes are actually well-rated, how trends shifted over the decades, and what drives price differences.

We chose to build it as a scrollytelling site because it fits naturally: each section is one question, one visualization, one piece of the story. The reader does not need to click around or figure out filters, they just scroll and the data unfolds. Design-wise we are going for a dark luxurious look with gold highlights and serif fonts (Cormorant Garamond) to give a sense of elegance that matches the subject. Think of it as something closer to a magazine feature than a data dashboard.

## Visualization Sketches

We plan five main sections, each built around one D3.js visualization. Below we describe what each one shows and roughly what it looks like.

**Section 1 — "The Building Blocks" (Beeswarm Chart)**
The opening view is a constellation of bubbles, one per fragrance note, sized by frequency across the full dataset. We group them by family (floral, woody, citrus, etc.) using D3 force simulation. Hovering shows the count and top brands. This gives the reader an immediate sense of scale: musk appears in 11,000+ perfumes, but a note like pink pepper only shows up in a few hundred.

![Beeswarm sketch](figures/m2/beeswarm_sketch.png)

**Section 2 — "His & Hers" (Radar Charts)**
Two radar charts side by side, one for women and one for men, with 8 axes (one per note family). We already saw in our EDA that jasmine/rose dominate women's perfumes while patchouli/cedar lean masculine. The radar makes this immediately visible. A toggle button lets you overlay the "unisex" profile as a third layer.

![Radar sketch](figures/m2/radar_sketch.png)

**Section 3 — "The Ratings Game" (Bubble Chart)**
Note frequency on the x-axis, average user rating on the y-axis, bubble size = perfume count. The interesting finding here is that the most common notes do not necessarily rate the highest. Tonka bean and pink pepper sit in a sweet spot of high rating and lower frequency, while musk is everywhere but unremarkable rating-wise.

![Bubble sketch](figures/m2/bubble_sketch.png)

**Section 4 — "Fifty Years of Fragrance" (Stacked Area)**
A stacked area chart of note family proportions by decade (1970s to 2020s). We want the reader to scroll forward through time and see how olfactory tastes changed: the fresh clean wave of the 90s, the gourmand rise of the 2010s, oud gaining ground recently. This one requires computing decade bins and normalizing note counts per period.

![Stacked area sketch](figures/m2/stacked_area_sketch.png)

**Section 5 — "The Price of Scent" (Strip Chart)**
Using the eBay dataset, a strip/beeswarm plot of prices split by gender. Men's listings range from $3 to $259, women's from $2 to $300. The tricky part is matching eBay listings to Fragrantica entries since naming conventions differ. We plan to use fuzzy string matching on brand names, but this is still a work in progress and may not give perfect results.

![Price strip sketch](figures/m2/price_strip_sketch.png)

We are also considering two sidebar visualizations (a chord diagram for note co-occurrences and a Sankey diagram for the top-middle-base note flow), but these are not guaranteed at this point.

## Tools and Lectures

| Visualization | Main tool | Relevant lectures |
|---|---|---|
| Beeswarm | D3.js force simulation | D3.js bindng, Interaction design |
| Radar charts | D3.js radial scales + SVG | Perception and color, Marks & channels |
| Bubble chart | D3.js scatterplot | Tabular data, Marks & channels |
| Stacked area | D3.js stack + area generator | Time series, Storytelling |
| Price strip chart | D3.js force jitter | Tabular data, Interaction design |
| Scroll framework | Scrollama (IntersectionObserver) | Storytelling with data |
| Data preprocessing | Python + pandas | — |
| Hosting | GitHub Pages | — |

We use vanilla HTML/CSS/JS with no build step or framework, which keeps the project simple but means we handle state ourselves. Smooth scrolling is handled by Lenis.

## Implementation Breakdown

### Core (the story works with just these)

- Scrollytelling skeleton with section navigation and Scrollama triggers
- Beeswarm chart (Section 1): the entry point, introduces the dataset
- Radar charts (Section 2): gender comparison, the most narratively compelling part
- Bubble chart (Section 3): directly answers "what makes a note popular vs. well-rated"
- Hover tooltips and smooth transitions everywhere

### Stretch goals (ordered by how much they add)

1. Stacked area chart — temporal trends give historical context
2. Chord diagram — note pairings, visually impressive
3. Sankey diagram — compositional structure from top to base
4. Price strip chart — depends on dataset matching quality
5. Perfume search — type a name, see its profile highlighted

If time runs short, sections 1 through 3 with the scroll skeleton already tell a complete story. Sections 4 and 5 add depth but are not critical to the main message.

## Functional Prototype

The current prototype is running at **https://com-480-data-visualization.github.io/MSV/**. It includes the scrollytelling skeleton, the dark theme with section navigation, and the first two core visualizations (beeswarm and radar) in working interactive form. The other sections show placeholder containers that we will fill progressively.
