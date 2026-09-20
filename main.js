// スクロール時に要素をふわっと表示させるアニメーション (Reveal on scroll)
document.addEventListener('DOMContentLoaded', () => {
  const revealElements = document.querySelectorAll('.reveal');

  const revealOnScroll = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // 一度表示されたら監視を終了する（毎回アニメーションさせない場合）
        observer.unobserve(entry.target);
      }
    });
  }, {
    // 背の高いセクションはビューポートに対して15%が交差しないことがあるため、
    // 「少しでも見えたら」発火にする（アンカー直リンクで真っ白になる問題の対策）
    threshold: 0.01
  });

  revealElements.forEach(el => {
    revealOnScroll.observe(el);
  });
});

// ヘッダーのスクロールエフェクト
// ※インラインstyleを直接書き換えるとモバイル用CSSと競合するため、クラスの付け外しで行う
const siteHeader = document.querySelector('header');
window.addEventListener('scroll', () => {
  siteHeader.classList.toggle('is-scrolled', window.scrollY > 50);
});

// スマホ用ハンバーガーメニューの開閉（index.html のみ。services.html にはボタンが無いので何もしない）
document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('header');
  const toggle = document.querySelector('.nav-toggle');
  if (!header || !toggle) return;

  toggle.addEventListener('click', () => {
    const isOpen = header.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    toggle.setAttribute('aria-label', isOpen ? 'メニューを閉じる' : 'メニューを開く');
  });

  // メニュー内のリンクを押したら閉じる（アンカー移動後にメニューが被ったままにならないように）
  header.querySelectorAll('.global-nav a').forEach((link) => {
    link.addEventListener('click', () => {
      header.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'メニューを開く');
    });
  });
});

// コピーライトの年度を自動更新
document.addEventListener('DOMContentLoaded', () => {
  const copyrightYear = document.getElementById('copyright-year');
  if (copyrightYear) {
    copyrightYear.textContent = new Date().getFullYear();
  }
});

/* =========================================================
   スクロールに合わせた動き（index.html / services.html 共通）
   ---------------------------------------------------------
   ・ここで data-anim と --anim-delay を付ける。HTML 側には何も書かない
   ・「動きを減らす」設定の人、IntersectionObserver が無い環境では
     何もしない＝ html に .js-anim を付けないので、CSS 側も一切隠さない
   ・セレクタが 1 つも当たらない場合は、そのまま何もしない（ページ共通で使える）
   ========================================================= */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMotion.matches || !('IntersectionObserver' in window)) return;

  // [セレクタ, 動きの向き, 同じ親の中で1つずつ遅らせる間隔(ms)]
  const GROUPS = [
    // --- 共通 ---
    ['.hero-content > *',                 'up',    90],
    ['.hero-visual img',                  'zoom',   0],
    ['.section-header > *',               'up',    70],
    // --- index.html ---
    ['.news-square-card',                 'up',    60],
    ['.mvv-block',                        'left',   0],
    ['.value-vertical-item',              'left',  90],
    ['.services-grid > .service-item',    'up',    80],
    ['.cando-grid > .cando-item',         'up',    55],
    ['.company-container > *',            'up',    80],
    ['.dx-partner-card',                  'up',     0],
    ['.biz-item',                         'up',    55],
    ['.contact-container > *',            'up',    90],
    // --- services.html ---
    ['.tools-lead',                       'up',     0],
    ['.tools-grid > *',                   'up',    60],
    ['.toc li',                           'up',    45],
    ['.service-detail-meta > *',          'up',    60],
    ['.service-detail-desc',              'up',     0],
    ['.service-examples',                 'up',    60],
    ['.service-price-box',                'up',     0],
    ['.price-common-box',                 'up',     0],
    ['.compare-key > *',                  'left',  110],
    ['.compare-table-wrap',               'up',     0],
    ['.compare-note',                     'up',     0],
    ['.sort-cols > *',                    'left',  120],
    ['.faq-list > *',                     'up',    50],
    ['.cta-content > *',                  'up',    90],
  ];

  const MAX_DELAY = 420; // 待たされている感じにならない上限

  const targets = new Set();

  GROUPS.forEach(([selector, kind, step]) => {
    const counter = new Map(); // 親ごとに「何番目か」を数える
    document.querySelectorAll(selector).forEach((el) => {
      if (el.dataset.anim) return; // 先に別のグループで指定済みなら触らない
      el.dataset.anim = kind;
      const parent = el.parentElement;
      const index = counter.get(parent) || 0;
      counter.set(parent, index + 1);
      if (step > 0) {
        el.style.setProperty('--anim-delay', Math.min(index * step, MAX_DELAY) + 'ms');
      }
      targets.add(el);
    });
  });

  // 見出しの緑の罫線を引くために、見出しのまとまり自体も見張る
  document.querySelectorAll('.section-header').forEach((el) => targets.add(el));

  if (targets.size === 0) return;

  document.documentElement.classList.add('js-anim');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    });
  }, {
    // 「少しでも画面に入ったら」発火させる。遅らせると、
    // 見えている要素に後からアニメーションがかかってちらつく
    threshold: 0.01,
  });

  targets.forEach((el) => observer.observe(el));

  // 補足: タブが裏に回っていると IntersectionObserver は発火しない。
  // その状態でも表示は崩れない（隠していないため）が、
  // 表に戻ってきたときに素直にアニメーションが始まるよう、位置だけ見直す。
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    targets.forEach((el) => {
      if (el.classList.contains('is-in')) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('is-in');
        observer.unobserve(el);
      }
    });
  });
})();

