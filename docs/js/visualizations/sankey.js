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

  // Note: buildSankeyData removed — data is pre-computed in sankey_data.json

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
