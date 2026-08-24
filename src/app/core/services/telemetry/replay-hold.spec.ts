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

import type {makeFetchTransport} from '@sentry/angular';
import {
  ReplayHoldToken,
  dropHeldReplay,
  heldReplayCount,
  heldReplayTransport,
  holdReplayEnvelopes,
  ownsReplayHold,
  sendHeldReplay,
} from './replay-hold';
import {telemetryConsent} from './telemetry-consent';

type Transport = ReturnType<typeof makeFetchTransport>;
type TransportOptions = Parameters<typeof makeFetchTransport>[0];
type Envelope = Parameters<Transport['send']>[0];

function envelopeOf(...itemTypes: string[]): Envelope {
  return [{}, itemTypes.map((type) => [{type}, {}])] as unknown as Envelope;
}

describe('heldReplayTransport', () => {
  let sent: Envelope[];
  let sendResult: () => PromiseLike<{statusCode?: number}>;
  let transport: Transport;

  beforeEach(() => {
    sent = [];
    sendResult = () => Promise.resolve({statusCode: 200});
    const inner = (): Transport => ({
      send: (envelope) => {
        sent.push(envelope);
        return sendResult();
      },
      flush: () => Promise.resolve(true),
    });
    transport = heldReplayTransport(inner)({} as TransportOptions);
    // Releasing a recording is gated on the level, and level 2 is the only one
    // under which a recording exists at all.
    telemetryConsent.set(2);
  });

  afterEach(() => {
    dropHeldReplay();
    telemetryConsent.reset();
  });

  it('sends replay envelopes straight out when nothing is being held', async () => {
    const replay = envelopeOf('replay_event', 'replay_recording');

    expect(await transport.send(replay)).toEqual({statusCode: 200});
    expect(sent).toEqual([replay]);
    expect(heldReplayCount()).toBe(0);
  });

  it('keeps a replay envelope back while holding', async () => {
    holdReplayEnvelopes();
    const replay = envelopeOf('replay_event', 'replay_recording');

    // An empty result: neither a transport error nor a rate limit, which is
    // the truth about an envelope nobody has sent yet.
    expect(await transport.send(replay)).toEqual({});
    expect(sent).toEqual([]);
    expect(heldReplayCount()).toBe(1);
  });

  it('lets everything that is not a replay through while holding', async () => {
    holdReplayEnvelopes();
    const error = envelopeOf('event');
    const feedback = envelopeOf('feedback', 'attachment');

    await transport.send(error);
    await transport.send(feedback);

    expect(sent).toEqual([error, feedback]);
    expect(heldReplayCount()).toBe(0);
  });

  it('releases held envelopes oldest first', async () => {
    const hold = holdReplayEnvelopes();
    const first = envelopeOf('replay_event');
    const second = envelopeOf('replay_event');
    await transport.send(first);
    await transport.send(second);

    await sendHeldReplay(hold);

    expect(sent).toEqual([first, second]);
    expect(heldReplayCount()).toBe(0);
  });

  it('holds nothing after a release, so the next replay goes straight out', async () => {
    const hold = holdReplayEnvelopes();
    await transport.send(envelopeOf('replay_event'));
    await sendHeldReplay(hold);
    sent.length = 0;

    const later = envelopeOf('replay_event');
    await transport.send(later);

    expect(sent).toEqual([later]);
  });

  it('discards held envelopes on drop', async () => {
    const hold = holdReplayEnvelopes();
    await transport.send(envelopeOf('replay_event'));

    dropHeldReplay(hold);
    await sendHeldReplay(hold);

    expect(sent).toEqual([]);
    expect(heldReplayCount()).toBe(0);
  });

  it('sends nothing further once the report is abandoned mid-release', async () => {
    const hold = holdReplayEnvelopes();
    await transport.send(envelopeOf('replay_event'));
    await transport.send(envelopeOf('replay_event'));
    await transport.send(envelopeOf('replay_event'));

    // Abandoning while the first segment is still in flight must stop the rest.
    sendResult = () => {
      dropHeldReplay();
      return Promise.resolve({statusCode: 200});
    };
    await sendHeldReplay(hold);

    expect(sent.length).toBe(1);
  });

  it('passes a failing release on to the caller', async () => {
    const hold = holdReplayEnvelopes();
    await transport.send(envelopeOf('replay_event'));
    const failure = new Error('network down');
    sendResult = () => Promise.reject(failure);

    await expectAsync(sendHeldReplay(hold)).toBeRejectedWith(failure);
  });

  it('refuses to release a recording once consent has dropped below level 2', async () => {
    // A replay envelope never passes beforeSend, and the release goes straight
    // into the raw transport, so this is the only gate it meets. Withdrawing
    // consent while a form is open has to mean the recording stays behind.
    const hold = holdReplayEnvelopes();
    await transport.send(envelopeOf('replay_event', 'replay_recording'));
    telemetryConsent.set(1);

    await sendHeldReplay(hold);

    expect(sent).toEqual([]);
    expect(heldReplayCount()).toBe(0);
  });

  it('sends nothing on behalf of a caller that no longer owns the hold', async () => {
    // Two feedback dialogs stacked on each other: the second one holds
    // nothing, and neither its send nor its drop may reach the first one's
    // recording.
    const first = holdReplayEnvelopes();
    await transport.send(envelopeOf('replay_event'));
    const second = holdReplayEnvelopes();
    await transport.send(envelopeOf('replay_event'));

    await sendHeldReplay(first);
    dropHeldReplay(first);

    expect(sent).toEqual([]);
    expect(ownsReplayHold(second)).toBeTrue();
    expect(heldReplayCount()).toBe(1);
  });

  it('lets the owner release what a stale token could not', async () => {
    const stale: ReplayHoldToken = holdReplayEnvelopes();
    const hold = holdReplayEnvelopes();
    const replay = envelopeOf('replay_event');
    await transport.send(replay);

    dropHeldReplay(stale);
    await sendHeldReplay(hold);

    expect(sent).toEqual([replay]);
  });

  it('starts a fresh hold rather than adding to the previous one', async () => {
    holdReplayEnvelopes();
    await transport.send(envelopeOf('replay_event'));

    holdReplayEnvelopes();

    expect(heldReplayCount()).toBe(0);
  });

  it('is safe to drop when nothing is held', () => {
    expect(() => dropHeldReplay()).not.toThrow();
    expect(heldReplayCount()).toBe(0);
  });
});
