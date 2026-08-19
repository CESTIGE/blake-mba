import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

export function read(relativePath) {
  return readFileSync(join(projectRoot, relativePath), "utf8");
}

export function htmlFiles(directory = projectRoot) {
  const results = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) results.push(...htmlFiles(absolute));
    if (entry.isFile() && entry.name.endsWith(".html")) {
      results.push(relative(projectRoot, absolute));
    }
  }
  return results.sort();
}

export function tagWithAttribute(source, tagName, attributeName) {
  const expression = new RegExp(
    `<${tagName}\\b(?=[^>]*\\b${attributeName}(?:=|\\s|>))[^>]*>`,
    "i",
  );
  return source.match(expression)?.[0] ?? "";
}

export function attribute(tag, name) {
  const match = tag.match(
    new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"),
  );
  return match ? match[1] ?? match[2] ?? match[3] : null;
}
