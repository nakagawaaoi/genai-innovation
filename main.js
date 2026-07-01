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

// 同意チェックボックスによる送信ボタンの制御
document.addEventListener('DOMContentLoaded', () => {
  const agreeCheckbox = document.getElementById('agree');
  const submitBtn = document.getElementById('submitBtn');

  if (agreeCheckbox && submitBtn) {
    agreeCheckbox.addEventListener('change', () => {
      submitBtn.disabled = !agreeCheckbox.checked;
    });
  }
});

// お問い合わせフォームの送信イベント
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;

    // 送信完了のアラート表示（デモ用）
    alert(`お問い合わせありがとうございました！\n\n【送信内容の確認】\nお名前：${name}\nメールアドレス：${email}\n内容：${message}\n\n※このフォームはデモ画面です。登記完了後、実際のサーバー設置時にメール送信機能と連携します。`);
    
    // フォームをリセット
    contactForm.reset();
  });
}

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
