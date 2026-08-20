import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const minimumContrast = 4.5;

function normalizeSelector(selector) {
  return selector.replace(/\s+/g, " ").trim();
}

function parseStylesheet(file) {
  const css = readFileSync(new URL(`../${file}`, import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const rules = new Map();
  let cursor = 0;

  while (cursor < css.length) {
    const openingBrace = css.indexOf("{", cursor);
    if (openingBrace < 0) break;
    const prelude = css.slice(cursor, openingBrace).trim();
    let depth = 1;
    let closingBrace = openingBrace + 1;
    while (closingBrace < css.length && depth > 0) {
      if (css[closingBrace] === "{") depth += 1;
      if (css[closingBrace] === "}") depth -= 1;
      closingBrace += 1;
    }
    assert.equal(depth, 0, `Unbalanced CSS braces in ${file}`);
    const body = css.slice(openingBrace + 1, closingBrace - 1);
    cursor = closingBrace;

    if (prelude.startsWith("@")) continue;
    const declarations = new Map();
    for (const declaration of body.split(";")) {
      const separator = declaration.indexOf(":");
      if (separator < 0) continue;
      const property = declaration.slice(0, separator).trim();
      const value = declaration.slice(separator + 1).trim();
      if (property && value) declarations.set(property, value);
    }

    for (const selector of prelude.split(",")) {
      const normalized = normalizeSelector(selector);
      const rule = rules.get(normalized) ?? new Map();
      for (const [property, value] of declarations) rule.set(property, value);
      rules.set(normalized, rule);
    }
  }

  const variables = rules.get(":root") ?? new Map();
  return { rules, variables };
}

function declaration(stylesheet, selector, property) {
  const value = stylesheet.rules.get(normalizeSelector(selector))?.get(property);
  assert.ok(value, `Missing ${property} declaration for ${selector}`);
  return value;
}

function resolveVariable(value, variables) {
  const match = value.match(/^var\((--[^),\s]+)\)$/);
  if (!match) return value;
  const resolved = variables.get(match[1]);
  assert.ok(resolved, `Missing CSS variable ${match[1]}`);
  return resolveVariable(resolved, variables);
}

function parseColor(value, variables) {
  const resolved = resolveVariable(value, variables);
  const hex = resolved.match(/^#([\da-f]{3}|[\da-f]{6})$/i)?.[1];
  if (hex) {
    const expanded = hex.length === 3 ? [...hex].map((digit) => digit.repeat(2)).join("") : hex;
    return {
      red: Number.parseInt(expanded.slice(0, 2), 16),
      green: Number.parseInt(expanded.slice(2, 4), 16),
      blue: Number.parseInt(expanded.slice(4, 6), 16),
      alpha: 1,
    };
  }

  const functional = resolved.match(/^rgba?\(([^)]+)\)$/i)?.[1];
  assert.ok(functional, `Unsupported CSS color ${resolved}`);
  const channels = functional.split(",").map((channel) => Number.parseFloat(channel.trim()));
  assert.ok(channels.length === 3 || channels.length === 4, `Invalid CSS color ${resolved}`);
  return {
    red: channels[0],
    green: channels[1],
    blue: channels[2],
    alpha: channels[3] ?? 1,
  };
}

function composite(foreground, background) {
  assert.equal(background.alpha, 1, "Contrast fixtures require an opaque background");
  const alpha = foreground.alpha;
  return {
    red: foreground.red * alpha + background.red * (1 - alpha),
    green: foreground.green * alpha + background.green * (1 - alpha),
    blue: foreground.blue * alpha + background.blue * (1 - alpha),
    alpha: 1,
  };
}

function relativeLuminance(color) {
  const channel = (value) => {
    const srgb = value / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(color.red) + 0.7152 * channel(color.green) + 0.0722 * channel(color.blue);
}

function contrastRatio(foreground, background) {
  const renderedForeground = composite(foreground, background);
  const luminances = [relativeLuminance(renderedForeground), relativeLuminance(background)].sort((a, b) => b - a);
  return (luminances[0] + 0.05) / (luminances[1] + 0.05);
}

const cases = [
  {
    name: "AI transform primary CTA",
    file: "assets/ai-transform.css",
    foreground: [".transform-button-primary", "color"],
    background: [".transform-button-primary", "background"],
  },
  {
    name: "AI transform urgency eyebrow",
    file: "assets/ai-transform.css",
    foreground: [".urgency-section .transform-eyebrow", "color"],
    background: [".urgency-section", "background"],
  },
  {
    name: "AI transform urgency explanation",
    file: "assets/ai-transform.css",
    foreground: [".urgency-section p", "color"],
    background: [".urgency-section", "background"],
  },
  {
    name: "AI transform urgency list detail",
    file: "assets/ai-transform.css",
    foreground: [".urgency-section li span", "color"],
    background: [".urgency-section", "background"],
  },
  {
    name: "AI transform blue-card explanation",
    file: "assets/ai-transform.css",
    foreground: [".problem-card-accent .problem-copy p", "color"],
    background: [".problem-card-accent", "background"],
  },
  {
    name: "AI transform muted copy on mint",
    file: "assets/ai-transform.css",
    foreground: [".section-heading>p", "color"],
    background: [".method-section", "background"],
  },
  {
    name: "AI transform muted copy on paper",
    file: "assets/ai-transform.css",
    foreground: [".split-heading>p", "color"],
    background: [".problem-section", "background"],
  },
  {
    name: "AI transform eyebrow on paper",
    file: "assets/ai-transform.css",
    foreground: [".problem-section .transform-eyebrow", "color"],
    background: [".problem-section", "background"],
  },
  {
    name: "AI transform eyebrow on mint",
    file: "assets/ai-transform.css",
    foreground: [".method-section .transform-eyebrow", "color"],
    background: [".method-section", "background"],
  },
  {
    name: "AI transform funding year badge",
    file: "assets/ai-transform.css",
    foreground: [".funding-card-head strong", "color"],
    background: [".funding-card-head strong", "background"],
  },
  {
    name: "AI transform method step number",
    file: "assets/ai-transform.css",
    foreground: [".method-grid li>span", "color"],
    background: [".method-section", "background"],
  },
  {
    name: "AI transform solution label",
    file: "assets/ai-transform.css",
    foreground: [".solution-copy small", "color"],
    background: [".problem-section", "background"],
  },
  {
    name: "choice eyebrow on paper",
    file: "assets/choice-over-effort.css",
    foreground: [".eyebrow", "color"],
    background: [".story-section", "background"],
  },
  {
    name: "choice eyebrow on paper-2",
    file: "assets/choice-over-effort.css",
    foreground: [".eyebrow", "color"],
    background: [".curriculum-section", "background"],
  },
  {
    name: "choice blue-card explanation",
    file: "assets/choice-over-effort.css",
    foreground: [".module-card-blue p", "color"],
    background: [".module-card-blue", "background"],
  },
  {
    name: "choice muted body copy on paper",
    file: "assets/choice-over-effort.css",
    foreground: [".split-heading > p", "color"],
    background: [".story-section", "background"],
  },
  {
    name: "choice course-material caption on paper",
    file: "assets/choice-over-effort.css",
    foreground: [".hero-course-card figcaption span", "color"],
    background: [".hero-course-card", "background"],
  },
  {
    name: "choice story-timeline label on paper",
    file: "assets/choice-over-effort.css",
    foreground: [".story-timeline small", "color"],
    background: [".story-section", "background"],
  },
  {
    name: "choice method-step label on paper",
    file: "assets/choice-over-effort.css",
    foreground: [".method-card-body > span", "color"],
    background: [".method-card", "background"],
  },
  {
    name: "choice output-phase label on white",
    file: "assets/choice-over-effort.css",
    foreground: [".output-card-heading span", "color"],
    background: [".output-card", "background"],
  },
];

const stylesheets = new Map();

for (const contrastCase of cases) {
  test(`${contrastCase.name} has at least ${minimumContrast}:1 contrast`, () => {
    const stylesheet = stylesheets.get(contrastCase.file) ?? parseStylesheet(contrastCase.file);
    stylesheets.set(contrastCase.file, stylesheet);
    const foreground = parseColor(declaration(stylesheet, ...contrastCase.foreground), stylesheet.variables);
    const background = parseColor(declaration(stylesheet, ...contrastCase.background), stylesheet.variables);
    const ratio = contrastRatio(foreground, background);

    assert.ok(
      ratio >= minimumContrast,
      `${contrastCase.file} ${contrastCase.foreground[0]} is ${ratio.toFixed(3)}:1 against ${contrastCase.background[0]}`,
    );
  });
}
