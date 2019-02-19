import { fromEvent, Observable, of, interval } from 'rxjs';
import { take, map, tap } from 'rxjs/operators';
import { utilities } from 'openbci-utilities';
import * as fs from 'fs';
import {
  createRawEEGWriteStream,
  writeHeader,
  writeEEGData,
  createWorkspaceDir
} from '../../app/utils/write';

function setup() {
  // 9 channbels
  const sampleGenerator = utilities.randomSample(10, 500, true, false);
  const rawEEGObservable = interval(2).pipe(
    map(sampleGenerator),
    map(({ channelData }) => ({
      data: channelData,
      timestamp: Date.now()
    }))
  );
  return rawEEGObservable;
}

describe('Workspace creation and raw EEG file writing', () => {
  const testDir = createWorkspaceDir('Neurolearning Write Test');
  it('Should be able to create a workspace', () => {
    const wasDirCreated = fs.existsSync(testDir);
    expect(wasDirCreated).toBeTruthy();
  });

  it('Should write a properly formatted file from a raw EEG observable', done => {
    const rawEEGObservable = setup();
    const channels = [
      'P7',
      'P4',
      'Cz',
      'Pz',
      'P3',
      'P8',
      'O1',
      'O2',
      'T8',
      'F8'
    ];
    jest.setTimeout(1000);
    const writeStream = createRawEEGWriteStream(testDir, 'test');
    writeHeader(writeStream, channels);
    rawEEGObservable.pipe(take(100)).subscribe(
      eeg => writeEEGData(writeStream, eeg),
      err => done(err),
      () => {
        writeStream.close();
        const csvPath = writeStream.path;
        const wasFileWritten = fs.existsSync(csvPath);
        expect(csvPath).toBe(`${testDir}/Raw/raw_test.csv`);
        const csv = fs.readFileSync(csvPath, 'ascii');
        const header = csv.slice(0, csv.indexOf(`\n`));
        expect(header).toBe('Timestamp,P7,P4,Cz,Pz,P3,P8,O1,O2,T8,F8');
        expect(csv.length).toBeGreaterThan(10000);
        done();
      }
    );
  });
});

//   const rawEEGObservable = setup();
//   let threshold = 0;
//   jest.setTimeout(10000);
//   it('should compute baseline from specific duration of data', done => {
//     const baselineObservable = createBaselineObservable(rawEEGObservable, {
//       baselineDuration: 5000,
//       varianceThreshold: 0.000046850844390398775
//     });
//     baselineObservable.subscribe(
//       result => {
//         // with alpha injection: 0.000006389719429028138
//         // without alpha injection: 0.000005958960532753821
//         console.log('calculated threshold: ', result);
//         expect(threshold).toBeDefined();
//         threshold = result;
//         done();
//       },
//       err => done(err),
//       () => {}
//     );
//   });
//   it('should emit decisions based on threshold', done => {
//     let count = 0;
//     const classifierObservable = createClassifierObservable(
//       rawEEGObservable,
//       threshold,
//       { interval: 2000, varianceThreshold: 0.000046850844390398775 } // Note: bug when setting this interval too low
//     );
//     classifierObservable.subscribe(
//       decision => {
//         console.log('emitting decision: ', decision);
//         expect(decision.decision).toBe(decision.score >= threshold);
//         if (count++ >= 3) {
//           done();
//         }
//       },
//       err => done(err),
//       () => done('Completed')
//     );
//   });
// });
