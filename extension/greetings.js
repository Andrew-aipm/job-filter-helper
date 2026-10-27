/* Generic greeting templates. The user fills in the placeholders; nothing is auto-sent. */
const greetingTemplates=[
 ['通用｜匹配点开场','您好，我看了岗位描述，我在【岗位方向／领域】方面有【X】年经验，做过【代表项目或产品】，主要负责【核心职责】，例如【可量化成果】。这个岗位的要求和我的经历有重合，想进一步了解业务和团队，方便聊聊吗？'],
 ['经验｜项目成果','您好，我之前负责过【项目／产品】，做过【核心功能或模块】，取得了【可量化成果】。看到贵司这个岗位需要【JD 中的关键能力】，和我的经历比较契合，想和您沟通一下岗位的具体需求。'],
 ['技能｜能力对应','您好，我的经验主要集中在【技能／能力一】和【技能／能力二】，曾在【业务场景】中落地过【成果】。岗位要求的【JD 中的某项要求】我有对应实践，方便聊聊吗？'],
 ['简短｜一句话介绍','您好，我是有【X】年【岗位方向】经验的【当前职位】，代表项目是【一句话说明】，想了解一下这个岗位，方便沟通吗？']
];
for(const [title,text]of greetingTemplates){
 const card=document.createElement('article');card.className='greeting-card';
 const h=document.createElement('h3');h.textContent=title;
 const area=document.createElement('textarea');area.value=text;area.rows=5;area.setAttribute('aria-label',title+'招呼语');
 const button=document.createElement('button');button.textContent='复制文本';
 const feedback=document.createElement('span');feedback.setAttribute('role','status');
 button.onclick=async()=>{try{await navigator.clipboard.writeText(area.value);feedback.textContent='已复制';}catch{area.focus();area.select();feedback.textContent='自动复制不可用，已选中文本，请按 Ctrl/Cmd+C 复制';}};
 card.append(h,area,button,feedback);document.querySelector('#greetings').append(card);
}
