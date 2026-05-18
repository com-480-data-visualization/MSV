# Ground Truth: Codebase Health

## Current state (post geo-radar addition)
- 9 viz files in docs/js/visualizations/ (beeswarm, radar, bubbles, timeline, price, chord, sankey, heatmap, geo-radar)
- 8 JSON data files in docs/data/
- geo-radar.js: 376 lines, single overlaid radar, scrollama-driven
- bubbles.js: 365 lines, BUBBLE_RADIUS_RANGE [5,38], TOP_N 40
- main.js: 259 lines, vizConfigs has 9 entries
- index.html: ~280 lines, 8 sections + hero + footer
- style.css: 595 lines

## Key interfaces
- vizConfigs array in main.js: {initFn, containerId, dataPath, scrollyId}
- All vizs: window.initXxx(containerId, dataPath) → {onStep(idx, dir)}
- Shared: NOTE_FAMILIES, getNoteFamily, getNoteColor, FAMILY_COLORS
- Shared: showTooltip, hideTooltip, escapeHtml

## Tech debt
- price.js at 516 lines (over 400 limit)
- No resize handling except heatmap
- geo-radar.js REGION_COLORS defined locally, should be shared if geo-map.js also needs them