/* =========================================================
   スクロールの進み具合を示す細い線（ヘッダーの下端）
   ========================================================= */
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(bar));

  let ticking = false;
  const update = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
    bar.style.setProperty('--progress', ratio.toFixed(4));
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }, { passive: true });

  window.addEventListener('resize', update, { passive: true });
})();

/* =========================================================
   ニュースカルーセル（自動送り＋左右ボタンでぐるぐる回す）
   ・カード2枚以上で操作ボタンと自動送りが有効になる
   ・マウスを乗せている間／操作中／タブが裏にある間は止める
   ・「動きを減らす」設定の方には自動送りをしない
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const track = document.getElementById('news-track');
  const navBtns = document.getElementById('carousel-nav-btns');
  const prevBtn = document.getElementById('news-prev-btn');
  const nextBtn = document.getElementById('news-next-btn');
  if (!track || !prevBtn || !nextBtn) return;

  const cards = track.querySelectorAll('.news-square-card');
  if (cards.length < 2) {
    if (navBtns) navBtns.style.display = 'none'; // 1枚しかないなら回す意味がない
    return;
  }
  if (navBtns) navBtns.style.display = 'flex';

  // カード1枚分ずつ送る（幅はCSS側で変わるので毎回測る）
  const step = () => {
    const first = track.querySelector('.news-square-card');
    if (!first) return 300;
    const gap = parseFloat(getComputedStyle(track).columnGap || '0') || 0;
    return first.getBoundingClientRect().width + gap;
  };
  const maxScroll = () => track.scrollWidth - track.clientWidth;

  const next = () => {
    if (track.scrollLeft >= maxScroll() - 10) {
      track.scrollTo({ left: 0, behavior: 'smooth' }); // 端まで来たら先頭へ戻る
    } else {
      track.scrollBy({ left: step(), behavior: 'smooth' });
    }
  };

  const prev = () => {
    if (track.scrollLeft <= 10) {
      track.scrollTo({ left: maxScroll(), behavior: 'smooth' });
    } else {
      track.scrollBy({ left: -step(), behavior: 'smooth' });
    }
  };

  nextBtn.addEventListener('click', () => { next(); restart(); });
  prevBtn.addEventListener('click', () => { prev(); restart(); });

  /* ---- 自動送り ---- */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const INTERVAL = 5000;
  let timer = null;
  let visible = true; // セクションが画面内にあるか

  const canAuto = () => !reduceMotion.matches && visible && !document.hidden;

  const start = () => {
    if (timer || !canAuto()) return;
    timer = setInterval(() => {
      if (canAuto()) next();
    }, INTERVAL);
  };
  const stop = () => {
    if (timer) { clearInterval(timer); timer = null; }
  };
  const restart = () => { stop(); start(); };

  // 触っている間は止める（読んでいる最中に流れると邪魔なので）
  const section = track.closest('.news-section') || track;
  ['mouseenter', 'focusin', 'touchstart', 'pointerdown'].forEach((ev) =>
    section.addEventListener(ev, stop, { passive: true }));
  ['mouseleave', 'focusout', 'touchend'].forEach((ev) =>
    section.addEventListener(ev, start, { passive: true }));

  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  reduceMotion.addEventListener('change', restart);

  // 画面外にある間は動かさない（表示自体には手を触れないので、真っ白事故にはならない）
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      visible ? start() : stop();
    }, { threshold: 0.2 }).observe(section);
  } else {
    start();
  }
});

/* =========================================================
   お知らせ一覧のカテゴリ絞り込み（news.html）
   JSが動かない環境でも全件そのまま見えるので、機能の有無で情報は欠けない
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('archive-grid');
  const btns = document.querySelectorAll('.news-filter-btn');
  const emptyMsg = document.getElementById('news-empty-msg');
  if (!grid || !btns.length) return;

  const cards = Array.from(grid.querySelectorAll('.archive-card'));

  btns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.filter;

      btns.forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });

      let shown = 0;
      cards.forEach((card) => {
        const hit = key === 'all' || card.dataset.category === key;
        card.hidden = !hit;
        if (hit) shown++;
      });

      if (emptyMsg) emptyMsg.hidden = shown > 0;
    });
  });
});
