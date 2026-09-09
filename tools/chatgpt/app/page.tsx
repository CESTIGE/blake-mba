'use client';

import { useMemo, useState } from 'react';
import milestoneImages from './milestone-images.json';
import adoption from './adoption.json';
import effects from './milestone-effects.json';
import { Users, Download, Cpu, MessagesSquare, Eye, TrendingUp, ArrowRightLeft, ArrowUpRight, BookOpen, Bot, BrainCircuit, Clock3, Film, Play, Search, ShieldCheck, WandSparkles } from 'lucide-react';

type Category = '全部' | '模型' | '推理' | '多模態' | '產品功能' | '代理工作';
type Period = '全部年份' | '2026' | '2025' | '2024' | '2023' | '2022' | '2018–2021';
type Milestone = { date: string; title: string; category: Exclude<Category, '全部'>; summary: string; impact: string; source: string };

const milestones: Milestone[] = [
  { date: '2018.06', title: 'GPT‑1：生成式預訓練', category: '模型', summary: '先在大量未標記文字上預訓練，再針對任務微調，奠定 GPT 系列的基本方法。', impact: '證明同一套預訓練模型可以遷移到多種語言任務。', source: 'https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf' },
  { date: '2019.02.14', title: 'GPT‑2', category: '模型', summary: '擴大到 15 億參數，能產生更連貫的長篇文字，並採分階段發布。', impact: '模型能力與負責任發布第一次同時成為焦點。', source: 'https://openai.com/index/better-language-models/' },
  { date: '2020.05.28', title: 'GPT‑3', category: '模型', summary: '以 1,750 億參數展示零樣本與少樣本學習，透過文字範例就能處理多種任務。', impact: '提示設計開始取代大量任務專屬訓練。', source: 'https://openai.com/index/language-models-are-few-shot-learners/' },
  { date: '2022.01.27', title: 'InstructGPT', category: '模型', summary: '以人類回饋訓練模型遵循指令，提升有用性、真實性並降低有害輸出。', impact: '把「理解使用者意圖」帶入後來的 ChatGPT 對話體驗。', source: 'https://openai.com/index/instruction-following/' },
  { date: '2022.11.30', title: 'ChatGPT 研究預覽', category: '產品功能', summary: '以 GPT‑3.5 系列為基礎，把大型語言模型帶進人人可用的對話介面。', impact: '從「呼叫模型」轉為「持續對話」。', source: 'https://openai.com/index/chatgpt/' },
  { date: '2023.03.14', title: 'GPT‑4', category: '模型', summary: '推理、可靠性與複雜指令處理大幅前進，並支援圖像輸入。', impact: 'ChatGPT 從聊天工具走向通用知識助手。', source: 'https://openai.com/index/gpt-4-research/' },
  { date: '2023.05', title: '瀏覽與外掛', category: '代理工作', summary: 'ChatGPT 開始連接即時網路與第三方服務，不再只依賴訓練資料。', impact: '模型開始「使用工具」完成任務。', source: 'https://help.openai.com/en/articles/6825453-chatgpt-release-notes' },
  { date: '2023.11.06', title: 'GPT‑4 Turbo、GPTs', category: '產品功能', summary: '更長上下文、更低成本；使用者可以用自然語言建立自己的 GPT。', impact: 'ChatGPT 從單一產品變成可客製的平台。', source: 'https://openai.com/index/new-models-and-developer-products-announced-at-devday/' },
  { date: '2024.01.10', title: 'GPT Store 與 ChatGPT Team', category: '產品功能', summary: '自訂 GPT 可被探索與分享，團隊版提供協作與企業資料保護。', impact: '形成應用生態，也正式進入團隊工作場景。', source: 'https://openai.com/index/introducing-chatgpt-team/' },
  { date: '2024.05.13', title: 'GPT‑4o', category: '多模態', summary: '文字、視覺與語音由同一個「omni」模型即時處理，互動更自然。', impact: 'AI 從文字視窗轉向即時、多感官介面。', source: 'https://openai.com/index/hello-gpt-4o/' },
  { date: '2024.07.18', title: 'GPT‑4o mini', category: '模型', summary: '以更低成本提供強大多模態能力，適合大量與高頻使用。', impact: '高品質 AI 更容易規模化。', source: 'https://openai.com/index/gpt-4o-mini-advancing-cost-efficient-intelligence/' },
  { date: '2024.09.12', title: 'OpenAI o1', category: '推理', summary: '在回答前投入更多推理計算，特別強化科學、數學與程式問題。', impact: '開啟「先思考、再回答」的推理模型路線。', source: 'https://openai.com/index/introducing-openai-o1-preview/' },
  { date: '2024.10.03', title: 'Canvas', category: '產品功能', summary: '在獨立工作區共同撰寫、改稿與修改程式碼。', impact: '對話開始演變成可編輯的工作介面。', source: 'https://openai.com/index/introducing-canvas/' },
  { date: '2024.10.31', title: 'ChatGPT Search', category: '代理工作', summary: '搜尋網路、整合即時資訊，並在回答中提供來源連結。', impact: '資訊檢索與生成式回答合流。', source: 'https://openai.com/index/introducing-chatgpt-search/' },
  { date: '2025.01.23', title: 'Operator', category: '代理工作', summary: '研究預覽中的代理可操作瀏覽器，代為處理網站上的步驟。', impact: 'ChatGPT 從回答問題走向操作介面。', source: 'https://openai.com/index/introducing-operator/' },
  { date: '2025.02.02', title: 'Deep Research', category: '代理工作', summary: '自主搜尋、閱讀與綜合大量網路來源，產出附引用的研究報告。', impact: '數十分鐘完成過去需要數小時的研究流程。', source: 'https://openai.com/index/introducing-deep-research/' },
  { date: '2025.02.27', title: 'GPT‑4.5', category: '模型', summary: '擴大預訓練規模，提升知識廣度、直覺、自然對話與可靠性。', impact: '與 o 系列形成「世界模型＋推理」雙軸。', source: 'https://openai.com/index/introducing-gpt-4-5/' },
  { date: '2025.04.14', title: 'GPT‑4.1 系列', category: '模型', summary: '強化程式、指令遵循與長上下文處理，主要面向 API 與開發者。', impact: '讓模型更適合可靠地嵌入產品流程。', source: 'https://openai.com/index/gpt-4-1/' },
  { date: '2025.04.16', title: 'o3 與 o4‑mini', category: '推理', summary: '推理模型可主動組合搜尋、Python、檔案與影像等工具。', impact: '「推理」與「執行」第一次大規模結合。', source: 'https://openai.com/index/introducing-o3-and-o4-mini/' },
  { date: '2025.08.07', title: 'GPT‑5', category: '模型', summary: '即時回答、深度推理與路由整合成統一系統，依任務自動決定思考深度。', impact: '使用者不必先理解每個模型的差異。', source: 'https://openai.com/index/introducing-gpt-5/' },
  { date: '2025.11', title: 'GPT‑5.1', category: '模型', summary: '調整對話語氣、指令遵循與自適應推理；簡單任務更快，困難任務更穩。', impact: '模型開始更細緻地配合使用者意圖。', source: 'https://help.openai.com/en/articles/6825453-chatgpt-release-notes' },
  { date: '2025.12.11', title: 'GPT‑5.2', category: '模型', summary: '強化長上下文、工具呼叫、視覺理解與專業知識工作。', impact: '文件、試算表、簡報與長流程任務更加成熟。', source: 'https://openai.com/index/introducing-gpt-5-2/' },
  { date: '2026.03.03', title: 'GPT‑5.3 Instant', category: '模型', summary: '提升日常對話的準確性、網路搜尋摘要、寫作品質與回覆流暢度。', impact: '模型迭代開始同時衡量能力與日常使用感受。', source: 'https://openai.com/index/gpt-5-3-instant/' },
  { date: '2026.03.05', title: 'GPT‑5.4', category: '推理', summary: '整合進階推理、程式與代理工作流，可先提出計畫並在執行中接受調整。', impact: '從一次性答案邁向可被引導的長程工作。', source: 'https://openai.com/index/introducing-gpt-5-4/' },
  { date: '2026.04.23', title: 'GPT‑5.5', category: '代理工作', summary: '提升代理程式開發、電腦操作、研究、資料分析與跨工具長流程能力。', impact: '使用者可交付較模糊的多步任務，由模型規劃、執行並檢查。', source: 'https://openai.com/index/introducing-gpt-5-5/' },
  { date: '2026.07.09', title: 'GPT‑5.6：Sol／Terra／Luna', category: '代理工作', summary: '以三種能力與成本層級服務 Chat、Work、Codex 與 API，強化電腦操作與成品製作。', impact: '模型從單一版本進化為可分工的工作家族。', source: 'https://openai.com/index/gpt-5-6/' },
  { date: '2026.09.03', title: 'GPT‑6 Astra', category: '代理工作', summary: '把推理、瀏覽、電腦操作、程式、研究與文件製作整合成端到端工作能力。', impact: '核心轉折：ChatGPT 從協助回答，走向協助完成。', source: 'https://openai.com/index/gpt-6-astra/' },
];

