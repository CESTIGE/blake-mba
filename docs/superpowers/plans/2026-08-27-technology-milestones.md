# Technology Milestones Interactive Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone BLAKE-branded page at `/technology-milestones/` with ten sourced era modules, founder portraits, and independently revealable era-dividend explanations.

**Architecture:** A semantic static HTML document owns all readable content and source links. A page-scoped stylesheet owns the alternating desktop timeline and single-column responsive presentation, while a small dependency-free module progressively enhances dividend reveal controls and mini-navigation state. Portraits are local assets with source metadata documented in the page.

**Tech Stack:** Static HTML5, CSS, browser JavaScript, Node.js built-in test runner, local static HTTP server, Browser/IAB visual QA.

**Spec:** `docs/superpowers/specs/2026-08-27-technology-milestones-design.md`

## Global Constraints

- Create `/technology-milestones/` without adding it to the shared navigation or `sitemap.xml`.
- Preserve all six milestones from the supplied reference and expand the page to exactly ten modules.
- Each module includes era, companies, founders, portraits, achievements, a hidden dividend reveal, and public sources.
- Use only traceable public portrait sources; store approved files locally under `assets/technology-milestones/`.
- Follow the BLAKE deep-navy, warm-paper, coral visual system.
- Support keyboard use, visible focus, 44px controls, reduced motion, and no horizontal document overflow.
- Do not deploy.

---

### Task 1: Research Ledger and Full-Page Visual Concept

**Files:**
- Create: `assets/technology-milestones/sources.md`
- Create: `.sites-preview/technology-milestones-concept.png`

**Interfaces:**
- Consumes: the ten approved milestone labels in the design spec.
- Produces: one verified facts-and-portrait ledger and one complete visual reference used by Tasks 2–5.

- [ ] **Step 1: Build the source ledger**

Record every company, founder role, achievement claim, dividend claim, portrait file name, source page, image page, license, and attribution in this exact table shape:

```markdown
| Era | Company | Person and role | Achievement source | Portrait file | Image source and license |
| --- | --- | --- | --- | --- | --- |
| 1977–1981 | Apple | Steve Jobs, co-founder | https://www.apple.com/stevejobs/ | steve-jobs.jpg | source URL; license/usage note |
```

Use primary company history/product pages for claims where available and Wikimedia Commons file pages for portraits when official media files are unavailable. Do not write a claim into the page unless it has a corresponding ledger row.

- [ ] **Step 2: Download and inspect founder portraits**

Save the selected image files under `assets/technology-milestones/`, retain useful facial resolution, and record intrinsic dimensions. Open the contact sheet or individual images to confirm the correct person, acceptable crop, and no corrupt files.

- [ ] **Step 3: Generate the approved-page concept**

Use Image Gen to create a complete desktop concept showing the hero, ten alternating era modules, portrait clusters, source treatment, and closed/open dividend states in the BLAKE token system. Save the accepted concept as `.sites-preview/technology-milestones-concept.png`.

- [ ] **Step 4: Verify the concept against the spec**

Use `view_image` and confirm: ten modules are visible as ten chapters; the era number is the main scan anchor; portraits are subordinate to the story; coral is reserved for interaction; closed dividends are visibly discoverable; and the page avoids neon/glass styling.

- [ ] **Step 5: Commit the research ledger and approved assets**

```powershell
git add -- assets/technology-milestones
git commit -m "content: source technology milestone portraits"
```

### Task 2: Semantic Page and Ten-Milestone Contract

**Files:**
- Create: `tests/technology-milestones.test.mjs`
- Create: `technology-milestones/index.html`

**Interfaces:**
- Consumes: local portrait file names and verified copy from `assets/technology-milestones/sources.md`.
- Produces: `[data-milestone]`, `[data-dividend-toggle]`, `[data-dividend-panel]`, and `#era-01` through `#era-10` elements used by Tasks 3–5.

- [ ] **Step 1: Write the failing page contract test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { read } from "./helpers/site-files.mjs";

