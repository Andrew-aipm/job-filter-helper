const status=document.querySelector('#status');
document.querySelector('#open').onclick=()=>chrome.tabs.create({url:chrome.runtime.getURL('dashboard.html')});
document.querySelector('#capture').onclick=async()=>{try{const [tab]=await chrome.tabs.query({active:true,currentWindow:true});if(!tab?.url||!/(^|\.)zhipin\.com$/.test(new URL(tab.url).hostname))throw Error('请在BOSS筛选后的列表页启动');const r=await chrome.runtime.sendMessage({type:'start',tabId:tab.id});status.textContent=r.ok?'已启动，最多200条。可关闭此弹窗；请保持BOSS标签页打开。':r.error;}catch(e){status.textContent=e.message;}};
document.querySelector('#stopCollect').onclick=()=>chrome.runtime.sendMessage({type:'stop'});
chrome.storage.local.get('collection').then(({collection})=>{if(collection)status.textContent=collection.note;});

chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.collection)status.textContent=changes.collection.newValue?.note||'';});
