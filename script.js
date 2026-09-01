"use strict";

/**
 * Portfólio de Anderson Mugambhi
 * Animações sem bibliotecas externas.
 *
 * Recursos:
 * - texto digitado;
 * - partículas no canvas;
 * - revelação ao rolar;
 * - menu responsivo;
 * - indicador da seção ativa;
 * - efeito de inclinação nos cartões;
 * - brilho que acompanha o cursor;
 * - cópia segura dos dados de contato.
 */

(() => {
  const SELECTORS = Object.freeze({
    body: "body",
    header: ".site-header",
    menuToggle: "#menuToggle",
    navigationLinks: "#navigationLinks",
    navigationLink: ".navigation__link",
    section: "main section[id]",
    reveal: ".reveal",
    typewriterText: "#typewriterText",
    particleCanvas: "#particleCanvas",
    cursorGlow: "#cursorGlow",
    tiltCard: ".tilt-card",
    magnetic: ".magnetic",
    copyButton: ".copy-button",
    currentYear: "#currentYear",
  });

  const SETTINGS = Object.freeze({
    typewriterWords: [
      "Programador",
      "Desenvolvedor Web",
      "Criador de soluções",
      "Aprendiz constante",
    ],
    typingSpeed: 82,
    deletingSpeed: 42,
    wordPause: 1350,
    revealThreshold: 0.14,
    headerScrollLimit: 22,
    tiltMaximum: 7,
    particleConnectionDistance: 128,
    maximumParticles: 74,
  });

  const USER_PREFERS_REDUCED_MOTION = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  /**
   * Busca um elemento e retorna null quando ele não existe.
   * @param {string} selector
   * @param {ParentNode} context
   * @returns {Element|null}
   */
  function select(selector, context = document) {
    return context.querySelector(selector);
  }

  /**
   * Busca todos os elementos e converte NodeList para Array.
   * @param {string} selector
   * @param {ParentNode} context
   * @returns {Element[]}
   */
  function selectAll(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
  }

  /**
   * Limita um valor numérico a um intervalo.
   * @param {number} value
   * @param {number} minimum
   * @param {number} maximum
   * @returns {number}
   */
  function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
  }

  /**
   * Executa uma funcionalidade sem permitir que um erro isolado
   * impeça o restante do site de funcionar.
   * @param {string} featureName
   * @param {Function} initializer
   */
  function safelyInitialize(featureName, initializer) {
    try {
      initializer();
    } catch (error) {
      console.error(`[Portfólio] Falha ao iniciar ${featureName}:`, error);
    }
  }

  function initializePageState() {
    const body = select(SELECTORS.body);

    if (!body) {
      return;
    }

    window.requestAnimationFrame(() => {
      body.classList.add("page-loaded");
    });
  }

  function initializeCurrentYear() {
    const yearElement = select(SELECTORS.currentYear);

    if (!yearElement) {
      return;
    }

    yearElement.textContent = String(new Date().getFullYear());
  }

  function initializeHeaderState() {
    const header = select(SELECTORS.header);

    if (!header) {
      return;
    }

    let ticking = false;

    const updateHeader = () => {
      header.classList.toggle(
        "is-scrolled",
        window.scrollY > SETTINGS.headerScrollLimit,
      );
      ticking = false;
    };

    const handleScroll = () => {
      if (ticking) {
        return;
      }

      ticking = true;
      window.requestAnimationFrame(updateHeader);
    };

    updateHeader();
    window.addEventListener("scroll", handleScroll, { passive: true });
  }

  function initializeMobileMenu() {
    const body = select(SELECTORS.body);
    const menuToggle = select(SELECTORS.menuToggle);
    const navigationLinks = select(SELECTORS.navigationLinks);

    if (!body || !menuToggle || !navigationLinks) {
      return;
    }

    const setMenuState = (shouldOpen) => {
      menuToggle.classList.toggle("is-active", shouldOpen);
      navigationLinks.classList.toggle("is-open", shouldOpen);
      body.classList.toggle("menu-open", shouldOpen);
      menuToggle.setAttribute("aria-expanded", String(shouldOpen));
      menuToggle.setAttribute(
        "aria-label",
        shouldOpen ? "Fechar menu" : "Abrir menu",
      );
    };

    menuToggle.addEventListener("click", () => {
      const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      setMenuState(!isOpen);
    });

    navigationLinks.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        setMenuState(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setMenuState(false);
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) {
        setMenuState(false);
      }
    });
  }

  function initializeRevealAnimations() {
    const revealElements = selectAll(SELECTORS.reveal);

    if (revealElements.length === 0) {
      return;
    }

    if (USER_PREFERS_REDUCED_MOTION || !("IntersectionObserver" in window)) {
      revealElements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        });
      },
      {
        threshold: SETTINGS.revealThreshold,
        rootMargin: "0px 0px -40px 0px",
      },
    );

    revealElements.forEach((element) => observer.observe(element));
  }

  function initializeActiveNavigation() {
    const sections = selectAll(SELECTORS.section);
    const links = selectAll(SELECTORS.navigationLink);

    if (sections.length === 0 || links.length === 0) {
      return;
    }

    const linksBySectionId = new Map(
      links.map((link) => {
        const sectionId = link.getAttribute("href")?.replace("#", "");
        return [sectionId, link];
      }),
    );

    const activateLink = (sectionId) => {
      links.forEach((link) => link.classList.remove("is-active"));
      linksBySectionId.get(sectionId)?.classList.add("is-active");
    };

    if (!("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio);

        const mostVisibleSection = visibleEntries[0];

        if (mostVisibleSection?.target.id) {
          activateLink(mostVisibleSection.target.id);
        }
      },
      {
        rootMargin: "-32% 0px -55% 0px",
        threshold: [0.05, 0.2, 0.5],
      },
    );

    sections.forEach((section) => observer.observe(section));
  }

  function initializeTypewriter() {
    const textElement = select(SELECTORS.typewriterText);

    if (!textElement) {
      return;
    }

    if (USER_PREFERS_REDUCED_MOTION) {
      textElement.textContent = SETTINGS.typewriterWords[0];
      return;
    }

    let wordIndex = 0;
    let characterIndex = 0;
    let isDeleting = false;

    const typeNextCharacter = () => {
      const currentWord = SETTINGS.typewriterWords[wordIndex];

      if (isDeleting) {
        characterIndex -= 1;
      } else {
        characterIndex += 1;
      }

      textElement.textContent = currentWord.slice(0, characterIndex);

      let nextDelay = isDeleting
        ? SETTINGS.deletingSpeed
        : SETTINGS.typingSpeed;

      if (!isDeleting && characterIndex === currentWord.length) {
        isDeleting = true;
        nextDelay = SETTINGS.wordPause;
      } else if (isDeleting && characterIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % SETTINGS.typewriterWords.length;
        nextDelay = 330;
      }

      window.setTimeout(typeNextCharacter, nextDelay);
    };

    textElement.textContent = "";
    window.setTimeout(typeNextCharacter, 700);
  }

  function initializeCursorGlow() {
    const glow = select(SELECTORS.cursorGlow);
    const supportsFinePointer = window.matchMedia("(pointer: fine)").matches;

    if (!glow || !supportsFinePointer || USER_PREFERS_REDUCED_MOTION) {
      return;
    }

    let pointerX = -500;
    let pointerY = -500;
    let currentX = pointerX;
    let currentY = pointerY;
    let animationFrameId = 0;

    const renderGlow = () => {
      currentX += (pointerX - currentX) * 0.13;
      currentY += (pointerY - currentY) * 0.13;
      glow.style.transform = `translate3d(${currentX - 140}px, ${currentY - 140}px, 0)`;
      animationFrameId = window.requestAnimationFrame(renderGlow);
    };

    window.addEventListener(
      "pointermove",
      (event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;
        glow.classList.add("is-visible");
      },
      { passive: true },
    );

    document.addEventListener("mouseleave", () => {
      glow.classList.remove("is-visible");
    });

    animationFrameId = window.requestAnimationFrame(renderGlow);

    window.addEventListener("pagehide", () => {
      window.cancelAnimationFrame(animationFrameId);
    });
  }

  function initializeTiltCards() {
    const cards = selectAll(SELECTORS.tiltCard);
    const supportsFinePointer = window.matchMedia("(pointer: fine)").matches;

    if (
      cards.length === 0 ||
      !supportsFinePointer ||
      USER_PREFERS_REDUCED_MOTION
    ) {
      return;
    }

    cards.forEach((card) => {
      let frameId = 0;

      const resetCard = () => {
        window.cancelAnimationFrame(frameId);
        card.style.transform = "rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0)";
      };

      const updateCard = (event) => {
        const bounds = card.getBoundingClientRect();
        const relativeX = (event.clientX - bounds.left) / bounds.width;
        const relativeY = (event.clientY - bounds.top) / bounds.height;
        const rotateY = (relativeX - 0.5) * SETTINGS.tiltMaximum * 2;
        const rotateX = (0.5 - relativeY) * SETTINGS.tiltMaximum * 2;

        window.cancelAnimationFrame(frameId);
        frameId = window.requestAnimationFrame(() => {
          card.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translate3d(0, -2px, 0)`;
        });
      };

      card.addEventListener("pointermove", updateCard, { passive: true });
      card.addEventListener("pointerleave", resetCard);
      card.addEventListener("blur", resetCard, true);
    });
  }

  function initializeMagneticButtons() {
    const buttons = selectAll(SELECTORS.magnetic);
    const supportsFinePointer = window.matchMedia("(pointer: fine)").matches;

    if (
      buttons.length === 0 ||
      !supportsFinePointer ||
      USER_PREFERS_REDUCED_MOTION
    ) {
      return;
    }

    buttons.forEach((button) => {
      const resetPosition = () => {
        button.style.transform = "translate3d(0, 0, 0)";
      };

      button.addEventListener(
        "pointermove",
        (event) => {
          const bounds = button.getBoundingClientRect();
          const offsetX = event.clientX - bounds.left - bounds.width / 2;
          const offsetY = event.clientY - bounds.top - bounds.height / 2;
          const movementX = clamp(offsetX * 0.12, -8, 8);
          const movementY = clamp(offsetY * 0.16, -6, 6);

          button.style.transform = `translate3d(${movementX}px, ${movementY}px, 0)`;
        },
        { passive: true },
      );

      button.addEventListener("pointerleave", resetPosition);
      button.addEventListener("blur", resetPosition);
    });
  }

  async function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const temporaryTextArea = document.createElement("textarea");
    temporaryTextArea.value = text;
    temporaryTextArea.setAttribute("readonly", "");
    temporaryTextArea.style.position = "fixed";
    temporaryTextArea.style.opacity = "0";
    temporaryTextArea.style.pointerEvents = "none";

    document.body.appendChild(temporaryTextArea);
    temporaryTextArea.select();

    const copied = document.execCommand("copy");
    temporaryTextArea.remove();

    if (!copied) {
      throw new Error("O navegador bloqueou o comando de cópia.");
    }
  }

  function initializeCopyButtons() {
    const buttons = selectAll(SELECTORS.copyButton);

    buttons.forEach((button) => {
      button.addEventListener("click", async () => {
        const valueToCopy = button.dataset.copy?.trim();
        const feedback = select(".copy-button__feedback", button);

        if (!valueToCopy || !feedback) {
          return;
        }

        try {
          await copyTextToClipboard(valueToCopy);
          button.classList.add("is-copied");
          feedback.textContent = "Copiado";
        } catch (error) {
          console.error("[Portfólio] Não foi possível copiar:", error);
          feedback.textContent = "Selecione e copie manualmente";
        }

        window.setTimeout(() => {
          button.classList.remove("is-copied");
          feedback.textContent = "";
        }, 2200);
      });
    });
  }

  class ParticleField {
    /**
     * @param {HTMLCanvasElement} canvas
     */
    constructor(canvas) {
      this.canvas = canvas;
      this.context = canvas.getContext("2d", { alpha: true });
      this.particles = [];
      this.animationFrameId = 0;
      this.width = 0;
      this.height = 0;
      this.pixelRatio = 1;
      this.resizeTimer = 0;
      this.isPageVisible = true;
    }

    start() {
      if (!this.context) {
        throw new Error("Canvas 2D não é suportado neste navegador.");
      }

      this.resize();
      this.createParticles();
      this.bindEvents();
      this.render();
    }

    bindEvents() {
      window.addEventListener(
        "resize",
        () => {
          window.clearTimeout(this.resizeTimer);
          this.resizeTimer = window.setTimeout(() => {
            this.resize();
            this.createParticles();
          }, 140);
        },
        { passive: true },
      );

      document.addEventListener("visibilitychange", () => {
        this.isPageVisible = !document.hidden;

        if (this.isPageVisible && !this.animationFrameId) {
          this.render();
        }
      });

      window.addEventListener("pagehide", () => this.stop());
    }

    resize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      this.canvas.width = Math.floor(this.width * this.pixelRatio);
      this.canvas.height = Math.floor(this.height * this.pixelRatio);
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;

      this.context.setTransform(
        this.pixelRatio,
        0,
        0,
        this.pixelRatio,
        0,
        0,
      );
    }

    createParticles() {
      const approximateCount = Math.floor((this.width * this.height) / 19000);
      const particleCount = clamp(
        approximateCount,
        24,
        SETTINGS.maximumParticles,
      );

      this.particles = Array.from({ length: particleCount }, (_, index) => {
        const isRed = index % 7 === 0;

        return {
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          radius: Math.random() * 1.4 + 0.35,
          velocityX: (Math.random() - 0.5) * 0.23,
          velocityY: (Math.random() - 0.5) * 0.23,
          color: isRed ? "255, 39, 71" : "46, 145, 235",
          opacity: Math.random() * 0.42 + 0.15,
        };
      });
    }

    moveParticle(particle) {
      particle.x += particle.velocityX;
      particle.y += particle.velocityY;

      if (particle.x < -10) {
        particle.x = this.width + 10;
      } else if (particle.x > this.width + 10) {
        particle.x = -10;
      }

      if (particle.y < -10) {
        particle.y = this.height + 10;
      } else if (particle.y > this.height + 10) {
        particle.y = -10;
      }
    }

    drawParticle(particle) {
      this.context.beginPath();
      this.context.arc(
        particle.x,
        particle.y,
        particle.radius,
        0,
        Math.PI * 2,
      );
      this.context.fillStyle = `rgba(${particle.color}, ${particle.opacity})`;
      this.context.shadowColor = `rgba(${particle.color}, 0.5)`;
      this.context.shadowBlur = 8;
      this.context.fill();
      this.context.shadowBlur = 0;
    }

    drawConnections() {
      const maximumDistance = SETTINGS.particleConnectionDistance;

      for (let firstIndex = 0; firstIndex < this.particles.length; firstIndex += 1) {
        const firstParticle = this.particles[firstIndex];

        for (
          let secondIndex = firstIndex + 1;
          secondIndex < this.particles.length;
          secondIndex += 1
        ) {
          const secondParticle = this.particles[secondIndex];
          const differenceX = firstParticle.x - secondParticle.x;
          const differenceY = firstParticle.y - secondParticle.y;
          const distanceSquared =
            differenceX * differenceX + differenceY * differenceY;

          if (distanceSquared > maximumDistance * maximumDistance) {
            continue;
          }

          const distance = Math.sqrt(distanceSquared);
          const opacity = (1 - distance / maximumDistance) * 0.11;

          this.context.beginPath();
          this.context.moveTo(firstParticle.x, firstParticle.y);
          this.context.lineTo(secondParticle.x, secondParticle.y);
          this.context.strokeStyle = `rgba(35, 129, 219, ${opacity})`;
          this.context.lineWidth = 0.7;
          this.context.stroke();
        }
      }
    }

    render = () => {
      if (!this.isPageVisible) {
        this.animationFrameId = 0;
        return;
      }

      this.context.clearRect(0, 0, this.width, this.height);

      this.particles.forEach((particle) => {
        this.moveParticle(particle);
        this.drawParticle(particle);
      });

      this.drawConnections();
      this.animationFrameId = window.requestAnimationFrame(this.render);
    };

    stop() {
      window.cancelAnimationFrame(this.animationFrameId);
      window.clearTimeout(this.resizeTimer);
      this.animationFrameId = 0;
    }
  }

  function initializeParticleField() {
    const canvas = select(SELECTORS.particleCanvas);

    if (
      !(canvas instanceof HTMLCanvasElement) ||
      USER_PREFERS_REDUCED_MOTION
    ) {
      return;
    }

    const particleField = new ParticleField(canvas);
    particleField.start();
  }

  function initializeApplication() {
    const features = [
      ["estado inicial", initializePageState],
      ["ano atual", initializeCurrentYear],
      ["cabeçalho", initializeHeaderState],
      ["menu móvel", initializeMobileMenu],
      ["revelação de conteúdo", initializeRevealAnimations],
      ["navegação ativa", initializeActiveNavigation],
      ["texto digitado", initializeTypewriter],
      ["brilho do cursor", initializeCursorGlow],
      ["inclinação dos cartões", initializeTiltCards],
      ["botões magnéticos", initializeMagneticButtons],
      ["cópia de contato", initializeCopyButtons],
      ["partículas", initializeParticleField],
    ];

    features.forEach(([featureName, initializer]) => {
      safelyInitialize(featureName, initializer);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApplication, {
      once: true,
    });
  } else {
    initializeApplication();
  }
})();
