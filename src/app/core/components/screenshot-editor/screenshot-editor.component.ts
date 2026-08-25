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

import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatButtonModule} from '@angular/material/button';
import {MatChipsModule} from '@angular/material/chips';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {TranslocoPipe, provideTranslocoScope} from '@jsverse/transloco';
import {Point, Redaction, ScreenshotAttachment, ScreenshotService} from '../../services/screenshot/screenshot.service';

/** Whether a pointer drag draws a region or moves the view around. */
type EditorMode = 'draw' | 'move';

/**
 * A pointer drag in progress, in the CSS pixels the canvas is displayed at -
 * not yet converted to image pixels, since that conversion needs the
 * canvas's current display width and happens as late as possible.
 */
interface Drag {
  pointerId: number;
  start: Point;
  end: Point;
}

/**
 * A pan gesture in progress. Tracked in raw pointer-event client
 * coordinates rather than coordinates measured against the canvas, because
 * the canvas itself is what moves while this runs - measuring against a
 * box that is being dragged out from under the measurement would never
 * accumulate any actual displacement.
 */
interface PanDrag {
  pointerId: number;
  originClient: Point;
  originPan: Point;
}

/** Multiplied or divided into the scale by one press of zoom in/out. */
const ZoomStep = 1.25;
/** CSS pixels per image pixel at the most anyone can zoom in. */
const MaxScale = 8;
/**
 * The image-pixel span the magnifier crops from the original capture, and
 * also its own CSS size: the magnifier always shows that crop at one image
 * pixel per CSS pixel, regardless of the main view's current zoom, because
 * the entire point is to show the original resolution when the main view is
 * too zoomed out to read it.
 */
const MagnifierSpan = 140;
/** How close the drag point has to get to the magnifier's home corner before it hops to the opposite one. */
const MagnifierAvoidance = MagnifierSpan + 24;
/** Slack for float comparisons on scale, which is a product of divisions and multiplications. */
const Epsilon = 1e-6;

/**
 * The captured picture with the two tools that make it safe to share: a box
 * to point at what went wrong, and a box to paint over what nobody outside
 * needs to see. Both are burnt into the image before `getAttachment()`
 * returns it - see ScreenshotService.compose.
 *
 * The canvas is shown scaled to fit the panel, not necessarily at its
 * original resolution - `scale` and `pan` below let it be zoomed and moved -
 * so every pointer coordinate is converted from displayed pixels to image
 * pixels via ScreenshotService.scaleFor/regionFrom before it is stored or
 * emitted. That conversion reads the canvas's actual rendered position and
 * size (getBoundingClientRect), which already accounts for whatever CSS
 * size and transform the current zoom and pan applied to it - so the
 * pointer math itself needs no separate zoom or pan terms and stays the one
 * pixel-exact path regardless of viewport state.
 */
