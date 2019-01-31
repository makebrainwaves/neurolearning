import React, { Component } from 'react';

const biomassVideo =
  'http://localhost:1212/dist/bab08a1b5e70073aa05bda2923a835f2.mp4';
const fuelVideo =
  'http://localhost:1212/dist/bcc000d9e3048f485822cc246c74a0e5.mp4';
const gasVideo =
  'http://localhost:1212/dist/0e6ab5cbc3f80301b4cbf5a6ff8a0db6.mp4';
const photosynthVideo =
  'http://localhost:1212/dist/adf2b55277c0e5538ff5ba60a1f4a756.mp4';

const biomassQ = require('../questions/BiomassQuestions.js');
const fuelQ = require('../questions/FuelQuestions.js');
const gasQ = require('../questions/CombustionQuestions.js');
const photosynthQ = require('../questions/PhotosynthQuestions.js');

interface State {
  questionSet: string;
}
/*
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

  */
export const getQuestionSet = video => {
  let questionSetTemp = [];
  if (video === biomassVideo) {
    questionSetTemp = biomassQ;
  } else if (video === fuelVideo) {
    questionSetTemp = fuelQ;
  } else if (video === gasVideo) {
    questionSetTemp = gasQ;
  } else if (video === photosynthVideo) {
    questionSetTemp = photosynthQ;
  } else {
    questionSetTemp = null;
  }

  return questionSetTemp;
};
