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

// Maps the typed job results of the module-manager into a uniform view for
// the job result dialog: one row per item, failed rows carry the error and,
// where the cause is known, a hint on how to resolve it.

import {
  DeploymentDeleteJobResult,
  DeploymentJobResult,
  DeploymentUpdateJobResult,
  ModulesChangeJobResult,
  RepositoryJobResult,
} from './jobs';

export interface JobResultItem {
  label: string;
  ok: boolean;
  message?: string;
  hint?: string;
}

// Treatment hints for known error causes. Returns a translation key, not
// display text - job-result-dialog.component.html applies the `transloco`
// pipe to it; unlike JobResultItem.label, every hint is one of these two
// fixed sentences, never a raw backend string, so the pipe never sees
// anything that would look like a missing key.
export function hintForError(errorMsg: string): string | undefined {
  if (!errorMsg) {
    return undefined;
  }
  if (errorMsg.includes('deployment exists')) {
    return 'core.jobResultView.hints.deploymentExists';
  }
  if (errorMsg.includes('not found')) {
    return 'core.jobResultView.hints.notFound';
  }
  return undefined;
}

export function hasFailures(items: JobResultItem[]): boolean {
  return items.some((item) => !item.ok);
}

export function mapModulesChangeResult(result: ModulesChangeJobResult): JobResultItem[] {
  const items: JobResultItem[] = [];
  if (result.has_error) {
    items.push({label: 'Change request', ok: false, message: result.error_msg, hint: hintForError(result.error_msg)});
  }
  for (const entry of result.success || []) {
    items.push({label: entry.id + ' (' + entry.action + ')', ok: true});
  }
  for (const entry of result.failed || []) {
    items.push({
      label: entry.id + ' (' + entry.action + ')',
      ok: false,
      message: entry.error,
      hint: hintForError(entry.error),
    });
  }
  return items;
}

export function mapDeploymentResults(
  result: DeploymentJobResult | DeploymentUpdateJobResult | DeploymentDeleteJobResult,
): JobResultItem[] {
  const items: JobResultItem[] = [];
  if (result.has_error) {
    items.push({label: 'Job', ok: false, message: result.error_msg, hint: hintForError(result.error_msg)});
  }
  for (const entry of result.results || []) {
    items.push({
      label: entry.module_id,
      ok: !entry.has_error,
      message: entry.has_error ? entry.error_msg : undefined,
      hint: entry.has_error ? hintForError(entry.error_msg) : undefined,
    });
  }
  return items;
}

export function mapRepositoryRefreshResult(result: RepositoryJobResult): JobResultItem[] {
  const items: JobResultItem[] = [];
  if (result.has_error) {
    items.push({label: 'Refresh', ok: false, message: result.error_msg, hint: hintForError(result.error_msg)});
  }
  // upstream struct field has no json tag, hence the capital R
  for (const entry of result.Results || []) {
    const channelErrors = (entry.channel_errors || []).map((c) => c.channel + ': ' + c.error_msg);
    const failed = entry.has_error || channelErrors.length > 0;
    items.push({
      label: entry.source + (entry.refresh ? '' : ' (skipped)'),
      ok: !failed,
      message: failed ? [entry.error_msg, ...channelErrors].filter((m) => !!m).join('; ') : undefined,
    });
  }
  return items;
}
