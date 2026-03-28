/* ============================================
   CHORD DIAGRAM — Note co-occurrence in perfumes
   Shows which notes frequently appear together
   ============================================ */

(function () {
  'use strict';

  // ── Constants ──
  var TOP_N = 12;
  var TRANSITION_MS = 400;
  var DEFAULT_CHORD_OPACITY = 0.4;
  var HOVER_CHORD_OPACITY = 0.8;
  var DIM_CHORD_OPACITY = 0.1;
  var ARC_STROKE = 'rgba(255,255,255,0.1)';
  var ARC_STROKE_WIDTH = 1;
  var LABEL_FONT_SIZE = '10px';
  var LABEL_FONT_FAMILY = 'DM Sans, sans-serif';
  var ARC_PAD_ANGLE = 0.04;
  var GROUP_PAD = 10;

  // ── Helpers ──
  function capitalize(str) {
    return str.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  function formatNumber(n) {
    return n.toLocaleString();
  }

  /**
   * Count note frequencies across all layers of all perfumes.
   * Returns a Map: noteName -> count
   */
  function countNoteFrequencies(perfumes) {
    var freq = {};
    perfumes.forEach(function (p) {
      var allNotes = [].concat(
        p.topNotes || [],
        p.middleNotes || [],
        p.baseNotes || []
      );
      // Deduplicate within a single perfume
      var seen = {};
      allNotes.forEach(function (note) {
        if (!seen[note]) {
          seen[note] = true;
          freq[note] = (freq[note] || 0) + 1;
        }
      });
    });
    return freq;
  }

  /**
   * Get the top N most frequent notes.
   */
  function getTopNotes(freqMap, n) {
    return Object.keys(freqMap)
      .map(function (note) {
        return { note: note, count: freqMap[note] };
      })
      .sort(function (a, b) { return b.count - a.count; })
      .slice(0, n)
      .map(function (d) { return d.note; });
  }

  /**
   * Build the co-occurrence matrix for the given set of notes.
   * matrix[i][j] = number of perfumes containing both notes[i] and notes[j].
   */
  function buildCooccurrenceMatrix(perfumes, notes) {
    var n = notes.length;
    var noteIndex = {};
    notes.forEach(function (note, i) { noteIndex[note] = i; });

    // Initialize matrix with zeros
    var matrix = [];
    for (var i = 0; i < n; i++) {
      var row = [];
      for (var j = 0; j < n; j++) {
        row.push(0);
      }
      matrix.push(row);
    }

    // Count co-occurrences
    perfumes.forEach(function (p) {
      var allNotes = [].concat(
        p.topNotes || [],
        p.middleNotes || [],
        p.baseNotes || []
      );

      // Collect unique notes present in this perfume that are in our set
      var present = [];
      var seen = {};
      allNotes.forEach(function (note) {
        if (!seen[note] && noteIndex[note] !== undefined) {
          seen[note] = true;
          present.push(noteIndex[note]);
        }
      });

      // Increment co-occurrence for each pair
      for (var a = 0; a < present.length; a++) {
        for (var b = a + 1; b < present.length; b++) {
          matrix[present[a]][present[b]] += 1;
          matrix[present[b]][present[a]] += 1;
        }
      }
    });

    return matrix;
  }

  /**
   * Blend two hex colors at 50% mix.
   */
  function blendColors(color1, color2) {
    var c1 = d3.color(color1);
    var c2 = d3.color(color2);
    if (!c1 || !c2) return '#888888';
    return d3.interpolateRgb(c1, c2)(0.5);
  }

  /**
   * Build tooltip HTML for a chord (connection between two notes).
   */
  function buildChordTooltipHtml(sourceNote, targetNote, value) {
    return '<div class="tooltip-title">' +
      capitalize(sourceNote) + ' & ' + capitalize(targetNote) +
      '</div>' +
      '<div class="tooltip-row">' +
      '<span class="tooltip-label">Co-occurrences</span>' +
      '<span class="tooltip-value">' + formatNumber(value) + '</span>' +
      '</div>';
  }

  /**
   * Build tooltip HTML for an arc (single note).
   */
  function buildArcTooltipHtml(noteName, totalCooccurrences) {
    return '<div class="tooltip-title">' + capitalize(noteName) + '</div>' +
      '<div class="tooltip-row">' +
      '<span class="tooltip-label">Total connections</span>' +
      '<span class="tooltip-value">' + formatNumber(totalCooccurrences) + '</span>' +
      '</div>';
  }

  // ── Main init ──
  window.initChord = function (containerId, dataPath) {
    var container = document.getElementById(containerId);
    if (!container) {
      console.error('Chord: container #' + containerId + ' not found');
      return;
    }

    // Dimensions — fit within container
    var width = container.clientWidth;
    var height = container.clientHeight;
    var size = Math.min(width, height);
    var outerRadius = size / 2 - 40;
    var innerRadius = outerRadius - GROUP_PAD;

    // SVG setup
    var svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', '0 0 ' + width + ' ' + height)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    var g = svg.append('g')
      .attr('transform', 'translate(' + (width / 2) + ',' + (height / 2) + ')');

    // ── Load pre-computed data ──
    d3.json(dataPath).then(function (data) {
      if (!data || !data.matrix) {
        console.error('Chord: invalid or empty chord data');
        return;
      }

      var topNotes = data.notes;
      var matrix = data.matrix;

      // Step 3: Create the chord layout
      var chord = d3.chord()
        .padAngle(ARC_PAD_ANGLE)
        .sortSubgroups(d3.descending)
        .sortChords(d3.descending);

      var chords = chord(matrix);

      // Arc and ribbon generators
      var arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

      var ribbon = d3.ribbon()
        .radius(innerRadius);

      // ── Draw arc groups ──
      var groupG = g.selectAll('.chord-group')
        .data(chords.groups)
        .join('g')
        .attr('class', 'chord-group');

      groupG.append('path')
        .attr('d', arc)
        .attr('fill', function (d) {
          return window.getNoteColor(topNotes[d.index]);
        })
        .attr('stroke', ARC_STROKE)
        .attr('stroke-width', ARC_STROKE_WIDTH)
        .style('cursor', 'pointer')
        .on('mouseenter', function (event, d) {
          handleArcHover(d.index, true);
          var total = d.value;
          window.showTooltip(
            buildArcTooltipHtml(topNotes[d.index], total),
            event.pageX,
            event.pageY
          );
        })
        .on('mousemove', function (event, d) {
          window.showTooltip(
            buildArcTooltipHtml(topNotes[d.index], d.value),
            event.pageX,
            event.pageY
          );
        })
        .on('mouseleave', function () {
          handleArcHover(-1, false);
          window.hideTooltip();
        });

      // ── Labels around the outside ──
      groupG.append('text')
        .each(function (d) { d.angle = (d.startAngle + d.endAngle) / 2; })
        .attr('dy', '0.35em')
        .attr('font-size', LABEL_FONT_SIZE)
        .attr('font-family', LABEL_FONT_FAMILY)
        .attr('fill', '#ffffff')
        .attr('opacity', 0.85)
        .attr('text-anchor', function (d) {
          return d.angle > Math.PI ? 'end' : 'start';
        })
        .attr('transform', function (d) {
          var angle = (d.angle * 180 / Math.PI) - 90;
          var flip = d.angle > Math.PI;
          return 'rotate(' + angle + ')' +
            ' translate(' + (outerRadius + 8) + ',0)' +
            (flip ? ' rotate(180)' : '');
        })
        .text(function (d) { return capitalize(topNotes[d.index]); })
        .attr('pointer-events', 'none');

      // ── Draw chords (ribbons) ──
      var ribbons = g.selectAll('.chord-ribbon')
        .data(chords)
        .join('path')
        .attr('class', 'chord-ribbon')
        .attr('d', ribbon)
        .attr('fill', function (d) {
          var c1 = window.getNoteColor(topNotes[d.source.index]);
          var c2 = window.getNoteColor(topNotes[d.target.index]);
          return blendColors(c1, c2);
        })
        .attr('opacity', DEFAULT_CHORD_OPACITY)
        .attr('stroke', 'none')
        .style('cursor', 'pointer')
        .on('mouseenter', function (event, d) {
          handleChordHover(d, true);
          window.showTooltip(
            buildChordTooltipHtml(
              topNotes[d.source.index],
              topNotes[d.target.index],
              d.source.value
            ),
            event.pageX,
            event.pageY
          );
        })
        .on('mousemove', function (event, d) {
          window.showTooltip(
            buildChordTooltipHtml(
              topNotes[d.source.index],
              topNotes[d.target.index],
              d.source.value
            ),
            event.pageX,
            event.pageY
          );
        })
        .on('mouseleave', function () {
          handleChordHover(null, false);
          window.hideTooltip();
        });

      // ── Hover handlers ──
      function handleArcHover(groupIndex, isHovering) {
        if (!isHovering) {
          ribbons
            .transition()
            .duration(TRANSITION_MS)
            .attr('opacity', DEFAULT_CHORD_OPACITY);
          return;
        }

        ribbons
          .transition()
          .duration(TRANSITION_MS)
          .attr('opacity', function (d) {
            var connected = d.source.index === groupIndex ||
              d.target.index === groupIndex;
            return connected ? HOVER_CHORD_OPACITY : DIM_CHORD_OPACITY;
          });
      }

      function handleChordHover(chordData, isHovering) {
        if (!isHovering) {
          ribbons
            .transition()
            .duration(TRANSITION_MS)
            .attr('opacity', DEFAULT_CHORD_OPACITY);
          return;
        }

        ribbons
          .transition()
          .duration(TRANSITION_MS)
          .attr('opacity', function (d) {
            var isThis = d.source.index === chordData.source.index &&
              d.target.index === chordData.target.index;
            return isThis ? HOVER_CHORD_OPACITY : DIM_CHORD_OPACITY;
          });
      }

    }).catch(function (err) {
      console.error('Chord: failed to load data from ' + dataPath, err);
    });
  };
})();
