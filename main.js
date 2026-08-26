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
