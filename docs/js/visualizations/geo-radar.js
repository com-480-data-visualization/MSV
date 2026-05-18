/* ============================================
   GEO-RADAR.JS — Geographic note-family radar
   Single overlaid spider chart by world region
   ============================================ */

(function () {
  'use strict';

  var FAMILIES = ['floral', 'woody', 'citrus', 'spicy', 'fresh', 'sweet', 'musky', 'fruity'];
  var FAMILY_COUNT = FAMILIES.length;
  var ANGLE_SLICE = (Math.PI * 2) / FAMILY_COUNT;

  var REGION_COLORS = {
    'Europe':        '#7b9ec9',
    'North America': '#c97b7b',
    'Asia':          '#7bc9a3',
    'Middle East':   '#c9b67b',
    'South America': '#9b7bc9',
  };

  var COLOR_GRID      = 'rgba(255, 255, 255, 0.15)';
  var COLOR_LABEL     = '#b8a898';
  var COLOR_HIGHLIGHT = '#e8e0d4';

  var TRANSITION_MS     = 600;
  var POLYGON_OPACITY   = 0.35;
  var GRID_LEVELS       = 5;
  var LABEL_FONT_SIZE   = 11;
  var LABEL_FONT_FAMILY = 'Cormorant Garamond, Georgia, serif';
  var DIM_OPACITY       = 0.1;

  function normalizeRegion(region) {
    var total = FAMILIES.reduce(function (sum, f) { return sum + (region.families[f] || 0); }, 0);
    if (total === 0) return FAMILIES.map(function () { return 0; });
    return FAMILIES.map(function (f) { return (region.families[f] || 0) / total; });
  }

  function polarToCartesian(angle, radius) {
    return {
      x: radius * Math.cos(angle - Math.PI / 2),
      y: radius * Math.sin(angle - Math.PI / 2),
    };
  }

  function buildPolygonPoints(values, rScale) {
    return values.map(function (v, i) {
      var angle = ANGLE_SLICE * i;
      return polarToCartesian(angle, rScale(v));
    });
  }

  function pointsToPath(points) {
    return d3.line()
      .x(function (d) { return d.x; })
      .y(function (d) { return d.y; })
      .curve(d3.curveLinearClosed)(points);
  }

  function drawGrid(g, radius) {
    var gridGroup = g.append('g').attr('class', 'geo-radar-grid');
    d3.range(1, GRID_LEVELS + 1).forEach(function (level) {
      var r = (radius / GRID_LEVELS) * level;
      gridGroup.append('circle')
        .attr('r', r)
        .attr('fill', 'none')
        .attr('stroke', COLOR_GRID)
        .attr('stroke-width', 1);
    });

    var axisGroup = g.append('g').attr('class', 'geo-radar-axes');
    FAMILIES.forEach(function (_, i) {
      var angle = ANGLE_SLICE * i;
      var end = polarToCartesian(angle, radius);
      axisGroup.append('line')
        .attr('x1', 0).attr('y1', 0)
        .attr('x2', end.x).attr('y2', end.y)
        .attr('stroke', COLOR_GRID)
        .attr('stroke-width', 1);
    });
  }

  function drawLabels(g, radius) {
    var labelGroup = g.append('g').attr('class', 'geo-radar-labels');
    var labelOffset = radius + 18;

    FAMILIES.forEach(function (fam, i) {
      var angle = ANGLE_SLICE * i;
      var pos = polarToCartesian(angle, labelOffset);

      var textAnchor = 'middle';
      if (Math.abs(pos.x) > 5) {
        textAnchor = pos.x > 0 ? 'start' : 'end';
      }

      labelGroup.append('text')
        .attr('class', 'geo-radar-label')
        .attr('data-family', fam)
        .attr('x', pos.x).attr('y', pos.y)
        .attr('text-anchor', textAnchor)
        .attr('dominant-baseline', 'central')
        .attr('fill', COLOR_LABEL)
        .attr('font-size', LABEL_FONT_SIZE + 'px')
        .attr('font-family', LABEL_FONT_FAMILY)
        .text(fam.charAt(0).toUpperCase() + fam.slice(1));
    });
  }

  function drawRegionPolygon(g, region, normValues, rScale) {
    var color = REGION_COLORS[region.name] || '#aaaaaa';
    var points = buildPolygonPoints(normValues, rScale);
    var regionGroup = g.append('g')
      .attr('class', 'geo-radar-region')
      .attr('data-region', region.name)
      .style('opacity', 0)
      .style('pointer-events', 'all');

    regionGroup.append('path')
      .attr('class', 'geo-radar-area')
      .attr('d', pointsToPath(points))
      .attr('fill', color)
      .attr('fill-opacity', POLYGON_OPACITY)
      .attr('stroke', color)
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 1);

    points.forEach(function (pt) {
      regionGroup.append('circle')
        .attr('cx', pt.x).attr('cy', pt.y)
        .attr('r', 3)
        .attr('fill', color)
        .attr('stroke', '#0a0a0a')
        .attr('stroke-width', 1);
    });

    return regionGroup;
  }

  function buildTooltipHtml(region, normValues) {
    var color = REGION_COLORS[region.name] || '#aaaaaa';
    var rows = FAMILIES.map(function (f, i) {
      return '<div class="tooltip-row"><span class="tooltip-label">' +
        f.charAt(0).toUpperCase() + f.slice(1) +
        '</span><span class="tooltip-value">' +
        (normValues[i] * 100).toFixed(1) + '%</span></div>';
    }).join('');

    return '<div class="tooltip-title" style="color:' + color + '">' +
      window.escapeHtml(region.name) + '</div>' +
      '<div class="tooltip-row"><span class="tooltip-label">Perfumes</span>' +
      '<span class="tooltip-value">' + region.count.toLocaleString() + '</span></div>' +
      rows;
  }

  function attachHoverEvents(regionGroup, allGroups, region, normValues) {
    regionGroup
      .on('mouseenter', function (event) {
        allGroups.forEach(function (rg) {
          if (rg.attr('data-region') !== region.name) {
            rg.transition().duration(200).style('opacity', DIM_OPACITY);
          }
        });
        var html = buildTooltipHtml(region, normValues);
        window.showTooltip(html, event.pageX, event.pageY);
      })
      .on('mousemove', function (event) {
        window.showTooltip(buildTooltipHtml(region, normValues), event.pageX, event.pageY);
      })
      .on('mouseleave', function () {
        allGroups.forEach(function (rg) {
          var name = rg.attr('data-region');
          if (rg.style('pointer-events') !== 'none') {
            rg.transition().duration(200).style('opacity', function () {
              return rg.attr('data-visible') === 'true' ? 1 : 0;
            });
          }
        });
        window.hideTooltip();
      });
  }

  function createLegend(container, regions) {
    var legend = document.createElement('div');
    legend.className = 'geo-radar-legend';
    Object.assign(legend.style, {
      position:   'absolute',
      top:        '12px',
      right:      '16px',
      display:    'flex',
      flexDirection: 'column',
      gap:        '6px',
      zIndex:     '10',
    });

    regions.forEach(function (region) {
      var color = REGION_COLORS[region.name] || '#aaaaaa';
      var row = document.createElement('div');
      Object.assign(row.style, {
        display:    'flex',
        alignItems: 'center',
        gap:        '8px',
        fontFamily: 'DM Sans, sans-serif',
        fontSize:   '11px',
        color:      COLOR_LABEL,
      });

      var swatch = document.createElement('span');
      Object.assign(swatch.style, {
        width:        '10px',
        height:       '10px',
        borderRadius: '2px',
        background:   color,
        flexShrink:   '0',
      });

      var label = document.createElement('span');
      label.textContent = region.name + ' (' + region.count.toLocaleString() + ')';

      row.appendChild(swatch);
      row.appendChild(label);
      legend.appendChild(row);
    });

    container.style.position = 'relative';
    container.appendChild(legend);
  }

  function highlightLabel(svg, families) {
    svg.selectAll('.geo-radar-label').each(function () {
      var el = d3.select(this);
      var fam = el.attr('data-family');
      var isHighlighted = families.indexOf(fam) !== -1;
      el.transition().duration(TRANSITION_MS)
        .attr('fill', isHighlighted ? COLOR_HIGHLIGHT : COLOR_LABEL)
        .attr('font-weight', isHighlighted ? 600 : 'normal')
        .attr('font-size', isHighlighted ? (LABEL_FONT_SIZE + 2) + 'px' : LABEL_FONT_SIZE + 'px');
    });
  }

  function clearLabelHighlights(svg) {
    svg.selectAll('.geo-radar-label')
      .transition().duration(TRANSITION_MS)
      .attr('fill', COLOR_LABEL)
      .attr('font-weight', 'normal')
      .attr('font-size', LABEL_FONT_SIZE + 'px');
  }

  window.initGeoRadar = function (containerId, dataPath) {
    var container = document.getElementById(containerId);
    if (!container) {
      console.error('GeoRadar: container #' + containerId + ' not found');
      return { onStep: function () {} };
    }

    var svg, g, regionGroups;
    var currentStep = -1;

    d3.json(dataPath).then(function (data) {
      if (!data || !Array.isArray(data.regions) || data.regions.length === 0) {
        console.error('GeoRadar: invalid data from ' + dataPath);
        return;
      }

      var regions = data.regions;
      var normMap = {};
      var maxProportion = 0;
      regions.forEach(function (region) {
        var nv = normalizeRegion(region);
        normMap[region.name] = nv;
        nv.forEach(function (v) { if (v > maxProportion) maxProportion = v; });
      });

      var rect = container.getBoundingClientRect();
      var width = rect.width || 600;
      var height = rect.height || 500;
      var radius = Math.min(width, height) * 0.33;

      var rScale = d3.scaleLinear().domain([0, maxProportion]).range([0, radius]);

      svg = d3.select(container).append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', '0 0 ' + width + ' ' + height)
        .attr('preserveAspectRatio', 'xMidYMid meet');

      g = svg.append('g')
        .attr('class', 'geo-radar-chart')
        .attr('transform', 'translate(' + (width / 2) + ',' + (height / 2 + 10) + ')');

      drawGrid(g, radius);
      drawLabels(g, radius);

      regionGroups = regions.map(function (region) {
        var normValues = normMap[region.name];
        var rg = drawRegionPolygon(g, region, normValues, rScale);
        rg.attr('data-visible', 'false');
        return rg;
      });

      regionGroups.forEach(function (rg, idx) {
        attachHoverEvents(rg, regionGroups, regions[idx], normMap[regions[idx].name]);
      });

      createLegend(container, regions);

    }).catch(function (err) {
      console.error('GeoRadar: failed to load data —', err);
    });

    function showRegion(regionName) {
      if (!regionGroups) return;
      regionGroups.forEach(function (rg) {
        if (rg.attr('data-region') === regionName) {
          rg.attr('data-visible', 'true')
            .transition().duration(TRANSITION_MS)
            .style('opacity', 1);
        }
      });
    }

    function hideRegion(regionName) {
      if (!regionGroups) return;
      regionGroups.forEach(function (rg) {
        if (rg.attr('data-region') === regionName) {
          rg.attr('data-visible', 'false')
            .transition().duration(TRANSITION_MS)
            .style('opacity', 0);
        }
      });
    }

    function showAllRegions() {
      if (!regionGroups) return;
      regionGroups.forEach(function (rg) {
        rg.attr('data-visible', 'true')
          .transition().duration(TRANSITION_MS)
          .style('opacity', 1);
      });
    }

    function onStep(stepIndex) {
      if (!svg || stepIndex === currentStep) return;
      currentStep = stepIndex;

      switch (stepIndex) {
        case 0:
          showRegion('Europe');
          hideRegion('North America');
          hideRegion('Asia');
          hideRegion('Middle East');
          hideRegion('South America');
          highlightLabel(svg, ['floral']);
          break;

        case 1:
          showRegion('Europe');
          showRegion('North America');
          hideRegion('Asia');
          hideRegion('Middle East');
          hideRegion('South America');
          highlightLabel(svg, ['fruity']);
          break;

        case 2:
          showAllRegions();
          highlightLabel(svg, ['woody', 'spicy', 'musky']);
          break;

        default:
          showAllRegions();
          clearLabelHighlights(svg);
          break;
      }
    }

    return { onStep: onStep };
  };
})();
