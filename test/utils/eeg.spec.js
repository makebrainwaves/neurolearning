import { fromEvent, Observable, of, interval } from 'rxjs';
import { take, map } from 'rxjs/operators';
import { utilities } from 'openbci-utilities';
import {
  createBaselineObservable,
  createClassifierObservable,
  computeThetaBeta
} from '../../app/utils/eeg';

function setup() {
  const sampleGenerator = utilities.randomSample(16, 500, true, false);
  const rawEEGObservable = interval(2).pipe(
    map(sampleGenerator),
    map(({ channelData }) => ({
      data: channelData,
      timestamp: Date.now()
    }))
  );
  return rawEEGObservable;
}

describe('Classifier observables', () => {
  const rawEEGObservable = setup();
  let threshold = 0;
  jest.setTimeout(10000);
  it('should compute baseline from specific duration of data', done => {
    const baselineObservable = createBaselineObservable(rawEEGObservable, {
      baselineDuration: 5000,
      varianceThreshold: 0.000046850844390398775
    });
    baselineObservable.subscribe(
      result => {
        // with alpha injection: 0.000006389719429028138
        // without alpha injection: 0.000005958960532753821
        console.log('calculated threshold: ', result);
        expect(threshold).toBeDefined();
        threshold = result;
        done();
      },
      err => done(err),
      () => {}
    );
  });
  it('should emit decisions based on threshold', done => {
    let count = 0;
    const classifierObservable = createClassifierObservable(
      rawEEGObservable,
      threshold,
      { interval: 2000, varianceThreshold: 0.000046850844390398775 } // Note: bug when setting this interval too low
    );
    classifierObservable.subscribe(
      decision => {
        console.log('emitting decision: ', decision);
        expect(decision.decision).toBe(decision.score >= threshold);
        if (count++ >= 3) {
          done();
        }
      },
      err => done(err),
      () => done('Completed')
    );
  });
});
