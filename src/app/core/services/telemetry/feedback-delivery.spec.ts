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
import {isWatchingFeedbackDelivery, watchFeedbackDelivery, watchedFeedbackTransport} from './feedback-delivery';

type Transport = ReturnType<typeof makeFetchTransport>;
type TransportOptions = Parameters<typeof makeFetchTransport>[0];
type Envelope = Parameters<Transport['send']>[0];
type SendResult = Awaited<ReturnType<Transport['send']>>;

/** An envelope carrying one item per given type, which is all the wrappers read. */
function envelopeOf(...itemTypes: string[]): Envelope {
  return [{}, itemTypes.map((type) => [{type}, {}])] as unknown as Envelope;
}

describe('watchedFeedbackTransport', () => {
  let sent: Envelope[];
  let respond: (envelope: Envelope) => PromiseLike<SendResult>;

  function transport(): Transport {
    const inner = (): Transport => ({
      send: (envelope) => {
        sent.push(envelope);
        return respond(envelope);
      },
      flush: () => Promise.resolve(true),
    });
    return watchedFeedbackTransport(inner)({} as TransportOptions);
  }

  beforeEach(() => {
    sent = [];
    respond = () => Promise.resolve({statusCode: 200});
  });

  afterEach(() => {
    expect(isWatchingFeedbackDelivery()).withContext('the watch must never be left armed').toBeFalse();
  });

  it('reports a 2xx as delivered', async () => {
    const feedback = envelopeOf('feedback');

    const delivered = await watchFeedbackDelivery(() => transport().send(feedback));

    expect(delivered).toBeTrue();
    expect(sent).toEqual([feedback]);
  });

  it('accepts the whole 2xx range and nothing outside it', async () => {
    for (const [statusCode, expected] of [
      [199, false],
      [200, true],
      [204, true],
      [299, true],
      [300, false],
      [400, false],
      [413, false],
      [429, false],
      [500, false],
    ] as const) {
      respond = () => Promise.resolve({statusCode});

      const delivered = await watchFeedbackDelivery(() => transport().send(envelopeOf('feedback')));

      expect(delivered).withContext(`HTTP ${statusCode}`).toBe(expected);
    }
  });

  it('reports a result without a status as not delivered', async () => {
    // The transport answers {} exactly when it made no request at all: every
    // item dropped by a rate limit, or a full send buffer.
    respond = () => Promise.resolve({});

    const delivered = await watchFeedbackDelivery(() => transport().send(envelopeOf('feedback')));

    expect(delivered).toBeFalse();
  });

  it('reports a rejected send as not delivered and lets the rejection through', async () => {
    const failure = new Error('network down');
    respond = () => Promise.reject(failure);

    const delivered = await watchFeedbackDelivery(async () => {
      await expectAsync(transport().send(envelopeOf('feedback'))).toBeRejectedWith(failure);
    });

    expect(delivered).toBeFalse();
  });

  it('puts the watch back even when the send throws out of the watched block', async () => {
    const failure = new Error('network down');
    respond = () => Promise.reject(failure);

    await expectAsync(watchFeedbackDelivery(() => transport().send(envelopeOf('feedback')))).toBeRejectedWith(failure);
  });

  it('answers undefined when no feedback envelope went past', async () => {
    const delivered = await watchFeedbackDelivery(() => transport().send(envelopeOf('event')));

    expect(delivered).toBeUndefined();
  });

  it('passes a non-feedback envelope through unchanged', async () => {
    const error = envelopeOf('event');
    respond = () => Promise.resolve({statusCode: 429});

    const result = await watchFeedbackDelivery(async () => {
      expect(await transport().send(error)).toEqual({statusCode: 429});
    });

    expect(sent).toEqual([error]);
    expect(result).toBeUndefined();
  });

  it('keeps the first answer when a flush drains other envelopes behind the report', async () => {
    respond = (envelope) => Promise.resolve({statusCode: envelope === first ? 200 : 500});
    const first = envelopeOf('feedback');
    const second = envelopeOf('feedback');

    const delivered = await watchFeedbackDelivery(async () => {
      const one = transport().send(first);
      const two = transport().send(second);
      await Promise.all([one, two]);
    });

    expect(delivered).toBeTrue();
  });

  it('sends without watching when nothing asked for an answer', async () => {
    const feedback = envelopeOf('feedback');

    expect(await transport().send(feedback)).toEqual({statusCode: 200});
    expect(sent).toEqual([feedback]);
  });

  it('recognises a report whose envelope also carries its screenshot', async () => {
    // captureFeedback appends attachments to the report's own envelope, so the
    // feedback item is not the only one in it.
    const withScreenshot = envelopeOf('attachment', 'feedback');

    const delivered = await watchFeedbackDelivery(() => transport().send(withScreenshot));

    expect(delivered).toBeTrue();
  });
});
