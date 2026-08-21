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

import {Component, inject, Input, OnChanges} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {AnsiUp} from 'ansi_up';

/**
 * Security boundary against the OSC-8 hyperlink sequence: ansi_up turns it
 * into a real anchor, which would let a container put a clickable link of its
 * choosing into an admin console. Dropping the sequence instead of denying
 * the URL scheme keeps the text the container meant to show.
 *
 * The second alternative is what makes the first one hold. Removing a
 * sequence joins the text around it, and a log can be written so that the
 * halves left behind spell out a fresh, valid OSC-8 sequence that a single
 * pass has already scanned past. Since ansi_up only acts on ESC followed by
 * '[' (colours) or '(' (character set) and discards every other ESC anyway,
 * dropping those here costs nothing visible and leaves no ESC behind that
 * could pair up with a stray ']8;'.
 */
// eslint-disable-next-line no-control-regex -- escape sequences are the input this deals with
const OSC8_HYPERLINK = /\x1b\]8;[\x20-\x3a\x3c-\x7e]*;[\x21-\x7e]{0,512}(?:\x1b\\|\x07)|\x1b(?![[(])/g;

const CARRIAGE_RETURN = /\r\n?/g;

/**
 * Renders a log string with its ANSI colour escape sequences turned into
 * spans instead of showing the raw escape codes. Escaping of everything
 * that isn't a recognised ANSI sequence stays on (ansi_up's default) since
 * log content is untrusted and this is what keeps [innerHTML] safe.
 *
 * Line numbers are rendered by Angular into a gutter next to the log, not
 * into the generated HTML: markup that arrives through [innerHTML] carries
 * no _ngcontent attribute, so the encapsulated stylesheet would not apply
 * to it.
 */
@Component({
  selector: 'mgw-log-viewer',
  templateUrl: './log-viewer.component.html',
  styleUrl: './log-viewer.component.css',
  imports: [],
})
export class LogViewerComponent implements OnChanges {
  @Input() logs = '';

  html: SafeHtml = '';
  lineNumbers: number[] = [];

  private sanitizer = inject(DomSanitizer);

  ngOnChanges(): void {
    const text = this.normalise(this.logs);
    this.lineNumbers = this.numberLines(text);
    this.html = this.sanitizer.bypassSecurityTrustHtml(this.toHtml(text));
  }

  /**
   * The gutter and the log text are numbered and rendered from the same
   * string, so anything that changes the number of rendered lines has to
   * happen before both. A CR becomes a line break of its own once the HTML
   * parser sees it, and a single trailing newline may or may not produce a
   * last, empty line depending on the browser -- both would offset the
   * numbers against the lines they belong to.
   */
  private normalise(logs: string): string {
    return logs.replace(CARRIAGE_RETURN, '\n').replace(/\n$/, '');
  }

  private numberLines(text: string): number[] {
    if (text.length === 0) {
      return [];
    }
    const count = text.split('\n').length;
    return Array.from({length: count}, (_, index) => index + 1);
  }

  private toHtml(text: string): string {
    // The whole log goes through one call: ansi_up buffers an escape
    // sequence it cannot complete yet, so converting line by line makes a
    // truncated sequence swallow every line after it.
    return new AnsiUp().ansi_to_html(text.replace(OSC8_HYPERLINK, ''));
  }
}
