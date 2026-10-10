const root = document.documentElement;
const media = matchMedia('(prefers-reduced-motion: reduce)');
let reduced = media.matches;
let userMotionChoice = false;
function setMotion(value) {
  reduced = value;
  root.dataset.motion = value ? 'reduced' : 'full';
  const toggle = document.querySelector('#motion-toggle');
  if (toggle) { toggle.textContent = value ? 'Motion: off' : 'Motion: on'; toggle.setAttribute('aria-pressed', String(value)); }
  window.dispatchEvent(new CustomEvent('mars:motion', { detail: { reduced: value } }));
}
setMotion(reduced);
document.querySelector('#motion-toggle')?.addEventListener('click', () => { userMotionChoice=true;setMotion(!reduced); });
media.addEventListener('change', e => { if (!userMotionChoice) setMotion(e.matches); });
const menu=document.querySelector('.menu-toggle'), nav=document.querySelector('.main-nav');
function closeMenu(){nav?.classList.remove('open');menu?.setAttribute('aria-expanded','false');if(menu)menu.innerHTML='Menu <span>＋</span>';}
menu?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.innerHTML=open?'Close <span>−</span>':'Menu <span>＋</span>';});
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
 {kicker:'STAGE 01 / VALIDATE YOUR FIRST REAL NEED',title:'Create value someone needs.',description:'Use AI to organize customer problems, draft proposals and create a minimum viable demo. Save your time for real conversations and your first sale.',outputs:['A clear service proposition','A proposal ready for a customer conversation','A small demo to validate demand']},
 {kicker:'STAGE 02 / MAKE RESULTS REPEATABLE',title:'Grow beyond working longer hours.',description:'Turn good work into a process. Let AI help draft content, organize customer service and summarize operations while you focus on quality and relationships.',outputs:['Consistent input formats','Reusable prompts and SOPs','Quality checks and human handover rules']},
 {kicker:'STAGE 03 / EXPLORE YOUR NEXT MARKET',title:'Take a proven system into a bigger market.',description:'Once existing workflows are stable, use AI to research new markets, organize product feedback and compare growth options. Leave room to validate and adjust at every step.',outputs:['Market research and hypotheses to validate','Transferable operating methods','Cost and quality checklist before scaling']}
];
function bindTabs(selector,onSelect){const tabs=[...document.querySelectorAll(selector)];tabs.forEach((tab,i)=>{function select(){tabs.forEach(t=>{t.setAttribute('aria-selected',String(t===tab));t.tabIndex=t===tab?0:-1;});onSelect(i,tab);}
 tab.addEventListener('click',select);tab.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight'||e.key==='ArrowDown')next=(i+1)%tabs.length;if(e.key==='ArrowLeft'||e.key==='ArrowUp')next=(i-1+tabs.length)%tabs.length;if(e.key==='Home')next=0;if(e.key==='End')next=tabs.length-1;if(next!==undefined){e.preventDefault();tabs[next].click();tabs[next].focus();}});});}
function text(id,value){const el=document.getElementById(id);if(el)el.textContent=value;}
bindTabs('[data-stage]',(i,tab)=>{const s=stages[i];text('stage-kicker',s.kicker);text('stage-title',s.title);text('stage-description',s.description);const ul=document.getElementById('stage-outputs');ul.replaceChildren(...s.outputs.map(value=>{const li=document.createElement('li');li.textContent=value;return li;}));const panel=document.getElementById('stage-panel');panel.setAttribute('aria-labelledby',tab.id);panel.dataset.stage=i;panel.querySelector('.system-model').style.filter=`hue-rotate(${i*7}deg)`;});
const labs=[
 {before:'Research needs and pain points.Spend all evening on one proposal.',description:'Information is scattered across websites and notes. Every new customer means starting from a blank page.',input:'Customer information and your service strengths',ai:'Organize needs · Draft a proposal',human:'Verify facts · Assess needs · Close the deal yourself',output:'Customer research template + Proposal outline + Follow-up checklist'},
 {before:'Planning and rewriting content leaves no time for your own brand.',description:'Each platform needs another draft. You create plenty of content but lack a consistent brand perspective.',input:'Your expertise, work and original material',ai:'Organize themes · Draft for different platforms',human:'Add experience · Verify content · Decide what to publish',output:'Topic library + Copy templates + Publishing checklist'},
 {before:'Answering the same questions every day.',description:'Scattered messages bury common questions and important requests.',input:'De-identified FAQs and service policies',ai:'Classify questions · Organize knowledge · Draft replies',human:'Check commitments · Handle exceptions · Maintain relationships',output:'FAQ library + Reply templates + Human handover rules'},
 {before:'A busy week, still copying data and compiling reports.',description:'Inconsistent formats mean rebuilding every report, leaving little time for decisions that matter.',input:'Consistent records and report fields',ai:'Compile data · Summarize changes · Flag uncertainties',human:'Verify numbers · Understand causes · Decide actions',output:'Data format + Weekly report template + Number verification checklist'}
];
bindTabs('[data-lab]',(i,tab)=>{const l=labs[i];text('lab-before-title',l.before);text('lab-before-description',l.description);text('flow-input',l.input);text('flow-ai',l.ai);text('flow-human',l.human);text('lab-output',l.output);document.querySelector('.manual-line').textContent=['Research → Organize → Draft → Repeat','Plan → Draft → Revise → Repeat','Read → Classify → Reply → Repeat','Collect → Copy → Check → Repeat'][i];document.getElementById('lab-panel').setAttribute('aria-labelledby',tab.id);});
const painPlans={
 sales:{label:'Find consistent customers',title:'Build a service proposal customers understand',input:'Describe your ideal customer, their problem and the value you can provide.',task:'Ask AI to organize needs, describe your service and outline a proposal based on your data. Flag unknown information for review.',check:'Interview a suitable prospect. Record whether they understand the value, want to discuss further and still have questions.'},
 content:{label:'Create content consistently',title:'Turn one piece of expertise into reusable content',input:'Choose work, an article or a common customer question you have permission to use. Add your own perspective.',task:'Ask AI for three content angles and one draft, then adapt the format to your platform.',check:'Verify facts, add your experience and check tone and rights before publishing. Record reader questions.'},
 service:{label:'Respond to and serve customers',title:'Create a reusable FAQ library',input:'Collect five recurring questions, remove personal data and add verified service policies and answers.',task:'Ask AI to classify questions and draft replies. Flag uncertainties, exceptions and commitments for your review.',check:'Test varied wording. Check for missing limitations or unauthorized commitments and document human handover rules.'},
 ops:{label:'Repetitive administrative work',title:'Make your weekly report reusable',input:'Choose a recurring record. Standardize fields, dates and units, then create a small example.',task:'Ask AI to summarize using fixed fields. Separate verified data from items to check. Do not invent missing numbers.',check:'Compare each item with the source. Record time, errors and corrections, then save a reusable template.'}
};
const stageWords={start:'Getting started',grow:'Already in business',scale:'Ready to scale'};
const dataWords={none:'Not organized yet',some:'Some data available',ready:'An established workflow'};
const form=document.getElementById('launch-form');let currentPlan='';
if(form)form.querySelector('button[type="submit"]').disabled=false;
form?.addEventListener('submit',e=>{e.preventDefault();const data=new FormData(form),stage=data.get('stage'),pain=data.get('pain'),ready=data.get('data');const p=painPlans[pain];if(!p||!stageWords[stage]||!dataWords[ready])return;
 const prep=ready==='none'?'Start by organizing one real work example. You do not need all your data ready.':ready==='some'?'Test a small, reliable dataset. Confirm its source and permission to use it, then expand gradually.':'Record the time and quality of your existing workflow to establish a comparison baseline.';
 const focus=stage==='start'?'Validate demand first and avoid investing in too many tools at once.':stage==='grow'?'Identify repeatable steps to reduce the need to start from scratch.':'Review handover, permissions and costs before deciding to scale.';
 text('result-title',p.title);text('result-description',`${focus} ${prep}`);
 const steps=[p.input,p.task,p.check];document.getElementById('result-steps').replaceChildren(...steps.map(value=>{const li=document.createElement('li');li.textContent=value;return li;}));
 currentPlan=`My AI starter checklist｜TMARSBASE\n\nCurrent stage: ${stageWords[stage]}\nPriority challenge: ${p.label}\nData readiness: ${dataWords[ready]}\n\nFirst mission: ${p.title}\n${focus}\n${prep}\n\n${steps.map((s,i)=>`${i+1}. ${s}`).join('\n')}\n\nThese pilot suggestions reflect your selections. Actual collaboration scope will be discussed separately.`;
 document.getElementById('discuss-plan').href=`mailto:hi@blake.mba?subject=${encodeURIComponent('TMARSBASE｜My AI starter checklist')}&body=${encodeURIComponent('Hello, I would like to discuss the following work challenge:\n\n'+currentPlan)}`;
 const result=document.getElementById('launch-result');result.hidden=false;text('copy-status','');result.focus({preventScroll:true});result.scrollIntoView({behavior:reduced?'auto':'smooth',block:'center'});
});
document.getElementById('copy-plan')?.addEventListener('click',async()=>{if(!currentPlan)return;try{await navigator.clipboard.writeText(currentPlan);text('copy-status','Checklist copied. You can paste it into your notes.');}catch{text('copy-status','Clipboard access is unavailable. Select and copy the checklist above.');}});

root.classList.add("ui-ready");
