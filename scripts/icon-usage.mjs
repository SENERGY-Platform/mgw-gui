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
 * Finds the icons this application asks for. Shared by the subset check and
 * by the regeneration described in THIRD-PARTY.md, so the two cannot disagree
 * about what "used" means.
 *
 * Two confidence levels, because an icon name is just a lowercase word and
 * plenty of ordinary strings look exactly like one:
 *
 *   certain  - the syntax says icon: the content of a <mat-icon>, a fontIcon
 *              attribute, an `icon:` property. A missing one is a bug.
 *   possible - any quoted lowercase literal in TypeScript that happens to be
 *              a real Material Symbols name. That is how the theme toggle's
 *              icons arrive (a method returning 'light_mode'), and also how
 *              'password' and 'input' arrive, which are not icons at all.
 *              Included when cutting the font, never a reason to fail.
 */
import {readdirSync, readFileSync, statSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export const SUBSET_LIST = join(root, 'src/assets/fonts/icon-names.txt');
const KNOWN_NAMES = join(root, 'scripts/material-symbols-names.txt');

const IN_TEMPLATE = />\s*([a-z0-9_]{2,})\s*<\/mat-icon>/g;
const AS_ATTRIBUTE = /fontIcon="([a-z0-9_]+)"/g;
// An `icon="..."` input, which is how the empty state and the page header are
// told which icon to show.
const AS_INPUT = /\bicon="([a-z0-9_]+)"/g;
const AS_PROPERTY = /[Ii]con:\s*'([a-z0-9_]+)'/g;
const ANY_LITERAL = /'([a-z][a-z0-9_]{1,})'/g;

function sources(dir, suffixes) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return sources(path, suffixes);
    return suffixes.some((s) => path.endsWith(s)) ? [path] : [];
  });
}

function collect(paths, pattern, into) {
  for (const path of paths) {
    for (const [, name] of readFileSync(path, 'utf8').matchAll(pattern)) {
      if (!into.has(name)) into.set(name, path);
    }
  }
}

export function readList(path) {
  return new Set(
    readFileSync(path, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
  );
}

export function findIcons(appDir = join(root, 'src/app')) {
  const templates = sources(appDir, ['.html']);
  const scripts = sources(appDir, ['.ts']).filter((path) => !path.endsWith('.spec.ts'));

  const certain = new Map();
  // The template patterns run over the .ts files too: a component with an
  // inline `template:` carries the same markup, and scanning only .html once
  // cost every page its back arrow - page-header is such a component, and
  // nothing reported the icon as used or as missing.
  const markup = [...templates, ...scripts];
  collect(markup, IN_TEMPLATE, certain);
  collect(markup, AS_ATTRIBUTE, certain);
  collect(markup, AS_INPUT, certain);
  collect(scripts, AS_PROPERTY, certain);

  const literals = new Map();
  collect(scripts, ANY_LITERAL, literals);
  const known = readList(KNOWN_NAMES);
  const possible = new Map([...literals].filter(([name]) => known.has(name) && !certain.has(name)));

  return {certain, possible, known};
}
