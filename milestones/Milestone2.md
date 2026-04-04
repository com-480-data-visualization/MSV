# Milestone 2: The Anatomy of Scent

**COM-480 Data Visualization** | Alexandre Mourot (346365), Gaël Conde Losada (329871)

## Project Goal

We want to understand what makes a perfume work. Not from a chemistry standpoint, but from a data one: what notes show up most often, do popular notes actually get good ratings, how do men's and women's perfumes really differ in composition, and how has all of this changed over the past fifty years. We have two datasets for this. The main one is from Fragrantica (about 24,000 perfumes with detailed note breakdowns, user ratings, accords, gender labels and release years). The second is an eBay pricing dataset with roughly 2,000 listings that lets us bring in a market angle.

The format we picked is a scrollytelling website. Each section covers one question through one visualization, and the reader just scrolls through. No clicking around dashboards or toggling filters. We are going for a dark, luxury aesthetic with gold accents and Cormorant Garamond as the heading font because the subject calls for it. The goal is something closer to a long form magazine piece than a typical data project.

## Visualization Sketches

We have five main sections planned. Here is what each one does and what it should roughly look like.

**Section 1: "The Building Blocks" (Beeswarm Chart).** A constellation of bubbles where each one is a fragrance note, sized by how often it appears in the dataset. They cluster by note family (floral, woody, citrus, spicy, fresh, sweet). Musk alone shows up in over 11,000 perfumes. Pink pepper, on the other hand, barely reaches a few hundred. On hover you get the count and the top brands using that note. We took some inspiration from the "Fragrance of Data" project that got recognition at the Information is Beautiful Awards.

![Beeswarm sketch](figures/m2/beeswarm_sketch.png)

**Section 2: "His & Hers" (Radar Charts).** Two radar charts placed side by side, one for women's perfumes, one for men's. Eight axes, one per note family. From our EDA we know jasmine and rose dominate women's compositions while patchouli and cedar lean masculine. But musk and bergamot are pretty much everywhere regardless of gender. A toggle lets the reader add a unisex overlay as a third layer.

![Radar sketch](figures/m2/radar_sketch.png)

**Section 3: "The Ratings Game" (Bubble Chart).** Frequency on the x axis, average user rating on the y axis. Bubble size encodes how many perfumes contain each note. What we found interesting in the EDA is that being common does not mean being loved. Tonka bean and pink pepper both have high average ratings despite appearing in far fewer perfumes, while musk is everywhere but sits around the mean.

![Bubble sketch](figures/m2/bubble_sketch.png)

**Section 4: "Fifty Years of Fragrance" (Stacked Area Chart).** Note family proportions by decade from the 1970s through the 2020s. The reader scrolls forward through time and watches the composition landscape shift. Clean fresh notes take over in the 90s, gourmand ingredients explode in the 2010s, oud keeps gaining ground. We need to bin the data by decade and normalize within each period.

![Stacked area sketch](figures/m2/stacked_area_sketch.png)

**Section 5: "The Price of Scent" (Strip Chart).** A beeswarm strip plot of eBay prices split by gender. Men's listings go from $3 to $259 (mean around $46), women's from $2 to $300 (mean around $40). The hard part here is linking eBay listings to Fragrantica entries because naming conventions are all over the place. We plan to use fuzzy matching on brand names, but this is still experimental.

![Price strip sketch](figures/m2/price_strip_sketch.png)

On top of these five sections we might add a chord diagram showing which notes tend to co-occur and a Sankey diagram tracing the flow from top notes through middle to base. These two are not guaranteed though, they depend on how much time we have left.

## Tools and Lectures

| Visualization | Main tool | Relevant lectures |
|---|---|---|
| Beeswarm | D3.js force simulation | D3.js binding, Interaction design |
| Radar charts | D3.js radial scales + SVG | Perception and color, Marks & channels |
| Bubble chart | D3.js scatterplot | Tabular data, Marks & channels |
| Stacked area | D3.js stack + area generator | Time series, Storytelling |
| Price strip chart | D3.js force jitter | Tabular data, Interaction design |
| Scroll framework | Scrollama (IntersectionObserver) | Storytelling with data |
| Data preprocessing | Python + pandas | n/a |
| Hosting | GitHub Pages | n/a |

Everything is vanilla HTML/CSS/JS, no framework, no build step. Scrollama handles the scroll triggered transitions through the IntersectionObserver API. Smooth scrolling uses Lenis. Data is preprocessed in Python with pandas and served as static JSON.

## Implementation Breakdown

### Core

The story needs to work with just the scrollytelling skeleton, the beeswarm (section 1), the radar (section 2), and the bubble chart (section 3). These three together already answer the main questions: what notes exist, how genders differ, and whether common notes are actually well rated. Add hover tooltips, smooth transitions and a gender filter toggle and we have a complete product. Everything else builds on top of this.

### Stretch goals

The stacked area chart (section 4) would add a historical dimension that makes the story richer. After that, a chord diagram and a Sankey diagram would bring visual depth by showing how notes connect to each other and flow through the three layers of a perfume. The price strip chart (section 5) is interesting but its quality depends entirely on how well we can match the two datasets, so we are not committing to it yet. Last, a perfume search feature where you type a name and see its profile pop up across the visualizations would be a nice touch if we get to it.

## Functional Prototype

The current prototype is running at **https://com-480-data-visualization.github.io/MSV/**. It has the scrollytelling skeleton with section navigation, the dark theme with gold accents, and the first two core visualizations (beeswarm and radar) in interactive form. The other sections show placeholder containers that we will fill as we go.
