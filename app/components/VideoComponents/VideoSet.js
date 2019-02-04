// @flow
/* eslint class-methods-use-this: ["error", { "exceptMethods": ["getQuestionSet"] }] */
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Button, Modal } from 'semantic-ui-react';
import { CSVLink } from 'react-csv';
import { Subscription } from 'rxjs';
import styles from './VideoSet.css';
import routes from '../../constants/routes.json';
import * as data from '../../questions/questions.json';

import {
  createBaselineObservable,
  createClassifierObservable,
  computeAlpha,
  computeThetaBeta
} from '../../utils/eeg';

import {
  getQuestionSet
  // getRandomQuestionSet,
  // getRandomControlQuestionSet,
  // getRandomQuestionSetAfterExperimental
} from '../../utils/questionSets';

interface State {
  subjectId: string;
  firstVideo: string;
  firstVideoType: string;
  secondVideo: string;
  secondVideoType: string;
  thirdVideo: string;
  thirdVideoType: string;
  fourthVideo: string;
  fourthVideoType: string;
  isRunning: boolean;
  question1AlreadyShown: boolean;
  question2AlreadyShown: boolean;
  questionNumber: string;
  questionText: string;
  obscureButton: boolean;
  allFourControlVideos: boolean;
  firstExpQuestionSetLength: number;
  secondExpQuestionSetLength: number;
  thirdExpQuestionSetLength: number;
  classifierCsv: array;
  addedToCsv: boolean;
}

const rollBackTime = 5;
const biomassQ = require('../../questions/BiomassQuestions.js');
const fuelQ = require('../../questions/FuelQuestions.js');
const gasQ = require('../../questions/CombustionQuestions.js');
const photosynthQ = require('../../questions/PhotosynthQuestions.js');
const answersArray = require('../../constants/Answers.js');
const updatedAnswersArray = require('../../constants/UpdatedAnswers.js');

const biomassVideo =
  'http://localhost:1212/dist/bab08a1b5e70073aa05bda2923a835f2.mp4';
const fuelVideo =
  'http://localhost:1212/dist/bcc000d9e3048f485822cc246c74a0e5.mp4';
const gasVideo =
  'http://localhost:1212/dist/0e6ab5cbc3f80301b4cbf5a6ff8a0db6.mp4';
const photosynthVideo =
  'http://localhost:1212/dist/adf2b55277c0e5538ff5ba60a1f4a756.mp4';

export default class VideoSet extends Component<Props, State> {
  props: Props;
  classifierEEGSubscription: ?Subscription;
  rawEEGSubscription: ?Subscription;

  constructor(props) {
    super(props);

    this.state = {
      isRunning: false,
      modalIsOpen: false,
      finalModalIsOpen: false,
      question1AlreadyShown: false,
      question2AlreadyShown: false,
      biomassSequenceNumber: 1,
      fuelSequenceNumber: 2,
      gasSequenceNumber: 3,
      photosynthSequenceNumber: 4,
      questionNumber: '',
      questionText: '',
      answers: answersArray,
      updatedAnswers: updatedAnswersArray,
      askQuestion: false,
      obscureButton: true, // TODO: set this based on baseline data collection
      allFourControlVideos: false,
      firstExpQuestionSetLength: 0,
      secondExpQuestionSetLength: 0,
      thirdExpQuestionSetLength: 0,
      classifierCsv: [],
      addedToCsv: false
    };
    // These are just so that we can unsubscribe from the observables
    this.rawEEGSubscription = null;
    this.classifierEEGSubscription = null;
    // This binding is necessary to make `this` work in the callback
    this.playVideo = this.playVideo.bind(this);
    this.pauseVideo = this.pauseVideo.bind(this);
    this.handleQuestion = this.handleQuestion.bind(this);
    this.getSequenceNumber = this.getSequenceNumber.bind(this);
    this.handleStartEEG = this.handleStartEEG.bind(this);
    this.openFullscreen = this.openFullscreen.bind(this);
    this.closeFullscreen = this.closeFullscreen.bind(this);
  }

  componentWillMount() {
    this.setState({
      currentVideo: this.props.location.state.firstVideo,
      videoName: this.getVideoName(this.props.location.state.firstVideo),
      biomassSequenceNumber: this.getSequenceNumber('biomass'),
      fuelSequenceNumber: this.getSequenceNumber('fuel'),
      gasSequenceNumber: this.getSequenceNumber('gas'),
      photosynthSequenceNumber: this.getSequenceNumber('photosynth')
    });

    this.setCounterControlAfterExp();
  }

