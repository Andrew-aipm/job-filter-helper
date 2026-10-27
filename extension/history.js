const WEEK_MS=7*24*60*60*1000;
function jobKey(value){try{const u=new URL(value);return u.hostname.endsWith('zhipin.com')?'https://www.zhipin.com'+u.pathname:value;}catch{return value;}}
function mergeWeekly(rows,jobs,history,task,now=Date.now()){
 const ledger={...history};const map=new Map(jobs.map(j=>[jobKey(j.url),j]));
 // Migrate earlier versions using their last capture time, not today's date.
 for(const j of jobs){const date=Date.parse(j.capturedAt);const key=jobKey(j.url);if(Number.isFinite(date)&&(!ledger[key]||date>ledger[key]))ledger[key]=date;}
 const recent=t=>Number.isFinite(t)&&now-t<WEEK_MS;
 for(const [key,time]of Object.entries(ledger))if(!recent(time))delete ledger[key];
 const accepted=new Set(task.seen||[]),visited=new Set(task.visited||[]),skipped=new Set(task.skipped||[]);let discovered=0;
 for(const row of rows){const key=jobKey(row.url);if(!visited.has(key)){visited.add(key);discovered++;}
  if(accepted.has(key))continue;
  if(recent(ledger[key])){skipped.add(key);continue;}
  if(accepted.size>=200)break;
  accepted.add(key);ledger[key]=now;
  map.set(key,{...row,url:key,capturedAt:new Date(now).toISOString(),status:'待分析'});
 }
 return {jobs:[...map.values()],captureHistory:ledger,seen:[...accepted],visited:[...visited],skipped:[...skipped],discovered};
}