@Component({
  selector: 'mgw-screenshot-editor',
  templateUrl: './screenshot-editor.component.html',
  styleUrl: './screenshot-editor.component.css',
  imports: [MatButtonToggleModule, MatButtonModule, MatChipsModule, MatIconModule, MatTooltipModule, TranslocoPipe],
  providers: [provideTranslocoScope('core')],
})
export class ScreenshotEditorComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input({required: true}) capture!: HTMLCanvasElement;
  @Input() redactions: Redaction[] = [];
  @Output() redactionsChange = new EventEmitter<Redaction[]>();

  @ViewChild('wrapper') private wrapperRef!: ElementRef<HTMLDivElement>;
  @ViewChild('canvas') private canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('magnifier') private magnifierRef?: ElementRef<HTMLCanvasElement>;

  tool: Redaction['kind'] = 'hide';
  mode: EditorMode = 'draw';
  drag: Drag | null = null;
  private panDrag: PanDrag | null = null;
  /**
   * Shown after a drag was thrown away for being too small. Silence there is
   * the dangerous outcome: somebody drags a box over an address, sees the
   * preview follow their finger, lets go, and has no reason to look for a
   * chip that never appeared.
   */
  discardedDrag = false;

  /**
   * CSS pixels per image pixel that show the whole capture within the
   * wrapper - recomputed whenever the wrapper is resized (the dialog around
   * it growing once a screenshot appears, or the window being resized) or a
   * new capture arrives.
   */
  fitScale = 1;
  /** CSS pixels per image pixel actually in effect right now. */
  scale = 1;
  /**
   * Extra offset on top of the centred position, in CSS pixels. Only
   * meaningful once zoomed in past fit; reset to the origin whenever the
   * view returns to or below fit, so a stale offset never leaves the image
   * looking off-centre for no reason.
   */
  pan: Point = {x: 0, y: 0};

  private resizeObserver?: ResizeObserver;
  private screenshotService = inject(ScreenshotService);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['capture']) {
      this.mode = 'draw';
      this.pan = {x: 0, y: 0};
      this.recomputeFitScale();
      this.scale = this.fitScale;
    }
    this.redraw();
  }

  ngAfterViewInit(): void {
    // Deferred a microtask: this is the first point the wrapper can actually
    // be measured, but ngOnChanges already rendered and Angular already
    // checked a first guess for this same tick - the fitScale=1 default,
    // since the wrapper does not exist yet while ngOnChanges runs.
    // Correcting scale/fitScale synchronously here would change a value
    // Angular already checked earlier in this same tick, which is exactly
    // what ExpressionChangedAfterItHasBeenCheckedError exists to catch.
    // Landing one microtask later starts a change detection run of its own
    // instead of colliding with this one.
    Promise.resolve().then(() => {
      this.recomputeFitScale();
      this.scale = this.fitScale;
      this.redraw();
    });

    // Absent under whatever runs the unit tests, in principle - not the
    // Chromium this project actually ships tests against, but cheap to
    // guard rather than assume.
    if (typeof ResizeObserver === 'function') {
      this.resizeObserver = new ResizeObserver(() => this.onWrapperResize());
      this.resizeObserver.observe(this.wrapperRef.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  setTool(kind: Redaction['kind']): void {
    this.tool = kind;
  }

  setMode(mode: EditorMode): void {
    this.mode = mode;
  }

  remove(index: number): void {
    this.emit(this.redactions.filter((_, i) => i !== index));
  }

  reset(): void {
    if (this.redactions.length === 0) return;
    this.emit([]);
  }

  /** Whether the view is currently zoomed in past fit, which is what makes moving it meaningful. */
  canPan(): boolean {
    return this.scale > this.fitScale + Epsilon;
  }

  canZoomIn(): boolean {
    return this.scale < MaxScale - Epsilon;
  }

  canZoomOut(): boolean {
    return this.scale > this.fitScale + Epsilon;
  }

  /** Shows the whole capture within the wrapper, and recentres it. */
  zoomToFit(): void {
    this.pan = {x: 0, y: 0};
    this.setScale(this.fitScale);
  }

  /** One image pixel per CSS pixel - the capture at its own resolution. */
  zoomTo100(): void {
    this.pan = {x: 0, y: 0};
    this.setScale(1);
  }

  zoomIn(): void {
    this.setScale(this.scale * ZoomStep);
  }

  zoomOut(): void {
    this.setScale(this.scale / ZoomStep);
  }

  /**
   * The composed picture, ready to attach to a bug report.
   *
   * A drag still under a finger is finished first. It is not in `redactions`
   * yet and the preview is deliberately never burnt in, so composing without
   * this sends the original pixels of a region somebody is in the middle of
   * covering - on a touch screen one finger drawing over a password and a
   * second one on Send is all it takes.
   */
  getAttachment(): Promise<ScreenshotAttachment> {
    this.commitDrag();
    return this.screenshotService.toAttachment(this.capture, this.redactions);
  }

  onPointerDown(event: PointerEvent): void {
    // One interaction at a time: a second finger landing mid-gesture would
    // otherwise replace the first's start point, and its release would then
    // commit or move something nobody meant to.
    if (this.drag || this.panDrag) return;

    const canvas = event.currentTarget as HTMLCanvasElement;
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // No such active pointer - nothing to capture, the drag still works.
    }

    if (this.mode === 'move') {
      // Only actually starts a pan once there is somewhere to pan to - at or
      // below fit the whole image already shows, and translating it here
      // would just push it off-centre for no reason.
      if (this.canPan()) {
        this.panDrag = {
          pointerId: event.pointerId,
          originClient: {x: event.clientX, y: event.clientY},
          originPan: {...this.pan},
        };
      }
      return;
    }

    this.discardedDrag = false;
    const point = this.pointIn(event);
    this.drag = {pointerId: event.pointerId, start: point, end: point};
    this.redraw();
  }

  onPointerMove(event: PointerEvent): void {
    if (this.panDrag) {
      if (this.panDrag.pointerId !== event.pointerId) return;
      this.applyPan(event);
      return;
    }

    if (this.drag?.pointerId !== event.pointerId) return;
    this.drag = {...this.drag, end: this.pointIn(event)};
    this.redraw();
  }

  onPointerUp(event: PointerEvent): void {
    if (this.panDrag) {
      // Same reasoning as the drag branch below: the last pointermove can be
      // missed, so the release has to apply the final displacement itself
      // rather than trust that a move already did.
      if (this.panDrag.pointerId === event.pointerId) {
        this.applyPan(event);
        this.panDrag = null;
      }
      return;
    }

    if (this.drag?.pointerId !== event.pointerId) return;

    // The last move can be missed; the release carries the real end point.
    this.drag = {...this.drag, end: this.pointIn(event)};
    this.commitDrag();
  }

  /**
   * Moves the view to where this pointer has dragged it. Shared by the move
   * and the release, because the release cannot assume a move already
   * carried the final displacement.
   */
  private applyPan(event: PointerEvent): void {
    if (!this.panDrag) return;
    this.pan = this.boundPan({
      x: this.panDrag.originPan.x + (event.clientX - this.panDrag.originClient.x),
      y: this.panDrag.originPan.y + (event.clientY - this.panDrag.originClient.y),
    });
    this.applyViewport();
  }

  /**
   * Keeps the image reachable. The canvas is what the pointer grabs, so an
   * unbounded offset can push it out of the wrapper entirely and leave
   * nothing under the cursor to drag back with. Bounded to the overhang -
   * how far the scaled image sticks out past the wrapper on each axis - so
   * an edge can be brought to the wrapper's edge but no further.
   */
  private boundPan(pan: Point): Point {
    const wrapper = this.wrapperRef?.nativeElement;
    if (!wrapper || !this.capture) return pan;

    const limitX = Math.max(0, (this.capture.width * this.scale - wrapper.clientWidth) / 2);
    const limitY = Math.max(0, (this.capture.height * this.scale - wrapper.clientHeight) / 2);
    return {
      x: Math.min(limitX, Math.max(-limitX, pan.x)),
      y: Math.min(limitY, Math.max(-limitY, pan.y)),
    };
  }

  /**
   * Turns whatever is being dragged into a committed region, or says out loud
   * that it was too small to keep.
   *
   * Shared by the pointer release and by getAttachment, so a region is
   * committed the same way whether the finger came up or the report went out.
   */
  private commitDrag(): void {
    const drag = this.drag;
    if (!drag) return;
    this.drag = null;

    const canvas = this.canvasRef?.nativeElement;
    const scale = canvas
      ? this.screenshotService.scaleFor(canvas.getBoundingClientRect().width, this.capture.width)
      : null;
    const region = scale === null ? null : this.screenshotService.regionFrom(drag.start, drag.end, scale);

    if (region) {
      this.emit([...this.redactions, {kind: this.tool, ...region}]);
      return;
    }

    this.discardedDrag = true;
    this.redraw();
  }

  /**
   * A drag can end without a pointerup: palm rejection, an edge swipe, a
   * long-press menu, a button released outside the canvas. The preview is
   * never burnt into the picture, so simply dropping it here is enough - it
   * cannot leave behind anything that looks like a committed region. Clears
   * a pan in progress the same way, for the same reason.
   */
  onPointerCancel(): void {
    this.panDrag = null;
    this.drag = null;
    this.redraw();
  }

  /** Which corner of the wrapper the magnifier sits in, given where the drag point currently is. */
  magnifierCorner(): 'top-right' | 'bottom-left' {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.drag) return 'top-right';

    const rect = canvas.getBoundingClientRect();
    const nearRightEdge = rect.width - this.drag.end.x < MagnifierAvoidance;
    const nearTopEdge = this.drag.end.y < MagnifierAvoidance;
    return nearRightEdge && nearTopEdge ? 'bottom-left' : 'top-right';
  }

  private pointIn(event: PointerEvent): Point {
    const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
    return {x: event.clientX - bounds.left, y: event.clientY - bounds.top};
  }

  private emit(redactions: Redaction[]): void {
    this.redactions = redactions;
    this.redactionsChange.emit(redactions);
    this.redraw();
  }

  private onWrapperResize(): void {
    // Only carried along automatically while nobody has picked a zoom level
    // of their own - a person who zoomed in on purpose does not want the
    // dialog quietly growing that away from under them.
    const wasAtFit = this.isAtFit();
    this.recomputeFitScale();
    if (wasAtFit) {
      this.scale = this.fitScale;
      this.pan = {x: 0, y: 0};
    }
    this.redraw();
  }

  private isAtFit(): boolean {
    return Math.abs(this.scale - this.fitScale) < Epsilon && this.pan.x === 0 && this.pan.y === 0;
  }

  /**
   * CSS pixels per image pixel that show the whole capture within the
   * wrapper right now.
   *
   * Measured with clientWidth/clientHeight, not getBoundingClientRect: the
   * wrapper's border sits outside the content box, and the canvas is
   * centred inside that content box - so the border never has to be
   * subtracted out by hand, and it never leaks into the ratio below. That
   * matters beyond tidiness whenever nothing outside gives the wrapper a
   * height of its own (a bare unit test, or the dialog for a moment before
   * it has been sized): the wrapper then takes its height from the canvas,
   * which took its height from the wrapper a moment ago. Reading the
   * border-box would add the same couple of pixels back in on every one of
   * those round trips and never settle; the content box reproduces exactly
   * the height this method already handed out, so it lands on it and stops.
   */
  private recomputeFitScale(): void {
    const wrapper = this.wrapperRef?.nativeElement;
    const width = wrapper?.clientWidth ?? 0;
    const height = wrapper?.clientHeight ?? 0;
    if (width <= 0 || height <= 0 || !this.capture) {
      this.fitScale = 1;
      return;
    }

    const widthRatio = width / this.capture.width;
    const heightRatio = height / this.capture.height;
    this.fitScale = Math.min(widthRatio, heightRatio);
  }

  private setScale(target: number): void {
    this.scale = Math.min(MaxScale, Math.max(this.fitScale, target));
    // Below the floor a pan cannot mean anything - see canPan - and a stale
    // one left over from a deeper zoom would just look off-centre.
    if (this.scale <= this.fitScale + Epsilon) {
      this.pan = {x: 0, y: 0};
    }
    this.redraw();
  }

  /**
   * Sizes and positions the canvas element for the current scale and pan.
   *
   * This is the only place display size is set, and it is deliberately an
   * explicit pixel size rather than a percentage: `getBoundingClientRect`
   * on the result is what `scaleFor`/`regionFrom` read to convert pointer
   * coordinates back to image pixels, so this assignment is what keeps that
   * conversion correct at every zoom level.
   */
  private applyViewport(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.capture) return;

    canvas.style.width = `${this.capture.width * this.scale}px`;
    canvas.style.height = `${this.capture.height * this.scale}px`;
    canvas.style.transform = this.pan.x === 0 && this.pan.y === 0 ? '' : `translate(${this.pan.x}px, ${this.pan.y}px)`;
  }

  /**
   * Redrawn from the capture every time rather than drawn onto, so removing
   * a region is just rendering one fewer of them.
   */
  private redraw(): void {
    this.applyViewport();

    const canvas = this.canvasRef?.nativeElement;
    const context = canvas?.getContext('2d');
    if (!canvas || !context || !this.capture) return;

    // Only assigned when it differs: writing width throws away the backing
    // store, and this runs on every pointermove.
    if (canvas.width !== this.capture.width) canvas.width = this.capture.width;
    if (canvas.height !== this.capture.height) canvas.height = this.capture.height;
    context.drawImage(this.capture, 0, 0);

    this.screenshotService.paintRedactions(context, this.redactions);

    const scale = this.screenshotService.scaleFor(canvas.getBoundingClientRect().width, this.capture.width);
    const inProgress =
      scale === null || !this.drag ? null : this.screenshotService.regionFrom(this.drag.start, this.drag.end, scale);
    if (inProgress && scale !== null) {
      this.screenshotService.paintPreview(context, {kind: this.tool, ...inProgress}, scale);
    }

    this.paintMagnifier();
  }

  /**
   * Crops the region under the drag point straight from the original
   * capture, at one image pixel per CSS pixel, into the magnifier canvas -
   * from the capture rather than the just-painted preview canvas, so a
   * cover already burnt in nearby can never hide the very pixels someone is
   * trying to aim at.
   */
  private paintMagnifier(): void {
    const magnifier = this.magnifierRef?.nativeElement;
    const canvas = this.canvasRef?.nativeElement;
    const context = magnifier?.getContext('2d');
    if (!magnifier || !canvas || !context || !this.drag || !this.capture) return;

    const scale = this.screenshotService.scaleFor(canvas.getBoundingClientRect().width, this.capture.width);
    if (scale === null) return;

    if (magnifier.width !== MagnifierSpan) magnifier.width = MagnifierSpan;
    if (magnifier.height !== MagnifierSpan) magnifier.height = MagnifierSpan;

    const centerX = this.drag.end.x * scale;
    const centerY = this.drag.end.y * scale;
    const srcWidth = Math.min(MagnifierSpan, this.capture.width);
    const srcHeight = Math.min(MagnifierSpan, this.capture.height);
    const srcX = Math.min(Math.max(0, centerX - srcWidth / 2), this.capture.width - srcWidth);
    const srcY = Math.min(Math.max(0, centerY - srcHeight / 2), this.capture.height - srcHeight);

    context.clearRect(0, 0, MagnifierSpan, MagnifierSpan);
    context.drawImage(
      this.capture,
      srcX,
      srcY,
      srcWidth,
      srcHeight,
      (MagnifierSpan - srcWidth) / 2,
      (MagnifierSpan - srcHeight) / 2,
      srcWidth,
      srcHeight,
    );
  }
}
