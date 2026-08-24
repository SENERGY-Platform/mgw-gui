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

import {DatePipe} from '@angular/common';
import {LOCALE_ID} from '@angular/core';
import {TestBed} from '@angular/core/testing';

import {registerAppLocale} from './locale';

describe('registerAppLocale', () => {
  it('lets a date pipe format under the locale the application sets', () => {
    registerAppLocale();

    TestBed.configureTestingModule({providers: [{provide: LOCALE_ID, useValue: 'de'}, DatePipe]});

    // Without the registration this throws NG0701 rather than returning
    // anything, which is what every page showing a date would have done.
    expect(TestBed.inject(DatePipe).transform(new Date('2026-08-24T10:00:00Z'), 'short')).toBeTruthy();
  });
});
