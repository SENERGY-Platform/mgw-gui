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
import {MatDialogRef} from '@angular/material/dialog';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import type {Mock} from 'vitest';
import {provideTranslocoTesting} from 'src/testing/transloco-testing';
import {ScreenshotService} from '../../services/screenshot/screenshot.service';
import {ReplayCapture} from '../../services/telemetry/telemetry';
import {NotificationService} from '../../services/util/notifications.service';
import {FEEDBACK_SDK, FeedbackDialogComponent, FeedbackSdk} from './feedback-dialog.component';

/** An event of the shape a scope processor sees on the way to Sentry. */
interface StampedEvent {
  type?: string;
  contexts?: {feedback?: Record<string, unknown>};
}

type EventProcessor = (event: StampedEvent) => StampedEvent;

/** What beginReplayCapture answers when a recording was taken. */
function captured(replayId: string | undefined = 'replay-1'): ReplayCapture {
  return {offered: true, replayId, hold: 1};
}

/** And when there was nothing to take. */
const nothingCaptured: ReplayCapture = {offered: false, hold: null};

function makeCapture(width = 10, height = 10): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

describe('FeedbackDialogComponent', () => {
  let fixture: ComponentFixture<FeedbackDialogComponent>;
  let component: FeedbackDialogComponent;
  let sdk: {[K in keyof FeedbackSdk]: Mock};
  let dialogRef: {close: Mock; disableClose: boolean; updateSize: Mock};
  let processors: EventProcessor[];
  let screenshotService: ScreenshotService;
  let notifications: NotificationService;

  async function createComponent(): Promise<void> {
    fixture = TestBed.createComponent(FeedbackDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    // Lets the beginReplayCapture() promise from the constructor settle
    // before a test looks at replayOffered or the checkbox it gates.
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function textarea(): HTMLTextAreaElement {
    return fixture.nativeElement.querySelector('textarea');
  }

  function button(label: string): HTMLButtonElement {
    const found = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).find(
      (candidate) => candidate.textContent?.trim().includes(label),
    );
    if (!found) throw new Error(`no button labelled ${label}`);
    return found;
  }

  function setMessage(value: string): void {
    const element = textarea();
    element.value = value;
    element.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    dialogRef = {
      close: vi.fn(),
      disableClose: false,
      updateSize: vi.fn(),
    };
    processors = [];
    sdk = {
      captureFeedback: vi.fn().mockReturnValue('event-id'),
      flush: vi.fn().mockResolvedValue(true),
      withScope: vi.fn().mockImplementation((run: (scope: unknown) => unknown) => {
        const scope = {
          addEventProcessor: (processor: EventProcessor) => {
            processors.push(processor);
            return scope;
          },
        };
        return run(scope);
      }),
      watchFeedbackDelivery: vi.fn().mockImplementation(async (send: () => PromiseLike<unknown>) => {
        await send();
        return true;
      }),
      beginReplayCapture: vi.fn().mockResolvedValue(nothingCaptured),
      endReplayCapture: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [FeedbackDialogComponent, provideTranslocoTesting('core')],
      providers: [
        provideNoopAnimations(),
        {provide: MatDialogRef, useValue: dialogRef},
        {provide: FEEDBACK_SDK, useValue: sdk},
      ],
    }).compileComponents();

    screenshotService = TestBed.inject(ScreenshotService);
    notifications = TestBed.inject(NotificationService);
  });

  it('disables Send until a message is entered', async () => {
    await createComponent();

    expect(button('Send').disabled).toBe(true);

    setMessage('Something is broken');

    expect(button('Send').disabled).toBe(false);
  });

  it('sends the message, name, email and url, and reports success', async () => {
    await createComponent();
    setMessage('Something is broken');
    component.name = 'A user';
    component.email = 'user@example.invalid';
    vi.spyOn(notifications, 'showSuccess');

    await component.submit();

    expect(sdk.captureFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Something is broken',
        name: 'A user',
        email: 'user@example.invalid',
        url: window.location.href,
        source: 'feedback-dialog',
      }),
      expect.anything(),
      expect.anything(),
    );
    expect(notifications.showSuccess).toHaveBeenCalled();
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('reports failure and keeps the inputs when delivery is refused', async () => {
    await createComponent();
    setMessage('Something is broken');
    sdk.watchFeedbackDelivery.mockImplementation(async (send: () => PromiseLike<unknown>) => {
      await send();
      return false;
    });
    vi.spyOn(notifications, 'showSuccess');

    await component.submit();
    fixture.detectChanges();

    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(notifications.showSuccess).not.toHaveBeenCalled();
    expect(component.message).toBe('Something is broken');
    expect(fixture.nativeElement.textContent).toContain('could not be sent');
  });

  it('treats an unconfirmed delivery as sent, not as an error', async () => {
    await createComponent();
    setMessage('Something is broken');
    sdk.watchFeedbackDelivery.mockImplementation(async (send: () => PromiseLike<unknown>) => {
      await send();
      return undefined;
    });
    vi.spyOn(notifications, 'showSuccess');
    vi.spyOn(notifications, 'showError');

    await component.submit();
    fixture.detectChanges();

    expect(notifications.showError).not.toHaveBeenCalled();
    expect(notifications.showSuccess).toHaveBeenCalled();
    expect(dialogRef.close).toHaveBeenCalled();
    expect(component.error).toBe('');
  });

  it('sends the held recording when the checkbox was ticked', async () => {
    const capture = captured();
    sdk.beginReplayCapture.mockResolvedValue(capture);
    await createComponent();
    setMessage('Something is broken');
    component.includeReplay = true;

    await component.submit();

    expect(sdk.endReplayCapture).toHaveBeenCalledWith(capture, true);
  });

  it('drops the held recording when the checkbox was left unticked', async () => {
    const capture = captured();
    sdk.beginReplayCapture.mockResolvedValue(capture);
    await createComponent();
    setMessage('Something is broken');

    await component.submit();

    expect(sdk.endReplayCapture).toHaveBeenCalledWith(capture, false);
  });

  it('still settles the held recording when the send throws', async () => {
    const capture = captured();
    sdk.beginReplayCapture.mockResolvedValue(capture);
    await createComponent();
    setMessage('Something is broken');
    component.includeReplay = true;
    sdk.watchFeedbackDelivery.mockImplementation(() => {
      throw new Error('boom');
    });

    await component.submit();

    // A throw says nothing about whether the report arrived - the transport
    // may well have taken it before the flush gave up - so this is the same
    // unknown as an unconfirmed delivery and the recording goes with it.
    expect(sdk.endReplayCapture).toHaveBeenCalledWith(capture, true);
    expect(component.error).not.toBe('');
  });

  it('keeps the recording back when the report is known not to have arrived', async () => {
    // Sent on its own it is a recording of a session Sentry has no report
    // for, uploaded for a message that never got there - and the retry the
    // form invites would upload a second copy of it.
    const capture = captured();
    sdk.beginReplayCapture.mockResolvedValue(capture);
    await createComponent();
    setMessage('Something is broken');
    component.includeReplay = true;
    sdk.watchFeedbackDelivery.mockImplementation(async (send: () => PromiseLike<unknown>) => {
      await send();
      return false;
    });

    await component.submit();

    expect(sdk.endReplayCapture).toHaveBeenCalledWith(capture, false);
  });

  it('stamps the recording id onto the report, so Sentry shows the two together', async () => {
    // The SDK will not do it here: both paths that would start by checking
    // that the recorder is enabled, and taking the recording disabled it.
    sdk.beginReplayCapture.mockResolvedValue(captured('replay-7'));
    await createComponent();
    setMessage('Something is broken');
    component.includeReplay = true;

    await component.submit();

    // The scope has to reach captureFeedback, or the processor never runs.
    expect(sdk.captureFeedback.mock.lastCall?.[2]).toBeDefined();
    expect(processors.length).toBe(1);
    const event: StampedEvent = {type: 'feedback', contexts: {feedback: {}}};
    processors[0](event);
    expect(event.contexts?.feedback?.['replay_id']).toBe('replay-7');
  });

  it('leaves the report unlinked when no recording travels with it', async () => {
    sdk.beginReplayCapture.mockResolvedValue(captured('replay-7'));
    await createComponent();
    setMessage('Something is broken');

    await component.submit();

    expect(processors.length).toBe(0);
  });

  it('cannot be dismissed with Escape while the report is going out', async () => {
    // Cancel is disabled while sending, Escape and the backdrop are not, and
    // the teardown they trigger drops the recording the report has already
    // announced it is bringing.
    let closableDuringSend: boolean | undefined;
    sdk.beginReplayCapture.mockResolvedValue(captured());
    await createComponent();
    setMessage('Something is broken');
    sdk.flush.mockImplementation(async () => {
      closableDuringSend = dialogRef.disableClose;
      return true;
    });

    await component.submit();

    expect(closableDuringSend).toBe(true);
    // And handed back afterwards, so a failed report can still be abandoned.
    expect(dialogRef.disableClose).toBe(false);
  });

  it('offers no checkbox when no recording could be held', async () => {
    sdk.beginReplayCapture.mockResolvedValue(nothingCaptured);
    await createComponent();

    expect(fixture.nativeElement.querySelector('mat-checkbox')).toBeNull();
  });

  it('settles the hold even when the dialog closes before the capture answered', async () => {
    // beginReplayCapture arms the hold before it resolves. Closing in that
    // window used to skip settling, and the transport then kept every later
    // recording instead of sending it.
    let answer: (capture: ReplayCapture) => void = () => undefined;
    sdk.beginReplayCapture.mockReturnValue(
      new Promise<ReplayCapture>((resolve) => {
        answer = resolve;
      }),
    );

    fixture = TestBed.createComponent(FeedbackDialogComponent);
    fixture.detectChanges();

    fixture.destroy();
    answer(captured());
    // The fixture is gone, so whenStable() no longer tracks this chain; let
    // the microtasks behind the settle drain on their own.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(sdk.endReplayCapture).toHaveBeenCalledWith(expect.anything(), false);
  });

  it('drops an unsent recording when the dialog is closed without submitting', async () => {
    const capture = captured();
    sdk.beginReplayCapture.mockResolvedValue(capture);
    await createComponent();

    fixture.destroy();
    // Settling waits for the capture call to have finished, so the drop lands
    // after the dialog is gone rather than during its teardown.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(sdk.endReplayCapture).toHaveBeenCalledWith(capture, false);
  });

  describe('screenshots', () => {
    it('offers no screenshot button when the browser cannot capture one', async () => {
      vi.spyOn(screenshotService, 'isSupported').mockReturnValue(false);
      await createComponent();

      expect(fixture.nativeElement.textContent).not.toContain('Add screenshot');
    });

    it('does not report an error when the screenshot picker is dismissed', async () => {
      vi.spyOn(screenshotService, 'isSupported').mockReturnValue(true);
      vi.spyOn(screenshotService, 'captureScreen').mockResolvedValue(null);
      await createComponent();

      await component.takeScreenshot();
      fixture.detectChanges();

      expect(component.screenshotError).toBe('');
      expect(component.capture).toBeNull();
    });

    it('attaches the composed screenshot when one was taken', async () => {
      vi.spyOn(screenshotService, 'isSupported').mockReturnValue(true);
      vi.spyOn(screenshotService, 'captureScreen').mockResolvedValue(makeCapture());
      await createComponent();
      setMessage('Something is broken');

      await component.takeScreenshot();
      fixture.detectChanges();

      const attachment = {data: new Uint8Array([1, 2, 3]), filename: 'screenshot.png', contentType: 'image/png'};
      vi.spyOn(screenshotService, 'toAttachment').mockResolvedValue(attachment);

      await component.submit();

      expect(sdk.captureFeedback).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({attachments: [attachment]}),
        expect.anything(),
      );
    });

    it('grows the dialog once a screenshot is taken, and hands it back once removed', async () => {
      vi.spyOn(screenshotService, 'isSupported').mockReturnValue(true);
      vi.spyOn(screenshotService, 'captureScreen').mockResolvedValue(makeCapture());
      await createComponent();

      expect(dialogRef.updateSize).not.toHaveBeenCalled();

      await component.takeScreenshot();
      fixture.detectChanges();

      expect(dialogRef.updateSize).toHaveBeenCalledTimes(1);
      const [width, height] = dialogRef.updateSize.mock.calls[0] as [string, string];
      // Not pinned to an exact figure - just that this is a viewport-relative
      // size dwarfing the ~560px form, which is the whole point of the change.
      expect(width).toMatch(/vw$/);
      expect(height).toMatch(/vh$/);

      component.removeScreenshot();
      fixture.detectChanges();

      // No arguments: that is what hands the panel back to its plain,
      // form-sized default - see updateSize() in the component.
      expect(dialogRef.updateSize).toHaveBeenCalledTimes(2);
      expect(dialogRef.updateSize.mock.calls[1]).toEqual([]);
    });
  });
});
