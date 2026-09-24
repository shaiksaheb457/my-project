(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Footer year ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Nav scroll state ---- */
  var nav = document.getElementById("siteNav");
  var onScroll = function () {
    if (window.scrollY > 40) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Mobile nav toggle ---- */
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---- Scroll reveals ---- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---- Hero ambient particles ---- */
  var field = document.getElementById("heroParticles");
  if (field && !reduceMotion) {
    var count = window.innerWidth < 720 ? 16 : 34;
    for (var i = 0; i < count; i++) {
      var p = document.createElement("span");
      var left = Math.random() * 100;
      var bottom = Math.random() * 60;
      var duration = 10 + Math.random() * 14;
      var delay = Math.random() * 14;
      p.style.left = left + "%";
      p.style.bottom = bottom + "%";
      p.style.animationDuration = duration + "s";
      p.style.animationDelay = delay + "s";
      field.appendChild(p);
    }
  }

  /* ---- Subtle hero portrait parallax on pointer move (desktop only) ---- */
  var portrait = document.querySelector(".hero-portrait");
  if (portrait && window.matchMedia("(pointer: fine)").matches && !reduceMotion) {
    document.querySelector(".hero").addEventListener("mousemove", function (e) {
      var x = (e.clientX / window.innerWidth - 0.5) * 10;
      var y = (e.clientY / window.innerHeight - 0.5) * 10;
      portrait.style.transform = "translate3d(" + x + "px," + y + "px,0)";
    });
  }
})();
