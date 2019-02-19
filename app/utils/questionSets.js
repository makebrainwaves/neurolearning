import React, { Component } from 'react';

const biomassVideo =
  'http://localhost:1212/dist/bab08a1b5e70073aa05bda2923a835f2.mp4';
const fuelVideo =
  'http://localhost:1212/dist/bcc000d9e3048f485822cc246c74a0e5.mp4';
const gasVideo =
  'http://localhost:1212/dist/aaa7c3c877bf842df980088c9b239dce.mp4';
const photosynthVideo =
  'http://localhost:1212/dist/adf2b55277c0e5538ff5ba60a1f4a756.mp4';

const biomassQ = require('../questions/BiomassQuestions.js');
const fuelQ = require('../questions/FuelQuestions.js');
const gasQ = require('../questions/CombustionQuestions.js');
const photosynthQ = require('../questions/PhotosynthQuestions.js');

interface State {
  questionSet: string;
}

/* getQuestionSet - returns the original question set */

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

/* getRandomQuestionSet - standard question structuring for control videos */

export const getRandomQuestionSet = video => {
  const videoQuestions = getQuestionSet(video);

  let randomNumbers = [];
  const arr = [];
  const newQuestionSet = [];

  // find random values between 1 and questionSet.length
  while (arr.length < Math.floor(videoQuestions.length / 3)) {
    const r = Math.floor(Math.random() * videoQuestions.length) + 1;
    if (arr.indexOf(r) === -1) arr.push(r);
  }

  // sort array of random numbers
  randomNumbers = arr.sort((a, b) => a - b);
  // console.log('getRandomQuestionSet: randomrandomNumbers', randomNumbers);

  // copy corresponding questions to new array
  for (let i = 0; i < randomNumbers.length; i++) {
    for (let j = 0; j < videoQuestions.length; j++) {
      if (randomNumbers[i] === videoQuestions[j].key) {
        newQuestionSet.push(videoQuestions[j]);
      }
    }
  }
  console.log('newQuestionSet - standard control', newQuestionSet);

  return newQuestionSet;
};

/* getRandomControlQuestionSet - called when all 4 videos are control videos */
export const getRandomControlQuestionSet = video => {
  const videoQuestions = getQuestionSet(video);
  let randomNumbers = [];
  const arr = [];
  const newQuestionSet = [];
  // find random values between 1 and videoQuestions.length
  while (arr.length < Math.floor((videoQuestions.length * 2) / 3)) {
    const r = Math.floor(Math.random() * videoQuestions.length) + 1;
    if (arr.indexOf(r) === -1) arr.push(r);
  }

  // sort array of random numbers
  randomNumbers = arr.sort((a, b) => a - b);
  console.log('randomrandomNumbers Control', randomNumbers);

  // copy corresponding questions to new array
  for (let i = 0; i < randomNumbers.length; i++) {
    for (let j = 0; j < videoQuestions.length; j++) {
      if (randomNumbers[i] === videoQuestions[j].key) {
        newQuestionSet.push(videoQuestions[j]);
      }
    }
  }
  console.log('newQuestionSet - 4 Controls', newQuestionSet);

  return newQuestionSet;
};

/* getRandomQuestionSetAfterExperimental - for when control video follows experimental */
export const getControlQuestionstAfterExp = (video, numOfPrevExpQuestions) => {
  const videoQuestions = getQuestionSet(video);

  let randomNumbers = [];
  const arr = [];
  const newQuestionSet = [];

  const videoQuestionsLength = Math.min(
    numOfPrevExpQuestions,
    videoQuestions.length
  );

  // find random values between 1 and videoQuestions.length
  while (arr.length < Math.floor(videoQuestionsLength / 3)) {
    const r = Math.floor(Math.random() * videoQuestionsLength) + 1;
    if (arr.indexOf(r) === -1) arr.push(r);
  }

  // sort array of random numbers
  randomNumbers = arr.sort((a, b) => a - b);
  // console.log('randomNumbers(sortedarray) Control after Exp', randomNumbers);

  // copy corresponding questions to new array
  for (let i = 0; i < randomNumbers.length; i++) {
    for (let j = 0; j < videoQuestions.length; j++) {
      if (randomNumbers[i] === videoQuestions[j].key) {
        newQuestionSet.push(videoQuestions[j]);
      }
    }
  }
  console.log('newQuestionSet - Control after Experimental', newQuestionSet);

  return newQuestionSet;
};
