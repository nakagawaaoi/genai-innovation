/* 会社サイトの公開API版。キーは中継サーバーで扱い、会話本文は画面内だけに保持します。 */
(() => {
  'use strict';
  const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSfgNUXql9Me-crDKbGJ3L68eyeiVJFwcVGgQX_z7M7u6c6Dhw/viewform?usp=dialog';
  const launcher = document.createElement('button');
  launcher.type = 'button';
  launcher.className = 'chat-launcher';
  launcher.setAttribute('aria-haspopup', 'dialog');
  launcher.setAttribute('aria-controls', 'chat-panel');
  launcher.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-8 8H6l-4 3V11.5a9 9 0 0 1 18 0Z"/><path d="M7 10h8M7 14h5"/></svg><span>AI相談</span>';
  const panel = document.createElement('dialog');
  panel.id = 'chat-panel'; panel.className = 'chat-panel';
  panel.setAttribute('aria-labelledby', 'chat-title');
  panel.innerHTML = `
    <div class="chat-head"><img src="/assets/logo-96.png" alt=""><h2 id="chat-title">AI相談</h2><button type="button" class="chat-reset" title="会話を消去して最初に戻します">最初から</button><button type="button" class="chat-close" aria-label="相談チャットを閉じる">×</button></div>
    <div class="chat-test-controls" hidden><span class="chat-api-state" hidden></span><button type="button" class="chat-refresh">再接続</button></div>
    <div class="chat-messages" role="log" aria-label="相談のやりとり" aria-live="polite" aria-relevant="additions"></div>
    <div class="chat-quick" aria-label="よくあるご質問"><button type="button" class="chat-chip" data-prompt="料金を知りたい">料金</button><button type="button" class="chat-chip" data-prompt="サービスの違いを知りたい">サービスの違い</button></div>
    <a class="chat-organize" href="${formUrl}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">担当者に相談する →</a>
    <div class="chat-status" role="status" hidden></div>
    <form class="chat-form" novalidate><div class="chat-input-row"><textarea id="chat-input" aria-label="相談内容" aria-describedby="chat-input-help" placeholder="当社のサービス・料金について質問" maxlength="800" rows="1" spellcheck="false"></textarea><button class="chat-send" type="submit" aria-label="送信">↑</button></div><div class="chat-bot-check" hidden></div><p id="chat-input-help" class="chat-input-caution">個人情報・機密情報は入力しないでください。</p><p class="chat-count" role="status" hidden></p>
      <details class="chat-privacy"><summary>プライバシー</summary><p>接続確認にCloudflare Turnstileを使用します。入力内容によっては外部送信前に止め、それ以外はOpenAIへ送ります。会話履歴は保存せず、案内の種類だけを引き継ぎます。1会話8回までです。<a href="/privacy.html" target="_blank" rel="noopener noreferrer">詳しい取扱い</a></p></details>
    </form>
    <p class="chat-panel-footer">正式なお見積りは担当者がご案内します。</p>`;
  document.body.append(launcher, panel);
  const $ = s => panel.querySelector(s);
  const api = new window.ChatApi.Client(window.fetch.bind(window));
  const MAX_TURNS = 8;
  let busy = false, checking = false, generation = 0, activeRequest = null, connectionReady = false;
  let turns = 0, returnFocus = launcher, composing = false, compositionEnding = false;
  const input = $('#chat-input'), log = $('.chat-messages'), status = $('.chat-status');
  const challenge=new window.CompanyChallenge($('.chat-bot-check'));
  function showStatus(text) { status.textContent = text; status.hidden = !text; }
  function addMessage(role, text, sources = [], mode = 'api') {
    const bubble = document.createElement('div');
    bubble.className = 'chat-message' + (role === 'user' ? ' chat-message-user' : '');
    bubble.setAttribute('aria-label',role === 'user' ? 'あなた' : mode === 'local' ? 'ご案内' : 'AIによるご案内');
    const body = document.createElement('span'); body.textContent = text;
    bubble.append(body);
    sources.forEach(source => {const a=document.createElement('a');a.href=source.url;a.textContent=source.label+' →';bubble.append(a);});
    log.append(bubble); log.scrollTop = log.scrollHeight;
  }
  function open(event) {
    returnFocus = event.currentTarget || launcher;
    panel.showModal();
    document.body.style.overflow = 'hidden';
    input.focus();
  }
  function close() { panel.close(); }
  launcher.addEventListener('click', open);
  $('.chat-close').addEventListener('click', close);
  panel.addEventListener('close', () => { document.body.style.overflow = ''; returnFocus.focus(); });
  function updateCount(force=false) { $('.chat-count').textContent=input.value.length+' / 800文字';$('.chat-count').hidden=!force&&input.value.length<720; }
  function setBusy(value){
    busy=value;input.readOnly=value;$('.chat-send').disabled=value||!connectionReady;
    $('.chat-send').textContent=value?'…':'↑';$('.chat-send').setAttribute('aria-label',value?'回答を作成中':'送信');
    $('.chat-refresh').disabled=value||checking;
    panel.querySelectorAll('[data-prompt]').forEach(b=>b.disabled=value||!connectionReady);
    log.setAttribute('aria-busy',String(value));
  }
  async function checkConnection(){
    if(checking||busy)return;
    checking=true;
    $('.chat-api-state').textContent='.envの設定状態を確認中…';
    $('.chat-test-controls').hidden=true;connectionReady=false;setBusy(false);
    const request=new AbortController();const timer=setTimeout(()=>request.abort(),6000);
    try{
      const data=await api.loadStatus(request.signal);
      connectionReady=data.configured;
      $('.chat-api-state').textContent=data.configured?'.env設定済み · '+data.model:'.env未設定 · 送信できません';
      
      $('.chat-test-controls').hidden=data.configured;
      if(!data.configured)showStatus('チャットの準備ができていません。接続設定をご確認ください。');
      else showStatus('');
    }catch{
      $('.chat-api-state').textContent='APIサーバーに接続できません';$('.chat-test-controls').hidden=false;
      showStatus('チャットに接続できません。時間をおいて再接続してください。');
    }
    clearTimeout(timer);checking=false;setBusy(false);
  }
  async function send(raw) {
    if(busy)return;
    const message=String(raw).trim();
    if(!message){showStatus('相談したいことを入力するか、候補のボタンを選んでください。');input.focus();return;}
    if(message.length>800){updateCount(true);showStatus('1回の入力は800文字以内にしてください。');input.focus();return;}
    if(!connectionReady){$('.chat-test-controls').hidden=false;showStatus('チャットに接続できません。再接続か接続設定をご確認ください。');return;}
    if(turns>=MAX_TURNS){showStatus('この会話は最大8回の送信に達しました。「担当者に相談する」または「最初から」をご利用ください。');return;}
    const epoch=generation;const request=new AbortController();activeRequest=request;
    const timer=setTimeout(()=>request.abort('timeout'),70000);
    $('.chat-quick').hidden=true;setBusy(true);showStatus('接続を確認しています…');
    try{
      const challengeToken=await challenge.token(api.status.turnstile_site_key,request.signal);
      if(epoch!==generation)return;
      turns++;updateCount();showStatus('回答を作成しています…');
      const answer=await api.send(message,[],request.signal,challengeToken);
      if(epoch!==generation)return;
      api.sessionId=answer.sessionId;
      if(answer.mode==='api')$('.chat-api-state').textContent='実APIの応答を確認済み · '+api.status.model;
      if(answer.usedCount!==undefined)turns=answer.usedCount;
      $('.chat-test-controls').hidden=true;
      addMessage('user',message);addMessage('assistant',answer.answer,answer.sources,answer.mode);
      input.value='';updateCount();
      showStatus('');
      if(turns>=MAX_TURNS)showStatus('この会話は8回までです。「担当者に相談する」からお問い合わせください。');
    }catch(error){
      if(epoch!==generation)return;
      showStatus(error.name==='AbortError'||request.signal.aborted?'回答を待つ時間が長いため中断しました。入力は残しています。':error.code?error.message:'回答を受け取れませんでした。入力は残しています。接続を確認して再度お試しください。');
      $('.chat-test-controls').hidden=false;
      if(error.code==='not_configured'||error.code==='upstream_auth'){connectionReady=false;$('.chat-api-state').textContent='APIの設定確認が必要です';}
    }finally{
      clearTimeout(timer);
      if(epoch===generation){activeRequest=null;setBusy(false);input.focus();}
    }
  }
  $('.chat-form').addEventListener('submit', e => {e.preventDefault();send(input.value);});
  input.addEventListener('input',()=>updateCount());
  input.addEventListener('compositionstart',()=>{composing=true;compositionEnding=false;});
  input.addEventListener('compositionend',()=>{composing=false;compositionEnding=true;setTimeout(()=>compositionEnding=false,0);});
  input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&!composing&&!compositionEnding&&e.keyCode!==229&&e.which!==229){e.preventDefault();send(input.value);}});
  $('.chat-quick').addEventListener('click',e=>{const b=e.target.closest('[data-prompt]');if(b)send(b.dataset.prompt);});
  $('.chat-refresh').addEventListener('click',checkConnection);
  function greet(){addMessage('assistant','当社のサービスや料金をご案内します。知りたいことを入力してください。',[],'local');}
  $('.chat-reset').addEventListener('click',()=>{
    generation++;if(activeRequest)activeRequest.abort('reset');activeRequest=null;challenge.cancel();api.reset();
    turns=0;composing=false;compositionEnding=false;log.replaceChildren();input.value='';
    $('.chat-quick').hidden=false;setBusy(false);updateCount();greet();
    showStatus('');
  });
  greet();updateCount();setBusy(false);checkConnection();
})();
