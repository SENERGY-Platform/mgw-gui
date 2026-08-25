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

import {
  hasFailures,
  hintForError,
  mapDeploymentResults,
  mapModulesChangeResult,
  mapRepositoryRefreshResult,
} from './job-result-view';

describe('mapModulesChangeResult', () => {
  it('maps successes and failures with a hint for known causes', () => {
    const items = mapModulesChangeResult({
      job_id: 'j',
      has_error: false,
      error_msg: '',
      success: [{id: 'mod-a', action: 'install'}],
      failed: [{id: 'mod-b', action: 'remove', error: 'deployment exists'}],
    });
    expect(items.length).toBe(2);
    expect(items[0].ok).toBe(true);
    expect(items[1].ok).toBe(false);
    // A translation key, not display text - see hintForError.
    expect(items[1].hint).toBe('core.jobResultView.hints.deploymentExists');
    expect(hasFailures(items)).toBe(true);
  });

  it('reports an aborted job as its own failed row', () => {
    const items = mapModulesChangeResult({
      job_id: 'j',
      has_error: true,
      error_msg: 'boom',
      success: null as any,
      failed: null as any,
    });
    expect(items.length).toBe(1);
    expect(items[0].ok).toBe(false);
    expect(items[0].message).toBe('boom');
  });
});

describe('mapDeploymentResults', () => {
  it('maps per-module outcomes', () => {
    const items = mapDeploymentResults({
      job_id: 'j',
      has_error: false,
      error_msg: '',
      results: [
        {module_id: 'mod-a', id: 'dep-1', has_error: false, error_msg: ''},
        {module_id: 'mod-b', id: '', has_error: true, error_msg: 'image pull failed'},
      ],
      results_err_num: 1,
    } as any);
    expect(items.length).toBe(2);
    expect(hasFailures(items)).toBe(true);
    expect(items[1].message).toBe('image pull failed');
  });
});

describe('mapRepositoryRefreshResult', () => {
  it('flags repositories with channel errors even when the repo itself refreshed', () => {
    const items = mapRepositoryRefreshResult({
      job_id: 'j',
      has_error: false,
      error_msg: '',
      Results: [
        {type: 'host-dir', source: 'localhost', refresh: true, channel_errors: null, has_error: false, error_msg: ''},
        {
          type: 'github.com',
          source: 'gh/repo',
          refresh: true,
          channel_errors: [{channel: 'main', has_error: true, error_msg: 'rate limited'}],
          has_error: false,
          error_msg: '',
        },
      ],
      results_err_num: 0,
    } as any);
    expect(items[0].ok).toBe(true);
    expect(items[1].ok).toBe(false);
    expect(items[1].message).toContain('rate limited');
  });

  it('marks skipped repositories', () => {
    const items = mapRepositoryRefreshResult({
      job_id: 'j',
      has_error: false,
      error_msg: '',
      Results: [
        {type: 'github.com', source: 'gh/repo', refresh: false, channel_errors: null, has_error: false, error_msg: ''},
      ],
      results_err_num: 0,
    } as any);
    expect(items[0].label).toContain('skipped');
  });
});

describe('hintForError', () => {
  it('returns no hint for unknown causes', () => {
    expect(hintForError('some random failure')).toBeUndefined();
    expect(hintForError('')).toBeUndefined();
  });
});
