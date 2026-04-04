/* ============================================
   BEESWARM CHART — Note frequency constellation
   Force-directed bubble layout showing top 50 perfume notes
   ============================================ */

(function () {
  'use strict';

  // ── Constants ──
  var TOP_N = 50;
  var TRANSITION_DURATION = 600;
  var STAGGER_DELAY = 30;
  var LABEL_RADIUS_THRESHOLD = 30;
  var ACCENT_GOLD = '#c9a96e';
  var DEFAULT_OPACITY = 0.85;
  var DIM_OPACITY = 0.15;
  var PULSE_SCALE = 1.15;
  var FONT_SIZE = '10px';
  var FONT_FAMILY = 'DM Sans, sans-serif';

  // ── Helpers ──
  function capitalize(str) {
    return str.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  function formatNumber(n) {
    return n.toLocaleString();
  }

  /**
   * Aggregate notes across layers (top + middle + base).
   * Sums frequencies and gender counts, computes weighted average rating.
   */
  function aggregateNotes(raw) {
    var map = {};

    ['top', 'middle', 'base'].forEach(function (layer) {
      if (!raw[layer]) return;
      raw[layer].forEach(function (d) {
        var name = d.note;
        if (!map[name]) {
          map[name] = {
            note: name,
            frequency: 0,
            women: 0,
            men: 0,
            unisex: 0,
            ratingSum: 0,
            ratingCount: 0,
            layers: [],
          };
        }
        map[name].frequency += d.frequency;
        map[name].women += d.women;
        map[name].men += d.men;
        map[name].unisex += d.unisex;
        map[name].ratingSum += d.avgRating * d.frequency;
        map[name].ratingCount += d.frequency;
        if (map[name].layers.indexOf(layer) === -1) {
          map[name].layers.push(layer);
        }
      });
    });

    return Object.values(map)
      .map(function (d) {
        return {
          note: d.note,
          frequency: d.frequency,
          avgRating: d.ratingCount > 0 ? d.ratingSum / d.ratingCount : 0,
          women: d.women,
          men: d.men,
          unisex: d.unisex,
          layers: d.layers,
        };
      })
      .sort(function (a, b) { return b.frequency - a.frequency; })
      .slice(0, TOP_N);
  }

  /**
   * Build radius scale from frequency data.
   */
  function buildRadiusScale(data, maxRadius) {
    var maxFreq = d3.max(data, function (d) { return d.frequency; });
    return d3.scaleSqrt()
      .domain([0, maxFreq])
      .range([4, maxRadius]);
  }

  /**
   * Create tooltip HTML for a note.
   */
  function buildTooltipHtml(d) {
    var layerLabel = d.layers
      .map(function (l) { return capitalize(l); })
      .join(', ');

    return '<div class="tooltip-title">' + capitalize(d.note) + '</div>' +
      '<div class="tooltip-row"><span class="tooltip-label">Frequency</span>' +
      '<span class="tooltip-value">' + formatNumber(d.frequency) + '</span></div>' +
      '<div class="tooltip-row"><span class="tooltip-label">Avg Rating</span>' +
      '<span class="tooltip-value">' + d.avgRating.toFixed(2) + '</span></div>' +
      '<div class="tooltip-row"><span class="tooltip-label">Women</span>' +
      '<span class="tooltip-value">' + formatNumber(d.women) + '</span></div>' +
      '<div class="tooltip-row"><span class="tooltip-label">Men</span>' +
      '<span class="tooltip-value">' + formatNumber(d.men) + '</span></div>' +
      '<div class="tooltip-row"><span class="tooltip-label">Unisex</span>' +
      '<span class="tooltip-value">' + formatNumber(d.unisex) + '</span></div>' +
      '<div class="tooltip-row"><span class="tooltip-label">Layers</span>' +
      '<span class="tooltip-value">' + layerLabel + '</span></div>';
  }

  // ── Main init ──
  window.initBeeswarm = function (containerId, dataPath) {
    var container = document.getElementById(containerId);
    if (!container) {
      console.error('Beeswarm: container #' + containerId + ' not found');
      return { onStep: function () {} };
    }

    // State
    var currentStep = -1;
    var nodes = [];
    var simulation = null;
    var bubbleGroups = null;
    var radiusScale = null;

    // Dimensions
    var width = container.clientWidth;
    var height = container.clientHeight;
    var maxRadius = Math.min(width, height) * 0.08;

    // SVG setup
    var svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', '0 0 ' + width + ' ' + height)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    var g = svg.append('g');

    // ── Load data ──
    d3.json(dataPath).then(function (raw) {
      nodes = aggregateNotes(raw);
      radiusScale = buildRadiusScale(nodes, maxRadius);

      // Assign initial positions near center
      var cx = width / 2;
      var cy = height / 2;
      nodes.forEach(function (d) {
        d.x = cx + (Math.random() - 0.5) * width * 0.3;
        d.y = cy + (Math.random() - 0.5) * height * 0.3;
        d.r = radiusScale(d.frequency);
      });

      // Force simulation
      simulation = d3.forceSimulation(nodes)
        .force('charge', d3.forceManyBody().strength(function (d) {
          return -d.r * 1.5;
        }))
        .force('center', d3.forceCenter(cx, cy).strength(0.05))
        .force('collision', d3.forceCollide().radius(function (d) {
          return d.r + 2;
        }).strength(0.9))
        .force('x', d3.forceX(cx).strength(0.03))
        .force('y', d3.forceY(cy).strength(0.03))
        .alphaDecay(0.03)
        .on('tick', ticked)
        .on('end', function () { simulation.stop(); });

      // Create bubble groups
      bubbleGroups = g.selectAll('.bubble-group')
        .data(nodes, function (d) { return d.note; })
        .join('g')
        .attr('class', 'bubble-group')
        .style('cursor', 'pointer');

      // Circles
      bubbleGroups.append('circle')
        .attr('r', 0)
        .attr('fill', function (d) { return window.getNoteColor(d.note); })
        .attr('stroke', 'rgba(255,255,255,0.08)')
        .attr('stroke-width', 1)
        .attr('opacity', 0);

      // Staggered fade-in
      bubbleGroups.select('circle')
        .transition()
        .duration(TRANSITION_DURATION)
        .delay(function (d, i) { return i * STAGGER_DELAY; })
        .attr('r', function (d) { return d.r; })
        .attr('opacity', DEFAULT_OPACITY);

      // Labels for large bubbles
      bubbleGroups.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('font-size', FONT_SIZE)
        .attr('font-family', FONT_FAMILY)
        .attr('fill', '#ffffff')
        .attr('pointer-events', 'none')
        .attr('opacity', 0)
        .text(function (d) {
          return d.r >= LABEL_RADIUS_THRESHOLD ? capitalize(d.note) : '';
        })
        .transition()
        .duration(TRANSITION_DURATION)
        .delay(function (d, i) { return i * STAGGER_DELAY + 200; })
        .attr('opacity', function (d) {
          return d.r >= LABEL_RADIUS_THRESHOLD ? 0.9 : 0;
        });

      // Hover interactions
      bubbleGroups
        .on('mouseenter', function (event, d) {
          d3.select(this).select('circle')
            .transition()
            .duration(200)
            .attr('stroke', ACCENT_GOLD)
            .attr('stroke-width', 2);

          window.showTooltip(buildTooltipHtml(d), event.pageX, event.pageY);
        })
        .on('mousemove', function (event) {
          window.showTooltip(
            d3.select(this).datum() ? buildTooltipHtml(d3.select(this).datum()) : '',
            event.pageX,
            event.pageY
          );
        })
        .on('mouseleave', function () {
          d3.select(this).select('circle')
            .transition()
            .duration(200)
            .attr('stroke', 'rgba(255,255,255,0.08)')
            .attr('stroke-width', 1);

          window.hideTooltip();
        });

    }).catch(function (err) {
      console.error('Beeswarm: failed to load data from ' + dataPath, err);
    });

    // ── Tick handler ──
    function ticked() {
      if (!bubbleGroups) return;
      bubbleGroups.attr('transform', function (d) {
        // Keep within bounds
        d.x = Math.max(d.r, Math.min(width - d.r, d.x));
        d.y = Math.max(d.r, Math.min(height - d.r, d.y));
        return 'translate(' + d.x + ',' + d.y + ')';
      });
    }

    // ── Step highlight helpers ──
    function highlightNotes(matchFn) {
      if (!bubbleGroups) return;

      bubbleGroups.select('circle')
        .transition()
        .duration(TRANSITION_DURATION)
        .attr('opacity', function (d) {
          return matchFn(d) ? DEFAULT_OPACITY : DIM_OPACITY;
        })
        .attr('stroke', function (d) {
          return matchFn(d) ? ACCENT_GOLD : 'rgba(255,255,255,0.08)';
        })
        .attr('stroke-width', function (d) {
          return matchFn(d) ? 2.5 : 1;
        });

      bubbleGroups.select('text')
        .transition()
        .duration(TRANSITION_DURATION)
        .attr('opacity', function (d) {
          if (matchFn(d)) return 0.95;
          return d.r >= LABEL_RADIUS_THRESHOLD ? 0.15 : 0;
        });
    }

    function pulseNote(noteName) {
      if (!bubbleGroups) return;

      highlightNotes(function (d) {
        return d.note.toLowerCase() === noteName.toLowerCase();
      });

      // Pulsing animation on the matched note
      bubbleGroups.filter(function (d) {
        return d.note.toLowerCase() === noteName.toLowerCase();
      })
        .select('circle')
        .transition()
        .duration(TRANSITION_DURATION)
        .attr('fill', ACCENT_GOLD)
        .attr('stroke', ACCENT_GOLD)
        .attr('stroke-width', 3)
        .transition()
        .duration(800)
        .attr('r', function (d) { return d.r * PULSE_SCALE; })
        .transition()
        .duration(800)
        .attr('r', function (d) { return d.r; })
        .on('end', function repeatPulse() {
          d3.select(this)
            .transition()
            .duration(800)
            .attr('r', function (d) { return d.r * PULSE_SCALE; })
            .transition()
            .duration(800)
            .attr('r', function (d) { return d.r; })
            .on('end', repeatPulse);
        });
    }

    function resetHighlights() {
      if (!bubbleGroups) return;

      // Stop ongoing pulse transitions
      bubbleGroups.select('circle').interrupt();

      bubbleGroups.select('circle')
        .transition()
        .duration(TRANSITION_DURATION)
        .attr('r', function (d) { return d.r; })
        .attr('fill', function (d) { return window.getNoteColor(d.note); })
        .attr('opacity', DEFAULT_OPACITY)
        .attr('stroke', 'rgba(255,255,255,0.08)')
        .attr('stroke-width', 1);

      bubbleGroups.select('text')
        .transition()
        .duration(TRANSITION_DURATION)
        .attr('opacity', function (d) {
          return d.r >= LABEL_RADIUS_THRESHOLD ? 0.9 : 0;
        });
    }

    // ── Step callbacks ──
    function onStep(stepIndex, direction) {
      if (stepIndex === currentStep) return;
      currentStep = stepIndex;

      switch (stepIndex) {
        case 0:
          // Highlight musk with pulsing gold
          pulseNote('musk');
          break;
        case 1:
          // Highlight bergamot
          resetHighlights();
          pulseNote('bergamot');
          break;
        case 2:
          // Highlight top 10 notes
          (function () {
            var top10 = nodes.slice(0, 10).map(function (d) {
              return d.note.toLowerCase();
            });
            highlightNotes(function (d) {
              return top10.indexOf(d.note.toLowerCase()) !== -1;
            });
            // Restore original colors for top 10 (no gold override)
            bubbleGroups.filter(function (d) {
              return top10.indexOf(d.note.toLowerCase()) !== -1;
            })
              .select('circle')
              .interrupt()
              .transition()
              .duration(TRANSITION_DURATION)
              .attr('fill', function (d) { return window.getNoteColor(d.note); })
              .attr('r', function (d) { return d.r; })
              .attr('opacity', DEFAULT_OPACITY)
              .attr('stroke', ACCENT_GOLD)
              .attr('stroke-width', 2.5);
          })();
          break;
        case 3:
          // Show all notes, remove highlights
          resetHighlights();
          break;
        default:
          resetHighlights();
          break;
      }
    }

    return { onStep: onStep };
  };
})();