const curatedVideos = [
  {
    "id": "1QNsdr-Qx_I",
    "title": "Introducing GPT‑6 Astra",
    "zhTitle": "GPT‑6 Astra 官方介紹",
    "duration": "2:43",
    "creator": "OpenAI",
    "kind": "官方影片",
    "views": "",
    "language": "英文原聲",
    "start": 0,
    "note": "保留官方主宣傳片：先了解 GPT‑6 Astra 的產品定位，再看其他創作者的實際操作。"
  },
  {
    "id": "GGzT7zVrRTU",
    "title": "GPT-6 Astra Is Finally Here (And It’s REALLY Good)",
    "zhTitle": "讓 AI 操作 Blender 與 Unreal，做出可玩的 3D 世界",
    "duration": "19:31",
    "creator": "Matt Wolfe",
    "kind": "創作者實測",
    "views": "約 46 萬次觀看",
    "language": "英文原聲＋本站中文導讀",
    "start": 428,
    "note": "看點：遊戲原型、互動星球、Blender 角色建模與 Unreal 場景。建議從 07:08 的遊戲測試開始。成果與速度屬作者單次體驗，不代表每次都能重現。"
  },
  {
    "id": "Ju41cQSe7hY",
    "title": "I Spent 100 Hours Using GPT-6 Astra (This Feels Like AGI)",
    "zhTitle": "100 小時使用體驗：從建築 PDF 到 3D 遊戲與自我測試",
    "duration": "約 24 分鐘",
    "creator": "Riley Brown",
    "kind": "創作者實測",
    "views": "約 42 萬次觀看",
    "language": "英文原聲＋本站中文導讀",
    "start": 338,
    "note": "作者展示把建築 PDF 變成 Blender 模型與可玩地圖，並讓代理自行測試；05:38 起看遊戲成果、15:28 起看自我測試。「像 AGI」是作者感受，不是經驗證的技術結論。"
  },
  {
    "id": "WfJPBVXPt8k",
    "title": "I Tested GPT-6 Astra vs Fable 5.1 on 15 Real Use Cases",
    "zhTitle": "15 項真實工作對決：簡報、文案、網站與自動化",
    "duration": "38:35",
    "creator": "Nate Herk | AI Automation",
    "kind": "創作者比較實測",
    "views": "約 29 萬次觀看",
    "language": "英文原聲＋本站中文導讀",
    "start": 139,
    "note": "看點：相同任務比較 Astra 與 Fable 的交付成果、耗時及成本。02:19 起看顧問簡報，22:39 起看自動化；不是每項任務都由 Astra 勝出，適合判斷自己的工作是否受益。"
  },
  {
    "id": "UWdn0w-fbzQ",
    "title": "GPT-6 Astra 不是 AGI，但真的很猛，我燒了 2300 美金後的實測分享",
    "zhTitle": "中文實測：頻道官網、台北遊戲場景與真實帳單",
    "duration": "16:10",
    "creator": "Gary Chen",
    "kind": "創作者實測",
    "views": "約 11 萬次觀看",
    "language": "中文講解",
    "start": 330,
    "note": "05:30 起看頻道官網，08:30 起看台北版 GTA 原型，12:00 起談帳單。作者呈現成果也討論成本與監督限制；所述金額是他的測試支出，不是一般使用費用。"
  },
  {
    "id": "iucFoG6X-wk",
    "title": "GPT‑6 Astra 全方位實測：iOS App、Godot 4、CAD 與電腦自動化",
    "zhTitle": "中文開發實測：音樂播放器、背單字 App、CAD 與自動化",
    "duration": "18:50",
    "creator": "AI超元域",
    "kind": "創作者實測",
    "views": "約 11 萬次觀看",
    "language": "中文講解",
    "start": 0,
    "note": "作者以 Medium 推理設定測試音樂播放器、背單字 App、遊戲、CAD 與自動化，並展示開啟模擬器測試。聚焦可見成果；影片標題中的 AGI 與效率宣稱不視為本站結論。"
  }
];

