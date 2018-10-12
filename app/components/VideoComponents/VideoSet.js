/* eslint class-methods-use-this: ["error", { "exceptMethods": ["handleSubmit"] }] */
// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Button, Modal } from 'semantic-ui-react';
import { CSVLink } from 'react-csv';
import { Subscription } from 'rxjs';
import styles from './VideoSet.css';
import routes from '../../constants/routes.json';
import * as data from '../../questions/questions.json';
import video1 from '../Bip_KC_Trim.mp4';
import {
  createAlphaClassifierObservable,
  createThetaBetaClassifierObservable
} from '../../utils/eeg';

interface State {
  subjectId: string;
  firstVideo: string;
  firstVideoType: string;
  seocondVideo: string;
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
  fourthOption: string;
  fifthOption: string;
  answerQ1: string;
  answerQ2: string;
}

interface Props {}

const controlPauseTime = 4;

export default class VideoSet extends Component<Props, State> {
  props: Props;
  classifierEEGSubscription: ?Subscription;
  rawEEGSubscription: ?Subscription;

  constructor(props) {
    super(props);
    let classifierEEGObservable = null;
    console.log('you reeg osevabe', props.location.state.classifierType);
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

    this.state = {
      isRunning: 'false',
      question1AlreadyShown: 'false',
      question2AlreadyShown: 'false',
      questionNumber: '',
      questionText: '',
      firstOption: '',
      secondOption: '',
      thirdOption: '',
      fourthOption: '',
      fifthOption: '',
      answerQ1: 'option5',
      answerQ2: 'option5',
      classifierEEGObservable,
      classifierScore: 0,
      classifierThreshold: 80 // TODO: set this based on baseline data collection
    };
    // These are just so that we can unsubscribe from the observables
    this.rawEEGSubscription = null;
    this.classifierEEGSubscription = null;
    // This binding is necessary to make `this` work in the callback
    this.playVideo = this.playVideo.bind(this);
    this.pauseVideo = this.pauseVideo.bind(this);
    this.handleQuestion = this.handleQuestion.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    // Might be able to subscribe to these guys in constructor, but I've always done it in componentDidMount
    this.classifierEEGSubscription = this.state.classifierEEGObservable.subscribe(
      classifierScore => {
        this.setState({ classifierScore });
        console.log('classifierScore', classifierScore);
      }
    );
  }

  closeModal = () =>
    this.setState({
      modalIsOpen: false
    });

  playVideo = () => {
    const videoRef = this.getVideoRef;
    videoRef.play();
    this.setState({ isRunning: true });
  };

  pauseVideo = () => {
    const videoRef = this.getVideoRef;
    videoRef.pause();
    this.setState({ isRunning: false });
  };

