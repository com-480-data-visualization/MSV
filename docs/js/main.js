/* ============================================
   MAIN.JS — Orchestrates scrollytelling and viz initialization
   ============================================ */

(function () {
  'use strict';

  // Lenis removed — was causing scroll lag. Native smooth scroll via CSS instead.

  // ── Navigation show/hide ──
  var nav = document.getElementById('nav');

  window.addEventListener('scroll', function () {
    if (window.scrollY > window.innerHeight * 0.8) {
      nav.classList.add('visible');
    } else {
      nav.classList.remove('visible');
    }
  });

  // ── Active nav link ──
  var sections = document.querySelectorAll('.story-section');
  var navLinks = document.querySelectorAll('.nav-links a');

  var sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var id = entry.target.id;
        navLinks.forEach(function (link) {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { threshold: 0.3 });

  sections.forEach(function (s) { sectionObserver.observe(s); });

  // ── Section reveal on scroll ──
  var intros = document.querySelectorAll('.section-intro');
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -50px 0px' });

  intros.forEach(function (el) { revealObserver.observe(el); });

  // ── Hero particles ──
  function initHeroParticles() {
    var container = document.getElementById('hero-particles');
    var svg = d3.select(container).append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .style('position', 'absolute')
      .style('top', 0)
      .style('left', 0);

    var w = container.clientWidth;
    var h = container.clientHeight;

    var particles = d3.range(60).map(function () {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 3 + 1,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.5 - 0.1,
        opacity: Math.random() * 0.3 + 0.1,
      };
    });

    var circles = svg.selectAll('circle')
      .data(particles)
      .join('circle')
      .attr('cx', function (d) { return d.x; })
      .attr('cy', function (d) { return d.y; })
      .attr('r', function (d) { return d.r; })
      .attr('fill', '#c9a96e')
      .attr('opacity', function (d) { return d.opacity; });

    var heroAnimating = true;
    function animate() {
      if (!heroAnimating) return;
      particles.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
      });

      circles
        .attr('cx', function (d) { return d.x; })
        .attr('cy', function (d) { return d.y; });

      requestAnimationFrame(animate);
    }
    animate();

    // Pause when hero is off-screen
    var heroObserver = new IntersectionObserver(function (entries) {
      heroAnimating = entries[0].isIntersecting;
      if (heroAnimating) animate();
    });
    heroObserver.observe(document.getElementById('hero'));
  }

  // ── Scrollama setup for each section ──
  var scrollamaInstances = [];

  function setupScrollama(sectionId, vizInitFn) {
    var section = document.getElementById(sectionId);
    if (!section) return;

    var scroller = scrollama();
    scroller
      .setup({
        step: '#' + sectionId + ' .step',
        offset: 0.5,
        debug: false,
      })
      .onStepEnter(function (response) {
        // Mark active step
        var steps = section.querySelectorAll('.step');
        steps.forEach(function (s) { s.classList.remove('is-active'); });
        response.element.classList.add('is-active');

        // Trigger visualization update
        if (vizInitFn && vizInitFn.onStep) {
          vizInitFn.onStep(response.index, response.direction);
        }
      })
      .onStepExit(function (response) {
        if (response.direction === 'up' && response.index === 0) {
          var steps = section.querySelectorAll('.step');
          steps.forEach(function (s) { s.classList.remove('is-active'); });
        }
      });

    scrollamaInstances.push(scroller);
  }

  // ── Resize handling (debounced) ──
  var scrollamaResizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(scrollamaResizeTimer);
    scrollamaResizeTimer = setTimeout(function () {
      scrollamaInstances.forEach(function (s) { s.resize(); });
    }, 200);
  });

  // ── Global tooltip ──
  var tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  document.body.appendChild(tooltip);

  window.showTooltip = function (html, x, y) {
    tooltip.innerHTML = html;
    tooltip.classList.add('visible');
    tooltip.style.left = (x + 15) + 'px';
    tooltip.style.top = (y - 10) + 'px';
  };

  window.hideTooltip = function () {
    tooltip.classList.remove('visible');
  };

  // ── Shared text escaping utility (defense-in-depth against XSS) ──
  window.escapeHtml = function (str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  };

  // ── Note family color scale (shared across visualizations) ─���
  window.NOTE_FAMILIES = {
    floral: { notes: ['rose', 'jasmine', 'lily-of-the-valley', 'iris', 'peony', 'magnolia', 'tuberose', 'orange blossom', 'neroli', 'ylang-ylang', 'gardenia', 'frangipani', 'violet', 'lotus', 'cherry blossom', 'osmanthus', 'honeysuckle', 'mimosa', 'freesia', 'geranium', 'carnation', 'heliotrope', 'plumeria', 'hibiscus', 'lilac', 'narcissus', 'orchid', 'tiare flower', 'water lily', 'bulgarian rose', 'egyptian jasmine', 'turkish rose'], color: '#e8a0bf' },
    woody: { notes: ['sandalwood', 'cedar', 'vetiver', 'patchouli', 'oud', 'agarwood', 'birch', 'guaiac wood', 'driftwood', 'cypress', 'pine', 'teak', 'bamboo', 'rosewood', 'cashmeran', 'gaiac wood', 'blonde woods', 'white woods'], color: '#8b6f47' },
    citrus: { notes: ['bergamot', 'lemon', 'orange', 'grapefruit', 'mandarin orange', 'lime', 'yuzu', 'blood orange', 'tangerine', 'kumquat', 'citruses', 'citron', 'clementine', 'bitter orange'], color: '#d4a843' },
    spicy: { notes: ['pepper', 'cinnamon', 'cardamom', 'ginger', 'saffron', 'nutmeg', 'clove', 'cumin', 'pink pepper', 'black pepper', 'white pepper', 'star anise', 'elemi'], color: '#c75b39' },
    fresh: { notes: ['mint', 'eucalyptus', 'green notes', 'green tea', 'basil', 'rosemary', 'thyme', 'lavender', 'sea notes', 'water notes', 'ozone', 'aldehydes', 'ozonic notes', 'marine notes', 'aquatic notes'], color: '#6ba89c' },
    sweet: { notes: ['vanilla', 'tonka bean', 'caramel', 'honey', 'cocoa', 'chocolate', 'praline', 'sugar', 'marshmallow', 'cotton candy', 'toffee', 'rum'], color: '#d4956b' },
    musky: { notes: ['musk', 'amber', 'ambergris', 'benzoin', 'labdanum', 'civet', 'castoreum', 'white musk', 'powdery notes'], color: '#b8a090' },
    fruity: { notes: ['apple', 'peach', 'pear', 'plum', 'raspberry', 'strawberry', 'cherry', 'blackberry', 'blueberry', 'coconut', 'mango', 'pineapple', 'watermelon', 'fig', 'lychee', 'passion fruit', 'pomegranate', 'fruity notes', 'black currant', 'red apple', 'guarana', 'guava'], color: '#d47fa6' },
  };

  window.getNoteFamily = function (noteName) {
    var lower = noteName.toLowerCase();
    for (var family in NOTE_FAMILIES) {
      if (NOTE_FAMILIES[family].notes.indexOf(lower) !== -1) return family;
    }
    return 'other';
  };

  window.getNoteColor = function (noteName) {
    var family = getNoteFamily(noteName);
    return NOTE_FAMILIES[family] ? NOTE_FAMILIES[family].color : '#888888';
  };

  window.FAMILY_COLORS = {};
  for (var f in NOTE_FAMILIES) {
    FAMILY_COLORS[f] = NOTE_FAMILIES[f].color;
  }
  FAMILY_COLORS['other'] = '#888888';

  // ── Lazy initialization: init each viz when its container becomes visible ──
  var vizConfigs = [
    { initFn: 'initBeeswarm', containerId: 'viz-beeswarm', dataPath: 'data/notes_stats.json', scrollyId: 'scrolly-beeswarm' },
    { initFn: 'initRadar', containerId: 'viz-radar', dataPath: 'data/notes_stats.json', scrollyId: 'scrolly-radar' },
    { initFn: 'initBubbles', containerId: 'viz-bubbles', dataPath: 'data/notes_stats.json', scrollyId: 'scrolly-bubbles' },
    { initFn: 'initTimeline', containerId: 'viz-timeline', dataPath: 'data/temporal_trends.json', scrollyId: 'scrolly-timeline' },
    { initFn: 'initPrice', containerId: 'viz-price', dataPath: 'data/price_data.json', scrollyId: 'scrolly-price' },
    { initFn: 'initChord', containerId: 'viz-chord', dataPath: 'data/chord_data.json', scrollyId: null },
    { initFn: 'initSankey', containerId: 'viz-sankey', dataPath: 'data/sankey_data.json', scrollyId: null },
    { initFn: 'initHeatmap', containerId: 'viz-heatmap', dataPath: 'data/accords_data.json', scrollyId: null },
    { initFn: 'initGeoMap', containerId: 'viz-geo-map', dataPath: 'data/geo_data.json', scrollyId: 'scrolly-geo-map' },
  ];

  function lazyInitViz(config) {
    var container = document.getElementById(config.containerId);
    if (!container || container.dataset.initialized) return;

    var width = container.clientWidth;
    if (width < 10) return; // not laid out yet

    container.dataset.initialized = 'true';
    var fn = window[config.initFn];
    if (!fn) return;

    var vizResult = fn(config.containerId, config.dataPath);
    if (config.scrollyId) {
      setupScrollama(config.scrollyId, vizResult);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHeroParticles();

    // Observe each viz container for visibility
    var vizObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          var config = vizConfigs.find(function (c) { return c.containerId === id; });
          if (config) {
            requestAnimationFrame(function () { lazyInitViz(config); });
          }
        }
      });
    }, { rootMargin: '200px 0px' }); // init 200px before entering viewport

    vizConfigs.forEach(function (config) {
      var el = document.getElementById(config.containerId);
      if (el) vizObserver.observe(el);
    });
  });
})();