const categoryIcons = { '模型': Cpu, '推理': BrainCircuit, '多模態': Eye, '產品功能': MessagesSquare, '代理工作': Bot };

const categories: Category[] = ['全部', '模型', '推理', '多模態', '產品功能', '代理工作'];
const periods: Period[] = ['全部年份', '2026', '2025', '2024', '2023', '2022', '2018–2021'];


function MilestoneVisual({ item }: { item: Milestone }) {
  const [failed, setFailed] = useState(false);
  const slug = item.title === 'GPT‑5.1' ? 'gpt-5-1' : item.title === '瀏覽與外掛' ? 'chatgpt-plugins' : item.source.split('/').filter(Boolean).at(-1) || '';
  const asset = (milestoneImages as Record<string, {url: string; source: string; label: string}>)[slug];
  return <figure className={`milestone-visual ${slug === 'language_understanding_paper.pdf' ? 'paper-visual' : ''}`}>
    {asset && !failed ? <img src={asset.url} alt={item.title + '：' + asset.label} width={960} height={540} loading="lazy" onError={() => setFailed(true)} /> :
      <div className="visual-fallback"><small>{item.date} · {item.category}</small><strong>{item.title}</strong></div>}
    <figcaption><span>{asset && !failed ? asset.label : '版本識別圖 · 本站設計'}</span><a href={asset?.source || item.source} target="_blank" rel="noreferrer">{asset ? '圖片來源' : '官方資料'} <ArrowUpRight size={13} /></a></figcaption>
  </figure>;
}


