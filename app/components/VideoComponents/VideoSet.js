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
  createAlphaClassifierObservable,
  createThetaBetaClassifierObservable
} from '../../utils/eeg';

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
  firstOption: string;
  secondOption: string;
  thirdOption: string;
  obscureButton: boolean;
}

interface Props {
  electrodesChosen: string;
}

const controlPauseTime = 4;
const rollBackTime = 2;

const firstRandomTimePeriod = Math.floor(Math.random() * 40) + 80;
const secondRandomTimePeriod = Math.floor(Math.random() * 60) + 120;
const thirdRandomTimePeriod = Math.floor(Math.random() * 60) + 180;
const fourthRandomTimePeriod = Math.floor(Math.random() * 60) + 240;
const fifthRandomTimePeriod = Math.floor(Math.random() * 60) + 300;
const sixthRandomTimePeriod = Math.floor(Math.random() * 60) + 360;
const seventhRandomTimePeriod = Math.floor(Math.random() * 60) + 420;

console.log('firstRandomTimePeriod', firstRandomTimePeriod);
console.log('secondRandomTimePeriod', secondRandomTimePeriod);
console.log('thirdRandomTimePeriod', thirdRandomTimePeriod);
console.log('fourthRandomTimePeriod', fourthRandomTimePeriod);
console.log('fifthRandomTimePeriod', fifthRandomTimePeriod);
console.log('sixthRandomTimePeriod', sixthRandomTimePeriod);

const nichesQ = require('../../questions/NichesQuestions.js');
const bipQ = require('../../questions/BipQuestions.js');
const lipidQ = require('../../questions/LipidQuestions.js');
const insulinQ = require('../../questions/InsulinQuestions.js');

const answersArray = require('../../constants/Answers.js');

const nichesVideo =
  'http://localhost:1212/dist/67182cb1e21cc5fd95d19a30c3c43001.mp4';
const lipidVideo =
  'http://localhost:1212/dist/2ab8ce87a09d1d6b7303006753ca0251.mp4';
const bipVideo =
  'http://localhost:1212/dist/0b30e12cf7d23e654b6d6c306bd13618.mp4';
const insulinVideo =
  'http://localhost:1212/dist/a6e5c47df7b77a974f47cce5b094f90c.mp4';

export default class VideoSet extends Component<Props, State> {
  props: Props;
  classifierEEGSubscription: ?Subscription;
  rawEEGSubscription: ?Subscription;

  constructor(props) {
    super(props);
    let classifierEEGObservable = null;
    /*
    console.log('check varrrr', this.props.location.state.firstVideo);
    console.log('your eeg observable', props.location.state.classifierType);
    console.log(
      'you rawEEGObservable state',
      props.location.state.rawEEGObservable
    );
    */
    if (props.location.state.classifierType === 'alpha') {
      classifierEEGObservable = createAlphaClassifierObservable(
        props.location.state.rawEEGObservable
      );
      console.log('your classifierEEGObservable: ', classifierEEGObservable);
    } else if (props.location.state.classifierType === 'thetaBeta') {
      classifierEEGObservable = createThetaBetaClassifierObservable(
        props.location.state.rawEEGObservable
      );
      console.log('your classifierEEGObservable: ', classifierEEGObservable);
    }

    console.log('tests', this.props.location.props.electrodesChosen);

    this.state = {
      isRunning: false,
      modalIsOpen: false,
      finalModalIsOpen: false,
      question1AlreadyShown: false,
      question2AlreadyShown: false,
      nichesFirstMinuteAnswered: false,
      nichesSecondMinuteAnswered: false,
      nichesThirdMinuteAnswered: false,
      nichesFourthMinuteAnswered: false,
      nichesFifthMinuteAnswered: false,
      nichesSixthMinuteAnswered: false,
      nichesSequenceNumber: 1,
      lipidSequenceNumber: 2,
      bipSequenceNumber: 3,
      insulinSequenceNumber: 4,
      questionNumber: '',
      questionText: '',
      firstOption: '',
      secondOption: '',
      thirdOption: '',
      answers: answersArray,
      classifierEEGObservable,
      classifierScore: 0,
      classifierThreshold: 1.1,
      obscureButton: true // TODO: set this based on baseline data collection
    };
    // These are just so that we can unsubscribe from the observables
    this.rawEEGSubscription = null;
    this.classifierEEGSubscription = null;
    // This binding is necessary to make `this` work in the callback
    this.playVideo = this.playVideo.bind(this);
    this.pauseVideo = this.pauseVideo.bind(this);
    this.handleQuestion = this.handleQuestion.bind(this);
    this.getSequenceNumber = this.getSequenceNumber.bind(this);
  }

