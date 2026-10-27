/* Reads only job cards rendered in the user's current BOSS tab. */
function captureBoss() {
 if(!/(^|\.)zhipin\.com$/.test(location.hostname))throw Error('请打开 BOSS 职位列表');
 const visible=e=>e&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
 const text=e=>visible(e)?e.innerText.trim():'';
 const clean=value=>{try{const u=new URL(value,location.href);return /(^|\.)zhipin\.com$/.test(u.hostname)&&/^\/job_detail\/[\w~\-]+\.html$/.test(u.pathname)?'https://www.zhipin.com'+u.pathname:'';}catch{return '';}};
 const records=new Map();
 for(const a of [...document.querySelectorAll('a[href]')].filter(visible)){
  const url=clean(a.href);if(!url)continue;
  let card=a.closest('.job-card-wrapper, .job-card-box, .job-card-body, .job-primary, .job-list-item, li');
  // Never borrow company/salary from another job when the layout changes.
  const urls=e=>new Set([...e.querySelectorAll('a[href]')].map(x=>clean(x.href)).filter(Boolean));
  if(!card||urls(card).size>1){card=a;for(let parent=a.parentElement,n=0;parent&&n<5;parent=parent.parentElement,n++){if(urls(parent).size!==1)break;card=parent;}}
  for(let parent=card.parentElement,n=0;parent&&n<6;parent=parent.parentElement,n++){if(urls(parent).size!==1)break;card=parent;}
  const pick=selectors=>{for(const selector of selectors){const e=[...card.querySelectorAll(selector)].find(visible);if(e)return text(e);}return '';};
  const raw=text(card),tags=[...card.querySelectorAll('.tag-list li, .job-labels span, .job-info .tag-list span')].filter(visible).map(text);
  const title=pick(['.job-name','.job-title','h3'])||text(a).split('\n')[0]||'未识别岗位';
  const row={url,title,source:'BOSS直聘',company:pick(['.company-name','.company-title']),salary:pick(['.salary','.red']),city:pick(['.job-area','.job-area-wrapper','.job-location']),experience:tags.find(t=>/经验|应届|在校|\d+\s*[-到]\s*\d+年|\d+年以上/.test(t))||'',education:tags.find(t=>/学历|大专|本科|硕士|博士|高中|中专|初中/.test(t))||'',tags:[...new Set(tags)].join('；'),listText:raw,captureType:'list',status:'已采集（自行筛选）',capturedAt:new Date().toISOString()};
  if(!records.has(url)||(records.get(url).listText||'').length<raw.length)records.set(url,row);
 }
 return {jobs:[...records.values()]};
}

async function advanceBossList(){
 const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const visible=e=>e&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
 const anchors=[...document.querySelectorAll('a[href*="/job_detail/"]')].filter(visible);
 const containers=new Set();
 for(const a of anchors.slice(-12))for(let e=a.parentElement;e;e=e.parentElement)if(e.scrollHeight>e.clientHeight+5&&e.clientHeight>100&&(/auto|scroll/.test(getComputedStyle(e).overflowY)||e===document.scrollingElement))containers.add(e);
 if(document.scrollingElement)containers.add(document.scrollingElement);
 // Force instant movement, then wait for scroll handlers and lazy loading.
 for(const e of containers){
  const before=e.scrollTop,max=e.scrollHeight-e.clientHeight;
  if(max-before>8){
   const oldBehavior=e.style.scrollBehavior;e.style.scrollBehavior='auto';
   e.scrollTo({top:Math.min(max,before+Math.max(800,e.clientHeight*.9)),behavior:'instant'});
   await pause(700);e.style.scrollBehavior=oldBehavior;
   if(e.scrollTop>before+2){await pause(1200);return {kind:'scroll',from:before,to:e.scrollTop,max,container:e.tagName+'.'+String(e.className||'').slice(0,80)};}
  }
 }
 // A sentinel may be below the last card even when the chosen container reports bottom.
 const tail=anchors[anchors.length-1];
 if(tail){tail.scrollIntoView({block:'end',behavior:'instant'});await pause(700);}
 for(const e of containers){
  const max=e.scrollHeight-e.clientHeight;
  if(max>0){e.scrollTo({top:Math.max(0,max-180),behavior:'instant'});await pause(200);e.scrollTo({top:e.scrollHeight,behavior:'instant'});}
 }
 await pause(1800);
 const refreshed=[...document.querySelectorAll('a[href*="/job_detail/"]')].filter(visible);
 const beforeURLs=new Set(anchors.map(a=>a.href));
 if(refreshed.some(a=>!beforeURLs.has(a.href)))return {kind:'loaded'};
 const blocked=e=>e.disabled||e.getAttribute('aria-disabled')==='true'||e.closest('.disabled, .is-disabled, [disabled], [aria-disabled="true"]');
 const controls=[...document.querySelectorAll('.options-pages a, .options-pages button, .pagination a, .pagination button, .page a, .page button, .pager a, .pager button, .ui-icon-arrow-right, [aria-label="下一页"], [title="下一页"], .btn-next, .pagination-next')];
 let next=controls.find(e=>visible(e)&&!blocked(e)&&(/^(下一页|下页|Next|›|»|>)$/i.test(e.innerText.trim())||e.matches('[aria-label="下一页"], [title="下一页"], .btn-next, .pagination-next')||e.querySelector('.ui-icon-arrow-right, .icon-arrow-right')||e.matches('.ui-icon-arrow-right')));
 if(next){next=next.closest('a,button')||next;if(!blocked(next)){next.click();return {kind:'next'};}}
 const more=[...document.querySelectorAll('button,a,[role="button"]')].find(e=>visible(e)&&!blocked(e)&&/^(加载更多|查看更多职位|更多职位)$/.test(e.innerText.trim()));
 if(more){more.click();return {kind:'more'};}
 const end=[...document.querySelectorAll('.job-list-container *, .job-list-box *, .search-job-result *, .job-list *')].some(e=>visible(e)&&e.children.length===0&&/^(没有更多(职位|岗位|了)?|暂无更多(职位|岗位)?|已加载全部|没有找到相关职位)[。！!\s]*$/.test(e.innerText.trim()));
 return {kind:end?'end':'waiting',reason:'列表已到底，等待异步加载；未找到可用下一页'};
}
