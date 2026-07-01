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
window.addEventListener('scroll', () => {
  const header = document.querySelector('header');
  if (window.scrollY > 50) {
    header.style.padding = '1rem 5%';
    header.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
  } else {
    header.style.padding = '1.5rem 5%';
    header.style.boxShadow = 'none';
  }
});
