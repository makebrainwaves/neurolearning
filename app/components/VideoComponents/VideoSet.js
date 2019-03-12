// @flow
/* eslint class-methods-use-this: ["error", { "exceptMethods": ["getQuestionSet", "getCsvFileName"] }] */
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Button, Modal } from 'semantic-ui-react';
import { CSVLink } from 'react-csv';
import { Subscription } from 'rxjs';
import { WriteStream } from 'fs';
import styles from './VideoSet.css';
import routes from '../../constants/routes.json';
import * as data from '../../questions/questions.json';

import {
  createBaselineObservable,
  createClassifierObservable,
  computeAlpha,
  computeThetaBeta
} from '../../utils/eeg';

/*
import {
  createRawEEGWriteStream,
  writeEEGData,
  writeHeader
} from '../../utils/write';
*/

import {
  getQuestionSet,
  getRandomQuestionSet,
  getRandomControlQuestionSet,
  getControlQuestionstAfterExp
} from '../../utils/questionSets';

interface State {
  subjectId: string;
  firstVideo: string;
  firstVideoName: string;
  firstVideoType: string;
  secondVideo: string;
  secondVideoName: string;
  secondVideoType: string;
  thirdVideo: string;
  thirdVideoName: string;
  thirdVideoType: string;
  fourthVideo: string;
  fourthVideoName: string;
  fourthVideoType: string;
  isRunning: boolean;
  question1AlreadyShown: boolean;
  question2AlreadyShown: boolean;
  questionNumber: string;
  questionText: string;
  firstOption: string;
  secondOption: string;
  thirdOption: string;
  answerClicked: boolean;
  engagementClicked: boolean;
  allFourControlVideos: boolean;
  firstExpQuestionSetLength: number;
  secondExpQuestionSetLength: number;
  thirdExpQuestionSetLength: number;
  classifierCsv: Array<any>;
  addedToCsv: boolean;
  decision: boolean;
  score: number;
  electrodesChosen: string[];
  rawEEGWriteStream: WriteStream | null;
}

const rollBackTime = 5;
const biomassQ = require('../../questions/BiomassQuestions.js');
const fuelQ = require('../../questions/FuelQuestions.js');
const gasQ = require('../../questions/CombustionQuestions.js');
const photosynthQ = require('../../questions/PhotosynthQuestions.js');
const answersArray = require('../../constants/Answers.js');
const updatedAnswersArray = require('../../constants/UpdatedAnswers.js');

const soundFileLoc = require('../beep-ping.flac');

const biomassVideo =
  'http://localhost:1212/dist/bab08a1b5e70073aa05bda2923a835f2.mp4';
const fuelVideo =
  'http://localhost:1212/dist/bcc000d9e3048f485822cc246c74a0e5.mp4';
const gasVideo =
  'http://localhost:1212/dist/8eaa1fc371098f3407941ac9ef7b99b2.mp4';
const photosynthVideo =
  'http://localhost:1212/dist/adf2b55277c0e5538ff5ba60a1f4a756.mp4';

