importScripts('history.js');
let ticking=false,nextTimer=null;
function scheduleNext(delay=15000){clearTimeout(nextTimer);nextTimer=setTimeout(()=>tick(),delay);}
async function finish(task,note){clearTimeout(nextTimer);nextTimer=null;await chrome.storage.local.set({collection:{...task,running:false,note}});await chrome.alarms.clear('collect');}
async function tick(){if(ticking)return;ticking=true;try{
 let {collection:t}=await chrome.storage.local.get('collection');if(!t?.running)return;if(t.nextDue&&Date.now()<t.nextDue)return;
 await chrome.scripting.executeScript({target:{tabId:t.tabId,allFrames:true},files:['capture.js']});
 const frames=await chrome.scripting.executeScript({target:{tabId:t.tabId,allFrames:true},func:()=>{if(!/(^|\.)zhipin\.com$/.test(location.hostname))return {jobs:[]};const body=document.body?.innerText||'';if(/安全验证|请完成验证|访问过于频繁|请稍候/.test(body)||/\/login|\/passport/.test(location.pathname))return {blocked:true};return captureBoss();}});
 const selected=frames.filter(f=>f.result?.jobs?.length).sort((a,b)=>b.result.jobs.length-a.result.jobs.length)[0]||frames.find(f=>f.frameId===0)||frames[0];
 const r=selected?.result||{jobs:[]};const frameId=selected?.frameId||0;
 if(r.blocked)return await finish(t,'检测到登录或安全验证，已停止，请手动处理。');
 const current=await chrome.storage.local.get(['collection','jobs','captureHistory']);if(!current.collection?.running||current.collection.id!==t.id)return;
 t=current.collection;const merged=mergeWeekly(r.jobs,current.jobs||[],current.captureHistory||{},t);
 const seen=new Set(merged.seen),added=merged.discovered;
 t={...t,nextDue:Date.now()+15000,seen:merged.seen,visited:merged.visited,skipped:merged.skipped,note:`本轮新增 ${seen.size}/200 条，跳过7天内重复 ${merged.skipped.length} 条。`};
 await chrome.storage.local.set({jobs:merged.jobs,captureHistory:merged.captureHistory,collection:t});
 if(seen.size>=200)return await finish(t,'本轮200条采集完成，可以开始AI分析。');
 const [{result:move}]=await chrome.scripting.executeScript({target:{tabId:t.tabId,frameIds:[frameId]},func:()=>advanceBossList()});
 const {collection:active}=await chrome.storage.local.get('collection');if(!active?.running||active.id!==t.id)return;
 const progress=move.kind==='scroll'||move.kind==='loaded'||added>0;
 const stalled=progress?0:(t.stalled||0)+1;
 t={...t,stalled,lastMove:move.kind,scrollDiagnostic:move,frameId,note:`本轮新增 ${seen.size}/200 条 · 跳过7天内重复 ${t.skipped.length} 条 · ${move.kind==='scroll'?`正在自动下滑 ${Math.round(move.from||0)}→${Math.round(move.to||0)}px`:move.kind==='loaded'?'下滑后已加载新卡片':move.kind==='next'?'已点击下一页，等待加载':move.kind==='more'?'正在加载更多':'已到底，等待加载或检查分页'} · 约15秒继续`};
 await chrome.storage.local.set({collection:t});
 if(move.kind==='end'&&added===0&&stalled>=2)return await finish(t,'页面显示已无更多职位，本轮采集完成。');
 if(stalled>=6)return await finish(t,'列表已到底且连续等待90秒没有新增；未找到有效分页或网站未加载下一批。已采集数据保留。');

 }catch(e){const {collection:t}=await chrome.storage.local.get('collection');if(t?.running)await finish(t,'采集暂停：页面关闭、权限失效或页面变化。请回到列表重新启动。');}finally{ticking=false;const {collection:latest}=await chrome.storage.local.get('collection');if(latest?.running)scheduleNext(Math.max(250,(latest.nextDue||Date.now()+15000)-Date.now()));}}
chrome.runtime.onMessage.addListener((msg,sender,reply)=>{(async()=>{
 if(msg.type==='start'){const {collection:old}=await chrome.storage.local.get('collection');if(old?.running)return {ok:false,error:'已有采集任务，请先停止'};
 await chrome.storage.local.set({collection:{id:Date.now(),tabId:msg.tabId,running:true,seen:[],idle:0,note:'开始采集，最多200条'}});await chrome.alarms.create('collect',{periodInMinutes:.5});await tick();return {ok:true};}
 if(msg.type==='stop'){const {collection:t}=await chrome.storage.local.get('collection');if(t)await finish(t,'已手动停止，已采集数据保留。');return {ok:true};}
 })().then(reply).catch(e=>reply({ok:false,error:e.message}));return true;});
chrome.alarms.onAlarm.addListener(a=>{if(a.name==='collect')tick();});
