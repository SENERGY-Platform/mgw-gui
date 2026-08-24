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

import type {BrowserOptions} from '@sentry/angular';
import {getReplay, init, makeFetchTransport, replayIntegration} from '@sentry/angular';
import {environment} from 'src/environments/environment';
import {watchedFeedbackTransport} from './feedback-delivery';
import {
  ReplayHoldToken,
  dropHeldReplay,
  heldReplayCount,
  heldReplayTransport,
  holdReplayEnvelopes,
  ownsReplayHold,
  sendHeldReplay,
} from './replay-hold';
import {TelemetryLevel, telemetryConsent} from './telemetry-consent';

/**
 * The one call into the SDK that has to be replaceable, so a test can assert
 * that an empty DSN keeps it unmade. Sentry's own exports are read-only module
 * bindings and cannot be spied on.
 */
export interface TelemetrySdk {
  init: (options: BrowserOptions) => unknown;
}

const SENTRY_SDK: TelemetrySdk = {init};

/**
 * Sends session envelopes on page load. Those do not pass beforeSend, so
 * nothing below can drop them: at level 0 the mere fact that this browser
 * opened the page would reach Sentry before anyone was asked.
 */
const BROWSER_SESSION_INTEGRATION = 'BrowserSession';

/**
 * What every environment file carries in `uiVersion`. The build is meant to
 * replace it and does not, so the value has to be recognised rather than sent.
 */
const UNREPLACED_VERSION = 'UI-VERSION';

/**
 * Brings up error reporting, or deliberately does not.
 *
 * Called from main.ts before bootstrapApplication so errors thrown while the
 * application starts are still seen. Nothing is sent until the consent level
 * allows it, and the level is read again for every event rather than captured
 * here, so a change takes effect without a reload.
 */
export function initTelemetry(sdk: TelemetrySdk = SENTRY_SDK): void {
  // An empty DSN is the normal case in mock and local development. Handing it
  // to the SDK anyway would install every integration for nothing.
  if (!environment.sentryDsn) return;

  sdk.init(buildTelemetryOptions());

  telemetryConsent.onChange(applyReplayMode);
  applyReplayMode(telemetryConsent.level());
}

export function buildTelemetryOptions(): BrowserOptions {
  return {
    dsn: environment.sentryDsn,
    environment: environment.sentryEnvironment || undefined,
    // Only where it says something. Every environment ships the literal
    // placeholder, which the build does not substitute; sent as a release it
    // files every event of every build under one made-up version, which is
    // worse than Sentry having none.
    release: environment.uiVersion === UNREPLACED_VERSION ? undefined : environment.uiVersion,

    // Two wrappers around the one transport the SDK lets us pass, each for a
    // question the SDK answers nowhere else. Nothing is intercepted until the
    // feedback panel asks for it; see replay-hold.ts for why the recording is
    // taken there and held rather than flushed when the report is submitted,
    // and feedback-delivery.ts for why a report's own fate has to be read off
    // the wire. Watching is outermost so it sees what the hold let past.
    transport: watchedFeedbackTransport(heldReplayTransport(makeFetchTransport)),

    integrations: (defaults) => [
      ...defaults.filter((integration) => integration.name !== BROWSER_SESSION_INTEGRATION),
      replayIntegration({
        // An admin sees other people's device names, host names and secrets on
        // these screens. A recording must not carry them verbatim.
        maskAllText: true,
        blockAllMedia: true,
        // No floor on how short a recording may be. The default of ~5s is
        // measured from the start of the replay session and the SDK drops
        // anything younger without saying so. Nothing here records
        // speculatively - a recording is only ever sent because an error fired
        // at level 2 or because a report asked for it - so a short one is
        // still the one that was asked for.
        minReplayDuration: 0,
      }),
    ],

    // Both zero on purpose: sampling would start a recording behind the user's
    // back. The buffer is started and stopped by hand in applyReplayMode.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,

    enableLogs: true,
    // An admin operating someone else's gateway has no profile here and there
    // is nothing about them worth attaching to a report.
    sendDefaultPii: false,
    // Client reports are the SDK telling Sentry what it discarded. At level 0
    // that is a request for every dropped event, which is the opposite of what
    // level 0 means.
    sendClientReports: false,

    beforeSend(event) {
      if (telemetryConsent.level() < 1) return null;
      if (telemetryConsent.level() >= REPLAY_LEVEL) flushOnError();
      return event;
    },

    beforeSendTransaction(event) {
      return telemetryConsent.level() >= 1 ? event : null;
    },

    beforeSendLog(log) {
      return telemetryConsent.level() >= 1 ? log : null;
    },
  };
}

// --- replay ----------------------------------------------------------------