  componentDidMount() {
    let questionSetTemp = [];
    if (this.props.location.state.firstVideoType === 'control') {
      if (
        this.props.location.state.secondVideoType === 'control' &&
        this.props.location.state.thirdVideoType === 'control' &&
        this.props.location.state.fourthVideoType === 'control'
      ) {
        questionSetTemp = this.getRandomControlQuestionSet(
          this.state.currentVideo
        );
        this.setState({ allFourControlVideos: true });
      } else {
        questionSetTemp = this.getRandomQuestionSet(this.state.currentVideo);
      }
    }

    if (this.props.location.state.firstVideoType === 'experimental') {
      questionSetTemp = getQuestionSet(this.state.currentVideo);
    }
    this.setState({
      questionSet: questionSetTemp
    });

    for (let i = 0; i < 40; i++) {
      const questionAnswered = `questionAnswered${i + 1}`;
      const askQuestion = `askQuestion${i + 1}`;
      const addedToCsv = `addedToCsv${i + 1}`;
      this.setState({
        [questionAnswered]: false,
        [askQuestion]: false,
        [addedToCsv]: false
      });
    }

    this.handleStartEEG();
  }

  handleStartEEG() {
    if (this.props.location.state.classifierType === 'alpha') {
      const baselineObs = createBaselineObservable(
        this.props.location.state.rawEEGObservable,
        { featurePipe: computeAlpha }
      );
      baselineObs.subscribe(threshold => {
        // this.setState({ threshold });
        console.log('THRESHOLD ALPHA threshold', threshold);
        const classifierObservable = createClassifierObservable(
          this.props.location.state.rawEEGObservable,
          threshold,
          { featurePipe: computeAlpha }
        );
        classifierObservable.subscribe(decision => {
          console.log('this.state.decision ALPHA', decision);
          // console.log('this.state.score ALPHA', decision.score);
          this.setState({
            decision: decision.decision,
            score: decision.score,
            powerEstimate: decision.powerEstimate
          });
        });
      });
    } else {
      const baselineObs = createBaselineObservable(
        this.props.location.state.rawEEGObservable,
        { featurePipe: computeThetaBeta }
      );
      baselineObs.subscribe(threshold => {
        // this.setState({ threshold });
        console.log('THRESHOLD THETABETA threshold', threshold);
        const classifierObservable = createClassifierObservable(
          this.props.location.state.rawEEGObservable,
          threshold,
          { featurePipe: computeThetaBeta }
        );
        classifierObservable.subscribe(decision => {
          // console.log('this.state.decision TB', decision);
          this.setState({
            decision: decision.decision,
            score: decision.score,
            powerEstimate: decision.powerEstimate
          });
        });
      });
    }
  }

  setCounterControlAfterExp() {
    // counter for when Experiment precedes Control video:
    const expType = this.getExperimentType();
    const seqNo = this.getSequenceNumber(this.state.videoName);

    if (expType === 'experimental') {
      if (seqNo === 1) {
        let expLengthTemp = this.state.firstExpQuestionSetLength;
        expLengthTemp += 1;
        this.setState({ firstExpQuestionSetLength: expLengthTemp });
      }
      if (seqNo === 2) {
        let expLengthTemp = this.state.secondExpQuestionSetLength;
        expLengthTemp += 1;
        this.setState({ secondExpQuestionSetLength: expLengthTemp });
      }
      if (seqNo === 3) {
        let expLengthTemp = this.state.thirdExpQuestionSetLength;
        expLengthTemp += 1;
        this.setState({ thirdExpQuestionSetLength: expLengthTemp });
      }
    }
  }

  getRandomQuestionSet(currVid) {
    const videoQuestions = getQuestionSet(currVid);

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
    console.log('getRandomQuestionSet: randomrandomNumbers', randomNumbers);

    // copy corresponding questions to new array
    for (let i = 0; i < randomNumbers.length; i++) {
      for (let j = 0; j < videoQuestions.length; j++) {
        if (randomNumbers[i] === videoQuestions[j].key) {
          newQuestionSet.push(videoQuestions[j]);
        }
      }
    }

    console.log('newQuestionSet', newQuestionSet);

    this.setState({
      questionSet: newQuestionSet
    });

    return newQuestionSet;
  }

  getRandomControlQuestionSet(currVid) {
    const videoQuestions = getQuestionSet(currVid);
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

    console.log('newQuestionSet - Control', newQuestionSet);

    this.setState({
      questionSet: newQuestionSet
    });

    return newQuestionSet;
  }

