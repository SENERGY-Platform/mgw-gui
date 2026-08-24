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

import {TestBed} from '@angular/core/testing';

import {ScreenshotCaptureError, ScreenshotService} from './screenshot.service';

/** Replaces navigator.mediaDevices for the duration of one test. */
function stubMediaDevices(value: object | undefined): void {
  Object.defineProperty(navigator, 'mediaDevices', {value, configurable: true});
}

describe('ScreenshotService', () => {
  let service: ScreenshotService;
  let originalMediaDevices: MediaDevices | undefined;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScreenshotService);
    originalMediaDevices = navigator.mediaDevices;
  });

  afterEach(() => {
    stubMediaDevices(originalMediaDevices);
  });

  function filledCanvas(width: number, height: number, color: string): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d')!;
    context.fillStyle = color;
    context.fillRect(0, 0, width, height);
    return canvas;
  }

  describe('isSupported', () => {
    it('is true when the browser exposes getDisplayMedia', () => {
      stubMediaDevices({getDisplayMedia: async () => new MediaStream()});
      expect(service.isSupported()).toBe(true);
    });

    it('is false when getDisplayMedia is missing, so the caller can hide the capture button', () => {
      stubMediaDevices({});
      expect(service.isSupported()).toBe(false);
    });

    it('is false when navigator.mediaDevices itself is missing', () => {
      stubMediaDevices(undefined);
      expect(service.isSupported()).toBe(false);
    });
  });

  describe('captureScreen', () => {
    it('rejects with a ScreenshotCaptureError when the API is not available at all', async () => {
      stubMediaDevices(undefined);

      await expectAsync(service.captureScreen()).toBeRejectedWithError(ScreenshotCaptureError);
    });

    it('resolves to null when the person dismisses the picker - that is not an error', async () => {
      stubMediaDevices({
        getDisplayMedia: async () => {
          throw new DOMException('The user did not select a display surface.', 'NotAllowedError');
        },
      });

      await expectAsync(service.captureScreen()).toBeResolvedTo(null);
    });

    it('resolves to null for AbortError, the other name a dismissed picker can use', async () => {
      stubMediaDevices({
        getDisplayMedia: async () => {
          throw new DOMException('Aborted.', 'AbortError');
        },
      });

      await expectAsync(service.captureScreen()).toBeResolvedTo(null);
    });

    it('rejects instead of swallowing an actual failure', async () => {
      const failure = new DOMException('The display capture is blocked by policy.', 'SecurityError');
      stubMediaDevices({
        getDisplayMedia: async () => {
          throw failure;
        },
      });

      await expectAsync(service.captureScreen()).toBeRejectedWith(failure);
    });

    it('asks the picker to prefer the current tab', async () => {
      // The dismissal path is the simplest way to get a resolved call without
      // building a whole fake MediaStream - the constraints passed in are
      // what this test cares about, not what comes back.
      const getDisplayMedia = jasmine.createSpy('getDisplayMedia').and.callFake(async () => {
        throw new DOMException('The user did not select a display surface.', 'NotAllowedError');
      });
      stubMediaDevices({getDisplayMedia});

      await service.captureScreen();

      expect(getDisplayMedia).toHaveBeenCalledWith(
        jasmine.objectContaining({
          video: jasmine.objectContaining({displaySurface: 'browser'}),
          preferCurrentTab: true,
        }),
      );
    });
  });

  describe('scaleFor', () => {
    it('is image pixels per displayed pixel', () => {
      expect(service.scaleFor(300, 600)).toBe(2);
      expect(service.scaleFor(300, 150)).toBe(0.5);
    });

    it('is null when there is nothing to measure, rather than assuming a scale of 1', () => {
      expect(service.scaleFor(0, 600)).toBeNull();
    });
  });

  describe('regionFrom', () => {
    // The fragile part: a rectangle drawn on the scaled-down preview has to
    // land on the right pixels of the full-resolution capture, including at
    // scales that are not whole numbers.
    for (const scale of [1, 2, 0.5, 1.6666666]) {
      it(`converts a drag into image pixels at scale ${scale}`, () => {
        const region = service.regionFrom({x: 10, y: 20}, {x: 40, y: 55}, scale);

        expect(region).not.toBeNull();
        expect(region!.x).toBeCloseTo(10 * scale, 5);
        expect(region!.y).toBeCloseTo(20 * scale, 5);
        expect(region!.width).toBeCloseTo(30 * scale, 5);
        expect(region!.height).toBeCloseTo(35 * scale, 5);
      });
    }

    it('normalises a drag drawn from bottom-right to top-left', () => {
      const region = service.regionFrom({x: 40, y: 55}, {x: 10, y: 20}, 1);

      expect(region).toEqual({x: 10, y: 20, width: 30, height: 35});
    });

    it('discards a drag too small to have been meant, measured in displayed pixels', () => {
      expect(service.regionFrom({x: 10, y: 10}, {x: 11, y: 11}, 1)).toBeNull();
    });

    it('discards a region that would still be too small once scaled up', () => {
      // 3 displayed pixels is above the drag threshold but the resulting
      // image-pixel region is still under the minimum region size.
      expect(service.regionFrom({x: 10, y: 10}, {x: 13, y: 13}, 1)).toBeNull();
    });
  });

  describe('compose', () => {
    it('burns a hide redaction into the pixels, not just alongside them', () => {
      const original: [number, number, number] = [10, 20, 30];
      const capture = filledCanvas(100, 60, `rgb(${original.join(',')})`);

      const composed = service.compose(capture, [{kind: 'hide', x: 10, y: 10, width: 20, height: 20}]);
      const context = composed.getContext('2d')!;

      const inside = context.getImageData(20, 20, 1, 1).data;
      expect(Array.from(inside.slice(0, 3))).not.toEqual(original);
      // Fully opaque: nothing of the original picture may show through.
      expect(inside[3]).toBe(255);

      const outside = context.getImageData(50, 50, 1, 1).data;
      expect(Array.from(outside.slice(0, 3))).toEqual(original);
    });

    it('dims everything outside a highlighted region without touching the region itself', () => {
      const original: [number, number, number] = [200, 200, 200];
      const capture = filledCanvas(100, 60, `rgb(${original.join(',')})`);

      const composed = service.compose(capture, [{kind: 'highlight', x: 10, y: 10, width: 20, height: 20}]);
      const context = composed.getContext('2d')!;

      const spot = context.getImageData(20, 20, 1, 1).data;
      expect(Array.from(spot.slice(0, 3))).toEqual(original);

      const dimmed = context.getImageData(50, 50, 1, 1).data;
      expect(Array.from(dimmed.slice(0, 3))).not.toEqual(original);
    });

    it('leaves no original pixel under the edge of a cover drawn at a fractional scale', () => {
      // The scale between the displayed canvas and the capture is
      // captureWidth / displayedWidth and is practically never whole, so every
      // committed region has fractional edges. Canvas blends a fractional edge
      // with what is underneath: measured against flat red, the worst edge
      // pixel of this box came back as rgb(253, 0, 1) - about 99% of the thing
      // the cover exists to hide, and invisible in the editor because the
      // preview is scaled down.
      const capture = filledCanvas(60, 60, 'rgb(255, 0, 0)');
      const region = {kind: 'hide' as const, x: 10.9, y: 10.9, width: 13.4, height: 13.4};

      const context = service.compose(capture, [region]).getContext('2d')!;

      // The whole area the cover claims, edge ring included - the middle was
      // never the part at risk. Both cover colours are dark; anything still
      // carrying the red is the original showing through.
      const left = Math.floor(region.x);
      const top = Math.floor(region.y);
      const right = Math.ceil(region.x + region.width);
      const bottom = Math.ceil(region.y + region.height);
      const leaking: string[] = [];
      for (let x = left; x < right; x++) {
        for (let y = top; y < bottom; y++) {
          const [r, g, b, a] = context.getImageData(x, y, 1, 1).data;
          if (r > 100 || a !== 255) leaking.push(`(${x}, ${y}) = rgba(${r}, ${g}, ${b}, ${a})`);
        }
      }

      expect(leaking).toEqual([]);
    });

    it('covers no more than one pixel beyond what was drawn', () => {
      // The cover grows outwards to whole pixels, and no further: growing it
      // by more would paint over picture nobody asked to hide.
      const original: [number, number, number] = [255, 0, 0];
      const capture = filledCanvas(60, 60, `rgb(${original.join(',')})`);
      const region = {kind: 'hide' as const, x: 10.9, y: 10.9, width: 13.4, height: 13.4};

      const context = service.compose(capture, [region]).getContext('2d')!;

      const justOutside = context.getImageData(Math.floor(region.x) - 1, 15, 1, 1).data;
      expect(Array.from(justOutside.slice(0, 3))).toEqual(original);
    });

    it('dims the ring around a highlight exactly as a whole-pixel one would', () => {
      // The mirror image of the cover, and the reason the snap goes the other
      // way there: a hole with fractional edges leaves a ring of half-dimmed
      // pixels beside the spot. Snapped inwards, every pixel is either fully
      // in the spot or fully dimmed - which is to say the result is
      // indistinguishable from having drawn the whole-pixel region instead.
      //
      // Compared rather than measured, because the spotlight's own outline
      // sits on the boundary and covers the ring: the difference is real but
      // only a few units per channel once the outline is over it.
      const capture = filledCanvas(120, 120, 'rgb(200, 200, 200)');

      const fractional = service.compose(capture, [{kind: 'highlight', x: 20.4, y: 20.4, width: 40.7, height: 40.7}]);
      const whole = service.compose(capture, [{kind: 'highlight', x: 21, y: 21, width: 40, height: 40}]);

      const left = fractional.getContext('2d')!.getImageData(0, 0, 120, 120).data;
      const right = whole.getContext('2d')!.getImageData(0, 0, 120, 120).data;
      let differing = 0;
      for (let i = 0; i < left.length; i += 4) {
        if (left[i] !== right[i] || left[i + 1] !== right[i + 1] || left[i + 2] !== right[i + 2]) differing++;
      }

      expect(differing).toBe(0);
    });

    it('leaves the picture untouched when there is nothing to redact', () => {
      const original: [number, number, number] = [1, 2, 3];
      const capture = filledCanvas(10, 10, `rgb(${original.join(',')})`);

      const composed = service.compose(capture, []);
      const pixel = composed.getContext('2d')!.getImageData(5, 5, 1, 1).data;

      expect(Array.from(pixel.slice(0, 3))).toEqual(original);
    });
  });

  describe('toAttachment', () => {
    it('encodes the composed picture as a PNG in the shape the feedback report attaches', async () => {
      const capture = filledCanvas(20, 20, 'rgb(5, 6, 7)');

      const attachment = await service.toAttachment(capture, []);

      expect(attachment.filename).toBe('screenshot.png');
      expect(attachment.contentType).toBe('image/png');
      expect(attachment.data).toBeInstanceOf(Uint8Array);
      // The PNG signature, so this is actually a PNG and not just some bytes.
      expect(Array.from(attachment.data.slice(0, 8))).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    });
  });
});
