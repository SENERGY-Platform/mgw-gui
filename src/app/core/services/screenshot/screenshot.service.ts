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

import {Injectable} from '@angular/core';

/** A region drawn onto a screenshot, in the pixels of the captured image. */
export interface Redaction {
  kind: 'highlight' | 'hide';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

/** The composed picture, ready to be attached to a bug report. */
export interface ScreenshotAttachment {
  data: Uint8Array;
  filename: string;
  contentType: string;
}

/**
 * Thrown for an actual capture failure (no permission, no such API, no frame
 * arrived). The user simply closing the picker is not one of these - see
 * ScreenshotService.captureScreen.
 */
export class ScreenshotCaptureError extends Error {}

/** Below this a drag is a click that slipped, in the pixels it was drawn in. */
const MinimumDrag = 2;
/** And below this the region is too small to have been meant, in image pixels. */
const MinimumRegion = 6;

/** How long to wait for a drawable frame before giving up on the capture. */
const FrameTimeout = 5_000;
/** HTMLMediaElement.HAVE_CURRENT_DATA: below this, drawImage copies nothing. */
const HaveCurrentData = 2;
/**
 * What getDisplayMedia rejects with when no surface was chosen. A
 * Permissions-Policy denial also lands on NotAllowedError, so this cannot
 * distinguish "the user said no" from "an embed forbids this" - both are
 * treated as a plain cancellation.
 */
const DeclinedNames = ['NotAllowedError', 'AbortError', 'NotFoundError'];

const DimFill = 'rgba(0, 0, 0, 0.55)';
const HighlightOutline = 'rgba(255, 255, 255, 0.9)';
const HighlightOutlineWidth = 3;
/**
 * Fully opaque, and it has to stay that way: this flat fill is the entire
 * reason a hidden region is hidden. Any transparency here would leak what is
 * underneath into the composed image.
 */
const HideFill = '#4b5563';
const HideStripe = '#374151';
/** Stripe geometry in image pixels, so a hidden region looks the same at every zoom level. */
const StripePeriod = 18;
const StripeWidth = 9;
const PreviewUnder = '#1c1c1c';
const PreviewOver = '#ffffff';

/** Whole-pixel rectangle, in image pixels. */
interface PixelRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A region moved onto whole pixels.
 *
 * Every committed region has fractional edges: it comes from `regionFrom`,
 * whose scale is `captureWidth / displayedWidth` and is practically never a
 * whole number. Canvas resolves a fractional edge by blending the new colour
 * with the pixel that is already there, in proportion to how much of it the
 * shape covers - so a cover painted at x = 10.9 leaves a border of pixels that
 * are still mostly the original picture. Measured against a flat colour, the
 * worst edge pixel of a 13x13 cover came back at roughly 99% of what it was
 * meant to hide, and at the size the editor displays the capture none of that
 * is visible.
 *
 * Snapping removes the blend by giving every edge an integer coordinate.
 * Which way to snap is the caller's to say, because the safe direction differs:
 * `outwards` grows the rectangle so nothing of the original survives inside it,
 * `inwards` shrinks it so nothing outside it is left half-covered.
 */
function snapRegion(region: Redaction, direction: 'inwards' | 'outwards'): PixelRegion {
  const outwards = direction === 'outwards';
  const left = outwards ? Math.floor(region.x) : Math.ceil(region.x);
  const top = outwards ? Math.floor(region.y) : Math.ceil(region.y);
  const right = outwards ? Math.ceil(region.x + region.width) : Math.floor(region.x + region.width);
  const bottom = outwards ? Math.ceil(region.y + region.height) : Math.floor(region.y + region.height);

  // Clamped, because an inward snap of a region less than a pixel across
  // crosses over. Canvas reads a negative extent as the mirror image of the
  // rectangle, which would put the shape somewhere nobody drew it.
  return {
    x: left,
    y: top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

/**
 * Screen capture and redaction for bug-report screenshots, using only
 * standard browser APIs (getDisplayMedia, canvas).
 */
@Injectable({
  providedIn: 'root',
})
export class ScreenshotService {
  /** Whether this browser can be asked for a picture of the screen at all. */
  isSupported(): boolean {
    return typeof navigator?.mediaDevices?.getDisplayMedia === 'function';
  }

  /**
   * Asks the browser for a picture of the current tab and returns it as a
   * canvas at the capture's original resolution.
   *
   * Resolves to null when the person dismisses the picker - that is a normal
   * outcome, not a failure. Anything else, including the API being absent or
   * no frame ever arriving, throws a ScreenshotCaptureError so the caller can
   * tell the two apart.
   */
  async captureScreen(): Promise<HTMLCanvasElement | null> {
    if (!this.isSupported()) {
      throw new ScreenshotCaptureError('Screen capture is not supported in this browser.');
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        audio: false,
        // A standardised hint (Media Capture spec, on MediaTrackConstraints):
        // prefer a tab surface over a window or the whole screen. A picker
        // that ignores it just falls back to its normal chooser, so this is
        // a hint and not a guarantee - the person can still pick anything.
        video: {displaySurface: 'browser'},
        // Chromium-only hints, ignored elsewhere: puts this tab at the top of
        // the picker and keeps whole monitors out of it. preferCurrentTab
        // needs the cast below because lib.dom.d.ts places it on
        // MediaStreamConstraints, not on the DisplayMediaStreamOptions that
        // getDisplayMedia actually takes.
        preferCurrentTab: true,
        surfaceSwitching: 'exclude',
        monitorTypeSurfaces: 'exclude',
      } as DisplayMediaStreamOptions);
    } catch (error) {
      if (error instanceof DOMException && DeclinedNames.includes(error.name)) {
        return null;
      }
      throw error;
    }

    try {
      // `return await`, not `return`: the finally below stops the tracks,
      // and a bare return would run it while firstFrame is still waiting.
      // Drawing from an already-stopped track yields an all-black canvas
      // with no error at all.
      return await this.firstFrame(stream);
    } finally {
      // Without this the tab keeps its "sharing" indicator going for the
      // rest of the session.
      stream.getTracks().forEach((track) => track.stop());
    }
  }

  /** The first painted frame of a stream, copied into a canvas of its own. */
  private async firstFrame(stream: MediaStream): Promise<HTMLCanvasElement> {
    const [track] = stream.getVideoTracks();
    if (!track) throw new ScreenshotCaptureError('The screen capture carried no video track.');

    const video = document.createElement('video');
    // Both before play(), which is when the autoplay policy is checked:
    // muted is what makes an unattended play() allowed.
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;

    // In the document, as one transparent pixel. A detached element is not
    // in the compositor and takes far longer to present its first frame;
    // display:none counts as detached, hence opacity instead.
    video.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none';
    document.body.append(video);

    try {
      // Not fatal on rejection: play() is not itself a presentation signal,
      // the gate that matters is drawable() below.
      // eslint-disable-next-line @typescript-eslint/no-empty-function -- a rejected play() is expected and ignored
      await video.play().catch(() => {});
      await this.drawable(video, track);

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      // A zero-sized canvas is worse than an error: toBlob would resolve
      // null later and the report would go out with no picture at all.
      if (canvas.width === 0 || canvas.height === 0) {
        throw new ScreenshotCaptureError('The screen capture had no size.');
      }

      const context = canvas.getContext('2d');
      if (!context) throw new ScreenshotCaptureError('No 2d context for the screenshot.');

      // Synchronously, with the track still live. See captureScreen above.
      context.drawImage(video, 0, 0);
      return canvas;
    } finally {
      video.pause();
      video.srcObject = null;
      video.remove();
    }
  }

  /**
   * Settles once the element has a frame drawImage can copy. Rejects rather
   * than hanging forever: a caller that never hears back cannot put back
   * whatever it hid for the capture.
   */
  private drawable(video: HTMLVideoElement, track: MediaStreamTrack): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let settled = false;
      let frame: number | undefined;

      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(deadline);
        if (frame !== undefined && typeof video.cancelVideoFrameCallback === 'function') {
          video.cancelVideoFrameCallback(frame);
        }
        video.removeEventListener('loadeddata', check);
        video.removeEventListener('canplay', check);
        video.removeEventListener('timeupdate', check);
        video.removeEventListener('error', onError);
        track.removeEventListener('ended', onEnded);
        if (error) reject(error);
        else resolve();
      };

