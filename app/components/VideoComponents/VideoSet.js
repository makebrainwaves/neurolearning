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

const questionsArray = require('../../questions/questionsArray');
const nichesQ = require('../../questions/NichesQuestions.js');
const bipQ = require('../../questions/BipQuestions.js');
const lipidQ = require('../../questions/LipidQuestions.js');
const insulinQ = require('../../questions/InsulinQuestions.js');

export default class VideoSet extends Component<Props, State> {
  props: Props;
  classifierEEGSubscription: ?Subscription;
  rawEEGSubscription: ?Subscription;

  constructor(props) {
    super(props);
    let classifierEEGObservable = null;
    console.log('check varrrr', this.props.location.state.firstVideo);
    console.log('your eeg osevabe', props.location.state.classifierType);
    console.log(
      'you rawEEGObservable state',
      props.location.state.rawEEGObservable
    );
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
      questionNumber: '',
      questionText: '',
      firstOption: '',
      secondOption: '',
      thirdOption: '',
      videoName: '',
      answers: [
        {
          niches: {
            q1: {
              experimentType: '',
              timestamp: '',
              engagement: '',
              answer: ''
            },
            q2: {
              experimentType: '',
              timestamp: '',
              engagement: '',
              answer: ''
            },
            q3: {
              experimentType: '',
              timestamp: '',
              engagement: '',
              answer: ''
            },
            q4: {
              experimentType: '',
              timestamp: '',
              engagement: '',
              answer: ''
            }
          },
          lipid: {
            q1: {
              experimentType: '',
              timestamp: '',
              engagement: '',
              answer: ''
            },
            q2: {
              experimentType: '',
              timestamp: '',
              engagement: '',
              answer: ''
            },
            q3: {
              experimentType: '',
              timestamp: '',
              engagement: '',
              answer: ''
            },
            q4: {
              experimentType: '',
              timestamp: '',
              engagement: '',
              answer: ''
            }
          },
          bip: {
            q1: {
              experimentType: '',
              timestamp: '',
              engagement: '',
              answer: ''
            },
            q2: {
              experimentType: '',
              timestamp: '',
              engagement: '',
              answer: ''
            },
            q3: {
              experimentType: '',
              timestamp: '',
              engagement: '',
              answer: ''
            },
            q4: {
              experimentType: '',
              timestamp: '',
              engagement: '',
              answer: ''
            }
          },
          insulin: {
            q1: {
              experimentType: '',
              timestamp: '',
              engagement: '',
              answer: ''
            },
            q2: {
              experimentType: '',
              timestamp: '',
              engagement: '',
              answer: ''
            },
            q3: {
              experimentType: '',
              timestamp: '',
              engagement: '',
              answer: ''
            },
            q4: {
              experimentType: '',
              timestamp: '',
              engagement: '',
              answer: ''
            }
          }
        }
      ],
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
  }

