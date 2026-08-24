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

import type {BrowserOptions, ErrorEvent, EventHint, Log, makeFetchTransport} from '@sentry/angular';
import {getDefaultIntegrations} from '@sentry/angular';

import {environment} from 'src/environments/environment';
import {dropHeldReplay, heldReplayTransport, ownsReplayHold} from './replay-hold';
import {TelemetryLevel, telemetryConsent} from './telemetry-consent';
import {
  ReplayRecorder,
  TelemetrySdk,
  beginReplayCapture,
  buildTelemetryOptions,
  endReplayCapture,
  initTelemetry,
  isReplayAvailable,
  stopTelemetry,
  useReplayRecorder,
} from './telemetry';

const A_DSN = 'https://0123456789abcdef0123456789abcdef@sentry.example.invalid/1';

type Transport = ReturnType<typeof makeFetchTransport>;
type TransportOptions = Parameters<typeof makeFetchTransport>[0];
type Envelope = Parameters<Transport['send']>[0];

function replayEnvelope(tag = 'flushed'): Envelope {
  return [{tag}, [[{type: 'replay_event'}, {}]]] as unknown as Envelope;
}

function recordingSdk(): TelemetrySdk & {captured: BrowserOptions[]} {
  const captured: BrowserOptions[] = [];
  return {captured, init: (options) => captured.push(options)};
}

/**
 * A replay integration that behaves the way the real one does in the two
 * places that matter here: a flush hands one envelope to the transport, and
 * the id is only readable while the recorder has not been stopped.
 */
class FakeRecorder implements ReplayRecorder {
  mode: string | undefined = 'buffer';
  flushes = 0;
  stops = 0;
  buffered = 0;
  /** Resolves the flush in flight, for a test that needs a slow one. */
  releaseFlush: (() => void) | null = null;

  constructor(
    private readonly transport: Transport,
    private readonly replayId = 'replay-1',
    /** How many of the first flushes wait to be released by hand. */
    private slowFlushes = 0,
  ) {}

  getRecordingMode(): string | undefined {
    return this.mode;
  }

  getReplayId(): string | undefined {
    // The real one answers nothing once the recorder is disabled, which is
    // what makes reading the id after the stop useless.
    return this.mode === undefined ? undefined : this.replayId;
  }

  /** Forgets what has been counted so far, keeping the buffer running. */
  reset(): void {
    this.mode = 'buffer';
    this.flushes = 0;
    this.stops = 0;
    this.buffered = 0;
  }

  startBuffering(): void {
    this.buffered++;
    this.mode = 'buffer';
  }

  async stop(): Promise<void> {
    this.stops++;
    this.mode = undefined;
  }

  async flush(): Promise<void> {
    this.flushes++;
    if (this.slowFlushes > 0) {
      this.slowFlushes--;
      await new Promise<void>((resolve) => {
        this.releaseFlush = resolve;
      });
    }
    await this.transport.send(replayEnvelope());
  }
}