  getRandomQuestionSetAfterExperimental(currVid, numOfPreviousExpQuestions) {
    const videoQuestions = getQuestionSet(currVid);

    let randomNumbers = [];
    const arr = [];
    const newQuestionSet = [];

    const videoQuestionsLength = Math.min(
      numOfPreviousExpQuestions,
      videoQuestions.length
    );

    // find random values between 1 and videoQuestions.length
    // console.log("what is videoQuestionsLength", videoQuestionsLength);
    while (arr.length < Math.floor(videoQuestionsLength / 3)) {
      const r = Math.floor(Math.random() * videoQuestionsLength) + 1;
      if (arr.indexOf(r) === -1) arr.push(r);
    }

    // sort array of random numbers
    randomNumbers = arr.sort((a, b) => a - b);
    console.log('randomNumbers(sortedarray) Control after Exp', randomNumbers);

    // copy corresponding questions to new array
    for (let i = 0; i < randomNumbers.length; i++) {
      for (let j = 0; j < videoQuestions.length; j++) {
        if (randomNumbers[i] === videoQuestions[j].key) {
          newQuestionSet.push(videoQuestions[j]);
        }
      }
    }

    console.log('newQuestionSet - Control after Experimental', newQuestionSet);

    this.setState({
      questionSet: newQuestionSet
    });

    return newQuestionSet;
  }

  closeModal = () => {
    const { questionNumber } = this.state;
    const answers = this.state.answers;
    const time = new Date().getTime();
    const qNumberForSubmit = `q${questionNumber}`;

    answers.forEach(answer => {
      answer[this.state.videoName][qNumberForSubmit].submitTimeTOD = time;
    });

    this.setState({ answers });

    this.setState({
      modalIsOpen: false,
      obscureButton: true
    });

    this.playVideo();
  };

  closeFinalModal = () => {
    this.moveAlongVideoSequence();
    this.setState({ finalModalIsOpen: false });
  };

  playVideo = () => {
    if (!this.state.isEEGRecording) {
      this.handleStartEEG();
    }
    this.openFullscreen();
    const videoRef = this.getVideoRef;
    videoRef.play();
    this.setState({ isRunning: true });
  };

  pauseVideo = () => {
    this.closeFullscreen();
    const videoRef = this.getVideoRef;
    videoRef.pause();
    videoRef.currentTime -= rollBackTime;
    this.setState({ isRunning: false });
  };

  setModalTimes = (questionNumber, vidCurrTime) => {
    const answers = this.state.answers;
    const time = new Date().getTime();
    const qNumberForModal = `q${questionNumber}`;

    answers.forEach(answer => {
      answer[this.state.videoName][qNumberForModal].modalPopupTOD = time;
      answer[this.state.videoName][qNumberForModal].modalPopupTOV = vidCurrTime;
    });

    this.setState({ answers });
  };

  closeFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      /* Firefox */
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      /* Chrome, Safari and Opera */
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      /* IE/Edge */
      document.msExitFullscreen();
    }
  };

  nextQuestion = (key, vidCurrTime) => {
    const videoQuestions = this.state.questionSet;

    for (let i = 0; i < videoQuestions.length; i++) {
      if (videoQuestions[i].key === key) {
        this.pauseVideo();
        this.setState({
          questionNumber: videoQuestions[i].key,
          questionText: videoQuestions[i].value.question,
          modalIsOpen: true
        });
        this.setModalTimes(videoQuestions[i].key, vidCurrTime);
      }
    }
  };

  getVideoName(currentVideo) {
    let videoNameTemp = '';
    if (currentVideo === biomassVideo) {
      videoNameTemp = 'biomass';
    } else if (currentVideo === fuelVideo) {
      videoNameTemp = 'fuel';
    } else if (currentVideo === gasVideo) {
      videoNameTemp = 'gas';
    } else if (currentVideo === photosynthVideo) {
      videoNameTemp = 'photosynth';
    } else {
      videoNameTemp = '';
    }
    this.setState({
      videoName: videoNameTemp
    });

    return videoNameTemp;
  }

  onTimeUpdate = () => {
    const {
      question1AlreadyShown,
      question2AlreadyShown,
      isRunning,
      currentVideo,
      videoName,
      questionSet,
      decision,
      score,
      powerEstimate
    } = this.state;

    const vidCurrTime = document.getElementById('vidID').currentTime;
    const videoType = this.getExperimentType();

    if (videoType === 'experimental') {
      console.log('second vidCurrTime', vidCurrTime);
      console.log('second decison', decision);
      console.log('second score', score);
      console.log('second powerEstimate', powerEstimate);
      for (let i = 0; i < questionSet.length; i++) {
        const askQuestion = `askQuestion${i + 1}`;

        if (
          questionSet[i].value.period - 5 <= vidCurrTime &&
          vidCurrTime < questionSet[i].value.period &&
          decision === true
        ) {
          this.setState({
            [askQuestion]: true
          });
        } else {
          this.setState({
            [askQuestion]: false
          });
        }
      }
    }

    for (let i = 0; i < questionSet.length; i++) {
      const questNum = i + 1;
      const questionAnswered = `questionAnswered${questNum}`;

      const askQuestionNum = i + 1;
      const askQuestion = `askQuestion${askQuestionNum}`;

      const addedToCsvNum = i + 1;
      const addedToCsv = `addedToCsv${addedToCsvNum}`;

      if (
        videoType === 'control' &&
        questionSet[i] &&
        questionSet[i].value.period <= vidCurrTime &&
        !this.state[questionAnswered]
      ) {
        this.nextQuestion(questionSet[i].key, vidCurrTime);
      }
      if (
        videoType === 'experimental' &&
        questionSet[i] &&
        questionSet[i].value.period <= vidCurrTime &&
        this.state[askQuestion] &&
        !this.state[questionAnswered]
      ) {
        this.nextQuestion(questionSet[i].key, vidCurrTime);
      }
      if (
        questionSet[i] &&
        questionSet[i].value.period <= vidCurrTime &&
        !this.state[addedToCsv]
      ) {
        this.addToClassifierCSV(questionSet[i].value.period, vidCurrTime);
      }
    }
    /*
    if (this.props.location.state.firstVideoType === 'experimental') {
      if (question1AlreadyShown) {
        if (this.state.classifierScore >= this.state.classifierThreshold) {
          this.setState({
            modalIsOpen: true,
            question1AlreadyShown: !question1AlreadyShown,
            questionNumber: data.q1.name,
            questionText: data.q1.question,
          });
          this.pauseVideo();
        }
      }
    }
    */
  };

  moveAlongVideoSequence() {
    const videoQuestions = this.state.questionSet;

    for (let i = 0; i < videoQuestions.length; i++) {
      const questionAnswered = `questionAnswered${i + 1}`;
      const askQuestion = `askQuestion${i + 1}`;
      const addedToCsv = `addedToCsv${i + 1}`;

      this.setState({
        [questionAnswered]: false,
        [askQuestion]: false,
        [addedToCsv]: false
      });
    }

    if (this.state.currentVideo === this.props.location.state.firstVideo) {
      let questionSetTemp = [];
      if (this.props.location.state.secondVideoType === 'control') {
        if (this.state.allFourControlVideos) {
          questionSetTemp = this.getRandomControlQuestionSet(
            this.props.location.state.secondVideo
          );
        } else if (
          this.props.location.state.firstVideoType === 'experimental'
        ) {
          questionSetTemp = this.getRandomQuestionSetAfterExperimental(
            this.props.location.state.secondVideo,
            this.state.firstExpQuestionSetLength
          );
        } else {
          questionSetTemp = this.getRandomQuestionSet(
            this.props.location.state.secondVideo
          );
        }
      }
      if (this.props.location.state.secondVideoType === 'experimental') {
        questionSetTemp = getQuestionSet(this.props.location.state.secondVideo);
      }
      this.setState({
        currentVideo: this.props.location.state.secondVideo,
        questionSet: questionSetTemp,
        videoName: this.getVideoName(this.props.location.state.secondVideo)
      });
    } else if (
      this.state.currentVideo === this.props.location.state.secondVideo
    ) {
      let questionSetTemp = [];
      if (this.props.location.state.thirdVideoType === 'control') {
        if (this.state.allFourControlVideos) {
          questionSetTemp = this.getRandomControlQuestionSet(
            this.props.location.state.thirdVideo
          );
        } else if (
          this.props.location.state.secondVideoType === 'experimental'
        ) {
          questionSetTemp = this.getRandomQuestionSetAfterExperimental(
            this.props.location.state.thirdVideo,
            this.state.secondExpQuestionSetLength
          );
        } else if (
          this.props.location.state.firstVideoType === 'experimental'
        ) {
          questionSetTemp = this.getRandomQuestionSetAfterExperimental(
            this.props.location.state.thirdVideo,
            this.state.firstExpQuestionSetLength
          );
        } else {
          questionSetTemp = this.getRandomQuestionSet(
            this.props.location.state.thirdVideo
          );
        }
      }
      if (this.props.location.state.thirdVideoType === 'experimental') {
        questionSetTemp = getQuestionSet(this.props.location.state.thirdVideo);
      }
      this.setState({
        currentVideo: this.props.location.state.thirdVideo,
        questionSet: questionSetTemp,
        videoName: this.getVideoName(this.props.location.state.thirdVideo)
      });
    } else if (
      this.state.currentVideo === this.props.location.state.thirdVideo
    ) {
      let questionSetTemp = [];
      if (this.props.location.state.fourthVideoType === 'control') {
        if (this.state.allFourControlVideos) {
          questionSetTemp = this.getRandomControlQuestionSet(
            this.props.location.state.fourthVideo
          );
        } else if (
          this.props.location.state.thirdVideoType === 'experimental'
        ) {
          questionSetTemp = this.getRandomQuestionSetAfterExperimental(
            this.props.location.state.fourthVideo,
            this.state.thirdExpQuestionSetLength
          );
        } else if (
          this.props.location.state.secondVideoType === 'experimental'
        ) {
          questionSetTemp = this.getRandomQuestionSetAfterExperimental(
            this.props.location.state.fourthVideo,
            this.state.secondExpQuestionSetLength
          );
        } else if (
          this.props.location.state.firstVideoType === 'experimental'
        ) {
          questionSetTemp = this.getRandomQuestionSetAfterExperimental(
            this.props.location.state.fourthVideo,
            this.state.firstExpQuestionSetLength
          );
        } else {
          questionSetTemp = this.getRandomQuestionSet(
            this.props.location.state.fourthVideo
          );
        }
      }
      if (this.props.location.state.fourthVideoType === 'experimental') {
        questionSetTemp = getQuestionSet(this.props.location.state.fourthVideo);
      }
      this.setState({
        currentVideo: this.props.location.state.fourthVideo,
        questionSet: questionSetTemp,
        videoName: this.getVideoName(this.props.location.state.fourthVideo)
      });
    }
  }

  endOfVideo = () => {
    this.closeFullscreen();
    this.setState({ finalModalIsOpen: true });
  };

  handleEngagement(q, e) {
    const answers = this.state.answers;
    const qNumberForEngagement = `q${q.questionNumber}`;

    answers.forEach(answer => {
      answer[this.state.videoName][qNumberForEngagement].engagement =
        e.target.value;
    });

    this.setState({ answers });
  }

  getExperimentType() {
    const currentVideoName = this.getVideoName(this.state.currentVideo);
    let seqNo = '';
    if (currentVideoName === 'biomass') {
      seqNo = this.state.biomassSequenceNumber;
    }
    if (currentVideoName === 'fuel') {
      seqNo = this.state.fuelSequenceNumber;
    }
    if (currentVideoName === 'gas') {
      seqNo = this.state.gasSequenceNumber;
    }
    if (currentVideoName === 'photosynth') {
      seqNo = this.state.photosynthSequenceNumber;
    }

    const {
      firstVideoType,
      secondVideoType,
      thirdVideoType,
      fourthVideoType
    } = this.props.location.state;

    let expType = '';
    if (seqNo === 1) {
      expType = firstVideoType;
    }
    if (seqNo === 2) {
      expType = secondVideoType;
    }
    if (seqNo === 3) {
      expType = thirdVideoType;
    }
    if (seqNo === 4) {
      expType = fourthVideoType;
    }

    return expType;
  }

  handleQuestion(q, e) {
    this.setState({ obscureButton: false });
    const answers = this.state.answers;
    const questionNumber = `q${q.questionNumber}`;
    const videoQuestions = this.state.questionSet;

    answers.forEach(answer => {
      answer[this.state.videoName].value = this.state.videoName;
      answer[this.state.videoName][
        questionNumber
      ].experimentType = this.getExperimentType();
      answer[this.state.videoName][questionNumber].value = q.questionNumber;
      answer[this.state.videoName][questionNumber].answer = e.target.value;
    });

    this.setState({
      answers
    });
    this.setState({
      answers
    });

    for (let i = 0; i < videoQuestions.length; i++) {
      if (videoQuestions[i].key === q.questionNumber) {
        const questionAnswered = `questionAnswered${i + 1}`;
        const askQuestion = `askQuestion${i + 1}`;

        this.setState({
          [questionAnswered]: true,
          [askQuestion]: false
        });
      }
    }
  }

  /* When the openFullscreen() function is executed, open the video in fullscreen.
  Note that we must include prefixes for different browsers, as they don't support the requestFullscreen method yet */
  openFullscreen = () => {
    const elem = document.getElementById('vidID');

    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      /* Firefox */
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      /* Chrome, Safari and Opera */
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      /* IE/Edge */
      elem.msRequestFullscreen();
    }
  };

  getSequenceNumber(videoName) {
    let sequenceNumber = null;

    const {
      firstVideo,
      secondVideo,
      thirdVideo,
      fourthVideo
    } = this.props.location.state;

    const firstVideoName = this.getVideoName(firstVideo);
    const secondVideoName = this.getVideoName(secondVideo);
    const thirdVideoName = this.getVideoName(thirdVideo);
    const fourthVideoName = this.getVideoName(fourthVideo);

    if (firstVideoName === videoName) {
      sequenceNumber = 1;
    }
    if (secondVideoName === videoName) {
      sequenceNumber = 2;
    }
    if (thirdVideoName === videoName) {
      sequenceNumber = 3;
    }
    if (fourthVideoName === videoName) {
      sequenceNumber = 4;
    }

    return sequenceNumber;
  }

  getAnswerSet() {
    console.log('AnswerSet', this.state.answers);
    const newAnswers = this.state.updatedAnswers;
    const answersTemp = this.state.answers;

    for (const key of Object.keys(newAnswers)) {
      const questVal = parseInt(key, 10);
      if (key >= 0 && key < 21) {
        const questionNum = `q${questVal + 1}`;
        newAnswers[key].Subject = this.props.location.state.subjectId;
        newAnswers[key].VideoName = 'biomass';
        newAnswers[key].ExperimentType =
          answersTemp[0].biomass[questionNum].experimentType;
        newAnswers[key].SequenceNo = this.state.biomassSequenceNumber;
        newAnswers[key].ModalPopupTOD =
          answersTemp[0].biomass[questionNum].modalPopupTOD;
        newAnswers[key].ModalPopupTOV =
          answersTemp[0].biomass[questionNum].modalPopupTOV;
        newAnswers[key].SubmitTimeTOD =
          answersTemp[0].biomass[questionNum].submitTimeTOD;
        newAnswers[key].QuestionNo = questionNum;
        newAnswers[key].Engagement =
          answersTemp[0].biomass[questionNum].engagement;
        newAnswers[key].Answer = answersTemp[0].biomass[questionNum].answer;
      }
      if (key >= 21 && key < 44) {
        const questionNum = `q${questVal - 20}`;
        newAnswers[key].Subject = this.props.location.state.subjectId;
        newAnswers[key].VideoName = 'fuel';
        newAnswers[key].ExperimentType =
          answersTemp[0].fuel[questionNum].experimentType;
        newAnswers[key].SequenceNo = this.state.fuelSequenceNumber;
        newAnswers[key].ModalPopupTOD =
          answersTemp[0].fuel[questionNum].modalPopupTOD;
        newAnswers[key].ModalPopupTOV =
          answersTemp[0].fuel[questionNum].modalPopupTOV;
        newAnswers[key].SubmitTimeTOD =
          answersTemp[0].fuel[questionNum].submitTimeTOD;
        newAnswers[key].QuestionNo = questionNum;
        newAnswers[key].Engagement =
          answersTemp[0].fuel[questionNum].engagement;
        newAnswers[key].Answer = answersTemp[0].fuel[questionNum].answer;
      }
      if (key >= 44 && key < 83) {
        const questionNum = `q${questVal - 43}`;
        newAnswers[key].Subject = this.props.location.state.subjectId;
        newAnswers[key].VideoName = 'gas';
        newAnswers[key].ExperimentType =
          answersTemp[0].gas[questionNum].experimentType;
        newAnswers[key].SequenceNo = this.state.gasSequenceNumber;
        newAnswers[key].ModalPopupTOD =
          answersTemp[0].gas[questionNum].modalPopupTOD;
        newAnswers[key].ModalPopupTOV =
          answersTemp[0].gas[questionNum].modalPopupTOV;
        newAnswers[key].SubmitTimeTOD =
          answersTemp[0].gas[questionNum].submitTimeTOD;
        newAnswers[key].QuestionNo = questionNum;
        newAnswers[key].Engagement = answersTemp[0].gas[questionNum].engagement;
        newAnswers[key].Answer = answersTemp[0].gas[questionNum].answer;
      }
      if (key >= 83 && key < 110) {
        const questionNum = `q${questVal - 82}`;
        newAnswers[key].Subject = this.props.location.state.subjectId;
        newAnswers[key].VideoName = 'photosynth';
        newAnswers[key].ExperimentType =
          answersTemp[0].photosynth[questionNum].experimentType;
        newAnswers[key].SequenceNo = this.state.photosynthSequenceNumber;
        newAnswers[key].ModalPopupTOD =
          answersTemp[0].photosynth[questionNum].modalPopupTOD;
        newAnswers[key].ModalPopupTOV =
          answersTemp[0].photosynth[questionNum].modalPopupTOV;
        newAnswers[key].SubmitTimeTOD =
          answersTemp[0].photosynth[questionNum].submitTimeTOD;
        newAnswers[key].QuestionNo = questionNum;
        newAnswers[key].Engagement =
          answersTemp[0].photosynth[questionNum].engagement;
        newAnswers[key].Answer = answersTemp[0].photosynth[questionNum].answer;
      }
    }

    return newAnswers;
  }

  addToClassifierCSV(value, vidCurrTime) {
    const videoQuestions = this.state.questionSet;
    const classifierCsvTemp = this.state.classifierCsv;
    const time = new Date().getTime();

    const classifierEntry = {
      Subject: this.props.location.state.subjectId,
      VideoName: this.getVideoName(this.state.currentVideo),
      ExperimentType: this.getExperimentType(),
      ClassifierType: this.props.location.state.classifierType,
      TOD: time,
      TOV: vidCurrTime,
      ThresholdSurpassed: this.state.decision ? 1 : 0,
      PowerEstimate: this.state.powerEstimate ? this.state.powerEstimate : 'N/A'
    };
    classifierCsvTemp.push(classifierEntry);
    this.setState({ classifierCsv: classifierCsvTemp });
    // console.log('classifierEntry', classifierEntry);
    // console.log('this.state.classifierCsv', this.state.classifierCsv);

    for (let i = 0; i < videoQuestions.length; i++) {
      if (videoQuestions[i].value.period === value) {
        const addedToCsv = `addedToCsv${i + 1}`;

        this.setState({
          [addedToCsv]: true
        });
      }
    }
  }

  getClassifierCsv() {
    const newAnswers = this.state.classifierCsv;
    return newAnswers;
  }

  render() {
    const {
      modalIsOpen,
      questionSet,
      answers,
      questionNumber,
      questionText,
      currentVideo,
      videoName,
      biomassSequenceNumber,
      fuelSequenceNumber,
      gasSequenceNumber,
      photosynthSequenceNumber,
      updatedAnswers,
      decision,
      score
    } = this.state;
    const { location } = this.props;
    const { state } = location;
    const {
      subjectId,
      firstVideo,
      firstVideoType,
      secondVideo,
      secondVideoType,
      thirdVideo,
      thirdVideoType,
      fourthVideo,
      fourthVideoType
    } = state;

    const answersCsv = this.getAnswerSet();
    const classifierCsv = this.getClassifierCsv();

    return (
      <div className={styles.videoContainer}>
        <div className={styles.backButton} data-tid="backButton">
          <Link to={routes.HOME}>
            <i className="fa fa-arrow-left fa-2x" />
          </Link>
        </div>
        <div>
          <video
            id="vidID"
            ref={c => {
              this.getVideoRef = c;
            }}
            className={styles.video}
            src={currentVideo}
            width="62%"
            poster="../app/components/VideoComponents/bkbx.jpg"
            controls
            onTimeUpdate={this.onTimeUpdate}
            onEnded={() => this.endOfVideo()}
          >
            <track kind="captions" />
          </video>
          <div className={styles.btnGroup}>
            <Button
              className={styles.btn}
              onClick={() => this.playVideo()}
              data-tclass="btn"
              type="button"
            >
              Play
            </Button>
            <Button
              className={styles.btn}
              onClick={this.pauseVideo}
              data-tclass="btn"
              type="button"
            >
              Pause
            </Button>
          </div>
        </div>
        <Button>
          <CSVLink data={answersCsv} filename="answers.csv">
            Download Subject Answers
          </CSVLink>
        </Button>
        <Button>
          <CSVLink data={classifierCsv} filename="classifier.csv">
            Download Classifier CSV
          </CSVLink>
        </Button>
        <Modal
          open={this.state.modalIsOpen}
          className={styles.modal}
          closeOnEscape={false}
          closeOnDimmerClick={false}
        >
          <div className={styles.inner}>
            <Modal.Header />
            <Modal.Content className={styles.content}>
              <Modal.Description>
                <h4>1. On a scale of 1 to 5, how engaged are you right now?</h4>
                <h5>(1 = not engaged at all, 5 = very engaged)</h5>
                <div className={styles.engagement}>
                  <div className="radio">
                    1
                    <label
                      className={styles.engagementRadio}
                      htmlFor="something"
                    >
                      <input
                        name="engagement"
                        type="radio"
                        value="e1"
                        onChange={e =>
                          this.handleEngagement({ questionNumber }, e)
                        }
                      />
                    </label>
                    2
                    <label
                      className={styles.engagementRadio}
                      htmlFor="something"
                    >
                      <input
                        name="engagement"
                        type="radio"
                        value="e2"
                        onChange={e =>
                          this.handleEngagement({ questionNumber }, e)
                        }
                      />
                    </label>
                    3
                    <label
                      className={styles.engagementRadio}
                      htmlFor="something"
                    >
                      <input
                        name="engagement"
                        type="radio"
                        value="e3"
                        onChange={e =>
                          this.handleEngagement({ questionNumber }, e)
                        }
                      />
                    </label>
                    4
                    <label
                      className={styles.engagementRadio}
                      htmlFor="something"
                    >
                      <input
                        name="engagement"
                        type="radio"
                        value="e4"
                        onChange={e =>
                          this.handleEngagement({ questionNumber }, e)
                        }
                      />
                    </label>
                    5
                    <label
                      className={styles.engagementRadio}
                      htmlFor="something"
                    >
                      <input
                        name="engagement"
                        type="radio"
                        value="e5"
                        onChange={e =>
                          this.handleEngagement({ questionNumber }, e)
                        }
                      />
                    </label>
                  </div>
                </div>
                <hr />
                <h4 className={styles.questions}>
                  2.
                  {this.state.questionText}
                </h4>
                <h5>Please select an answer to continue:</h5>
                <div>
                  <div className="radio">
                    <label htmlFor="True">
                      <input
                        name="True"
                        type="radio"
                        value="True"
                        onChange={e =>
                          this.handleQuestion({ questionNumber }, e)
                        }
                      />
                    </label>
                    True
                  </div>
                  <div className="radio">
                    <label htmlFor="2False">
                      <input
                        name="False"
                        type="radio"
                        value="False"
                        onChange={e =>
                          this.handleQuestion({ questionNumber }, e)
                        }
                      />
                    </label>
                    False
                  </div>
                  <div className="radio">
                    <label htmlFor="DK">
                      <input
                        name="DK"
                        type="radio"
                        value="I don't know"
                        onChange={e =>
                          this.handleQuestion({ questionNumber }, e)
                        }
                      />
                    </label>
                    I don&apos;t know
                  </div>
                  <br />
                  {!this.state.obscureButton && (
                    <Button onClick={this.closeModal} type="submit">
                      Submit
                    </Button>
                  )}
                </div>
              </Modal.Description>
            </Modal.Content>
          </div>
        </Modal>

        <Modal
          open={this.state.finalModalIsOpen}
          className={styles.modal}
          closeOnEscape={false}
          closeOnDimmerClick={false}
        >
          <div className={styles.finalInner}>
            <Modal.Header />
            <Modal.Content className={styles.content}>
              <Modal.Description>
                <h4>
                  Please click on the following link to take a survey, then
                  click to continue:
                </h4>

                {currentVideo === biomassVideo && (
                  <h5>
                    <a
                      className={styles.surveyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      href="https://docs.google.com/forms/d/1CGDZeZKCKTXQ4fstQ8ahbDp1gvvsPBC74_GZUchNClM/"
                    >
                      https://docs.google.com/forms/d/1CGDZeZKCKTXQ4fstQ8ahbDp1gvvsPBC74_GZUchNClM/
                    </a>
                  </h5>
                )}

                {currentVideo === fuelVideo && (
                  <h5>
                    <a
                      className={styles.surveyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      href="https://docs.google.com/forms/d/1KG2Dby7SubhQTlKByzwNjsGPgcbEoD8L_dRajKIrJ_o/"
                    >
                      https://docs.google.com/forms/d/1KG2Dby7SubhQTlKByzwNjsGPgcbEoD8L_dRajKIrJ_o/
                    </a>
                  </h5>
                )}

                {currentVideo === gasVideo && (
                  <h5>
                    <a
                      className={styles.surveyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      href="https://docs.google.com/forms/d/1TCT2shE1hY24WkNQs9eEhmkS7lBRPg9Z-gt0I6UUU2U/"
                    >
                      https://docs.google.com/forms/d/1TCT2shE1hY24WkNQs9eEhmkS7lBRPg9Z-gt0I6UUU2U/
                    </a>
                  </h5>
                )}

                {currentVideo === photosynthVideo && (
                  <h5>
                    <a
                      className={styles.surveyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      href="https://docs.google.com/forms/d/10fahrtOU9nHBVUqQB-WTSciiXveIOafEfxROktz11P4/"
                    >
                      https://docs.google.com/forms/d/10fahrtOU9nHBVUqQB-WTSciiXveIOafEfxROktz11P4/
                    </a>
                  </h5>
                )}

                <br />
                <br />
                <br />

                <Button onClick={this.closeFinalModal} type="submit">
                  Continue
                </Button>
              </Modal.Description>
            </Modal.Content>
          </div>
        </Modal>
      </div>
    );
  }
}
