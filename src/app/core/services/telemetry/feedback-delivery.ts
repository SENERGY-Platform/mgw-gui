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

type Transport = ReturnType<typeof makeFetchTransport>;
type TransportOptions = Parameters<typeof makeFetchTransport>[0];
type TransportFactory = (options: TransportOptions) => Transport;
type Envelope = Parameters<Transport['send']>[0];
type SendResult = Awaited<ReturnType<Transport['send']>>;

type Answer = (delivered: boolean) => void;

/**
 * Where the answer for the report being sent goes, for as long as one is being
 * sent. Null the rest of the time, which is nearly always.
 */
let answer: Answer | null = null;

/**
 * Wraps a transport so what became of a feedback envelope can be found out.
 *
 * Nothing else in the SDK will say. `captureFeedback` hands back an event id
 * the moment it is called, and `flush` answers whether the send queue drained
 * within its timeout - not whether Sentry took what was in it. Between those
 * two sits every way a report is lost without a word: the envelope filtered
 * down to nothing by a rate limit, the send buffer already full, a 413 for a
 * report whose screenshot was too big, any 5xx. The transport is the one place
 * the answer arrives.
 *
 * Wraps rather than replaces: `send` is delegated in every case and only the
 * feedback envelope's result is read on the way past. A report is never held
 * back, delayed or retried here.
 */
export function watchedFeedbackTransport(createTransport: TransportFactory): TransportFactory {
  return (options) => {
    const transport = createTransport(options);

    return {
      ...transport,
      send(envelope) {
        const sending = transport.send(envelope);
        if (answer === null || !isFeedbackEnvelope(envelope)) return sending;

        // Read now, not in the callbacks: by the time they run the report has
        // been answered for and `answer` is back to null.
        const tell = answer;

        return sending.then(
          (result) => {
            report(tell, wasAccepted(result));
            return result;
          },
          (error: unknown) => {
            // The transport rejects for a request that never completed - the
            // connection dropped, or there was none. Rethrown unchanged: the
            // client above has its own handling for it, and this is only
            // listening in.
            report(tell, false);
            throw error;
          },
        );
      },
    };
  };
}

/**
 * Runs `send` and answers what became of the feedback report it produced. True
 * where Sentry took it, false where it is known not to have arrived.
 *
 * Undefined is the third answer and means no feedback envelope went past the
 * transport at all, which is not the same as a report that failed - it is this
 * file failing to recognise one. The caller decides what to make of that, and
 * the point of keeping it separate is that a future SDK numbering its envelope
 * items differently degrades to whatever answer was given before rather than
 * turning every report into a failure.
 *
 * Brackets the send rather than being switched on and off around it, so there
 * is no way to arm this and leave it armed: `send` throwing still puts it back.
 */
export async function watchFeedbackDelivery(
  // PromiseLike, because that is what a transport's own send answers with and
  // handing one straight back is the shortest thing a caller can pass.
  send: () => PromiseLike<unknown>,
): Promise<boolean | undefined> {
  let delivered: boolean | undefined;
  // The first envelope is the report. A flush drains everything queued behind
  // it too, and an error event that failed alongside is not this report's
  // answer.
  const watcher: Answer = (result) => {
    delivered ??= result;
  };
  answer = watcher;

  try {
    await send();
  } finally {
    // Only ours: two overlapping reports would otherwise leave the second one
    // unwatched from the moment the first finishes.
    if (answer === watcher) answer = null;
  }

  return delivered;
}

/** True while a report is being watched for. */
export function isWatchingFeedbackDelivery(): boolean {
  return answer !== null;
}

/**
 * A listener that throws must not turn a delivered report into a failed send,
 * so its exception stops here.
 */
function report(tell: Answer, delivered: boolean): void {
  try {
    tell(delivered);
  } catch {
    // nothing sensible to do with it, and the send itself is unaffected
  }
}

/**
 * Sentry answers an envelope it has taken with 200 and the id it filed it
 * under.
 *
 * A result with no status at all is the other half of this, and it is a
 * failure rather than an unknown: the transport answers `{}` exactly when it
 * did not make the request - every item filtered out by a rate limit, or a
 * send buffer that was already full. Nothing left the browser in either case.
 */
function wasAccepted({statusCode}: SendResult): boolean {
  return statusCode !== undefined && statusCode >= 200 && statusCode < 300;
}

/**
 * The report itself, which travels as an envelope carrying a `feedback` item -
 * and carrying the screenshot beside it, where one was taken, since
 * `captureFeedback` appends its attachments to the event's own envelope rather
 * than sending them separately. So this one answer covers the picture too.
 */
function isFeedbackEnvelope(envelope: Envelope): boolean {
  const [, items] = envelope;
  return items.some(([headers]) => headers.type === 'feedback');
}
