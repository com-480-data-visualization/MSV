/* ============================================
   PRICE.JS — eBay Perfume Price Strip Plot
   Beeswarm/strip chart showing price distribution
   by gender, sized by sold count, colored by type
   ============================================ */

(function () {
  'use strict';

  // ── Constants ──
  var TRANSITION_DURATION = 600;
  var PRICE_MAX = 300;
  var PRICE_MIN = 0;
  var RADIUS_MIN = 3;
  var RADIUS_MAX = 8;
  var PREMIUM_THRESHOLD = 100;
  var LABEL_FONT_SIZE = 10;

  var TYPE_COLORS = {
    EDP: '#c9a96e',
    EDT: '#8b9dad',
    Parfum: '#e8a0bf',
    Perfume: '#e8a0bf',
    EDC: '#6ba89c',
    Other: '#888888',
  };

  var MEAN_LINE_COLOR = '#c9a96e';
  var PREMIUM_STROKE_COLOR = '#c9a96e';
  var DOT_DEFAULT_OPACITY = 0.7;
  var DOT_DIM_OPACITY = 0.15;
  var LABEL_COLOR = '#e8e0d4';

  // Brands to label when showing clusters (step 2)
  var LABEL_BRANDS = [
    'Creed', 'Tom Ford', 'Dior', 'Versace', 'Calvin Klein',
    'Dolce & Gabbana', 'Paco Rabanne', 'Ralph Lauren',
    'Burberry', 'HUGO BOSS',
  ];

  // ── Helpers ──
  function getTypeColor(type) {
    return TYPE_COLORS[type] || TYPE_COLORS.Other;
  }

  function radiusScale(sold, maxSold) {
    if (sold === null || sold === undefined || sold === 0) return RADIUS_MIN;
    var normalized = Math.sqrt(sold) / Math.sqrt(maxSold);
    return RADIUS_MIN + normalized * (RADIUS_MAX - RADIUS_MIN);
  }

  function buildTooltipHtml(d) {
    return '<div class="tooltip-title">' + d.brand + '</div>' +
      '<div class="tooltip-row"><span class="tooltip-label">Title</span></div>' +
      '<div style="font-size:0.75rem;color:#9a9088;margin-bottom:4px;">' +
        d.title.substring(0, 60) + (d.title.length > 60 ? '...' : '') +
      '</div>' +
      '<div class="tooltip-row"><span class="tooltip-label">Price</span><span class="tooltip-value">$' +
        d.price.toFixed(2) + '</span></div>' +
      '<div class="tooltip-row"><span class="tooltip-label">Type</span><span class="tooltip-value">' +
        d.type + '</span></div>' +
      '<div class="tooltip-row"><span class="tooltip-label">Sold</span><span class="tooltip-value">' +
        (d.sold !== null ? d.sold.toLocaleString() : 'N/A') + '</span></div>' +
      '<div class="tooltip-row"><span class="tooltip-label">Gender</span><span class="tooltip-value">' +
        d.gender + '</span></div>';
  }

  // ── Beeswarm dodge simulation ──
  function dodgeX(data, yScale, radiusFn, columnCenterX, columnWidth) {
    // Sort by y position for better packing
    var sorted = data.slice().sort(function (a, b) {
      return yScale(a.price) - yScale(b.price);
    });

    var placed = [];
    sorted.forEach(function (d) {
      var cy = yScale(d.price);
      var r = radiusFn(d);
      var bestX = columnCenterX;
      var offset = 0;
      var step = 1;
      var maxOffset = columnWidth / 2 - r;
      var found = false;

      while (offset <= maxOffset) {
        var candidates = offset === 0
          ? [columnCenterX]
          : [columnCenterX - offset, columnCenterX + offset];

        for (var c = 0; c < candidates.length; c++) {
          var testX = candidates[c];
          var collision = false;
          for (var p = 0; p < placed.length; p++) {
            var dx = testX - placed[p].x;
            var dy = cy - placed[p].y;
            var minDist = r + placed[p].r + 0.5;
            if (dx * dx + dy * dy < minDist * minDist) {
              collision = true;
              break;
            }
          }
          if (!collision) {
            bestX = testX;
            found = true;
            break;
          }
        }
        if (found) break;
        offset += step;
      }

      d._x = bestX;
      d._y = cy;
      d._r = r;
      placed.push({ x: bestX, y: cy, r: r });
    });

    return sorted;
  }

  // ── Main init function ──
  window.initPrice = function (containerId, dataPath) {
    var container = document.getElementById(containerId);
    if (!container) {
      console.error('initPrice: container #' + containerId + ' not found');
      return { onStep: function () {} };
    }

    var currentStep = 0;
    var svg, g, dots, meanLines, brandLabels, priceAnnotations;
    var listings, summary;
    var yScale, maxSold;

    // Dimensions
    var margin = { top: 40, right: 30, bottom: 50, left: 60 };
    var width = container.clientWidth - margin.left - margin.right;
    var height = container.clientHeight - margin.top - margin.bottom;

    // Column layout: men left, women right
    var columnWidth = width / 2;
    var menCenterX = columnWidth / 2;
    var womenCenterX = columnWidth + columnWidth / 2;

    // Create SVG
    svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    g = svg.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    // Load data
    d3.json(dataPath).then(function (data) {
      listings = data.listings.filter(function (d) {
        return d.price > 0 && d.price <= PRICE_MAX;
      });
      summary = data.summary;

      maxSold = d3.max(listings, function (d) { return d.sold || 0; });

      // Scales
      yScale = d3.scaleLinear()
        .domain([PRICE_MIN, PRICE_MAX])
        .range([height, 0]);

      // Separate by gender
      var menData = listings.filter(function (d) { return d.gender === 'men'; });
      var womenData = listings.filter(function (d) { return d.gender === 'women'; });

      var radiusFn = function (d) { return radiusScale(d.sold, maxSold); };

      // Compute beeswarm positions
      dodgeX(menData, yScale, radiusFn, menCenterX, columnWidth - 20);
      dodgeX(womenData, yScale, radiusFn, womenCenterX, columnWidth - 20);

      var allData = menData.concat(womenData);

      // ── Draw axes ──
      var yAxis = d3.axisLeft(yScale)
        .ticks(8)
        .tickFormat(function (d) { return '$' + d; });

      g.append('g')
        .attr('class', 'axis y-axis')
        .call(yAxis);

      // Grid lines
      g.append('g')
        .attr('class', 'grid')
        .call(
          d3.axisLeft(yScale)
            .ticks(8)
            .tickSize(-width)
            .tickFormat('')
        )
        .selectAll('line')
        .attr('stroke', 'rgba(255,255,255,0.04)');

      g.select('.grid .domain').remove();

      // Column labels
      g.append('text')
        .attr('x', menCenterX)
        .attr('y', height + 35)
        .attr('text-anchor', 'middle')
        .attr('fill', '#9a9088')
        .attr('font-family', "'Cormorant Garamond', Georgia, serif")
        .attr('font-size', '13px')
        .attr('font-style', 'italic')
        .text('Men');

      g.append('text')
        .attr('x', womenCenterX)
        .attr('y', height + 35)
        .attr('text-anchor', 'middle')
        .attr('fill', '#9a9088')
        .attr('font-family', "'Cormorant Garamond', Georgia, serif")
        .attr('font-size', '13px')
        .attr('font-style', 'italic')
        .text('Women');

      // Divider line
      g.append('line')
        .attr('x1', width / 2)
        .attr('y1', 0)
        .attr('x2', width / 2)
        .attr('y2', height)
        .attr('stroke', 'rgba(201,169,110,0.12)')
        .attr('stroke-width', 1);

      // ── Mean lines ──
      var menMean = summary.avgPriceMen;
      var womenMean = summary.avgPriceWomen;

      meanLines = g.append('g').attr('class', 'mean-lines');

      meanLines.append('line')
        .attr('x1', 0)
        .attr('y1', yScale(menMean))
        .attr('x2', width / 2 - 5)
        .attr('y2', yScale(menMean))
        .attr('stroke', MEAN_LINE_COLOR)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,3')
        .attr('opacity', 0.6);

      meanLines.append('text')
        .attr('x', 5)
        .attr('y', yScale(menMean) - 6)
        .attr('fill', MEAN_LINE_COLOR)
        .attr('font-size', '9px')
        .attr('font-family', "'DM Sans', sans-serif")
        .attr('opacity', 0.7)
        .text('avg $' + menMean.toFixed(0));

      meanLines.append('line')
        .attr('x1', width / 2 + 5)
        .attr('y1', yScale(womenMean))
        .attr('x2', width)
        .attr('y2', yScale(womenMean))
        .attr('stroke', MEAN_LINE_COLOR)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,3')
        .attr('opacity', 0.6);

      meanLines.append('text')
        .attr('x', width / 2 + 10)
        .attr('y', yScale(womenMean) - 6)
        .attr('fill', MEAN_LINE_COLOR)
        .attr('font-size', '9px')
        .attr('font-family', "'DM Sans', sans-serif")
        .attr('opacity', 0.7)
        .text('avg $' + womenMean.toFixed(0));

      // ── Draw dots ──
      dots = g.selectAll('.price-dot')
        .data(allData)
        .join('circle')
        .attr('class', 'price-dot')
        .attr('cx', function (d) { return d._x; })
        .attr('cy', function (d) { return d._y; })
        .attr('r', function (d) { return d._r; })
        .attr('fill', function (d) { return getTypeColor(d.type); })
        .attr('fill-opacity', DOT_DEFAULT_OPACITY)
        .attr('stroke', 'none')
        .attr('stroke-width', 0)
        .style('cursor', 'pointer');

      // ── Hover interactions ──
      dots.on('mouseenter', function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('fill-opacity', 1)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 1.5);

        window.showTooltip(buildTooltipHtml(d), event.pageX, event.pageY);
      })
      .on('mousemove', function (event, d) {
        window.showTooltip(buildTooltipHtml(d), event.pageX, event.pageY);
      })
      .on('mouseleave', function () {
        var dot = d3.select(this);
        var hasGoldStroke = dot.attr('data-premium') === 'true';

        dot.transition()
          .duration(150)
          .attr('fill-opacity', function () {
            return parseFloat(dot.attr('data-opacity') || DOT_DEFAULT_OPACITY);
          })
          .attr('stroke', hasGoldStroke ? PREMIUM_STROKE_COLOR : 'none')
          .attr('stroke-width', hasGoldStroke ? 1.5 : 0);

        window.hideTooltip();
      });

      // ── Price range annotations ──
      priceAnnotations = g.append('g')
        .attr('class', 'price-annotations')
        .attr('opacity', 0);

      var annotY = yScale(PRICE_MAX - 20);
      priceAnnotations.append('text')
        .attr('x', menCenterX)
        .attr('y', annotY)
        .attr('text-anchor', 'middle')
        .attr('fill', '#e8e0d4')
        .attr('font-family', "'Cormorant Garamond', Georgia, serif")
        .attr('font-size', '12px')
        .attr('font-style', 'italic')
        .text('$3 - $259 range');

      priceAnnotations.append('text')
        .attr('x', womenCenterX)
        .attr('y', annotY)
        .attr('text-anchor', 'middle')
        .attr('fill', '#e8e0d4')
        .attr('font-family', "'Cormorant Garamond', Georgia, serif")
        .attr('font-size', '12px')
        .attr('font-style', 'italic')
        .text('$2 - $300 range');

      // ── Brand labels group (step 2) ──
      brandLabels = g.append('g')
        .attr('class', 'brand-labels')
        .attr('opacity', 0);

      // Compute brand centroids for labels
      var brandPositions = computeBrandPositions(allData);
      brandPositions.forEach(function (bp) {
        brandLabels.append('text')
          .attr('x', bp.x)
          .attr('y', bp.y - bp.maxR - 4)
          .attr('text-anchor', 'middle')
          .attr('fill', LABEL_COLOR)
          .attr('font-family', "'Cormorant Garamond', Georgia, serif")
          .attr('font-size', LABEL_FONT_SIZE + 'px')
          .attr('font-style', 'italic')
          .attr('opacity', 0.85)
          .text(bp.brand);
      });

      // ── Legend ──
      var legendG = svg.append('g')
        .attr('transform', 'translate(' + (margin.left + 10) + ', 15)');

      var legendTypes = ['EDP', 'EDT', 'Parfum', 'EDC', 'Other'];
      legendTypes.forEach(function (t, i) {
        var xOff = i * 70;
        legendG.append('circle')
          .attr('cx', xOff)
          .attr('cy', 0)
          .attr('r', 4)
          .attr('fill', TYPE_COLORS[t]);

        legendG.append('text')
          .attr('x', xOff + 8)
          .attr('y', 4)
          .attr('fill', '#9a9088')
          .attr('font-size', '10px')
          .attr('font-family', "'DM Sans', sans-serif")
          .text(t);
      });

      // Apply initial step
      applyStep(0, 'down');
    }).catch(function (err) {
      console.error('initPrice: failed to load data from ' + dataPath, err);
      container.innerHTML = '<div class="viz-loading">Failed to load price data</div>';
    });

    function computeBrandPositions(allData) {
      var positions = [];
      LABEL_BRANDS.forEach(function (brand) {
        var items = allData.filter(function (d) { return d.brand === brand; });
        if (items.length === 0) return;

        var avgX = d3.mean(items, function (d) { return d._x; });
        var avgY = d3.mean(items, function (d) { return d._y; });
        var maxR = d3.max(items, function (d) { return d._r; });

        positions.push({
          brand: brand,
          x: avgX,
          y: avgY,
          maxR: maxR,
          count: items.length,
        });
      });
      return positions;
    }

    // ── Step logic ──
    function applyStep(stepIndex, direction) {
      currentStep = stepIndex;

      if (stepIndex === 0) {
        showAllDots();
        showPriceAnnotations(true);
        hidePremiumHighlight();
        hideBrandLabels();
      } else if (stepIndex === 1) {
        showPriceAnnotations(false);
        highlightPremium();
        hideBrandLabels();
      } else if (stepIndex === 2) {
        showPriceAnnotations(false);
        hidePremiumHighlight();
        showBrandClusters();
      }
    }

    function showAllDots() {
      if (!dots) return;
      dots.transition('highlight')
        .duration(TRANSITION_DURATION)
        .attr('fill-opacity', DOT_DEFAULT_OPACITY)
        .attr('stroke', 'none')
        .attr('stroke-width', 0);

      dots.attr('data-opacity', DOT_DEFAULT_OPACITY)
        .attr('data-premium', 'false');
    }

    function showPriceAnnotations(show) {
      if (!priceAnnotations) return;
      priceAnnotations.transition()
        .duration(TRANSITION_DURATION)
        .attr('opacity', show ? 1 : 0);
    }

    function highlightPremium() {
      if (!dots) return;
      dots.each(function (d) {
        var el = d3.select(this);
        var isPremium = d.price >= PREMIUM_THRESHOLD;

        el.attr('data-premium', isPremium ? 'true' : 'false')
          .attr('data-opacity', isPremium ? 0.9 : DOT_DIM_OPACITY);

        el.transition('highlight')
          .duration(TRANSITION_DURATION)
          .attr('fill-opacity', isPremium ? 0.9 : DOT_DIM_OPACITY)
          .attr('stroke', isPremium ? PREMIUM_STROKE_COLOR : 'none')
          .attr('stroke-width', isPremium ? 1.5 : 0);
      });
    }

    function hidePremiumHighlight() {
      if (!dots) return;
      dots.attr('data-premium', 'false')
        .attr('data-opacity', DOT_DEFAULT_OPACITY);
    }

    function showBrandClusters() {
      if (!dots || !brandLabels) return;

      var labelBrandSet = {};
      LABEL_BRANDS.forEach(function (b) { labelBrandSet[b] = true; });

      dots.each(function (d) {
        var el = d3.select(this);
        var isLabeled = labelBrandSet[d.brand] === true;

        el.attr('data-opacity', isLabeled ? 0.9 : DOT_DIM_OPACITY)
          .attr('data-premium', 'false');

        el.transition()
          .duration(TRANSITION_DURATION)
          .attr('fill-opacity', isLabeled ? 0.9 : DOT_DIM_OPACITY)
          .attr('stroke', isLabeled ? 'rgba(255,255,255,0.3)' : 'none')
          .attr('stroke-width', isLabeled ? 1 : 0);
      });

      brandLabels.transition()
        .duration(TRANSITION_DURATION)
        .attr('opacity', 1);
    }

    function hideBrandLabels() {
      if (!brandLabels) return;
      brandLabels.transition()
        .duration(TRANSITION_DURATION)
        .attr('opacity', 0);
    }

    // ── Return scrollama interface ──
    return {
      onStep: function (stepIndex, direction) {
        applyStep(stepIndex, direction);
      },
    };
  };
})();
