(function () {
  'use strict';

  var DEADLINE = new Date(2026, 3, 13, 23, 59, 59, 999); // April 13, 2026 end of day (local)

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function updateCountdown() {
    var elDays = document.getElementById('cd-days');
    var elHours = document.getElementById('cd-hours');
    var elMins = document.getElementById('cd-mins');
    var elSecs = document.getElementById('cd-secs');
    if (!elDays || !elHours || !elMins || !elSecs) return;

    var now = new Date().getTime();
    var end = DEADLINE.getTime();
    var diff = Math.max(0, end - now);

    var s = Math.floor(diff / 1000);
    var days = Math.floor(s / 86400);
    var hours = Math.floor((s % 86400) / 3600);
    var mins = Math.floor((s % 3600) / 60);
    var secs = s % 60;

    elDays.textContent = pad(days);
    elHours.textContent = pad(hours);
    elMins.textContent = pad(mins);
    elSecs.textContent = pad(secs);

    if (diff <= 0) {
      clearInterval(countdownTimer);
    }
  }

  var countdownTimer = setInterval(updateCountdown, 1000);
  updateCountdown();

  /* Intersection Observer — sections & items */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function observeSections() {
    var sections = document.querySelectorAll('.section-fade');
    if (!sections.length) return;

    if (reduceMotion) {
      sections.forEach(function (s) {
        s.classList.add('is-visible');
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
        });
      },
      { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );

    sections.forEach(function (s) {
      io.observe(s);
    });
  }

  function observeJudgeRows() {
    var rows = document.querySelectorAll('.judge-row');
    if (!rows.length || reduceMotion) {
      rows.forEach(function (r) {
        r.classList.add('is-visible');
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: '0px', threshold: 0.2 }
    );

    rows.forEach(function (r) {
      io.observe(r);
    });
  }

  observeSections();
  observeJudgeRows();

  /* Flip cards — tap / keyboard */
  var flipRoots = document.querySelectorAll('.flip-root');
  var mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');

  function setFlipped(root, flipped) {
    if (flipped) root.classList.add('is-flipped');
    else root.classList.remove('is-flipped');
  }

  flipRoots.forEach(function (root) {
    root.setAttribute('tabindex', '0');
    root.setAttribute('aria-expanded', 'false');
    var title = root.querySelector('.flip-front h3');
    if (title) {
      root.setAttribute('aria-label', title.textContent + '. Press Enter or Space to flip for full prompt.');
    }

    root.addEventListener('click', function (e) {
      if (mqFine.matches) return;
      e.preventDefault();
      var on = root.classList.toggle('is-flipped');
      root.setAttribute('aria-expanded', on ? 'true' : 'false');
    });

    root.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        var on = root.classList.toggle('is-flipped');
        root.setAttribute('aria-expanded', on ? 'true' : 'false');
      }
    });
  });

})();