describe('telemetry', () => {
  const configuredDsn = environment.sentryDsn;
  const configuredVersion = environment.uiVersion;

  afterEach(() => {
    environment.sentryDsn = configuredDsn;
    environment.uiVersion = configuredVersion;
    // Drops the consent listener initTelemetry registers. Without this it
    // outlives its spec and goes on reacting to levels a later one sets.
    stopTelemetry();
    // Put back to never-asked, not merely to level 0. Leaving the question
    // answered decides for whichever spec Jasmine happens to run next whether
    // the consent dialog is still due.
    telemetryConsent.reset();
  });

  describe('initTelemetry', () => {
    it('does not start the SDK without a DSN', () => {
      environment.sentryDsn = '';
      const sdk = recordingSdk();

      initTelemetry(sdk);

      expect(sdk.captured.length).toBe(0);
    });

    it('stops reacting to consent once it is shut down', () => {
      environment.sentryDsn = A_DSN;
      const recorder = new FakeRecorder(
        heldReplayTransport(() => ({send: () => Promise.resolve({}), flush: () => Promise.resolve(true)}))(
          {} as TransportOptions,
        ),
      );
      const restore = useReplayRecorder(() => recorder);

      try {
        initTelemetry(recordingSdk());
        stopTelemetry();
        recorder.reset();

        telemetryConsent.set(2);

        // The listener is the only thing that would start a buffer here.
        // Left registered it outlives whatever registered it: in a suite it
        // reacts to levels a later spec sets, and the counters that spec
        // reads then depend on the order Jasmine picked.
        expect(recorder.buffered).toBe(0);
      } finally {
        restore();
      }
    });

    it('starts the SDK once a DSN is configured', () => {
      environment.sentryDsn = A_DSN;
      const sdk = recordingSdk();

      initTelemetry(sdk);

      expect(sdk.captured.length).toBe(1);
      expect(sdk.captured[0].dsn).toBe(A_DSN);
    });
  });

  describe('options', () => {
    let options: BrowserOptions;

    beforeEach(() => {
      environment.sentryDsn = A_DSN;
      options = buildTelemetryOptions();
    });

    it('collects nothing about the person at the keyboard', () => {
      expect(options.sendDefaultPii).toBe(false);
      expect(options.sendClientReports).toBe(false);
    });

    it('never samples a replay by itself', () => {
      expect(options.replaysSessionSampleRate).toBe(0);
      expect(options.replaysOnErrorSampleRate).toBe(0);
    });

    it('sends no release while the version is the unreplaced placeholder', () => {
      // Every environment file ships the literal and the build does not
      // substitute it. Sent as a release it files every event of every build
      // under one made-up version.
      expect(environment.uiVersion).toBe('UI-VERSION');
      expect(options.release).toBeUndefined();
    });

    it('sends the version as the release once the build actually substitutes one', () => {
      environment.uiVersion = '1.4.2';

      expect(buildTelemetryOptions().release).toBe('1.4.2');
    });

    it('drops the session integration, whose envelopes no gate would catch', () => {
      // Against the SDK's real defaults, not a hand-written stand-in: the
      // filter has to hit something that is actually there.
      const build = options.integrations;
      if (typeof build !== 'function') throw new Error('integrations must be built from the defaults');
      const defaults = getDefaultIntegrations({});
      expect(defaults.map((integration) => integration.name)).toContain('BrowserSession');

      const names = build(defaults).map((integration) => integration.name);

      expect(names).not.toContain('BrowserSession');
      expect(names).toContain('Dedupe');
      expect(names).toContain('Replay');
    });

    it('pins the default integrations, so a new one has to be decided about', () => {
      // A default integration that produces an envelope of its own bypasses
      // beforeSend entirely - that is why BrowserSession is filtered out
      // above. There is no way to ask an integration whether it does that, so
      // the list is pinned instead and an SDK upgrade has to come past here.
      expect(
        getDefaultIntegrations({})
          .map((integration) => integration.name)
          .sort(),
      ).toEqual([
        'Breadcrumbs',
        'BrowserSession',
        'ConversationId',
        'CultureContext',
        'Dedupe',
        'FunctionToString',
        'GlobalHandlers',
        'HttpContext',
        'InboundFilters',
        'LinkedErrors',
      ]);
    });
  });

  describe('gating', () => {
    let options: BrowserOptions;

    function at(level: TelemetryLevel) {
      telemetryConsent.set(level);
    }

    function beforeSend(): unknown {
      const gate = options.beforeSend;
      if (!gate) throw new Error('beforeSend must be configured');
      return gate({type: undefined, message: 'boom'} as ErrorEvent, {} as EventHint);
    }

    function beforeSendTransaction(): unknown {
      const gate = options.beforeSendTransaction;
      if (!gate) throw new Error('beforeSendTransaction must be configured');
      const transaction = {type: 'transaction'} as unknown as Parameters<typeof gate>[0];
      return gate(transaction, {} as EventHint);
    }

    function beforeSendLog(): unknown {
      const gate = options.beforeSendLog;
      if (!gate) throw new Error('beforeSendLog must be configured');
      return gate({level: 'error', message: 'boom'} as Log);
    }

    beforeEach(() => {
      environment.sentryDsn = A_DSN;
      options = buildTelemetryOptions();
    });

    it('discards every kind of event at level 0', () => {
      at(0);

      expect(beforeSend()).toBeNull();
      expect(beforeSendTransaction()).toBeNull();
      expect(beforeSendLog()).toBeNull();
    });

    it('lets events through from level 1', () => {
      at(1);

      expect(beforeSend()).not.toBeNull();
      expect(beforeSendTransaction()).not.toBeNull();
      expect(beforeSendLog()).not.toBeNull();
    });

    it('lets events through at level 2', () => {
      at(2);

      expect(beforeSend()).not.toBeNull();
    });

    it('follows a change of level without being rebuilt', () => {
      // The level must be read per event. Freezing it at init would leave a
      // change taking effect only after a reload.
      at(0);
      expect(beforeSend()).toBeNull();

      at(1);
      expect(beforeSend()).not.toBeNull();

      at(0);
      expect(beforeSend()).toBeNull();
      expect(beforeSendLog()).toBeNull();
    });
  });

  describe('isReplayAvailable', () => {
    it('is false while no recording is running, whatever the level', () => {
      // No SDK is started here, so there is no replay integration to ask.
      telemetryConsent.set(2);

      expect(isReplayAvailable()).toBe(false);
    });

    it('is false at level 1', () => {
      telemetryConsent.set(1);

      expect(isReplayAvailable()).toBe(false);
    });
  });

  describe('capturing a recording for a report', () => {
    let sent: Envelope[];
    let transport: Transport;
    let recorder: FakeRecorder;
    let restoreRecorder: () => void;

    function useRecorder(fake: FakeRecorder): void {
      recorder = fake;
      restoreRecorder();
      restoreRecorder = useReplayRecorder(() => recorder);
    }

    beforeEach(() => {
      sent = [];
      const inner = (): Transport => ({
        send: (envelope) => {
          sent.push(envelope);
          return Promise.resolve({statusCode: 200});
        },
        flush: () => Promise.resolve(true),
      });
      transport = heldReplayTransport(inner)({} as TransportOptions);

      restoreRecorder = () => undefined;
      useRecorder(new FakeRecorder(transport));
      telemetryConsent.set(2);
      // Counted from here, not from construction: initTelemetry registers a
      // consent listener it never removes, so the level being set above
      // reaches this recorder as well - and whether it does depends on
      // whether that spec has already run, which Jasmine decides at random.
      recorder.reset();
    });

    afterEach(() => {
      // Unconditionally, whoever owns it: the hold is module state and would
      // otherwise follow the suite into whichever spec runs next.
      dropHeldReplay();
      restoreRecorder();
      telemetryConsent.reset();
    });

    it('takes the recording and keeps it back rather than sending it', async () => {
      const capture = await beginReplayCapture();

      expect(capture.offered).toBe(true);
      expect(sent).toEqual([]);
      expect(recorder.getRecordingMode()).toBeUndefined();
    });

    it('reads the recording id while the recorder still has one', async () => {
      // Both SDK paths that would stamp the id onto the report check that the
      // recorder is enabled first, and taking the recording is what disables
      // it. Read after the stop this is undefined and the recording reaches
      // Sentry belonging to no report at all.
      const capture = await beginReplayCapture();

      expect(capture.replayId).toBe('replay-1');
    });

    it('offers nothing when the id could not be read, rather than an orphan recording', async () => {
      const idless = new FakeRecorder(transport);
      idless.getReplayId = () => undefined;
      useRecorder(idless);

      const capture = await beginReplayCapture();

      expect(capture.offered).toBe(false);
      // Still released, though: the hold was armed and must not stay armed.
      expect(capture.hold).not.toBeNull();
    });

    it('arms no hold while another flush cycle still owns the buffer', async () => {
      // An error at level 2 flushes its own recording. On a slow upload that
      // cycle is still running when the person clicks feedback a second later
      // - the intended sequence. Arming the hold there and finding out
      // afterwards that nothing will flush into it leaves the transport
      // swallowing every recording for as long as the form stays open.
      const slow = new FakeRecorder(transport, 'replay-1', 1);
      useRecorder(slow);
      const options = buildTelemetryOptions();
      options.beforeSend?.({type: undefined, message: 'boom'} as ErrorEvent, {} as EventHint);
      await Promise.resolve();

      const capturing = beginReplayCapture();
      await Promise.resolve();
      await Promise.resolve();

      // Measured before the cycle is let go, because letting it go is what
      // unblocks the capture. Anything swallowed here would stay swallowed
      // for as long as the form was open and be thrown away with it.
      await transport.send(replayEnvelope('stray'));
      const swallowed = sent.length === 0;

      slow.releaseFlush?.();
      const capture = await capturing;

      expect(swallowed).toBe(false);
      // And once the cycle is out of the way the capture gets its own flush.
      expect(slow.flushes).toBe(2);
      expect(capture.offered).toBe(true);
    });

    it('lets a second capture neither settle nor disturb the first one', async () => {
      // Two feedback dialogs stacked by a double click. The second one holds
      // nothing; its close must not throw away the first one's recording, and
      // must not restart a buffer that would record the first one's form.
      const first = await beginReplayCapture();
      const second = await beginReplayCapture();
      expect(first.hold).not.toBeNull();
      expect(second.hold).toBeNull();

      await endReplayCapture(second, false);

      expect(ownsReplayHold(first.hold as number)).toBe(true);
      expect(recorder.buffered).toBe(0);
      expect(recorder.getRecordingMode()).toBeUndefined();
    });

    it('releases the recording and puts the recorder back when the report is sent', async () => {
      const capture = await beginReplayCapture();

      await endReplayCapture(capture, true);

      expect(sent.length).toBe(1);
      expect(recorder.buffered).toBe(1);
    });

    it('throws the recording away and still puts the recorder back', async () => {
      const capture = await beginReplayCapture();

      await endReplayCapture(capture, false);

      expect(sent).toEqual([]);
      expect(recorder.buffered).toBe(1);
    });

    it('captures nothing at all below level 2', async () => {
      telemetryConsent.set(1);

      const capture = await beginReplayCapture();

      expect(capture).toEqual({offered: false, hold: null});
      expect(recorder.flushes).toBe(0);
    });
  });
});