      const check = () => {
        if (video.readyState >= HaveCurrentData) finish();
      };
      const onError = () => finish(new ScreenshotCaptureError('The screen capture could not be played.'));
      const onEnded = () => finish(new ScreenshotCaptureError('Sharing stopped before a frame arrived.'));
      const deadline = setTimeout(
        () => finish(new ScreenshotCaptureError('The screen capture produced no frame in time.')),
        FrameTimeout,
      );

      video.addEventListener('loadeddata', check);
      video.addEventListener('canplay', check);
      video.addEventListener('timeupdate', check);
      video.addEventListener('error', onError);
      track.addEventListener('ended', onEnded);

      // Where it exists, a frame reaching the compositor is a stronger
      // signal than readyState. Feature-detected with typeof because
      // lib.dom types it unconditionally.
      if (typeof video.requestVideoFrameCallback === 'function') {
        frame = video.requestVideoFrameCallback(() => finish());
      }

      // After the listeners, never before: loadeddata can fire during
      // play()'s microtask drain, and waiting for an event that has already
      // happened is a hang with the whole capture behind it.
      check();
    });
  }

  /**
   * Image pixels per displayed pixel, or null when there is nothing to
   * measure.
   *
   * Null rather than falling back to 1: an unmeasurable canvas would
   * otherwise make the scale the entire capture width, turning a small drag
   * into a region tens of thousands of pixels across.
   */
  scaleFor(displayedWidth: number, captureWidth: number): number | null {
    return displayedWidth > 0 ? captureWidth / displayedWidth : null;
  }

  /**
   * A rectangle from two corners, whichever way round they were dragged, in
   * image pixels rather than the CSS pixels the canvas is displayed at.
   *
   * Returns null for anything too small to have been meant, so a stray click
   * does not leave an invisible region on the picture.
   */
  regionFrom(start: Point, end: Point, scale: number): Omit<Redaction, 'kind'> | null {
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);

    if (width < MinimumDrag || height < MinimumDrag) return null;

    const region = {
      x: Math.min(start.x, end.x) * scale,
      y: Math.min(start.y, end.y) * scale,
      width: width * scale,
      height: height * scale,
    };

    if (region.width < MinimumRegion || region.height < MinimumRegion) {
      return null;
    }

    return region;
  }

  /**
   * Draws the committed regions onto a context.
   *
   * Covers first, in the order they were drawn, then one dimming pass for
   * all the regions that were pointed out. The dimming is last so it lies
   * over the covers too - it is translucent black and can therefore only
   * ever hide more, never less.
   */
  paintRedactions(context: CanvasRenderingContext2D, redactions: readonly Redaction[]): void {
    for (const redaction of redactions) {
      if (redaction.kind === 'hide') this.paintHide(context, redaction);
    }

    const spots = redactions.filter((redaction) => redaction.kind === 'highlight');
    if (spots.length > 0) this.paintSpotlight(context, spots);
  }

  /** Everything darkened except the regions that were pointed out. */
  private paintSpotlight(context: CanvasRenderingContext2D, spots: readonly Redaction[]): void {
    const {width, height} = context.canvas;
    // Inwards, the opposite direction from a cover: a hole with a fractional
    // edge leaves a ring of half-dimmed pixels around the spot. Shrinking it
    // to whole pixels means every pixel is either fully in the spot or fully
    // dimmed, and errs towards dimming more of the picture rather than less.
    const holes = spots.map((spot) => snapRegion(spot, 'inwards'));

    context.save();
    // One path: the whole picture, then each spot as a hole in it. `evenodd`
    // is what makes the inner rectangles holes rather than more of the same
    // shape, so this is a single translucent fill and the spots keep their
    // original pixels exactly.
    context.beginPath();
    context.rect(0, 0, width, height);
    for (const hole of holes) {
      context.rect(hole.x, hole.y, hole.width, hole.height);
    }
    context.fillStyle = DimFill;
    context.fill('evenodd');
    context.restore();

    context.save();
    context.strokeStyle = HighlightOutline;
    context.lineWidth = HighlightOutlineWidth;
    for (const hole of holes) {
      context.strokeRect(hole.x, hole.y, hole.width, hole.height);
    }
    context.restore();
  }

  /** An opaque, striped box over whatever was there - permanent once drawn. */
  private paintHide(context: CanvasRenderingContext2D, region: Redaction): void {
    // Outwards: the cover has to end on whole pixels or the canvas blends its
    // edge with what it is meant to hide. See snapRegion.
    const {x, y, width, height} = snapRegion(region, 'outwards');

    // First and unconditionally: the cover. Everything below is decoration.
    context.fillStyle = HideFill;
    context.fillRect(x, y, width, height);

    context.save();
    // Clipped, so the diagonals cannot run past the region someone drew.
    context.beginPath();
    context.rect(x, y, width, height);
    context.clip();

    context.fillStyle = HideStripe;
    // Parallelograms sheared by the region's own height, which is what makes
    // them run at 45 degrees whatever shape the region is.
    for (let offset = -height; offset < width; offset += StripePeriod) {
      context.beginPath();
      context.moveTo(x + offset, y + height);
      context.lineTo(x + offset + StripeWidth, y + height);
      context.lineTo(x + offset + StripeWidth + height, y);
      context.lineTo(x + offset + height, y);
      context.closePath();
      context.fill();
    }
    context.restore();
  }

  /**
   * The region under the cursor, drawn so it cannot be mistaken for a
   * committed one: a dashed outline over pixels that are still showing.
   *
   * Never filled, even for 'hide'. Only the committed redactions are burnt
   * into the picture, so a filled preview left behind by a cancelled drag
   * would look exactly like an address that has been covered up and has not.
   */
  paintPreview(context: CanvasRenderingContext2D, redaction: Redaction, scale: number): void {
    const {x, y, width, height} = redaction;

    context.save();
    context.lineWidth = 4 * scale;

    // Twice: a dark solid line, then light dashes over it. One colour
    // disappears against some part of any screenshot.
    context.setLineDash([]);
    context.strokeStyle = PreviewUnder;
    context.strokeRect(x, y, width, height);

    context.setLineDash([8 * scale, 6 * scale]);
    context.strokeStyle = PreviewOver;
    context.strokeRect(x, y, width, height);

    context.restore();
  }

  /**
   * The picture as it will be sent: the capture with the regions burnt into
   * it. Burnt in rather than sent alongside - a hidden region that travels
   * as coordinates next to the original image is not hidden at all.
   */
  compose(capture: HTMLCanvasElement, redactions: readonly Redaction[]): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = capture.width;
    canvas.height = capture.height;

    const context = canvas.getContext('2d');
    if (!context) throw new ScreenshotCaptureError('No 2d context to compose the screenshot.');

    context.drawImage(capture, 0, 0);
    this.paintRedactions(context, redactions);

    return canvas;
  }

  /** The composed picture, encoded as a PNG attachment. */
  async toAttachment(capture: HTMLCanvasElement, redactions: readonly Redaction[]): Promise<ScreenshotAttachment> {
    const canvas = this.compose(capture, redactions);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    // Throws rather than returning something empty: a report that quietly
    // goes out without the picture someone painted regions onto is the one
    // failure they cannot see and cannot tell us about.
    if (!blob) throw new ScreenshotCaptureError('The screenshot could not be encoded.');

    return {
      data: new Uint8Array(await blob.arrayBuffer()),
      filename: 'screenshot.png',
      contentType: 'image/png',
    };
  }
}