/** The recording mode in which the last seconds are kept locally, not streamed. */
const BUFFER_MODE = 'buffer';

/** The consent level from which a recording may exist at all. */
const REPLAY_LEVEL: TelemetryLevel = 2;

/**
 * The parts of the replay integration used here.
 *
 * Narrow on purpose: this is what a test has to stand in for, and `getReplay`
 * is a read-only module binding that cannot be spied on - the same reason
 * TelemetrySdk exists above.
 */
export interface ReplayRecorder {
  getRecordingMode(): string | undefined;
  getReplayId(onlyIfSampled?: boolean): string | undefined;
  startBuffering(): void;
  stop(options?: {flush?: boolean}): Promise<void>;
  flush(options?: {continueRecording?: boolean}): Promise<void>;
}

/** How the replay integration is reached, as one call a test can replace. */
let reachReplay: () => ReplayRecorder | undefined = () => getReplay();

/**
 * Points the replay handling at a different recorder and answers with the call
 * that puts the real one back. For tests, which have no started SDK to ask.
 */
export function useReplayRecorder(reach: () => ReplayRecorder | undefined): () => void {
  const previous = reachReplay;
  reachReplay = reach;
  return () => {
    reachReplay = previous;
  };
}

/**
 * The flush-and-restart cycle in flight, or null while none is.
 *
 * Kept as the promise rather than as a flag, so a caller that must not run
 * beside one can wait it out instead of merely declining. Two errors in the
 * same tick would otherwise interleave a stop with a startBuffering and leave
 * no buffer at all.
 */
let replayCycle: Promise<unknown> | null = null;

/**
 * How many cycles a capture waits out before giving up on getting the buffer
 * to itself. Bounded because errors can keep arriving and somebody is waiting
 * for a form; the report then goes without a recording.
 */
const MAX_CYCLE_WAITS = 3;

/**
 * Starts or discards the local ring buffer to match the level.
 *
 * Both sample rates are zero, so the integration never starts itself and this
 * is the only thing that does. Dropping below level 2 stops it with
 * `flush: false`: withdrawing consent has to throw the recording away, not
 * send one last segment of it.
 *
 * Never throws. It runs in the teardown of a cycle and out of a consent
 * listener, and a recorder that will not start is not something either of
 * those can act on.
 */
function applyReplayMode(level: TelemetryLevel): void {
  const replay = reachReplay();
  if (!replay) return;

  try {
    if (level >= REPLAY_LEVEL) {
      // A no-op while a buffer is already running.
      replay.startBuffering();
    } else {
      void replay.stop({flush: false}).catch(() => {
        // nothing left to do about it, and no recording may be sent either way
      });
    }
  } catch {
    // as above, and a throwing recorder must not take the caller down with it
  }
}

interface CycleOptions {
  /** Start a new buffer afterwards, rather than leaving the recorder stopped. */
  readonly resume: boolean;
  /** Keep the flushed envelopes back instead of letting them go to Sentry. */
  readonly hold: boolean;
}

/** What a cycle leaves behind for whoever started it. */
interface CycleResult {
  /** The hold this cycle armed, or null when it armed none. */
  readonly hold: ReplayHoldToken | null;
  /** The id Sentry files the recording under, read before the recorder lost it. */
  readonly replayId?: string;
}

const NOTHING_FLUSHED: CycleResult = {hold: null};

/**
 * Sends the buffered recording, and only ever the buffered one.
 *
 * `flush()` on its own would not do: its default `continueRecording: true`
 * converts the ring buffer into a session recording that keeps running and
 * keeps sending from then on. That is continuous recording, which is more than
 * level 2 was asked for - the consent covers a recording of the session *when
 * an error occurs*. Worse, the SDK's flush starts a full session recording
 * outright when the buffer is not running, so this only ever runs while the
 * recording mode really is `buffer`.
 *
 * The buffer is torn down and started again rather than left alone, because
 * the flush stops the underlying recorder without clearing the flag that says
 * one is active - startBuffering() would decline to do anything.
 */
