"use strict";

(() => {
  const SETTINGS = Object.freeze({
    words: [
      "Programador",
      "Desenvolvedor Web",
      "Criador de soluções",
      "Aprendiz constante",
    ],
    typingSpeed: 82,
    deletingSpeed: 42,
    wordPause: 1_350,
    maximumTilt: 7,
    maximumParticles: 48,
    connectionDistance: 120,
    particleFrameInterval: 1_000 / 30,
  });

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
  const select = (selector, context = document) => context.querySelector(selector);
  const selectAll = (selector, context = document) =>
    Array.from(context.querySelectorAll(selector));
  const clamp = (value, minimum, maximum) =>
    Math.min(Math.max(value, minimum), maximum);

  function safeInitialize(name, initializer) {
    try {
      initializer();
    } catch (error) {
      console.error(`[Portfólio] Falha ao iniciar ${name}:`, error);
    }
  }

  function initializePage() {
    requestAnimationFrame(() => document.body.classList.add("page-loaded"));
    const year = select("#currentYear");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  function initializeHeader() {
    const header = select(".site-header");
    if (!header) return;

    let scheduled = false;
    const update = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 22);
      scheduled = false;
    };
    const scheduleUpdate = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(update);
    };

    update();
    addEventListener("scroll", scheduleUpdate, { passive: true });
  }

  function initializeMenu() {
    const toggle = select("#menuToggle");
    const linksContainer = select("#navigationLinks");
    if (!toggle || !linksContainer) return;

    const setOpen = (open) => {
      toggle.classList.toggle("is-active", open);
      linksContainer.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    };

    toggle.addEventListener("click", () => {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    linksContainer.addEventListener("click", (event) => {
      if (event.target instanceof Element && event.target.closest("a")) {
        setOpen(false);
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false);
    });
    const desktopQuery = window.matchMedia("(min-width: 901px)");
    const closeOnDesktop = (event) => {
      if (event.matches) setOpen(false);
    };

    if (desktopQuery.addEventListener) {
      desktopQuery.addEventListener("change", closeOnDesktop);
    } else {
      desktopQuery.addListener(closeOnDesktop);
    }
  }

  function initializeReveal() {
    const elements = selectAll(".reveal");
    if (!elements.length) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -40px" },
    );
    elements.forEach((element) => observer.observe(element));
  }

  function initializeActiveNavigation() {
    if (!("IntersectionObserver" in window)) return;
    const sections = selectAll("main section[id]");
    const links = selectAll(".navigation__link");
    if (!sections.length || !links.length) return;

    const linksById = new Map(links.map((link) => [link.hash.slice(1), link]));
    const observer = new IntersectionObserver(
      (entries) => {
        const activeEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
        if (!activeEntry) return;

        links.forEach((link) => link.classList.remove("is-active"));
        linksById.get(activeEntry.target.id)?.classList.add("is-active");
      },
      { rootMargin: "-32% 0px -55%", threshold: [0.05, 0.2, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));
  }

  function initializeTypewriter() {
    const element = select("#typewriterText");
    if (!element) return;
    if (prefersReducedMotion) {
      element.textContent = SETTINGS.words[0];
      return;
    }

    let wordIndex = 0;
    let characterIndex = 0;
    let deleting = false;
    let timerId = 0;

    const update = () => {
      const word = SETTINGS.words[wordIndex];
      characterIndex += deleting ? -1 : 1;
      element.textContent = word.slice(0, characterIndex);
      let delay = deleting ? SETTINGS.deletingSpeed : SETTINGS.typingSpeed;

      if (!deleting && characterIndex === word.length) {
        deleting = true;
        delay = SETTINGS.wordPause;
      } else if (deleting && characterIndex === 0) {
        deleting = false;
        wordIndex = (wordIndex + 1) % SETTINGS.words.length;
        delay = 330;
      }
      timerId = window.setTimeout(update, delay);
    };

    element.textContent = "";
    timerId = window.setTimeout(update, 700);
    addEventListener("pagehide", () => clearTimeout(timerId), { once: true });
  }

  function initializeCursorGlow() {
    const glow = select("#cursorGlow");
    if (!glow || !hasFinePointer || prefersReducedMotion) return;

    let targetX = -500;
    let targetY = -500;
    let currentX = targetX;
    let currentY = targetY;
    let frameId = 0;

    const render = () => {
      currentX += (targetX - currentX) * 0.16;
      currentY += (targetY - currentY) * 0.16;
      glow.style.transform = `translate3d(${currentX - 140}px,${currentY - 140}px,0)`;
      const remaining = Math.abs(targetX - currentX) + Math.abs(targetY - currentY);
      frameId = remaining > 0.3 ? requestAnimationFrame(render) : 0;
    };

    addEventListener("pointermove", (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      glow.classList.add("is-visible");
      if (!frameId) frameId = requestAnimationFrame(render);
    }, { passive: true });
    document.addEventListener("mouseleave", () => glow.classList.remove("is-visible"));
    addEventListener("pagehide", () => cancelAnimationFrame(frameId), { once: true });
  }

  function initializeTiltCards() {
    if (!hasFinePointer || prefersReducedMotion) return;

    selectAll(".tilt-card").forEach((card) => {
      let frameId = 0;
      const reset = () => {
        cancelAnimationFrame(frameId);
        frameId = 0;
        card.style.transform = "";
      };

      card.addEventListener("pointermove", (event) => {
        if (frameId) return;
        frameId = requestAnimationFrame(() => {
          const bounds = card.getBoundingClientRect();
          const x = (event.clientX - bounds.left) / bounds.width - 0.5;
          const y = (event.clientY - bounds.top) / bounds.height - 0.5;
          const rotateY = x * SETTINGS.maximumTilt * 2;
          const rotateX = -y * SETTINGS.maximumTilt * 2;
          card.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-2px)`;
          frameId = 0;
        });
      }, { passive: true });
      card.addEventListener("pointerleave", reset);
      card.addEventListener("blur", reset, true);
    });
  }

  function initializeMagneticButtons() {
    if (!hasFinePointer || prefersReducedMotion) return;

    selectAll(".magnetic").forEach((button) => {
      let frameId = 0;
      const reset = () => {
        cancelAnimationFrame(frameId);
        frameId = 0;
        button.style.transform = "";
      };

      button.addEventListener("pointermove", (event) => {
        cancelAnimationFrame(frameId);
        frameId = requestAnimationFrame(() => {
          const bounds = button.getBoundingClientRect();
          const offsetX = event.clientX - bounds.left - bounds.width / 2;
          const offsetY = event.clientY - bounds.top - bounds.height / 2;
          const moveX = clamp(offsetX * 0.12, -8, 8);
          const moveY = clamp(offsetY * 0.16, -6, 6);
          button.style.transform = `translate3d(${moveX}px,${moveY}px,0)`;
          frameId = 0;
        });
      }, { passive: true });
      button.addEventListener("pointerleave", reset);
      button.addEventListener("blur", reset);
    });
  }

  async function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.readOnly = true;
    textArea.style.cssText = "position:fixed;opacity:0;pointer-events:none";
    document.body.append(textArea);
    textArea.select();
    const copied = document.execCommand("copy");
    textArea.remove();
    if (!copied) throw new Error("Cópia bloqueada pelo navegador.");
  }

  function initializeCopyButtons() {
    selectAll(".copy-button").forEach((button) => {
      let resetTimerId = 0;
      button.addEventListener("click", async () => {
        const value = button.dataset.copy?.trim();
        const feedback = select(".copy-button__feedback", button);
        if (!value || !feedback) return;
        clearTimeout(resetTimerId);

        try {
          await copyToClipboard(value);
          button.classList.add("is-copied");
          feedback.textContent = "Copiado";
        } catch (error) {
          console.error("[Portfólio] Falha ao copiar:", error);
          feedback.textContent = "Copie manualmente";
        }

        resetTimerId = window.setTimeout(() => {
          button.classList.remove("is-copied");
          feedback.textContent = "";
        }, 2_200);
      });
    });
  }

  class ParticleField {
    constructor(canvas) {
      this.canvas = canvas;
      this.context = canvas.getContext("2d", { alpha: true });
      this.particles = [];
      this.width = 0;
      this.height = 0;
      this.frameId = 0;
      this.resizeTimerId = 0;
      this.previousFrameTime = 0;
      this.visible = !document.hidden;
    }

    start() {
      if (!this.context) throw new Error("Canvas 2D indisponível.");
      this.resize();
      this.createParticles();
      addEventListener("resize", this.scheduleResize, { passive: true });
      document.addEventListener("visibilitychange", this.handleVisibility);
      addEventListener("pagehide", this.stop, { once: true });
      this.frameId = requestAnimationFrame(this.render);
    }

    scheduleResize = () => {
      clearTimeout(this.resizeTimerId);
      this.resizeTimerId = window.setTimeout(() => {
        this.resize();
        this.createParticles();
      }, 180);
    };

    handleVisibility = () => {
      this.visible = !document.hidden;
      if (this.visible && !this.frameId) {
        this.previousFrameTime = 0;
        this.frameId = requestAnimationFrame(this.render);
      }
    };

    resize() {
      this.width = innerWidth;
      this.height = innerHeight;
      const pixelRatio = Math.min(devicePixelRatio || 1, 1.5);
      this.canvas.width = Math.floor(this.width * pixelRatio);
      this.canvas.height = Math.floor(this.height * pixelRatio);
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;
      this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }

    createParticles() {
      const count = clamp(
        Math.floor((this.width * this.height) / 28_000),
        18,
        SETTINGS.maximumParticles,
      );
      this.particles = Array.from({ length: count }, (_, index) => ({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() + 0.4,
        velocityX: (Math.random() - 0.5) * 0.2,
        velocityY: (Math.random() - 0.5) * 0.2,
        color: index % 8 === 0 ? "255,39,71" : "46,145,235",
        opacity: Math.random() * 0.32 + 0.12,
      }));
    }

    move(particle) {
      particle.x += particle.velocityX;
      particle.y += particle.velocityY;
      if (particle.x < -8) particle.x = this.width + 8;
      else if (particle.x > this.width + 8) particle.x = -8;
      if (particle.y < -8) particle.y = this.height + 8;
      else if (particle.y > this.height + 8) particle.y = -8;
    }

    drawParticle(particle) {
      this.context.beginPath();
      this.context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      this.context.fillStyle = `rgba(${particle.color},${particle.opacity})`;
      this.context.fill();
    }

    drawConnections() {
      const limit = SETTINGS.connectionDistance;
      const squaredLimit = limit * limit;
      const { context, particles } = this;

      for (let firstIndex = 0; firstIndex < particles.length; firstIndex += 1) {
        const first = particles[firstIndex];
        for (let secondIndex = firstIndex + 1; secondIndex < particles.length; secondIndex += 1) {
          const second = particles[secondIndex];
          const differenceX = first.x - second.x;
          const differenceY = first.y - second.y;
          const squaredDistance = differenceX ** 2 + differenceY ** 2;
          if (squaredDistance >= squaredLimit) continue;

          const opacity = (1 - Math.sqrt(squaredDistance) / limit) * 0.08;
          context.beginPath();
          context.moveTo(first.x, first.y);
          context.lineTo(second.x, second.y);
          context.strokeStyle = `rgba(35,129,219,${opacity})`;
          context.lineWidth = 0.6;
          context.stroke();
        }
      }
    }

    render = (time) => {
      if (!this.visible) {
        this.frameId = 0;
        return;
      }

      this.frameId = requestAnimationFrame(this.render);
      if (time - this.previousFrameTime < SETTINGS.particleFrameInterval) return;
      this.previousFrameTime = time;
      this.context.clearRect(0, 0, this.width, this.height);
      this.particles.forEach((particle) => {
        this.move(particle);
        this.drawParticle(particle);
      });
      this.drawConnections();
    };

    stop = () => {
      cancelAnimationFrame(this.frameId);
      clearTimeout(this.resizeTimerId);
      removeEventListener("resize", this.scheduleResize);
      document.removeEventListener("visibilitychange", this.handleVisibility);
      this.frameId = 0;
    };
  }

  function initializeParticles() {
    const canvas = select("#particleCanvas");
    const smallOrTouchDevice =
      innerWidth < 720 || window.matchMedia("(pointer: coarse)").matches;
    if (!(canvas instanceof HTMLCanvasElement) || prefersReducedMotion || smallOrTouchDevice) {
      canvas?.remove();
      return;
    }
    new ParticleField(canvas).start();
  }

  function initializeApplication() {
    [
      ["página", initializePage],
      ["cabeçalho", initializeHeader],
      ["menu", initializeMenu],
      ["revelação", initializeReveal],
      ["navegação", initializeActiveNavigation],
      ["texto digitado", initializeTypewriter],
      ["brilho do cursor", initializeCursorGlow],
      ["inclinação", initializeTiltCards],
      ["botões magnéticos", initializeMagneticButtons],
      ["cópia", initializeCopyButtons],
      ["partículas", initializeParticles],
    ].forEach(([name, initializer]) => safeInitialize(name, initializer));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApplication, { once: true });
  } else {
    initializeApplication();
  }
})();
