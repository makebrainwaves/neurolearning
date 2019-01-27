import lsl from 'node-lsl';
import { fromEvent, Observable, of, pipe } from 'rxjs';
import {
  filter,
  map,
  mergeMap,
  tap,
  catchError,
  bufferTime,
  take
} from 'rxjs/operators';
import {
  epoch,
  fft,
  alphaPower,
  sliceFFT,
  averageDeep,
  average,
  standardDeviation,
  addSignalQuality,
  powerByBand,
  pickChannels
} from '@neurosity/pipes';
import { emit } from 'cluster';

const ENOBIO_SAMPLE_RATE = 500;
const VARIANCE_THRESHOLD = 10; // ~100uV variance? Will have to update depend. on format of Enobio data
const FFT_BINS = 512; // closest power of 2 to sampling rate
const BASELINE_DURATION = 60000; // 60 seconds
const DECISION_INTERVAL = 5000; // 5 seconds

interface baselineOptions {
  decisionThreshold?: number;
  // featurePipe?: Observable => Observable;
  // featurePipe?: array<number>;
  baselineDuration?: number;
  varianceThreshold?: number;
}

interface classifierOptions {
  interval?: number;
  // featurePipe?: Observable => Observable;
  // featurePipe?: array<number>;
  varianceThreshold?: number;
}

// Returns an array of StreamInfo objects representing available EEG LSL streams
// NOTE: This is a synchronous operation and will freeze the UI while it executes. Keep timeout low
export const resolveLSLStreams = (
  type: string = 'EEG', // Type of stream ('EEG' for EEG)
  min: number = 1, // Minimum number of streams to return
  timeout: number = 1 // How long to search for streams. Keep this low
) => lsl.resolve_byprop('type', type, min, timeout);

// Returns a StreamInlet object that can be subscribed to stream data
export const createStreamInlet = (streamInfo: lsl.StreamInfo) =>
  new lsl.StreamInlet(streamInfo);

// Resolves EEG LSL streams and returns an RxJS EEG Observable
// chunkSize determines what size requested from LSL
// selectedChannels determines which channels to select
export const createEEGObservable = (
  chunkSize: number = 250,
  selectedChannels: Array<number> | null = null
) => {
  const streams = resolveLSLStreams();
  console.log('Resolved ', streams.length, ' EEG streams');
  if (streams.length > 0) {
    const streamInlet = createStreamInlet(streams[0]);

    // Kick off this LSL Stream by calling this function with however many samples you want to pull at a time
    // 12 is just an example (works best for Muse @ 256hz);
    streamInlet.streamChunks(chunkSize);

    // Create RxJS Observable
    return fromEvent(streamInlet, 'chunk').pipe(
      filter(eegChunk => eegChunk.timestamps.length > 0),
      mergeMap((
        chunk // Operation to convert lsl chunks into single samples so that we can use eeg-pipes' epoching operator
      ) =>
        of(
          ...chunk.timestamps.map((timestamp, index) => ({
            data: chunk.data
              .map(channelData => channelData[index])
              .filter((_, i) => {
                // selects channels
                if (selectedChannels) {
                  return selectedChannels.includes(i);
                }
                return true;
              }),
            timestamp
          }))
        )
      )
    );
  }
};

export const createBaselineObservable = (
  rawObservable: Observable,
  {
    decisionThreshold = 2, // Number of standard devs above mean to set threshold
    featurePipe = computeAlpha,
    baselineDuration = BASELINE_DURATION,
    varianceThreshold = VARIANCE_THRESHOLD
  }: baselineOptions = {}
) =>
  rawObservable.pipe(
    epoch({
      samplingRate: ENOBIO_SAMPLE_RATE,
      duration: ENOBIO_SAMPLE_RATE,
      interval: ENOBIO_SAMPLE_RATE
    }),
    tap(epoch => console.log(' baseline epoch: ', epoch)),
    removeNoise(varianceThreshold),
    // tap(epoch => console.log('removeNoise: ', epoch)),
    featurePipe(),
    // tap(epoch => console.log('featurePipe: ', epoch)),
    map(average),
    bufferTime(baselineDuration),
    // tap(epoch => console.log('bufferTime: ', epoch)),
    map(
      featureBuffer =>
        average(featureBuffer) +
        decisionThreshold * standardDeviation(featureBuffer)
    ),
    take(1),
    catchError(err => {
      throw new Error(err);
    })
  );

export const createClassifierObservable = (
  rawObservable: Observable,
  threshold: number,
  {
    interval = DECISION_INTERVAL,
    featurePipe = computeAlpha,
    varianceThreshold = VARIANCE_THRESHOLD
  }: classifierOptions = {}
) =>
  rawObservable.pipe(
    epoch({
      samplingRate: ENOBIO_SAMPLE_RATE,
      duration: ENOBIO_SAMPLE_RATE,
      interval: ENOBIO_SAMPLE_RATE
    }),
    tap(epoch => console.log(' classifier epoch: ', epoch)),
    removeNoise(varianceThreshold),
    // tap(epoch => console.log(' classifier sig quality: ', epoch.signalQuality)),
    featurePipe(),
    // tap(alpha => console.log('power estimates coming out of featurePipe: ', alpha)),
    map(powerEstimates => average(powerEstimates)),
    tap(avg => console.log('mapped average of power estimates: ', avg)),
    bufferTime(interval),
    tap(epoch => console.log(' classifier epoch buff time: ', epoch)),
    map(featureBuffer => {
      const score = average(featureBuffer);
      const decision = score >= threshold;
      const powerEstimate = featureBuffer.slice(-1)[0];

      return { score, decision, powerEstimate };
    })
  );

// ------------------------------------------------------------------------------------------
// Operators
// Custom operators that can be composed to build our analysis pipeline

/*
export const removeNoise = (threshold: number = VARIANCE_THRESHOLD) =>
  pipe(
    deMean(),
    addSignalQuality(),
    tap(epoch =>
      console.log('signal quality removeNoise: ', epoch.signalQuality)
    ),
    filter(epo =>
      Object.values(epo.signalQuality).reduce(
        (acc, curr) => (curr >= threshold ? false : acc),
        true
      )
    )
  );
*/

export const removeNoise = (threshold: number = VARIANCE_THRESHOLD) =>
  pipe(
    deMean(),
    addSignalQuality(),
    filter(epo => {
      const isNoiseArray = Object.values(epo.signalQuality).map(
        noise => (noise >= threshold ? false : true)
      );
      // console.log(isNoiseArray);
      return isNoiseArray.reduce((acc, curr) => (curr ? curr : acc), true);
    })
  );

export const computeAlpha = (alphaRange: Array<number> = [8, 13]) =>
  pipe(
    fft({ bins: FFT_BINS }),
    powerByBand({ alpha: alphaRange }),
    map(bandPowers => bandPowers.alpha)
  );

export const computeThetaBeta = (
  thetaRange: Array<number> = [4, 7.5],
  betaRange: Array<number> = [12.5, 30]
) =>
  pipe(
    fft({ bins: FFT_BINS }),
    powerByBand({ theta: thetaRange, beta: betaRange }),
    map(bandPowers =>
      bandPowers.theta.map(
        (channelTheta, index) => channelTheta / bandPowers.beta[index]
      )
    )
  );

export const deMean = () =>
  pipe(
    map(epo => {
      const channelMeans = epo.data.map(average);
      return {
        ...epo,
        data: epo.data.map((channelData, index) =>
          channelData.map(value => value - channelMeans[index])
        )
      };
    })
  );
