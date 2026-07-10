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
    threshold: 0.15 // 15%見えたらトリガー
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

// コピーライトの年度を自動更新
document.addEventListener('DOMContentLoaded', () => {
  const copyrightYear = document.getElementById('copyright-year');
  if (copyrightYear) {
    copyrightYear.textContent = new Date().getFullYear();
  }
});
