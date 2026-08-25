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
import {By} from '@angular/platform-browser';
import {provideTranslocoTesting} from 'src/testing/transloco-testing';

import {Redaction} from '../../services/screenshot/screenshot.service';
import {ScreenshotEditorComponent} from './screenshot-editor.component';

function makeCapture(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

@Component({
  template: `<mgw-screenshot-editor [capture]="capture" [(redactions)]="redactions"></mgw-screenshot-editor>`,
  imports: [ScreenshotEditorComponent],
})
class HostComponent {
  capture = makeCapture(400, 300);
  redactions: Redaction[] = [];
}

describe('ScreenshotEditorComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, provideTranslocoTesting('core')],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    // Real bounding-client-rect measurements are needed for the coordinate
    // conversion below, and a detached fixture reports a zero-sized rect.
    document.body.append(fixture.nativeElement);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.nativeElement.remove();
  });

  function editor(): ScreenshotEditorComponent {
    return fixture.debugElement.query(By.directive(ScreenshotEditorComponent)).componentInstance;
  }

  function canvasElement(): HTMLCanvasElement {
    return fixture.nativeElement.querySelector('canvas');
  }

  /** Dispatches one pointer event in the CSS pixels the canvas is displayed at. */
  function pointer(type: string, at: {x: number; y: number}, pointerId = 1): void {
    const canvas = canvasElement();
    const rect = canvas.getBoundingClientRect();
    canvas.dispatchEvent(
      new PointerEvent(type, {
        clientX: rect.left + at.x,
        clientY: rect.top + at.y,
        pointerId,
        bubbles: true,
      }),
    );
    fixture.detectChanges();
  }

  /** Simulates a pointer drag in the CSS pixels the canvas is displayed at. */
  function drag(from: {x: number; y: number}, to: {x: number; y: number}, pointerId = 1): void {
    pointer('pointerdown', from, pointerId);
    pointer('pointerup', to, pointerId);
  }

  /**
   * Puts the canvas at an exact CSS width, through the state the component
   * itself uses to size it - not by writing to the canvas's own style,
   * which applyViewport() would overwrite from `scale` on the very next
   * redraw. `fitScale` is set directly rather than produced by actually
   * resizing the wrapper, because the wrapper's real size in a test document
   * is whatever the browser happens to lay out and not under this test's
   * control; `zoomToFit` is the public entry point that turns a `fitScale`
   * into the matching `scale` and repaints.
   */
  function showAt(cssWidth: number): void {
    editor().fitScale = cssWidth / host.capture.width;
    editor().zoomToFit();
    fixture.detectChanges();
  }

  it('converts a rectangle drawn on the scaled-down canvas into the right region of the original image', () => {
    // Capture is 400 wide, canvas is shown at 100 CSS pixels: a factor of 4
    // between what the mouse measures and where the pixel actually is.
    showAt(100);

    drag({x: 10, y: 10}, {x: 35, y: 40});

    expect(host.redactions).toEqual([{kind: 'hide', x: 40, y: 40, width: 100, height: 120}]);
  });

  it('converts correctly at a non-integer scale too', () => {
    // 400 / 150 = 2.6666..., the kind of scale a whole-number test would not catch.
    showAt(150);
    editor().setTool('highlight');

    drag({x: 10, y: 10}, {x: 40, y: 46});

    expect(host.redactions.length).toBe(1);
    const region = host.redactions[0];
    expect(region.kind).toBe('highlight');
    expect(region.x).toBeCloseTo(10 * (400 / 150), 4);
    expect(region.y).toBeCloseTo(10 * (400 / 150), 4);
    expect(region.width).toBeCloseTo(30 * (400 / 150), 4);
    expect(region.height).toBeCloseTo(36 * (400 / 150), 4);
  });

  it('drops a drag too small to have been meant, and emits nothing', () => {
    canvasElement().style.width = '100px';

    drag({x: 10, y: 10}, {x: 11, y: 11});

    expect(host.redactions).toEqual([]);
  });

  it('removes only the region that was asked for, keeping the rest', () => {
    host.redactions = [
      {kind: 'hide', x: 0, y: 0, width: 10, height: 10},
      {kind: 'highlight', x: 5, y: 5, width: 8, height: 8},
    ];
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('mat-chip').length).toBe(2);

    editor().remove(0);
    fixture.detectChanges();

    expect(host.redactions).toEqual([{kind: 'highlight', x: 5, y: 5, width: 8, height: 8}]);
    expect(fixture.nativeElement.querySelectorAll('mat-chip').length).toBe(1);
  });

  it('clears every region on reset, and disables the button when there is nothing to clear', () => {
    const resetButton = () =>
      fixture.nativeElement.querySelector('button[aria-label="Remove all regions"]') as HTMLButtonElement;

    expect(resetButton().disabled).toBe(true);

    host.redactions = [{kind: 'hide', x: 0, y: 0, width: 10, height: 10}];
    fixture.detectChanges();
    expect(resetButton().disabled).toBe(false);

    editor().reset();
    fixture.detectChanges();

    expect(host.redactions).toEqual([]);
    expect(resetButton().disabled).toBe(true);
  });

  it('does nothing when reset is called with no regions to clear', () => {
    editor().reset();
    fixture.detectChanges();

    expect(host.redactions).toEqual([]);
  });

  it('finishes a drag still under a finger before composing the picture', async () => {
    // A second finger on Send while the first is still drawing over a
    // password: the region is not in `redactions` yet, and the preview is
    // deliberately never burnt in, so the original would go out uncovered.
    showAt(100);
    pointer('pointerdown', {x: 10, y: 10});
    pointer('pointermove', {x: 35, y: 40});

    await editor().getAttachment();
    fixture.detectChanges();

    expect(host.redactions).toEqual([{kind: 'hide', x: 40, y: 40, width: 100, height: 120}]);
  });

  it('says so when a drag was too small to keep, rather than dropping it in silence', () => {
    canvasElement().style.width = '100px';

    drag({x: 10, y: 10}, {x: 11, y: 11});

    expect(host.redactions).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('too small');
  });

  it('takes the notice back as soon as the next drag starts', () => {
    canvasElement().style.width = '100px';
    drag({x: 10, y: 10}, {x: 11, y: 11});

    pointer('pointerdown', {x: 10, y: 10});

    expect(fixture.nativeElement.textContent).not.toContain('too small');
  });

  it('produces an attachment that carries the composed picture', async () => {
    host.redactions = [{kind: 'hide', x: 0, y: 0, width: 10, height: 10}];
    fixture.detectChanges();

    const attachment = await editor().getAttachment();

    expect(attachment.filename).toBe('screenshot.png');
    expect(attachment.contentType).toBe('image/png');
    expect(attachment.data.length).toBeGreaterThan(0);
  });

  it('never lets a pan push the image out of reach', () => {
    const component = editor();
    const wrapper = fixture.nativeElement.querySelector('.canvas-wrapper') as HTMLElement;

    // Zoomed in far enough that panning means something at all.
    component.setMode('move');
    for (let i = 0; i < 12; i++) component.zoomIn();
    fixture.detectChanges();
    expect(component.canPan()).toBe(true);

    const canvas = canvasElement();
    canvas.dispatchEvent(new PointerEvent('pointerdown', {clientX: 0, clientY: 0, pointerId: 7, bubbles: true}));
    // Far beyond anything the image could justify.
    canvas.dispatchEvent(
      new PointerEvent('pointermove', {clientX: 99999, clientY: 99999, pointerId: 7, bubbles: true}),
    );
    canvas.dispatchEvent(new PointerEvent('pointerup', {clientX: 99999, clientY: 99999, pointerId: 7, bubbles: true}));
    fixture.detectChanges();

    // The bound is the overhang: how far the scaled image sticks out past the
    // wrapper on each side. Held to it, an edge reaches the wrapper's edge and
    // stops, so the canvas always keeps some of itself under the pointer.
    const limitX = Math.max(0, (host.capture.width * component.scale - wrapper.clientWidth) / 2);
    const limitY = Math.max(0, (host.capture.height * component.scale - wrapper.clientHeight) / 2);
    expect(component.pan.x).toBeLessThanOrEqual(limitX + 0.001);
    expect(component.pan.y).toBeLessThanOrEqual(limitY + 0.001);

    const box = canvas.getBoundingClientRect();
    const wrapperBox = wrapper.getBoundingClientRect();
    expect(box.right).toBeGreaterThan(wrapperBox.left);
    expect(box.bottom).toBeGreaterThan(wrapperBox.top);
  });
});
