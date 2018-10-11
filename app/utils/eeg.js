import lsl from 'node-lsl';
import { fromEvent } from 'rxjs';
import { filter } from 'rxjs/operators';

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

export const createEEGObservable = (chunkSize = 12) => {
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
