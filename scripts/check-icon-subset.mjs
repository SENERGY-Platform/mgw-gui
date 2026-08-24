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
 * The icon font is cut down to the icons this application asks for, because
 * the full face is 5.3 MB. That trade has one failure mode: an icon added
 * later is not in the file and renders as its own name in words. Nothing else
 * notices - the build passes, the tests pass, and it is visible only by
 * looking at the page. It is how the navigation lost all of its icons once.
 *
 * A name the syntax marks as an icon and that is missing fails here. A string
 * literal that merely happens to be a valid icon name is reported and does
 * not, because 'password' and 'input' are icon names as well as ordinary
 * words, and failing on those would make this unusable.
 */
import {findIcons, readList, SUBSET_LIST} from './icon-usage.mjs';

const shipped = readList(SUBSET_LIST);
const {certain, possible} = findIcons();

const missing = [...certain].filter(([name]) => !shipped.has(name));
const unlisted = [...possible].filter(([name]) => !shipped.has(name));
const unused = [...shipped].filter((name) => !certain.has(name) && !possible.has(name)).sort();

if (unused.length) {
  console.log(`${unused.length} icon(s) in the subset that nothing asks for: ${unused.join(', ')}`);
}

if (unlisted.length) {
  console.log(`\n${unlisted.length} string(s) that are valid icon names but are not in the subset.`);
  console.log('Ordinary strings look like this too - check whether any is really used as an icon:');
  for (const [name, path] of unlisted) console.log(`  ${name}  (${path})`);
}

if (missing.length) {
  console.error(`\n${missing.length} icon(s) used but not in the font subset:\n`);
  for (const [name, path] of missing) console.error(`  ${name}  (${path})`);
  console.error(`\nRegenerate the subset - see THIRD-PARTY.md - and update ${SUBSET_LIST}.`);
  process.exit(1);
}

console.log(`\nAll ${certain.size} icons the syntax marks as icons are in the subset.`);
