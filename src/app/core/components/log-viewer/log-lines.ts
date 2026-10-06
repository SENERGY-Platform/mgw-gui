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

export const DEFAULT_LOG_LINES = 100;

/**
 * The backends read max_lines 0 as "the whole log", and rendering a large
 * log in full locks up the tab, so every request stays within this bound.
 */
export const MAX_LOG_LINES = 5000;

/** Long enough that typing "500" does not request 5 and 50 lines first. */
export const LOG_LINES_DEBOUNCE_MS = 600;

/**
 * Turns the value of the line count field into a line count the page may
 * request, or null while the field is empty and there is nothing to apply.
 */
export function clampLogLines(value: number | null | undefined): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }
  return Math.min(MAX_LOG_LINES, Math.max(1, Math.round(value)));
}
