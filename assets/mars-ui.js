const root = document.documentElement;
const media = matchMedia('(prefers-reduced-motion: reduce)');
let reduced = media.matches;
let userMotionChoice = false;
function setMotion(value) {
  reduced = value;
  root.dataset.motion = value ? 'reduced' : 'full';
  const toggle = document.querySelector('#motion-toggle');
  if (toggle) { toggle.textContent = value ? '動態效果：關閉' : '動態效果：開啟'; toggle.setAttribute('aria-pressed', String(value)); }
  window.dispatchEvent(new CustomEvent('mars:motion', { detail: { reduced: value } }));
}
setMotion(reduced);
document.querySelector('#motion-toggle')?.addEventListener('click', () => { userMotionChoice=true;setMotion(!reduced); });
media.addEventListener('change', e => { if (!userMotionChoice) setMotion(e.matches); });
const menu=document.querySelector('.menu-toggle'), nav=document.querySelector('.main-nav');
function closeMenu(){nav?.classList.remove('open');menu?.setAttribute('aria-expanded','false');if(menu)menu.innerHTML='選單 <span>＋</span>';}
menu?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.innerHTML=open?'關閉 <span>−</span>':'選單 <span>＋</span>';});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav?.classList.contains('open')){closeMenu();menu.focus();}});
window.addEventListener('resize',()=>{if(innerWidth>800)closeMenu();},{passive:true});
const progress=document.querySelector('.reading-progress');
function updateProgress(){const range=document.documentElement.scrollHeight-innerHeight;if(progress)progress.style.transform=`scaleX(${range>0?Math.min(1,Math.max(0,scrollY/range)):0})`;}
window.addEventListener('scroll',updateProgress,{passive:true});window.addEventListener('resize',updateProgress,{passive:true});updateProgress();
// Progressive enhancement: no content is hidden if JavaScript or the observer is unavailable.
if ('IntersectionObserver' in window && !reduced) {
 root.classList.add('js-motion');
 const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}});},{threshold:.08});
 document.querySelectorAll('.section-heading,.manifesto-grid,.mission-steps,.support-grid,.crew-strip,.faq-heading').forEach(el=>{el.classList.add('reveal');observer.observe(el);});
}
const stages=[
 {kicker:'STAGE 01 / 找到第一個有效需求',title:'先做出，有人需要的價值。',description:'用 AI 整理客戶問題、設計提案與製作最小可行展示，把時間留給真實訪談與第一筆成交。',outputs:['一句說得清楚的服務定位','一份可以拿去談的提案','一個能驗證需求的小型展示']},
 {kicker:'STAGE 02 / 讓好成果可以重複',title:'讓生意成長，不只靠你加班。',description:'把已經做得好的工作拆成流程，讓 AI 協助內容初稿、客服整理與營運彙整；你專注品質與關係。',outputs:['固定的資料輸入格式','可重複使用的提示詞與 SOP','品質檢查與人工接手機制']},
 {kicker:'STAGE 03 / 探索下一個市場',title:'帶著一套系統，走向更大的舞台。',description:'當既有流程穩定，再用 AI 協助研究新市場、整理產品回饋與比較成長方向。每一次擴大，都保留驗證與修正的空間。',outputs:['市場研究與待驗證假設','可交接的營運方法','擴大前的成本與品質檢查清單']}
];
function bindTabs(selector,onSelect){const tabs=[...document.querySelectorAll(selector)];tabs.forEach((tab,i)=>{function select(){tabs.forEach(t=>{t.setAttribute('aria-selected',String(t===tab));t.tabIndex=t===tab?0:-1;});onSelect(i,tab);}
 tab.addEventListener('click',select);tab.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight'||e.key==='ArrowDown')next=(i+1)%tabs.length;if(e.key==='ArrowLeft'||e.key==='ArrowUp')next=(i-1+tabs.length)%tabs.length;if(e.key==='Home')next=0;if(e.key==='End')next=tabs.length-1;if(next!==undefined){e.preventDefault();tabs[next].click();tabs[next].focus();}});});}
function text(id,value){const el=document.getElementById(id);if(el)el.textContent=value;}
bindTabs('[data-stage]',(i,tab)=>{const s=stages[i];text('stage-kicker',s.kicker);text('stage-title',s.title);text('stage-description',s.description);const ul=document.getElementById('stage-outputs');ul.replaceChildren(...s.outputs.map(value=>{const li=document.createElement('li');li.textContent=value;return li;}));const panel=document.getElementById('stage-panel');panel.setAttribute('aria-labelledby',tab.id);panel.dataset.stage=i;panel.querySelector('.system-model').style.filter=`hue-rotate(${i*7}deg)`;});
const labs=[
 {before:'查資料、找痛點，一份提案寫一整晚。',description:'資訊散在網站與筆記裡，每次接觸新客戶，又要從空白頁開始。',input:'客戶資料與服務優勢',ai:'整理問題・產出提案初稿',human:'確認事實・判斷需求・親自成交',output:'客戶研究模板 ＋ 提案骨架 ＋ 跟進清單'},
 {before:'想主題、改文案，忙到忘了經營自己的品牌。',description:'每個平台都要重新寫一篇，內容做了很多，卻缺少一致的品牌觀點。',input:'你的專業觀點、作品與原始素材',ai:'整理主題・延伸不同平台的初稿',human:'補上經驗・核對內容・決定發布',output:'內容主題庫 ＋ 文案模板 ＋ 發布檢查清單'},
 {before:'相同的問題，每天都要重新回答。',description:'訊息分散在不同地方，常見問題與重要需求容易一起被埋沒。',input:'已去識別的常見問題與服務規則',ai:'分類問題・整理知識・草擬回覆',human:'確認承諾・處理例外・維繫關係',output:'常見問答庫 ＋ 回覆範本 ＋ 人工接手規則'},
 {before:'忙了一整週，還在複製貼上、整理報表。',description:'資料格式不一，每次統整都得重做，真正需要判斷的重點反而沒時間看。',input:'格式一致的紀錄與報表欄位',ai:'彙整資料・摘要變化・標記待確認',human:'核對數字・釐清原因・決定行動',output:'資料格式 ＋ 週報模板 ＋ 數字核對清單'}
];
bindTabs('[data-lab]',(i,tab)=>{const l=labs[i];text('lab-before-title',l.before);text('lab-before-description',l.description);text('flow-input',l.input);text('flow-ai',l.ai);text('flow-human',l.human);text('lab-output',l.output);document.querySelector('.manual-line').textContent=['研究 → 整理 → 寫稿 → 重來','想題 → 寫稿 → 改稿 → 再想題','查看 → 分類 → 回覆 → 再回覆','蒐集 → 複製 → 核對 → 重做'][i];document.getElementById('lab-panel').setAttribute('aria-labelledby',tab.id);});
const painPlans={
 sales:{label:'找到穩定客源',title:'做出一份客戶看得懂的服務提案',input:'整理你最想幫助的客戶、他遇到的問題，以及你能提供的價值。',task:'請 AI 依據你的資料，整理需求、服務說明與一份提案骨架；未知的內容標記待確認。',check:'找一位符合條件的潛在客戶訪談，記錄他是否看懂價值、願意進一步討論，以及仍有什麼疑問。'},
 content:{label:'持續產出內容',title:'把一份專業素材，變成可延續的內容',input:'選一份你擁有使用權的作品、文章或常見客戶問題，補上自己的觀點。',task:'請 AI 整理三個內容角度與一篇初稿，再依你使用的平台調整格式。',check:'核對事實、補上你的經驗，確認語氣與權利後再發布，記錄讀者提出的問題。'},
 service:{label:'回覆與服務客戶',title:'整理一份可以接手的常見問題庫',input:'蒐集五個重複出現的問題，移除個資，附上已確認的服務規則與答案。',task:'請 AI 分類問題並草擬回覆；不確定、例外或涉及承諾的情況，標記交由你處理。',check:'用不同問法測試答案，檢查是否漏掉限制或做出未授權承諾，留下人工接手規則。'},
 ops:{label:'重複的行政作業',title:'讓一份週報，從重做到重複使用',input:'挑一份最常整理的紀錄，統一欄位、日期與單位，建立一份小型範例。',task:'請 AI 依固定欄位彙整，分開已知資料與待確認項目，不補猜缺少的數字。',check:'逐項比對原始資料，記錄總耗時、錯誤與修正，再保存成下次可用的模板。'}
};
const stageWords={start:'正要開始',grow:'已有生意',scale:'準備擴大'};
const dataWords={none:'還沒整理',some:'有一些資料',ready:'已有固定流程'};
const form=document.getElementById('launch-form');let currentPlan='';
if(form)form.querySelector('button[type="submit"]').disabled=false;
form?.addEventListener('submit',e=>{e.preventDefault();const data=new FormData(form),stage=data.get('stage'),pain=data.get('pain'),ready=data.get('data');const p=painPlans[pain];if(!p||!stageWords[stage]||!dataWords[ready])return;
 const prep=ready==='none'?'先花一小段時間，從一個真實工作例子整理起，不必等資料全部齊全。':ready==='some'?'先挑一小份可信、可用的資料測試，確認來源與使用權，再逐步補齊。':'先記錄既有流程的耗時與品質，讓這次試行有可以比較的基準。';
 const focus=stage==='start'?'此階段先驗證需求，避免一次投入太多工具。':stage==='grow'?'此階段先找出可重複的步驟，降低每次從頭開始的負擔。':'此階段先檢查交接、權限與成本，再評估是否擴大。';
 text('result-title',p.title);text('result-description',`${focus} ${prep}`);
 const steps=[p.input,p.task,p.check];document.getElementById('result-steps').replaceChildren(...steps.map(value=>{const li=document.createElement('li');li.textContent=value;return li;}));
 currentPlan=`我的 AI 起步清單｜創火星基地\n\n目前階段：${stageWords[stage]}\n優先問題：${p.label}\n資料狀況：${dataWords[ready]}\n\n第一個任務：${p.title}\n${focus}\n${prep}\n\n${steps.map((s,i)=>`${i+1}. ${s}`).join('\n')}\n\n這是依選項整理的試行建議，實際合作範圍另行討論。`;
 document.getElementById('discuss-plan').href=`mailto:hi@blake.mba?subject=${encodeURIComponent('TMARSBASE｜我的 AI 起步清單')}&body=${encodeURIComponent('您好，我想討論以下工作題目：\n\n'+currentPlan)}`;
 const result=document.getElementById('launch-result');result.hidden=false;text('copy-status','');result.focus({preventScroll:true});result.scrollIntoView({behavior:reduced?'auto':'smooth',block:'center'});
});
document.getElementById('copy-plan')?.addEventListener('click',async()=>{if(!currentPlan)return;try{await navigator.clipboard.writeText(currentPlan);text('copy-status','起步清單已複製，可以貼到你的筆記中。');}catch{text('copy-status','瀏覽器未開放複製權限，請選取上方清單文字複製。');}});

root.classList.add("ui-ready");
