const $=s=>document.querySelector(s);const message=s=>$('#status').textContent=s;
function exportData(jobs){return [['岗位名称','网站','详情链接','公司','薪资','地点','经验','学历','匹配分','匹配理由（列表初筛）','列表原文'],...jobs.map(j=>[j.title||j.analysis?.title||'','BOSS直聘',j.url,j.company||'',j.salary||'',j.city||'',j.experience||'',j.education||'',j.analysis?.score??'',j.analysis?.reason||'',j.listText||j.description||''])];}
async function render(){const {jobs=[],profile,collection}=await chrome.storage.local.get(['jobs','profile','collection']);const matched=profile?jobs.filter(j=>eligible(j,profile)):[];$('#count').textContent=`已采集 ${jobs.length} 条 · AI符合要求 ${matched.length} 条`;$('#collectionStatus').textContent=collection?.note||'';$('#rows').replaceChildren();
 for(const j of matched){const tr=document.createElement('tr');for(const value of [j.title||'未识别岗位',j.company||'—',j.salary||'—',j.city||'—',[j.analysis?.score,j.analysis?.reason].filter(v=>v!==undefined).join(' / ')||'—']){const td=document.createElement('td');td.textContent=value;tr.append(td);}
 const td=document.createElement('td'),link=document.createElement('a');link.href=j.url;link.textContent='查看详情';link.target='_blank';link.rel='noopener noreferrer';td.append(link);tr.append(td);$('#rows').append(tr);}}
$('#refresh').onclick=render;
$('#clear').onclick=async()=>{if(confirm('停止采集并清空职位列表？7天去重记录会保留，同一岗位到期前不会重新入库。')){await chrome.runtime.sendMessage({type:'stop'});const {jobs=[],captureHistory={}}=await chrome.storage.local.get(['jobs','captureHistory']);const history=mergeWeekly([],jobs,captureHistory,{}).captureHistory;await chrome.storage.local.set({jobs:[],captureHistory:history});await render();message('已清空职位。');}};
async function downloadMatched(p){const {jobs=[]}=await chrome.storage.local.get('jobs');const selected=jobs.filter(j=>eligible(j,p));if(!selected.length)return message('暂无筛选通过的岗位，未生成Excel。请检查待分析、待核实或不匹配记录。');const url=URL.createObjectURL(makeXlsx(exportData(selected)));const a=document.createElement('a');a.href=url;a.download='BOSS合适岗位-列表AI初筛.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);message(`已导出 ${selected.length} 条AI初筛通过的岗位。完整JD未核实，投递前请核对原链接。`);}
$('#export').onclick=async()=>{try{await downloadMatched(readProfile());}catch(e){message(e.message);}};
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&(changes.jobs||changes.profile||changes.collection))render();});
render();

$('#stopCollection').onclick=()=>chrome.runtime.sendMessage({type:'stop'});
