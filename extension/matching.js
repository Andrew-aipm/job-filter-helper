function jobInput(j){return {title:j.title,company:j.company,salary:j.salary,city:j.city,experience:j.experience,education:j.education,tags:j.tags,listText:j.listText,description:j.description};}
function fingerprint(j,p){return JSON.stringify({job:jobInput(j),resume:p.resume,preferences:p.preferences,threshold:p.threshold,model:'deepseek-flash',rules:3});}
// Direction is judged by the model; local code only validates its decision enum.
function directionStatus(a){
 if(a?.direction?.status==='match')return 'pass';
 if(a?.direction?.status==='mismatch')return 'fail';
 return 'unknown';
}
function decision(a,t,j){
 if(j){const direction=directionStatus(a,j);if(direction==='fail')return '不匹配';if(direction!=='pass')return '待核实';}
 if(!a||!Array.isArray(a.hard_checks)||a.hard_checks.some(c=>!c||!['pass','fail','unknown'].includes(c.status)))return '待核实';
 if(a.hard_checks.some(c=>c.status==='fail'))return '不匹配';
 if(a.sufficient!==true||a.hard_checks.some(c=>c.status==='unknown')||typeof a.score!=='number'||!Number.isFinite(a.score)||a.score<0||a.score>100)return '待核实';
 return a.score>=t?'推荐':'不匹配';
}
function eligible(j,p){return Boolean((j.listText||j.description)&&j.analysis&&j.analysisFingerprint===fingerprint(j,p)&&decision(j.analysis,p.threshold,j)==='推荐');}