function AdoptionPanel({ period }: { period: Period }) {
  const selected = adoption.filter(item => period === '全部年份' || item.year === period);
  return <section className="adoption-panel" aria-label="各時期使用者與下載數據">
    <h3><Users size={22} /> 這個時期，有多少人使用 ChatGPT？</h3>
    <p className="metric-caution">以下是 ChatGPT 產品整體的歷史快照，不是單一 GPT 版本人數，也不是每年年底總量。下載次數不等於獨立使用者；不同期間、平台與口徑不可直接相加或計算成長率。</p>
    <div className="adoption-grid">{selected.map(item => <article className="adoption-card" key={item.year}>
      <h4>{item.year}</h4>
      <div className="metric"><span><Users size={17} /> 使用規模</span><strong>{item.users}</strong><p>{item.usersLabel}</p><a href={item.userSource} target="_blank" rel="noreferrer">{item.userPublisher} <ArrowUpRight size={14} /></a></div>
      <div className="metric"><span><Download size={17} /> App 下載</span><strong>{item.downloads}</strong><p>{item.downloadLabel}</p><a href={item.downloadSource} target="_blank" rel="noreferrer">{item.downloadPublisher} <ArrowUpRight size={14} /></a></div>
    </article>)}</div>
  </section>;
}

function MilestoneDetails({ item }: {item: Milestone}) {
  const detail = effects[milestones.indexOf(item)];
  const Icon = categoryIcons[item.category];
  return <div className="milestone-body"><div className="milestone-top"><span className="tag"><Icon size={17} aria-hidden="true" />{item.category}</span><a href={item.source} target="_blank" rel="noreferrer" aria-label={`查看 ${item.title} 官方來源`}><ArrowUpRight size={18} /></a></div><h3>{item.title}</h3><p>{item.summary}</p>
    <div className="impact"><span><ArrowRightLeft size={16} /> 關鍵轉變</span><strong>{detail.transition}</strong></div>
    <div className="user-effect"><span><TrendingUp size={16} /> 對使用者的影響</span><p>{detail.effect}</p><small>依功能整理的應用解讀，非量化成效保證。</small></div>
  </div>;
}

