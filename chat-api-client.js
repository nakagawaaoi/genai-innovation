/* 会社の公開中継APIだけに通信します。APIキーは扱いません。 */
(function(root){
  'use strict';
  const API_ORIGIN='https://genai-contact-api-20261104.sprylion33.chatgpt.site';
  const SOURCES=Object.freeze(Object.fromEntries(Object.entries({
    services:{url:'/services.html',label:'サービス・料金'},training:{url:'/training.html',label:'研修'},
    advisor:{url:'/services.html#service-2',label:'AI顧問'},support:{url:'/services.html#service-3',label:'導入支援'},
    ax:{url:'/services.html#service-4',label:'AXコンサルティング'},fde:{url:'/services.html#service-5',label:'FDE'},
    implementation:{url:'/services.html#service-6',label:'IT・AIソリューション実装'},research:{url:'/services.html#service-7',label:'研究開発・共同研究'},
    compare:{url:'/services.html#compare',label:'サービスの比較'},price:{url:'/services.html#price-common',label:'料金の共通事項'},
    company:{url:'/#company',label:'会社について'},contact:{url:'/#contact',label:'お問い合わせ'}
  }).map(([id,source])=>[id,Object.freeze(source)])));
  const ERRORS=Object.freeze({bot_verification:'接続の確認ができませんでした。もう一度お試しください。',storage_error:'利用上限を安全に確認できないため停止しています。',not_configured:'チャットの準備ができていません。接続設定をご確認ください。',invalid_input:'入力内容を確認してください。1回800文字まで送信できます。',session_limit:'この会話は8回までです。「担当者に相談する」または「最初から」をご利用ください。',rate_limit:'短時間の送信が多いため少し待ってからお試しください。',budget_exhausted:'利用上限に達したため停止しています。「担当者に相談する」からお問い合わせください。',upstream_auth:'接続を確認できません。接続設定をご確認ください。',upstream_limit:'AIの利用枠または送信上限に達しました。時間をおいて再度お試しください。',upstream_error:'回答を受け取れませんでした。入力は残しています。時間をおいて再度お試しください。',timeout:'回答に時間がかかりすぎたため中断しました。入力は残しています。再度お試しください。',invalid_response:'回答を安全に表示できませんでした。入力は残しています。再度お試しください。',forbidden:'接続の確認が必要です。「再接続」を押してからお試しください。'});
  const SESSION_ID=/^[A-Za-z0-9_-]{20,80}$/;
  const ACTIONS=new Set(['answer','clarify','handoff']);
  const isRecord=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
  function failure(code){
    const safeCode=typeof code==='string'&&Object.hasOwn(ERRORS,code)?code:'upstream_error';
    const error=new Error(ERRORS[safeCode]);error.code=safeCode;return error;
  }
  function cleanAnswer(data){
    if(!isRecord(data) || !['api','local'].includes(data.mode) || typeof data.answer!=='string' || !data.answer.trim() || data.answer.length>2000 || typeof data.session_id!=='string' || !SESSION_ID.test(data.session_id) || !Array.isArray(data.source_ids) || data.source_ids.length>5 || data.source_ids.some(id=>typeof id!=='string'||!Object.hasOwn(SOURCES,id)) || new Set(data.source_ids).size!==data.source_ids.length || !ACTIONS.has(data.next_action) || (Object.hasOwn(data,'used_count')&&(!Number.isInteger(data.used_count)||data.used_count<1||data.used_count>8)))throw failure('invalid_response');
    return {answer:data.answer,mode:data.mode,sessionId:data.session_id,nextAction:data.next_action,sources:data.source_ids.map(id=>SOURCES[id]),sourceIds:data.source_ids.slice(),usedCount:data.used_count};
  }
  class Client{
    constructor(transport){this.transport=transport;this.status=null;this.sessionId=null;}
    async loadStatus(signal){
      const response=await this.transport(API_ORIGIN+'/api/status',{cache:'no-store',credentials:'omit',mode:'cors',redirect:'error',signal});
      let data;try{data=await response.json();}catch{throw failure('invalid_response');}
      if(!response.ok || !isRecord(data) || typeof data.configured!=='boolean' || data.mode!==(data.configured?'api':'unconfigured') || (data.configured&&(typeof data.csrf_token!=='string'||!data.csrf_token||data.csrf_token.length>256||typeof data.turnstile_site_key!=='string'||!data.turnstile_site_key||data.turnstile_site_key.length>128)) || typeof data.model!=='string' || !data.model || data.model.length>100)throw failure('invalid_response');
      this.status=data;return data;
    }
    reset(){this.sessionId=null;}
    async send(message,history,signal,challengeToken){
      if(!this.status?.configured)throw failure('not_configured');
      if(typeof challengeToken!=='string'||!challengeToken||challengeToken.length>2048||typeof message!=='string' || !message.trim() || message.trim().length>800 || !Array.isArray(history) || history.length!==0 || (this.sessionId!==null&&(typeof this.sessionId!=='string'||!SESSION_ID.test(this.sessionId))))throw failure('invalid_input');
      // 会話本文は再送せず、サーバーが保持する案内IDだけで文脈を引き継ぎます。
      const body={message:message.trim(),history:[],turnstile_token:challengeToken};if(this.sessionId)body.session_id=this.sessionId;
      const response=await this.transport(API_ORIGIN+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':this.status.csrf_token},credentials:'omit',mode:'cors',redirect:'error',body:JSON.stringify(body),signal});
      let data;try{data=await response.json();}catch{throw failure('invalid_response');}
      if(!response.ok)throw failure(isRecord(data)?data.code:undefined);
      return cleanAnswer(data);
    }
  }
  const api={Client,SOURCES,ERRORS,cleanAnswer,failure};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.ChatApi=api;
})(typeof window!=='undefined'?window:globalThis);
