# Ground Truth: Approach

## Map approach: D3 choropleth with TopoJSON (CHOSEN)
- CDN: world-atlas@2/countries-110m.json + topojson-client@3
- d3.geoNaturalEarth1() projection
- Integrated two-panel layout: map left, radar right
- Hover on country → radar shows that region

## Alternative rejected: Leaflet/Mapbox
Over-engineered for this use case. D3 native geo is sufficient.

## Radar refactor approach
Expose window.drawGeoRadarChart(containerId, geoData, options) from geo-radar.js.
geo-map.js calls it to update the side panel. Keep backward compat with scrollama onStep.

## Bubble fix
Simple constant change — BUBBLE_RADIUS_RANGE and TOP_N. No architectural change.
