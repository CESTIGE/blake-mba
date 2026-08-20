import test from "node:test";
import assert from "node:assert/strict";
import { attribute, read } from "./helpers/site-files.mjs";

test("the below-the-fold AI operations dashboard defers browser work", () => {
  const html = read("courses/software-startup/index.html");
  const image = html.match(
    /<img\b[^>]*\bsrc=["']\/assets\/ai-operations-dashboard\.png["'][^>]*>/i,
  )?.[0];

  assert.ok(image, "missing AI operations dashboard image");
  assert.equal(attribute(image, "loading"), "lazy");
  assert.equal(attribute(image, "decoding"), "async");
});
