/* ============================================
   TIMELINE.JS — Stacked Area Chart: Temporal Trends of Note Families
   ============================================ */

(function () {
  'use strict';

  // ── Constants ──
  var TRANSITION_MS = 600;
  var AREA_OPACITY = 0.7;
  var AREA_OPACITY_DIM = 0.2;
  var STROKE_WIDTH = 1;
  var FAMILY_ORDER = ['floral', 'woody', 'citrus', 'spicy', 'fresh', 'sweet', 'musky', 'fruity', 'other'];
  var DECADES = [1970, 1980, 1990, 2000, 2010, 2020];

  var STEP_ANNOTATIONS = [
    {
      decades: [1970, 1980],
      label: 'Aldehydes & classical florals era',
    },
    {
      decades: [1990],
      label: 'Fresh & aquatic revolution',
    },
    {
      decades: [2010, 2020],
      label: 'Oud & gourmand explosion',
    },
  ];

  // ── Data aggregation ──

  function aggregateByFamily(rawData) {
    // Merge all layers (top, middle, base) and group by decade + family
    var layers = ['top', 'middle', 'base'];
    var familyCounts = {};

    DECADES.forEach(function (decade) {
      familyCounts[decade] = {};
      FAMILY_ORDER.forEach(function (fam) {
        familyCounts[decade][fam] = 0;
      });
    });

    layers.forEach(function (layer) {
      if (!rawData[layer]) return;
      rawData[layer].forEach(function (entry) {
        var decade = entry.decade;
        var family = window.getNoteFamily(entry.note);
        if (!familyCounts[decade]) return;
        if (familyCounts[decade][family] === undefined) {
          familyCounts[decade][family] = 0;
        }
        familyCounts[decade][family] += entry.count;
      });
    });

    // Convert to array and compute proportions
    return DECADES.map(function (decade) {
      var row = { decade: decade };
      var total = 0;
      FAMILY_ORDER.forEach(function (fam) {
        total += familyCounts[decade][fam];
      });
      FAMILY_ORDER.forEach(function (fam) {
        row[fam] = total > 0 ? familyCounts[decade][fam] / total : 0;
      });
      row._total = total;
      return row;
    });
  }

  // ── Chart builder ──

  function buildChart(container, stackedData) {
    var containerEl = document.getElementById(container);
    if (!containerEl) {
      throw new Error('Timeline: container #' + container + ' not found');
    }

    var rect = containerEl.getBoundingClientRect();
    var margin = { top: 30, right: 30, bottom: 70, left: 55 };
    var width = rect.width - margin.left - margin.right;
    var height = rect.height - margin.top - margin.bottom;

    if (width <= 0) width = 600;
    if (height <= 0) height = 400;

    // Clear previous content
    d3.select(containerEl).selectAll('*').remove();

    var svg = d3.select(containerEl)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    var g = svg.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    // ── Scales ──
    var x = d3.scaleLinear()
      .domain([DECADES[0], DECADES[DECADES.length - 1]])
      .range([0, width]);

    var y = d3.scaleLinear()
      .domain([0, 1])
      .range([height, 0]);

    var color = function (family) {
      return window.FAMILY_COLORS[family] || '#888888';
    };

    // ── Stack ──
    var stack = d3.stack()
      .keys(FAMILY_ORDER)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    var series = stack(stackedData);

    // ── Area generator ──
    var area = d3.area()
      .x(function (d) { return x(d.data.decade); })
      .y0(function (d) { return y(d[0]); })
      .y1(function (d) { return y(d[1]); })
      .curve(d3.curveMonotoneX);

    var line = d3.line()
      .x(function (d) { return x(d.data.decade); })
      .y(function (d) { return y(d[1]); })
      .curve(d3.curveMonotoneX);

    // ── Highlight band layer (behind areas) ──
    var bandGroup = g.append('g').attr('class', 'highlight-bands');

    // ── Areas ──
    var areaGroup = g.append('g').attr('class', 'area-group');

    var areas = areaGroup.selectAll('.family-area')
      .data(series)
      .join('g')
      .attr('class', 'family-area');

    areas.append('path')
      .attr('class', 'area-fill')
      .attr('d', area)
      .attr('fill', function (d) { return color(d.key); })
      .attr('opacity', AREA_OPACITY);

    areas.append('path')
      .attr('class', 'area-stroke')
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', function (d) { return color(d.key); })
      .attr('stroke-width', STROKE_WIDTH)
      .attr('opacity', 0.9);

    // ── Axes ──
    var xAxis = d3.axisBottom(x)
      .tickValues(DECADES)
      .tickFormat(function (d) { return d + 's'; })
      .tickSize(0)
      .tickPadding(10);

    var yAxis = d3.axisLeft(y)
      .ticks(5)
      .tickFormat(function (d) { return Math.round(d * 100) + '%'; })
      .tickSize(-width)
      .tickPadding(8);

    g.append('g')
      .attr('class', 'axis x-axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis)
      .select('.domain').remove();

    g.append('g')
      .attr('class', 'axis y-axis')
      .call(yAxis)
      .select('.domain').remove();

    // Style grid lines
    g.selectAll('.y-axis .tick line')
      .attr('stroke', 'rgba(255, 255, 255, 0.04)');

    // ── Annotation label ──
    var annotation = g.append('g')
      .attr('class', 'annotation')
      .style('opacity', 0);

    var annotationText = annotation.append('text')
      .attr('fill', '#c9a96e')
      .attr('font-family', "'Cormorant Garamond', Georgia, serif")
      .attr('font-size', '14px')
      .attr('font-style', 'italic')
      .attr('text-anchor', 'middle');

    // ── Hover overlay ──
    var hoverGroup = g.append('g').attr('class', 'hover-group');

    var hoverLine = hoverGroup.append('line')
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', 'rgba(201, 169, 110, 0.4)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
      .style('opacity', 0);

    var overlay = g.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all');

    overlay
      .on('mousemove', function (event) {
        var coords = d3.pointer(event, g.node());
        var mouseX = coords[0];
        var mouseY = coords[1];

        // Snap to nearest decade
        var decadeVal = x.invert(mouseX);
        var nearest = DECADES.reduce(function (prev, curr) {
          return Math.abs(curr - decadeVal) < Math.abs(prev - decadeVal) ? curr : prev;
        });

        var snappedX = x(nearest);
        hoverLine
          .attr('x1', snappedX)
          .attr('x2', snappedX)
          .style('opacity', 1);

        // Find which family the mouse is over
        var yVal = y.invert(mouseY);
        var hoveredFamily = null;
        var hoveredProportion = 0;

        for (var i = 0; i < series.length; i++) {
          var s = series[i];
          var point = s.find(function (d) { return d.data.decade === nearest; });
          if (point && yVal >= point[0] && yVal <= point[1]) {
            hoveredFamily = s.key;
            hoveredProportion = point[1] - point[0];
            break;
          }
        }

        // Highlight hovered family
        areas.selectAll('.area-fill')
          .transition()
          .duration(150)
          .attr('opacity', function (d) {
            if (!hoveredFamily) return AREA_OPACITY;
            return d.key === hoveredFamily ? AREA_OPACITY : AREA_OPACITY_DIM;
          });

        if (hoveredFamily) {
          var tooltipHtml =
            '<div class="tooltip-title">' + nearest + 's</div>' +
            '<div class="tooltip-row">' +
            '<span class="tooltip-label">' + hoveredFamily + '</span>' +
            '<span class="tooltip-value">' + (hoveredProportion * 100).toFixed(1) + '%</span>' +
            '</div>';
          window.showTooltip(tooltipHtml, event.pageX, event.pageY);
        } else {
          window.hideTooltip();
        }
      })
      .on('mouseleave', function () {
        hoverLine.style('opacity', 0);
        areas.selectAll('.area-fill')
          .transition()
          .duration(TRANSITION_MS)
          .attr('opacity', AREA_OPACITY);
        window.hideTooltip();
      });

    // ── Legend ──
    var legendContainer = d3.select(containerEl)
      .append('div')
      .attr('class', 'viz-legend');

    FAMILY_ORDER.forEach(function (fam) {
      var item = legendContainer.append('div').attr('class', 'legend-item');
      item.append('span')
        .attr('class', 'legend-dot')
        .style('background-color', color(fam));
      item.append('span').text(fam);
    });

    // ── Step control ──

    function onStep(stepIndex, direction) {
      var stepConfig = STEP_ANNOTATIONS[stepIndex];
      if (!stepConfig) return;

      var highlightDecades = stepConfig.decades;

      // Draw highlight bands
      bandGroup.selectAll('.decade-band').remove();

      var bandWidth = width / (DECADES.length - 1);
      highlightDecades.forEach(function (decade) {
        var cx = x(decade);
        bandGroup.append('rect')
          .attr('class', 'decade-band')
          .attr('x', cx - bandWidth / 2)
          .attr('y', 0)
          .attr('width', bandWidth)
          .attr('height', height)
          .attr('fill', 'rgba(201, 169, 110, 0.06)')
          .attr('stroke', 'rgba(201, 169, 110, 0.15)')
          .attr('stroke-width', 1)
          .style('opacity', 0)
          .transition()
          .duration(TRANSITION_MS)
          .style('opacity', 1);
      });

      // Dim non-highlighted areas based on step context
      var highlightFamilies = getStepFamilies(stepIndex);

      areas.selectAll('.area-fill')
        .transition()
        .duration(TRANSITION_MS)
        .attr('opacity', function (d) {
          if (highlightFamilies.length === 0) return AREA_OPACITY;
          return highlightFamilies.indexOf(d.key) !== -1 ? AREA_OPACITY : AREA_OPACITY_DIM;
        });

      areas.selectAll('.area-stroke')
        .transition()
        .duration(TRANSITION_MS)
        .attr('opacity', function (d) {
          if (highlightFamilies.length === 0) return 0.9;
          return highlightFamilies.indexOf(d.key) !== -1 ? 0.9 : 0.1;
        });

      // Position annotation
      var midDecade = highlightDecades[Math.floor(highlightDecades.length / 2)];
      annotationText.text(stepConfig.label);

      annotation
        .attr('transform', 'translate(' + x(midDecade) + ',-12)')
        .transition()
        .duration(TRANSITION_MS)
        .style('opacity', 1);
    }

    function resetHighlights() {
      bandGroup.selectAll('.decade-band')
        .transition()
        .duration(TRANSITION_MS)
        .style('opacity', 0)
        .remove();

      areas.selectAll('.area-fill')
        .transition()
        .duration(TRANSITION_MS)
        .attr('opacity', AREA_OPACITY);

      areas.selectAll('.area-stroke')
        .transition()
        .duration(TRANSITION_MS)
        .attr('opacity', 0.9);

      annotation
        .transition()
        .duration(TRANSITION_MS)
        .style('opacity', 0);
    }

    return {
      onStep: onStep,
      resetHighlights: resetHighlights,
    };
  }

  // ── Step-to-family mapping ──
  // Step 0: aldehydes/classical florals era -> fresh (aldehydes), floral
  // Step 1: fresh/aquatic rise -> fresh
  // Step 2: oud/gourmand explosion -> woody (oud), sweet (tonka, gourmand)

  function getStepFamilies(stepIndex) {
    switch (stepIndex) {
      case 0: return ['fresh', 'floral'];
      case 1: return ['fresh'];
      case 2: return ['woody', 'sweet'];
      default: return [];
    }
  }

  // ── Public init ──

  window.initTimeline = function (containerId, dataPath) {
    var vizApi = { onStep: function () {} };

    d3.json(dataPath).then(function (rawData) {
      if (!rawData || (!rawData.top && !rawData.middle && !rawData.base)) {
        throw new Error('Timeline: invalid data format from ' + dataPath);
      }

      var stackedData = aggregateByFamily(rawData);
      var chart = buildChart(containerId, stackedData);

      vizApi.onStep = chart.onStep;
    }).catch(function (err) {
      console.error('Timeline visualization failed:', err);
    });

    return vizApi;
  };
})();
