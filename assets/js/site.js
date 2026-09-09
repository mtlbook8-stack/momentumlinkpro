/* ==========================================================================
   Momentum Link Professionals — site behaviour
   Progressive enhancement only: every page is readable and navigable with
   this file removed. Nothing here is required to reach the content.
   ========================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function seg(p, a, b) { return clamp01((p - a) / (b - a)); }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ── Deferred pictures ─────────────────────────────────────────────────
     Images that sit inside the viewport but are not being looked at hold
     their URLs in data attributes; this puts them back when they are wanted.
     -------------------------------------------------------------------- */

  /* Marks a picture as still arriving, so its space shows a sheen rather
     than sitting blank, and clears it once the picture has decoded. */
  function watchImage(img) {
    if (!img || img.__mlWatched) return;
    img.__mlWatched = true;

    function done() {
      img.classList.add("is-loaded");
      img.__mlWatched = false;
    }

    // A deferred picture holds a blank placeholder, which counts as complete.
    if (img.complete && img.naturalWidth > 1 && !img.hasAttribute("data-src")) {
      done();
      return;
    }
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });   // no endless sheen
  }

  function watchImages(scope) {
    $$("img", scope || document).forEach(watchImage);
  }

  function hydrate(scope) {
    if (!scope) return;
    var pics = scope.hasAttribute && scope.hasAttribute("data-defer")
      ? [scope] : $$("[data-defer]", scope);
    pics.forEach(function (pic) {
      var source = pic.querySelector("source");
      var img = pic.querySelector("img");
      if (source && source.dataset.srcset) {
        source.srcset = source.dataset.srcset;
        source.removeAttribute("data-srcset");
      }
      if (img && img.dataset.srcset) {
        img.srcset = img.dataset.srcset;
        img.src = img.dataset.src;
        img.removeAttribute("data-srcset");
        img.removeAttribute("data-src");
      }
      pic.removeAttribute("data-defer");
      if (img) { img.classList.remove("is-loaded"); img.__mlWatched = false; watchImage(img); }
    });
  }

  /* ── Mobile navigation ─────────────────────────────────────────────── */

  function initNav() {
    var toggle = $("[data-nav-toggle]");
    var nav = $("#site-nav");
    if (!toggle || !nav) return;

    var mq = window.matchMedia("(max-width: 900px)");

    function apply() {
      if (mq.matches) {
        nav.hidden = toggle.getAttribute("aria-expanded") !== "true";
      } else {
        nav.hidden = false;
        toggle.setAttribute("aria-expanded", "false");
      }
    }

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", open ? "false" : "true");
      apply();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mq.matches && toggle.getAttribute("aria-expanded") === "true") {
        toggle.setAttribute("aria-expanded", "false");
        apply();
        toggle.focus();
      }
    });

    if (mq.addEventListener) mq.addEventListener("change", apply);
    else if (mq.addListener) mq.addListener(apply);
    apply();
  }

  /* ── Reading-progress bar ──────────────────────────────────────────── */

  function initProgress() {
    var bar = $("[data-progress]");
    if (!bar) return;
    return function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0) + "%";
    };
  }

  /* ── Pinned scroll stage on the home page ──────────────────────────── */

  function initStage() {
    var stage = $("[data-stage]");
    if (!stage) return;

    // The choreography is scroll-driven; with reduced motion it would never
    // resolve, so fall back to the flat hero the stylesheet already defines.
    if (reduced) {
      stage.classList.add("is-static");
      return;
    }

    var l1 = $("[data-stage-l1]", stage);
    var l2 = $("[data-stage-l2]", stage);
    var l2img = l2 && l2.querySelector("img");
    var tint = $("[data-stage-tint]", stage);
    var blockA = $("[data-stage-a]", stage);
    var blockB = $("[data-stage-b]", stage);
    var bar = $("[data-stage-bar]", stage);
    var count = $("[data-stage-count]", stage);
    var cue = $("[data-stage-cue]", stage);
    // The opening frame — everything that dresses the very first view.
    var backdrop = $("[data-stage-backdrop]", stage);
    var glow = $("[data-stage-glow]", stage);
    var frame = $("[data-stage-frame]", stage);
    var intro = $("[data-stage-intro]", stage);

    return function () {
      var rect = stage.getBoundingClientRect();
      var total = stage.offsetHeight - window.innerHeight;
      var p = clamp01(total > 0 ? -rect.top / total : 0);

      if (l1) {
        var a = ease(seg(p, 0, 0.24));
        var b = ease(seg(p, 0.42, 0.78));
        l1.style.opacity = String(lerp(0.92, 1, ease(seg(p, 0, 0.12))));
        l1.style.borderRadius = lerp(30, 0, a) + "px";
        l1.style.transform = "translate(-50%,-50%) scale(" + lerp(0.3, 1, a) * lerp(1, 1.14, b) + ")";
      }
      if (l2) {
        var c = ease(seg(p, 0.52, 0.84));
        l2.style.clipPath = "inset(" + lerp(100, 0, c) + "% 0 0 0)";
        if (l2img) l2img.style.transform = "scale(" + lerp(1.16, 1, c) + ") translateY(" + lerp(5, 0, c) + "%)";
      }
      if (tint) tint.style.opacity = String(lerp(0.15, 1, ease(seg(p, 0.08, 0.34))));

      if (blockA) {
        var inA = ease(seg(p, 0.16, 0.34));
        var outA = ease(seg(p, 0.44, 0.56));
        blockA.style.opacity = String(inA * (1 - outA));
        blockA.style.transform = "translateY(" + (lerp(48, 0, inA) + lerp(0, -46, outA)) + "px)";
        blockA.style.filter = "blur(" + lerp(8, 0, inA) + "px)";
        blockA.style.pointerEvents = inA * (1 - outA) > 0.6 ? "auto" : "none";
      }
      if (blockB) {
        var inB = ease(seg(p, 0.7, 0.9));
        blockB.style.opacity = String(inB);
        blockB.style.transform = "translateY(" + lerp(52, 0, inB) + "px)";
        blockB.style.filter = "blur(" + lerp(8, 0, inB) + "px)";
        blockB.style.pointerEvents = inB > 0.6 ? "auto" : "none";
      }
      if (bar) bar.style.transform = "scaleX(" + p + ")";
      if (count) count.textContent = (p > 0.6 ? "02" : "01") + " / 02";
      if (cue) cue.style.opacity = String(1 - ease(seg(p, 0, 0.14)));

      // Clear the opening frame as soon as the plate starts growing, so the
      // sequence from here on is exactly what it always was.
      var opening = 1 - ease(seg(p, 0, 0.13));
      if (glow) glow.style.opacity = String(opening);
      if (frame) frame.style.opacity = String(opening);
      if (intro) intro.style.opacity = String(opening);
      if (backdrop) backdrop.style.opacity = String(0.5 * (1 - ease(seg(p, 0, 0.24))));
    };
  }

  /* ── Scroll reveal ─────────────────────────────────────────────────── */

  function initReveal() {
    var targets = $$("[data-reveal]");
    if (!targets.length) return;

    if (reduced || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    function show(el, index) {
      el.style.transitionDelay = Math.min(index * 70, 350) + "ms";
      el.classList.add("is-visible");
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var index = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
        show(el, index);
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });

    targets.forEach(function (el) { io.observe(el); });

    // Observer callbacks are throttled while a tab is backgrounded, so anything
    // already inside the viewport is swept in directly. Content must never be
    // left sitting at opacity 0 because a notification did not arrive.
    var pending = targets.slice();

    function sweep() {
      pending = pending.filter(function (el) {
        if (el.classList.contains("is-visible")) return false;
        if (el.getBoundingClientRect().top >= window.innerHeight * 1.05) return true;
        show(el, targets.indexOf(el));
        io.unobserve(el);
        return false;
      });
      if (!pending.length) window.removeEventListener("scroll", sweep);
    }

    window.addEventListener("load", sweep);
    window.addEventListener("scroll", sweep, { passive: true });
    window.setTimeout(sweep, 1200);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") sweep();
    });
  }

  /* ── Card blurbs open on hover, but only where hovering exists ─────── */

  function initCards() {
    if (!finePointer || reduced) return;
    $$("[data-card]").forEach(function (card) { card.classList.add("is-collapsible"); });
  }

  /* ── Sector rail on the home page ──────────────────────────────────── */

  function initPanels() {
    var panels = $$("[data-panel]");
    if (!panels.length) return;

    function open(panel) {
      panels.forEach(function (p) { p.classList.toggle("is-open", p === panel); });
    }

    panels.forEach(function (panel) {
      panel.addEventListener("mouseenter", function () { if (finePointer) open(panel); });
      panel.addEventListener("focus", function () { open(panel); });

      // One tap expands, a second opens the sector. Keyed off whether the panel
      // is already expanded rather than off pointer detection, so it holds on
      // any device — including the tablets and hybrids that claim hover.
      // Where hover does work the panel is already open by the time a click
      // lands, so a click there still follows the link first time.
      panel.addEventListener("click", function (e) {
        if (panel.classList.contains("is-open")) return;
        e.preventDefault();
        open(panel);
      });
    });
  }

  /* ── Practice as a process ─────────────────────────────────────────────
     The rail tracks how far through the six steps you are; each step's panel
     expands out of its point on the way in and folds back to it on the way
     out. Without JS every panel simply stays open.
     -------------------------------------------------------------------- */

  function initProcess() {
    var process = $("[data-process]");
    if (!process) return;

    var steps = $$("[data-step]", process);
    var points = $$("[data-process-point]", process);
    var fill = $("[data-process-fill]", process);
    if (!steps.length) return;

    if (reduced) {
      // No travelling animation to follow — show the whole process at once.
      steps.forEach(function (el) { el.classList.add("is-active"); });
      points.forEach(function (el) { el.classList.add("is-done"); });
      return;
    }

    // Pin the section: the steps stop moving, and scrolling only chooses which
    // one is projected out of the rail.
    var pin = $(".process__pin", process);
    process.classList.add("is-pinned");

    // The last stretch of the section is a tail: progress has already reached
    // its end there, so the final step stays centred while the section scrolls
    // away, rather than sliding off mid-step.
    function span() {
      var full = process.offsetHeight - (pin ? pin.offsetHeight : window.innerHeight);
      return Math.max(1, full - window.innerHeight * 0.4);
    }

    function travel() {
      return clamp01(-process.getBoundingClientRect().top / span());
    }

    // Clicking a node scrolls to that step's slice rather than to the element,
    // which in pinned mode no longer has a position of its own.
    points.forEach(function (point, i) {
      var link = point.querySelector("a");
      if (!link) return;
      link.addEventListener("click", function (e) {
        e.preventDefault();
        var slice = span() / steps.length;
        window.scrollTo({
          top: process.offsetTop + slice * i + slice * 0.5,
          behavior: "smooth"
        });
      });
    });

    return function () {
      var p = travel();
      var current = Math.min(steps.length - 1, Math.floor(p * steps.length));

      if (fill) {
        fill.style.transform = (window.innerWidth <= 900 ? "scaleX(" : "scaleY(") + p + ")";
      }

      steps.forEach(function (el, i) {
        if (Math.abs(i - current) <= 1) hydrate(el);
        el.classList.toggle("is-active", i === current);

        // Anchor the panel's growth on its own node in the rail, so it really
        // does project out of that circle rather than from a fixed corner.
        var box = el.getBoundingClientRect();   // untransformed: the scale sits on the child
        var inner = el.firstElementChild;
        var node = points[i] && points[i].querySelector(".process__thumb");
        if (inner && node) {
          var dot = node.getBoundingClientRect();
          inner.style.transformOrigin =
            Math.round(dot.left + dot.width / 2 - box.left) + "px " +
            Math.round(dot.top + dot.height / 2 - box.top) + "px";
        }
      });

      points.forEach(function (el, i) {
        el.classList.toggle("is-current", i === current);
        el.classList.toggle("is-done", i < current);
      });
    };
  }

  /* ── Card deck (technology page) ───────────────────────────────────────
     The page ships a plain grid. Here it becomes a stack shuffled one card
     at a time; "See all" returns the grid, which is also what anyone
     without JavaScript gets.
     -------------------------------------------------------------------- */

  var DECK_VISIBLE = 4;    // cards whose edges are drawn behind the front one
  var DECK_FLICK_MS = 430;
  var DECK_IDLE_MS = 4200; // sit still this long and the deck deals itself

  function initDeck() {
    var section = $("[data-deck-section]");
    if (!section) return;

    var deck = $("[data-deck]", section);
    var cards = deck ? $$(".card", deck) : [];
    if (!deck || cards.length < 2) return;

    var bar = $("[data-deck-bar]", section);
    var hint = $("[data-deck-hint]", section);
    var indexEl = $("[data-deck-index]", section);
    var titleEl = $("[data-deck-title]", section);
    var liveEl = $("[data-deck-live]", section);
    var toggle = $("[data-deck-toggle]", section);
    var nav = $("[data-deck-nav]", section);

    var autoBtn = $("[data-deck-auto]", section);

    var order = cards.map(function (_, i) { return i; });
    var isDeck = true;
    var busy = false;

    // Auto-shuffle state. The deck deals itself while it is left alone, and
    // holds still whenever someone is actually looking at a card: hovering,
    // focused, scrolled away, on another tab, or paused outright.
    var autoOn = !reduced;
    var idleTimer = null;
    var hovering = false;
    var inView = true;

    function autoAllowed() {
      return autoOn && isDeck && inView && !hovering && !reduced && !document.hidden;
    }

    function restartIdle() {
      window.clearTimeout(idleTimer);
      if (autoAllowed()) idleTimer = window.setTimeout(function () { riffle(1); }, DECK_IDLE_MS);
    }

    function depthTransform(depth) {
      // Each card sits lower, smaller and slightly turned, so the stack reads
      // as a fanned hand rather than a single flat rectangle.
      var drop = depth * 15;
      var slide = depth * 6;
      var scale = 1 - depth * 0.045;
      var tilt = (depth % 2 ? 1 : -1) * depth * 1.9;
      return "translate3d(" + slide + "px," + drop + "px,0) scale(" + scale + ") rotate(" + tilt + "deg)";
    }

    function render() {
      // Fetch what is about to be seen: the face-up card and the next few.
      order.slice(0, DECK_VISIBLE + 2).forEach(function (cardIndex) {
        hydrate(cards[cardIndex]);
      });

      order.forEach(function (cardIndex, depth) {
        var el = cards[cardIndex];
        var buried = depth > DECK_VISIBLE;
        el.classList.toggle("is-front", depth === 0);
        el.style.zIndex = String(cards.length - depth);
        el.style.transform = depthTransform(Math.min(depth, DECK_VISIBLE + 1));
        el.style.opacity = buried ? "0" : String(1 - depth * 0.08);
        el.style.pointerEvents = depth === 0 ? "" : "none";
      });

      // Where the hover lift should settle, given the front card's resting pose.
      deck.style.setProperty("--front-hover", "translate3d(0,-10px,0) scale(1.012)");

      var front = order[0];
      var title = cards[front].querySelector(".card__title");
      var label = title ? title.textContent.trim() : "";
      if (indexEl) indexEl.textContent = String(front + 1).padStart(2, "0");
      if (titleEl) titleEl.textContent = label;
      if (liveEl) liveEl.textContent = "Card " + (front + 1) + " of " + cards.length + ": " + label;
    }

    /*
       Every change riffles the whole deck rather than sliding one card off:
       the top cards fan out wide enough to read several faces at once, then
       collapse back into the stack with the next card on top.
    */
    var FAN_OUT_MS = 250;   // how long the spread takes to open
    var FAN_HOLD_MS = 90;   // beat at full spread
    var FAN_IN_MS = 400;    // and to collapse again

    /*
       Fan geometry is derived from the deck's own width: the cards shrink and
       step outwards by a fraction of it, so the spread reaches roughly 62% of
       the deck's half-width either side and never pushes the page sideways,
       whether the deck is 620px on a desktop or 335px on a phone.
    */
    function fanGeometry() {
      var width = deck.getBoundingClientRect().width || 620;
      var count = width < 420 ? 5 : width < 560 ? 7 : 9;
      var scale = width < 420 ? 0.5 : 0.56;
      var mid = (count - 1) / 2;
      var step = mid ? width * (0.58 - scale / 2) / mid : 0;
      return { count: Math.min(count, cards.length), scale: scale, step: step, mid: mid };
    }

    function fanTransform(slot, geo, dir) {
      var off = slot - (geo.count - 1) / 2;
      var flip = dir < 0 ? -1 : 1;
      var x = off * geo.step * flip;
      var y = Math.abs(off) * 10 - 14;
      var rot = off * 8 * flip;
      return "translate3d(" + x + "px," + y + "px,0) rotate(" + rot + "deg) scale(" + (geo.scale - Math.abs(off) * 0.012) + ")";
    }

    function riffle(dir) {
      if (busy || !isDeck) return;
      busy = true;

      function reorder() {
        if (dir < 0) order.unshift(order.pop());
        else order.push(order.shift());
      }

      if (reduced) {          // no spread, just the new card
        reorder();
        render();
        busy = false;
        restartIdle();
        return;
      }

      deck.classList.add("is-shuffling");
      var geo = fanGeometry();
      var spread = order.slice(0, geo.count);
      spread.forEach(function (cardIndex) { hydrate(cards[cardIndex]); });

      // Open the fan, rippling outwards from the top card.
      spread.forEach(function (cardIndex, slot) {
        var el = cards[cardIndex];
        el.style.transition = "transform " + FAN_OUT_MS + "ms cubic-bezier(.3,.85,.35,1), opacity 160ms ease";
        el.style.transitionDelay = (slot * 16) + "ms";
        el.style.transform = fanTransform(slot, geo, dir);
        el.style.opacity = "1";      // every fanned card shows its face
        el.style.zIndex = String(cards.length - slot);
      });

      window.setTimeout(function () {
        reorder();
        // Collapse: render() puts each card back at its new depth.
        spread.forEach(function (cardIndex, slot) {
          var el = cards[cardIndex];
          el.style.transition = "transform " + FAN_IN_MS + "ms var(--ease-expo), opacity 260ms ease";
          el.style.transitionDelay = ((spread.length - slot) * 12) + "ms";
        });
        render();

        window.setTimeout(function () {
          cards.forEach(function (el) {
            el.style.transition = "";
            el.style.transitionDelay = "";
          });
          deck.classList.remove("is-shuffling");
          busy = false;
          restartIdle();
        }, FAN_IN_MS + spread.length * 12 + 40);
      }, FAN_OUT_MS + spread.length * 16 + FAN_HOLD_MS);
    }

    /*
       A manual move is a plain change of card — the full riffle is reserved
       for the automatic tick, so taking control feels immediate rather than
       replaying a flourish on every click.
    */
    var STEP_MS = 260;

    function step(dir) {
      if (busy || !isDeck) return;
      busy = true;

      function settle() {
        window.setTimeout(function () { busy = false; restartIdle(); }, reduced ? 0 : STEP_MS);
      }

      if (reduced || dir < 0) {
        if (dir < 0) order.unshift(order.pop());
        else order.push(order.shift());
        render();
        settle();
        return;
      }

      var leaving = cards[order[0]];
      leaving.classList.add("is-leaving");
      window.setTimeout(function () {
        order.push(order.shift());
        leaving.style.transition = "none";
        leaving.classList.remove("is-leaving");
        render();
        window.setTimeout(function () {
          leaving.style.transition = "";
          busy = false;
          restartIdle();
        }, 30);
      }, STEP_MS);
    }

    function next() { step(1); }
    function prev() { step(-1); }

    function clearDeckStyles() {
      cards.forEach(function (el) {
        el.classList.remove("is-front", "is-leaving");
        el.style.transform = "";
        el.style.opacity = "";
        el.style.zIndex = "";
        el.style.transition = "";
        el.style.transitionDelay = "";
        el.style.pointerEvents = "";
      });
    }

    function setMode(on) {
      isDeck = on;
      deck.classList.toggle("is-deck", on);
      clearDeckStyles();
      if (nav) nav.hidden = !on;
      if (hint) hint.hidden = !on;
      toggle.textContent = on ? "See all " + cards.length : "Back to the deck";
      if (on) {
        deck.setAttribute("tabindex", "0");
        deck.setAttribute("role", "group");
        deck.setAttribute("aria-label", "Deck of " + cards.length + " technology cards");
        // The deck drives opacity itself; take the cards off the reveal path.
        cards.forEach(function (el) {
          el.classList.remove("is-collapsible");
          el.classList.add("is-visible");
        });
        render();
      } else {
        cards.forEach(hydrate);           // the grid shows them all
        deck.removeAttribute("tabindex");
        deck.removeAttribute("role");
        deck.removeAttribute("aria-label");
        // Back in the grid, blurbs go back to opening on hover.
        if (finePointer && !reduced) {
          cards.forEach(function (el) { el.classList.add("is-collapsible"); });
        }
      }
    }

    // Deal the stack in rather than having it appear fully formed.
    function deal() {
      cards.forEach(function (el, i) {
        el.style.transition = "none";
        el.style.opacity = "0";
        el.style.transform = "translate3d(0,-58px,0) scale(.92) rotate(-5deg)";
        el.style.transitionDelay = Math.min(i * 55, 420) + "ms";
      });
      window.setTimeout(function () {
        cards.forEach(function (el) { el.style.transition = ""; });
        render();
        window.setTimeout(function () {
          cards.forEach(function (el) { el.style.transitionDelay = ""; });
        }, 1100);
      }, 60);
    }

    function setAuto(on) {
      autoOn = on;
      if (autoBtn) {
        autoBtn.innerHTML = on ? "&#10073;&#10073; Pause" : "&#9654; Auto";
        autoBtn.setAttribute("aria-pressed", on ? "true" : "false");
      }
      restartIdle();
    }

    // Reading a card should never be interrupted underneath the reader.
    deck.addEventListener("pointerenter", function () { hovering = true; restartIdle(); });
    deck.addEventListener("pointerleave", function () { hovering = false; restartIdle(); });
    deck.addEventListener("focusin", function () { hovering = true; restartIdle(); });
    deck.addEventListener("focusout", function () { hovering = false; restartIdle(); });

    document.addEventListener("visibilitychange", restartIdle);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        restartIdle();
      }, { threshold: 0.35 }).observe(deck);
    }

    if (autoBtn) {
      autoBtn.hidden = reduced;   // never auto-advance under reduced motion
      autoBtn.addEventListener("click", function () { setAuto(!autoOn); });
    }

    // Tap advances; a horizontal drag picks the direction.
    var downX = null, downY = null;
    deck.addEventListener("pointerdown", function (e) { downX = e.clientX; downY = e.clientY; });
    deck.addEventListener("pointerup", function (e) {
      if (downX === null) return;
      var dx = e.clientX - downX;
      var dy = e.clientY - downY;
      downX = downY = null;
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 24) return;   // a scroll, not a swipe
      if (dx < -40) next();
      else if (dx > 40) prev();
      else next();
      restartIdle();
    });

    deck.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " " || e.key === "Spacebar") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    });

    var nextBtn = $("[data-deck-next]", section);
    var prevBtn = $("[data-deck-prev]", section);
    if (nextBtn) nextBtn.addEventListener("click", function () { next(); restartIdle(); });
    if (prevBtn) prevBtn.addEventListener("click", function () { prev(); restartIdle(); });
    toggle.addEventListener("click", function () { setMode(!isDeck); restartIdle(); });

    if (bar) bar.hidden = false;
    setMode(true);
    setAuto(autoOn);
    if (!reduced) deal();
  }

  /* ── Presentation overlay ──────────────────────────────────────────── */

  var SLIDE_MS = 5600;

  // The real mark, so the overlay is not still wearing the placeholder.
  var PRES_MARK = '<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><title>Momentum Link mark</title><defs>  <linearGradient id="pm-g1" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="#EAF2FB"></stop><stop offset="0.6" stop-color="#D3E4F6"></stop><stop offset="1" stop-color="#C1D8F0"></stop></linearGradient>  <linearGradient id="pm-g2" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="#97C3EE"></stop><stop offset="0.6" stop-color="#7FB2E4"></stop><stop offset="1" stop-color="#6DA1D6"></stop></linearGradient>  <linearGradient id="pm-g3" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="#4E96E0"></stop><stop offset="0.6" stop-color="#3B87D6"></stop><stop offset="1" stop-color="#3078C4"></stop></linearGradient>  <radialGradient id="pm-d1" cx="0.32" cy="0.28" r="0.85"><stop offset="0" stop-color="#A8CCF1"></stop><stop offset="1" stop-color="#7FB2E4"></stop></radialGradient>  <radialGradient id="pm-d2" cx="0.32" cy="0.28" r="0.85"><stop offset="0" stop-color="#5C9CE0"></stop><stop offset="1" stop-color="#3B87D6"></stop></radialGradient>  <filter id="pm-sh" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.35"></feDropShadow></filter></defs><g transform="translate(52, 60)" filter="url(#pm-sh)">  <path d="M -34,-24 L -10,0 L -34,24" fill="none" stroke="url(#pm-g1)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"></path>  <path d="M -4,-24 L 20,0 L -4,24" fill="none" stroke="url(#pm-g3)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"></path>  <circle cx="38" cy="0" r="6" fill="url(#pm-d1)"></circle></g></svg>';

  var SLIDES = [
    ["31-technology-complexity-to-clarity", "From complexity to a clear system", "Most operations do not need more software. They need the software they already have to make sense together."],
    ["44-process-demo", "A demo before a specification", "We show what we understood as something working, take your notes on it, and only start building once you agree it is right."],
    ["07-industry-smart-manufacturing", "Manufacturing", "Production monitoring, scheduling, and true product cost answering to one set of numbers."],
    ["09-industry-construction-project-management", "Construction", "Preconstruction through final billing, with the change orders that decide whether a job made money."],
    ["11-industry-wholesale-distribution", "Wholesale distribution", "Ordering, fulfilment, inventory and both sides of the ledger at transaction density."],
    ["13-industry-multi-property-management", "Property", "Leasing, maintenance and owner reporting that reconcile every month without heroics."],
    ["15-industry-premium-retail-website", "Retail and commerce", "Storefronts that stay fast under load, findable in search, and worth returning to."],
    ["19-technology-api-integration", "Integration before replacement", "A governed service coordinating accounting, routing, monitoring and commerce into one dependable truth."],
    ["27-technology-digital-twin", "Test the change before you commit", "Simulation of an operational change, run against real data, before a single process is disturbed."],
    ["34-technology-secure-data-journey", "Secure from capture to report", "Encrypted, auditable movement of every record, with identity-first access at each hop."],
    ["30-technology-connected-ecosystem", "One network, many sites", "Plants, depots, offices and storefronts operating as a single connected system."],
    ["06-practice-long-term-technology-care", "Handed over — or kept moving", "Complete products are handed over in full. The ones that keep moving, we stay with, for as long as the product warrants it."]
  ].map(function (s, i) {
    return {
      stem: s[0],
      title: s[1],
      sub: s[2],
      num: String(i + 1).padStart(2, "0") + " / 12"
    };
  });

  function initPresentation() {
    var triggers = $$("[data-open-pres]");
    if (!triggers.length) return;

    var base = document.documentElement.getAttribute("data-media-base") || "media/";
    var root = null;
    var slideEls = [];
    var tickFills = [];
    var numEl, titleEl, subEl, playBtn, closeBtn;
    var index = 0;
    var previous = -1;
    var playing = true;
    var timer = null;
    var parity = 0;
    var lastFocus = null;

    function media(stem, width, ext) {
      return base + stem + (width === 768 ? "-768" : "") + "." + ext;
    }

    function build() {
      root = document.createElement("div");
      root.className = "pres";
      root.setAttribute("role", "dialog");
      root.setAttribute("aria-modal", "true");
      root.setAttribute("aria-label", "Momentum Link presentation");
      root.hidden = true;

      var html = "";
      SLIDES.forEach(function (s) {
        html +=
          '<div class="pres__slide">' +
            '<picture>' +
              '<source type="image/webp" srcset="' + media(s.stem, 768, "webp") + ' 768w, ' + media(s.stem, 1536, "webp") + ' 1536w" sizes="100vw">' +
              '<img src="' + media(s.stem, 1536, "jpg") + '" alt="' + s.title + '" loading="lazy" decoding="async">' +
            '</picture>' +
          '</div>';
      });

      html +=
        '<div class="pres__brand"><span class="pres__brand-mark">' + PRES_MARK + '</span><span class="pres__brand-name">MOMENTUM LINK</span></div>' +
        '<div class="pres__caption">' +
          '<p class="pres__num" data-pres-num></p>' +
          '<p class="pres__title" data-pres-title></p>' +
          '<p class="pres__sub" data-pres-sub></p>' +
        '</div>' +
        '<div class="pres__controls">' +
          '<button type="button" class="pres__btn" data-pres-play>&#10073;&#10073; Pause</button>' +
          '<button type="button" class="pres__btn pres__btn--close" data-pres-close>Esc &#10005;</button>' +
        '</div>' +
        '<div class="pres__ticks">' +
          SLIDES.map(function (s, i) {
            return '<button type="button" class="pres__tick" data-pres-jump="' + i + '" aria-label="Slide ' + (i + 1) + ': ' + s.title + '"><span><i></i></span></button>';
          }).join("") +
        '</div>' +
        '<button type="button" class="pres__edge pres__edge--prev" data-pres-prev aria-label="Previous slide"></button>' +
        '<button type="button" class="pres__edge pres__edge--next" data-pres-next aria-label="Next slide"></button>';

      root.innerHTML = html;
      document.body.appendChild(root);

      slideEls = $$(".pres__slide", root);
      watchImages(root);
      tickFills = $$(".pres__tick i", root);
      numEl = $("[data-pres-num]", root);
      titleEl = $("[data-pres-title]", root);
      subEl = $("[data-pres-sub]", root);
      playBtn = $("[data-pres-play]", root);
      closeBtn = $("[data-pres-close]", root);

      $("[data-pres-prev]", root).addEventListener("click", function () { step(-1); });
      $("[data-pres-next]", root).addEventListener("click", function () { step(1); });
      closeBtn.addEventListener("click", close);
      playBtn.addEventListener("click", togglePlay);
      $$("[data-pres-jump]", root).forEach(function (btn) {
        btn.addEventListener("click", function () { go(Number(btn.getAttribute("data-pres-jump"))); });
      });

      root.addEventListener("keydown", trapFocus);
    }

    function trapFocus(e) {
      if (e.key !== "Tab") return;
      var focusable = $$("button", root).filter(function (el) { return el.offsetParent !== null; });
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    function paint() {
      var slide = SLIDES[index];
      parity = (parity + 1) % 2;

      slideEls.forEach(function (el, i) {
        el.classList.toggle("is-active", i === index);
        el.classList.toggle("is-prev", i === previous && i !== index);

        var img = el.querySelector("img");
        if (i === index) {
          // Restart the wipe and the slow pan; the parity flip forces a
          // fresh animation even when the same keyframes are reused.
          if (!reduced) {
            el.style.animation = "none";
            void el.offsetWidth;
            el.style.animation = "mlWipe" + (index % 5) + " 1.15s cubic-bezier(.76,0,.24,1) both";
            if (img) {
              img.style.animation = "none";
              void img.offsetWidth;
              img.style.animation = "mlKen" + (parity ? "A" : "B") + " 12s linear forwards";
            }
          }
          if (img && img.getAttribute("loading") === "lazy") img.setAttribute("loading", "eager");
        } else {
          el.style.animation = "none";
          if (img) img.style.animation = "none";
        }
      });

      // Warm the neighbouring slides so a click never waits on a download.
      [index + 1, index - 1].forEach(function (n) {
        var el = slideEls[(n + SLIDES.length) % SLIDES.length];
        var img = el && el.querySelector("img");
        if (img) img.setAttribute("loading", "eager");
      });

      numEl.textContent = slide.num;
      titleEl.textContent = slide.title;
      subEl.textContent = slide.sub;

      if (!reduced) {
        [[numEl, 0], [titleEl, 130], [subEl, 260]].forEach(function (pair) {
          pair[0].style.animation = "none";
          void pair[0].offsetWidth;
          pair[0].style.animation = "mlUp .9s cubic-bezier(.19,1,.22,1) " + pair[1] + "ms both";
        });
      }

      tickFills.forEach(function (fill, i) {
        fill.style.animation = "none";
        void fill.offsetWidth;
        if (i < index) fill.style.transform = "scaleX(1)";
        else if (i > index) fill.style.transform = "scaleX(0)";
        else if (playing && !reduced) {
          fill.style.transform = "scaleX(0)";
          fill.style.animation = "mlTick " + SLIDE_MS + "ms linear forwards";
        } else {
          fill.style.transform = "scaleX(1)";
        }
      });
    }

    function sync() {
      clearInterval(timer);
      if (playing && !root.hidden) timer = setInterval(function () { step(1); }, SLIDE_MS);
    }

    function go(i) {
      if (i === index) return;
      previous = index;
      index = i;
      paint();
      sync();
    }

    function step(d) {
      go((index + d + SLIDES.length) % SLIDES.length);
    }

    function togglePlay() {
      playing = !playing;
      playBtn.innerHTML = playing ? "&#10073;&#10073; Pause" : "&#9654; Play";
      paint();
      sync();
    }

    function open() {
      if (!root) build();
      lastFocus = document.activeElement;
      index = 0;
      previous = -1;
      playing = !reduced;
      playBtn.innerHTML = playing ? "&#10073;&#10073; Pause" : "&#9654; Play";
      root.hidden = false;
      document.body.classList.add("is-locked");
      paint();
      sync();
      closeBtn.focus();
      document.addEventListener("keydown", onKey);
    }

    function close() {
      if (!root || root.hidden) return;
      root.hidden = true;
      playing = false;
      clearInterval(timer);
      document.body.classList.remove("is-locked");
      document.removeEventListener("keydown", onKey);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function onKey(e) {
      if (!root || root.hidden) return;
      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
      else if (e.key === " " || e.key === "Spacebar") { e.preventDefault(); togglePlay(); }
    }

    triggers.forEach(function (btn) {
      btn.hidden = false;
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        open();
      });
    });
  }

  /* ── Get in touch modal ────────────────────────────────────────────────
     Available from every page. Anything marked data-open-contact opens it;
     those are ordinary links to the contact page, so without JavaScript they
     simply navigate there instead.
     -------------------------------------------------------------------- */

  function initContactModal() {
    var modal = $("[data-contact-modal]");
    var triggers = $$("[data-open-contact]");
    if (!modal || !triggers.length) return;

    var lastFocus = null;

    function focusable() {
      return $$("a[href], button, input, textarea, select", modal)
        .filter(function (el) { return !el.disabled && el.offsetParent !== null; });
    }

    function open(e) {
      if (e) e.preventDefault();
      lastFocus = document.activeElement;
      modal.hidden = false;
      document.body.classList.add("is-locked");
      var first = focusable()[0];
      if (first) first.focus();
      document.addEventListener("keydown", onKey);
    }

    function close() {
      if (modal.hidden) return;
      modal.hidden = true;
      document.body.classList.remove("is-locked");
      document.removeEventListener("keydown", onKey);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function onKey(e) {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab") return;
      var items = focusable();
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    triggers.forEach(function (el) { el.addEventListener("click", open); });
    $$("[data-modal-close]", modal).forEach(function (el) { el.addEventListener("click", close); });
  }

  /* ── Contact form ──────────────────────────────────────────────────── */

  function initForms() {
    $$("[data-contact-form]").forEach(initForm);
  }

  function initForm(form) {
    if (!form) return;

    var status = $("[data-form-status]", form);
    var mailto = form.getAttribute("data-mailto") || "";

    function setError(field, message) {
      var input = field.querySelector("input, textarea");
      var slot = field.querySelector(".field__error");
      if (!input || !slot) return;
      input.setAttribute("aria-invalid", message ? "true" : "false");
      slot.textContent = message || "";
    }

    function validate() {
      var ok = true;
      var firstBad = null;

      $$(".field", form).forEach(function (field) {
        var input = field.querySelector("input, textarea");
        if (!input) return;
        var value = input.value.trim();
        var message = "";

        if (input.required && !value) {
          message = "Required.";
        } else if (input.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
          message = "Enter a valid email address.";
        }

        setError(field, message);
        if (message) {
          ok = false;
          if (!firstBad) firstBad = input;
        }
      });

      if (firstBad) firstBad.focus();
      return ok;
    }

    // Clear an error as soon as the visitor starts fixing it.
    $$(".field input, .field textarea", form).forEach(function (input) {
      input.addEventListener("input", function () {
        if (input.getAttribute("aria-invalid") === "true") setError(input.closest(".field"), "");
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.textContent = "";
      status.removeAttribute("data-state");

      if (!validate()) {
        status.setAttribute("data-state", "error");
        status.textContent = "Please correct the highlighted fields.";
        return;
      }

      var data = new FormData(form);
      var button = form.querySelector("button[type=submit]");
      // Read at submit time so the endpoint can be set after load.
      var endpoint = (form.getAttribute("data-endpoint") || "").trim();

      if (endpoint) {
        button.disabled = true;
        status.textContent = "Sending…";
        fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
          .then(function (res) {
            if (!res.ok) throw new Error("Request failed: " + res.status);
            form.reset();
            status.setAttribute("data-state", "ok");
            status.textContent = "Thank you — your brief is with us. We reply within one working day.";
          })
          .catch(function () {
            status.setAttribute("data-state", "error");
            status.textContent = "That did not send. Please email " + mailto + " directly.";
          })
          .finally(function () { button.disabled = false; });
        return;
      }

      // No endpoint configured yet: hand the brief to the visitor's mail client
      // rather than silently dropping it.
      var lines = [];
      data.forEach(function (value, key) {
        if (String(value).trim()) lines.push(key + ": " + value);
      });
      var href = "mailto:" + mailto +
        "?subject=" + encodeURIComponent("New brief from the website") +
        "&body=" + encodeURIComponent(lines.join("\n\n"));

      window.location.href = href;
      status.setAttribute("data-state", "ok");
      status.textContent = "Opening your email client with the brief. If nothing happens, write to " + mailto + ".";
    });
  }

  /* ── Boot ──────────────────────────────────────────────────────────── */

  function boot() {
    watchImages();
    initNav();
    initReveal();
    initCards();
    initPanels();
    initDeck();
    initPresentation();
    initForms();
    initContactModal();

    var year = $("[data-year]");
    if (year) year.textContent = new Date().getFullYear();

    var handlers = [initProgress(), initStage(), initProcess()].filter(Boolean);
    if (!handlers.length) return;

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        handlers.forEach(function (fn) { fn(); });
        ticking = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    handlers.forEach(function (fn) { fn(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
