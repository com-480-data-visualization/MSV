/* ============================================
   GEO-MAP.JS — Interactive world choropleth
   with side-panel radar on hover by region
   ============================================ */

(function () {
  'use strict';

  var TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
  var RADAR_CONTAINER_ID = 'viz-geo-radar-side';

  var COLOR_UNMATCHED = '#1a1a1a';
  var COLOR_BORDER = 'rgba(255, 255, 255, 0.08)';
  var COLOR_HOVER_STROKE = '#c9a96e';
  var COLOR_LABEL = '#b8a898';
  var HOVER_STROKE_WIDTH = 1.5;
  var DEFAULT_OPACITY = 0.85;
  var DIM_OPACITY = 0.3;
  var REGION_HIGHLIGHT_OPACITY = 0.8;
  var TRANSITION_MS = 400;
  var RADAR_FULL_OPACITY = 0.35;
  var RADAR_DIM_OPACITY = 0.1;
  var GRID_LEVELS = 5;
  var LABEL_FONT_SIZE = 11;
  var LABEL_FONT_FAMILY = 'Cormorant Garamond, Georgia, serif';

  var COUNTRY_REGION = {
    'France': 'Europe', 'Italy': 'Europe', 'United Kingdom': 'Europe', 'Spain': 'Europe',
    'Germany': 'Europe', 'Sweden': 'Europe', 'Switzerland': 'Europe', 'Netherlands': 'Europe',
    'Russia': 'Europe', 'Poland': 'Europe', 'Greece': 'Europe', 'Denmark': 'Europe',
    'Czech Rep.': 'Europe', 'Czechia': 'Europe', 'Romania': 'Europe', 'Portugal': 'Europe',
    'Latvia': 'Europe', 'Ireland': 'Europe', 'Belgium': 'Europe', 'Monaco': 'Europe',
    'Iceland': 'Europe', 'Hungary': 'Europe', 'Finland': 'Europe', 'Norway': 'Europe',
    'Austria': 'Europe', 'Ukraine': 'Europe',
    'United States of America': 'North America', 'Canada': 'North America', 'Mexico': 'North America',
    'Japan': 'Asia', 'South Korea': 'Asia', 'India': 'Asia', 'Thailand': 'Asia',
    'Indonesia': 'Asia', 'Malaysia': 'Asia', 'China': 'Asia', 'Vietnam': 'Asia',
    'Philippines': 'Asia', 'Singapore': 'Asia', 'Taiwan': 'Asia',
    'Australia': 'Asia', 'New Zealand': 'Asia',
    'United Arab Emirates': 'Middle East', 'Oman': 'Middle East', 'Saudi Arabia': 'Middle East',
    'Bahrain': 'Middle East', 'Turkey': 'Middle East', 'Lebanon': 'Middle East',
    'Egypt': 'Middle East', 'Kuwait': 'Middle East', 'Qatar': 'Middle East', 'Iran': 'Middle East',
    'Israel': 'Middle East', 'Iraq': 'Middle East', 'Jordan': 'Middle East', 'Syria': 'Middle East',
    'Brazil': 'South America', 'Argentina': 'South America', 'Peru': 'South America',
    'Chile': 'South America', 'Colombia': 'South America', 'Venezuela': 'South America',
    'Ecuador': 'South America', 'Bolivia': 'South America', 'Paraguay': 'South America',
    'Uruguay': 'South America', 'Guyana': 'South America', 'Suriname': 'South America',
    'Falkland Is.': 'South America', 'Fr. S. Antarctic Lands': 'South America',
  };

  function getRegionColor(regionName) {
    var utils = window.GEO_RADAR_UTILS;
    return utils ? (utils.REGION_COLORS[regionName] || COLOR_UNMATCHED) : COLOR_UNMATCHED;
  }

  function getCountryRegion(countryName) {
    return COUNTRY_REGION[countryName] || null;
  }

  function buildRegionCountMap(geoData) {
    var map = {};
    if (!geoData || !geoData.regions) return map;
    geoData.regions.forEach(function (r) { map[r.name] = r.count; });
    return map;
  }

  function drawSideRadar(container, geoData, highlightRegion) {
    var sel = d3.select(container);
    sel.selectAll('*').remove();
    var utils = window.GEO_RADAR_UTILS;
    if (!utils || !geoData || !geoData.regions) return;

    var rect = container.getBoundingClientRect();
    var width = rect.width || 300;
    var height = rect.height || 400;
    var radius = Math.min(width, height) * 0.33;

    var regions = geoData.regions;
    var normMap = {};
    var maxProportion = 0;
    regions.forEach(function (region) {
      var nv = utils.normalizeRegion(region);
      normMap[region.name] = nv;
      nv.forEach(function (v) { if (v > maxProportion) maxProportion = v; });
    });

    var rScale = d3.scaleLinear().domain([0, maxProportion]).range([0, radius]);

    var svg = sel.append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', '0 0 ' + width + ' ' + height)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    var g = svg.append('g')
      .attr('transform', 'translate(' + (width / 2) + ',' + (height / 2 + 10) + ')');

    utils.drawGrid(g, radius);
    utils.drawLabels(g, radius);

    regions.forEach(function (region) {
      var nv = normMap[region.name];
      var color = utils.REGION_COLORS[region.name] || '#aaaaaa';
      var points = utils.buildPolygonPoints(nv, rScale);
      var opacity = highlightRegion
        ? (region.name === highlightRegion ? RADAR_FULL_OPACITY : RADAR_DIM_OPACITY)
        : RADAR_FULL_OPACITY;

      var rg = g.append('g').attr('class', 'geo-map-radar-region');

      rg.append('path')
        .attr('d', utils.pointsToPath(points))
        .attr('fill', color)
        .attr('fill-opacity', opacity)
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('stroke-opacity', region.name === highlightRegion ? 1 : (highlightRegion ? 0.2 : 0.8));

      var showDots = !highlightRegion || region.name === highlightRegion;
      if (showDots) {
        points.forEach(function (pt) {
          rg.append('circle')
            .attr('cx', pt.x).attr('cy', pt.y)
            .attr('r', 3)
            .attr('fill', color)
            .attr('fill-opacity', opacity + 0.2)
            .attr('stroke', '#0a0a0a')
            .attr('stroke-width', 1);
        });
      }
    });

    if (highlightRegion) {
      var titleColor = utils.REGION_COLORS[highlightRegion] || '#e8e0d4';
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', 24)
        .attr('text-anchor', 'middle')
        .attr('fill', titleColor)
        .attr('font-family', LABEL_FONT_FAMILY)
        .attr('font-size', '15px')
        .attr('font-weight', '600')
        .text(highlightRegion);
    }
  }

  function buildTooltipHtml(regionName, perfumeCount) {
    var color = getRegionColor(regionName);
    var html = '<div class="tooltip-title" style="color:' + color + '">' +
      window.escapeHtml(regionName) + '</div>';
    if (perfumeCount !== null && perfumeCount !== undefined) {
      html += '<div class="tooltip-row"><span class="tooltip-label">Perfumes</span>' +
        '<span class="tooltip-value">' + perfumeCount.toLocaleString() + '</span></div>';
    }
    return html;
  }

  window.initGeoMap = function (containerId, dataPath) {
    var container = document.getElementById(containerId);
    if (!container) {
      console.error('GeoMap: container #' + containerId + ' not found');
      return { onStep: function () {} };
    }

    var radarContainer = document.getElementById(RADAR_CONTAINER_ID);
    var mapSvg, countryPaths, geoData, regionCountMap;
    var currentStep = -1;

    Promise.all([
      d3.json(dataPath),
      d3.json(TOPO_URL),
    ]).then(function (results) {
      geoData = results[0];
      var world = results[1];
      regionCountMap = buildRegionCountMap(geoData);

      if (!geoData || !geoData.regions) {
        console.error('GeoMap: invalid geo data');
        return;
      }

      var countries = topojson.feature(world, world.objects.countries);
      var rect = container.getBoundingClientRect();
      var width = rect.width || 800;
      var height = rect.height || 500;

      var projection = d3.geoNaturalEarth1()
        .fitSize([width, height], countries);
      var path = d3.geoPath().projection(projection);

      mapSvg = d3.select(container).append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', '0 0 ' + width + ' ' + height)
        .attr('preserveAspectRatio', 'xMidYMid meet');

      countryPaths = mapSvg.selectAll('path.geo-country')
        .data(countries.features)
        .join('path')
        .attr('class', 'geo-country')
        .attr('d', path)
        .attr('fill', function (d) {
          var region = getCountryRegion(d.properties.name);
          return region ? getRegionColor(region) : COLOR_UNMATCHED;
        })
        .attr('stroke', function (d) {
          var region = getCountryRegion(d.properties.name);
          return region ? getRegionColor(region) : COLOR_BORDER;
        })
        .attr('stroke-width', function (d) {
          return getCountryRegion(d.properties.name) ? 0.3 : 0.5;
        })
        .attr('opacity', DEFAULT_OPACITY)
        .attr('data-region', function (d) {
          return getCountryRegion(d.properties.name) || '';
        })
        .attr('data-name', function (d) { return d.properties.name; })
        .on('mouseenter', function (event, d) {
          var name = d.properties.name;
          var region = getCountryRegion(name);

          if (!region) {
            window.showTooltip(
              '<div class="tooltip-title" style="color:#666">No data</div>' +
              '<div class="tooltip-row"><span class="tooltip-label" style="color:#666">Insufficient perfume data for this region</span></div>',
              event.pageX, event.pageY
            );
            return;
          }

          d3.select(this)
            .attr('opacity', 1)
            .raise();

          countryPaths.each(function () {
            var el = d3.select(this);
            var elRegion = el.attr('data-region');
            if (el.node() === event.currentTarget) return;
            if (elRegion === region) {
              el.transition().duration(150).attr('opacity', REGION_HIGHLIGHT_OPACITY);
            } else {
              el.transition().duration(150).attr('opacity', DIM_OPACITY);
            }
          });

          if (radarContainer) {
            drawSideRadar(radarContainer, geoData, region);
          }

          var count = regionCountMap[region] || null;
          window.showTooltip(buildTooltipHtml(region, count), event.pageX, event.pageY);
        })
        .on('mousemove', function (event, d) {
          var region = getCountryRegion(d.properties.name);
          if (!region) return;
          var count = regionCountMap[region] || null;
          window.showTooltip(buildTooltipHtml(region, count), event.pageX, event.pageY);
        })
        .on('mouseleave', function () {
          if (radarContainer) {
            drawSideRadar(radarContainer, geoData, null);
          }
          countryPaths.each(function () {
            var el = d3.select(this);
            var r = el.attr('data-region');
            el.transition().duration(200)
              .attr('opacity', DEFAULT_OPACITY)
              .attr('stroke', r ? getRegionColor(r) : COLOR_BORDER)
              .attr('stroke-width', r ? 0.3 : 0.5);
          });

          window.hideTooltip();
        });

      if (radarContainer) {
        drawSideRadar(radarContainer, geoData, null);
      }

      var geoSteps = document.querySelectorAll('.geo-steps .step');
      if (geoSteps.length > 0) {
        geoSteps[0].classList.add('is-active');
        onStep(0);
        geoSteps.forEach(function (stepEl, idx) {
          stepEl.addEventListener('click', function () {
            geoSteps.forEach(function (s) { s.classList.remove('is-active'); });
            stepEl.classList.add('is-active');
            onStep(idx);
          });
        });
      }

    }).catch(function (err) {
      console.error('GeoMap: failed to load data —', err);
    });

    function highlightMapRegion(regionName) {
      if (!countryPaths) return;
      countryPaths.each(function () {
        var el = d3.select(this);
        var r = el.attr('data-region');
        if (r === regionName) {
          el.transition().duration(TRANSITION_MS).attr('opacity', 1);
        } else {
          el.transition().duration(TRANSITION_MS).attr('opacity', DIM_OPACITY);
        }
      });
    }

    function highlightMapRegions(regionNames) {
      if (!countryPaths) return;
      countryPaths.each(function () {
        var el = d3.select(this);
        var r = el.attr('data-region');
        if (regionNames.indexOf(r) !== -1) {
          el.transition().duration(TRANSITION_MS).attr('opacity', 1);
        } else {
          el.transition().duration(TRANSITION_MS).attr('opacity', DIM_OPACITY);
        }
      });
    }

    function resetMapHighlights() {
      if (!countryPaths) return;
      countryPaths
        .transition().duration(TRANSITION_MS)
        .attr('opacity', DEFAULT_OPACITY)
        .attr('stroke', COLOR_BORDER)
        .attr('stroke-width', 0.5);
    }

    function onStep(stepIndex) {
      if (!mapSvg) return;
      currentStep = stepIndex;

      switch (stepIndex) {
        case 0:
          highlightMapRegion('Europe');
          if (radarContainer) drawSideRadar(radarContainer, geoData, 'Europe');
          break;
        case 1:
          highlightMapRegion('North America');
          if (radarContainer) drawSideRadar(radarContainer, geoData, 'North America');
          break;
        case 2:
          highlightMapRegion('Middle East');
          if (radarContainer) drawSideRadar(radarContainer, geoData, 'Middle East');
          break;
        case 3:
          highlightMapRegion('Asia');
          if (radarContainer) drawSideRadar(radarContainer, geoData, 'Asia');
          break;
        default:
          resetMapHighlights();
          if (radarContainer) drawSideRadar(radarContainer, geoData, null);
          break;
      }
    }

    return { onStep: onStep };
  };
})();
