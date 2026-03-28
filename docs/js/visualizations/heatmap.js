/* ============================================
   HEATMAP.JS — Accord frequency by gender
   Interactive heatmap with sort controls and hover details
   ============================================ */

(function () {
  'use strict';

  // ── Constants ──
  var GENDERS = ['women', 'men', 'unisex'];
  var GENDER_LABELS = { women: 'WOMEN', men: 'MEN', unisex: 'UNISEX' };
  var TOP_N_ACCORDS = 20;
  var TRANSITION_MS = 300;
  var CELL_BORDER_COLOR = 'rgba(255,255,255,0.05)';
  var CELL_HOVER_BORDER = '#c9a96e';
  var CELL_HOVER_SCALE = 1.02;
  var ACCENT_GOLD = '#c9a96e';
  var COLOR_LOW = '#1a1a1a';
  var COLOR_MID = '#8b7355';
  var COLOR_HIGH = '#c9a96e';
  var LABEL_COLOR = '#9a9088';
  var TEXT_PRIMARY = '#e8e0d4';
  var FONT_HEADING = 'Cormorant Garamond, Georgia, serif';
  var FONT_BODY = 'DM Sans, sans-serif';
  var ROW_LABEL_SIZE = 12;
  var COL_LABEL_SIZE = 12;
  var CELL_VALUE_SIZE = 10;
  var COL_HEADER_SPACING = '0.1em';
  var MARGIN = { top: 50, right: 20, bottom: 10, left: 120 };
  var SORT_MODES = ['frequency', 'rating', 'alphabetical'];
  var SORT_LABELS = {
    frequency: 'By Frequency',
    rating: 'By Rating',
    alphabetical: 'A-Z',
  };

  // ── Helpers ──
  function capitalize(str) {
    return str.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  function formatNumber(n) {
    return n.toLocaleString();
  }

  function buildTooltipHtml(d, gender) {
    var genderVal = d[gender];
    return '<div class="tooltip-title">' + capitalize(d.accord) + ' — ' + capitalize(gender) + '</div>' +
      '<div class="tooltip-row"><span class="tooltip-label">Frequency</span>' +
      '<span class="tooltip-value">' + formatNumber(genderVal) + '</span></div>' +
      '<div class="tooltip-row"><span class="tooltip-label">Total Frequency</span>' +
      '<span class="tooltip-value">' + formatNumber(d.frequency) + '</span></div>' +
      '<div class="tooltip-row"><span class="tooltip-label">Avg Rating</span>' +
      '<span class="tooltip-value">' + d.avgRating.toFixed(3) + '</span></div>' +
      '<div class="tooltip-row"><span class="tooltip-label">As Primary</span>' +
      '<span class="tooltip-value">' + formatNumber(d.asPrimary) + '</span></div>' +
      '<div class="tooltip-row"><span class="tooltip-label">Avg Rank</span>' +
      '<span class="tooltip-value">' + d.avgRank.toFixed(2) + '</span></div>';
  }

  function sortAccords(data, mode) {
    var sorted = data.slice();
    switch (mode) {
      case 'frequency':
        sorted.sort(function (a, b) { return b.frequency - a.frequency; });
        break;
      case 'rating':
        sorted.sort(function (a, b) { return b.avgRating - a.avgRating; });
        break;
      case 'alphabetical':
        sorted.sort(function (a, b) { return a.accord.localeCompare(b.accord); });
        break;
    }
    return sorted;
  }

  // ── Main init ──
  window.initHeatmap = function (containerId, dataPath) {
    var container = document.getElementById(containerId);
    if (!container) {
      console.error('Heatmap: container #' + containerId + ' not found');
      return;
    }

    var currentSort = SORT_MODES[0];
    var accords = [];

    // ── Build controls ──
    var controls = document.createElement('div');
    controls.style.cssText = 'display:flex;gap:8px;margin-bottom:12px;justify-content:flex-end;';

    var sortButtons = {};
    SORT_MODES.forEach(function (mode) {
      var btn = document.createElement('button');
      btn.textContent = SORT_LABELS[mode];
      btn.style.cssText =
        'background:rgba(255,255,255,0.04);border:1px solid rgba(201,169,110,0.15);' +
        'color:' + LABEL_COLOR + ';padding:4px 12px;font-size:11px;font-family:' + FONT_BODY + ';' +
        'cursor:pointer;border-radius:3px;transition:all 0.2s;letter-spacing:0.05em;';
      sortButtons[mode] = btn;
      controls.appendChild(btn);
    });
    container.appendChild(controls);

    function updateSortButtons() {
      SORT_MODES.forEach(function (mode) {
        var btn = sortButtons[mode];
        if (mode === currentSort) {
          btn.style.background = 'rgba(201,169,110,0.15)';
          btn.style.color = ACCENT_GOLD;
          btn.style.borderColor = 'rgba(201,169,110,0.4)';
        } else {
          btn.style.background = 'rgba(255,255,255,0.04)';
          btn.style.color = LABEL_COLOR;
          btn.style.borderColor = 'rgba(201,169,110,0.15)';
        }
      });
    }
    updateSortButtons();

    // ── SVG setup ──
    var svgContainer = document.createElement('div');
    svgContainer.style.cssText = 'width:100%;overflow:visible;';
    container.appendChild(svgContainer);

    // ── Load data ──
    d3.json(dataPath).then(function (raw) {
      var stats = raw.stats
        .slice()
        .sort(function (a, b) { return b.frequency - a.frequency; })
        .slice(0, TOP_N_ACCORDS);

      accords = stats;

      // Color scale across all gender-specific values
      var allValues = [];
      stats.forEach(function (d) {
        GENDERS.forEach(function (g) { allValues.push(d[g]); });
      });
      var colorScale = d3.scaleLinear()
        .domain([0, d3.median(allValues), d3.max(allValues)])
        .range([COLOR_LOW, COLOR_MID, COLOR_HIGH])
        .clamp(true);

      function render(sortMode) {
        var sorted = sortAccords(accords, sortMode);
        var accordNames = sorted.map(function (d) { return d.accord; });

        // Clear previous SVG
        d3.select(svgContainer).selectAll('*').remove();

        // Compute dimensions
        var containerWidth = container.clientWidth;
        var availWidth = containerWidth - MARGIN.left - MARGIN.right;
        var cellWidth = Math.floor(availWidth / GENDERS.length);
        var cellHeight = Math.max(24, Math.min(36, Math.floor(
          (container.clientHeight - MARGIN.top - MARGIN.bottom - 60) / accordNames.length
        )));
        var totalWidth = MARGIN.left + cellWidth * GENDERS.length + MARGIN.right;
        var totalHeight = MARGIN.top + cellHeight * accordNames.length + MARGIN.bottom;

        var svg = d3.select(svgContainer)
          .append('svg')
          .attr('width', totalWidth)
          .attr('height', totalHeight);

        var g = svg.append('g')
          .attr('transform', 'translate(' + MARGIN.left + ',' + MARGIN.top + ')');

        // ── Column headers ──
        g.selectAll('.col-label')
          .data(GENDERS)
          .join('text')
          .attr('class', 'col-label')
          .attr('x', function (d, i) { return i * cellWidth + cellWidth / 2; })
          .attr('y', -12)
          .attr('text-anchor', 'middle')
          .attr('font-size', COL_LABEL_SIZE + 'px')
          .attr('font-family', FONT_BODY)
          .attr('fill', LABEL_COLOR)
          .attr('letter-spacing', COL_HEADER_SPACING)
          .text(function (d) { return GENDER_LABELS[d]; });

        // ── Row labels ──
        g.selectAll('.row-label')
          .data(accordNames)
          .join('text')
          .attr('class', 'row-label')
          .attr('x', -10)
          .attr('y', function (d, i) { return i * cellHeight + cellHeight / 2; })
          .attr('text-anchor', 'end')
          .attr('dominant-baseline', 'middle')
          .attr('font-size', ROW_LABEL_SIZE + 'px')
          .attr('font-family', FONT_HEADING)
          .attr('fill', LABEL_COLOR)
          .text(function (d) { return capitalize(d); });

        // ── Build cell data ──
        var cellData = [];
        sorted.forEach(function (d, rowIdx) {
          GENDERS.forEach(function (gender, colIdx) {
            cellData.push({
              accord: d.accord,
              gender: gender,
              value: d[gender],
              rowIdx: rowIdx,
              colIdx: colIdx,
              stat: d,
            });
          });
        });

        // ── Cell groups ──
        var cells = g.selectAll('.cell-group')
          .data(cellData, function (d) { return d.accord + '-' + d.gender; })
          .join('g')
          .attr('class', 'cell-group')
          .attr('transform', function (d) {
            return 'translate(' + (d.colIdx * cellWidth) + ',' + (d.rowIdx * cellHeight) + ')';
          })
          .style('cursor', 'pointer');

        // Cell rects
        cells.append('rect')
          .attr('width', cellWidth)
          .attr('height', cellHeight)
          .attr('fill', function (d) { return colorScale(d.value); })
          .attr('stroke', CELL_BORDER_COLOR)
          .attr('stroke-width', 1)
          .style('transition', 'transform ' + TRANSITION_MS + 'ms ease');

        // Cell value text
        cells.append('text')
          .attr('x', cellWidth / 2)
          .attr('y', cellHeight / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('font-size', CELL_VALUE_SIZE + 'px')
          .attr('font-family', FONT_BODY)
          .attr('fill', function (d) {
            // Light text on dark cells, muted text on lighter cells
            var brightness = d.value / d3.max(allValues);
            return brightness > 0.5 ? '#1a1a1a' : TEXT_PRIMARY;
          })
          .attr('pointer-events', 'none')
          .attr('opacity', 0.85)
          .text(function (d) { return formatNumber(d.value); });

        // ── Highlight helpers ──
        function highlightRowCol(rowIdx, colIdx) {
          // Dim all cells
          cells.selectAll('rect')
            .transition()
            .duration(TRANSITION_MS)
            .attr('stroke', function (dd) {
              if (dd.rowIdx === rowIdx || dd.colIdx === colIdx) {
                return CELL_HOVER_BORDER;
              }
              return CELL_BORDER_COLOR;
            })
            .attr('stroke-width', function (dd) {
              if (dd.rowIdx === rowIdx && dd.colIdx === colIdx) return 2;
              if (dd.rowIdx === rowIdx || dd.colIdx === colIdx) return 1.5;
              return 1;
            });

          // Scale hovered cell
          cells.filter(function (dd) {
            return dd.rowIdx === rowIdx && dd.colIdx === colIdx;
          }).attr('transform', function (dd) {
            var tx = dd.colIdx * cellWidth;
            var ty = dd.rowIdx * cellHeight;
            var cx = tx + cellWidth / 2;
            var cy = ty + cellHeight / 2;
            return 'translate(' + cx + ',' + cy + ') scale(' + CELL_HOVER_SCALE + ') translate(' + (-cellWidth / 2) + ',' + (-cellHeight / 2) + ')';
          });

          // Highlight row label
          g.selectAll('.row-label')
            .transition()
            .duration(TRANSITION_MS)
            .attr('fill', function (dd, i) {
              return i === rowIdx ? ACCENT_GOLD : LABEL_COLOR;
            });

          // Highlight column label
          g.selectAll('.col-label')
            .transition()
            .duration(TRANSITION_MS)
            .attr('fill', function (dd, i) {
              return i === colIdx ? ACCENT_GOLD : LABEL_COLOR;
            });
        }

        function resetHighlight() {
          cells.selectAll('rect')
            .transition()
            .duration(TRANSITION_MS)
            .attr('stroke', CELL_BORDER_COLOR)
            .attr('stroke-width', 1);

          cells.attr('transform', function (dd) {
            return 'translate(' + (dd.colIdx * cellWidth) + ',' + (dd.rowIdx * cellHeight) + ')';
          });

          g.selectAll('.row-label')
            .transition()
            .duration(TRANSITION_MS)
            .attr('fill', LABEL_COLOR);

          g.selectAll('.col-label')
            .transition()
            .duration(TRANSITION_MS)
            .attr('fill', LABEL_COLOR);
        }

        // ── Hover interactions ──
        cells
          .on('mouseenter', function (event, d) {
            highlightRowCol(d.rowIdx, d.colIdx);
            window.showTooltip(buildTooltipHtml(d.stat, d.gender), event.pageX, event.pageY);
          })
          .on('mousemove', function (event, d) {
            window.showTooltip(buildTooltipHtml(d.stat, d.gender), event.pageX, event.pageY);
          })
          .on('mouseleave', function () {
            resetHighlight();
            window.hideTooltip();
          });

        // ── Click: expand row with cooccurrence breakdown (HTML, outside SVG) ──
        var expandedAccord = null;
        var expansionDiv = document.createElement('div');
        expansionDiv.className = 'heatmap-expansion';
        expansionDiv.style.cssText = 'display:none;background:rgba(17,17,17,0.95);border:1px solid rgba(201,169,110,0.25);border-radius:8px;padding:16px 24px 24px;margin-top:16px;max-width:' + totalWidth + 'px;margin-left:auto;margin-right:auto;';
        // Insert AFTER the container (not inside it) to avoid flex layout issues
        container.parentNode.insertBefore(expansionDiv, container.nextSibling);

        function collapseExpansion() {
          expandedAccord = null;
          expansionDiv.style.display = 'none';
          expansionDiv.innerHTML = '';
          cells.attr('stroke', CELL_BORDER_COLOR).attr('stroke-width', 1);
        }

        cells.on('click', function (event, d) {
          event.stopPropagation();
          var clickedAccord = d.accord;

          if (expandedAccord === clickedAccord) {
            collapseExpansion();
            return;
          }

          expandedAccord = clickedAccord;

          // Highlight clicked row
          cells.each(function (cd) {
            d3.select(this)
              .attr('stroke', cd.accord === clickedAccord ? ACCENT_GOLD : CELL_BORDER_COLOR)
              .attr('stroke-width', cd.accord === clickedAccord ? 2 : 1);
          });

          // Find cooccurrence data
          var coocs = (raw.cooccurrence || [])
            .filter(function (c) {
              return c.accord1 === clickedAccord || c.accord2 === clickedAccord;
            })
            .map(function (c) {
              return {
                partner: c.accord1 === clickedAccord ? c.accord2 : c.accord1,
                count: c.count,
              };
            })
            .sort(function (a, b) { return b.count - a.count; })
            .slice(0, 8);

          if (coocs.length === 0) { collapseExpansion(); return; }

          var maxCooc = coocs[0].count;

          // Build HTML expansion panel
          var html = '<div style="font-size:10px;font-family:' + FONT_BODY + ';color:' + ACCENT_GOLD + ';letter-spacing:0.08em;margin-bottom:12px;">TOP CO-OCCURRING ACCORDS WITH ' + clickedAccord.toUpperCase() + '</div>';

          coocs.forEach(function (c) {
            var pct = Math.round((c.count / maxCooc) * 100);
            html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">' +
              '<span style="width:90px;text-align:right;font-size:11px;font-family:' + FONT_HEADING + ';color:' + LABEL_COLOR + ';">' + capitalize(c.partner) + '</span>' +
              '<div style="flex:1;height:22px;background:rgba(255,255,255,0.04);border-radius:3px;overflow:hidden;">' +
              '<div style="width:' + pct + '%;height:100%;background:' + COLOR_MID + ';border-radius:3px;transition:width 0.6s ease;"></div>' +
              '</div>' +
              '<span style="width:50px;font-size:10px;font-family:' + FONT_BODY + ';color:' + LABEL_COLOR + ';">' + formatNumber(c.count) + '</span>' +
              '</div>';
          });

          expansionDiv.innerHTML = html;
          expansionDiv.style.display = 'block';

          // Scroll into view
          setTimeout(function () {
            expansionDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 100);
        });

        // Click outside to collapse
        document.addEventListener('click', function (e) {
          if (expandedAccord && !container.contains(e.target)) {
            collapseExpansion();
          }
        });
      }

      // Initial render
      render(currentSort);

      // Sort button handlers
      SORT_MODES.forEach(function (mode) {
        sortButtons[mode].addEventListener('click', function () {
          currentSort = mode;
          updateSortButtons();
          render(currentSort);
        });
      });

      // Resize handler (debounced)
      var resizeTimer;
      window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () { render(currentSort); }, 250);
      });

    }).catch(function (err) {
      console.error('Heatmap: failed to load data from ' + dataPath, err);
    });
  };
})();
