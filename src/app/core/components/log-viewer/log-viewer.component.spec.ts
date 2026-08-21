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

import {Component} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';

import {LogViewerComponent} from './log-viewer.component';

@Component({
  template: '<mgw-log-viewer [logs]="logs"></mgw-log-viewer>',
  imports: [LogViewerComponent],
})
class HostComponent {
  logs = '';
}

// Built from the char code rather than a literal escape so no raw control
// character ends up in this source file.
const ESC = String.fromCharCode(27);
const BEL = String.fromCharCode(7);
// OSC string terminator
const ST = ESC + '\\';

describe('LogViewerComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
  });

  function renderedElement(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function codeElement(): HTMLElement {
    return renderedElement().querySelector('code') as HTMLElement;
  }

  /** The log text only, without the line numbers of the gutter. */
  function logText(): string {
    return codeElement().textContent ?? '';
  }

  function lineNumberElements(): HTMLElement[] {
    return Array.from(renderedElement().querySelectorAll<HTMLElement>('.line-number'));
  }

  function render(logs: string): void {
    host.logs = logs;
    fixture.detectChanges();
  }

  it('renders ANSI colour codes as coloured spans instead of raw escape sequences', () => {
    const line = `${ESC}[2m2024-03-01T08:28:04.568376Z${ESC}[0m ${ESC}[32m INFO${ESC}[0m ${ESC}[1mup${ESC}[0m`;
    render(line);

    const html = renderedElement().innerHTML;
    expect(html).not.toContain(ESC);

    // The colour itself, not just the presence of a style attribute: ansi_up
    // maps SGR 32 to its own green, and a span carrying no colour would
    // otherwise pass this test.
    const green = Array.from(codeElement().querySelectorAll<HTMLElement>('span')).find(
      (span) => span.textContent === ' INFO',
    );
    expect(green).toBeTruthy();
    expect(green!.style.color).toBe('rgb(0, 187, 0)');

    const bold = Array.from(codeElement().querySelectorAll<HTMLElement>('span')).find(
      (span) => span.textContent === 'up',
    );
    expect(bold!.style.fontWeight).toBe('bold');

    const ansiCodePattern = new RegExp(`${ESC}\\[[0-9;]*m`, 'g');
    expect(logText()).toBe(line.replace(ansiCodePattern, ''));
  });

  it('leaves plain text without ANSI codes unchanged', () => {
    const line = 'plain log line without any colour codes';
    render(line);

    expect(logText()).toBe(line);
  });

  it('escapes HTML in the log input instead of letting it inject elements', () => {
    const malicious = '<img src=x onerror=alert(1)>';
    render(malicious);

    expect(renderedElement().querySelector('img')).toBeNull();
    expect(logText()).toBe(malicious);
  });

  it('numbers every input line in the gutter', () => {
    render('first\nsecond\nthird');

    expect(lineNumberElements().map((element) => element.textContent?.trim())).toEqual(['1', '2', '3']);
  });

  it('shows the line numbers as visible elements rather than generated content', () => {
    render('first\nsecond\nthird');

    const numbers = lineNumberElements();
    expect(numbers.length).toBe(3);
    for (const number of numbers) {
      const style = getComputedStyle(number);
      expect(style.display).not.toBe('none');
      expect(style.visibility).toBe('visible');
      expect(number.getBoundingClientRect().height).toBeGreaterThan(0);
    }
  });

  it('keeps the gutter on the same baseline grid as the log text', () => {
    // Enough lines that a per-line drift of a fraction of a pixel would show
    // up well beyond the tolerance below.
    const lines = Array.from({length: 40}, (_, index) => `line ${index + 1}`);
    render(lines.join('\n'));

    const gutter = renderedElement().querySelector('.gutter') as HTMLElement;
    const code = codeElement();
    const firstNumber = lineNumberElements()[0];

    const gutterStyle = getComputedStyle(firstNumber);
    const codeStyle = getComputedStyle(code);
    expect(gutterStyle.lineHeight).toBe(codeStyle.lineHeight);
    expect(gutterStyle.lineHeight).not.toBe('normal');
    expect(gutterStyle.fontFamily).toBe(codeStyle.fontFamily);
    expect(gutterStyle.fontSize).toBe(codeStyle.fontSize);

    const gutterBox = gutter.getBoundingClientRect();
    const codeBox = code.getBoundingClientRect();
    expect(gutterBox.height).toBeGreaterThan(0);
    // 40 numbers must occupy exactly as much room as 40 rendered lines, and
    // start at the same height.
    expect(Math.abs(gutterBox.height - codeBox.height)).toBeLessThan(1);
    expect(Math.abs(firstNumber.getBoundingClientRect().top - codeBox.top)).toBeLessThan(1);
  });

  it('keeps the gutter in place while the log scrolls sideways', () => {
    render('line one');

    const gutter = renderedElement().querySelector('.gutter') as HTMLElement;
    const style = getComputedStyle(gutter);
    expect(style.position).toBe('sticky');
    // the numbers must not end up in a copied log excerpt
    expect(style.userSelect).toBe('none');
    // log text passing underneath must not shine through
    expect(style.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  it('does not let an unfinished escape sequence swallow the lines after it', () => {
    // A hyperlink sequence cut short by the line-count limit used to leave
    // ansi_up buffering, which dropped every following line.
    render(`boot ok\n${ESC}]8;;http://x${ST}see here\nSECRET LINE\nlast line`);

    const text = logText();
    expect(text).toContain('boot ok');
    expect(text).toContain('see here');
    expect(text).toContain('SECRET LINE');
    expect(text).toContain('last line');
    expect(lineNumberElements().length).toBe(4);
  });

  it('does not let a truncated colour sequence eat the lines after it', () => {
    // Same failure as above without a hyperlink involved, so it stays a test
    // of the conversion rather than of the hyperlink removal: converting line
    // by line leaves the unfinished sequence buffered and consumes whatever
    // arrives next until it happens to complete.
    render(`boot ok\n${ESC}[38;5\n2\nSECRET LINE\nlast line`);

    const text = logText();
    expect(text).toContain('boot ok');
    expect(text).toContain('SECRET LINE');
    expect(text).toContain('last line');
    expect(lineNumberElements().length).toBe(5);
  });

  it('loses no character of the line following a truncated control sequence', () => {
    render(`line one ${ESC}[\nline two`);

    expect(logText()).toContain('line two');
    expect(lineNumberElements().length).toBe(2);
  });

  it('renders no anchor for a hyperlink sequence but keeps its text', () => {
    render(`${ESC}]8;;http://evil.example${ST}click${ESC}]8;;${ST}`);

    expect(renderedElement().querySelector('a')).toBeNull();
    expect(logText()).toBe('click');
  });

  it('renders no anchor for a hyperlink sequence terminated with BEL', () => {
    render(`${ESC}]8;id=1:x;http://evil.example${BEL}click${ESC}]8;;${BEL}`);

    expect(renderedElement().querySelector('a')).toBeNull();
    expect(logText()).toBe('click');
  });

  it('renders no anchor for a hyperlink sequence reassembled across a removed one', () => {
    // Removing a sequence joins the text on either side of it. This input is
    // built so that the leftovers spell out a fresh, valid hyperlink
    // sequence, which a single left-to-right pass has already scanned past.
    const decoy = `${ESC}]8;;http://decoy${ST}`;
    render(`${ESC}${decoy}]8;;http://evil.example${ST}click${ESC}${decoy}]8;;${ST}`);

    expect(renderedElement().querySelector('a')).toBeNull();
    expect(logText()).toContain('click');
  });

  it('keeps the text of a hyperlink sequence that was never terminated', () => {
    render(`${ESC}]8;;http://x see here`);

    expect(renderedElement().querySelector('a')).toBeNull();
    expect(logText()).toContain('see here');
  });

  it('counts a line ended by a newline once, not twice', () => {
    render('first\nsecond\n');

    expect(lineNumberElements().map((element) => element.textContent?.trim())).toEqual(['1', '2']);
    expect(logText()).toBe('first\nsecond');
  });

  it('counts a carriage return as part of its line break, not as a line of its own', () => {
    // The HTML parser turns a stray CR into a line break, so the gutter has
    // to agree with it on how many lines there are.
    render('first\r\nsecond\r\n');

    expect(lineNumberElements().map((element) => element.textContent?.trim())).toEqual(['1', '2']);
    expect(logText()).toBe('first\nsecond');
  });

  it('renders nothing for an empty log', () => {
    render('');

    expect(lineNumberElements().length).toBe(0);
    expect(logText()).toBe('');
  });

  it('replaces the previous log when the input changes', () => {
    // The pages behind this component refresh their log every five seconds.
    render(`${ESC}[32mfirst${ESC}[0m\nsecond\nthird`);
    expect(logText()).toContain('first');
    expect(lineNumberElements().length).toBe(3);

    render('later');

    expect(logText()).toBe('later');
    expect(logText()).not.toContain('first');
    expect(lineNumberElements().map((element) => element.textContent?.trim())).toEqual(['1']);
  });
});
