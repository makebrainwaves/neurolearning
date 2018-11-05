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
  answerQ1: string;
  answerQ2: string;
  answerQ3: string;
  answerQ4: string;
  obscureButton: boolean;
}

interface Props {
  electrodesChosen: string;
}

const controlPauseTime = 4;

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
      question1AlreadyShown: false,
      question2AlreadyShown: false,
      questionNumber: '',
      questionText: '',
      firstOption: '',
      secondOption: '',
      thirdOption: '',
      answers: {
        niches: {
          q1: '',
          q2: '',
          q3: '',
          q4: ''
        },
        lipid: {
          q1: '',
          q2: '',
          q3: '',
          q4: ''
        },
        bip: {
          q1: '',
          q2: '',
          q3: '',
          q4: ''
        },
        insulin: {
          q1: '',
          q2: '',
          q3: '',
          q4: ''
        }
      },
      answerQ1: '',
      answerQ2: '',
      answerQ3: '',
      answerQ4: '',
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
      questionSet: this.state.questionSet
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

  playVideo = videoSequence => {
    const videoRef = this.getVideoRef;
    videoRef.play();
    this.setState({ isRunning: true });
  };

  pauseVideo = () => {
    const videoRef = this.getVideoRef;
    videoRef.pause();
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

  getQuestionSet(video) {
    let questionSetTemp = [];
    if (
      video ===
      'http://localhost:1212/dist/0aaa1f67050e199bf65b346ed1e6bddf.mp4'
    ) {
      questionSetTemp = nichesQ;
    } else if (
      video ===
      'http://localhost:1212/dist/2ab8ce87a09d1d6b7303006753ca0251.mp4'
    ) {
      questionSetTemp = lipidQ;
    } else if (
      video ===
      'http://localhost:1212/dist/0b30e12cf7d23e654b6d6c306bd13618.mp4'
    ) {
      questionSetTemp = bipQ;
    } else if (
      video ===
      'http://localhost:1212/dist/a6e5c47df7b77a974f47cce5b094f90c.mp4'
    ) {
      questionSetTemp = insulinQ;
    } else {
      questionSetTemp = null;
    }
    this.setState({ questionSet: questionSetTemp });

    return questionSetTemp;
  }

  onTimeUpdate = () => {
    const {
      question1AlreadyShown,
      question2AlreadyShown,
      isRunning,
      answerQ1,
      answerQ2,
      answerQ3,
      answerQ4
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
        case 4 <= vidCurrTime && vidCurrTime < 8 && answerQ1 === '':
          this.newNextQuestion(1);
          break;
        case 8 <= vidCurrTime && vidCurrTime < 10 && answerQ2 === '':
          this.newNextQuestion(2);
          break;
        case 10 <= vidCurrTime && vidCurrTime < 12 && answerQ3 === '':
          this.newNextQuestion(3);
          break;
        case 12 <= vidCurrTime && vidCurrTime < 14 && answerQ4 === '':
          this.newNextQuestion(4);
          break;
        default:
          break;
      }
    }
  };

  generateCsvs = videoSequence => {
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
  };

  handleQuestion(q, e) {
    this.setState({ obscureButton: false });
    console.log(
      'this is the question you have just answered: ',
      q.questionNumber
    );
    console.log('you have chosen Q2', e.target.value);

    if (q.questionNumber === 1) {
      this.setState({ answerQ1: e.target.value });
    }

    if (q.questionNumber === 2) {
      this.setState({ answerQ2: e.target.value });
    }

    if (q.questionNumber === 3) {
      this.setState({ answerQ3: e.target.value });
    }

    if (q.questionNumber === 4) {
      this.setState({ answerQ4: e.target.value });
    }
  }

  render() {
    const {
      modalIsOpen,
      questionSet,
      answers,
      answerQ1,
      answerQ2,
      answerQ3,
      answerQ4,
      questionNumber,
      questionText,
      firstOption,
      secondOption,
      thirdOption,
      fourthOption,
      fifthOption,
      currentVideo
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
        Question: data.q1.name,
        Answer: answerQ1
      },
      {
        Subject: subjectId,
        Question: data.q2.name,
        Answer: answerQ2
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
            <Modal.Header>{this.state.questionNumber}</Modal.Header>
            <Modal.Content className={styles.content}>
              <Modal.Description>
                <p>{this.state.questionText}</p>
                <p>
                  <h5>Please select an answer to continue</h5>
                </p>
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
      </div>
    );
  }
}
