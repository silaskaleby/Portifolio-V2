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
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.12 });
    reveals.forEach(el => observer.observe(el));

    /* ---- Projetos: scroll horizontal, drag e destaque central ---- */
    function initProjectsScroll() {
      const section = document.getElementById('projetos');
      const stage = section?.querySelector('.projetos-scroll-stage');
      const viewport = section?.querySelector('.projetos-viewport');
      const cards = Array.from(section?.querySelectorAll('.projeto-card') || []);
      if (!section || !stage || !viewport || cards.length === 0) return;

      const desktopQuery = window.matchMedia('(min-width: 901px)');
      const zigzag = [-28, 30, -22, 26];
      let maxScroll = 0;
      let stageStart = 0;
      let ticking = false;
      let isDragging = false;
      let dragStarted = false;
      let dragStartX = 0;
      let dragStartScroll = 0;
      let suppressClick = false;

      const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

      function measure() {
        maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
        const navHeight = navbar ? navbar.getBoundingClientRect().height : 0;
        const stickyTop = Math.max(72, Math.round(navHeight + 18));
        stage.style.setProperty('--projects-sticky-top', `${stickyTop}px`);
        stage.style.setProperty('--projects-scroll-distance', `${maxScroll}px`);
        stageStart = stage.getBoundingClientRect().top + window.scrollY - stickyTop;
        section.classList.toggle('projects-scroll-ready', desktopQuery.matches && maxScroll > 12);
        updateFromVerticalScroll();
        updateCardFocus();
      }

      function updateCardFocus() {
        const viewportRect = viewport.getBoundingClientRect();
        const viewportCenter = viewportRect.left + viewportRect.width / 2;
        const focusRange = Math.max(260, viewportRect.width * 0.54);
        let focusedCard = cards[0];
        let focusedAmount = -1;

        cards.forEach((card, index) => {
          const rect = card.getBoundingClientRect();
          const cardCenter = rect.left + rect.width / 2;
          const distance = Math.abs(viewportCenter - cardCenter);
          const focus = clamp(1 - distance / focusRange, 0, 1);
          const baseY = zigzag[index % zigzag.length];
          const y = baseY * (1 - focus);
          const scale = 0.97 + focus * 0.075;
          const opacity = 0.68 + focus * 0.32;

          card.style.setProperty('--project-y', `${y.toFixed(2)}px`);
          card.style.setProperty('--project-scale', scale.toFixed(3));
          card.style.setProperty('--project-opacity', opacity.toFixed(3));

          if (focus > focusedAmount) {
            focusedAmount = focus;
            focusedCard = card;
          }
        });

        cards.forEach(card => card.classList.toggle('is-focused', card === focusedCard));
      }

      function updateFromVerticalScroll() {
        if (!desktopQuery.matches || maxScroll <= 0 || isDragging) return;

        const progress = clamp((window.scrollY - stageStart) / maxScroll, 0, 1);
        viewport.scrollLeft = progress * maxScroll;
      }

      function requestScrollUpdate() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          updateFromVerticalScroll();
          updateCardFocus();
          ticking = false;
        });
      }

      function syncVerticalToHorizontal() {
        if (!desktopQuery.matches || maxScroll <= 0) return;

        const stageEnd = stageStart + maxScroll;
        if (window.scrollY < stageStart || window.scrollY > stageEnd) return;

        const progress = viewport.scrollLeft / maxScroll;
        window.scrollTo({ top: stageStart + progress * maxScroll, behavior: 'auto' });
      }

      viewport.addEventListener('pointerdown', event => {
        if (event.button !== 0 && event.pointerType === 'mouse') return;

        isDragging = true;
        dragStarted = false;
        dragStartX = event.clientX;
        dragStartScroll = viewport.scrollLeft;
        viewport.classList.add('is-dragging');
        viewport.setPointerCapture(event.pointerId);
      });

      viewport.addEventListener('pointermove', event => {
        if (!isDragging) return;

        const deltaX = event.clientX - dragStartX;
        if (Math.abs(deltaX) > 4) {
          dragStarted = true;
          suppressClick = true;
        }

        if (!dragStarted) return;

        event.preventDefault();
        viewport.scrollLeft = dragStartScroll - deltaX;
        updateCardFocus();
      });

      function endDrag(event) {
        if (!isDragging) return;

        isDragging = false;
        viewport.classList.remove('is-dragging');
        if (viewport.hasPointerCapture(event.pointerId)) {
          viewport.releasePointerCapture(event.pointerId);
        }
        syncVerticalToHorizontal();

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

      viewport.addEventListener('scroll', () => requestAnimationFrame(updateCardFocus), { passive: true });
      window.addEventListener('scroll', requestScrollUpdate, { passive: true });
      window.addEventListener('resize', measure);

      if (document.fonts?.ready) document.fonts.ready.then(measure);
      measure();
    }

    initProjectsScroll();

    /* ---- Progress bars ---- */
    const progressBars = document.querySelectorAll('.progress-fill');
    const barObserver  = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const w = e.target.getAttribute('data-width');
          e.target.style.width = w + '%';
        }
      });
    }, { threshold: 0.4 });
    progressBars.forEach(b => barObserver.observe(b));

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
