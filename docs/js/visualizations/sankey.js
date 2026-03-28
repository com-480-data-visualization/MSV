/* ============================================
   SANKEY DIAGRAM — Note flow from top to middle to base layers
   Shows how fragrance notes connect across the three perfume layers
   ============================================ */

(function () {
  'use strict';

  // ── Constants ──
  var TOP_N_PER_LAYER = 8;
  var MAX_LINKS = 30;
  var NODE_WIDTH = 15;
  var NODE_PADDING = 20;
  var TRANSITION_DURATION = 400;
  var LINK_OPACITY_DEFAULT = 0.25;
  var LINK_OPACITY_HOVER = 0.6;
  var LINK_OPACITY_DIM = 0.05;
  var ACCENT_GOLD = '#c9a96e';
  var FONT_SIZE_LABEL = '10px';
  var FONT_SIZE_COLUMN = '12px';
  var FONT_FAMILY_LABEL = 'DM Sans, sans-serif';
  var FONT_FAMILY_COLUMN = 'Cormorant Garamond, Georgia, serif';
  var MARGIN = { top: 30, right: 20, bottom: 10, left: 20 };
  var LAYER_NAMES = ['Top Notes', 'Middle Notes', 'Base Notes'];
  var LAYER_KEYS = ['topNotes', 'middleNotes', 'baseNotes'];

  // ── Helpers ──
  function capitalize(str) {
    return str.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  /**
   * Count note frequency per layer across all perfumes.
   * Returns { topNotes: {name: count}, middleNotes: ..., baseNotes: ... }
   */
  function countNotesByLayer(perfumes) {
    var counts = {};
    LAYER_KEYS.forEach(function (key) { counts[key] = {}; });

    perfumes.forEach(function (perfume) {
      LAYER_KEYS.forEach(function (key) {
        var notes = perfume[key];
        if (!notes) return;
        notes.forEach(function (note) {
          var lower = note.toLowerCase();
          counts[key][lower] = (counts[key][lower] || 0) + 1;
        });
      });
    });

    return counts;
  }

  /**
   * Get the top N notes by frequency for a given layer.
   */
  function getTopNotes(layerCounts, n) {
    return Object.entries(layerCounts)
      .sort(function (a, b) { return b[1] - a[1]; })
      .slice(0, n)
      .map(function (entry) { return entry[0]; });
  }

  /**
   * Build links between two layers by counting co-occurrences in perfumes.
   * Only considers notes in the provided sets.
   */
  function buildLayerLinks(perfumes, sourceKey, targetKey, sourceSet, targetSet) {
    var linkMap = {};

    perfumes.forEach(function (perfume) {
      var sources = perfume[sourceKey];
      var targets = perfume[targetKey];
      if (!sources || !targets) return;

      sources.forEach(function (s) {
        var sLower = s.toLowerCase();
        if (!sourceSet.has(sLower)) return;

        targets.forEach(function (t) {
          var tLower = t.toLowerCase();
          if (!targetSet.has(tLower)) return;

          var key = sLower + '|' + tLower;
          linkMap[key] = (linkMap[key] || 0) + 1;
        });
      });
    });

    return Object.entries(linkMap).map(function (entry) {
      var parts = entry[0].split('|');
      return { source: parts[0], target: parts[1], value: entry[1] };
    });
  }

  /**
   * Build complete Sankey data (nodes + links) from perfumes array.
   * Nodes get a layer suffix to disambiguate notes appearing in multiple layers.
   */
  function buildSankeyData(perfumes) {
    var counts = countNotesByLayer(perfumes);

    // Get top notes per layer
    var topNotesArr = getTopNotes(counts.topNotes, TOP_N_PER_LAYER);
    var midNotesArr = getTopNotes(counts.middleNotes, TOP_N_PER_LAYER);
    var baseNotesArr = getTopNotes(counts.baseNotes, TOP_N_PER_LAYER);

    var topSet = new Set(topNotesArr);
    var midSet = new Set(midNotesArr);
    var baseSet = new Set(baseNotesArr);

    // Build node list with layer suffixes for uniqueness
    var nodes = [];
    var nodeIndex = {};
    var idx = 0;

    function addNodes(noteArr, layerSuffix) {
      noteArr.forEach(function (note) {
        var id = note + '_' + layerSuffix;
        nodeIndex[id] = idx;
        nodes.push({ id: id, name: note, layer: layerSuffix });
        idx += 1;
      });
    }

    addNodes(topNotesArr, 'top');
    addNodes(midNotesArr, 'mid');
    addNodes(baseNotesArr, 'base');

    // Build links between top->mid and mid->base
    var topToMid = buildLayerLinks(perfumes, LAYER_KEYS[0], LAYER_KEYS[1], topSet, midSet);
    var midToBase = buildLayerLinks(perfumes, LAYER_KEYS[1], LAYER_KEYS[2], midSet, baseSet);

    // Convert to indexed links with layer suffixes
    var allLinks = [];

    topToMid.forEach(function (l) {
      var sId = l.source + '_top';
      var tId = l.target + '_mid';
      if (nodeIndex[sId] !== undefined && nodeIndex[tId] !== undefined) {
        allLinks.push({ source: nodeIndex[sId], target: nodeIndex[tId], value: l.value });
      }
    });

    midToBase.forEach(function (l) {
      var sId = l.source + '_mid';
      var tId = l.target + '_base';
      if (nodeIndex[sId] !== undefined && nodeIndex[tId] !== undefined) {
        allLinks.push({ source: nodeIndex[sId], target: nodeIndex[tId], value: l.value });
      }
    });

    // Keep only top N strongest links to avoid clutter
    allLinks.sort(function (a, b) { return b.value - a.value; });
    var keptLinks = allLinks.slice(0, MAX_LINKS);

    return { nodes: nodes, links: keptLinks };
  }

  /**
   * Build tooltip HTML for a link.
   */
  function buildLinkTooltip(sourceNode, targetNode, value) {
    return '<div class="tooltip-title">' +
      capitalize(sourceNode.name) + ' &rarr; ' + capitalize(targetNode.name) +
      '</div>' +
      '<div class="tooltip-row"><span class="tooltip-label">Perfumes</span>' +
      '<span class="tooltip-value">' + value.toLocaleString() + '</span></div>';
  }

  // ── Main init ──
  window.initSankey = function (containerId, dataPath) {
    var container = document.getElementById(containerId);
    if (!container) {
      console.error('Sankey: container #' + containerId + ' not found');
      return;
    }

    // Dimensions
    var width = container.clientWidth;
    var height = container.clientHeight || 500;
    var innerWidth = width - MARGIN.left - MARGIN.right;
    var innerHeight = height - MARGIN.top - MARGIN.bottom;

    // SVG setup
    var svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', '0 0 ' + width + ' ' + height)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    var g = svg.append('g')
      .attr('transform', 'translate(' + MARGIN.left + ',' + MARGIN.top + ')');

    // ── Load pre-computed data ──
    d3.json(dataPath).then(function (sankeyData) {
      if (!sankeyData || !sankeyData.nodes || !sankeyData.links || !sankeyData.links.length) {
        console.error('Sankey: invalid or empty sankey data from ' + dataPath);
        return;
      }

      // Configure sankey layout
      var sankeyLayout = d3.sankey()
        .nodeWidth(NODE_WIDTH)
        .nodePadding(NODE_PADDING)
        .nodeSort(null)
        .extent([[0, 0], [innerWidth, innerHeight]]);

      // Compute layout
      var graph = sankeyLayout({
        nodes: sankeyData.nodes.map(function (d) { return Object.assign({}, d); }),
        links: sankeyData.links.map(function (d) { return Object.assign({}, d); }),
      });

      // ── Column labels ──
      var columnPositions = [0, innerWidth / 2, innerWidth];
      var columnAnchors = ['start', 'middle', 'end'];

      g.selectAll('.column-label')
        .data(LAYER_NAMES)
        .join('text')
        .attr('class', 'column-label')
        .attr('x', function (d, i) { return columnPositions[i]; })
        .attr('y', -12)
        .attr('text-anchor', function (d, i) { return columnAnchors[i]; })
        .attr('font-size', FONT_SIZE_COLUMN)
        .attr('font-family', FONT_FAMILY_COLUMN)
        .attr('fill', ACCENT_GOLD)
        .attr('opacity', 0.85)
        .text(function (d) { return d; });

      // ── Links ──
      var linkGroup = g.append('g')
        .attr('fill', 'none')
        .attr('stroke-opacity', LINK_OPACITY_DEFAULT);

      var links = linkGroup.selectAll('.sankey-link')
        .data(graph.links)
        .join('path')
        .attr('class', 'sankey-link')
        .attr('d', d3.sankeyLinkHorizontal())
        .attr('stroke', function (d) {
          return window.getNoteColor(d.source.name);
        })
        .attr('stroke-width', function (d) {
          return Math.max(1, d.width);
        })
        .attr('stroke-opacity', LINK_OPACITY_DEFAULT)
        .style('mix-blend-mode', 'screen');

      // Link hover
      links
        .on('mouseenter', function (event, d) {
          links.transition().duration(TRANSITION_DURATION)
            .attr('stroke-opacity', function (l) {
              return l === d ? LINK_OPACITY_HOVER : LINK_OPACITY_DIM;
            });
          window.showTooltip(
            buildLinkTooltip(d.source, d.target, d.value),
            event.pageX, event.pageY
          );
        })
        .on('mousemove', function (event, d) {
          window.showTooltip(
            buildLinkTooltip(d.source, d.target, d.value),
            event.pageX, event.pageY
          );
        })
        .on('mouseleave', function () {
          links.transition().duration(TRANSITION_DURATION)
            .attr('stroke-opacity', LINK_OPACITY_DEFAULT);
          window.hideTooltip();
        });

      // ── Nodes ──
      var nodeGroup = g.append('g');

      var nodeRects = nodeGroup.selectAll('.sankey-node')
        .data(graph.nodes)
        .join('rect')
        .attr('class', 'sankey-node')
        .attr('x', function (d) { return d.x0; })
        .attr('y', function (d) { return d.y0; })
        .attr('width', function (d) { return d.x1 - d.x0; })
        .attr('height', function (d) { return Math.max(1, d.y1 - d.y0); })
        .attr('fill', function (d) { return window.getNoteColor(d.name); })
        .attr('stroke', 'rgba(255,255,255,0.08)')
        .attr('stroke-width', 1)
        .attr('rx', 2)
        .style('cursor', 'pointer');

      // Node hover: highlight connected links
      nodeRects
        .on('mouseenter', function (event, d) {
          var connectedLinks = new Set();
          d.sourceLinks.forEach(function (l) { connectedLinks.add(l); });
          d.targetLinks.forEach(function (l) { connectedLinks.add(l); });

          links.transition().duration(TRANSITION_DURATION)
            .attr('stroke-opacity', function (l) {
              return connectedLinks.has(l) ? LINK_OPACITY_HOVER : LINK_OPACITY_DIM;
            });

          d3.select(this)
            .transition().duration(TRANSITION_DURATION)
            .attr('stroke', ACCENT_GOLD)
            .attr('stroke-width', 2);
        })
        .on('mouseleave', function () {
          links.transition().duration(TRANSITION_DURATION)
            .attr('stroke-opacity', LINK_OPACITY_DEFAULT);

          d3.select(this)
            .transition().duration(TRANSITION_DURATION)
            .attr('stroke', 'rgba(255,255,255,0.08)')
            .attr('stroke-width', 1);
        });

      // ── Node labels ──
      nodeGroup.selectAll('.sankey-label')
        .data(graph.nodes)
        .join('text')
        .attr('class', 'sankey-label')
        .attr('x', function (d) {
          // Left-side labels for first column, right-side for last, center for middle
          if (d.x0 < innerWidth / 3) return d.x0 - 6;
          if (d.x0 > innerWidth * 2 / 3) return d.x1 + 6;
          return (d.x0 + d.x1) / 2;
        })
        .attr('y', function (d) { return (d.y0 + d.y1) / 2; })
        .attr('dy', '0.35em')
        .attr('text-anchor', function (d) {
          if (d.x0 < innerWidth / 3) return 'end';
          if (d.x0 > innerWidth * 2 / 3) return 'start';
          return 'middle';
        })
        .attr('font-size', FONT_SIZE_LABEL)
        .attr('font-family', FONT_FAMILY_LABEL)
        .attr('fill', '#e8e0d4')
        .attr('pointer-events', 'none')
        .attr('opacity', 0.85)
        .text(function (d) { return capitalize(d.name); });

    }).catch(function (err) {
      console.error('Sankey: failed to load data from ' + dataPath, err);
    });
  };
})();
