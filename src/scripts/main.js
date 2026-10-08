/**
 * 交互与动画
 * 所有逻辑在 IntersectionObserver / scroll 事件里跑，无第三方依赖。
 */

(() => {
  window.__abl = true;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- 1. 进入视口显现 ---------- */
  const revealIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        revealIO.unobserve(e.target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );
  $$('.rv').forEach((el) => revealIO.observe(el));

  /* ---------- 2. 逐字显现（宣言正文） ---------- */
  const splitIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const text = el.textContent;
        // 需要强调的连续片段
        const em = el.dataset.emphasis || '';
        el.textContent = '';

        // 找出强调片段在原文中的起始位置
        let emStart = em ? text.indexOf(em) : -1;
        let emEnd = emStart >= 0 ? emStart + em.length : -1;

        let i = 0;
        const PUNCT = '，。、；：？！）》」』…—·,.;:?!)]';
        for (const ch of text) {
          const isEm = emStart >= 0 && i >= emStart && i < emEnd;
          const span = document.createElement('span');
          span.className =
            'ch' + (isEm ? ' ch--em' : '') + (PUNCT.includes(ch) ? ' ch--punct' : '');
          span.textContent = ch;
          // 逐字延迟，上限 24 个字避免过长
          if (i < 24) span.style.transitionDelay = `${i * 0.028}s`;
          el.appendChild(span);
          i++;
        }
        requestAnimationFrame(() => el.classList.add('is-in'));
        splitIO.unobserve(el);
      });
    },
    { threshold: 0.25 }
  );
  $$('[data-split]').forEach((el) => {
    if (!reduce) splitIO.observe(el);
    else el.classList.add('is-in');
  });

  /* ---------- 3. 页头滚动行为：隐藏 / 反色 ---------- */
  const header = $('[data-header]');
  let lastY = window.scrollY;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 8);

    // 向下滚动超过 220px 隐藏，向上立即显示
    const down = y > lastY && y > 220;
    header.classList.toggle('is-hidden', down && !menuOpen);

    // 判断当前是否落在深色区块上 → 页头反色
    if (y > 40) {
      const probe = document.elementFromPoint(window.innerWidth / 2, 34);
      if (probe) {
        const bg = getComputedStyle(probe).backgroundColor;
        const m = bg.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
        if (m) {
          const [r, g, b, a = 1] = [+m[1], +m[2], +m[3], +m[4]];
          // 亮度判断：暗色背景 → 反色
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          header.classList.toggle('is-ink', a > 0.5 && lum < 0.5);
        }
      }
    } else {
      header.classList.remove('is-ink');
    }

    lastY = y;
    ticking = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
      }
    },
    { passive: true }
  );
  onScroll();

  /* ---------- 4. 移动端菜单 ---------- */
  const menu = $('[data-menu]');
  const menuToggle = $('[data-menu-toggle]');
  let menuOpen = false;

  const setMenu = (open) => {
    menuOpen = open;
    menuToggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('is-locked', open);
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('is-open'));
    } else {
      menu.classList.remove('is-open');
      setTimeout(() => {
        if (!menuOpen) menu.hidden = true;
      }, 500);
    }
  };

  menuToggle.addEventListener('click', () => setMenu(!menuOpen));
  $$('[data-menu-link]').forEach((a) =>
    a.addEventListener('click', () => setMenu(false))
  );
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOpen) setMenu(false);
  });

  /* ---------- 5. 磁吸按钮 ---------- */
  if (!reduce && window.matchMedia('(pointer: fine)').matches) {
    $$('[data-magnetic]').forEach((el) => {
      const strength = 0.28;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength;
        const y = (e.clientY - r.top - r.height / 2) * strength;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transform = '';
      });
    });
  }

  /* ---------- 6. 路径 tab ---------- */
  const tabs = $$('[data-path-tab]');
  if (tabs.length) {
    const panels = $$('[data-path-panel]');
    const select = (id, focus = false) => {
      tabs.forEach((t) => {
        const on = t.dataset.pathTab === id;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      });
      panels.forEach((p) => {
        const on = p.dataset.pathPanel === id;
        p.hidden = !on;
      });
    };
    tabs.forEach((t) => {
      t.addEventListener('click', () => select(t.dataset.pathTab));
      t.addEventListener('keydown', (e) => {
        const i = tabs.indexOf(t);
        let next = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (i + 1) % tabs.length;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') next = 0;
        if (e.key === 'End') next = tabs.length - 1;
        if (next !== null) {
          e.preventDefault();
          select(tabs[next].dataset.pathTab, true);
        }
      });
    });
  }

  /* ---------- 7. 课程卡横滑：进度条 + 当前卡片高亮 ---------- */
  const stack = $('[data-stack]');
  if (stack) {
    const bar = $('[data-stack-bar]');
    const cur = $('[data-week-current]');
    const cards = $$('[data-week-card]', stack);

    const update = () => {
      const max = stack.scrollWidth - stack.clientWidth;
      const pct = max > 0 ? stack.scrollLeft / max : 0;
      if (bar) bar.style.width = `${12.5 + pct * 87.5}%`;

      // 找出与视口中心重叠度最高的卡片（吸附点略微偏左，用视口中心判断更稳）
      const viewMid = stack.scrollLeft + stack.clientWidth / 2;
      let best = 0;
      let bestOverlap = -1;
      cards.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        const vr = stack.getBoundingClientRect();
        // 与轨道可视区的重叠像素
        const overlap = Math.min(r.right, vr.right) - Math.max(r.left, vr.left);
        // 同时偏好靠近中心
        const center = r.left + r.width / 2;
        const score = overlap - Math.abs(center - viewMid) * 0.12;
        if (score > bestOverlap) {
          bestOverlap = score;
          best = i;
        }
      });
      cards.forEach((c, i) => c.classList.toggle('is-current', i === best));
      if (cur) cur.textContent = `${String(best + 1).padStart(2, '0')} / 08`;
    };

    // 用 scroll 事件作为唯一数据源：scroll-padding + snap 会让初始位置
    // 停在一张卡的吸附点上，直接读 scrollLeft 判断当前卡才准。
    stack.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    window.addEventListener('resize', update);
    // 首帧跑两次，等布局稳定后再算
    update();
    requestAnimationFrame(update);

    // 鼠标滚轮横向映射
    stack.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        stack.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }, { passive: false });
  }

  /* ---------- 8. FAQ 手风琴 ---------- */
  $$('[data-qa]').forEach((qa) => {
    const btn = $('[data-qa-toggle]', qa);
    const panel = $('[data-qa-panel]', qa);
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      if (open) {
        panel.hidden = true;
      } else {
        panel.hidden = false;
        // 从当前高度展开到自然高度
        const h = panel.scrollHeight;
        panel.animate(
          [{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }],
          { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)' }
        );
      }
    });
  });

  /* ---------- 9. 圆环路径绘制 ---------- */
  const loop = $('[data-loop]');
  if (loop && !reduce) {
    const ring = $('[data-loop-ring]', loop);
    const len = ring.getTotalLength();
    ring.style.setProperty('--len', len);
    loop.style.setProperty('--len', len);
    const loopIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          requestAnimationFrame(() => ring.classList.add('is-in'));
          loopIO.unobserve(e.target);
        });
      },
      { threshold: 0.3 }
    );
    loopIO.observe(loop);
  }

  /* ---------- 10. Hero 卡片错位入场 ---------- */
  // 注意：卡片靠 CSS class 定位错位（含 rotate），入场动画必须用独立的
  // translate 变量叠加，不能直接写 transform，否则会抹掉错位旋转。
  if (!reduce) {
    $$('[data-stack-cards] .card').forEach((c, i) => {
      c.style.transitionDelay = `${0.15 + i * 0.09}s`;
      c.style.setProperty('--enter', 'translateY(22px) scale(.965)');
      c.style.opacity = '0';
      requestAnimationFrame(() => {
        c.style.opacity = '1';
        c.style.setProperty('--enter', 'none');
      });
      c.addEventListener(
        'transitionend',
        () => {
          c.style.transitionDelay = '';
        },
        { once: true }
      );
    });
  }
})();
