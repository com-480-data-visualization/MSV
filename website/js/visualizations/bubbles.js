/* ============================================
   BUBBLES.JS — Note Frequency vs Average Rating scatter chart
   D3 v7, dark luxury theme, scrollama-driven
   ============================================ */

(function () {
  'use strict';

  // ── Constants ──
  var TOP_N = 40;
  var LABEL_COUNT = 10;
  var TRANSITION_MS = 600;
  var MARGIN = { top: 40, right: 40, bottom: 60, left: 70 };
  var BUBBLE_RADIUS_RANGE = [5, 38];
  var LABEL_FONT_SIZE = '9px';
  var AXIS_FONT_SIZE = '11px';
  var AXIS_FONT_FAMILY = 'DM Sans, sans-serif';
  var GOLD = '#c9a96e';
  var AXIS_LINE_COLOR = 'rgba(255,255,255,0.08)';
  var GRID_COLOR = 'rgba(255,255,255,0.04)';
  var LABEL_COLOR = '#9a9088';
  var HIGHLIGHT_STROKE_WIDTH = 2;
  var DIM_OPACITY = 0.3;
  var FULL_OPACITY = 0.85;
  var GLOW_FILTER_ID = 'bubbles-glow';

  // Notes highlighted per step
  var STEP_HIGHLIGHTS = {
    1: ['pink pepper', 'tonka bean'],
    2: ['amber', 'vanilla', 'sandalwood'],
  };

  // ── Data aggregation ──
  function aggregateNotes(raw) {
    var map = {};

    ['top', 'middle', 'base'].forEach(function (layer) {
      if (!raw[layer]) return;
      raw[layer].forEach(function (d) {
        var key = d.note;
        if (!map[key]) {
          map[key] = { note: key, frequency: 0, ratingWeightedSum: 0, women: 0, men: 0, unisex: 0 };
        }
        map[key].frequency += d.frequency;
        map[key].ratingWeightedSum += d.avgRating * d.frequency;
        map[key].women += d.women;
        map[key].men += d.men;
        map[key].unisex += d.unisex;
      });
    });

    var notes = Object.values(map).map(function (d) {
      return {
        note: d.note,
        frequency: d.frequency,
        avgRating: d.ratingWeightedSum / d.frequency,
        women: d.women,
        men: d.men,
        unisex: d.unisex,
        total: d.women + d.men + d.unisex,
      };
    });

    notes.sort(function (a, b) { return b.frequency - a.frequency; });
    return notes.slice(0, TOP_N);
  }

  // ── SVG glow filter ──
  function createGlowFilter(svg) {
    var defs = svg.append('defs');
    var filter = defs.append('filter')
      .attr('id', GLOW_FILTER_ID)
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    filter.append('feGaussianBlur')
      .attr('in', 'SourceGraphic')
      .attr('stdDeviation', 3)
      .attr('result', 'blur');

    var merge = filter.append('feMerge');
    merge.append('feMergeNode').attr('in', 'blur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');
  }

  // ── Main init ──
  window.initBubbles = function (containerId, dataPath) {
    var container = document.getElementById(containerId);
    if (!container) {
      console.error('Bubbles: container #' + containerId + ' not found');
      return { onStep: function () {} };
    }

    var currentStep = 0;
    var bubbleData = [];
    var bubblesSelection = null;
    var labelsSelection = null;
    var xScale = null;
    var yScale = null;
    var rScale = null;

    var width = container.clientWidth;
    var height = container.clientHeight || 500;
    var plotW = width - MARGIN.left - MARGIN.right;
    var plotH = height - MARGIN.top - MARGIN.bottom;

    // Create SVG
    var svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    createGlowFilter(svg);

    var g = svg.append('g')
      .attr('transform', 'translate(' + MARGIN.left + ',' + MARGIN.top + ')');

    // ── Load data ──
    d3.json(dataPath).then(function (raw) {
      bubbleData = aggregateNotes(raw);
      buildChart();
    }).catch(function (err) {
      console.error('Bubbles: failed to load data from ' + dataPath, err);
    });

    function buildChart() {
      // ── Scales ──
      var freqExtent = d3.extent(bubbleData, function (d) { return d.frequency; });
      var ratingExtent = d3.extent(bubbleData, function (d) { return d.avgRating; });

      xScale = d3.scaleLog()
        .domain([freqExtent[0] * 0.9, freqExtent[1] * 1.1])
        .range([0, plotW]);

      // Pad rating axis for breathing room
      var ratingPad = (ratingExtent[1] - ratingExtent[0]) * 0.15;
      yScale = d3.scaleLinear()
        .domain([ratingExtent[0] - ratingPad, ratingExtent[1] + ratingPad])
        .range([plotH, 0]);

      rScale = d3.scaleSqrt()
        .domain([0, d3.max(bubbleData, function (d) { return d.total; })])
        .range(BUBBLE_RADIUS_RANGE);

      drawAxes();
      drawBubbles();
      drawLabels();
    }

    // ── Axes & grid ──
    function drawAxes() {
      // X axis
      var xAxis = d3.axisBottom(xScale)
        .ticks(5, '~s')
        .tickSize(-plotH);

      var xG = g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', 'translate(0,' + plotH + ')')
        .call(xAxis);

      xG.selectAll('.tick line')
        .attr('stroke', GRID_COLOR)
        .attr('stroke-dasharray', '2,4');

      xG.selectAll('.tick text')
        .attr('fill', LABEL_COLOR)
        .attr('font-size', AXIS_FONT_SIZE)
        .attr('font-family', AXIS_FONT_FAMILY)
        .attr('dy', '1em');

      xG.select('.domain').attr('stroke', AXIS_LINE_COLOR);

      // X label
      g.append('text')
        .attr('x', plotW / 2)
        .attr('y', plotH + MARGIN.bottom - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', LABEL_COLOR)
        .attr('font-size', AXIS_FONT_SIZE)
        .attr('font-family', AXIS_FONT_FAMILY)
        .text('Frequency');

      // Y axis
      var yAxis = d3.axisLeft(yScale)
        .ticks(6)
        .tickSize(-plotW);

      var yG = g.append('g')
        .attr('class', 'y-axis')
        .call(yAxis);

      yG.selectAll('.tick line')
        .attr('stroke', GRID_COLOR)
        .attr('stroke-dasharray', '2,4');

      yG.selectAll('.tick text')
        .attr('fill', LABEL_COLOR)
        .attr('font-size', AXIS_FONT_SIZE)
        .attr('font-family', AXIS_FONT_FAMILY)
        .attr('dx', '-0.3em');

      yG.select('.domain').attr('stroke', AXIS_LINE_COLOR);

      // Y label
      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -plotH / 2)
        .attr('y', -MARGIN.left + 18)
        .attr('text-anchor', 'middle')
        .attr('fill', LABEL_COLOR)
        .attr('font-size', AXIS_FONT_SIZE)
        .attr('font-family', AXIS_FONT_FAMILY)
        .text('Average Rating');
    }

    // ── Bubbles ──
    function drawBubbles() {
      bubblesSelection = g.selectAll('.bubble')
        .data(bubbleData, function (d) { return d.note; })
        .join('circle')
        .attr('class', 'bubble')
        .attr('cx', function (d) { return xScale(d.frequency); })
        .attr('cy', function (d) { return yScale(d.avgRating); })
        .attr('r', 0)
        .attr('fill', function (d) { return window.getNoteColor(d.note); })
        .attr('fill-opacity', FULL_OPACITY)
        .attr('stroke', 'none')
        .attr('stroke-width', 0)
        .style('cursor', 'pointer')
        .on('mouseover', handleMouseOver)
        .on('mousemove', handleMouseMove)
        .on('mouseout', handleMouseOut);

      // Animate in
      bubblesSelection.transition()
        .duration(TRANSITION_MS)
        .ease(d3.easeCubicOut)
        .attr('r', function (d) { return rScale(d.total); });
    }

    // ── Labels for largest bubbles ──
    function drawLabels() {
      var labeled = bubbleData.slice(0, LABEL_COUNT);

      labelsSelection = g.selectAll('.bubble-label')
        .data(labeled, function (d) { return d.note; })
        .join('text')
        .attr('class', 'bubble-label')
        .attr('x', function (d) { return xScale(d.frequency); })
        .attr('y', function (d) { return yScale(d.avgRating) - rScale(d.total) - 4; })
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffffff')
        .attr('font-size', LABEL_FONT_SIZE)
        .attr('font-family', AXIS_FONT_FAMILY)
        .attr('pointer-events', 'none')
        .attr('opacity', 0)
        .text(function (d) { return d.note; });

      labelsSelection.transition()
        .duration(TRANSITION_MS)
        .delay(TRANSITION_MS * 0.5)
        .attr('opacity', 1);
    }

    // ── Tooltip ──
    function handleMouseOver(event, d) {
      var family = window.getNoteFamily(d.note);
      var familyLabel = family.charAt(0).toUpperCase() + family.slice(1);

      var html = '<strong>' + d.note + '</strong><br>' +
        'Frequency: ' + d3.format(',')(d.frequency) + '<br>' +
        'Avg Rating: ' + d.avgRating.toFixed(3) + '<br>' +
        'Family: ' + familyLabel;

      window.showTooltip(html, event.pageX, event.pageY);

      d3.select(this)
        .transition()
        .duration(200)
        .attr('stroke', GOLD)
        .attr('stroke-width', HIGHLIGHT_STROKE_WIDTH);
    }

    function handleMouseMove(event) {
      window.showTooltip(
        document.querySelector('.tooltip').innerHTML,
        event.pageX,
        event.pageY
      );
    }

    function handleMouseOut() {
      window.hideTooltip();

      var self = d3.select(this);
      var datum = self.datum();
      var highlighted = getHighlightedNotes(currentStep);
      var isHighlighted = highlighted && highlighted.indexOf(datum.note) !== -1;

      self.transition()
        .duration(200)
        .attr('stroke', isHighlighted ? GOLD : 'none')
        .attr('stroke-width', isHighlighted ? HIGHLIGHT_STROKE_WIDTH : 0);
    }

    // ── Step handling ──
    function getHighlightedNotes(stepIndex) {
      return STEP_HIGHLIGHTS[stepIndex] || null;
    }

    function updateStep(stepIndex) {
      currentStep = stepIndex;
      var highlighted = getHighlightedNotes(stepIndex);

      if (!bubblesSelection) return;

      if (!highlighted) {
        // Step 0: show all equally
        bubblesSelection.transition()
          .duration(TRANSITION_MS)
          .ease(d3.easeCubicOut)
          .attr('fill-opacity', FULL_OPACITY)
          .attr('stroke', 'none')
          .attr('stroke-width', 0)
          .attr('filter', null);

        labelsSelection.transition()
          .duration(TRANSITION_MS)
          .attr('opacity', 1);
      } else {
        // Highlight specific notes
        bubblesSelection.transition()
          .duration(TRANSITION_MS)
          .ease(d3.easeCubicOut)
          .attr('fill-opacity', function (d) {
            return highlighted.indexOf(d.note) !== -1 ? FULL_OPACITY : DIM_OPACITY;
          })
          .attr('stroke', function (d) {
            return highlighted.indexOf(d.note) !== -1 ? GOLD : 'none';
          })
          .attr('stroke-width', function (d) {
            return highlighted.indexOf(d.note) !== -1 ? HIGHLIGHT_STROKE_WIDTH : 0;
          })
          .attr('filter', function (d) {
            return highlighted.indexOf(d.note) !== -1 ? 'url(#' + GLOW_FILTER_ID + ')' : null;
          });

        labelsSelection.transition()
          .duration(TRANSITION_MS)
          .attr('opacity', function (d) {
            return highlighted.indexOf(d.note) !== -1 ? 1 : DIM_OPACITY;
          });
      }
    }

    return {
      onStep: function (stepIndex, direction) {
        updateStep(stepIndex);
      },
    };
  };
})();
