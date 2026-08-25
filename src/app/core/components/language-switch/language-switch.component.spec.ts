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

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {provideTranslocoTesting} from 'src/testing/transloco-testing';
import {LanguageService} from '../../services/language/language.service';
import {LanguageSwitchComponent} from './language-switch.component';

describe('LanguageSwitchComponent', () => {
  async function createWith(availableLangs: string[]): Promise<ComponentFixture<LanguageSwitchComponent>> {
    await TestBed.configureTestingModule({
      imports: [LanguageSwitchComponent, provideTranslocoTesting('core')],
      providers: [
        provideNoopAnimations(),
        {
          provide: LanguageService,
          useValue: {availableLangs, lang: signal(availableLangs[0]), set: vi.fn()},
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(LanguageSwitchComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('offers no switch while only one language is available', async () => {
    const fixture = await createWith(['en']);

    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });

  it('offers a switch once a second language exists', async () => {
    const fixture = await createWith(['en', 'de']);

    const button = fixture.nativeElement.querySelector('button');
    expect(button).not.toBeNull();
    expect(button.getAttribute('aria-label')).toBe('Switch language');
  });

  it('lists every available language in the menu', async () => {
    const fixture = await createWith(['en', 'de']);
    const language = TestBed.inject(LanguageService);

    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();

    const items = Array.from(document.querySelectorAll('.mat-mdc-menu-item')) as HTMLElement[];
    expect(items.map((item) => item.textContent?.trim())).toEqual(['en', 'de']);

    items[1].click();
    expect(language.set).toHaveBeenCalledWith('de');
  });
});
