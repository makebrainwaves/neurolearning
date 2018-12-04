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
const nichesQ = require('../../questions/NichesQuestions.js');
const lipidQ = require('../../questions/LipidQuestions.js');
const bipQ = require('../../questions/BipQuestions.js');
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
      questionAnswered1: false,
      questionAnswered2: false,
      questionAnswered3: false,
      questionAnswered4: false,
      questionAnswered5: false,
      questionAnswered6: false,
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
      videoName: this.getVideoName(this.props.location.state.firstVideo),
      nichesSequenceNumber: this.getSequenceNumber('niches'),
      lipidSequenceNumber: this.getSequenceNumber('lipid'),
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
      questionAnswered6: false
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

    // const answersCsv = this.updateAnswers();

    const answersCsv = [
      {
        Subject: subjectId,
        VideoName: answers[0].niches.value,
        ExperimentType: 'control',
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
        ExperimentType: 'control',
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
        ExperimentType: 'control',
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
        ExperimentType: 'control',
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
        ExperimentType: 'control',
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
        ExperimentType: 'control',
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
        ExperimentType: 'control',
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
        ExperimentType: 'control',
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
        ExperimentType: 'control',
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
        VideoName: answers[0].niches.value,
        ExperimentType: 'control',
        SequenceNo: nichesSequenceNumber,
        ModalPopupTOD: answers[0].niches.q11.modalPopupTOD,
        ModalPopupTOV: answers[0].niches.q11.modalPopupTOV,
        SubmitTimeTOD: answers[0].niches.q11.submitTimeTOD,
        QuestionNo: answers[0].niches.q11.value,
        Engagement: answers[0].niches.q11.engagement,
        Answer: answers[0].niches.q11.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].niches.value,
        ExperimentType: 'control',
        SequenceNo: nichesSequenceNumber,
        ModalPopupTOD: answers[0].niches.q12.modalPopupTOD,
        ModalPopupTOV: answers[0].niches.q12.modalPopupTOV,
        SubmitTimeTOD: answers[0].niches.q12.submitTimeTOD,
        QuestionNo: answers[0].niches.q12.value,
        Engagement: answers[0].niches.q12.engagement,
        Answer: answers[0].niches.q12.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].niches.value,
        ExperimentType: 'control',
        SequenceNo: nichesSequenceNumber,
        ModalPopupTOD: answers[0].niches.q13.modalPopupTOD,
        ModalPopupTOV: answers[0].niches.q13.modalPopupTOV,
        SubmitTimeTOD: answers[0].niches.q13.submitTimeTOD,
        QuestionNo: answers[0].niches.q13.value,
        Engagement: answers[0].niches.q13.engagement,
        Answer: answers[0].niches.q13.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].niches.value,
        ExperimentType: 'control',
        SequenceNo: nichesSequenceNumber,
        ModalPopupTOD: answers[0].niches.q14.modalPopupTOD,
        ModalPopupTOV: answers[0].niches.q14.modalPopupTOV,
        SubmitTimeTOD: answers[0].niches.q14.submitTimeTOD,
        QuestionNo: answers[0].niches.q14.value,
        Engagement: answers[0].niches.q14.engagement,
        Answer: answers[0].niches.q14.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].niches.value,
        ExperimentType: 'control',
        SequenceNo: nichesSequenceNumber,
        ModalPopupTOD: answers[0].niches.q15.modalPopupTOD,
        ModalPopupTOV: answers[0].niches.q15.modalPopupTOV,
        SubmitTimeTOD: answers[0].niches.q15.submitTimeTOD,
        QuestionNo: answers[0].niches.q15.value,
        Engagement: answers[0].niches.q15.engagement,
        Answer: answers[0].niches.q15.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].niches.value,
        ExperimentType: 'control',
        SequenceNo: nichesSequenceNumber,
        ModalPopupTOD: answers[0].niches.q16.modalPopupTOD,
        ModalPopupTOV: answers[0].niches.q16.modalPopupTOV,
        SubmitTimeTOD: answers[0].niches.q16.submitTimeTOD,
        QuestionNo: answers[0].niches.q16.value,
        Engagement: answers[0].niches.q16.engagement,
        Answer: answers[0].niches.q16.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].niches.value,
        ExperimentType: 'control',
        SequenceNo: nichesSequenceNumber,
        ModalPopupTOD: answers[0].niches.q17.modalPopupTOD,
        ModalPopupTOV: answers[0].niches.q17.modalPopupTOV,
        SubmitTimeTOD: answers[0].niches.q17.submitTimeTOD,
        QuestionNo: answers[0].niches.q17.value,
        Engagement: answers[0].niches.q17.engagement,
        Answer: answers[0].niches.q17.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].niches.value,
        ExperimentType: 'control',
        SequenceNo: nichesSequenceNumber,
        ModalPopupTOD: answers[0].niches.q18.modalPopupTOD,
        ModalPopupTOV: answers[0].niches.q18.modalPopupTOV,
        SubmitTimeTOD: answers[0].niches.q18.submitTimeTOD,
        QuestionNo: answers[0].niches.q18.value,
        Engagement: answers[0].niches.q18.engagement,
        Answer: answers[0].niches.q18.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].lipid.value,
        ExperimentType: 'control',
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
        ExperimentType: 'control',
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
        ExperimentType: 'control',
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
        ExperimentType: 'control',
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
        VideoName: answers[0].lipid.value,
        ExperimentType: 'control',
        SequenceNo: lipidSequenceNumber,
        ModalPopupTOD: answers[0].lipid.q5.modalPopupTOD,
        ModalPopupTOV: answers[0].lipid.q5.modalPopupTOV,
        SubmitTimeTOD: answers[0].lipid.q5.submitTimeTOD,
        QuestionNo: answers[0].lipid.q5.value,
        Engagement: answers[0].lipid.q5.engagement,
        Answer: answers[0].lipid.q5.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].lipid.value,
        ExperimentType: 'control',
        SequenceNo: lipidSequenceNumber,
        ModalPopupTOD: answers[0].lipid.q6.modalPopupTOD,
        ModalPopupTOV: answers[0].lipid.q6.modalPopupTOV,
        SubmitTimeTOD: answers[0].lipid.q6.submitTimeTOD,
        QuestionNo: answers[0].lipid.q6.value,
        Engagement: answers[0].lipid.q6.engagement,
        Answer: answers[0].lipid.q6.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].lipid.value,
        ExperimentType: 'control',
        SequenceNo: lipidSequenceNumber,
        ModalPopupTOD: answers[0].lipid.q7.modalPopupTOD,
        ModalPopupTOV: answers[0].lipid.q7.modalPopupTOV,
        SubmitTimeTOD: answers[0].lipid.q7.submitTimeTOD,
        QuestionNo: answers[0].lipid.q7.value,
        Engagement: answers[0].lipid.q7.engagement,
        Answer: answers[0].lipid.q7.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].lipid.value,
        ExperimentType: 'control',
        SequenceNo: lipidSequenceNumber,
        ModalPopupTOD: answers[0].lipid.q8.modalPopupTOD,
        ModalPopupTOV: answers[0].lipid.q8.modalPopupTOV,
        SubmitTimeTOD: answers[0].lipid.q8.submitTimeTOD,
        QuestionNo: answers[0].lipid.q8.value,
        Engagement: answers[0].lipid.q8.engagement,
        Answer: answers[0].lipid.q8.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].lipid.value,
        ExperimentType: 'control',
        SequenceNo: lipidSequenceNumber,
        ModalPopupTOD: answers[0].lipid.q9.modalPopupTOD,
        ModalPopupTOV: answers[0].lipid.q9.modalPopupTOV,
        SubmitTimeTOD: answers[0].lipid.q9.submitTimeTOD,
        QuestionNo: answers[0].lipid.q9.value,
        Engagement: answers[0].lipid.q9.engagement,
        Answer: answers[0].lipid.q9.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].lipid.value,
        ExperimentType: 'control',
        SequenceNo: lipidSequenceNumber,
        ModalPopupTOD: answers[0].lipid.q10.modalPopupTOD,
        ModalPopupTOV: answers[0].lipid.q10.modalPopupTOV,
        SubmitTimeTOD: answers[0].lipid.q10.submitTimeTOD,
        QuestionNo: answers[0].lipid.q10.value,
        Engagement: answers[0].lipid.q10.engagement,
        Answer: answers[0].lipid.q10.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].lipid.value,
        ExperimentType: 'control',
        SequenceNo: lipidSequenceNumber,
        ModalPopupTOD: answers[0].lipid.q11.modalPopupTOD,
        ModalPopupTOV: answers[0].lipid.q11.modalPopupTOV,
        SubmitTimeTOD: answers[0].lipid.q11.submitTimeTOD,
        QuestionNo: answers[0].lipid.q11.value,
        Engagement: answers[0].lipid.q11.engagement,
        Answer: answers[0].lipid.q11.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].lipid.value,
        ExperimentType: 'control',
        SequenceNo: lipidSequenceNumber,
        ModalPopupTOD: answers[0].lipid.q12.modalPopupTOD,
        ModalPopupTOV: answers[0].lipid.q12.modalPopupTOV,
        SubmitTimeTOD: answers[0].lipid.q12.submitTimeTOD,
        QuestionNo: answers[0].lipid.q12.value,
        Engagement: answers[0].lipid.q12.engagement,
        Answer: answers[0].lipid.q12.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].lipid.value,
        ExperimentType: 'control',
        SequenceNo: lipidSequenceNumber,
        ModalPopupTOD: answers[0].lipid.q13.modalPopupTOD,
        ModalPopupTOV: answers[0].lipid.q13.modalPopupTOV,
        SubmitTimeTOD: answers[0].lipid.q13.submitTimeTOD,
        QuestionNo: answers[0].lipid.q13.value,
        Engagement: answers[0].lipid.q13.engagement,
        Answer: answers[0].lipid.q13.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].lipid.value,
        ExperimentType: 'control',
        SequenceNo: lipidSequenceNumber,
        ModalPopupTOD: answers[0].lipid.q14.modalPopupTOD,
        ModalPopupTOV: answers[0].lipid.q14.modalPopupTOV,
        SubmitTimeTOD: answers[0].lipid.q14.submitTimeTOD,
        QuestionNo: answers[0].lipid.q14.value,
        Engagement: answers[0].lipid.q14.engagement,
        Answer: answers[0].lipid.q14.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].lipid.value,
        ExperimentType: 'control',
        SequenceNo: lipidSequenceNumber,
        ModalPopupTOD: answers[0].lipid.q15.modalPopupTOD,
        ModalPopupTOV: answers[0].lipid.q15.modalPopupTOV,
        SubmitTimeTOD: answers[0].lipid.q15.submitTimeTOD,
        QuestionNo: answers[0].lipid.q15.value,
        Engagement: answers[0].lipid.q15.engagement,
        Answer: answers[0].lipid.q15.answer
      },
      {
        Subject: subjectId,
        VideoName: answers[0].lipid.value,
        ExperimentType: 'control',
        SequenceNo: lipidSequenceNumber,
        ModalPopupTOD: answers[0].lipid.q16.modalPopupTOD,
        ModalPopupTOV: answers[0].lipid.q16.modalPopupTOV,
        SubmitTimeTOD: answers[0].lipid.q16.submitTimeTOD,
        QuestionNo: answers[0].lipid.q16.value,
        Engagement: answers[0].lipid.q16.engagement,
        Answer: answers[0].lipid.q16.answer
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