  componentWillMount() {
    this.setState({
      currentVideo: this.props.location.state.firstVideo,
      questionSet: this.state.questionSet,
      videoName: this.getVideoName(this.props.location.state.firstVideo),
      nichesSequenceNumber: this.getSequenceNumber('niches'),
      lipidSequenceNumber: this.getSequenceNumber('lipid'),
      bipSequenceNumber: this.getSequenceNumber('bip'),
      insulinSequenceNumber: this.getSequenceNumber('insulin')
    });
  }

  componentDidMount() {
    // Might be able to subscribe to these guys in constructor, but I've always done it in componentDidMount
    if (this.props.location.state.firstVideoType === 'experimental') {
      this.classifierEEGSubscription = this.state.classifierEEGObservable.subscribe(
        classifierScore => {
          this.setState({ classifierScore });
          console.log('classifierScore', classifierScore);
        }
      );
    }
  }

  closeModal = () => {
    const { questionNumber } = this.state;
    const answers = this.state.answers;
    const time = new Date().getTime();
    const qNumber = `q${questionNumber}`;

    answers.forEach(answer => {
      answer[this.state.videoName][qNumber].submitTimeTOD = time;
    });

    this.setState({
      answers,
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
    const videoRef = this.getVideoRef;
    videoRef.play();
    this.setState({ isRunning: true });
  };

  pauseVideo = () => {
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

  nextQuestion = (key, vidCurrTime) => {
    console.log('key from next question', key);
    const videoQuestions = this.getQuestionSet(this.state.currentVideo);

    for (let i = 0; i < videoQuestions.length; i++) {
      if (videoQuestions[i].key === key) {
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
    if (currentVideo === nichesVideo) {
      videoNameTemp = 'niches';
    } else if (currentVideo === lipidVideo) {
      videoNameTemp = 'lipid';
    } else if (currentVideo === bipVideo) {
      videoNameTemp = 'bip';
    } else if (currentVideo === insulinVideo) {
      videoNameTemp = 'insulin';
    } else {
      videoNameTemp = '';
    }
    this.setState({
      videoName: videoNameTemp
    });

    return videoNameTemp;
  }

  getQuestionSet(video) {
    let questionSetTemp = [];
    if (video === nichesVideo) {
      questionSetTemp = nichesQ;
    } else if (video === lipidVideo) {
      questionSetTemp = lipidQ;
    } else if (video === bipVideo) {
      questionSetTemp = bipQ;
    } else if (video === insulinVideo) {
      questionSetTemp = insulinQ;
    } else {
      questionSetTemp = null;
    }
    this.setState({
      questionSet: questionSetTemp
    });

    return questionSetTemp;
  }

  onTimeUpdate = () => {
    const {
      question1AlreadyShown,
      question2AlreadyShown,
      isRunning,
      currentVideo,
      videoName
    } = this.state;

    const vidCurrTime = document.getElementById('vidID').currentTime;

    // Niches: 7:18 total time
    // Lipid: 6:21 total time
    // Bipedalism: 6:00 total time
    // Insulin: 6:29 total time

    // no questions for first 1 minute 20 seconds, 2 options
    // returns a random integer between 1 and 3:
    // Math.floor(Math.random() * 3) + 1;

    if (this.props.location.state.firstVideoType === 'experimental') {
      if (question1AlreadyShown) {
        if (this.state.classifierScore >= this.state.classifierThreshold) {
          this.setState({
            modalIsOpen: true,
            question1AlreadyShown: !question1AlreadyShown,
            questionNumber: data.q1.name,
            questionText: data.q1.question,
            firstOption: data.q1.option1,
            secondOption: data.q1.option2,
            thirdOption: data.q1.option3,
            fourthOption: data.q1.option4,
            fifthOption: data.q1.option5
          });
          this.pauseVideo();
        }
      }
    } else {
      // control:
      console.log('vidCurrTime', vidCurrTime);
      switch (true) {
        case videoName === 'niches' &&
          // question for 1:20-2minutes: Check to see that vidCurrTime has surpassed random time selected
          firstRandomTimePeriod <= vidCurrTime &&
          !this.state.nichesFirstMinuteAnswered:
          if (80 <= firstRandomTimePeriod && firstRandomTimePeriod < 100) {
            this.nextQuestion(1, vidCurrTime);
          } else if (
            100 <= firstRandomTimePeriod &&
            firstRandomTimePeriod < 120
          )
            this.nextQuestion(2, vidCurrTime);
          break;

        case videoName === 'niches' &&
          // question for 2-3minutes:
          secondRandomTimePeriod <= vidCurrTime &&
          !this.state.nichesSecondMinuteAnswered:
          if (120 <= secondRandomTimePeriod && secondRandomTimePeriod < 140) {
            this.nextQuestion(3, vidCurrTime);
          } else if (
            140 <= secondRandomTimePeriod &&
            secondRandomTimePeriod < 160
          ) {
            this.nextQuestion(4, vidCurrTime);
          } else if (
            160 <= secondRandomTimePeriod &&
            secondRandomTimePeriod < 180
          ) {
            this.nextQuestion(5, vidCurrTime);
          }
          break;

        case videoName === 'niches' &&
          // question for 3-4minutes:
          thirdRandomTimePeriod <= vidCurrTime &&
          !this.state.nichesThirdMinuteAnswered:
          if (180 <= thirdRandomTimePeriod && thirdRandomTimePeriod < 200) {
            this.nextQuestion(6, vidCurrTime);
          } else if (
            200 <= thirdRandomTimePeriod &&
            thirdRandomTimePeriod < 220
          ) {
            this.nextQuestion(7, vidCurrTime);
          } else if (
            220 <= thirdRandomTimePeriod &&
            thirdRandomTimePeriod < 240
          ) {
            this.nextQuestion(8, vidCurrTime);
          }
          break;

        case videoName === 'niches' &&
          // question for 4-5minutes:
          fourthRandomTimePeriod <= vidCurrTime &&
          !this.state.nichesFourthMinuteAnswered:
          if (240 <= fourthRandomTimePeriod && fourthRandomTimePeriod < 260) {
            this.nextQuestion(9, vidCurrTime);
          } else if (
            260 <= fourthRandomTimePeriod &&
            fourthRandomTimePeriod < 280
          ) {
            this.nextQuestion(10, vidCurrTime);
          } else if (
            280 <= fourthRandomTimePeriod &&
            fourthRandomTimePeriod < 300
          ) {
            this.nextQuestion(11, vidCurrTime);
          }
          break;

        case videoName === 'niches' &&
          // question for 5-6minutes:
          fifthRandomTimePeriod <= vidCurrTime &&
          !this.state.nichesFifthMinuteAnswered:
          if (300 <= fifthRandomTimePeriod && fifthRandomTimePeriod < 320) {
            this.nextQuestion(12, vidCurrTime);
          } else if (
            320 <= fifthRandomTimePeriod &&
            fifthRandomTimePeriod < 340
          ) {
            this.nextQuestion(13, vidCurrTime);
          } else if (
            340 <= fifthRandomTimePeriod &&
            fifthRandomTimePeriod < 360
          ) {
            this.nextQuestion(14, vidCurrTime);
          }
          break;

        case videoName === 'niches' &&
          // question for 6-7minutes:
          sixthRandomTimePeriod <= vidCurrTime &&
          !this.state.nichesSixthMinuteAnswered:
          if (360 <= sixthRandomTimePeriod && sixthRandomTimePeriod < 380) {
            this.nextQuestion(15, vidCurrTime);
          } else if (
            380 <= sixthRandomTimePeriod &&
            sixthRandomTimePeriod < 400
          ) {
            this.nextQuestion(16, vidCurrTime);
          } else if (
            400 <= sixthRandomTimePeriod &&
            sixthRandomTimePeriod < 420
          ) {
            this.nextQuestion(17, vidCurrTime);
          }
          break;

        case videoName === 'lipid' &&
          (4 <= vidCurrTime && vidCurrTime < 8) &&
          this.state.answers[0].lipid.q1.answer === '':
          this.nextQuestion(1, vidCurrTime);
          break;
        case videoName === 'lipid' &&
          (8 <= vidCurrTime && vidCurrTime < 10) &&
          this.state.answers[0].lipid.q2.answer === '':
          this.nextQuestion(2, vidCurrTime);
          break;
        case videoName === 'lipid' &&
          (10 <= vidCurrTime && vidCurrTime < 12) &&
          this.state.answers[0].lipid.q3.answer === '':
          this.nextQuestion(3, vidCurrTime);
          break;
        case videoName === 'lipid' &&
          (12 <= vidCurrTime && vidCurrTime < 14) &&
          this.state.answers[0].lipid.q4.answer === '':
          this.nextQuestion(4, vidCurrTime);
          break;

        case videoName === 'bip' &&
          (4 <= vidCurrTime && vidCurrTime < 8) &&
          this.state.answers[0].bip.q1.answer === '':
          this.nextQuestion(1, vidCurrTime);
          break;
        case videoName === 'bip' &&
          (8 <= vidCurrTime && vidCurrTime < 10) &&
          this.state.answers[0].bip.q2.answer === '':
          this.nextQuestion(2, vidCurrTime);
          break;
        case videoName === 'bip' &&
          (10 <= vidCurrTime && vidCurrTime < 12) &&
          this.state.answers[0].bip.q3.answer === '':
          this.nextQuestion(3, vidCurrTime);
          break;
        case videoName === 'bip' &&
          (12 <= vidCurrTime && vidCurrTime < 14) &&
          this.state.answers[0].bip.q4.answer === '':
          this.nextQuestion(4, vidCurrTime);
          break;

        case videoName === 'insulin' &&
          (4 <= vidCurrTime && vidCurrTime < 8) &&
          this.state.answers[0].insulin.q1.answer === '':
          this.nextQuestion(1, vidCurrTime);
          break;
        case videoName === 'insulin' &&
          (8 <= vidCurrTime && vidCurrTime < 10) &&
          this.state.answers[0].insulin.q2.answer === '':
          this.nextQuestion(2, vidCurrTime);
          break;
        case videoName === 'insulin' &&
          (10 <= vidCurrTime && vidCurrTime < 12) &&
          this.state.answers[0].insulin.q3.answer === '':
          this.nextQuestion(3, vidCurrTime);
          break;
        case videoName === 'insulin' &&
          (12 <= vidCurrTime && vidCurrTime < 14) &&
          this.state.answers[0].insulin.q4.answer === '':
          this.nextQuestion(4, vidCurrTime);
          break;
        default:
          break;
      }
    }
  };

  moveAlongVideoSequence() {
    if (this.state.currentVideo === this.props.location.state.firstVideo) {
      this.setState({
        currentVideo: this.props.location.state.secondVideo,
        questionSet: this.getQuestionSet(this.props.location.state.secondVideo),
        videoName: this.getVideoName(this.props.location.state.secondVideo)
      });
    } else if (
      this.state.currentVideo === this.props.location.state.secondVideo
    ) {
      this.setState({
        currentVideo: this.props.location.state.thirdVideo,
        questionSet: this.getQuestionSet(this.props.location.state.thirdVideo),
        videoName: this.getVideoName(this.props.location.state.thirdVideo)
      });
    } else if (
      this.state.currentVideo === this.props.location.state.thirdVideo
    ) {
      this.setState({
        currentVideo: this.props.location.state.fourthVideo,
        questionSet: this.getQuestionSet(this.props.location.state.fourthVideo),
        videoName: this.getVideoName(this.props.location.state.fourthVideo)
      });
    }
  }

  endOfVideo = () => {
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

  handleQuestion(q, e) {
    this.setState({ obscureButton: false });
    const answers = this.state.answers;
    const testValue = 'niches';
    const questionNumber = `q${q.questionNumber}`;

    answers.forEach(answer => {
      answer[this.state.videoName].value = this.state.videoName;
      answer[this.state.videoName][questionNumber].experimentType = 'control';
      answer[this.state.videoName][questionNumber].value = q.questionNumber;
      answer[this.state.videoName][questionNumber].answer = e.target.value;

      const variable = `${this.state.videoName}FirstMinuteAnswered`;
      console.log('variable', variable);
      console.log('this.state[variable]', this.state[variable]);

      if (this.state.videoName === 'niches') {
        if (q.questionNumber === 1 || q.questionNumber === 2) {
          this.setState({ nichesFirstMinuteAnswered: true });
        }
        if (
          q.questionNumber === 3 ||
          q.questionNumber === 4 ||
          q.questionNumber === 5
        ) {
          this.setState({ nichesSecondMinuteAnswered: true });
        }
        if (
          q.questionNumber === 6 ||
          q.questionNumber === 7 ||
          q.questionNumber === 8
        ) {
          this.setState({ nichesThirdMinuteAnswered: true });
        }
        if (
          q.questionNumber === 9 ||
          q.questionNumber === 10 ||
          q.questionNumber === 11
        ) {
          this.setState({ nichesFourthMinuteAnswered: true });
        }
        if (
          q.questionNumber === 12 ||
          q.questionNumber === 13 ||
          q.questionNumber === 14
        ) {
          this.setState({ nichesFifthMinuteAnswered: true });
        }
        if (
          q.questionNumber === 15 ||
          q.questionNumber === 16 ||
          q.questionNumber === 17
        ) {
          this.setState({ nichesSixthMinuteAnswered: true });
        }
      }

      if (this.state.videoName === 'lipid') {
        answer.lipid.value = this.state.videoName;
        if (q.questionNumber === 1) {
          answer.lipid.q1.experimentType = 'control';
          answer.lipid.q1.value = q.questionNumber;
          answer.lipid.q1.answer = e.target.value;
        }
        if (q.questionNumber === 2) {
          answer.lipid.q2.experimentType = 'control';
          answer.lipid.q2.value = q.questionNumber;
          answer.lipid.q2.answer = e.target.value;
        }
        if (q.questionNumber === 3) {
          answer.lipid.q3.experimentType = 'control';
          answer.lipid.q3.value = q.questionNumber;
          answer.lipid.q3.answer = e.target.value;
        }
        if (q.questionNumber === 4) {
          answer.lipid.q4.experimentType = 'control';
          answer.lipid.q4.value = q.questionNumber;
          answer.lipid.q4.answer = e.target.value;
        }
      }

      if (this.state.videoName === 'bip') {
        answer.bip.value = this.state.videoName;
        if (q.questionNumber === 1) {
          answer.bip.q1.experimentType = 'control';
          answer.bip.q1.value = q.questionNumber;
          answer.bip.q1.answer = e.target.value;
        }
        if (q.questionNumber === 2) {
          answer.bip.q2.experimentType = 'control';
          answer.bip.q2.value = q.questionNumber;
          answer.bip.q2.answer = e.target.value;
        }
        if (q.questionNumber === 3) {
          answer.bip.q3.experimentType = 'control';
          answer.bip.q3.value = q.questionNumber;
          answer.bip.q3.answer = e.target.value;
        }
        if (q.questionNumber === 4) {
          answer.bip.q4.experimentType = 'control';
          answer.bip.q4.value = q.questionNumber;
          answer.bip.q4.answer = e.target.value;
        }
      }

      if (this.state.videoName === 'insulin') {
        answer.insulin.value = this.state.videoName;
        if (q.questionNumber === 1) {
          answer.insulin.q1.experimentType = 'control';
          answer.insulin.q1.value = q.questionNumber;
          answer.insulin.q1.answer = e.target.value;
        }
        if (q.questionNumber === 2) {
          answer.insulin.q2.experimentType = 'control';
          answer.insulin.q2.value = q.questionNumber;
          answer.insulin.q2.answer = e.target.value;
        }
        if (q.questionNumber === 3) {
          answer.insulin.q3.experimentType = 'control';
          answer.insulin.q3.value = q.questionNumber;
          answer.insulin.q3.answer = e.target.value;
        }
        if (q.questionNumber === 4) {
          answer.insulin.q4.experimentType = 'control';
          answer.insulin.q4.value = q.questionNumber;
          answer.insulin.q4.answer = e.target.value;
        }
      }
    });

    this.setState({ answers });
  }

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
      fourthOption,
      fifthOption,
      currentVideo,
      videoName,
      nichesSequenceNumber,
      lipidSequenceNumber,
      bipSequenceNumber,
      insulinSequenceNumber
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

    const answersCsv = [
      {
        Subject: subjectId,
        VideoName: answers[0].niches.value,
        ExperimentType: answers[0].niches.q1.experimentType,
        SequenceNo: nichesSequenceNumber,
        ModalPopupTOD: answers[0].niches.q1.modalPopupTOD,
        ModalPopupTOV: answers[0].niches.q1.modalPopupTOV,
        SubmitTimeTOD: answers[0].niches.q1.submitTimeTOD,
        QuestionNo: answers[0].niches.q1.value,
        Engagement: answers[0].niches.q1.engagement,
        Answer: answers[0].niches.q1.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].niches.value,
        ExperimentType: answers[0].niches.q2.experimentType,
        SequenceNo: nichesSequenceNumber,
        ModalPopupTOD: answers[0].niches.q2.modalPopupTOD,
        ModalPopupTOV: answers[0].niches.q2.modalPopupTOV,
        SubmitTimeTOD: answers[0].niches.q2.submitTimeTOD,
        QuestionNo: answers[0].niches.q2.value,
        Engagement: answers[0].niches.q2.engagement,
        Answer: answers[0].niches.q2.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].niches.value,
        ExperimentType: answers[0].niches.q1.experimentType,
        SequenceNo: nichesSequenceNumber,
        ModalPopupTOD: answers[0].niches.q3.modalPopupTOD,
        ModalPopupTOV: answers[0].niches.q3.modalPopupTOV,
        SubmitTimeTOD: answers[0].niches.q3.submitTimeTOD,
        QuestionNo: answers[0].niches.q3.value,
        Engagement: answers[0].niches.q3.engagement,
        Answer: answers[0].niches.q3.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].niches.value,
        ExperimentType: answers[0].niches.q1.experimentType,
        SequenceNo: nichesSequenceNumber,
        ModalPopupTOD: answers[0].niches.q4.modalPopupTOD,
        ModalPopupTOV: answers[0].niches.q4.modalPopupTOV,
        SubmitTimeTOD: answers[0].niches.q4.submitTimeTOD,
        QuestionNo: answers[0].niches.q4.value,
        Engagement: answers[0].niches.q4.engagement,
        Answer: answers[0].niches.q4.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].niches.value,
        ExperimentType: answers[0].niches.q1.experimentType,
        SequenceNo: nichesSequenceNumber,
        ModalPopupTOD: answers[0].niches.q5.modalPopupTOD,
        ModalPopupTOV: answers[0].niches.q5.modalPopupTOV,
        SubmitTimeTOD: answers[0].niches.q5.submitTimeTOD,
        QuestionNo: answers[0].niches.q5.value,
        Engagement: answers[0].niches.q5.engagement,
        Answer: answers[0].niches.q5.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].niches.value,
        ExperimentType: answers[0].niches.q1.experimentType,
        SequenceNo: nichesSequenceNumber,
        ModalPopupTOD: answers[0].niches.q6.modalPopupTOD,
        ModalPopupTOV: answers[0].niches.q6.modalPopupTOV,
        SubmitTimeTOD: answers[0].niches.q6.submitTimeTOD,
        QuestionNo: answers[0].niches.q6.value,
        Engagement: answers[0].niches.q6.engagement,
        Answer: answers[0].niches.q6.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].niches.value,
        ExperimentType: answers[0].niches.q1.experimentType,
        SequenceNo: nichesSequenceNumber,
        ModalPopupTOD: answers[0].niches.q7.modalPopupTOD,
        ModalPopupTOV: answers[0].niches.q7.modalPopupTOV,
        SubmitTimeTOD: answers[0].niches.q7.submitTimeTOD,
        QuestionNo: answers[0].niches.q7.value,
        Engagement: answers[0].niches.q7.engagement,
        Answer: answers[0].niches.q7.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].niches.value,
        ExperimentType: answers[0].niches.q1.experimentType,
        SequenceNo: nichesSequenceNumber,
        ModalPopupTOD: answers[0].niches.q8.modalPopupTOD,
        ModalPopupTOV: answers[0].niches.q8.modalPopupTOV,
        SubmitTimeTOD: answers[0].niches.q8.submitTimeTOD,
        QuestionNo: answers[0].niches.q8.value,
        Engagement: answers[0].niches.q8.engagement,
        Answer: answers[0].niches.q8.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].niches.value,
        ExperimentType: answers[0].niches.q1.experimentType,
        SequenceNo: nichesSequenceNumber,
        ModalPopupTOD: answers[0].niches.q9.modalPopupTOD,
        ModalPopupTOV: answers[0].niches.q9.modalPopupTOV,
        SubmitTimeTOD: answers[0].niches.q9.submitTimeTOD,
        QuestionNo: answers[0].niches.q9.value,
        Engagement: answers[0].niches.q9.engagement,
        Answer: answers[0].niches.q9.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].niches.value,
        ExperimentType: answers[0].niches.q1.experimentType,
        SequenceNo: nichesSequenceNumber,
        ModalPopupTOD: answers[0].niches.q10.modalPopupTOD,
        ModalPopupTOV: answers[0].niches.q10.modalPopupTOV,
        SubmitTimeTOD: answers[0].niches.q10.submitTimeTOD,
        QuestionNo: answers[0].niches.q10.value,
        Engagement: answers[0].niches.q10.engagement,
        Answer: answers[0].niches.q10.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].lipid.value,
        ExperimentType: answers[0].lipid.q1.experimentType,
        SequenceNo: lipidSequenceNumber,
        ModalPopupTOD: answers[0].lipid.q1.modalPopupTOD,
        ModalPopupTOV: answers[0].lipid.q1.modalPopupTOV,
        SubmitTimeTOD: answers[0].lipid.q1.submitTimeTOD,
        QuestionNo: answers[0].lipid.q1.value,
        Engagement: answers[0].lipid.q1.engagement,
        Answer: answers[0].lipid.q1.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].lipid.value,
        ExperimentType: answers[0].lipid.q2.experimentType,
        SequenceNo: lipidSequenceNumber,
        ModalPopupTOD: answers[0].lipid.q2.modalPopupTOD,
        ModalPopupTOV: answers[0].lipid.q2.modalPopupTOV,
        SubmitTimeTOD: answers[0].lipid.q2.submitTimeTOD,
        QuestionNo: answers[0].lipid.q2.value,
        Engagement: answers[0].lipid.q2.engagement,
        Answer: answers[0].lipid.q2.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].lipid.value,
        ExperimentType: answers[0].lipid.q1.experimentType,
        SequenceNo: lipidSequenceNumber,
        ModalPopupTOD: answers[0].lipid.q3.modalPopupTOD,
        ModalPopupTOV: answers[0].lipid.q3.modalPopupTOV,
        SubmitTimeTOD: answers[0].lipid.q3.submitTimeTOD,
        QuestionNo: answers[0].lipid.q3.value,
        Engagement: answers[0].lipid.q3.engagement,
        Answer: answers[0].lipid.q3.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].lipid.value,
        ExperimentType: answers[0].lipid.q1.experimentType,
        SequenceNo: lipidSequenceNumber,
        ModalPopupTOD: answers[0].lipid.q4.modalPopupTOD,
        ModalPopupTOV: answers[0].lipid.q4.modalPopupTOV,
        SubmitTimeTOD: answers[0].lipid.q4.submitTimeTOD,
        QuestionNo: answers[0].lipid.q4.value,
        Engagement: answers[0].lipid.q4.engagement,
        Answer: answers[0].lipid.q4.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].bip.value,
        ExperimentType: answers[0].bip.q1.experimentType,
        SequenceNo: bipSequenceNumber,
        ModalPopupTOD: answers[0].bip.q1.modalPopupTOD,
        ModalPopupTOV: answers[0].bip.q1.modalPopupTOV,
        SubmitTimeTOD: answers[0].bip.q1.submitTimeTOD,
        QuestionNo: answers[0].bip.q1.value,
        Engagement: answers[0].bip.q1.engagement,
        Answer: answers[0].bip.q1.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].bip.value,
        ExperimentType: answers[0].bip.q2.experimentType,
        SequenceNo: bipSequenceNumber,
        ModalPopupTOD: answers[0].bip.q2.modalPopupTOD,
        ModalPopupTOV: answers[0].bip.q2.modalPopupTOV,
        SubmitTimeTOD: answers[0].bip.q2.submitTimeTOD,
        QuestionNo: answers[0].bip.q2.value,
        Engagement: answers[0].bip.q2.engagement,
        Answer: answers[0].bip.q2.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].bip.value,
        ExperimentType: answers[0].bip.q1.experimentType,
        SequenceNo: bipSequenceNumber,
        ModalPopupTOD: answers[0].bip.q3.modalPopupTOD,
        ModalPopupTOV: answers[0].bip.q3.modalPopupTOV,
        SubmitTimeTOD: answers[0].bip.q3.submitTimeTOD,
        QuestionNo: answers[0].bip.q3.value,
        Engagement: answers[0].bip.q3.engagement,
        Answer: answers[0].bip.q3.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].bip.value,
        ExperimentType: answers[0].bip.q1.experimentType,
        SequenceNo: bipSequenceNumber,
        ModalPopupTOD: answers[0].bip.q4.modalPopupTOD,
        ModalPopupTOV: answers[0].bip.q4.modalPopupTOV,
        SubmitTimeTOD: answers[0].bip.q4.submitTimeTOD,
        QuestionNo: answers[0].bip.q4.value,
        Engagement: answers[0].bip.q4.engagement,
        Answer: answers[0].bip.q4.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].insulin.value,
        ExperimentType: answers[0].insulin.q1.experimentType,
        SequenceNo: insulinSequenceNumber,
        ModalPopupTOD: answers[0].insulin.q1.modalPopupTOD,
        ModalPopupTOV: answers[0].insulin.q1.modalPopupTOV,
        SubmitTimeTOD: answers[0].insulin.q1.submitTimeTOD,
        QuestionNo: answers[0].insulin.q1.value,
        Engagement: answers[0].insulin.q1.engagement,
        Answer: answers[0].insulin.q1.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].insulin.value,
        ExperimentType: answers[0].insulin.q2.experimentType,
        SequenceNo: insulinSequenceNumber,
        ModalPopupTOD: answers[0].insulin.q2.modalPopupTOD,
        ModalPopupTOV: answers[0].insulin.q2.modalPopupTOV,
        SubmitTimeTOD: answers[0].insulin.q2.submitTimeTOD,
        QuestionNo: answers[0].insulin.q2.value,
        Engagement: answers[0].insulin.q2.engagement,
        Answer: answers[0].insulin.q2.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].insulin.value,
        ExperimentType: answers[0].insulin.q1.experimentType,
        SequenceNo: insulinSequenceNumber,
        ModalPopupTOD: answers[0].insulin.q3.modalPopupTOD,
        ModalPopupTOV: answers[0].insulin.q3.modalPopupTOV,
        SubmitTimeTOD: answers[0].insulin.q3.submitTimeTOD,
        QuestionNo: answers[0].insulin.q3.value,
        Engagement: answers[0].insulin.q3.engagement,
        Answer: answers[0].insulin.q3.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].insulin.value,
        ExperimentType: answers[0].insulin.q1.experimentType,
        SequenceNo: insulinSequenceNumber,
        ModalPopupTOD: answers[0].insulin.q4.modalPopupTOD,
        ModalPopupTOV: answers[0].insulin.q4.modalPopupTOV,
        SubmitTimeTOD: answers[0].insulin.q4.submitTimeTOD,
        QuestionNo: answers[0].insulin.q4.value,
        Engagement: answers[0].insulin.q4.engagement,
        Answer: answers[0].insulin.q4.answer
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
            width="85%"
            height="65%"
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
                      1
                    </label>
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
                      2
                    </label>
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
                      3
                    </label>
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
                      4
                    </label>
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
                      5
                    </label>
                  </div>
                </div>
                <hr />
                <h4 className={styles.questions}>
                  2.
                  {this.state.questionText}
                </h4>
                <h5>Please select an answer to continue</h5>
                <div>
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
                      {this.state.firstOption}
                    </label>
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
                      {this.state.secondOption}
                    </label>
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
                      {this.state.thirdOption}
                    </label>
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

                {currentVideo === nichesVideo && (
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

                {currentVideo === lipidVideo && (
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

                {currentVideo === bipVideo && (
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

                {currentVideo === insulinVideo && (
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
