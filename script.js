document.documentElement.classList.add('js');

/* ---- Copiar email para clipboard ---- */
    function copiarEmail(e) {
      e.preventDefault();

      const email = 'kalebyalx@gmail.com';
      const button = e.currentTarget;

      const showCopyFeedback = () => {
        const toastEmail = document.getElementById('toast-email');

        if (button) {
          button.textContent = 'copiado';
          button.classList.add('copied');
          button.disabled = true;
        }

        if (toastEmail) {
          toastEmail.classList.add('show');
          setTimeout(() => toastEmail.classList.remove('show'), 3000);
        }

        setTimeout(() => {
          if (!button) return;
          button.textContent = 'copiar';
          button.classList.remove('copied');
          button.disabled = false;
        }, 1800);
      };

      const fallbackCopy = () => {
        const textarea = document.createElement('textarea');
        textarea.value = email;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      };

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(email).then(showCopyFeedback).catch(() => {
          fallbackCopy();
          showCopyFeedback();
        });
        return;
      }

      fallbackCopy();
      showCopyFeedback();
    }

    /* ---- Cursor personalizado (desktop only) ---- */
    const cursor     = document.getElementById('cursor');
    const cursorRing = document.getElementById('cursor-ring');
    const isMobile   = window.matchMedia('(pointer: coarse)').matches;

    if (!isMobile && cursor && cursorRing) {
      let mx = 0, my = 0, rx = 0, ry = 0;
      document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
      function animateCursor() {
        rx += (mx - rx) * 0.15;
        ry += (my - ry) * 0.15;
        cursor.style.left     = mx + 'px';
        cursor.style.top      = my + 'px';
        cursorRing.style.left = rx + 'px';
        cursorRing.style.top  = ry + 'px';
        requestAnimationFrame(animateCursor);
      }
      animateCursor();
    }

    /* ---- Navbar scroll ---- */
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 60);
    });

    /* ---- Menu mobile ---- */
    const hamburger  = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');

    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
      const isOpen = mobileMenu.classList.contains('open');
      hamburger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    function closeMobile() {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) closeMobile();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 900 && mobileMenu.classList.contains('open')) closeMobile();
    });

    /* ---- Rolagem suave para links internos ---- */
    let scrollAnimationFrame = null;
    let scrollNavigationToken = 0;
    let isAnchorNavigating = false;

    function setAnchorNavigationMode(active) {
      if (isAnchorNavigating === active) return;
      isAnchorNavigating = active;
      window.dispatchEvent(new CustomEvent('projects:navigation-mode', {
        detail: { active }
      }));
    }

    function getProjectsScrollRange() {
      const section = document.getElementById('projetos');
      const stage = section?.querySelector('.projetos-scroll-stage');
      if (!section || !stage || !section.classList.contains('projects-scroll-ready')) return null;

      const style = getComputedStyle(stage);
      const stickyTop = parseFloat(style.getPropertyValue('--projects-sticky-top')) || 0;
      const distance = parseFloat(style.getPropertyValue('--projects-scroll-distance')) || 0;
      if (distance <= 0) return null;

      const start = stage.getBoundingClientRect().top + window.scrollY - stickyTop;
      const end = start + distance;
      return { start, end };
    }

    const easeInOutCubic = progress => progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    function animateScrollTo(targetY, token, onComplete, options = {}) {
      const startY = window.scrollY;
      const distance = targetY - startY;

      if (Math.abs(distance) < 2) {
        window.scrollTo(0, targetY);
        onComplete?.();
        return;
      }

      const duration = Math.min(
        options.maxDuration || 1200,
        Math.max(options.minDuration || 650, Math.abs(distance) * (options.speedFactor || 0.42))
      );
      const startTime = performance.now();

      const step = now => {
        if (token !== scrollNavigationToken) return;

        const progress = Math.min((now - startTime) / duration, 1);
        window.scrollTo(0, startY + distance * easeInOutCubic(progress));

        if (progress < 1) {
          scrollAnimationFrame = requestAnimationFrame(step);
          return;
        }

        onComplete();
      };

      scrollAnimationFrame = requestAnimationFrame(step);
    }

    function smoothScrollTo(target, updateHistory = true) {
      if (!target) return;

      if (scrollAnimationFrame) cancelAnimationFrame(scrollAnimationFrame);
      scrollNavigationToken += 1;
      const token = scrollNavigationToken;

      const startY = window.scrollY;
      const navHeight = navbar ? navbar.getBoundingClientRect().height : 0;
      const targetY = target.id === 'hero'
        ? 0
        : Math.max(0, target.getBoundingClientRect().top + startY - navHeight - 16);

      if (Math.abs(targetY - startY) < 2) {
        window.scrollTo(0, targetY);
        if (updateHistory) history.pushState(null, '', `#${target.id}`);
        return;
      }

      setAnchorNavigationMode(true);
      window.dispatchEvent(new CustomEvent('projects:navigation-progress', {
        detail: { progress: 0 }
      }));

      const completeNavigation = () => {
        scrollAnimationFrame = null;
        const range = getProjectsScrollRange();
        if (range && window.scrollY > range.end) {
          window.dispatchEvent(new CustomEvent('projects:navigation-progress', {
            detail: { progress: 1 }
          }));
        }
        setAnchorNavigationMode(false);
        if (updateHistory) history.pushState(null, '', `#${target.id}`);
      };

      animateScrollTo(targetY, token, completeNavigation);
    }

    document.addEventListener('click', e => {
      const link = e.target.closest('a[href^="#"]');
      if (!link || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

      const targetId = link.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);
      if (!target) return;

      e.preventDefault();
      if (mobileMenu.classList.contains('open')) closeMobile();
      smoothScrollTo(target);
    });

    ['wheel', 'touchstart'].forEach(eventName => {
      window.addEventListener(eventName, () => {
        if (!scrollAnimationFrame) return;
        cancelAnimationFrame(scrollAnimationFrame);
        scrollAnimationFrame = null;
        scrollNavigationToken += 1;
        setAnchorNavigationMode(false);
      }, { passive: true });
    });

    /* ---- Scroll reveal ---- */
    const reveals = document.querySelectorAll('.reveal');
    const responsiveMotionQuery = window.matchMedia('(max-width: 900px)');
    const revealGroups = new Map();
    reveals.forEach(el => {
      const section = el.closest('section');
      const key = section?.id || 'global';
      if (!revealGroups.has(key)) revealGroups.set(key, []);
      revealGroups.get(key).push(el);
    });

    function getRevealDelay(el) {
      const section = el.closest('section');
      const sectionId = section?.id || 'global';

      if (el.classList.contains('skill-card')) {
        const skillCards = Array.from(document.querySelectorAll('#habilidades .skill-card.reveal'));
        const index = Math.max(0, skillCards.indexOf(el));
        return responsiveMotionQuery.matches
          ? `${0.04 + index * 0.09}s`
          : `${0.08 + index * 0.16}s`;
      }

      if (el.classList.contains('progress-section')) return responsiveMotionQuery.matches ? '0.08s' : '0.18s';
      if (sectionId === 'contato' && el.classList.contains('contato-form')) {
        return responsiveMotionQuery.matches ? '0.28s' : '0.45s';
      }

      const group = revealGroups.get(sectionId) || [];
      const index = Math.max(0, group.indexOf(el));
      const baseDelay = {
        sobre: responsiveMotionQuery.matches ? 0.12 : 0.24,
        projetos: responsiveMotionQuery.matches ? 0.13 : 0.26,
        habilidades: responsiveMotionQuery.matches ? 0.11 : 0.22,
        contato: responsiveMotionQuery.matches ? 0.12 : 0.2
      }[sectionId] || 0.18;

      return `${Math.min(index * baseDelay, responsiveMotionQuery.matches ? 0.45 : 0.9)}s`;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.setProperty('--reveal-delay', getRevealDelay(e.target));
          e.target.classList.add('visible');
          return;
        }

        e.target.style.setProperty('--reveal-delay', '0s');
        e.target.classList.remove('visible');
      });
    }, responsiveMotionQuery.matches
      ? { threshold: 0.1, rootMargin: '0px 0px -6% 0px' }
      : { threshold: 0.24, rootMargin: '0px 0px -18% 0px' });
    reveals.forEach(el => observer.observe(el));

    /* ---- Entrada sequencial da seção de contato ---- */
    function initContactAnimations() {
      const contato = document.getElementById('contato');
      if (!contato) return;

      const contactCards = Array.from(contato.querySelectorAll('.contact-motion-left'));
      const contactForm = contato.querySelector('.contact-motion-form');
      const animatedItems = [...contactCards, contactForm].filter(Boolean);
      if (animatedItems.length === 0) return;

      let contactTimers = [];
      const clearContactTimers = () => {
        contactTimers.forEach(timer => clearTimeout(timer));
        contactTimers = [];
      };

      const queueContactAnimation = (callback, delay) => {
        const timer = setTimeout(callback, delay);
        contactTimers.push(timer);
      };

      const playContactIntro = () => {
        clearContactTimers();
        const cardDelay = responsiveMotionQuery.matches ? 180 : 300;
        const formDelay = responsiveMotionQuery.matches ? 240 : 320;

        contactCards.forEach((card, index) => {
          queueContactAnimation(() => card.classList.add('is-visible'), index * cardDelay);
        });

        if (contactForm) {
          queueContactAnimation(() => contactForm.classList.add('is-visible'), formDelay);
        }
      };

      const resetContactIntro = () => {
        clearContactTimers();
        const resetDelay = responsiveMotionQuery.matches ? 80 : 120;
        const formResetDelay = responsiveMotionQuery.matches ? 110 : 160;

        [...contactCards].reverse().forEach((card, index) => {
          queueContactAnimation(() => card.classList.remove('is-visible'), index * resetDelay);
        });

        if (contactForm) {
          queueContactAnimation(() => contactForm.classList.remove('is-visible'), formResetDelay);
        }
      };

      if (!('IntersectionObserver' in window)) {
        playContactIntro();
        return;
      }

      const contactObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            playContactIntro();
          } else {
            resetContactIntro();
          }
        });
      }, { threshold: 0.14, rootMargin: '0px 0px -14% 0px' });

      contactObserver.observe(contato);
    }

    initContactAnimations();

    /* ---- Projetos: scroll horizontal, drag e destaque central ---- */
    function initProjectsScroll() {
      const section = document.getElementById('projetos');
      const stage = section?.querySelector('.projetos-scroll-stage');
      const viewport = section?.querySelector('.projetos-viewport');
      const track = section?.querySelector('.projetos-grid');
      const cards = Array.from(section?.querySelectorAll('.projeto-card') || []);
      if (!section || !stage || !viewport || !track || cards.length === 0) return;

      const desktopQuery = window.matchMedia('(min-width: 901px)');
      const compactMobileQuery = window.matchMedia('(max-width: 600px)');
      const zigzag = [-22, 24, -18, 20];
      let maxShift = 0;
      let scrollDistance = 0;
      let stageStart = 0;
      let targetProgress = 0;
      let currentProgress = 0;
      let currentX = 0;
      let rafId = null;
      let isDragging = false;
      let dragStarted = false;
      let dragStartX = 0;
      let dragStartProgress = 0;
      let suppressClick = false;
      let viewportWidth = 0;
      let focusRangeDesktop = 0;
      let focusRangeMobile = 0;
      let focusedIndex = -1;
      let cardMetrics = [];
      let navigationBypass = false;

      const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

      function setCompactMobileCards() {
        cards.forEach((card, index) => {
          card.style.setProperty('--project-y', `${zigzag[index % zigzag.length] * 0.35}px`);
          card.style.setProperty('--project-scale', '1');
          card.style.setProperty('--project-opacity', '1');
          card.style.setProperty('--project-glow', '0');
          card.style.setProperty('--project-z', '1');
          card.classList.remove('is-focused');
        });
        focusedIndex = -1;
      }

      function measure() {
        const wasReady = section.classList.contains('projects-scroll-ready');
        section.classList.remove('projects-scroll-ready');
        currentX = 0;
        track.style.transform = 'translate3d(0px, 0, 0)';

        maxShift = Math.max(0, track.scrollWidth - viewport.clientWidth);
        scrollDistance = Math.max(maxShift * 1.35, window.innerHeight * 1.02);
        const navHeight = navbar ? navbar.getBoundingClientRect().height : 0;
        const stickyTop = Math.max(72, Math.round(navHeight + 18));
        viewportWidth = viewport.clientWidth;
        focusRangeDesktop = Math.max(340, viewportWidth * 0.46);
        focusRangeMobile = Math.max(230, viewportWidth * 0.66);

        const trackRect = track.getBoundingClientRect();
        cardMetrics = cards.map(card => {
          const rect = card.getBoundingClientRect();
          return {
            center: rect.left - trackRect.left + rect.width / 2,
            width: rect.width
          };
        });

        stage.style.setProperty('--projects-sticky-top', `${stickyTop}px`);
        stage.style.setProperty('--projects-scroll-distance', `${scrollDistance}px`);
        stageStart = stage.getBoundingClientRect().top + window.scrollY - stickyTop;
        section.classList.toggle('projects-scroll-ready', desktopQuery.matches && maxShift > 12);

        if (!desktopQuery.matches || maxShift <= 12) {
          targetProgress = 0;
          currentProgress = 0;
          currentX = 0;
          track.style.transform = 'translate3d(0px, 0, 0)';
          if (wasReady) viewport.scrollTo({ left: 0, behavior: 'auto' });
          if (compactMobileQuery.matches) {
            setCompactMobileCards();
            return;
          }
          updateCardFocus();
          return;
        }

        viewport.scrollTo({ left: 0, behavior: 'auto' });
        updateTargetFromScroll(true);
        currentProgress = targetProgress;
        render();
      }

      function updateCardFocus() {
        if (compactMobileQuery.matches) {
          setCompactMobileCards();
          return;
        }

        const contentX = desktopQuery.matches ? -currentX : viewport.scrollLeft;
        const viewportCenter = contentX + viewportWidth / 2;
        const focusRange = desktopQuery.matches ? focusRangeDesktop : focusRangeMobile;
        let nextFocusedIndex = 0;
        let focusedAmount = -1;

        cards.forEach((card, index) => {
          const metric = cardMetrics[index];
          if (!metric) return;

          const cardCenter = metric.center;
          const distance = Math.abs(viewportCenter - cardCenter);
          const focus = clamp(1 - distance / focusRange, 0, 1);
          const easedFocus = focus * focus * (3 - 2 * focus);
          const baseY = zigzag[index % zigzag.length];
          const y = baseY * (1 - easedFocus);
          const scale = desktopQuery.matches
            ? 0.9 + easedFocus * 0.17
            : 0.94 + easedFocus * 0.08;
          const opacity = 0.62 + easedFocus * 0.38;
          const glow = easedFocus;

          card.style.setProperty('--project-y', `${y.toFixed(2)}px`);
          card.style.setProperty('--project-scale', scale.toFixed(3));
          card.style.setProperty('--project-opacity', opacity.toFixed(3));
          card.style.setProperty('--project-glow', glow.toFixed(3));
          card.style.setProperty('--project-z', `${Math.round(1 + easedFocus * 20)}`);

          if (focus > focusedAmount) {
            focusedAmount = focus;
            nextFocusedIndex = index;
          }
        });

        if (nextFocusedIndex !== focusedIndex) {
          focusedIndex = nextFocusedIndex;
          cards.forEach((card, index) => card.classList.toggle('is-focused', index === focusedIndex));
        }
      }

      function render() {
        currentX = -maxShift * currentProgress;
        track.style.transform = `translate3d(${currentX.toFixed(2)}px, 0, 0)`;
        updateCardFocus();
      }

      function animate() {
        rafId = null;

        if (!desktopQuery.matches || maxShift <= 12) {
          updateCardFocus();
          return;
        }

        const diff = targetProgress - currentProgress;
        if (Math.abs(diff) < 0.00045) {
          currentProgress = targetProgress;
          render();
          return;
        }

        currentProgress += diff * 0.105;
        render();
        requestRender();
      }

      function requestRender() {
        if (rafId) return;
        rafId = requestAnimationFrame(animate);
      }

      function updateTargetFromScroll(immediate = false) {
        if (!desktopQuery.matches || maxShift <= 12 || isDragging || navigationBypass) return;

        targetProgress = clamp((window.scrollY - stageStart) / scrollDistance, 0, 1);
        if (immediate) currentProgress = targetProgress;
        requestRender();
      }

      window.addEventListener('projects:navigation-mode', event => {
        navigationBypass = Boolean(event.detail?.active);
        section.classList.toggle('projects-navigation-bypass', navigationBypass);

        if (navigationBypass) {
          if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
          return;
        }

        updateTargetFromScroll(true);
      });

      window.addEventListener('projects:navigation-progress', event => {
        if (!desktopQuery.matches || maxShift <= 12) return;

        targetProgress = clamp(Number(event.detail?.progress) || 0, 0, 1);
        currentProgress = targetProgress;
        render();
      });

      function syncVerticalToProgress() {
        if (!desktopQuery.matches || maxShift <= 12) return;

        const stageEnd = stageStart + scrollDistance;
        if (window.scrollY < stageStart || window.scrollY > stageEnd) return;

        window.scrollTo({ top: stageStart + targetProgress * scrollDistance, behavior: 'auto' });
      }

      viewport.addEventListener('pointerdown', event => {
        if (!desktopQuery.matches || maxShift <= 12 || event.pointerType !== 'mouse' || event.button !== 0) return;
        if (event.target.closest('a, button, input, textarea, select, label')) return;

        isDragging = true;
        dragStarted = false;
        dragStartX = event.clientX;
        dragStartProgress = targetProgress;
        viewport.setPointerCapture(event.pointerId);
      });

      viewport.addEventListener('pointermove', event => {
        if (!isDragging) return;

        const deltaX = event.clientX - dragStartX;
        if (Math.abs(deltaX) > 4) {
          dragStarted = true;
          suppressClick = true;
          viewport.classList.add('is-dragging');
        }

        if (!dragStarted) return;

        event.preventDefault();
        targetProgress = clamp(dragStartProgress - (deltaX / maxShift), 0, 1);
        requestRender();
      });

      function endDrag(event) {
        if (!isDragging) return;

        isDragging = false;
        viewport.classList.remove('is-dragging');
        if (viewport.hasPointerCapture(event.pointerId)) {
          viewport.releasePointerCapture(event.pointerId);
        }
        syncVerticalToProgress();

        if (suppressClick) {
          setTimeout(() => { suppressClick = false; }, 120);
        }
      }

      viewport.addEventListener('pointerup', endDrag);
      viewport.addEventListener('pointercancel', endDrag);
      viewport.addEventListener('lostpointercapture', () => {
        isDragging = false;
        viewport.classList.remove('is-dragging');
      });

      viewport.addEventListener('click', event => {
        if (!suppressClick) return;
        event.preventDefault();
        event.stopPropagation();
      }, true);

      viewport.addEventListener('scroll', () => {
        if (desktopQuery.matches) return;
        if (compactMobileQuery.matches) return;
        requestRender();
      }, { passive: true });
      window.addEventListener('scroll', () => updateTargetFromScroll(), { passive: true });
      window.addEventListener('resize', measure);
      compactMobileQuery.addEventListener?.('change', measure);

      if (document.fonts?.ready) document.fonts.ready.then(measure);
      measure();
    }

    initProjectsScroll();

    /* ---- Progress bars ---- */
    const progressSection = document.querySelector('.progress-section');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const progressItems = Array.from(document.querySelectorAll('.progress-item')).map(item => {
      const bar = item.querySelector('.progress-fill');
      const pct = item.querySelector('.progress-pct');
      const target = Number(bar?.getAttribute('data-width') || pct?.textContent.replace(/\D/g, '') || 0);
      return { bar, pct, target, frame: null, timer: null, value: 0 };
    });

    const easeOutQuart = progress => 1 - Math.pow(1 - progress, 4);

    const setProgressNumber = (item, value) => {
      if (!item.pct) return;
      item.pct.textContent = `${Math.round(value)}%`;
    };

    progressItems.forEach(item => {
      if (item.bar) item.bar.style.transform = 'scaleX(0)';
      setProgressNumber(item, 0);
    });

    const animateProgressNumber = (item, target) => {
      if (item.frame) cancelAnimationFrame(item.frame);

      const startValue = item.value;
      const distance = target - startValue;
      const duration = prefersReducedMotion ? 1150 : 2250;
      const startTime = performance.now();

      const step = now => {
        const progress = Math.min((now - startTime) / duration, 1);
        item.value = startValue + distance * easeOutQuart(progress);
        setProgressNumber(item, item.value);

        if (progress < 1) {
          item.frame = requestAnimationFrame(step);
          return;
        }

        item.value = target;
        item.frame = null;
        setProgressNumber(item, target);
      };

      item.frame = requestAnimationFrame(step);
    };

    const resetProgressItem = (item) => {
      if (item.frame) cancelAnimationFrame(item.frame);
      item.frame = null;
      item.value = 0;

      if (item.bar) {
        const previousTransition = item.bar.style.transition;
        item.bar.style.transition = 'none';
        item.bar.style.transform = 'scaleX(0)';
        void item.bar.offsetWidth;

        if (previousTransition) {
          item.bar.style.transition = previousTransition;
        } else {
          item.bar.style.removeProperty('transition');
        }
      }

      setProgressNumber(item, 0);
    };

    const setProgressBars = (active) => {
      progressItems.forEach(item => {
        if (item.timer) {
          clearTimeout(item.timer);
          item.timer = null;
        }
      });

      if (active) {
        progressItems.forEach(resetProgressItem);
      }

      progressItems.forEach((item, index) => {
        const target = active ? item.target : 0;
        const delay = active
          ? (prefersReducedMotion ? 180 + index * 60 : 240 + index * 120)
          : (progressItems.length - 1 - index) * 70;

        item.timer = setTimeout(() => {
          if (item.bar) {
            item.bar.style.transform = `scaleX(${target / 100})`;
          }
          animateProgressNumber(item, target);
          item.timer = null;
        }, delay);
      });
    };

    let progressActive = false;
    const barObserver  = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        const nextActive = e.isIntersecting;
        if (nextActive === progressActive) return;
        progressActive = nextActive;
        setProgressBars(nextActive);
      });
    }, { threshold: 0.42, rootMargin: '0px 0px -8% 0px' });

    if (progressSection) {
      barObserver.observe(progressSection);
    }

    /* ---- Formulário → WhatsApp ---- */
    function enviarForm() {
      const nome  = document.getElementById('f-nome').value.trim();
      const email = document.getElementById('f-email').value.trim();
      const msg   = document.getElementById('f-msg').value.trim();

      if (!nome || !email || !msg) {
        alert('Por favor, preencha todos os campos.');
        return;
      }

      const texto = `Olá Silas, vim pelo seu portfólio!\n\nNome: ${nome}\nEmail: ${email}\nMensagem: ${msg}`;
      const url   = 'https://wa.me/5585921703046?text=' + encodeURIComponent(texto);

      // Toast de feedback
      const toast = document.getElementById('toast');
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3000);

      // Abre WhatsApp
      setTimeout(() => window.open(url, '_blank'), 400);

      // Limpa campos
      document.getElementById('f-nome').value  = '';
      document.getElementById('f-email').value = '';
      document.getElementById('f-msg').value   = '';
    }

    /* ---- Efeito parallax sutil no hero (apenas desktop) ---- */
    if (!isMobile) {
      document.addEventListener('mousemove', e => {
        const glow = document.querySelector('.hero-glow');
        if (!glow) return;
        const x = (e.clientX / window.innerWidth  - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;
        glow.style.transform = `translate(${x}px, ${y}px)`;
      });
    }

    /* ---- Parallax suave ao scroll nas imagens ---- */
    function applyScrollParallax() {
      const heroBg = document.querySelector('.hero-bg');
      const contatoBg = document.getElementById('contatoBgImg');
      const isMobileLayout = () => window.matchMedia('(max-width: 900px)').matches;

      window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        // Hero parallax
        if (heroBg && !isMobileLayout()) {
          const heroSection = document.getElementById('hero');
          const heroH = heroSection.offsetHeight;
          const progress = Math.min(scrollY / heroH, 1);
          const offset = progress * 60;
          heroBg.style.backgroundPositionY = `calc(50% + ${offset}px)`;
        } else if (heroBg) {
          heroBg.style.backgroundPositionY = '';
          heroBg.style.opacity = '';
        }

        // Contato parallax
        if (contatoBg) {
          const contato = document.getElementById('contato');
          const rect = contato.getBoundingClientRect();
          const relScroll = -rect.top;
          const offset = relScroll * 0.15;
          contatoBg.style.backgroundPositionY = `calc(50% + ${offset}px)`;
          // Fade in suave ao entrar na seção
          const visRatio = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / window.innerHeight));
          const contatoMaxOpacity = isMobileLayout() ? 0.3 : 0.18;
          contatoBg.style.opacity = (contatoMaxOpacity * visRatio).toFixed(3);
        }
      }, { passive: true });
    }

    applyScrollParallax();