export default function Home() {
  const [category, setCategory] = useState<Category>('全部');
  const [period, setPeriod] = useState<Period>('全部年份');
  const [query, setQuery] = useState('');
  const [activeVideo, setActiveVideo] = useState(0);
  const filtered = useMemo(() => milestones.filter((item) => {
    const year = Number(item.date.slice(0, 4));
    const periodMatch = period === '全部年份' || (period === '2018–2021' ? year <= 2021 : item.date.startsWith(period));
    return periodMatch && (category === '全部' || item.category === category) && `${item.title}${item.summary}${item.impact}${effects[milestones.indexOf(item)].transition}${effects[milestones.indexOf(item)].effect}${item.date}`.toLowerCase().includes(query.toLowerCase().trim());
  }).sort((a, b) => b.date.localeCompare(a.date)), [category, period, query]);

  return <main>
    <nav className="topbar" aria-label="主要導覽">
      <a className="brand" href="#top"><span className="brand-mark">6</span><span>ChatGPT Evolution</span></a>
      <div className="nav-links"><a href="#timeline">發展時間軸</a><a href="#astra">GPT‑6 Astra</a><a href="#videos">影片實測</a><a href="#sources">研究說明</a></div>
    </nav>

    <div className="year-nav" aria-label="依年份查看發展歷史">
      <span>選擇年份</span>
      <div>{periods.map((item) => <button key={item} onClick={() => { setPeriod(item); document.querySelector('#timeline')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }} aria-pressed={period === item} className={period === item ? 'selected' : ''}>{item}</button>)}</div>
    </div>

    <div className="spotlight">
    <header className="hero chapter" id="top">
      <div className="eyebrow">2018—2026 · GPT 發展紀錄</div>
      <h1>GPT‑6 Astra</h1>
      <p>先看官方介紹，再看高觀看數的實際使用體驗。<br />往下探索 ChatGPT 從對話走向完成工作的歷程。</p>
    </header>

    <section className="video-section" id="videos"><div className="chapter video-inner"><div className="section-heading light-heading"><div><div className="kicker light">官方介紹＋熱門實測 · 繁體中文導讀</div><h2>1 支官方介紹＋5 支實作體驗</h2></div><p>保留第一支官方介紹，其餘改為高觀看數創作者實測，包含兩支中文講解。觀看數為 2026.09.09 YouTube 顯示的約數，非全站排名；人氣不等於成效保證。</p></div><div className="video-stage"><div className="player-wrap"><iframe src={`https://www.youtube-nocookie.com/embed/${curatedVideos[activeVideo].id}?hl=zh-TW&cc_lang_pref=zh-Hant`} title={curatedVideos[activeVideo].zhTitle} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div><div className="video-info"><span>{curatedVideos[activeVideo].kind} · {curatedVideos[activeVideo].duration}</span><h3>{curatedVideos[activeVideo].zhTitle}</h3><div className="original-title">{curatedVideos[activeVideo].creator} · {curatedVideos[activeVideo].language}</div><div className="video-popularity">{curatedVideos[activeVideo].views}{curatedVideos[activeVideo].views && " · 2026.09.09 查核"}</div><p>{curatedVideos[activeVideo].note}</p>{curatedVideos[activeVideo].start > 0 && <a href={`https://www.youtube.com/watch?v=${curatedVideos[activeVideo].id}&t=${curatedVideos[activeVideo].start}s`} target="_blank" rel="noreferrer">直接看實作段落 <Play size={16} /></a>}<a href={`https://www.youtube.com/watch?v=${curatedVideos[activeVideo].id}`} target="_blank" rel="noreferrer">在 YouTube 開啟 <ArrowUpRight size={16} /></a></div></div><div className="video-playlist">{curatedVideos.map((video, index) => <button key={video.id} className={activeVideo === index ? 'playing' : ''} aria-pressed={activeVideo === index} onClick={() => setActiveVideo(index)}><span className="video-index">{String(index + 1).padStart(2, '0')}</span><span className="video-thumb"><img src={`https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`} alt="" width={320} height={180} /><i><Play size={15} fill="currentColor" /></i></span><span className="video-title"><strong>{video.zhTitle}</strong><small>{video.creator} · {video.duration}</small><small>{video.views || video.kind}</small></span></button>)}</div></div></section>

    </div>
    <section className="astra-section" id="astra">
      <div className="astra-intro"><div className="kicker light">01 · 功能介紹</div><h2>GPT‑6 Astra<br />不只是更會回答</h2><p>OpenAI 的正式名稱是 <strong>GPT‑6 Astra</strong>；在 ChatGPT 的高階方案中則以 <strong>GPT‑6 Pro</strong> 提供。它把理解、推理、工具與電腦操作串成一條可執行的工作流程。</p><a href="https://openai.com/index/gpt-6-astra/" target="_blank" rel="noreferrer">閱讀官方發布 <ArrowUpRight size={18} /></a></div>
      <div className="capability-grid"><div className="capability featured"><WandSparkles /><span>核心轉變</span><h3>從「給答案」到「交成果」</h3><p>能在長流程中閱讀資料、操作工具、建立網站或文件，並依回饋調整方向。</p></div><div className="capability"><Search /><h3>研究與瀏覽</h3><p>跨來源搜尋、閱讀、整理，保留與任務真正相關的脈絡。</p></div><div className="capability"><Bot /><h3>電腦操作</h3><p>處理表單、CRM、行事曆、專業軟體與前端品質檢查。</p></div><div className="capability"><BookOpen /><h3>專業成品</h3><p>依模板建立文件、試算表、簡報與分析，不只輸出文字草稿。</p></div><div className="capability"><BrainCircuit /><h3>程式與科學</h3><p>面向複雜軟體工程、科學資料分析與長程技術工作。</p></div><div className="capability"><ShieldCheck /><h3>安全與邊界</h3><p>加強任務範圍遵循與監控；高風險資安能力受到額外限制。</p></div></div>
    </section>

    <section className="chapter service-section"><div className="section-heading"><div><div className="kicker">02 · 產品與服務</div><h2>GPT‑6 Astra 在哪裡提供服務？</h2></div><p>同一個核心模型，會依產品、方案、管理權限與逐步開放進度而有不同入口。</p></div><div className="service-grid"><article><span>CHAT</span><h3>ChatGPT 的 GPT‑6 Pro</h3><p>提供高難度問答與長程推理；依方案有不同使用額度，且採逐步開放。</p></article><article><span>WORK</span><h3>ChatGPT Work</h3><p>把研究、文件、試算表、簡報與網站製作串成完整工作，適合端到端任務。</p></article><article><span>CODEX</span><h3>程式與電腦工作</h3><p>理解程式碼、操作工具、執行測試與長期任務，並能在必要時向使用者提問。</p></article><article><span>API</span><h3>開發者整合</h3><p>以 <code>gpt-6-astra</code> 透過 Responses API 建立具工具能力的應用與代理。</p></article></div><div className="service-note"><Clock3 size={20} /><div><strong>可用性會變動</strong><p>截至 2026 年 9 月 8 日，GPT‑6 Astra 仍處於逐步開放階段；實際能否選用，仍以帳號方案與工作區設定為準。</p></div></div></section>

    <section className="chapter timeline-section" id="timeline">
      <div className="section-heading"><div><div className="kicker">03 · 發展時間軸</div><h2>最新在上：每一次迭代改變了什麼？</h2></div><p>由 GPT‑6 Astra 往回閱讀。點選上方年份，就能聚焦查看該時段發生的重要版本與產品變化。</p></div>
      <AdoptionPanel period={period} />
      <div className="filters"><div className="search-box"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜尋版本或功能" aria-label="搜尋版本或功能" /></div><div className="filter-tabs">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} aria-pressed={category === item} className={category === item ? 'selected' : ''}>{item}</button>)}</div></div>
      <div className="timeline-count">顯示 {filtered.length} / {milestones.length} 個重要節點</div>
      {filtered.length === 0 && <output className="empty-state">這個條件沒有符合的節點，請切換年份、分類或搜尋文字。</output>}<div className="timeline-list">{filtered.map((item, index) => <article className={`milestone ${item.title === 'GPT‑6 Astra' ? 'milestone-astra' : ''}`} key={item.date + item.title}><MilestoneVisual item={item} /><div className="milestone-date"><span>{item.date}</span><i>{String(index + 1).padStart(2, '0')}</i></div><MilestoneDetails item={item} /></article>)}</div>
    </section>

    <section className="chapter sources-section" id="sources"><div className="source-card"><div><Film /><span>研究口徑</span><h2>如何選擇版本、圖片與實測影片？</h2></div><div className="source-rules"><p><strong>版本：</strong>收錄會改變能力、使用方式或服務模式的主要模型與產品節點；不把每次介面微調都算成一個世代。</p><p><strong>影片：</strong>第一支為 OpenAI 官方影片；第 2–6 支為創作者實測（非官方），以可見成果、實用性與觀看數篩選，含中文講解。中文導讀依影片說明、章節及可查核資料整理，未宣稱已重現所有成果。</p><p><strong>圖片：</strong>優先使用對應公告的 OpenAI 官方發布圖；無可用圖片時顯示本站版本識別圖。圖片與商標權利歸原權利人所有。</p><p><strong>時效：</strong>方案、額度與開放狀態可能改變，網站資料以 2026 年 9 月 8 日查核結果為準。</p></div></div><div className="source-links"><a href="https://help.openai.com/en/articles/6825453-chatgpt-release-notes" target="_blank" rel="noreferrer">ChatGPT Release Notes <ArrowUpRight /></a><a href="https://help.openai.com/en/articles/9624314-model-release-notes" target="_blank" rel="noreferrer">Model Release Notes <ArrowUpRight /></a><a href="https://openai.com/index/gpt-6-astra/" target="_blank" rel="noreferrer">GPT‑6 Astra 發布頁 <ArrowUpRight /></a><a href="https://developers.openai.com/api/docs/models/gpt-6-astra" target="_blank" rel="noreferrer">GPT‑6 Astra 模型文件 <ArrowUpRight /></a></div></section>

    <footer><div><span className="brand-mark small">6</span><strong>ChatGPT Evolution</strong></div><p>非 OpenAI 官方網站。內容依 OpenAI 公開資料整理，所有商標與影片屬原權利人所有。</p><a href="#top">回到頁首 ↑</a></footer>
  </main>;
}