const time = new Date().getTime();
const date = new Date(time).toString();

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
      biomassVidStartTimeTOD: 0,
      fuelSequenceNumber: 2,
      fuelVidStartTimeTOD: 0,
      gasSequenceNumber: 3,
      gasVidStartTimeTOD: 0,
      photosynthSequenceNumber: 4,
      photosynthVidStartTimeTOD: 0,
      questionNumber: '',
      questionText: '',
      firstOption: '',
      secondOption: '',
      thirdOption: '',
      answers: answersArray,
      updatedAnswers: updatedAnswersArray,
      askQuestion: false,
      answerClicked: false,
      engagementClicked: false,
      allFourControlVideos: false,
      firstExpQuestionSetLength: 0,
      secondExpQuestionSetLength: 0,
      thirdExpQuestionSetLength: 0,
      classifierCsv: [],
      addedToCsv: false,
      decision: false,
      score: 0,
      rawEEGWriteStream: null
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
    // for ping sound:
    this.soundFile = soundFileLoc;
    this.audio = new Audio(this.soundFile);
    this.togglePlay = this.togglePlay.bind(this);
  }

  componentWillMount() {
    this.setState({
      currentVideo: this.props.location.state.firstVideo,
      videoName: this.props.location.state.firstVideoName,
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
        questionSetTemp = getRandomControlQuestionSet(this.state.currentVideo);
        this.setState({ allFourControlVideos: true });
      } else {
        questionSetTemp = getRandomQuestionSet(this.state.currentVideo);
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
    this.playVideo();
  }

  handleStartEEG() {
    const { classifierType, rawEEGObservable } = this.props.location.state;
    const classifierPipe =
      classifierType === 'alpha' ? computeAlpha : computeThetaBeta;

    const workspaceDir = this.props.location.state.subjectId;

    /*
    const rawEEGWriteStream = createRawEEGWriteStream(
      workspaceDir,
      this.getVideoName(this.state.currentVideo)
    );

    if (rawEEGWriteStream) {
      writeHeader(
        rawEEGWriteStream,
        this.props.location.state.electrodesChosen
      );
      rawEEGObservable.subscribe(
        rawData => writeEEGData(rawEEGWriteStream, rawData),
        // These callbacks should force the write stream to close when the raw eeg stream is either completed or errors out
        complete => rawEEGWriteStream.close(),
        error => rawEEGWriteStream.close()
      );

      this.setState({ rawEEGWriteStream });
      
    }
    */

    // create baseline observable
    const baselineObs = createBaselineObservable(rawEEGObservable, {
      featurePipe: classifierPipe
    });

    baselineObs.subscribe(threshold => {
      console.log('Baseline observable completed with result: ', threshold);
      const classifierObservable = createClassifierObservable(
        rawEEGObservable,
        threshold,
        { featurePipe: classifierPipe }
      );
      classifierObservable.subscribe(decision => {
        console.log('classifier emitted decicsion', decision);
        this.setState({
          powerEstimate: decision.averagedPowerEstimate,
          decision: decision.decision,
          goodEpochs: decision.goodEpochs
        });
      });
    });
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

  closeModal = () => {
    const { questionNumber } = this.state;
    const answers = this.state.answers;
    const closeTime = Date.now();
    const qNumberForSubmit = `q${questionNumber}`;

    answers.forEach(answer => {
      answer[this.state.videoName][qNumberForSubmit].submitTimeTOD = closeTime;
    });

    this.setState({ answers });

    this.setState({
      modalIsOpen: false,
      answerClicked: false,
      engagementClicked: false
    });

    this.playVideo();
  };

  closeFinalModal = () => {
    if (this.state.currentVideo !== this.props.location.state.fourthVideo) {
      this.moveAlongVideoSequence();
      this.playVideo();
    }

    this.setState({ finalModalIsOpen: false });
  };

  playVideo = () => {
    if (!this.state.isEEGRecording) {
      this.handleStartEEG();
    }
    this.openFullscreen();

    const videoRef = this.getVideoRef;

    // Show loading animation.
    const playPromise = videoRef.play();

    if (playPromise !== undefined) {
      playPromise
        .then(
          // Automatic playback started!
          // Show playing UI.
          videoRef.play(),
          this.setVideoStartTime()
        )
        .catch(error => {
          // Auto-play was prevented
          // Show paused UI.
          // console.log('vid err');
          videoRef.play();
          this.setVideoStartTime();
        });
    }

    this.setState({ isRunning: true });
  };

  setVideoStartTime = () => {
    // add start time to answers csv
    const startTime = Date.now();
    const currentVideoName = this.getVideoName(this.state.currentVideo);

    if (
      currentVideoName === 'biomass' &&
      this.state.biomassVidStartTimeTOD === 0
    ) {
      this.setState({ biomassVidStartTimeTOD: startTime });
    } else if (
      currentVideoName === 'fuel' &&
      this.state.fuelVidStartTimeTOD === 0
    ) {
      this.setState({ fuelVidStartTimeTOD: startTime });
    } else if (
      currentVideoName === 'gas' &&
      this.state.gasVidStartTimeTOD === 0
    ) {
      this.setState({ gasVidStartTimeTOD: startTime });
    } else if (
      currentVideoName === 'photosynth' &&
      this.state.photosynthVidStartTimeTOD === 0
    ) {
      this.setState({ photosynthVidStartTimeTOD: startTime });
    }
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
    const time = Date.now();
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

  togglePlay() {
    this.audio.play();
  }

  nextQuestion = (key, vidCurrTime) => {
    const videoQuestions = this.state.questionSet;

    for (let i = 0; i < videoQuestions.length; i++) {
      if (videoQuestions[i].key === key) {
        this.togglePlay();
        this.pauseVideo();
        this.setState({
          questionNumber: videoQuestions[i].key,
          questionText: videoQuestions[i].value.question,
          firstOption: videoQuestions[i].value.option1,
          secondOption: videoQuestions[i].value.option2,
          thirdOption: videoQuestions[i].value.option3,
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
      powerEstimate,
      decision,
      goodEpochs
    } = this.state;

    const vidCurrTime = document.getElementById('vidID').currentTime;
    const videoType = this.getExperimentType();

    if (videoType === 'experimental') {
      console.log('second vidCurrTime', vidCurrTime);
      console.log('second powerEstimate', powerEstimate);
      console.log('second decision', decision);
      console.log('second goodEpochs', goodEpochs);
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
    if (this.state.rawEEGWriteStream) {
      this.state.rawEEGWriteStream.close();
    }
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
          questionSetTemp = getRandomControlQuestionSet(
            this.props.location.state.secondVideo
          );
        } else if (
          this.props.location.state.firstVideoType === 'experimental'
        ) {
          questionSetTemp = getControlQuestionstAfterExp(
            this.props.location.state.secondVideo,
            this.state.firstExpQuestionSetLength
          );
        } else {
          questionSetTemp = getRandomQuestionSet(
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
          questionSetTemp = getRandomControlQuestionSet(
            this.props.location.state.thirdVideo
          );
        } else if (
          this.props.location.state.secondVideoType === 'experimental'
        ) {
          questionSetTemp = getControlQuestionstAfterExp(
            this.props.location.state.thirdVideo,
            this.state.secondExpQuestionSetLength
          );
        } else if (
          this.props.location.state.firstVideoType === 'experimental'
        ) {
          questionSetTemp = getControlQuestionstAfterExp(
            this.props.location.state.thirdVideo,
            this.state.firstExpQuestionSetLength
          );
        } else {
          questionSetTemp = getRandomQuestionSet(
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
          questionSetTemp = getRandomControlQuestionSet(
            this.props.location.state.fourthVideo
          );
        } else if (
          this.props.location.state.thirdVideoType === 'experimental'
        ) {
          questionSetTemp = getControlQuestionstAfterExp(
            this.props.location.state.fourthVideo,
            this.state.thirdExpQuestionSetLength
          );
        } else if (
          this.props.location.state.secondVideoType === 'experimental'
        ) {
          questionSetTemp = getControlQuestionstAfterExp(
            this.props.location.state.fourthVideo,
            this.state.secondExpQuestionSetLength
          );
        } else if (
          this.props.location.state.firstVideoType === 'experimental'
        ) {
          questionSetTemp = getControlQuestionstAfterExp(
            this.props.location.state.fourthVideo,
            this.state.firstExpQuestionSetLength
          );
        } else {
          questionSetTemp = getRandomQuestionSet(
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

  handleEngagement(q, e) {
    this.setState({ engagementClicked: true });

    const answers = this.state.answers;
    const qNumberForEngagement = `q${q.questionNumber}`;

    answers.forEach(answer => {
      answer[this.state.videoName][qNumberForEngagement].engagement =
        e.target.value;
    });

    this.setState({ answers });
  }

  handleQuestion(q, e) {
    this.setState({ answerClicked: true });

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

    console.log('AnswerSet', this.state.answers);
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
    const newAnswers = this.state.updatedAnswers;
    const answersTemp = this.state.answers;

    for (const key of Object.keys(newAnswers)) {
      const questVal = parseInt(key, 10);
      if (key >= 0 && key < 21) {
        const questionNum = `q${questVal + 1}`;
        newAnswers[key].Subject = this.props.location.state.subjectId;
        newAnswers[key].VideoName = 'biomass';
        newAnswers[key].VidStartTimeTOD = this.state.biomassVidStartTimeTOD;
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
        newAnswers[key].VidStartTimeTOD = this.state.fuelVidStartTimeTOD;
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
      if (key >= 44 && key < 70) {
        const questionNum = `q${questVal - 43}`;
        newAnswers[key].Subject = this.props.location.state.subjectId;
        newAnswers[key].VideoName = 'gas';
        newAnswers[key].VidStartTimeTOD = this.state.gasVidStartTimeTOD;
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
      if (key >= 70 && key < 97) {
        const questionNum = `q${questVal - 69}`;
        newAnswers[key].Subject = this.props.location.state.subjectId;
        newAnswers[key].VideoName = 'photosynth';
        newAnswers[key].VidStartTimeTOD = this.state.photosynthVidStartTimeTOD;
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
    const time = Date.now();

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

  getCsvFileName(fileType, subjectId) {
    const csvFileName = `${fileType}_${subjectId}`;
    return csvFileName;
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
      firstOption,
      secondOption,
      thirdOption,
      currentVideo,
      videoName,
      biomassSequenceNumber,
      biomassVidStartTimeTOD,
      fuelSequenceNumber,
      fuelVidStartTimeTOD,
      gasSequenceNumber,
      gasVidStartTimeTOD,
      photosynthSequenceNumber,
      photosynthVidStartTimeTOD,
      updatedAnswers,
      decision,
      score
    } = this.state;
    const { location } = this.props;
    const { state } = location;
    const {
      subjectId,
      experimenterId,
      firstVideo,
      firstVideoName,
      firstVideoType,
      secondVideo,
      secondVideoName,
      secondVideoType,
      thirdVideo,
      thirdVideoName,
      thirdVideoType,
      fourthVideo,
      fourthVideoName,
      fourthVideoType,
      classifierType,
      electrodesChosen
    } = state;

    const answersCsv = this.getAnswerSet();
    const classifierCsv = this.getClassifierCsv();

    const electrodes = electrodesChosen;

    const subjectCsvData = [
      {
        DayTime: date,
        SubjectID: subjectId,
        ExperimenterID: experimenterId,
        SequenceNumber: '1',
        VideoName: firstVideoName,
        ExperimentType: firstVideoType,
        Classifier: classifierType,
        Electrodes: electrodes.toString()
      },
      {
        DayTime: date,
        SubjectID: subjectId,
        ExperimenterID: experimenterId,
        SequenceNumber: '2',
        VideoName: secondVideoName,
        ExperimentType: secondVideoType,
        Classifier: classifierType
      },
      {
        DayTime: date,
        SubjectID: subjectId,
        ExperimenterID: experimenterId,
        SequenceNumber: '3',
        VideoName: thirdVideoName,
        ExperimentType: thirdVideoType,
        Classifier: classifierType
      },
      {
        DayTime: date,
        SubjectID: subjectId,
        ExperimenterID: experimenterId,
        SequenceNumber: '4',
        VideoName: fourthVideoName,
        ExperimentType: fourthVideoType,
        Classifier: classifierType
      }
    ];

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
        </div>
        <Button secondary>
          <CSVLink
            data={subjectCsvData}
            filename={this.getCsvFileName(
              'subjectInfo',
              this.props.location.state.subjectId
            )}
          >
            Download Subject Info
          </CSVLink>
        </Button>
        <Button secondary>
          <CSVLink
            data={answersCsv}
            filename={this.getCsvFileName(
              'answers',
              this.props.location.state.subjectId
            )}
          >
            Download Subject Answers
          </CSVLink>
        </Button>
        <Button secondary>
          <CSVLink
            data={classifierCsv}
            filename={this.getCsvFileName(
              'classifier',
              this.props.location.state.subjectId
            )}
          >
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
                <div className={styles.qHeader}>
                  1. On a scale of 1 to 7, how engaged are you right now?
                </div>
                <div className={styles.qSubHeader}>
                  (1 = not engaged at all, 7 = very engaged)
                </div>
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
                        value="1"
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
                        value="2"
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
                        value="3"
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
                        value="4"
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
                        value="5"
                        onChange={e =>
                          this.handleEngagement({ questionNumber }, e)
                        }
                      />
                    </label>
                    6
                    <label
                      className={styles.engagementRadio}
                      htmlFor="something"
                    >
                      <input
                        name="engagement"
                        type="radio"
                        value="6"
                        onChange={e =>
                          this.handleEngagement({ questionNumber }, e)
                        }
                      />
                    </label>
                    7
                    <label
                      className={styles.engagementRadio}
                      htmlFor="something"
                    >
                      <input
                        name="engagement"
                        type="radio"
                        value="7"
                        onChange={e =>
                          this.handleEngagement({ questionNumber }, e)
                        }
                      />
                    </label>
                  </div>
                </div>
                <hr />
                <div className={styles.qHeader}>2. True or False?</div>
                <div className={styles.qHeader}>{this.state.questionText}</div>
                <div className={styles.qSubHeader}>
                  Please select an answer to continue:
                </div>
                <div className={styles.engagement}>
                  <div className="radio">
                    <label htmlFor={this.state.firstOption}>
                      <input
                        name="option"
                        type="radio"
                        value="option1"
                        onChange={e =>
                          this.handleQuestion({ questionNumber }, e)
                        }
                      />
                    </label>
                    True
                  </div>
                  <div className="radio">
                    <label htmlFor={this.state.secondOption}>
                      <input
                        name="option"
                        type="radio"
                        value="option2"
                        onChange={e =>
                          this.handleQuestion({ questionNumber }, e)
                        }
                      />
                    </label>
                    False
                  </div>
                  <div className="radio">
                    <label htmlFor={this.state.thirdOption}>
                      <input
                        name="option"
                        type="radio"
                        value="option3"
                        onChange={e =>
                          this.handleQuestion({ questionNumber }, e)
                        }
                      />
                    </label>
                    I don&apos;t know
                  </div>
                  <br />
                  {this.state.engagementClicked &&
                    this.state.answerClicked && (
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
                  Please click the following link to complete a short survey:
                </h4>

                {currentVideo === biomassVideo && (
                  <h5>
                    <a
                      className={styles.surveyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      href="https://docs.google.com/forms/d/1bimC_1hqYJMA_voXurEdG1JXhtCPb5c7mU-mfBtYu-g/"
                    >
                      https://docs.google.com/forms/d/1bimC_1hqYJMA_voXurEdG1JXhtCPb5c7mU-mfBtYu-g/
                    </a>
                  </h5>
                )}

                {currentVideo === fuelVideo && (
                  <h5>
                    <a
                      className={styles.surveyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      href="https://docs.google.com/forms/d/12cbA8iuHiOjloteTS3n2aNq4UMI6Udmq-Y54rn4g5oM/"
                    >
                      https://docs.google.com/forms/d/12cbA8iuHiOjloteTS3n2aNq4UMI6Udmq-Y54rn4g5oM/
                    </a>
                  </h5>
                )}

                {currentVideo === gasVideo && (
                  <h5>
                    <a
                      className={styles.surveyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      href="https://docs.google.com/forms/d/1ME6NjEnEZGxbobiGynzt6-9kTvPwiuwqPRczqSCpl4Y/"
                    >
                      https://docs.google.com/forms/d/1ME6NjEnEZGxbobiGynzt6-9kTvPwiuwqPRczqSCpl4Y/
                    </a>
                  </h5>
                )}

                {currentVideo === photosynthVideo && (
                  <h5>
                    <a
                      className={styles.surveyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      href="https://docs.google.com/forms/d/1DuZCT5JBNbUi9lRBJ-FxtUgYOqbwPvHmRRgHcMWnhLU/"
                    >
                      https://docs.google.com/forms/d/1DuZCT5JBNbUi9lRBJ-FxtUgYOqbwPvHmRRgHcMWnhLU/
                    </a>
                  </h5>
                )}

                <br />
                <br />
                <br />

                <h4>Once you submit your response, press Continue:</h4>

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