  componentWillMount() {
    this.setState({
      currentVideo: this.props.location.state.firstVideo,
      questionSet: this.state.questionSet,
      videoName: this.getVideoName(this.props.location.state.firstVideo)
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
    this.setState({
      modalIsOpen: false,
      obscureButton: true
    });
  };

  closeFinalModal = () => {
    if (this.state.currentVideo === this.props.location.state.firstVideo) {
      this.setState({
        currentVideo: this.props.location.state.secondVideo,
        questionSet: this.getQuestionSet(this.props.location.state.secondVideo)
      });
    } else if (
      this.state.currentVideo === this.props.location.state.secondVideo
    ) {
      this.setState({
        currentVideo: this.props.location.state.thirdVideo,
        questionSet: this.getQuestionSet(this.props.location.state.thirdVideo)
      });
    } else if (
      this.state.currentVideo === this.props.location.state.thirdVideo
    ) {
      this.setState({
        currentVideo: this.props.location.state.fourthVideo,
        questionSet: this.getQuestionSet(this.props.location.state.fourthVideo)
      });
    }
    this.setState({ finalModalIsOpen: false });
  };

  playVideo = videoSequence => {
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

  newNextQuestion = key => {
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
      }
    }
  };

  nextQuestion = key => {
    this.pauseVideo();
    this.setState({ modalIsOpen: true });

    for (let i = 0; i < questionsArray.length; i++) {
      if (questionsArray[i].key === key) {
        this.setState({
          questionNumber: questionsArray[i].name,
          questionText: questionsArray[i].question,
          firstOption: questionsArray[i].option1,
          secondOption: questionsArray[i].option2,
          thirdOption: questionsArray[i].option3,
          fourthOption: questionsArray[i].option4,
          fifthOption: questionsArray[i].option5
        });
      }
    }
  };

  getVideoName(video) {
    let videoNameTemp = '';
    if (
      video ===
      'http://localhost:1212/dist/0aaa1f67050e199bf65b346ed1e6bddf.mp4'
    ) {
      videoNameTemp = 'niches';
    } else if (
      video ===
      'http://localhost:1212/dist/2ab8ce87a09d1d6b7303006753ca0251.mp4'
    ) {
      videoNameTemp = 'lipid';
    } else if (
      video ===
      'http://localhost:1212/dist/0b30e12cf7d23e654b6d6c306bd13618.mp4'
    ) {
      videoNameTemp = 'bip';
    } else if (
      video ===
      'http://localhost:1212/dist/a6e5c47df7b77a974f47cce5b094f90c.mp4'
    ) {
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
    let videoNameTemp = '';
    if (
      video ===
      'http://localhost:1212/dist/0aaa1f67050e199bf65b346ed1e6bddf.mp4'
    ) {
      questionSetTemp = nichesQ;
      videoNameTemp = 'niches';
    } else if (
      video ===
      'http://localhost:1212/dist/2ab8ce87a09d1d6b7303006753ca0251.mp4'
    ) {
      questionSetTemp = lipidQ;
      videoNameTemp = 'lipid';
    } else if (
      video ===
      'http://localhost:1212/dist/0b30e12cf7d23e654b6d6c306bd13618.mp4'
    ) {
      questionSetTemp = bipQ;
      videoNameTemp = 'bip';
    } else if (
      video ===
      'http://localhost:1212/dist/a6e5c47df7b77a974f47cce5b094f90c.mp4'
    ) {
      questionSetTemp = insulinQ;
      videoNameTemp = 'insulin';
    } else {
      questionSetTemp = null;
    }
    this.setState({
      questionSet: questionSetTemp,
      videoName: videoNameTemp
    });

    return questionSetTemp;
  }

  onTimeUpdate = () => {
    const {
      question1AlreadyShown,
      question2AlreadyShown,
      isRunning
    } = this.state;

    const vidCurrTime = document.getElementById('vidID').currentTime;

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
      switch (true) {
        case this.state.videoName === 'niches' &&
          (4 <= vidCurrTime && vidCurrTime < 8) &&
          this.state.answers[0].niches.q1.answer === '':
          this.newNextQuestion(1);
          break;
        case this.state.videoName === 'niches' &&
          (8 <= vidCurrTime && vidCurrTime < 10) &&
          this.state.answers[0].niches.q2.answer === '':
          this.newNextQuestion(2);
          break;
        case this.state.videoName === 'niches' &&
          (10 <= vidCurrTime && vidCurrTime < 12) &&
          this.state.answers[0].niches.q3.answer === '':
          this.newNextQuestion(3);
          break;
        case this.state.videoName === 'niches' &&
          (12 <= vidCurrTime && vidCurrTime < 14) &&
          this.state.answers[0].niches.q4.answer === '':
          this.newNextQuestion(4);
          break;

        case this.state.videoName === 'lipid' &&
          (4 <= vidCurrTime && vidCurrTime < 8) &&
          this.state.answers[0].lipid.q1.answer === '':
          this.newNextQuestion(1);
          break;
        case this.state.videoName === 'lipid' &&
          (8 <= vidCurrTime && vidCurrTime < 10) &&
          this.state.answers[0].lipid.q2.answer === '':
          this.newNextQuestion(2);
          break;
        case this.state.videoName === 'lipid' &&
          (10 <= vidCurrTime && vidCurrTime < 12) &&
          this.state.answers[0].lipid.q3.answer === '':
          this.newNextQuestion(3);
          break;
        case this.state.videoName === 'lipid' &&
          (12 <= vidCurrTime && vidCurrTime < 14) &&
          this.state.answers[0].lipid.q4.answer === '':
          this.newNextQuestion(4);
          break;

        case this.state.videoName === 'bip' &&
          (4 <= vidCurrTime && vidCurrTime < 8) &&
          this.state.answers[0].bip.q1.answer === '':
          this.newNextQuestion(1);
          break;
        case this.state.videoName === 'bip' &&
          (8 <= vidCurrTime && vidCurrTime < 10) &&
          this.state.answers[0].bip.q2.answer === '':
          this.newNextQuestion(2);
          break;
        case this.state.videoName === 'bip' &&
          (10 <= vidCurrTime && vidCurrTime < 12) &&
          this.state.answers[0].bip.q3.answer === '':
          this.newNextQuestion(3);
          break;
        case this.state.videoName === 'bip' &&
          (12 <= vidCurrTime && vidCurrTime < 14) &&
          this.state.answers[0].bip.q4.answer === '':
          this.newNextQuestion(4);
          break;

        case this.state.videoName === 'insulin' &&
          (4 <= vidCurrTime && vidCurrTime < 8) &&
          this.state.answers[0].insulin.q1.answer === '':
          this.newNextQuestion(1);
          break;
        case this.state.videoName === 'insulin' &&
          (8 <= vidCurrTime && vidCurrTime < 10) &&
          this.state.answers[0].insulin.q2.answer === '':
          this.newNextQuestion(2);
          break;
        case this.state.videoName === 'insulin' &&
          (10 <= vidCurrTime && vidCurrTime < 12) &&
          this.state.answers[0].insulin.q3.answer === '':
          this.newNextQuestion(3);
          break;
        case this.state.videoName === 'insulin' &&
          (12 <= vidCurrTime && vidCurrTime < 14) &&
          this.state.answers[0].insulin.q4.answer === '':
          this.newNextQuestion(4);
          break;
        default:
          break;
      }
    }
  };

  generateCsvs = videoSequence => {
    this.setState({ finalModalIsOpen: true });
  };

  handleEngagement(q, e) {
    const answers = this.state.answers;

    answers.forEach(answer => {
      if (this.state.videoName === 'niches') {
        if (q.questionNumber === 1) {
          answer.niches.q1.engagement = e.target.value;
        }
        if (q.questionNumber === 2) {
          answer.niches.q2.engagement = e.target.value;
        }
        if (q.questionNumber === 3) {
          answer.niches.q3.engagement = e.target.value;
        }
        if (q.questionNumber === 4) {
          answer.niches.q4.engagement = e.target.value;
        }
      }
      if (this.state.videoName === 'lipid') {
        if (q.questionNumber === 1) {
          answer.lipid.q1.engagement = e.target.value;
        }
        if (q.questionNumber === 2) {
          answer.lipid.q2.engagement = e.target.value;
        }
        if (q.questionNumber === 3) {
          answer.lipid.q3.engagement = e.target.value;
        }
        if (q.questionNumber === 4) {
          answer.lipid.q4.engagement = e.target.value;
        }
      }
      if (this.state.videoName === 'bip') {
        if (q.questionNumber === 1) {
          answer.bip.q1.engagement = e.target.value;
        }
        if (q.questionNumber === 2) {
          answer.bip.q2.engagement = e.target.value;
        }
        if (q.questionNumber === 3) {
          answer.bip.q3.engagement = e.target.value;
        }
        if (q.questionNumber === 4) {
          answer.bip.q4.engagement = e.target.value;
        }
      }
      if (this.state.videoName === 'insulin') {
        if (q.questionNumber === 1) {
          answer.insulin.q1.engagement = e.target.value;
        }
        if (q.questionNumber === 2) {
          answer.insulin.q2.engagement = e.target.value;
        }
        if (q.questionNumber === 3) {
          answer.insulin.q3.engagement = e.target.value;
        }
        if (q.questionNumber === 4) {
          answer.insulin.q4.engagement = e.target.value;
        }
      }
    });

    this.setState({ answers });
  }

  handleQuestion(q, e) {
    this.setState({ obscureButton: false });
    const answers = this.state.answers;
    const time = new Date().getTime();
    const date = new Date(time).toString();

    answers.forEach(answer => {
      if (this.state.videoName === 'niches') {
        answer.niches.value = this.state.videoName;
        if (q.questionNumber === 1) {
          answer.niches.q1.experimentType = 'control';
          answer.niches.q1.timestamp = date;
          answer.niches.q1.value = q.questionNumber;
          answer.niches.q1.answer = e.target.value;
        }
        if (q.questionNumber === 2) {
          answer.niches.q2.experimentType = 'control';
          answer.niches.q2.timestamp = date;
          answer.niches.q2.value = q.questionNumber;
          answer.niches.q2.answer = e.target.value;
        }
        if (q.questionNumber === 3) {
          answer.niches.q3.experimentType = 'control';
          answer.niches.q3.timestamp = date;
          answer.niches.q3.value = q.questionNumber;
          answer.niches.q3.answer = e.target.value;
        }
        if (q.questionNumber === 4) {
          answer.niches.q4.experimentType = 'control';
          answer.niches.q4.timestamp = date;
          answer.niches.q4.value = q.questionNumber;
          answer.niches.q4.answer = e.target.value;
        }
      }
      if (this.state.videoName === 'lipid') {
        answer.lipid.value = this.state.videoName;
        if (q.questionNumber === 1) {
          answer.lipid.q1.experimentType = 'control';
          answer.lipid.q1.timestamp = date;
          answer.lipid.q1.value = q.questionNumber;
          answer.lipid.q1.answer = e.target.value;
        }
        if (q.questionNumber === 2) {
          answer.lipid.q2.experimentType = 'control';
          answer.lipid.q2.timestamp = date;
          answer.lipid.q2.value = q.questionNumber;
          answer.lipid.q2.answer = e.target.value;
        }
        if (q.questionNumber === 3) {
          answer.lipid.q3.experimentType = 'control';
          answer.lipid.q3.timestamp = date;
          answer.lipid.q3.value = q.questionNumber;
          answer.lipid.q3.answer = e.target.value;
        }
        if (q.questionNumber === 4) {
          answer.lipid.q4.experimentType = 'control';
          answer.lipid.q4.timestamp = date;
          answer.lipid.q4.value = q.questionNumber;
          answer.lipid.q4.answer = e.target.value;
        }
      }

      if (this.state.videoName === 'bip') {
        answer.bip.value = this.state.videoName;
        if (q.questionNumber === 1) {
          answer.bip.q1.experimentType = 'control';
          answer.bip.q1.timestamp = date;
          answer.bip.q1.value = q.questionNumber;
          answer.bip.q1.answer = e.target.value;
        }
        if (q.questionNumber === 2) {
          answer.bip.q2.experimentType = 'control';
          answer.bip.q2.timestamp = date;
          answer.bip.q2.value = q.questionNumber;
          answer.bip.q2.answer = e.target.value;
        }
        if (q.questionNumber === 3) {
          answer.bip.q3.experimentType = 'control';
          answer.bip.q3.timestamp = date;
          answer.bip.q3.value = q.questionNumber;
          answer.bip.q3.answer = e.target.value;
        }
        if (q.questionNumber === 4) {
          answer.bip.q4.experimentType = 'control';
          answer.bip.q4.timestamp = date;
          answer.bip.q4.value = q.questionNumber;
          answer.bip.q4.answer = e.target.value;
        }
      }

      if (this.state.videoName === 'insulin') {
        answer.insulin.value = this.state.videoName;
        if (q.questionNumber === 1) {
          answer.insulin.q1.experimentType = 'control';
          answer.insulin.q1.timestamp = date;
          answer.insulin.q1.value = q.questionNumber;
          answer.insulin.q1.answer = e.target.value;
        }
        if (q.questionNumber === 2) {
          answer.insulin.q2.experimentType = 'control';
          answer.insulin.q2.timestamp = date;
          answer.insulin.q2.value = q.questionNumber;
          answer.insulin.q2.answer = e.target.value;
        }
        if (q.questionNumber === 3) {
          answer.insulin.q3.experimentType = 'control';
          answer.insulin.q3.timestamp = date;
          answer.insulin.q3.value = q.questionNumber;
          answer.insulin.q3.answer = e.target.value;
        }
        if (q.questionNumber === 4) {
          answer.insulin.q4.experimentType = 'control';
          answer.insulin.q4.timestamp = date;
          answer.insulin.q4.value = q.questionNumber;
          answer.insulin.q4.answer = e.target.value;
        }
      }
    });

    this.setState({ answers });
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
      videoName
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
        TimeStamp: answers[0].niches.q1.timestamp,
        QuestionNo: answers[0].niches.q1.value,
        Engagement: answers[0].niches.q1.engagement,
        Answer: answers[0].niches.q1.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].niches.value,
        ExperimentType: answers[0].niches.q2.experimentType,
        TimeStamp: answers[0].niches.q2.timestamp,
        QuestionNo: answers[0].niches.q2.value,
        Engagement: answers[0].niches.q2.engagement,
        Answer: answers[0].niches.q2.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].niches.value,
        ExperimentType: answers[0].niches.q1.experimentType,
        TimeStamp: answers[0].niches.q3.timestamp,
        QuestionNo: answers[0].niches.q3.value,
        Engagement: answers[0].niches.q3.engagement,
        Answer: answers[0].niches.q3.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].niches.value,
        ExperimentType: answers[0].niches.q1.experimentType,
        TimeStamp: answers[0].niches.q4.timestamp,
        QuestionNo: answers[0].niches.q4.value,
        Engagement: answers[0].niches.q4.engagement,
        Answer: answers[0].niches.q4.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].lipid.value,
        ExperimentType: answers[0].lipid.q1.experimentType,
        TimeStamp: answers[0].lipid.q1.timestamp,
        QuestionNo: answers[0].lipid.q1.value,
        Engagement: answers[0].lipid.q1.engagement,
        Answer: answers[0].lipid.q1.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].lipid.value,
        ExperimentType: answers[0].lipid.q2.experimentType,
        TimeStamp: answers[0].lipid.q2.timestamp,
        QuestionNo: answers[0].lipid.q2.value,
        Engagement: answers[0].lipid.q2.engagement,
        Answer: answers[0].lipid.q2.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].lipid.value,
        ExperimentType: answers[0].lipid.q1.experimentType,
        TimeStamp: answers[0].lipid.q3.timestamp,
        QuestionNo: answers[0].lipid.q3.value,
        Engagement: answers[0].lipid.q3.engagement,
        Answer: answers[0].lipid.q3.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].lipid.value,
        ExperimentType: answers[0].lipid.q1.experimentType,
        TimeStamp: answers[0].lipid.q4.timestamp,
        QuestionNo: answers[0].lipid.q4.value,
        Engagement: answers[0].lipid.q4.engagement,
        Answer: answers[0].lipid.q4.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].bip.value,
        ExperimentType: answers[0].bip.q1.experimentType,
        TimeStamp: answers[0].bip.q1.timestamp,
        QuestionNo: answers[0].bip.q1.value,
        Engagement: answers[0].bip.q1.engagement,
        Answer: answers[0].bip.q1.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].bip.value,
        ExperimentType: answers[0].bip.q2.experimentType,
        TimeStamp: answers[0].bip.q2.timestamp,
        QuestionNo: answers[0].bip.q2.value,
        Engagement: answers[0].bip.q2.engagement,
        Answer: answers[0].bip.q2.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].bip.value,
        ExperimentType: answers[0].bip.q1.experimentType,
        TimeStamp: answers[0].bip.q3.timestamp,
        QuestionNo: answers[0].bip.q3.value,
        Engagement: answers[0].bip.q3.engagement,
        Answer: answers[0].bip.q3.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].bip.value,
        ExperimentType: answers[0].bip.q1.experimentType,
        TimeStamp: answers[0].bip.q4.timestamp,
        QuestionNo: answers[0].bip.q4.value,
        Engagement: answers[0].bip.q4.engagement,
        Answer: answers[0].bip.q4.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].insulin.value,
        ExperimentType: answers[0].insulin.q1.experimentType,
        TimeStamp: answers[0].insulin.q1.timestamp,
        QuestionNo: answers[0].insulin.q1.value,
        Engagement: answers[0].insulin.q1.engagement,
        Answer: answers[0].insulin.q1.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].insulin.value,
        ExperimentType: answers[0].insulin.q2.experimentType,
        TimeStamp: answers[0].insulin.q2.timestamp,
        QuestionNo: answers[0].insulin.q2.value,
        Engagement: answers[0].insulin.q2.engagement,
        Answer: answers[0].insulin.q2.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].insulin.value,
        ExperimentType: answers[0].insulin.q1.experimentType,
        TimeStamp: answers[0].insulin.q3.timestamp,
        QuestionNo: answers[0].insulin.q3.value,
        Engagement: answers[0].insulin.q3.engagement,
        Answer: answers[0].insulin.q3.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].insulin.value,
        ExperimentType: answers[0].insulin.q1.experimentType,
        TimeStamp: answers[0].insulin.q4.timestamp,
        QuestionNo: answers[0].insulin.q4.value,
        Engagement: answers[0].insulin.q4.engagement,
        Answer: answers[0].insulin.q4.answer
      }
    ];

    const videoSequence = [
      {
        key: 'v1',
        value: firstVideo
      },
      {
        key: 'v2',
        value: secondVideo
      },
      {
        key: 'v3',
        value: thirdVideo
      },
      {
        key: 'v4',
        value: fourthVideo
      }
    ];

    return (
      <div className={styles.videoContainer}>
        <div className={styles.backButton} data-tid="backButton">
          <Link to={routes.HOME}>
            <i className="fa fa-arrow-left fa-2x" />
          </Link>
        </div>
        <h3>Video Container</h3>
        <Button>
          <CSVLink data={answersCsv} filename="answers.csv">
            Download Subject Answers
          </CSVLink>
        </Button>
        <div>
          <video
            id="vidID"
            ref={c => {
              this.getVideoRef = c;
            }}
            className={styles.video}
            src={currentVideo}
            width="60%"
            height="60%"
            poster="../app/components/VideoComponents/bkbx.jpg"
            controls
            onTimeUpdate={this.onTimeUpdate}
            onEnded={() => this.generateCsvs(videoSequence)}
          >
            <track kind="captions" />
          </video>
          <div className={styles.btnGroup}>
            <Button
              className={styles.btn}
              onClick={() => this.playVideo(videoSequence)}
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

                {currentVideo ===
                  'http://localhost:1212/dist/0aaa1f67050e199bf65b346ed1e6bddf.mp4' && (
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

                {currentVideo ===
                  'http://localhost:1212/dist/2ab8ce87a09d1d6b7303006753ca0251.mp4' && (
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

                {currentVideo ===
                  'http://localhost:1212/dist/0b30e12cf7d23e654b6d6c306bd13618.mp4' && (
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

                {currentVideo ===
                  'http://localhost:1212/dist/a6e5c47df7b77a974f47cce5b094f90c.mp4' && (
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
