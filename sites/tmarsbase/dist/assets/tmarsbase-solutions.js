const form=document.querySelector('#inquiry-form');
const plan=document.querySelector('#inquiry-plan');
if(form&&plan){
 form.querySelector('button[type="submit"]').disabled=false;
 document.querySelectorAll('[data-inquiry]').forEach(link=>link.addEventListener('click',()=>{plan.value=link.dataset.inquiry;}));
 form.addEventListener('submit',event=>{
  event.preventDefault();if(!form.reportValidity())return;
  const data=new FormData(form);
  const body=`您好，我想討論 AI 導入。\n\n公司／品牌名稱：${data.get('company')||'尚未填寫'}\n聯絡方式：${data.get('contact')||'請以回信聯絡'}\n偏好方案：${data.get('plan')}\n\n想改善的工作：\n${data.get('work')}\n\n謝謝。`;
  const status=document.querySelector('#inquiry-status');status.hidden=false;status.replaceChildren();
  const heading=document.createElement('strong');heading.textContent='需求內容已整理，尚未寄出。';
  const preview=document.createElement('textarea');preview.readOnly=true;preview.value=body;preview.rows=10;preview.setAttribute('aria-label','諮詢郵件內容');
  const actions=document.createElement('div');actions.className='result-actions';
  const mail=document.createElement('a');mail.className='text-link';mail.textContent='開啟郵件草稿 ↗';mail.href=`mailto:hi@blake.mba?subject=${encodeURIComponent('TMARSBASE｜AI 導入需求討論')}&body=${encodeURIComponent(body)}`;
  const copy=document.createElement('button');copy.type='button';copy.className='text-link';copy.textContent='複製需求內容 ↗';
  const note=document.createElement('p');note.textContent='請寄至 hi@blake.mba，由你確認並寄出。這不代表預約已完成。';
  copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(body);note.textContent='需求內容已複製，請貼到郵件寄至 hi@blake.mba。';}catch{preview.focus();preview.select();note.textContent='請使用複製快捷鍵，將選取的需求內容貼到郵件中。';}});
  actions.append(mail,copy);status.append(heading,preview,actions,note);status.scrollIntoView({behavior:document.documentElement.dataset.motion==='reduced'?'auto':'smooth',block:'center'});
 });
}