async function runReplayCycle(options: CycleOptions): Promise<CycleResult> {
  const replay = reachReplay();
  if (!replay || replay.getRecordingMode() !== BUFFER_MODE) return NOTHING_FLUSHED;

  // Armed here rather than by the caller, and below the guards rather than
  // above them. Between this line and the flush there is no await, so a hold
  // can never be armed unless this same turn goes on to flush into it. Arming
  // first and finding out afterwards left the transport swallowing every
  // recording the SDK produced for as long as the form stayed open.
  const hold = options.hold ? holdReplayEnvelopes() : null;
  let replayId: string | undefined;

  try {
    await replay.flush({continueRecording: false});
    // Read here because this is the only moment it exists: the flush leaves
    // the recorder enabled but the stop below does not, and getReplayId
    // answers nothing once it is disabled. Without the id the recording
    // reaches Sentry as an envelope belonging to no report at all - both SDK
    // paths that would stamp `contexts.feedback.replay_id` onto the report
    // check isEnabled() first and bail out here.
    replayId = replay.getReplayId();
  } catch {
    // the report matters more than its recording
  } finally {
    try {
      await replay.stop({flush: false});
    } catch {
      // already stopped, or never started
    }
    // The level is read again rather than remembered: consent may have been
    // withdrawn while the flush was in flight, and then no new buffer starts.
    if (options.resume) applyReplayMode(telemetryConsent.level());
  }

  return {hold, replayId};
}

/** Runs a cycle and publishes it as the one in flight for the duration. */
function startReplayCycle(options: CycleOptions): Promise<CycleResult> {
  const running = runReplayCycle(options);
  // Settlement only: the result belongs to the caller that started it, and a
  // waiter must not be able to reject on somebody else's cycle.
  const cycle = running.then(
    () => undefined,
    () => undefined,
  );
  replayCycle = cycle;
  void cycle.then(() => {
    if (replayCycle === cycle) replayCycle = null;
  });
  return running;
}

/** What beforeSend asks for: flush the recording that led to this error. */
function flushOnError(): void {
  // Declines rather than waits. An error arriving during a cycle has its own
  // recording in the segment already going out, and queueing cycles behind
  // each other would turn a burst of errors into a chain of uploads.
  if (replayCycle) return;
  void startReplayCycle({resume: true, hold: false});
}

// --- what the feedback panel needs -----------------------------------------

/**
 * A recording taken for a report: whether there is one, what to link it to,
 * and which hold has to be released when the report is settled.
 */
export interface ReplayCapture {
  /** Whether there is a recording to offer. Only then may the panel ask. */
  readonly offered: boolean;
  /**
   * The id to stamp onto the report so Sentry shows the two together. Set
   * exactly when `offered` is, since a recording nothing links to is one
   * nobody can find.
   */
  readonly replayId?: string;
  /**
   * The hold to release when the report is settled, or null when none was
   * armed. Travels even when nothing was caught: an armed hold that is never
   * released keeps every later recording out of Sentry.
   */
  readonly hold: ReplayHoldToken | null;
}

/** The answer when there was nothing to take and nothing was armed. */
export const NOTHING_CAPTURED: ReplayCapture = {offered: false, hold: null};

/**
 * Whether there is a recording to offer with a report: level 2, the SDK up,
 * and a buffer actually running.
 */
export function isReplayAvailable(): boolean {
  return telemetryConsent.level() >= REPLAY_LEVEL && reachReplay()?.getRecordingMode() === BUFFER_MODE;
}

/**
 * Ends the recording now and keeps it back, answering what was caught and how
 * to give it back.
 *
 * No new buffer is started until the report is settled, so nothing records the
 * user typing into the form.
 */
export async function beginReplayCapture(): Promise<ReplayCapture> {
  if (!isReplayAvailable()) return NOTHING_CAPTURED;

  // Waited out before anything is armed. A cycle already in flight - an error
  // flushing its own recording over a slow connection - owns the buffer, and
  // the cycle below would decline to run beside it.
  for (let waited = 0; waited < MAX_CYCLE_WAITS && replayCycle; waited++) {
    await replayCycle;
  }
  // Still busy after all that: nothing armed, nothing to release, no recording.
  if (replayCycle) return NOTHING_CAPTURED;

  const {hold, replayId} = await startReplayCycle({resume: false, hold: true});
  // Offered only where both halves are there. An envelope with no id would go
  // out as a recording attached to nothing, and an id with no envelope would
  // point the report at a recording that never left the browser.
  const offered = hold !== null && heldReplayCount() > 0 && !!replayId;
  return {offered, replayId: offered ? replayId : undefined, hold};
}

/**
 * Releases the recording this capture is holding and puts the recorder back.
 *
 * Both steps are skipped for a capture that holds nothing, and that is not
 * merely an optimisation: a second feedback dialog captures nothing while the
 * first one has the recorder deliberately stopped, and restarting it here
 * would have that second dialog record the first one's form being filled in.
 */
export async function endReplayCapture(capture: ReplayCapture, send: boolean): Promise<void> {
  if (capture.hold === null || !ownsReplayHold(capture.hold)) return;

  try {
    if (send) {
      await sendHeldReplay(capture.hold);
    } else {
      dropHeldReplay(capture.hold);
    }
  } finally {
    applyReplayMode(telemetryConsent.level());
  }
}