  onTimeUpdate = () => {
    const {
      question1AlreadyShown,
      question2AlreadyShown,
      isRunning
    } = this.state;

    const vidCurrTime = document.getElementById('vidID').currentTime;
    console.log('isRunning: ', isRunning);

    // TODO: Add way to tell if this video is an experimental or control video
    const isVideoExperimental = true;
    if (isVideoExperimental) {
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

    // TODO: Refactor this so you won't have to manually describe states for every different question
    if (question1AlreadyShown) {
      if (vidCurrTime >= controlPauseTime) {
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
    if (question2AlreadyShown) {
      if (vidCurrTime >= controlPauseTime * 2) {
        this.setState({
          modalIsOpen: true,
          question2AlreadyShown: !question2AlreadyShown,
          questionNumber: data.q2.name,
          questionText: data.q2.question,
          firstOption: data.q2.option1,
          secondOption: data.q2.option2,
          thirdOption: data.q2.option3,
          fourthOption: data.q2.option4,
          fifthOption: data.q2.option5
        });
        this.pauseVideo();
      }
    }
  };

  generateCsvs = () => {
    console.log('your video has ended');
  };

  handleQuestion(q, e) {
    console.log(
      'this is the question you have just answered: ',
      q.questionNumber
    );
    console.log('you have chosen Q2', e.target.value);

    if (q.questionNumber === 'Question 1:') {
      this.setState({ answerQ1: e.target.value });
    }

    if (q.questionNumber === 'Question 2:') {
      this.setState({ answerQ2: e.target.value });
    }
  }

  handleSubmit(event) {
    console.log('what is the handleSubmit event?', event);
  }

  render() {
    const {
      modalIsOpen,
      answerQ1,
      answerQ2,
      questionNumber,
      questionText,
      firstOption,
      secondOption,
      thirdOption,
      fourthOption,
      fifthOption
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

    const subjectCsvData = [
      {
        SequenceNumber: '1',
        VideoName: firstVideo,
        ExperimentType: firstVideoType
      },
      {
        SequenceNumber: '2',
        VideoName: secondVideo,
        ExperimentType: secondVideoType
      },
      {
        SequenceNumber: '3',
        VideoName: thirdVideo,
        ExperimentType: thirdVideoType
      },
      {
        SequenceNumber: '4',
        VideoName: fourthVideo,
        ExperimentType: fourthVideoType
      }
    ];

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

    return (
      <div className={styles.videoContainer}>
        <div className={styles.backButton} data-tid="backButton">
          <Link to={routes.HOME}>
            <i className="fa fa-arrow-left fa-2x" />
          </Link>
        </div>
        <h3>Video Container</h3>
        <CSVLink data={subjectCsvData} filename={subjectId}>
          Download Subject Info
        </CSVLink>
        <CSVLink data={answersCsv} filename="answers.csv">
          Download Subject Answers
        </CSVLink>
        <div>
          <video
            id="vidID"
            ref={c => {
              this.getVideoRef = c;
            }}
            className={styles.video}
            src={video1}
            width="70%"
            height="70%"
            controls
            onTimeUpdate={this.onTimeUpdate}
            onEnded={this.generateCsvs}
          >
            <track kind="captions" />
          </video>
          <div className={styles.btnGroup}>
            <Button
              className={styles.btn}
              onClick={this.playVideo}
              data-tclass="btn"
              type="button"
            >
              Play
            </Button>
            <button
              className={styles.btn}
              onClick={this.pauseVideo}
              data-tclass="btn"
              type="button"
            >
              Pause
            </button>
          </div>
        </div>

        <Modal
          open={modalIsOpen}
          className={styles.modal}
          closeOnEscape={false}
          closeOnDimmerClick={false}
          onClose={this.closeModal}
        >
          <div className={styles.inner}>
            <Modal.Header>{questionNumber}</Modal.Header>
            <Modal.Content className={styles.content}>
              <Modal.Description>
                <p>{questionText}</p>

                <div>
                  <div className="radio">
                    <label htmlFor={firstOption}>
                      <input
                        name="option"
                        type="radio"
                        value="option1"
                        onChange={e =>
                          this.handleQuestion({ questionNumber }, e)
                        }
                      />
                      {firstOption}
                    </label>
                  </div>
                  <div className="radio">
                    <label htmlFor={secondOption}>
                      <input
                        name="option"
                        type="radio"
                        value="option2"
                        onChange={e =>
                          this.handleQuestion({ questionNumber }, e)
                        }
                      />
                      {secondOption}
                    </label>
                  </div>
                  <div className="radio">
                    <label htmlFor={thirdOption}>
                      <input
                        name="option"
                        type="radio"
                        value="option3"
                        onChange={e =>
                          this.handleQuestion({ questionNumber }, e)
                        }
                      />
                      {thirdOption}
                    </label>
                  </div>
                  <div className="radio">
                    <label htmlFor={fourthOption}>
                      <input
                        name="option"
                        type="radio"
                        value="option4"
                        onChange={e =>
                          this.handleQuestion({ questionNumber }, e)
                        }
                      />
                      {fourthOption}
                    </label>
                  </div>
                  <div className="radio">
                    <label htmlFor={fifthOption}>
                      <input
                        name="option"
                        type="radio"
                        value="option5"
                        checked
                        onChange={e =>
                          this.handleQuestion({ questionNumber }, e)
                        }
                      />
                      {fifthOption}
                    </label>
                  </div>
                  <br />
                  <button onClick={this.closeModal} type="submit">
                    Submit
                  </button>
                </div>
              </Modal.Description>
            </Modal.Content>
          </div>
        </Modal>

        <div>
          <div>
            Subject ID:
            {subjectId}
          </div>
          <div>
            firstVideo:
            {firstVideo}
          </div>
          <div>
            firstVideoType:
            {firstVideoType}
          </div>
          <div>
            secondVideo:
            {secondVideo}
          </div>
          <div>
            secondVideoType:
            {secondVideoType}
          </div>
          <div>
            thirdVideo:
            {thirdVideo}
          </div>
          <div>
            thirdVideoType:
            {thirdVideoType}
          </div>
          <div>
            fourthVideo:
            {fourthVideo}
          </div>
          <div>
            fourthVideoType:
            {fourthVideoType}
          </div>
        </div>
      </div>
    );
  }
}
