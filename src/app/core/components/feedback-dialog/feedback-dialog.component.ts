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

import {Component, InjectionToken, OnDestroy, ViewChild, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatButton} from '@angular/material/button';
import {MatCheckbox} from '@angular/material/checkbox';
import {MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle} from '@angular/material/dialog';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {TranslocoPipe, TranslocoService, provideTranslocoScope} from '@jsverse/transloco';
import {captureFeedback, flush, withScope} from '@sentry/angular';
import {ScreenshotEditorComponent} from '../screenshot-editor/screenshot-editor.component';
import {
  Redaction,
  ScreenshotAttachment,
  ScreenshotCaptureError,
  ScreenshotService,
} from '../../services/screenshot/screenshot.service';
import {watchFeedbackDelivery} from '../../services/telemetry/feedback-delivery';
import {
  NOTHING_CAPTURED,
  ReplayCapture,
  beginReplayCapture,
  endReplayCapture,
} from '../../services/telemetry/telemetry';
import {NotificationService} from '../../services/util/notifications.service';

/** Long enough for a slow round trip, short enough not to hold the dialog open. */
const FLUSH_TIMEOUT_MS = 3_000;
/**
 * Panel size while a screenshot is open for editing. A 1920px capture shown
 * inside the default ~560px dialog renders at under a third of its size,
 * too small to tell what a redaction box is actually covering - so the
 * dialog grows to nearly the whole viewport for as long as there is a
 * picture to work on, and updateSize() below hands it back to its normal
 * form width once the screenshot is gone.
 */
const EXPANDED_DIALOG_WIDTH = '96vw';
const EXPANDED_DIALOG_HEIGHT = '94vh';
/**
 * What a report carrying a screenshot waits instead: captureFeedback appends
 * the attachment to the event's own envelope, so there is more to send than
 * for a report with no picture.
 */
const PICTURE_FLUSH_TIMEOUT_MS = 10_000;

/**
 * The calls this dialog makes into Sentry and the telemetry helpers, bundled
 * so a test can replace them. Spying on them directly is not an option -
 * they are plain exports of an ES module, and the bindings TypeScript
 * compiles those to are read-only. TelemetrySdk in telemetry.ts exists for
 * the identical reason.
 */
export interface FeedbackSdk {
  captureFeedback: typeof captureFeedback;
  flush: typeof flush;
  withScope: typeof withScope;
  watchFeedbackDelivery: typeof watchFeedbackDelivery;
  beginReplayCapture: typeof beginReplayCapture;
  endReplayCapture: typeof endReplayCapture;
}

const SENTRY_FEEDBACK_SDK: FeedbackSdk = {
  captureFeedback,
  flush,
  withScope,
  watchFeedbackDelivery,
  beginReplayCapture,
  endReplayCapture,
};

/**
 * DI token for FeedbackSdk, defaulting to the real calls. A test overrides it
 * with a provider so the fake is in place before the component - and its
 * constructor, which starts the replay hold immediately - is created.
 */
export const FEEDBACK_SDK = new InjectionToken<FeedbackSdk>('FEEDBACK_SDK', {
  factory: () => SENTRY_FEEDBACK_SDK,
});

/**
 * Asks for a message, an optional name and email, and optionally a
 * screenshot and a recording of what led up to it, then sends all of it as a
 * Sentry user report.
 *
 * The recording is taken the moment this dialog opens, not when it is sent -
 * see beginReplayCapture in telemetry.ts for why. Whatever became of it is
 * settled exactly once, on the first send attempt or on close, whichever
 * comes first; see settleReplay.
 */
