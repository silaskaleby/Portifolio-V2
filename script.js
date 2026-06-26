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

    function smoothScrollTo(target, updateHistory = true) {
      if (!target) return;

      if (scrollAnimationFrame) cancelAnimationFrame(scrollAnimationFrame);

      const startY = window.scrollY;
      const navHeight = navbar ? navbar.getBoundingClientRect().height : 0;
      const targetY = target.id === 'hero'
        ? 0
        : Math.max(0, target.getBoundingClientRect().top + startY - navHeight - 16);
      const distance = targetY - startY;

      if (Math.abs(distance) < 2) {
        window.scrollTo(0, targetY);
        return;
      }

      const duration = Math.min(1200, Math.max(650, Math.abs(distance) * 0.42));
      const startTime = performance.now();
      const easeInOutCubic = progress => progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const step = now => {
        const progress = Math.min((now - startTime) / duration, 1);
        window.scrollTo(0, startY + distance * easeInOutCubic(progress));

        if (progress < 1) {
          scrollAnimationFrame = requestAnimationFrame(step);
          return;
        }

        scrollAnimationFrame = null;
        if (updateHistory) history.pushState(null, '', `#${target.id}`);
      };

      scrollAnimationFrame = requestAnimationFrame(step);
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
      }, { passive: true });
    });

    /* ---- Scroll reveal ---- */
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        e.target.classList.toggle('visible', e.isIntersecting);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
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

        contactCards.forEach((card, index) => {
          queueContactAnimation(() => card.classList.add('is-visible'), index * 170);
        });

        if (contactForm) {
          queueContactAnimation(() => contactForm.classList.add('is-visible'), 260);
        }
      };

      const resetContactIntro = () => {
        clearContactTimers();

        [...contactCards].reverse().forEach((card, index) => {
          queueContactAnimation(() => card.classList.remove('is-visible'), index * 70);
        });

        if (contactForm) {
          queueContactAnimation(() => contactForm.classList.remove('is-visible'), 90);
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
      }, { threshold: 0.28, rootMargin: '0px 0px -18% 0px' });

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

      const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

      function measure() {
        const wasReady = section.classList.contains('projects-scroll-ready');
        section.classList.remove('projects-scroll-ready');
        currentX = 0;
        track.style.transform = 'translate3d(0px, 0, 0)';

        maxShift = Math.max(0, track.scrollWidth - viewport.clientWidth);
        scrollDistance = Math.max(maxShift * 1.22, window.innerHeight * 0.9);
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
          updateCardFocus();
          return;
        }

        viewport.scrollTo({ left: 0, behavior: 'auto' });
        updateTargetFromScroll(true);
        currentProgress = targetProgress;
        render();
      }

      function updateCardFocus() {
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
        if (Math.abs(diff) < 0.0008) {
          currentProgress = targetProgress;
          render();
          return;
        }

        currentProgress += diff * 0.14;
        render();
        requestRender();
      }

      function requestRender() {
        if (rafId) return;
        rafId = requestAnimationFrame(animate);
      }

      function updateTargetFromScroll(immediate = false) {
        if (!desktopQuery.matches || maxShift <= 12 || isDragging) return;

        targetProgress = clamp((window.scrollY - stageStart) / scrollDistance, 0, 1);
        if (immediate) currentProgress = targetProgress;
        requestRender();
      }

      function syncVerticalToProgress() {
        if (!desktopQuery.matches || maxShift <= 12) return;

        const stageEnd = stageStart + scrollDistance;
        if (window.scrollY < stageStart || window.scrollY > stageEnd) return;

        window.scrollTo({ top: stageStart + targetProgress * scrollDistance, behavior: 'auto' });
      }

      viewport.addEventListener('pointerdown', event => {
        if (!desktopQuery.matches || maxShift <= 12 || event.pointerType !== 'mouse' || event.button !== 0) return;

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
        requestRender();
      }, { passive: true });
      window.addEventListener('scroll', () => updateTargetFromScroll(), { passive: true });
      window.addEventListener('resize', measure);

      if (document.fonts?.ready) document.fonts.ready.then(measure);
      measure();
    }

    initProjectsScroll();

    /* ---- Progress bars ---- */
    const progressBars = document.querySelectorAll('.progress-fill');
    const progressSection = document.querySelector('.progress-section');
    const setProgressBars = (active) => {
      progressBars.forEach(bar => {
        const width = active ? bar.getAttribute('data-width') : 0;
        bar.style.width = width + '%';
      });
    };

    const barObserver  = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        setProgressBars(e.isIntersecting);
      });
    }, { threshold: 0.22, rootMargin: '0px 0px -12% 0px' });

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
