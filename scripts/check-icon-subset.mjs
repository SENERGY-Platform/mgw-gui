/*
 * Copyright (c) 2026 InfAI (CC SES)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * The icon font is cut down to the icons the templates name, because the full
 * face runs to several megabytes. That trade has one failure mode: an icon
 * added to a template later is simply not in the file, and renders as its own
 * ligature name in words. Nothing else notices - the build passes, the tests
 * pass, and it is only visible by looking at the page.
 *
 * So compare the two here. Names present in the subset but no longer used are
 * only waste, and reported without failing.
 */
import {readdirSync, readFileSync, statSync} from 'node:fs';
import {join} from 'node:path';

const SUBSET = 'src/assets/fonts/icon-names.txt';
const ICON_IN_TEMPLATE = />([a-z_]{3,})<\/mat-icon>/g;

function templates(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return templates(path);
    return path.endsWith('.html') ? [path] : [];
  });
}

const shipped = new Set(
  readFileSync(SUBSET, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean),
);

const used = new Map();
for (const path of templates('src/app')) {
  const html = readFileSync(path, 'utf8');
  for (const [, name] of html.matchAll(ICON_IN_TEMPLATE)) {
    if (!used.has(name)) used.set(name, path);
  }
}

const missing = [...used.keys()].filter((name) => !shipped.has(name)).sort();
const unused = [...shipped].filter((name) => !used.has(name)).sort();

if (unused.length) {
  console.log(`${unused.length} icon(s) in the subset that no template uses: ${unused.join(', ')}`);
}

if (missing.length) {
  console.error(`\n${missing.length} icon(s) used but not in the font subset:\n`);
  for (const name of missing) console.error(`  ${name}  (${used.get(name)})`);
  console.error(`\nRegenerate the subset - see THIRD-PARTY.md - and update ${SUBSET}.`);
  process.exit(1);
}

console.log(`All ${used.size} icons used by the templates are in the subset.`);
