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
    ['.mvv-block',                        'left',   0],
    ['.value-vertical-item',              'left',  90],
    ['.services-grid > .service-item',    'up',    80],
    ['.cando-grid > .cando-item',         'up',    55],
    ['.company-container > *',            'up',    80],
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
