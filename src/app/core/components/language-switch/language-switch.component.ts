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

import {Component, inject} from '@angular/core';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {MatTooltip} from '@angular/material/tooltip';
import {TranslocoPipe, provideTranslocoScope} from '@jsverse/transloco';
import {LanguageService} from '../../services/language/language.service';

/**
 * Only English exists today, and a menu with one entry that always does
 * nothing is worse than no control at all - so this renders nothing until
 * LanguageService actually has a second language to offer. The day one
 * ships, this starts showing itself with no further change needed here.
 */
@Component({
  selector: 'mgw-language-switch',
  templateUrl: './language-switch.component.html',
  imports: [MatIconButton, MatIcon, MatMenu, MatMenuItem, MatMenuTrigger, MatTooltip, TranslocoPipe],
  providers: [provideTranslocoScope('core')],
})
export class LanguageSwitchComponent {
  protected readonly language = inject(LanguageService);
}
