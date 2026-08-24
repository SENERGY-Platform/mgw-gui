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
import {TelemetryLevel, telemetryConsent} from './telemetry-consent';

type Transport = ReturnType<typeof makeFetchTransport>;
type TransportOptions = Parameters<typeof makeFetchTransport>[0];
type TransportFactory = (options: TransportOptions) => Transport;
type Envelope = Parameters<Transport['send']>[0];

/**
 * The recording taken when the feedback panel opened, waiting to be sent or
 * thrown away. Null whenever nothing is being held, which is nearly always.
 */
let heldEnvelopes: Envelope[] | null = null;

/** The real send, kept so releasing does not go back through the hold. */
let sendToSentry: Transport['send'] | null = null;

/**
 * Bumped by every begin, send and drop. A release in progress compares against
 * it, so abandoning the report mid-send stops the rest of the recording from
 * going out.
 */
let generation = 0;

/**
 * Wraps a transport so a replay envelope can be taken out of the flow and
 * decided on afterwards.
 *
 * This is what lets a recording end where the problem did. It is flushed the
 * moment the feedback panel opens - while the screen still shows what went
 * wrong - and the envelope that would have gone to Sentry is kept here until
 * the report is either sent or abandoned. Flushing at submit instead produces
 * recordings whose length is however long the form stayed open and whose
 * content is the few seconds before it: the buffer is frozen while the clock
 * keeps running, so a two-minute form gives a recording that is two minutes
 * long with a few seconds in it, which reads as an empty one.
 *
 * Holding also takes the SDK's timing rules out of play. Its flush declines
 * anything longer than `maxReplayDuration` and anything shorter than
 * `minReplayDuration`, both measured from the session start, and the SDK only
 * keeps that start fresh while recording is running - which the freeze stops.
 * A flush that happens immediately is inside every one of those windows by
 * construction.
 */
export function heldReplayTransport(createTransport: TransportFactory): TransportFactory {
  return (options) => {
    const transport = createTransport(options);
    sendToSentry = (envelope) => transport.send(envelope);

    return {
      ...transport,
      send(envelope) {
        if (heldEnvelopes === null || !isReplayEnvelope(envelope)) {
          return transport.send(envelope);
        }

        heldEnvelopes.push(envelope);
        // What the caller does with this answer: read `statusCode` for a
        // transport error, and the headers for a rate limit. An empty one is
        // neither, which is the truth about an envelope nobody has sent yet.
        return Promise.resolve({});
      },
    };
  };
}

/**
 * Identifies one hold. Handed out by holdReplayEnvelopes and handed back to
 * release it, so a release only ever touches the hold its caller armed.
 */
export type ReplayHoldToken = number;

/** Below this level a recording may not leave the browser. */
const REPLAY_LEVEL: TelemetryLevel = 2;

/**
 * From here on, replay envelopes are kept rather than sent. The token that
 * comes back is what releases this hold and nothing else.
 */
export function holdReplayEnvelopes(): ReplayHoldToken {
  generation++;
  heldEnvelopes = [];
  return generation;
}

/** How many replay envelopes are being held. Zero when nothing is. */
export function heldReplayCount(): number {
  return heldEnvelopes?.length ?? 0;
}

/** Whether `token` names the hold currently in place. */
export function ownsReplayHold(token: ReplayHoldToken): boolean {
  return generation === token;
}

/**
 * Sends what the caller's hold is keeping and holds nothing afterwards.
 * Rejects if a send does, so the caller can decide the report is worth more
 * than the recording; the segments after the failed one are then lost, which
 * is the same outcome as dropping them and is why nothing retries here.
 *
 * Does nothing at all for a token that no longer owns the hold. Two feedback
 * dialogs open at once each believe the recording is theirs, and the one that
 * did not take it must not be able to send or discard the other's.
 */
export async function sendHeldReplay(token: ReplayHoldToken): Promise<void> {
  if (!ownsReplayHold(token)) return;

  const envelopes = heldEnvelopes ?? [];
  heldEnvelopes = null;
  const mine = ++generation;

  // The level is read here rather than trusted from the caller because this is
  // the only path on which a recording reaches Sentry without passing a gate:
  // replay envelopes never go through beforeSend, and the hold releases them
  // straight into the raw transport. Consent withdrawn while the form was open
  // has to mean the recording stays behind, whatever box was ticked before.
  if (telemetryConsent.level() < REPLAY_LEVEL) return;

  const send = sendToSentry;
  if (!send) return;

  // One at a time, oldest first: the segments of a recording are numbered and
  // Sentry stitches them back together by that number.
  for (const envelope of envelopes) {
    if (generation !== mine) return;
    await send(envelope);
  }
}

/**
 * Throws away what is held. Safe to call when nothing is.
 *
 * With a token it only drops that caller's own hold, so a second dialog
 * closing cannot discard the recording a first one is still deciding about.
 * Without one it drops whatever is there, which is what a teardown wants.
 */
export function dropHeldReplay(token?: ReplayHoldToken): void {
  if (token !== undefined && !ownsReplayHold(token)) return;
  generation++;
  heldEnvelopes = null;
}

/**
 * A replay envelope carries a `replay_event` item and the recording itself, so
 * matching the event item recognises the pair. Everything else - errors,
 * feedback, attachments, transactions - goes straight out, hold or no hold.
 */
function isReplayEnvelope(envelope: Envelope): boolean {
  const [, items] = envelope;
  return items.some(([headers]) => headers.type === 'replay_event');
}
