const content = {
  technology: {
    "1977": {
      kicker: "個人電腦｜1977",
      title: "運算走上個人桌面",
      copy: "微處理器與個人電腦降低運算門檻，軟體第一次能面向大規模個人市場。",
      points: ["微處理器", "個人軟體", "桌面生態"],
      visualLevel: "1977",
      visualWord: "桌面",
    },
    "1995": {
      kicker: "網際網路｜1995",
      title: "資訊開始彼此連線",
      copy: "瀏覽器與公開網路把內容、交易和溝通接在一起，市場從所在地延伸到全世界。",
      points: ["全球連線", "搜尋入口", "數位交易"],
      visualLevel: "1995",
      visualWord: "連線",
    },
    "2007": {
      kicker: "智慧手機｜2007",
      title: "運算進入口袋",
      copy: "行動網路、定位與觸控介面成熟，服務開始圍繞每個人的即時情境運作。",
      points: ["行動運算", "位置服務", "應用程式生態"],
      visualLevel: "2007",
      visualWord: "行動",
    },
    "2022": {
      kicker: "生成式 AI｜2022",
      title: "自然語言成為新介面",
      copy: "模型開始生成文字、圖像與程式碼，人不只操作軟體，也能直接描述目標與成果。",
      points: ["自然語言", "內容生成", "代理工作流"],
      visualLevel: "2022",
      visualWord: "生成",
    },
  },
  agi: {
    L1: {
      kicker: "L1｜對話者",
      title: "理解並回應語言",
      copy: "能進行自然語言對話、整理與改寫內容，是多數人最熟悉的 AI 使用方式。",
      points: ["理解指令", "生成回應", "多輪對話"],
      visualLevel: "L1",
      visualWord: "對話",
    },
    L2: {
      kicker: "L2｜推理者",
      title: "比較選項並形成判斷",
      copy: "能拆解複雜問題、檢查假設，並說明在不同條件下如何得到結論。",
      points: ["拆解問題", "比較證據", "形成結論"],
      visualLevel: "L2",
      visualWord: "推理",
    },
    L3: {
      kicker: "L3｜行動者",
      title: "從回答走向執行",
      copy: "能自主規劃並執行多步驟任務，調用工具、整合資訊，再把結果交回人類驗收。",
      points: ["理解目標", "制定計畫", "執行與回饋"],
      visualLevel: "L3",
      visualWord: "執行",
    },
    L4: {
      kicker: "L4｜創新者",
      title: "產生原創且可驗證的成果",
      copy: "不只重組既有答案，也能結合需求、技術與限制，提出新的方法或設計。",
      points: ["跨域組合", "提出新解", "驗證價值"],
      visualLevel: "L4",
      visualWord: "創新",
    },
    L5: {
      kicker: "L5｜組織者",
      title: "協調整個組織",
      copy: "能規劃目標、分配資源、協調多個角色並追蹤成果，人類則設定邊界與治理。",
      points: ["規劃目標", "協調角色", "追蹤成果"],
      visualLevel: "L5",
      visualWord: "組織",
    },
  },
  work: {
    ai: {
      kicker: "AI 接手的狀態",
      title: "可標準化、可預測的任務",
      copy: "AI 適合處理整理、摘要、模式偵測與重複流程，讓人的注意力回到例外與決策。",
      points: ["整理與摘要", "模式偵測", "重複流程"],
      visualLevel: "AI",
      visualWord: "接手",
    },
    human: {
      kicker: "人類承擔的狀態",
      title: "需要情境、信任與後果的工作",
      copy: "人類仍需定義問題、處理例外、建立關係，並對部署方式與最終決策負責。",
      points: ["定義問題", "建立信任", "承擔後果"],
      visualLevel: "HUMAN",
      visualWord: "承擔",
    },
  },
};

export function createDeckState() {
  return { technology: "2007", agi: "L3", work: "ai" };
}

export function getDeckContent(moduleName, option) {
  const selected = content[moduleName]?.[option];
  if (!selected) return null;
  return { ...selected, points: [...selected.points] };
}

export function selectDeckOption(current, moduleName, option) {
  if (!getDeckContent(moduleName, option)) return { ...current };
  return { ...current, [moduleName]: option };
}

function renderModule(module, option) {
  const moduleName = module.dataset.deckModule;
  const selected = getDeckContent(moduleName, option);
  const panel = module.querySelector('[role="tabpanel"]');
  if (!selected) return;

  module.dataset.active = option;
  module.querySelectorAll("[data-option]").forEach((button) => {
    const active = button.dataset.option === option;
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
    if (active && panel) panel.setAttribute("aria-labelledby", button.id);
  });

  const kicker = module.querySelector("[data-output-kicker]");
  const title = module.querySelector("[data-output-title]");
  const copy = module.querySelector("[data-output-copy]");
  const points = module.querySelector("[data-output-points]");
  const visualLevel = module.querySelector("[data-visual-level]");
  const visualWord = module.querySelector("[data-visual-word]");

  if (kicker) kicker.textContent = selected.kicker;
  if (title) title.textContent = selected.title;
  if (copy) copy.textContent = selected.copy;
  if (points) {
    points.replaceChildren(...selected.points.map((point) => {
      const item = document.createElement("li");
      item.textContent = point;
      return item;
    }));
  }
  if (visualLevel) visualLevel.textContent = selected.visualLevel;
  if (visualWord) visualWord.textContent = selected.visualWord;
}

function initialiseDeck() {
  let state = createDeckState();

  document.querySelectorAll("[data-deck-module]").forEach((module) => {
    const moduleName = module.dataset.deckModule;
    const buttons = [...module.querySelectorAll("[data-option]")];
    renderModule(module, state[moduleName]);

    buttons.forEach((button, index) => {
      button.addEventListener("click", () => {
        state = selectDeckOption(state, moduleName, button.dataset.option);
        renderModule(module, state[moduleName]);
      });

      button.addEventListener("keydown", (event) => {
        const directions = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
        let nextIndex = index;
        if (event.key in directions) nextIndex = (index + directions[event.key] + buttons.length) % buttons.length;
        else if (event.key === "Home") nextIndex = 0;
        else if (event.key === "End") nextIndex = buttons.length - 1;
        else return;

        event.preventDefault();
        buttons[nextIndex].focus();
        buttons[nextIndex].click();
      });
    });
  });

  const workTabs = document.querySelector(".work-switch");
  const narrowWorkLayout = window.matchMedia("(max-width: 430px)");
  const syncWorkOrientation = () => {
    workTabs?.setAttribute("aria-orientation", narrowWorkLayout.matches ? "vertical" : "horizontal");
  };
  syncWorkOrientation();
  narrowWorkLayout.addEventListener?.("change", syncWorkOrientation);
  document.documentElement.classList.add("deck-ready");
}

if (typeof document !== "undefined") initialiseDeck();