@Component({
  selector: 'mgw-feedback-dialog',
  templateUrl: './feedback-dialog.component.html',
  styleUrls: ['./feedback-dialog.component.css'],
  imports: [
    FormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatFormField,
    MatLabel,
    MatInput,
    MatCheckbox,
    ScreenshotEditorComponent,
    TranslocoPipe,
  ],
  providers: [provideTranslocoScope('core')],
})
export class FeedbackDialogComponent implements OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<FeedbackDialogComponent>);
  private readonly screenshotService = inject(ScreenshotService);
  private readonly notifications = inject(NotificationService);
  private readonly sdk = inject(FEEDBACK_SDK);
  // Resolved directly rather than through the `transloco` pipe: `error` and
  // `screenshotError` below are plain string fields shown by ordinary
  // interpolation, and `showSuccess` takes a plain string too - none of the
  // three has a template binding a pipe could sit on.
  private readonly transloco = inject(TranslocoService);

  message = '';
  name = '';
  email = '';
  includeReplay = false;

  readonly screenshotSupported = this.screenshotService.isSupported();
  capture: HTMLCanvasElement | null = null;
  redactions: Redaction[] = [];
  screenshotError = '';

  /** Set once beginReplayCapture answers; only then may the checkbox show. */
  replayOffered = false;
  /** True once the held recording has been sent or dropped, so it happens only once. */
  private replaySettled = false;
  /**
   * Kept so settling can wait for it. The hold is armed inside this call,
   * before it resolves, so a dialog closed in that window still has to
   * release it - otherwise the transport keeps swallowing every later
   * recording for the rest of the session.
   */
  private readonly replayBegun: Promise<ReplayCapture>;

  sending = false;
  error = '';

  @ViewChild(ScreenshotEditorComponent) private editorRef?: ScreenshotEditorComponent;

  constructor() {
    // Stops the buffer and holds it back the moment the dialog is on screen,
    // so a report about what just went wrong is not diluted by a recording
    // of the empty form. Nothing is offered if there was nothing to hold.
    this.replayBegun = this.sdk.beginReplayCapture();
    void this.replayBegun.then((capture) => {
      this.replayOffered = capture.offered;
    });
  }

  ngOnDestroy(): void {
    // Covers every way the dialog can close without a successful send -
    // Cancel, Escape, the backdrop: whatever was held is dropped rather than
    // kept forever. A send that already settled it is left alone.
    void this.settleReplay(false);
  }

  async takeScreenshot(): Promise<void> {
    this.screenshotError = '';
    try {
      // Null means the picker was dismissed, which is an answer, not a
      // failure - see ScreenshotService.captureScreen.
      const canvas = await this.screenshotService.captureScreen();
      if (canvas) {
        this.capture = canvas;
        this.redactions = [];
        this.dialogRef.updateSize(EXPANDED_DIALOG_WIDTH, EXPANDED_DIALOG_HEIGHT);
      }
    } catch (error) {
      this.screenshotError =
        error instanceof ScreenshotCaptureError
          ? error.message
          : this.transloco.translate<string>('core.feedbackDialog.screenshotError');
    }
  }

  removeScreenshot(): void {
    this.capture = null;
    this.redactions = [];
    this.screenshotError = '';
    // No arguments: updateSize() itself treats that as clearing the explicit
    // size, handing the panel back to the width the CSS on this dialog's own
    // content sets for the plain form.
    this.dialogRef.updateSize();
  }

  cancel(): void {
    this.dialogRef.close();
  }

  async submit(): Promise<void> {
    const message = this.message.trim();
    if (!message) return;

    this.sending = true;
    // Cancel is disabled while this runs, but Escape and the backdrop are not,
    // and either one tears the dialog down mid-send: the report goes out
    // announcing a recording and ngOnDestroy throws that recording away behind
    // it. The finally below hands the dialog back.
    this.dialogRef.disableClose = true;
    this.error = '';

    // Awaited here rather than read off replayOffered, because the id the
    // report has to carry lives on the same answer.
    const capture = await this.replayBegun.catch(() => NOTHING_CAPTURED);
    const includeReplay = capture.offered && this.includeReplay;
    // What actually becomes of the recording. Decided again once the report's
    // own fate is known: a recording is worth uploading only beside the report
    // it belongs to.
    let sendReplay = includeReplay;

    try {
      const attachment = this.capture ? await this.getScreenshotAttachment() : undefined;

      const delivered = await this.sdk.watchFeedbackDelivery(async () => {
        this.sdk.withScope((scope) => {
          if (includeReplay && capture.replayId) {
            // Stamped by hand because the SDK will not do it here. Both paths
            // that would - the replay integration's own event processor and
            // its beforeSendFeedback handler - start with a check that the
            // recorder is still enabled, and taking the recording is what
            // disabled it. Without this the recording arrives in Sentry as an
            // envelope belonging to no report, and the report shows no
            // recording: the one thing the checkbox promised.
            scope.addEventProcessor((event) => {
              // Bracketed because both keys come from an index signature;
              // Sentry types a context as a bag of unknowns.
              const feedback = event.contexts?.['feedback'];
              if (event.type === 'feedback' && feedback) {
                feedback['replay_id'] = capture.replayId;
              }
              return event;
            });
          }

          this.sdk.captureFeedback(
            {
              message,
              name: this.name.trim() || undefined,
              email: this.email.trim() || undefined,
              url: window.location.href,
              source: 'feedback-dialog',
            },
            {includeReplay, attachments: attachment ? [attachment] : undefined},
            scope,
          );
        });

        await this.sdk.flush(attachment ? PICTURE_FLUSH_TIMEOUT_MS : FLUSH_TIMEOUT_MS);
      });

      if (delivered === false) {
        // Known not to have arrived - said plainly, and the form keeps what
        // was typed so trying again costs nothing. The recording stays behind
        // with it: sent on its own it is a recording of a session nobody in
        // Sentry has a report for, and the retry would upload a second copy.
        sendReplay = false;
        this.error = this.transloco.translate<string>('core.feedbackDialog.sendFailed');
        return;
      }

      // true means Sentry took it; undefined means this build could not tell
      // either way, which is not the same as a failure - see
      // watchFeedbackDelivery. Both are reported as sent, and both keep the
      // recording, since neither is known to have failed.
      this.notifications.showSuccess(this.transloco.translate<string>('core.feedbackDialog.sentSuccess'));
      this.dialogRef.close();
    } catch {
      this.error = this.transloco.translate<string>('core.feedbackDialog.sendFailed');
    } finally {
      this.sending = false;
      this.dialogRef.disableClose = false;
      // Always, whether the send above succeeded, failed, or threw: a
      // recording held back and never settled would sit in memory for the
      // rest of the session.
      await this.settleReplay(sendReplay);
    }
  }

  private getScreenshotAttachment(): Promise<ScreenshotAttachment> {
    if (!this.editorRef) return Promise.reject(new Error('no screenshot editor to encode from'));
    return this.editorRef.getAttachment();
  }

  private async settleReplay(send: boolean): Promise<void> {
    if (this.replaySettled) return;
    this.replaySettled = true;
    // Not conditional on replayOffered: that only turns true once the call
    // below has resolved, while the hold it arms is in place from the moment
    // it starts. Closing the dialog in between would otherwise leave the
    // hold armed forever. Settling a capture that holds nothing is harmless -
    // endReplayCapture says so itself.
    const capture = await this.replayBegun.catch(() => NOTHING_CAPTURED);
    await this.sdk.endReplayCapture(capture, send);
  }
}
