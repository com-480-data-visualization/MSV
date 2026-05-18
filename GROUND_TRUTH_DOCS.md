# Ground Truth: Interfaces

## geo_data.json schema
```json
{
  "regions": [
    {"name": "Europe", "countries": [...], "count": 15874,
     "families": {"floral": N, "woody": N, ...},
     "topNotes": [{"note": "musk", "count": N}]}
  ],
  "families": ["floral","woody","citrus","spicy","fresh","sweet","musky","fruity"]
}
```

## geo-radar.js current exports
- window.initGeoRadar(containerId, dataPath) → {onStep}
- REGION_COLORS = {Europe:'#7b9ec9', 'North America':'#c97b7b', Asia:'#7bc9a3', 'Middle East':'#c9b67b', 'South America':'#9b7bc9'}
- normalizeRegion(region) → proportions array

## TopoJSON world-atlas structure
- topojson.feature(world, world.objects.countries) → GeoJSON FeatureCollection
- Each feature.properties.name = country name
- feature.id = ISO numeric code

## CSS variables
--bg-primary:#0a0a0a --accent-gold:#c9a96e --text-primary:#e8e0d4
--text-secondary:#9a9088 --text-muted:#6b6460
--font-heading:'Cormorant Garamond' --font-body:'DM Sans'
