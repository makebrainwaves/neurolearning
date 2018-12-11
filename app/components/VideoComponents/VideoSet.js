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
const biomassQ = require('../../questions/BiomassQuestions.js');
const fuelQ = require('../../questions/FuelQuestions.js');
const bipQ = require('../../questions/BipQuestions.js');
const insulinQ = require('../../questions/InsulinQuestions.js');
const answersArray = require('../../constants/Answers.js');

const biomassVideo =
  'http://localhost:1212/dist/bab08a1b5e70073aa05bda2923a835f2.mp4';
const fuelVideo =
  'http://localhost:1212/dist/bcc000d9e3048f485822cc246c74a0e5.mp4';
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
      questionAnswered1: false,
      questionAnswered2: false,
      questionAnswered3: false,
      questionAnswered4: false,
      questionAnswered5: false,
      questionAnswered6: false,
      questionAnswered7: false,
      questionAnswered8: false,
      questionAnswered9: false,
      questionAnswered10: false,
      questionAnswered11: false,
      questionAnswered12: false,
      questionAnswered13: false,
      biomassSequenceNumber: 1,
      fuelSequenceNumber: 2,
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
      videoName: this.getVideoName(this.props.location.state.firstVideo),
      biomassSequenceNumber: this.getSequenceNumber('biomass'),
      fuelSequenceNumber: this.getSequenceNumber('fuel'),
      bipSequenceNumber: this.getSequenceNumber('bip'),
      insulinSequenceNumber: this.getSequenceNumber('insulin')
    });
  }

  componentDidMount() {
    this.setState({
      questionSet: this.getRandomQuestionSet(this.state.currentVideo)
    });
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

  getRandomQuestionSet(currVid) {
    console.log('this curr video', this.state.currentVideo);
    const videoQuestions = this.getQuestionSet(currVid);
    console.log('videoquestions', videoQuestions);
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
    console.log('randomrandomNumbers', randomNumbers);

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
    const videoQuestions = this.state.questionSet;

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
    if (currentVideo === biomassVideo) {
      videoNameTemp = 'biomass';
    } else if (currentVideo === fuelVideo) {
      videoNameTemp = 'fuel';
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
    console.log('from getQuestionSet', video);
    if (video === biomassVideo) {
      questionSetTemp = biomassQ;
    } else if (video === fuelVideo) {
      questionSetTemp = fuelQ;
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
      videoName,
      questionSet
    } = this.state;

    const vidCurrTime = document.getElementById('vidID').currentTime;

    if (
      questionSet[0] &&
      questionSet[0].value.period <= vidCurrTime &&
      !this.state.questionAnswered1
    ) {
      this.nextQuestion(questionSet[0].key, vidCurrTime);
    }
    if (
      questionSet[1] &&
      questionSet[1].value.period <= vidCurrTime &&
      !this.state.questionAnswered2
    ) {
      this.nextQuestion(questionSet[1].key, vidCurrTime);
    }
    if (
      questionSet[2] &&
      questionSet[2].value.period <= vidCurrTime &&
      !this.state.questionAnswered3
    ) {
      this.nextQuestion(questionSet[2].key, vidCurrTime);
    }
    if (
      questionSet[3] &&
      questionSet[3].value.period <= vidCurrTime &&
      !this.state.questionAnswered4
    ) {
      this.nextQuestion(questionSet[3].key, vidCurrTime);
    }
    if (
      questionSet[4] &&
      questionSet[4].value.period <= vidCurrTime &&
      !this.state.questionAnswered5
    ) {
      this.nextQuestion(questionSet[4].key, vidCurrTime);
    }
    if (
      questionSet[5] &&
      questionSet[5].value.period <= vidCurrTime &&
      !this.state.questionAnswered6
    ) {
      this.nextQuestion(questionSet[5].key, vidCurrTime);
    }
    if (
      questionSet[6] &&
      questionSet[6].value.period <= vidCurrTime &&
      !this.state.questionAnswered7
    ) {
      this.nextQuestion(questionSet[6].key, vidCurrTime);
    }
    if (
      questionSet[7] &&
      questionSet[7].value.period <= vidCurrTime &&
      !this.state.questionAnswered8
    ) {
      this.nextQuestion(questionSet[7].key, vidCurrTime);
    }
    if (
      questionSet[8] &&
      questionSet[8].value.period <= vidCurrTime &&
      !this.state.questionAnswered9
    ) {
      this.nextQuestion(questionSet[8].key, vidCurrTime);
    }
    if (
      questionSet[9] &&
      questionSet[9].value.period <= vidCurrTime &&
      !this.state.questionAnswered10
    ) {
      this.nextQuestion(questionSet[9].key, vidCurrTime);
    }
    if (
      questionSet[10] &&
      questionSet[10].value.period <= vidCurrTime &&
      !this.state.questionAnswered11
    ) {
      this.nextQuestion(questionSet[10].key, vidCurrTime);
    }
    if (
      questionSet[11] &&
      questionSet[11].value.period <= vidCurrTime &&
      !this.state.questionAnswered12
    ) {
      this.nextQuestion(questionSet[11].key, vidCurrTime);
    }
    if (
      questionSet[12] &&
      questionSet[12].value.period <= vidCurrTime &&
      !this.state.questionAnswered13
    ) {
      this.nextQuestion(questionSet[12].key, vidCurrTime);
    }

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
    }
  };

  moveAlongVideoSequence() {
    this.setState({
      questionAnswered1: false,
      questionAnswered2: false,
      questionAnswered3: false,
      questionAnswered4: false,
      questionAnswered5: false,
      questionAnswered6: false,
      questionAnswered7: false,
      questionAnswered8: false,
      questionAnswered9: false,
      questionAnswered10: false,
      questionAnswered11: false,
      questionAnswered12: false,
      questionAnswered13: false
    });

    if (this.state.currentVideo === this.props.location.state.firstVideo) {
      this.setState({
        currentVideo: this.props.location.state.secondVideo,
        questionSet: this.getRandomQuestionSet(
          this.props.location.state.secondVideo
        ),
        videoName: this.getVideoName(this.props.location.state.secondVideo)
      });
    } else if (
      this.state.currentVideo === this.props.location.state.secondVideo
    ) {
      this.setState({
        questionAnswered1: false,
        currentVideo: this.props.location.state.thirdVideo,
        questionSet: this.getRandomQuestionSet(
          this.props.location.state.thirdVideo
        ),
        videoName: this.getVideoName(this.props.location.state.thirdVideo)
      });
    } else if (
      this.state.currentVideo === this.props.location.state.thirdVideo
    ) {
      this.setState({
        currentVideo: this.props.location.state.fourthVideo,
        questionSet: this.getRandomQuestionSet(
          this.props.location.state.fourthVideo
        ),
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
    const questionNumber = `q${q.questionNumber}`;
    const videoQuestions = this.state.questionSet;

    answers.forEach(answer => {
      answer[this.state.videoName].value = this.state.videoName;
      answer[this.state.videoName][questionNumber].experimentType = 'control';
      answer[this.state.videoName][questionNumber].value = q.questionNumber;
      answer[this.state.videoName][questionNumber].answer = e.target.value;
    });

    for (let i = 0; i < videoQuestions.length; i++) {
      if (videoQuestions[i].key === q.questionNumber) {
        const questionAnswered = `questionAnswered${i + 1}`;

        this.setState({
          [questionAnswered]: true
        });
      }
    }

    this.setState({
      answers
    });
    console.log('this.state.answers', this.state.answers);
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
      biomassSequenceNumber,
      fuelSequenceNumber,
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

    // const answersCsv = this.updateAnswers();

    const answersCsv = [
      {
        Subject: subjectId,
        VideoName: answers[0].biomass.value,
        ExperimentType: 'control',
        SequenceNo: biomassSequenceNumber,
        ModalPopupTOD: answers[0].biomass.q1.modalPopupTOD,
        ModalPopupTOV: answers[0].biomass.q1.modalPopupTOV,
        SubmitTimeTOD: answers[0].biomass.q1.submitTimeTOD,
        QuestionNo: answers[0].biomass.q1.value,
        Engagement: answers[0].biomass.q1.engagement,
        Answer: answers[0].biomass.q1.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].biomass.value,
        ExperimentType: 'control',
        SequenceNo: biomassSequenceNumber,
        ModalPopupTOD: answers[0].biomass.q3.modalPopupTOD,
        ModalPopupTOV: answers[0].biomass.q3.modalPopupTOV,
        SubmitTimeTOD: answers[0].biomass.q3.submitTimeTOD,
        QuestionNo: answers[0].biomass.q3.value,
        Engagement: answers[0].biomass.q3.engagement,
        Answer: answers[0].biomass.q3.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].biomass.value,
        ExperimentType: 'control',
        SequenceNo: biomassSequenceNumber,
        ModalPopupTOD: answers[0].biomass.q4.modalPopupTOD,
        ModalPopupTOV: answers[0].biomass.q4.modalPopupTOV,
        SubmitTimeTOD: answers[0].biomass.q4.submitTimeTOD,
        QuestionNo: answers[0].biomass.q4.value,
        Engagement: answers[0].biomass.q4.engagement,
        Answer: answers[0].biomass.q4.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].biomass.value,
        ExperimentType: 'control',
        SequenceNo: biomassSequenceNumber,
        ModalPopupTOD: answers[0].biomass.q5.modalPopupTOD,
        ModalPopupTOV: answers[0].biomass.q5.modalPopupTOV,
        SubmitTimeTOD: answers[0].biomass.q5.submitTimeTOD,
        QuestionNo: answers[0].biomass.q5.value,
        Engagement: answers[0].biomass.q5.engagement,
        Answer: answers[0].biomass.q5.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].biomass.value,
        ExperimentType: 'control',
        SequenceNo: biomassSequenceNumber,
        ModalPopupTOD: answers[0].biomass.q6.modalPopupTOD,
        ModalPopupTOV: answers[0].biomass.q6.modalPopupTOV,
        SubmitTimeTOD: answers[0].biomass.q6.submitTimeTOD,
        QuestionNo: answers[0].biomass.q6.value,
        Engagement: answers[0].biomass.q6.engagement,
        Answer: answers[0].biomass.q6.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].biomass.value,
        ExperimentType: 'control',
        SequenceNo: biomassSequenceNumber,
        ModalPopupTOD: answers[0].biomass.q7.modalPopupTOD,
        ModalPopupTOV: answers[0].biomass.q7.modalPopupTOV,
        SubmitTimeTOD: answers[0].biomass.q7.submitTimeTOD,
        QuestionNo: answers[0].biomass.q7.value,
        Engagement: answers[0].biomass.q7.engagement,
        Answer: answers[0].biomass.q7.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].biomass.value,
        ExperimentType: 'control',
        SequenceNo: biomassSequenceNumber,
        ModalPopupTOD: answers[0].biomass.q8.modalPopupTOD,
        ModalPopupTOV: answers[0].biomass.q8.modalPopupTOV,
        SubmitTimeTOD: answers[0].biomass.q8.submitTimeTOD,
        QuestionNo: answers[0].biomass.q8.value,
        Engagement: answers[0].biomass.q8.engagement,
        Answer: answers[0].biomass.q8.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].biomass.value,
        ExperimentType: 'control',
        SequenceNo: biomassSequenceNumber,
        ModalPopupTOD: answers[0].biomass.q9.modalPopupTOD,
        ModalPopupTOV: answers[0].biomass.q9.modalPopupTOV,
        SubmitTimeTOD: answers[0].biomass.q9.submitTimeTOD,
        QuestionNo: answers[0].biomass.q9.value,
        Engagement: answers[0].biomass.q9.engagement,
        Answer: answers[0].biomass.q9.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].biomass.value,
        ExperimentType: 'control',
        SequenceNo: biomassSequenceNumber,
        ModalPopupTOD: answers[0].biomass.q10.modalPopupTOD,
        ModalPopupTOV: answers[0].biomass.q10.modalPopupTOV,
        SubmitTimeTOD: answers[0].biomass.q10.submitTimeTOD,
        QuestionNo: answers[0].biomass.q10.value,
        Engagement: answers[0].biomass.q10.engagement,
        Answer: answers[0].biomass.q10.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].biomass.value,
        ExperimentType: 'control',
        SequenceNo: biomassSequenceNumber,
        ModalPopupTOD: answers[0].biomass.q11.modalPopupTOD,
        ModalPopupTOV: answers[0].biomass.q11.modalPopupTOV,
        SubmitTimeTOD: answers[0].biomass.q11.submitTimeTOD,
        QuestionNo: answers[0].biomass.q11.value,
        Engagement: answers[0].biomass.q11.engagement,
        Answer: answers[0].biomass.q11.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].biomass.value,
        ExperimentType: 'control',
        SequenceNo: biomassSequenceNumber,
        ModalPopupTOD: answers[0].biomass.q12.modalPopupTOD,
        ModalPopupTOV: answers[0].biomass.q12.modalPopupTOV,
        SubmitTimeTOD: answers[0].biomass.q12.submitTimeTOD,
        QuestionNo: answers[0].biomass.q12.value,
        Engagement: answers[0].biomass.q12.engagement,
        Answer: answers[0].biomass.q12.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].biomass.value,
        ExperimentType: 'control',
        SequenceNo: biomassSequenceNumber,
        ModalPopupTOD: answers[0].biomass.q13.modalPopupTOD,
        ModalPopupTOV: answers[0].biomass.q13.modalPopupTOV,
        SubmitTimeTOD: answers[0].biomass.q13.submitTimeTOD,
        QuestionNo: answers[0].biomass.q13.value,
        Engagement: answers[0].biomass.q13.engagement,
        Answer: answers[0].biomass.q13.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].biomass.value,
        ExperimentType: 'control',
        SequenceNo: biomassSequenceNumber,
        ModalPopupTOD: answers[0].biomass.q14.modalPopupTOD,
        ModalPopupTOV: answers[0].biomass.q14.modalPopupTOV,
        SubmitTimeTOD: answers[0].biomass.q14.submitTimeTOD,
        QuestionNo: answers[0].biomass.q14.value,
        Engagement: answers[0].biomass.q14.engagement,
        Answer: answers[0].biomass.q14.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].biomass.value,
        ExperimentType: 'control',
        SequenceNo: biomassSequenceNumber,
        ModalPopupTOD: answers[0].biomass.q15.modalPopupTOD,
        ModalPopupTOV: answers[0].biomass.q15.modalPopupTOV,
        SubmitTimeTOD: answers[0].biomass.q15.submitTimeTOD,
        QuestionNo: answers[0].biomass.q15.value,
        Engagement: answers[0].biomass.q15.engagement,
        Answer: answers[0].biomass.q15.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].biomass.value,
        ExperimentType: 'control',
        SequenceNo: biomassSequenceNumber,
        ModalPopupTOD: answers[0].biomass.q16.modalPopupTOD,
        ModalPopupTOV: answers[0].biomass.q16.modalPopupTOV,
        SubmitTimeTOD: answers[0].biomass.q16.submitTimeTOD,
        QuestionNo: answers[0].biomass.q16.value,
        Engagement: answers[0].biomass.q16.engagement,
        Answer: answers[0].biomass.q16.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].biomass.value,
        ExperimentType: 'control',
        SequenceNo: biomassSequenceNumber,
        ModalPopupTOD: answers[0].biomass.q17.modalPopupTOD,
        ModalPopupTOV: answers[0].biomass.q17.modalPopupTOV,
        SubmitTimeTOD: answers[0].biomass.q17.submitTimeTOD,
        QuestionNo: answers[0].biomass.q17.value,
        Engagement: answers[0].biomass.q17.engagement,
        Answer: answers[0].biomass.q17.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].biomass.value,
        ExperimentType: 'control',
        SequenceNo: biomassSequenceNumber,
        ModalPopupTOD: answers[0].biomass.q18.modalPopupTOD,
        ModalPopupTOV: answers[0].biomass.q18.modalPopupTOV,
        SubmitTimeTOD: answers[0].biomass.q18.submitTimeTOD,
        QuestionNo: answers[0].biomass.q18.value,
        Engagement: answers[0].biomass.q18.engagement,
        Answer: answers[0].biomass.q18.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].biomass.value,
        ExperimentType: 'control',
        SequenceNo: biomassSequenceNumber,
        ModalPopupTOD: answers[0].biomass.q19.modalPopupTOD,
        ModalPopupTOV: answers[0].biomass.q19.modalPopupTOV,
        SubmitTimeTOD: answers[0].biomass.q19.submitTimeTOD,
        QuestionNo: answers[0].biomass.q19.value,
        Engagement: answers[0].biomass.q19.engagement,
        Answer: answers[0].biomass.q19.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].biomass.value,
        ExperimentType: 'control',
        SequenceNo: biomassSequenceNumber,
        ModalPopupTOD: answers[0].biomass.q20.modalPopupTOD,
        ModalPopupTOV: answers[0].biomass.q20.modalPopupTOV,
        SubmitTimeTOD: answers[0].biomass.q20.submitTimeTOD,
        QuestionNo: answers[0].biomass.q20.value,
        Engagement: answers[0].biomass.q20.engagement,
        Answer: answers[0].biomass.q20.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].biomass.value,
        ExperimentType: 'control',
        SequenceNo: biomassSequenceNumber,
        ModalPopupTOD: answers[0].biomass.q21.modalPopupTOD,
        ModalPopupTOV: answers[0].biomass.q21.modalPopupTOV,
        SubmitTimeTOD: answers[0].biomass.q21.submitTimeTOD,
        QuestionNo: answers[0].biomass.q21.value,
        Engagement: answers[0].biomass.q21.engagement,
        Answer: answers[0].biomass.q21.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].fuel.value,
        ExperimentType: 'control',
        SequenceNo: fuelSequenceNumber,
        ModalPopupTOD: answers[0].fuel.q1.modalPopupTOD,
        ModalPopupTOV: answers[0].fuel.q1.modalPopupTOV,
        SubmitTimeTOD: answers[0].fuel.q1.submitTimeTOD,
        QuestionNo: answers[0].fuel.q1.value,
        Engagement: answers[0].fuel.q1.engagement,
        Answer: answers[0].fuel.q1.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].fuel.value,
        ExperimentType: 'control',
        SequenceNo: fuelSequenceNumber,
        ModalPopupTOD: answers[0].fuel.q2.modalPopupTOD,
        ModalPopupTOV: answers[0].fuel.q2.modalPopupTOV,
        SubmitTimeTOD: answers[0].fuel.q2.submitTimeTOD,
        QuestionNo: answers[0].fuel.q2.value,
        Engagement: answers[0].fuel.q2.engagement,
        Answer: answers[0].fuel.q2.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].fuel.value,
        ExperimentType: 'control',
        SequenceNo: fuelSequenceNumber,
        ModalPopupTOD: answers[0].fuel.q3.modalPopupTOD,
        ModalPopupTOV: answers[0].fuel.q3.modalPopupTOV,
        SubmitTimeTOD: answers[0].fuel.q3.submitTimeTOD,
        QuestionNo: answers[0].fuel.q3.value,
        Engagement: answers[0].fuel.q3.engagement,
        Answer: answers[0].fuel.q3.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].fuel.value,
        ExperimentType: 'control',
        SequenceNo: fuelSequenceNumber,
        ModalPopupTOD: answers[0].fuel.q4.modalPopupTOD,
        ModalPopupTOV: answers[0].fuel.q4.modalPopupTOV,
        SubmitTimeTOD: answers[0].fuel.q4.submitTimeTOD,
        QuestionNo: answers[0].fuel.q4.value,
        Engagement: answers[0].fuel.q4.engagement,
        Answer: answers[0].fuel.q4.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].fuel.value,
        ExperimentType: 'control',
        SequenceNo: fuelSequenceNumber,
        ModalPopupTOD: answers[0].fuel.q5.modalPopupTOD,
        ModalPopupTOV: answers[0].fuel.q5.modalPopupTOV,
        SubmitTimeTOD: answers[0].fuel.q5.submitTimeTOD,
        QuestionNo: answers[0].fuel.q5.value,
        Engagement: answers[0].fuel.q5.engagement,
        Answer: answers[0].fuel.q5.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].fuel.value,
        ExperimentType: 'control',
        SequenceNo: fuelSequenceNumber,
        ModalPopupTOD: answers[0].fuel.q6.modalPopupTOD,
        ModalPopupTOV: answers[0].fuel.q6.modalPopupTOV,
        SubmitTimeTOD: answers[0].fuel.q6.submitTimeTOD,
        QuestionNo: answers[0].fuel.q6.value,
        Engagement: answers[0].fuel.q6.engagement,
        Answer: answers[0].fuel.q6.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].fuel.value,
        ExperimentType: 'control',
        SequenceNo: fuelSequenceNumber,
        ModalPopupTOD: answers[0].fuel.q7.modalPopupTOD,
        ModalPopupTOV: answers[0].fuel.q7.modalPopupTOV,
        SubmitTimeTOD: answers[0].fuel.q7.submitTimeTOD,
        QuestionNo: answers[0].fuel.q7.value,
        Engagement: answers[0].fuel.q7.engagement,
        Answer: answers[0].fuel.q7.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].fuel.value,
        ExperimentType: 'control',
        SequenceNo: fuelSequenceNumber,
        ModalPopupTOD: answers[0].fuel.q8.modalPopupTOD,
        ModalPopupTOV: answers[0].fuel.q8.modalPopupTOV,
        SubmitTimeTOD: answers[0].fuel.q8.submitTimeTOD,
        QuestionNo: answers[0].fuel.q8.value,
        Engagement: answers[0].fuel.q8.engagement,
        Answer: answers[0].fuel.q8.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].fuel.value,
        ExperimentType: 'control',
        SequenceNo: fuelSequenceNumber,
        ModalPopupTOD: answers[0].fuel.q9.modalPopupTOD,
        ModalPopupTOV: answers[0].fuel.q9.modalPopupTOV,
        SubmitTimeTOD: answers[0].fuel.q9.submitTimeTOD,
        QuestionNo: answers[0].fuel.q9.value,
        Engagement: answers[0].fuel.q9.engagement,
        Answer: answers[0].fuel.q9.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].fuel.value,
        ExperimentType: 'control',
        SequenceNo: fuelSequenceNumber,
        ModalPopupTOD: answers[0].fuel.q10.modalPopupTOD,
        ModalPopupTOV: answers[0].fuel.q10.modalPopupTOV,
        SubmitTimeTOD: answers[0].fuel.q10.submitTimeTOD,
        QuestionNo: answers[0].fuel.q10.value,
        Engagement: answers[0].fuel.q10.engagement,
        Answer: answers[0].fuel.q10.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].fuel.value,
        ExperimentType: 'control',
        SequenceNo: fuelSequenceNumber,
        ModalPopupTOD: answers[0].fuel.q11.modalPopupTOD,
        ModalPopupTOV: answers[0].fuel.q11.modalPopupTOV,
        SubmitTimeTOD: answers[0].fuel.q11.submitTimeTOD,
        QuestionNo: answers[0].fuel.q11.value,
        Engagement: answers[0].fuel.q11.engagement,
        Answer: answers[0].fuel.q11.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].fuel.value,
        ExperimentType: 'control',
        SequenceNo: fuelSequenceNumber,
        ModalPopupTOD: answers[0].fuel.q12.modalPopupTOD,
        ModalPopupTOV: answers[0].fuel.q12.modalPopupTOV,
        SubmitTimeTOD: answers[0].fuel.q12.submitTimeTOD,
        QuestionNo: answers[0].fuel.q12.value,
        Engagement: answers[0].fuel.q12.engagement,
        Answer: answers[0].fuel.q12.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].fuel.value,
        ExperimentType: 'control',
        SequenceNo: fuelSequenceNumber,
        ModalPopupTOD: answers[0].fuel.q13.modalPopupTOD,
        ModalPopupTOV: answers[0].fuel.q13.modalPopupTOV,
        SubmitTimeTOD: answers[0].fuel.q13.submitTimeTOD,
        QuestionNo: answers[0].fuel.q13.value,
        Engagement: answers[0].fuel.q13.engagement,
        Answer: answers[0].fuel.q13.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].fuel.value,
        ExperimentType: 'control',
        SequenceNo: fuelSequenceNumber,
        ModalPopupTOD: answers[0].fuel.q14.modalPopupTOD,
        ModalPopupTOV: answers[0].fuel.q14.modalPopupTOV,
        SubmitTimeTOD: answers[0].fuel.q14.submitTimeTOD,
        QuestionNo: answers[0].fuel.q14.value,
        Engagement: answers[0].fuel.q14.engagement,
        Answer: answers[0].fuel.q14.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].fuel.value,
        ExperimentType: 'control',
        SequenceNo: fuelSequenceNumber,
        ModalPopupTOD: answers[0].fuel.q15.modalPopupTOD,
        ModalPopupTOV: answers[0].fuel.q15.modalPopupTOV,
        SubmitTimeTOD: answers[0].fuel.q15.submitTimeTOD,
        QuestionNo: answers[0].fuel.q15.value,
        Engagement: answers[0].fuel.q15.engagement,
        Answer: answers[0].fuel.q15.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].fuel.value,
        ExperimentType: 'control',
        SequenceNo: fuelSequenceNumber,
        ModalPopupTOD: answers[0].fuel.q16.modalPopupTOD,
        ModalPopupTOV: answers[0].fuel.q16.modalPopupTOV,
        SubmitTimeTOD: answers[0].fuel.q16.submitTimeTOD,
        QuestionNo: answers[0].fuel.q16.value,
        Engagement: answers[0].fuel.q16.engagement,
        Answer: answers[0].fuel.q16.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].fuel.value,
        ExperimentType: 'control',
        SequenceNo: fuelSequenceNumber,
        ModalPopupTOD: answers[0].fuel.q17.modalPopupTOD,
        ModalPopupTOV: answers[0].fuel.q17.modalPopupTOV,
        SubmitTimeTOD: answers[0].fuel.q17.submitTimeTOD,
        QuestionNo: answers[0].fuel.q17.value,
        Engagement: answers[0].fuel.q17.engagement,
        Answer: answers[0].fuel.q17.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].fuel.value,
        ExperimentType: 'control',
        SequenceNo: fuelSequenceNumber,
        ModalPopupTOD: answers[0].fuel.q18.modalPopupTOD,
        ModalPopupTOV: answers[0].fuel.q18.modalPopupTOV,
        SubmitTimeTOD: answers[0].fuel.q18.submitTimeTOD,
        QuestionNo: answers[0].fuel.q18.value,
        Engagement: answers[0].fuel.q18.engagement,
        Answer: answers[0].fuel.q18.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].fuel.value,
        ExperimentType: 'control',
        SequenceNo: fuelSequenceNumber,
        ModalPopupTOD: answers[0].fuel.q19.modalPopupTOD,
        ModalPopupTOV: answers[0].fuel.q19.modalPopupTOV,
        SubmitTimeTOD: answers[0].fuel.q19.submitTimeTOD,
        QuestionNo: answers[0].fuel.q19.value,
        Engagement: answers[0].fuel.q19.engagement,
        Answer: answers[0].fuel.q19.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].fuel.value,
        ExperimentType: 'control',
        SequenceNo: fuelSequenceNumber,
        ModalPopupTOD: answers[0].fuel.q20.modalPopupTOD,
        ModalPopupTOV: answers[0].fuel.q20.modalPopupTOV,
        SubmitTimeTOD: answers[0].fuel.q20.submitTimeTOD,
        QuestionNo: answers[0].fuel.q20.value,
        Engagement: answers[0].fuel.q20.engagement,
        Answer: answers[0].fuel.q20.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].fuel.value,
        ExperimentType: 'control',
        SequenceNo: fuelSequenceNumber,
        ModalPopupTOD: answers[0].fuel.q21.modalPopupTOD,
        ModalPopupTOV: answers[0].fuel.q21.modalPopupTOV,
        SubmitTimeTOD: answers[0].fuel.q21.submitTimeTOD,
        QuestionNo: answers[0].fuel.q21.value,
        Engagement: answers[0].fuel.q21.engagement,
        Answer: answers[0].fuel.q21.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].fuel.value,
        ExperimentType: 'control',
        SequenceNo: fuelSequenceNumber,
        ModalPopupTOD: answers[0].fuel.q22.modalPopupTOD,
        ModalPopupTOV: answers[0].fuel.q22.modalPopupTOV,
        SubmitTimeTOD: answers[0].fuel.q22.submitTimeTOD,
        QuestionNo: answers[0].fuel.q22.value,
        Engagement: answers[0].fuel.q22.engagement,
        Answer: answers[0].fuel.q22.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].fuel.value,
        ExperimentType: 'control',
        SequenceNo: fuelSequenceNumber,
        ModalPopupTOD: answers[0].fuel.q23.modalPopupTOD,
        ModalPopupTOV: answers[0].fuel.q23.modalPopupTOV,
        SubmitTimeTOD: answers[0].fuel.q23.submitTimeTOD,
        QuestionNo: answers[0].fuel.q23.value,
        Engagement: answers[0].fuel.q23.engagement,
        Answer: answers[0].fuel.q23.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].bip.value,
        ExperimentType: 'control',
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
        ExperimentType: 'control',
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
        ExperimentType: 'control',
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
        ExperimentType: 'control',
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
        VideoName: answers[0].bip.value,
        ExperimentType: 'control',
        SequenceNo: bipSequenceNumber,
        ModalPopupTOD: answers[0].bip.q5.modalPopupTOD,
        ModalPopupTOV: answers[0].bip.q5.modalPopupTOV,
        SubmitTimeTOD: answers[0].bip.q5.submitTimeTOD,
        QuestionNo: answers[0].bip.q5.value,
        Engagement: answers[0].bip.q5.engagement,
        Answer: answers[0].bip.q5.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].bip.value,
        ExperimentType: 'control',
        SequenceNo: bipSequenceNumber,
        ModalPopupTOD: answers[0].bip.q6.modalPopupTOD,
        ModalPopupTOV: answers[0].bip.q6.modalPopupTOV,
        SubmitTimeTOD: answers[0].bip.q6.submitTimeTOD,
        QuestionNo: answers[0].bip.q6.value,
        Engagement: answers[0].bip.q6.engagement,
        Answer: answers[0].bip.q6.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].bip.value,
        ExperimentType: 'control',
        SequenceNo: bipSequenceNumber,
        ModalPopupTOD: answers[0].bip.q7.modalPopupTOD,
        ModalPopupTOV: answers[0].bip.q7.modalPopupTOV,
        SubmitTimeTOD: answers[0].bip.q7.submitTimeTOD,
        QuestionNo: answers[0].bip.q7.value,
        Engagement: answers[0].bip.q7.engagement,
        Answer: answers[0].bip.q7.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].bip.value,
        ExperimentType: 'control',
        SequenceNo: bipSequenceNumber,
        ModalPopupTOD: answers[0].bip.q8.modalPopupTOD,
        ModalPopupTOV: answers[0].bip.q8.modalPopupTOV,
        SubmitTimeTOD: answers[0].bip.q8.submitTimeTOD,
        QuestionNo: answers[0].bip.q8.value,
        Engagement: answers[0].bip.q8.engagement,
        Answer: answers[0].bip.q8.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].bip.value,
        ExperimentType: 'control',
        SequenceNo: bipSequenceNumber,
        ModalPopupTOD: answers[0].bip.q9.modalPopupTOD,
        ModalPopupTOV: answers[0].bip.q9.modalPopupTOV,
        SubmitTimeTOD: answers[0].bip.q9.submitTimeTOD,
        QuestionNo: answers[0].bip.q9.value,
        Engagement: answers[0].bip.q9.engagement,
        Answer: answers[0].bip.q9.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].bip.value,
        ExperimentType: 'control',
        SequenceNo: bipSequenceNumber,
        ModalPopupTOD: answers[0].bip.q10.modalPopupTOD,
        ModalPopupTOV: answers[0].bip.q10.modalPopupTOV,
        SubmitTimeTOD: answers[0].bip.q10.submitTimeTOD,
        QuestionNo: answers[0].bip.q10.value,
        Engagement: answers[0].bip.q10.engagement,
        Answer: answers[0].bip.q10.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].bip.value,
        ExperimentType: 'control',
        SequenceNo: bipSequenceNumber,
        ModalPopupTOD: answers[0].bip.q11.modalPopupTOD,
        ModalPopupTOV: answers[0].bip.q11.modalPopupTOV,
        SubmitTimeTOD: answers[0].bip.q11.submitTimeTOD,
        QuestionNo: answers[0].bip.q11.value,
        Engagement: answers[0].bip.q11.engagement,
        Answer: answers[0].bip.q11.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].bip.value,
        ExperimentType: 'control',
        SequenceNo: bipSequenceNumber,
        ModalPopupTOD: answers[0].bip.q12.modalPopupTOD,
        ModalPopupTOV: answers[0].bip.q12.modalPopupTOV,
        SubmitTimeTOD: answers[0].bip.q12.submitTimeTOD,
        QuestionNo: answers[0].bip.q12.value,
        Engagement: answers[0].bip.q12.engagement,
        Answer: answers[0].bip.q12.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].bip.value,
        ExperimentType: 'control',
        SequenceNo: bipSequenceNumber,
        ModalPopupTOD: answers[0].bip.q13.modalPopupTOD,
        ModalPopupTOV: answers[0].bip.q13.modalPopupTOV,
        SubmitTimeTOD: answers[0].bip.q13.submitTimeTOD,
        QuestionNo: answers[0].bip.q13.value,
        Engagement: answers[0].bip.q13.engagement,
        Answer: answers[0].bip.q13.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].bip.value,
        ExperimentType: 'control',
        SequenceNo: bipSequenceNumber,
        ModalPopupTOD: answers[0].bip.q14.modalPopupTOD,
        ModalPopupTOV: answers[0].bip.q14.modalPopupTOV,
        SubmitTimeTOD: answers[0].bip.q14.submitTimeTOD,
        QuestionNo: answers[0].bip.q14.value,
        Engagement: answers[0].bip.q14.engagement,
        Answer: answers[0].bip.q14.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].bip.value,
        ExperimentType: 'control',
        SequenceNo: bipSequenceNumber,
        ModalPopupTOD: answers[0].bip.q15.modalPopupTOD,
        ModalPopupTOV: answers[0].bip.q15.modalPopupTOV,
        SubmitTimeTOD: answers[0].bip.q15.submitTimeTOD,
        QuestionNo: answers[0].bip.q15.value,
        Engagement: answers[0].bip.q15.engagement,
        Answer: answers[0].bip.q15.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].insulin.value,
        ExperimentType: 'control',
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
        ExperimentType: 'control',
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
        ExperimentType: 'control',
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
        ExperimentType: 'control',
        SequenceNo: insulinSequenceNumber,
        ModalPopupTOD: answers[0].insulin.q4.modalPopupTOD,
        ModalPopupTOV: answers[0].insulin.q4.modalPopupTOV,
        SubmitTimeTOD: answers[0].insulin.q4.submitTimeTOD,
        QuestionNo: answers[0].insulin.q4.value,
        Engagement: answers[0].insulin.q4.engagement,
        Answer: answers[0].insulin.q4.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].insulin.value,
        ExperimentType: 'control',
        SequenceNo: insulinSequenceNumber,
        ModalPopupTOD: answers[0].insulin.q5.modalPopupTOD,
        ModalPopupTOV: answers[0].insulin.q5.modalPopupTOV,
        SubmitTimeTOD: answers[0].insulin.q5.submitTimeTOD,
        QuestionNo: answers[0].insulin.q5.value,
        Engagement: answers[0].insulin.q5.engagement,
        Answer: answers[0].insulin.q5.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].insulin.value,
        ExperimentType: 'control',
        SequenceNo: insulinSequenceNumber,
        ModalPopupTOD: answers[0].insulin.q6.modalPopupTOD,
        ModalPopupTOV: answers[0].insulin.q6.modalPopupTOV,
        SubmitTimeTOD: answers[0].insulin.q6.submitTimeTOD,
        QuestionNo: answers[0].insulin.q6.value,
        Engagement: answers[0].insulin.q6.engagement,
        Answer: answers[0].insulin.q6.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].insulin.value,
        ExperimentType: 'control',
        SequenceNo: insulinSequenceNumber,
        ModalPopupTOD: answers[0].insulin.q7.modalPopupTOD,
        ModalPopupTOV: answers[0].insulin.q7.modalPopupTOV,
        SubmitTimeTOD: answers[0].insulin.q7.submitTimeTOD,
        QuestionNo: answers[0].insulin.q7.value,
        Engagement: answers[0].insulin.q7.engagement,
        Answer: answers[0].insulin.q7.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].insulin.value,
        ExperimentType: 'control',
        SequenceNo: insulinSequenceNumber,
        ModalPopupTOD: answers[0].insulin.q8.modalPopupTOD,
        ModalPopupTOV: answers[0].insulin.q8.modalPopupTOV,
        SubmitTimeTOD: answers[0].insulin.q8.submitTimeTOD,
        QuestionNo: answers[0].insulin.q8.value,
        Engagement: answers[0].insulin.q8.engagement,
        Answer: answers[0].insulin.q8.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].insulin.value,
        ExperimentType: 'control',
        SequenceNo: insulinSequenceNumber,
        ModalPopupTOD: answers[0].insulin.q9.modalPopupTOD,
        ModalPopupTOV: answers[0].insulin.q9.modalPopupTOV,
        SubmitTimeTOD: answers[0].insulin.q9.submitTimeTOD,
        QuestionNo: answers[0].insulin.q9.value,
        Engagement: answers[0].insulin.q9.engagement,
        Answer: answers[0].insulin.q9.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].insulin.value,
        ExperimentType: 'control',
        SequenceNo: insulinSequenceNumber,
        ModalPopupTOD: answers[0].insulin.q10.modalPopupTOD,
        ModalPopupTOV: answers[0].insulin.q10.modalPopupTOV,
        SubmitTimeTOD: answers[0].insulin.q10.submitTimeTOD,
        QuestionNo: answers[0].insulin.q10.value,
        Engagement: answers[0].insulin.q10.engagement,
        Answer: answers[0].insulin.q10.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].insulin.value,
        ExperimentType: 'control',
        SequenceNo: insulinSequenceNumber,
        ModalPopupTOD: answers[0].insulin.q11.modalPopupTOD,
        ModalPopupTOV: answers[0].insulin.q11.modalPopupTOV,
        SubmitTimeTOD: answers[0].insulin.q11.submitTimeTOD,
        QuestionNo: answers[0].insulin.q11.value,
        Engagement: answers[0].insulin.q11.engagement,
        Answer: answers[0].insulin.q11.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].insulin.value,
        ExperimentType: 'control',
        SequenceNo: insulinSequenceNumber,
        ModalPopupTOD: answers[0].insulin.q12.modalPopupTOD,
        ModalPopupTOV: answers[0].insulin.q12.modalPopupTOV,
        SubmitTimeTOD: answers[0].insulin.q12.submitTimeTOD,
        QuestionNo: answers[0].insulin.q12.value,
        Engagement: answers[0].insulin.q12.engagement,
        Answer: answers[0].insulin.q12.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].insulin.value,
        ExperimentType: 'control',
        SequenceNo: insulinSequenceNumber,
        ModalPopupTOD: answers[0].insulin.q13.modalPopupTOD,
        ModalPopupTOV: answers[0].insulin.q13.modalPopupTOV,
        SubmitTimeTOD: answers[0].insulin.q13.submitTimeTOD,
        QuestionNo: answers[0].insulin.q13.value,
        Engagement: answers[0].insulin.q13.engagement,
        Answer: answers[0].insulin.q13.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].insulin.value,
        ExperimentType: 'control',
        SequenceNo: insulinSequenceNumber,
        ModalPopupTOD: answers[0].insulin.q14.modalPopupTOD,
        ModalPopupTOV: answers[0].insulin.q14.modalPopupTOV,
        SubmitTimeTOD: answers[0].insulin.q14.submitTimeTOD,
        QuestionNo: answers[0].insulin.q14.value,
        Engagement: answers[0].insulin.q14.engagement,
        Answer: answers[0].insulin.q14.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].insulin.value,
        ExperimentType: 'control',
        SequenceNo: insulinSequenceNumber,
        ModalPopupTOD: answers[0].insulin.q15.modalPopupTOD,
        ModalPopupTOV: answers[0].insulin.q15.modalPopupTOV,
        SubmitTimeTOD: answers[0].insulin.q15.submitTimeTOD,
        QuestionNo: answers[0].insulin.q15.value,
        Engagement: answers[0].insulin.q15.engagement,
        Answer: answers[0].insulin.q15.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].insulin.value,
        ExperimentType: 'control',
        SequenceNo: insulinSequenceNumber,
        ModalPopupTOD: answers[0].insulin.q16.modalPopupTOD,
        ModalPopupTOV: answers[0].insulin.q16.modalPopupTOV,
        SubmitTimeTOD: answers[0].insulin.q16.submitTimeTOD,
        QuestionNo: answers[0].insulin.q16.value,
        Engagement: answers[0].insulin.q16.engagement,
        Answer: answers[0].insulin.q16.answer
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
