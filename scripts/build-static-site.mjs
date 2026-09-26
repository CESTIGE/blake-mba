import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const output = path.resolve(process.argv[2] || '_site');
const endpoint = process.env.SURVEY_ENDPOINT || '';

if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint)) {
  throw new Error('SURVEY_ENDPOINT is missing or invalid.');
}

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

const archive = execFileSync('git', ['archive', 'HEAD'], { maxBuffer: 100 * 1024 * 1024 });
execFileSync('tar', ['-x', '-C', output], { input: archive });

const surveyPath = path.join(output, 'survey/index.html');
const surveySource = fs.readFileSync(surveyPath, 'utf8');
const marker = 'data-survey-endpoint=""';
if (!surveySource.includes(marker)) {
  throw new Error('Survey endpoint marker was not found.');
}
fs.writeFileSync(
  surveyPath,
  surveySource.replace(marker, `data-survey-endpoint="${endpoint}"`),
);

const commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
execFileSync(process.execPath, ['scripts/page-publication.mjs', output], {
  env: { ...process.env, GITHUB_SHA: process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || commit },
  stdio: 'inherit',
});

for (const relativePath of ['config', 'scripts', 'tests', 'docs', 'tools/page-status']) {
  fs.rmSync(path.join(output, relativePath), { recursive: true, force: true });
}
