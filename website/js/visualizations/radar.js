/* ============================================
   RADAR.JS — Gender note-family radar comparison
   Two side-by-side spider charts (women / men)
   ============================================ */

(function () {
  'use strict';

  // ── Constants ──
  var FAMILIES = ['floral', 'woody', 'citrus', 'spicy', 'fresh', 'sweet', 'musky', 'fruity'];
  var FAMILY_COUNT = FAMILIES.length;
  var ANGLE_SLICE = (Math.PI * 2) / FAMILY_COUNT;

  var COLOR_WOMEN = '#e8a0bf';
  var COLOR_MEN = '#6ba89c';
  var COLOR_UNISEX = '#c9a96e';
  var COLOR_GRID = 'rgba(255, 255, 255, 0.15)';
  var COLOR_LABEL = '#b8a898';
  var COLOR_HIGHLIGHT = '#e8e0d4';

  var TRANSITION_MS = 600;
  var POLYGON_OPACITY = 0.45;
  var POLYGON_OPACITY_HIGHLIGHT = 0.6;
  var GRID_LEVELS = 5;
  var LABEL_FONT_SIZE = 11;
  var LABEL_FONT_FAMILY = 'Cormorant Garamond, Georgia, serif';

  // ── Helpers ──

  function aggregateByFamily(data) {
    var families = {};
    FAMILIES.forEach(function (f) {
      families[f] = { women: 0, men: 0, unisex: 0 };
    });

    var layers = ['top', 'middle', 'base'];
    layers.forEach(function (layer) {
      if (!data[layer]) return;
      data[layer].forEach(function (entry) {
        var family = window.getNoteFamily(entry.note);
        if (families[family]) {
          families[family].women += entry.women;
          families[family].men += entry.men;
          families[family].unisex += entry.unisex;
        }
      });
    });

    return FAMILIES.map(function (f) {
      return {
        family: f,
        women: families[f].women,
        men: families[f].men,
        unisex: families[f].unisex,
      };
    });
  }

  function getMaxValue(familyData) {
    var max = 0;
    familyData.forEach(function (d) {
      max = Math.max(max, d.women, d.men, d.unisex);
    });
    return max;
  }

  function polarToCartesian(angle, radius) {
    return {
      x: radius * Math.cos(angle - Math.PI / 2),
      y: radius * Math.sin(angle - Math.PI / 2),
    };
  }

  function buildPolygonPoints(familyData, gender, rScale) {
    return familyData.map(function (d, i) {
      var angle = ANGLE_SLICE * i;
      var r = rScale(d[gender]);
      return polarToCartesian(angle, r);
    });
  }

  function pointsToPath(points) {
    return d3.line()
      .x(function (d) { return d.x; })
      .y(function (d) { return d.y; })
      .curve(d3.curveLinearClosed)(points);
  }

  // ── Draw one radar chart ──

  function drawRadar(g, familyData, maxVal, radius, gender, color, chartId) {
    var rScale = d3.scaleLinear().domain([0, maxVal]).range([0, radius]);

    // Grid circles
    var gridGroup = g.append('g').attr('class', 'radar-grid');
    d3.range(1, GRID_LEVELS + 1).forEach(function (level) {
      var r = (radius / GRID_LEVELS) * level;
      gridGroup.append('circle')
        .attr('r', r)
        .attr('fill', 'none')
        .attr('stroke', COLOR_GRID)
        .attr('stroke-width', 1);
    });

    // Axis lines
    var axisGroup = g.append('g').attr('class', 'radar-axes');
    FAMILIES.forEach(function (_, i) {
      var angle = ANGLE_SLICE * i;
      var end = polarToCartesian(angle, radius);
      axisGroup.append('line')
        .attr('x1', 0).attr('y1', 0)
        .attr('x2', end.x).attr('y2', end.y)
        .attr('stroke', COLOR_GRID)
        .attr('stroke-width', 1);
    });

    // Data polygon
    var points = buildPolygonPoints(familyData, gender, rScale);
    var polygonGroup = g.append('g').attr('class', 'radar-polygon');

    polygonGroup.append('path')
      .attr('class', 'radar-area radar-area-' + gender)
      .attr('d', pointsToPath(points))
      .attr('fill', color)
      .attr('fill-opacity', POLYGON_OPACITY)
      .attr('stroke', color)
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 1);

    // Data points
    points.forEach(function (pt, i) {
      polygonGroup.append('circle')
        .attr('class', 'radar-dot radar-dot-' + gender)
        .attr('cx', pt.x).attr('cy', pt.y)
        .attr('r', 3)
        .attr('fill', color)
        .attr('stroke', '#0a0a0a')
        .attr('stroke-width', 1);
    });

    // Unisex overlay (hidden by default)
    var unisexPoints = buildPolygonPoints(familyData, 'unisex', rScale);
    var unisexGroup = g.append('g')
      .attr('class', 'radar-unisex')
      .style('opacity', 0)
      .style('pointer-events', 'none');

    unisexGroup.append('path')
      .attr('class', 'radar-area radar-area-unisex')
      .attr('d', pointsToPath(unisexPoints))
      .attr('fill', COLOR_UNISEX)
      .attr('fill-opacity', 0.15)
      .attr('stroke', COLOR_UNISEX)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '6 3')
      .attr('stroke-opacity', 0.7);

    unisexPoints.forEach(function (pt) {
      unisexGroup.append('circle')
        .attr('cx', pt.x).attr('cy', pt.y)
        .attr('r', 2.5)
        .attr('fill', COLOR_UNISEX)
        .attr('stroke', '#0a0a0a')
        .attr('stroke-width', 1);
    });

    // Axis labels with hover zones
    var labelGroup = g.append('g').attr('class', 'radar-labels');
    var labelOffset = radius + 18;

    FAMILIES.forEach(function (fam, i) {
      var angle = ANGLE_SLICE * i;
      var pos = polarToCartesian(angle, labelOffset);

      var textAnchor = 'middle';
      if (Math.abs(pos.x) > 5) {
        textAnchor = pos.x > 0 ? 'start' : 'end';
      }

      var label = labelGroup.append('text')
        .attr('class', 'radar-label')
        .attr('data-family', fam)
        .attr('data-chart', chartId)
        .attr('x', pos.x).attr('y', pos.y)
        .attr('text-anchor', textAnchor)
        .attr('dominant-baseline', 'central')
        .attr('fill', COLOR_LABEL)
        .attr('font-size', LABEL_FONT_SIZE + 'px')
        .attr('font-family', LABEL_FONT_FAMILY)
        .style('cursor', 'pointer')
        .text(fam.charAt(0).toUpperCase() + fam.slice(1));

      // Invisible hit area for hover
      var hitPos = polarToCartesian(angle, radius * 0.5);
      labelGroup.append('circle')
        .attr('cx', hitPos.x).attr('cy', hitPos.y)
        .attr('r', 20)
        .attr('fill', 'transparent')
        .style('cursor', 'pointer')
        .on('mouseenter', function (event) {
          handleAxisHover(g, fam, familyData[i], gender, event);
          label.attr('fill', COLOR_HIGHLIGHT).attr('font-weight', 600);
        })
        .on('mouseleave', function () {
          handleAxisLeave(g);
          label.attr('fill', COLOR_LABEL).attr('font-weight', 'normal');
        });

      label
        .on('mouseenter', function (event) {
          handleAxisHover(g, fam, familyData[i], gender, event);
          label.attr('fill', COLOR_HIGHLIGHT).attr('font-weight', 600);
        })
        .on('mouseleave', function () {
          handleAxisLeave(g);
          label.attr('fill', COLOR_LABEL).attr('font-weight', 'normal');
        });
    });

    // Title
    g.append('text')
      .attr('class', 'radar-title')
      .attr('y', -radius - 35)
      .attr('text-anchor', 'middle')
      .attr('fill', color)
      .attr('font-family', LABEL_FONT_FAMILY)
      .attr('font-size', '16px')
      .attr('font-weight', 500)
      .text(gender === 'women' ? "Women's Profile" : "Men's Profile");

    return { rScale: rScale, polygonGroup: polygonGroup, unisexGroup: unisexGroup };
  }

  // ── Axis hover ──

  function handleAxisHover(g, family, datum, gender, event) {
    // Highlight the axis line
    g.selectAll('.radar-axes line').each(function (_, i) {
      d3.select(this).attr('stroke', FAMILIES[i] === family ? COLOR_HIGHLIGHT : COLOR_GRID);
    });

    var html = '<div class="tooltip-title">' + family.charAt(0).toUpperCase() + family.slice(1) + '</div>' +
      '<div class="tooltip-row"><span class="tooltip-label">Women</span><span class="tooltip-value" style="color:' + COLOR_WOMEN + '">' + datum.women.toLocaleString() + '</span></div>' +
      '<div class="tooltip-row"><span class="tooltip-label">Men</span><span class="tooltip-value" style="color:' + COLOR_MEN + '">' + datum.men.toLocaleString() + '</span></div>' +
      '<div class="tooltip-row"><span class="tooltip-label">Unisex</span><span class="tooltip-value" style="color:' + COLOR_UNISEX + '">' + datum.unisex.toLocaleString() + '</span></div>';

    window.showTooltip(html, event.pageX, event.pageY);
  }

  function handleAxisLeave(g) {
    g.selectAll('.radar-axes line').attr('stroke', COLOR_GRID);
    window.hideTooltip();
  }

  // ── Highlight a specific axis ──

  function highlightAxis(svg, family) {
    svg.selectAll('.radar-label').each(function () {
      var el = d3.select(this);
      var fam = el.attr('data-family');
      if (fam === family) {
        el.transition().duration(TRANSITION_MS)
          .attr('fill', COLOR_HIGHLIGHT)
          .attr('font-weight', 600)
          .attr('font-size', (LABEL_FONT_SIZE + 2) + 'px');
      } else {
        el.transition().duration(TRANSITION_MS)
          .attr('fill', COLOR_LABEL)
          .attr('font-weight', 'normal')
          .attr('font-size', LABEL_FONT_SIZE + 'px');
      }
    });
  }

  function highlightAxes(svg, families) {
    svg.selectAll('.radar-label').each(function () {
      var el = d3.select(this);
      var fam = el.attr('data-family');
      if (families.indexOf(fam) !== -1) {
        el.transition().duration(TRANSITION_MS)
          .attr('fill', COLOR_HIGHLIGHT)
          .attr('font-weight', 600)
          .attr('font-size', (LABEL_FONT_SIZE + 2) + 'px');
      } else {
        el.transition().duration(TRANSITION_MS)
          .attr('fill', COLOR_LABEL)
          .attr('font-weight', 'normal')
          .attr('font-size', LABEL_FONT_SIZE + 'px');
      }
    });
  }

  function clearHighlights(svg) {
    svg.selectAll('.radar-label')
      .transition().duration(TRANSITION_MS)
      .attr('fill', COLOR_LABEL)
      .attr('font-weight', 'normal')
      .attr('font-size', LABEL_FONT_SIZE + 'px');
  }

  // ── Toggle button ──

  function createToggleButton(container) {
    var btn = document.createElement('button');
    btn.className = 'radar-toggle-btn';
    btn.textContent = 'Show Unisex';
    btn.setAttribute('aria-pressed', 'false');

    // Inline styles for the pill toggle
    Object.assign(btn.style, {
      position: 'absolute',
      top: '12px',
      right: '16px',
      zIndex: '10',
      padding: '6px 16px',
      border: '1px solid ' + COLOR_UNISEX,
      borderRadius: '20px',
      background: 'rgba(201, 169, 110, 0.08)',
      color: COLOR_UNISEX,
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '12px',
      fontWeight: '500',
      letterSpacing: '0.04em',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    });

    btn.addEventListener('mouseenter', function () {
      btn.style.background = 'rgba(201, 169, 110, 0.2)';
    });
    btn.addEventListener('mouseleave', function () {
      var isActive = btn.getAttribute('aria-pressed') === 'true';
      btn.style.background = isActive
        ? 'rgba(201, 169, 110, 0.25)'
        : 'rgba(201, 169, 110, 0.08)';
    });

    container.style.position = 'relative';
    container.appendChild(btn);
    return btn;
  }

  // ── Main init ──

  window.initRadar = function (containerId, dataPath) {
    var container = document.getElementById(containerId);
    if (!container) {
      console.error('Radar: container #' + containerId + ' not found');
      return { onStep: function () {} };
    }

    var svg, womenGroup, menGroup, womenParts, menParts;
    var familyData = null;
    var currentStep = -1;
    var unisexVisible = false;

    d3.json(dataPath).then(function (data) {
      if (!data || !data.top) {
        console.error('Radar: invalid data from ' + dataPath);
        return;
      }

      familyData = aggregateByFamily(data);
      var maxVal = getMaxValue(familyData);

      var rect = container.getBoundingClientRect();
      var width = rect.width || 700;
      var height = rect.height || 500;
      var chartRadius = Math.min(width / 2, height) * 0.32;
      var chartSpacing = width * 0.25;

      svg = d3.select(container).append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', '0 0 ' + width + ' ' + height)
        .attr('preserveAspectRatio', 'xMidYMid meet');

      var centerY = height / 2 + 10;

      // Women chart (left)
      womenGroup = svg.append('g')
        .attr('class', 'radar-chart radar-women')
        .attr('transform', 'translate(' + (width / 2 - chartSpacing) + ',' + centerY + ')');

      womenParts = drawRadar(womenGroup, familyData, maxVal, chartRadius, 'women', COLOR_WOMEN, 'women');

      // Men chart (right)
      menGroup = svg.append('g')
        .attr('class', 'radar-chart radar-men')
        .attr('transform', 'translate(' + (width / 2 + chartSpacing) + ',' + centerY + ')');

      menParts = drawRadar(menGroup, familyData, maxVal, chartRadius, 'men', COLOR_MEN, 'men');

      // Start hidden — will be revealed by scrollama
      womenGroup.style('opacity', 0);
      menGroup.style('opacity', 0);

      // Toggle button
      var toggleBtn = createToggleButton(container);
      toggleBtn.addEventListener('click', function () {
        unisexVisible = !unisexVisible;
        toggleBtn.textContent = unisexVisible ? 'Hide Unisex' : 'Show Unisex';
        toggleBtn.setAttribute('aria-pressed', String(unisexVisible));
        toggleBtn.style.background = unisexVisible
          ? 'rgba(201, 169, 110, 0.25)'
          : 'rgba(201, 169, 110, 0.08)';

        var targetOpacity = unisexVisible ? 1 : 0;
        if (womenParts) {
          womenParts.unisexGroup
            .transition().duration(TRANSITION_MS)
            .style('opacity', targetOpacity);
        }
        if (menParts) {
          menParts.unisexGroup
            .transition().duration(TRANSITION_MS)
            .style('opacity', targetOpacity);
        }
      });

    }).catch(function (err) {
      console.error('Radar: failed to load data —', err);
    });

    // ── Scrollama step handler ──

    function onStep(stepIndex) {
      if (!svg || stepIndex === currentStep) return;
      currentStep = stepIndex;

      switch (stepIndex) {
        case 0:
          // Show women only, highlight floral
          womenGroup.transition().duration(TRANSITION_MS).style('opacity', 1);
          menGroup.transition().duration(TRANSITION_MS).style('opacity', 0);
          highlightAxis(svg, 'floral');
          break;

        case 1:
          // Show men only, highlight woody
          womenGroup.transition().duration(TRANSITION_MS).style('opacity', 0);
          menGroup.transition().duration(TRANSITION_MS).style('opacity', 1);
          highlightAxis(svg, 'woody');
          break;

        case 2:
          // Show both, highlight shared axes
          womenGroup.transition().duration(TRANSITION_MS).style('opacity', 1);
          menGroup.transition().duration(TRANSITION_MS).style('opacity', 1);
          highlightAxes(svg, ['musky', 'citrus']);
          break;

        default:
          womenGroup.transition().duration(TRANSITION_MS).style('opacity', 1);
          menGroup.transition().duration(TRANSITION_MS).style('opacity', 1);
          clearHighlights(svg);
          break;
      }
    }

    return { onStep: onStep };
  };
})();
