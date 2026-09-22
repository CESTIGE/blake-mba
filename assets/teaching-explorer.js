(async () => {
 const root=document.querySelector('.te-explorer'); if(!root)return;
 const data=await fetch('/assets/teaching-explorer-data.json?v=3').then(r=>{if(!r.ok)throw Error('data');return r.json()});
 const stage=root.querySelector('.te-stage'),cards=[...root.querySelectorAll('.te-card')],detail=root.querySelector('.te-detail');
 const descriptions=['總覽與單門聚焦交替，放大後展示課程。','多排圖片以不同速度平移，形成視差。','拖曳平移畫布，按 ＋／− 縮放探索。','選中的課程原地展開，鄰近卡片讓出空間。','整齊總覽與錯落展示交替重組。','課程沿弧線前進，中央放大、兩側後退。','課程繞立體圓環旋轉，前方課程清晰呈現。','聚焦課程橫向展開，其餘縮成窄幅圖片。','三排課程以交錯方向持續流動。','照片卡與課程卡交錯分布於橫向橢圓，拖曳旋轉探索。'];
 let mode=6,index=0,zoom=1,panX=0,panY=0,phase=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,last=performance.now(),elapsed=0,drag=null,moved=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function select(i){index=(i+data.length)%data.length;const d=data[index];detail.replaceChildren();for(const [tag,text]of [['small',d.org+' · '+d.kind],['h3',d.title],['p',d.date+(d.note?' · '+d.note:'')]]){const e=document.createElement(tag);e.textContent=text;detail.append(e)}if(d.kind==='課堂照片'){const a=document.createElement('a');a.href=d.image;a.target='_blank';a.rel='noreferrer';a.textContent='開啟原圖 ↗';detail.append(a)}cards.forEach((c,j)=>c.setAttribute('aria-pressed',String(j===index)));}
 function playLabel(){const b=root.querySelector('[data-action=play]');b.textContent=paused?'▶':'Ⅱ';b.setAttribute('aria-label',paused?'播放展示':'暫停展示')}
 let stageWidth=stage.clientWidth,stageHeight=stage.clientHeight,inView=false;
 new IntersectionObserver(entries=>{inView=entries[0].isIntersecting}).observe(stage);
 function layout(){const w=stageWidth,h=stageHeight,n=cards.length,small=w<600,cw=small?122:170,ch=small?142:176;
 cards.forEach((c,i)=>{let d=(i-index+n)%n;if(d>n/2)d-=n;let x=0,y=0,z=0,s=1,ry=0,rx=0,opacity=1;const cols=small?3:6,row=Math.floor(i/cols),col=i%cols;
 if(mode===0){x=(col-(cols-1)/2)*(cw+14);y=(row-2)*(ch+12);s=.78;if(phase%8>3&&i===index){x=0;y=0;s=small?1.4:1.8;z=450}else if(phase%8>3){s=.58;opacity=.4}}
 if(mode===1||mode===8){const r=i%3,k=Math.floor(i/3),period=Math.ceil(n/3)*(cw+18),speed=(r===1?-1:1)*(mode===1?12+r*8:35);x=((k*(cw+18)+phase*speed+period*4)%period)-period/2;y=(r-1)*(ch+14);s=mode===1?.88+r*.05:.9}
 if(mode===2){x=(col-(cols-1)/2)*(cw+16);y=(row-2)*(ch+16);}
 if(mode===3){x=d*(cw+22)+(d===0?0:Math.sign(d)*cw*.3);y=Math.abs(d)%2*25;s=d===0?1.5:.8;opacity=Math.abs(d)>3?0:1}
 if(mode===4){const grid=phase%10<5;x=grid?(col-(cols-1)/2)*(cw+12):Math.sin(i*2.4)*w*.36;y=grid?(row-2)*(ch+10):Math.cos(i*2.4)*h*.32;s=grid?.78:(i===index?1.5:.62);z=i===index?150:0}
 if(mode===5){x=d*cw*.92;y=Math.abs(d)*35;s=Math.max(.5,1.35-Math.abs(d)*.2);ry=d*-13;opacity=Math.abs(d)>3?0:1;z=100-Math.abs(d)*40}
 if(mode===6){const a=d*.5+Math.sin(phase*.3)*.08;x=Math.sin(a)*w*.38;z=Math.cos(a)*220-220;y=Math.sin(a*2)*20;ry=-a*180/Math.PI;s=.9;opacity=Math.abs(d)>6?0:Math.cos(a)>.1?1:.2}
 if(mode===7){x=d*(small?45:85);s=d===0?1.45:.7;c.style.clipPath=d===0?'none':'inset(0 32% round 12px)';z=d===0?150:0;opacity=Math.abs(d)>4?0:1}
 else c.style.clipPath='none';
 if(mode===9){const lat=Math.asin(-1+2*(i+.5)/n),a=i*2.399+phase*.12+panX*.006;const r=Math.min(w*.38,450),depth=120;x=Math.cos(lat)*Math.sin(a)*r;y=Math.sin(lat)*h*.24;z=Math.cos(lat)*Math.cos(a)*depth;s=.55+.35*(z/depth+1)/2;ry=Math.sin(a)*28;rx=-lat*15;opacity=z<0?.22:1}
 if(mode!==9){x=(x+panX)*zoom;y=(y+panY)*zoom;s*=zoom}else{x*=zoom;y=(y+panY)*zoom;s*=zoom}c.style.width=cw+'px';c.style.height=ch+'px';c.style.transform=`translate(-50%,-50%) translate3d(${x}px,${y}px,${z}px) rotateY(${ry}deg) rotateX(${rx}deg) scale(${s})`;c.style.opacity=opacity;c.style.zIndex=String(Math.round(z+500));c.style.pointerEvents=opacity<.3?'none':'auto';
 });}
 root.querySelectorAll('.te-modes button').forEach(b=>b.addEventListener('click',()=>{mode=Number(b.dataset.mode);root.dataset.mode=mode;panX=panY=0;zoom=1;phase=0;root.querySelectorAll('.te-modes button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));root.querySelector('.te-mode-description').textContent=descriptions[mode];layout()}));
 cards.forEach((c,i)=>c.addEventListener('click',()=>{if(moved)return;select(i);phase=4;elapsed=0;layout()}));
 root.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>{const a=b.dataset.action;if(a==='play')paused=!paused;if(a==='prev'||a==='next'){select(index+(a==='prev'?-1:1));elapsed=0}if(a==='in')zoom=Math.min(2,zoom+.2);if(a==='out')zoom=Math.max(.4,zoom-.2);if(a==='reset'){zoom=1;panX=panY=0}playLabel();layout()}));
 stage.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,px:panX,py:panY};moved=false});
 stage.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>8){moved=true;panX=drag.px+dx;panY=drag.py+dy;layout()}});
 window.addEventListener('pointerup',()=>{drag=null;setTimeout(()=>moved=false,0)});
 stage.addEventListener('pointercancel',()=>drag=null);
 reduced.addEventListener('change',e=>{if(e.matches){paused=true;playLabel()}});
 document.addEventListener('visibilitychange',()=>last=performance.now());
 new ResizeObserver(()=>{stageWidth=stage.clientWidth;stageHeight=stage.clientHeight;layout()}).observe(stage);
 function tick(now){const dt=Math.min((now-last)/1000,.1);last=now;if(!paused&&!drag&&!document.hidden&&inView){phase+=dt;elapsed+=dt;if(elapsed>4){select(index+1);elapsed=0}layout()}requestAnimationFrame(tick)}
 select(0);playLabel();root.querySelector('.te-mode-description').textContent=descriptions[6];root.classList.add('ready');layout();requestAnimationFrame(tick);
})().catch(console.error);
