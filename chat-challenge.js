/* 接続確認トークンは画面内のメモリだけに保持し、各送信で新しく取得します。 */
(function(root){
  'use strict';let sdkPromise=null;
  function loadSDK(){if(root.turnstile)return Promise.resolve(root.turnstile);if(sdkPromise)return sdkPromise;sdkPromise=new Promise((resolve,reject)=>{const script=document.createElement('script');let timer;const fail=()=>{clearTimeout(timer);script.remove();sdkPromise=null;reject(new Error('接続の確認を読み込めませんでした。'));};script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.referrerPolicy='no-referrer';script.onload=()=>{clearTimeout(timer);root.turnstile?resolve(root.turnstile):fail();};script.onerror=fail;timer=setTimeout(fail,10000);document.head.append(script);});return sdkPromise;}
  class Challenge{
    constructor(mount,load=loadSDK){this.mount=mount;this.load=load;this.version=0;this.pending=null;this.widget=null;this.sdk=null;}
    cancel(){this.version++;if(this.pending)this.pending(new Error('接続確認を中断しました。'));if(this.widget!==null&&this.sdk){this.sdk.remove(this.widget);this.widget=null;}this.mount.hidden=true;}
    async token(sitekey,signal){
      if(typeof sitekey!=='string'||!sitekey||sitekey.length>128)throw new Error('接続確認の準備ができていません。');
      this.cancel();const version=this.version;this.sdk=await this.load();if(signal?.aborted||version!==this.version)throw new Error('接続確認を中断しました。');
      return new Promise((resolve,reject)=>{let timer;let settled=false;const finish=(error,token)=>{if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);this.pending=null;this.mount.hidden=true;if(error)reject(error);else if(typeof token==='string'&&token.length&&token.length<=2048)resolve(token);else reject(new Error('接続の確認ができませんでした。'));};const abort=()=>finish(new Error('接続確認を中断しました。'));this.pending=error=>finish(error);signal?.addEventListener('abort',abort,{once:true});timer=setTimeout(()=>finish(new Error('接続確認に時間がかかりすぎています。')),45000);this.mount.hidden=false;
        try{this.widget=this.sdk.render(this.mount,{sitekey,action:'chat',execution:'execute',appearance:'interaction-only',theme:'light',language:'ja',callback:token=>{if(version===this.version)finish(null,token);},'error-callback':()=>finish(new Error('接続の確認ができませんでした。')),'expired-callback':()=>finish(new Error('接続確認の有効期限が切れました。'))});this.sdk.execute(this.widget);}catch{finish(new Error('接続の確認を開始できませんでした。'));}
      });
    }
  }
  if(typeof module==='object'&&module.exports)module.exports=Challenge;else root.CompanyChallenge=Challenge;
})(typeof window!=='undefined'?window:globalThis);
