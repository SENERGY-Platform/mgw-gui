#!/usr/bin/env python3
#
# Copyright (c) 2026 InfAI (CC SES)
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Reports how much of what this branch changed is covered by tests.

Reads an lcov report and the diff against the base ref, then compares the two
line by line. Only lines the coverage report knows about count: templates,
styles and anything the instrumenter never saw are not measurable and are left
out of both halves of the ratio, so they can neither help nor hurt.

Standard library only, on purpose - this runs on every machine and in CI, and
a second language toolchain for one gate is not worth the bootstrap.
"""

import argparse
import collections
import re
import subprocess
import sys

# Same order the gates runner uses to pick a base: an explicit ref, then the
# remote head, then the usual integration branch names.
BASE_CANDIDATES = ['origin/HEAD', 'origin/master', 'origin/main', 'master', 'main', 'develop', 'trunk']


def run(args):
    return subprocess.run(args, capture_output=True, text=True).stdout.strip()


def resolve_base(explicit):
    if explicit:
        if not run(['git', 'rev-parse', '--verify', '--quiet', explicit]):
            sys.exit(f'base ref does not resolve: {explicit}')
        return explicit
    current = run(['git', 'rev-parse', '--abbrev-ref', 'HEAD'])
    for candidate in BASE_CANDIDATES:
        # never measure a branch against itself
        if candidate.split('/')[-1] == current:
            continue
        if run(['git', 'rev-parse', '--verify', '--quiet', candidate]):
            return candidate
    return None


def covered_lines(lcov_path):
    """{file: {line: hits}} from an lcov tracefile."""
    files = {}
    current = None
    try:
        handle = open(lcov_path)
    except OSError:
        sys.exit(f'no coverage report at {lcov_path} - run the tests with --code-coverage first')
    with handle:
        for line in handle:
            line = line.strip()
            if line.startswith('SF:'):
                current = line[3:]
                files[current] = {}
            elif line.startswith('DA:') and current:
                number, hits = line[3:].split(',')[:2]
                files[current][int(number)] = int(hits)
    return files


def parse_hunks(diff, changed):
    path = None
    for line in diff.split('\n'):
        if line.startswith('+++ b/'):
            path = line[6:]
        elif line.startswith('@@') and path:
            match = re.search(r'\+(\d+)(?:,(\d+))?', line)
            if match:
                start = int(match.group(1))
                count = int(match.group(2) or 1)
                changed[path].update(range(start, start + count))


def changed_lines(base):
    """{file: {line numbers added or changed on the new side}}

    Both halves of what the gates runner calls the changed set: what the branch
    adds on top of the base ref, and what the working tree adds on top of HEAD.
    Leaving the second one out would let uncovered code pass the gate simply
    for not being committed yet.
    """
    changed = collections.defaultdict(set)
    if base:
        parse_hunks(run(['git', 'diff', '-U0', f'{base}...HEAD', '--', '.']), changed)
    parse_hunks(run(['git', 'diff', '-U0', 'HEAD', '--', '.']), changed)

    # git diff never reports an untracked file, and a new file is exactly where
    # untested code tends to arrive. Every line of one counts as changed.
    for path in run(['git', 'ls-files', '--others', '--exclude-standard']).split('\n'):
        if not path:
            continue
        try:
            with open(path, errors='ignore') as handle:
                changed[path].update(range(1, sum(1 for _ in handle) + 1))
        except OSError:
            continue
    return changed


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lcov', default='coverage/mgw-gui/lcov.info')
    parser.add_argument('--base', default=None, help='ref to compare against; auto-detected when omitted')
    parser.add_argument('--min', type=float, default=None, help='fail below this percentage')
    args = parser.parse_args()

    coverage = covered_lines(args.lcov)
    base = resolve_base(args.base)
    changed = changed_lines(base)

    measurable = 0
    covered = 0
    gaps = []
    for path, lines in sorted(changed.items()):
        known = coverage.get(path)
        if not known:
            continue
        relevant = [n for n in lines if n in known]
        if not relevant:
            continue
        hit = [n for n in relevant if known[n] > 0]
        measurable += len(relevant)
        covered += len(hit)
        if len(hit) < len(relevant):
            gaps.append((len(relevant) - len(hit), path, len(hit), len(relevant)))

    print(f'base: {base or "working tree only"}')
    if measurable == 0:
        print('no measurable changed lines - nothing to judge')
        return 0

    percent = 100.0 * covered / measurable
    print(f'changed lines covered: {covered}/{measurable} = {percent:.1f}%')
    for missing, path, hit, total in sorted(gaps, reverse=True)[:10]:
        print(f'  {missing:4d} uncovered  {hit:3d}/{total:3d}  {path}')

    if args.min is not None and percent < args.min:
        print(f'FAIL: below the {args.min:.0f}% threshold')
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
