import lsl from 'node-lsl';
import { fromEvent, Observable, of } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';
import { epoch, fft, alphaPower, powerByBand } from '@neurosity/pipes';

const ENOBIO_SAMPLE_RATE = 500;

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

export const createEEGObservable = (chunkSize = 250) => {
  const streams = resolveLSLStreams();
  console.log('Resolved ', streams.length, ' EEG streams');
  if (streams.length > 0) {
    const streamInlet = createStreamInlet(streams[0]);

    // Kick off this LSL Stream by calling this function with however many samples you want to pull at a time
    // 12 is just an example (works best for Muse @ 256hz);
    streamInlet.streamChunks(chunkSize);

    // Create RxJS Observable
    // Filter operation will prevent any empty samples from being emitted
    return fromEvent(streamInlet, 'chunk').pipe(
      filter(eegChunk => eegChunk.timestamps.length > 0)
    );
  }
};

export const createAlphaClassifierObservable = (rawObservable: Observable) =>
  rawObservable.pipe(
    mergeMap(chunk =>
      of(
        ...chunk.timestamps.map((timestamp, index) => ({
          data: chunk.data.map(channelData => channelData[index]),
          timestamp
        }))
      )
    ),
    // Epoch the data into 10s long segments emitted every 1s
    epoch({
      samplingRate: ENOBIO_SAMPLE_RATE,
      duration: 1024,
      interval: ENOBIO_SAMPLE_RATE
    }),
    fft({ bins: 1024 }),
    alphaPower(),
    // Average alpha power across all channels
    map(
      alphaArray =>
        alphaArray.reduce((acc, curr) => acc + curr) / alphaArray.length
    )
  );

export const createThetaBetaClassifierObservable = (
  rawObservable: Observable
) =>
  rawObservable.pipe(
    epoch({
      samplingRate: ENOBIO_SAMPLE_RATE,
      duration: ENOBIO_SAMPLE_RATE * 10,
      interval: ENOBIO_SAMPLE_RATE
    }),
    fft({ bins: ENOBIO_SAMPLE_RATE }),
    powerByBand(),
    map(bandPowers => bandPowers.theta / bandPowers.beta),
    // Average power ratio across all channels
    map(
      powerArray =>
        powerArray.reduce((acc, curr) => acc + curr) / powerArray.length
    )
  );
