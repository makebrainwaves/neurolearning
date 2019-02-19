// @flow

/**
 *  Functions for writing EEG data to disk
 */

import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import mkdirp from 'mkdirp';
import { has } from 'lodash';

export const writeExperimentCSV = (
  workspacePath: string,
  experimentData: any
) => {
  console.log('writing experiment data: ', experimentData);
  const experimentWriteStream = fs.createWriteStream(
    path.join(workspacePath, 'experiment.csv')
  );
  const csvString = `Date,${experimentData.date}\n`;
  csvString.concat(`Subject ID,${experimentData.subjectId}\n`);
  csvString.concat(`Experiment ID,${experimentData.experimenterId}\n`);
  csvString.concat(`Classifier Type,${experimentData.classifierType}\n`);
  csvString.concat(`Subject ID,${experimentData.subjectId}\n`);
  csvString.concat(`Electrodes,${experimentData.electrodes}\n`);
  csvString.concat(`Video Names,${experimentData.videoNames}\n`);
  csvString.concat(`Video Types,${experimentData.videoTypes}\n`);
  experimentWriteStream.write(csvString, () => experimentWriteStream.close());
};

// Creates an appropriate filename and returns a writestream that will write to that file
export const createRawEEGWriteStream = (
  workspacePath: string,
  videoName: string
): ?fs.WriteStream => {
  try {
    const dir = path.join(workspacePath, 'Raw');
    const filename = `raw_${videoName}.csv`;
    mkdirPathSync(dir);
    return fs.createWriteStream(path.join(dir, filename));
  } catch (e) {
    console.log('createEEGWriteStream: ', e);
  }
};

// Writes the header for a simple CSV EEG file format.
// timestamp followed by channels, followed by markers
export const writeHeader = (
  writeStream: fs.WriteStream,
  channels: Array<string>
) => {
  try {
    const headerLabels = `Timestamp,${channels.join(',')}\n`;
    writeStream.write(headerLabels);
  } catch (e) {
    console.log('writeHeader: ', e);
  }
};

// Writes an array of EEG data to a CSV through an active WriteStream
// TODOL Write an interface to define the type of incoming EEGData
export const writeEEGData = (writeStream: fs.WriteStream, eegData: any) => {
  writeStream.write(`${eegData.timestamp},`);
  const len = eegData.data.length;
  for (let i = 0; i < len; i++) {
    writeStream.write(`${eegData.data[i].toString()},`); // Round data
  }
  writeStream.write(`\n`);
};

// ------------------------------------------------------------------------
// Helper functions

// Creates a directory path if it doesn't exist
export const mkdirPathSync = dirPath => {
  mkdirp.sync(dirPath);
};

// -----------------------------------------------------------------------------------------------
// Creating and Getting

// Creates a new directory for a given workspace with the passed title if it doesn't already exist. Returns filesystem location of workspace
export const createWorkspaceDir = (title: string) => {
  const workspacePath = getWorkspaceDir(title);
  mkdirPathSync(workspacePath);
  return workspacePath;
};
// Gets the absolute path for an experimental folderfrom a given title
export const getWorkspaceDir = (title: string) =>
  path.join(os.homedir(), 'Neurolearning', title);
