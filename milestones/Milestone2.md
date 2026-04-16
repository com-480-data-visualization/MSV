# Milestone 2: The Anatomy of Scent

**COM-480 Data Visualization, EPFL**
Alexandre Mourot (346365), Gaël Conde Losada (329871)

## Project Goal

We are building a scrollytelling website that explores what makes a perfume attractive. The central question is simple: why do some fragrances succeed while others fade into obscurity? Our dataset, drawn from Fragrantica (24,063 perfumes) and eBay pricing data, gives us the raw material to answer that. The site will walk the reader through perfume composition, note patterns, gender preferences, temporal trends, and market pricing, all through interactive D3.js visualizations.

We want the site to feel like walking into a high end perfume boutique. Dark background, refined typography, gold accents. The kind of website where the design itself tells you "this is about something beautiful." We are not building a dashboard. We are telling a story, section by section, as the reader scrolls.

Our target audience sits at the intersection of three groups: perfume enthusiasts who want to see their passion through a data lens, data visualization lovers who enjoy well crafted interactive storytelling, and curious people who have never thought about why bergamot shows up in nearly every fragrance they own. We want to surprise all three.

## Visualization Sketches

The website is structured as five scrollytelling sections. Each section introduces a new angle on the data and a new visualization.

**Section 1: "The Building Blocks"** opens with a beeswarm chart. Each bubble represents a fragrance note, sized by how often it appears across all 24,000 perfumes. The bubbles float upward like scent molecules, clustered by note family (floral, woody, citrus, spicy). Hovering reveals the exact count and top brands using that note. We took direct inspiration from the "Fragrance of Data" project that won recognition at the Information is Beautiful Awards.

```
        o          O = note bubble (size = frequency)
     O     o       Clusters by family:
   o    O    o       [Floral]  [Woody]  [Citrus]  [Spicy]
  O   o   O   o
 o  O   o   O  o   Hover -> tooltip with note details
________________________
```

**Section 2: "His and Hers"** uses side by side radar charts comparing men's and women's fragrance profiles. The radar axes represent the top 8 note families. This is where the data gets interesting: musk and bergamot dominate both genders, but jasmine and rose skew heavily feminine while patchouli and cedar lean masculine. A toggle lets the user add "unisex" as a third overlay.

```
     Floral                    Floral
    /     \                   /     \
Citrus --- Woody         Citrus --- Woody
    \     /                   \     /
     Spicy                    Spicy
   [ WOMEN ]               [ MEN ]
```

**Section 3: "The Ratings Game"** is a bubble chart mapping note frequency (x axis) against average user rating (y axis), with bubble size encoding the number of perfumes containing that note. This reveals whether popular notes are actually well rated or just common. Pink pepper and tonka bean, for instance, appear in fewer perfumes but carry surprisingly high average scores.

```
  Rating
  4.0 |        o (pink pepper)
      |    O        o (tonka bean)
  3.9 | O     O
      |  O  O   O
  3.8 |________________
       0   2000  5000  8000
           Frequency -->
```

**Section 4: "Fifty Years of Fragrance"** shows a stacked area chart of note popularity by decade, from the 1970s to today. The reader scrolls through time and watches aldehydes fade while oud and tonka bean rise. This section connects perfumery to cultural shifts: the clean fresh era of the 1990s, the gourmand explosion of the 2010s.

```
  100% |::::::::::::::::
       |:::woody::::::::
       |:::::::floral:::
       |::citrus::::::::
    0% |________________
       1970  1990  2010  2020
```

**Section 5: "The Price of Scent"** merges our eBay pricing data. A scatter plot positions perfumes by composition profile (x axis, derived from accord similarity) and price (y axis). This is the trickiest visualization because the eBay dataset only covers about 2,000 listings and brand names do not always match cleanly. We plan to use fuzzy matching on brand names to connect the two datasets.

Two additional visualizations appear as interactive sidebars throughout the experience. A chord diagram shows which notes tend to appear together across top, middle, and base layers. And a Sankey diagram traces the flow from top notes through middle notes down to base notes, revealing the most common structural "recipes" in perfumery.

```
  Chord Diagram              Sankey Flow
  Bergamot ---+              TOP    MID    BASE
  Musk -------+--- Rose      Berg-->Jas-->Musk
  Jasmine ----+              Lem--->Rose-->Sand
  Sandalwood--+              Lav--->Iris-->Amb
```

## Tools and Relevant Lectures

All visualizations will be built with **D3.js v7**, the standard library for custom interactive data visualization on the web. We chose D3 over higher level alternatives (Plotly, Chart.js) because we need full control over animations, scroll triggers, and custom layouts like the beeswarm and Sankey.

For scroll driven interactions, we use **Scrollama**, a lightweight library built on the IntersectionObserver API that triggers visualization transitions as elements enter the viewport. Smooth scrolling is handled by **Lenis**, which has become the standard for momentum scrolling in 2025/2026. The site itself is vanilla HTML, CSS, and JavaScript with no frontend framework. Data preprocessing (parsing notes, grouping categories, computing aggregates) was done in Python with **pandas**, and the cleaned data is served as static JSON files.

The site will be hosted on **GitHub Pages**, which requires zero server infrastructure.

From the course lectures, we will draw on: **D3.js** (binding data to DOM, scales, axes, transitions), **Interactions** and **Interactive D3** (hover states, filtering, brushing, linked views), **Perception of Colors** (choosing palettes that work on dark backgrounds, ensuring accessibility), **Marks and Channels** (mapping data attributes to appropriate visual encodings), and **Designing Viz** / **Do and Don't in Viz** (design process, avoiding misleading charts, clarity over decoration). The **Data** lectures informed our preprocessing pipeline, and **Javascript Part 1 & 2** grounded the vanilla JS architecture we chose over a framework.

## Core MVP vs. Stretch Goals

We split the project into what must ship and what would be great to have. This way, if time runs short, we still deliver a coherent product.

**Core (the story must stand on its own with just these):**

The scrollytelling skeleton with five narrative sections. The beeswarm chart of note frequency, which anchors the opening. The gender comparison radar charts, because the his/hers angle is our strongest narrative hook. The rating bubble chart, which answers the core question of "what makes a perfume popular." And basic interactivity everywhere: hover tooltips, smooth transitions between sections, a filter by gender toggle.

**Stretch goals (each one enhances the story but could be dropped):**

The chord diagram showing note co occurrences. The Sankey diagram tracing note flows from top to base. The temporal trends animation. The eBay price analysis scatter plot (this depends on how well we can match datasets). And finally, a perfume search feature where the reader types a fragrance name and sees its note profile as a radar chart.

We are confident the core is achievable in the remaining time. The stretch goals are ordered by impact: the chord diagram and Sankey add the most visual richness, while the search feature is more of a fun bonus.