test("technology milestones preserves the reference and expands it to ten sourced modules", () => {
  const html = read("technology-milestones/index.html");
  assert.equal((html.match(/data-milestone=/g) ?? []).length, 10);
  for (const era of ["1977–1981", "1995–1998", "2004", "2007–2010", "2018–2021", "2022–2025"]) {
    assert.match(html, new RegExp(era));
  }
  assert.match(html, /Microsoft/);
  assert.match(html, /Adobe/);
  assert.match(html, /Netflix/);
  assert.match(html, /Spotify/);
  assert.equal((html.match(/data-dividend-toggle/g) ?? []).length, 10);
  assert.equal((html.match(/class="milestone-sources"/g) ?? []).length, 10);
});

test("technology milestones remains a standalone unindexed showcase", () => {
  const sitemap = read("sitemap.xml");
  const siteJs = read("assets/site.js");
  assert.doesNotMatch(sitemap, /technology-milestones/);
  assert.doesNotMatch(siteJs, /technology-milestones/);
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node --test tests/technology-milestones.test.mjs`

Expected: FAIL because `technology-milestones/index.html` does not exist.

- [ ] **Step 3: Implement the semantic page shell and all content**

Create a single-H1 document with shared favicon, analytics, BLAKE header/footer, page-scoped CSS/JS links, a hero, a ten-link `<nav aria-label="年代快速導覽">`, and exactly ten `<article class="milestone" data-milestone id="era-01">` modules. Each article includes:

```html
<button class="dividend-toggle" type="button" data-dividend-toggle
  aria-expanded="false" aria-controls="dividend-01">
  <span>這一代吃到什麼紅利？</span><span data-toggle-label>點擊揭曉</span>
</button>
<div class="dividend-panel" id="dividend-01" data-dividend-panel>
  <p class="dividend-name">個人電腦硬體普及紅利</p>
  <p>晶片成本下降與家庭、辦公室需求同步成長，讓軟硬體第一次進入大眾市場。</p>
</div>
```

Every local raster `<img>` includes `width`, `height`, `loading="lazy"`, `decoding="async"`, and person-specific `alt` text. Include public claim and portrait source links inside `.milestone-sources`. Dividend content starts readable in raw HTML; the enhancement script applies the initial collapsed state only after it initializes, so a no-JavaScript reader does not lose content.

- [ ] **Step 4: Run the focused and integrity tests**

Run: `node --test tests/technology-milestones.test.mjs tests/site-integrity.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit semantic content**

```powershell
git add -- technology-milestones/index.html tests/technology-milestones.test.mjs
git commit -m "feat: add sourced technology milestones page"
```

### Task 3: Progressive Dividend Reveal Interaction

**Files:**
- Modify: `tests/technology-milestones.test.mjs`
- Create: `assets/technology-milestones.js`

**Interfaces:**
- Consumes: the page hooks from Task 2.
- Produces: `setDividendState(toggle, panel, expanded)` and `initializeMilestones(root = document)` for browser use and direct unit testing.

- [ ] **Step 1: Add failing interaction contract tests**

```js
test("reveal script exposes accessible independent state updates", () => {
  const script = read("assets/technology-milestones.js");
  assert.match(script, /function setDividendState\(/);
  assert.match(script, /aria-expanded/);
  assert.match(script, /panel\.hidden/);
  assert.match(script, /展開紅利/);
  assert.match(script, /收起紅利/);
  assert.doesNotMatch(script, /querySelectorAll\([^)]*\)\[0\]/);
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node --test tests/technology-milestones.test.mjs`

Expected: FAIL because `assets/technology-milestones.js` does not exist.

- [ ] **Step 3: Implement independent reveal controls**

```js
function setDividendState(toggle, panel, expanded) {
  toggle.setAttribute("aria-expanded", String(expanded));
  panel.hidden = !expanded;
  const label = toggle.querySelector("[data-toggle-label]");
  if (label) label.textContent = expanded ? "收起紅利" : "展開紅利";
}

function initializeMilestones(root = document) {
  root.querySelectorAll("[data-dividend-toggle]").forEach((toggle) => {
    const panel = root.getElementById(toggle.getAttribute("aria-controls"));
    if (!panel) return;
    setDividendState(toggle, panel, false);
    toggle.addEventListener("click", () => {
      setDividendState(toggle, panel, toggle.getAttribute("aria-expanded") !== "true");
    });
  });
}

if (typeof document !== "undefined") initializeMilestones();
export { initializeMilestones, setDividendState };
```

- [ ] **Step 4: Run focused tests**

Run: `node --test tests/technology-milestones.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit interaction**

```powershell
git add -- assets/technology-milestones.js tests/technology-milestones.test.mjs
git commit -m "feat: reveal milestone dividends accessibly"
```

### Task 4: BLAKE Timeline Styling and Responsive Contract

**Files:**
- Modify: `tests/technology-milestones.test.mjs`
- Create: `assets/technology-milestones.css`

**Interfaces:**
- Consumes: accepted concept and semantic class names from Task 2.
- Produces: desktop alternating timeline, mobile reading order, portrait clusters, reveal states, focus treatment, and reduced-motion behavior.

- [ ] **Step 1: Add failing CSS contract tests**

```js
test("milestone styles include responsive, focus and reduced-motion contracts", () => {
  const css = read("assets/technology-milestones.css");
  assert.match(css, /--milestone-ink:\s*#0b1d2a/i);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node --test tests/technology-milestones.test.mjs`

Expected: FAIL because the stylesheet does not exist.

- [ ] **Step 3: Implement design tokens and primary layout**

Define `--milestone-ink: #0b1d2a`, `--milestone-paper: #f3eee5`, `--milestone-coral: #ff6534`, `--milestone-blue: #3153d8`, `--milestone-mint: #a8d9cf`; then implement a dark editorial hero, sticky mini-navigation, central timeline spine, alternating `.milestone:nth-child(even)` layouts, readable paper cards, portrait clusters, and clearly locked dividend controls.

- [ ] **Step 4: Implement responsive and accessibility states**

At `1020px`, simplify the alternating grid; at `760px`, move the spine left and stack every module; at `340px`, use 16px gutters. Add visible focus rings, minimum 44px controls, `overflow-wrap: anywhere` for sources, and remove transitions under `prefers-reduced-motion: reduce`.

- [ ] **Step 5: Run focused and full tests**

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 6: Commit visual implementation**

```powershell
git add -- assets/technology-milestones.css tests/technology-milestones.test.mjs
git commit -m "style: build editorial milestone timeline"
```

### Task 5: Browser Fidelity, Interaction, and Native-Size QA

**Files:**
- Modify: `technology-milestones/index.html`
- Modify: `assets/technology-milestones.css`
- Modify: `assets/technology-milestones.js`
- Modify: `tests/technology-milestones.test.mjs`

**Interfaces:**
- Consumes: completed page, accepted concept, and all prior contracts.
- Produces: agency-signoff browser result with documented desktop/mobile screenshots and verified core interaction.

- [ ] **Step 1: Start a local server and open the page in Browser/IAB**

Run a local static server from the repository root and open `/technology-milestones/`. Confirm the document and every CSS, JS, and portrait request returns 200.

- [ ] **Step 2: Verify the core interaction path**

Using the browser, activate the hero era navigation, open dividend modules 1 and 10, confirm both remain open independently, close module 1, and keyboard-tab through the controls. Confirm labels and `aria-expanded` reflect each state.

- [ ] **Step 3: Capture native-size desktop and mobile screenshots**

Capture at least one wide desktop viewport and 390px mobile viewport. Inspect 320, 360, 390, 430, 760, and 1020 widths for horizontal overflow, portrait cropping, timeline alignment, source wrapping, and 44px touch targets.

- [ ] **Step 4: Compare concept and implementation with `view_image`**

Open `.sites-preview/technology-milestones-concept.png` and the latest implementation screenshots. Compare hero hierarchy, ten-chapter rhythm, timeline spine, portrait treatment, closed/open dividend states, source hierarchy, mobile reading order, and BLAKE palette. Fix every material mismatch and repeat the comparison.

- [ ] **Step 5: Run final verification**

Run: `npm test`

Expected: all tests PASS with no skipped milestone tests.

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 6: Commit final QA fixes**

```powershell
git add -- technology-milestones/index.html assets/technology-milestones.css assets/technology-milestones.js tests/technology-milestones.test.mjs
git commit -m "fix: finish technology milestones responsive QA"
```
