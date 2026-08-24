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

import {isJobDone, Job} from './jobs';

describe('isJobDone', () => {
  const base: Job = {id: 'j1', description: 'test', start: '2026-08-18T10:00:00Z', end: ''};

  it('should be false while the job is running (zero value end, UTC)', () => {
    expect(isJobDone({...base, end: '0001-01-01T00:00:00Z'})).toBe(false);
  });

  it('should be false while the job is running (zero value end, with offset)', () => {
    expect(isJobDone({...base, end: '0001-01-01T00:00:00+00:00'})).toBe(false);
  });

  it('should be false when end is empty or missing', () => {
    expect(isJobDone({...base, end: ''})).toBe(false);
    expect(isJobDone({...base, end: undefined as unknown as string})).toBe(false);
  });

  it('should be true once end carries a real timestamp', () => {
    expect(isJobDone({...base, end: '2026-08-18T10:00:05.123456789Z'})).toBe(true);
  });
});
