/* eslint class-methods-use-this: ["error", { "exceptMethods": ["handleSubmit"] }] */
// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Button, Modal } from 'semantic-ui-react';
import { CSVLink } from 'react-csv';
import styles from './VideoSet.css';
import routes from '../../constants/routes.json';
import * as data from '../../questions/questions.json';

interface Props {
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
  answerChosenQ1: string;
  answerChosenQ2: string;
}

const controlPauseTime = 4;

export default class VideoSet extends Component<Props> {
  propTypes: {
    location: React.PropTypes.object
  };

  props: Props;

  constructor(props) {
    super(props);
    // This binding is necessary to make `this` work in the callback
    this.playVideo = this.playVideo.bind(this);
    this.pauseVideo = this.pauseVideo.bind(this);
    this.handleQuestion1 = this.handleQuestion1.bind(this);
    this.handleQuestion2 = this.handleQuestion2.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    this.state = {
      isRunning: 'false',
      question1AlreadyShown: 'false',
      question2AlreadyShown: 'false',
      answerChosenQ1: 'option5',
      answerChosenQ2: 'option5'
    };
  }

  state = {
    modalIsOpen: false,
    modal2IsOpen: false,
    isRunning: false,
    question1AlreadyShown: false,
    question2AlreadyShown: false
  };

  closeModal = () =>
    this.setState({
      modalIsOpen: false
    });

  closeModal2 = () =>
    this.setState({
      modal2IsOpen: false
    });

  openModal = () =>
    this.setState({
      modalIsOpen: true
    });

  openModal2 = () =>
    this.setState({
      modal2IsOpen: true
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
      answerChosenQ1,
      answerChosenQ2,
      isRunning
    } = this.state;
    const vidCurrTime = document.getElementById('vidID').currentTime;
    console.log('isRunning', isRunning);
    console.log('question1AlreadyShown', question1AlreadyShown);
    console.log('question2AlreadyShown', question2AlreadyShown);
    console.log('current time', vidCurrTime);
    console.log('state of answerChosenQ1', answerChosenQ1);
    console.log('state of answerChosenQ2', answerChosenQ2);
    console.log('controlPauseTime*2', controlPauseTime * 2);

    if (question1AlreadyShown) {
      if (vidCurrTime >= controlPauseTime) {
        this.setState({
          question1AlreadyShown: !question1AlreadyShown
        });
        this.pauseVideo();
        this.openModal();
      }
    }
    if (question2AlreadyShown) {
      if (vidCurrTime >= controlPauseTime * 2) {
        this.setState({
          question2AlreadyShown: !question2AlreadyShown,
          modal2IsOpen: true
        });
        this.pauseVideo();
        this.openModal1();
      }
    }
  };

  generateCsvs = () => {
    console.log('your video has ended');
  };

  handleQuestion1(event) {
    console.log('you have chosen Q1', event.target.value);
    this.setState({
      answerChosenQ1: event.target.value
    });
  }

  handleQuestion2(event) {
    console.log('you have chosen Q2', event.target.value);
    this.setState({
      answerChosenQ2: event.target.value
    });
  }

  handleSubmit(event) {
    console.log('what is the handleSubmit event?', event);
  }

  render() {
    const {
      modalIsOpen,
      modal2IsOpen,
      answerChosenQ1,
      answerChosenQ2
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
        Answer: answerChosenQ1
      },
      {
        Subject: subjectId,
        Question: data.q2.name,
        Answer: answerChosenQ2
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
            width="70%"
            height="70%"
            src="../app/Bip_KC_Trim.mp4"
            controls
            type="video/mp4"
            onTimeUpdate={this.onTimeUpdate}
            onEnded={this.generateCsvs}
          >
            <track kind="captions" />
          </video>
          <div className={styles.btnGroup}>
            <button
              className={styles.btn}
              onClick={this.playVideo}
              data-tclass="btn"
              type="button"
            >
              Play
            </button>
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
          trigger={<Button onClick={this.openModal}>Show Modal</Button>}
          closeOnEscape={false}
          closeOnDimmerClick={false}
          onClose={this.closeModal}
        >
          <div className={styles.inner}>
            <Modal.Header>{data.q1.name}</Modal.Header>
            <Modal.Content className={styles.content}>
              <Modal.Description>
                <p>{data.q1.question}</p>

                <div>
                  <div className="radio">
                    <label htmlFor={data.q1.option1}>
                      <input
                        type="radio"
                        value="option1"
                        checked={answerChosenQ1 === 'option1'}
                        onChange={this.handleQuestion1}
                      />
                      {data.q1.option1}
                    </label>
                  </div>
                  <div className="radio">
                    <label htmlFor={data.q1.option2}>
                      <input
                        type="radio"
                        value="option2"
                        checked={answerChosenQ1 === 'option2'}
                        onChange={this.handleQuestion1}
                      />
                      {data.q1.option2}
                    </label>
                  </div>
                  <div className="radio">
                    <label htmlFor={data.q1.option3}>
                      <input
                        type="radio"
                        value="option3"
                        checked={answerChosenQ1 === 'option3'}
                        onChange={this.handleQuestion1}
                      />
                      {data.q1.option3}
                    </label>
                  </div>
                  <div className="radio">
                    <label htmlFor={data.q1.option4}>
                      <input
                        type="radio"
                        value="option4"
                        checked={answerChosenQ1 === 'option4'}
                        onChange={this.handleQuestion1}
                      />
                      {data.q1.option4}
                    </label>
                  </div>
                  <div className="radio">
                    <label htmlFor={data.q1.option5}>
                      <input
                        type="radio"
                        value="option5"
                        checked={answerChosenQ1 === 'option5'}
                        onChange={this.handleQuestion1}
                      />
                      {data.q1.option5}
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

        <Modal
          open={modal2IsOpen}
          className={styles.modal}
          closeOnEscape={false}
          closeOnDimmerClick={false}
          onClose={this.closeModal2}
        >
          <div className={styles.inner}>
            <Modal.Header>{data.q2.name}</Modal.Header>
            <Modal.Content className={styles.content}>
              <Modal.Description>
                <p>{data.q2.question}</p>

                <div>
                  <div className="radio">
                    <label htmlFor={data.q2.option1}>
                      <input
                        type="radio"
                        value="option1"
                        checked={answerChosenQ2 === 'option1'}
                        onChange={this.handleQuestion2}
                      />
                      {data.q2.option1}
                    </label>
                  </div>
                  <div className="radio">
                    <label htmlFor={data.q2.option2}>
                      <input
                        type="radio"
                        value="option2"
                        checked={answerChosenQ2 === 'option2'}
                        onChange={this.handleQuestion2}
                      />
                      {data.q2.option2}
                    </label>
                  </div>
                  <div className="radio">
                    <label htmlFor={data.q2.option3}>
                      <input
                        type="radio"
                        value="option3"
                        checked={answerChosenQ2 === 'option3'}
                        onChange={this.handleQuestion2}
                      />
                      {data.q2.option3}
                    </label>
                  </div>
                  <div className="radio">
                    <label htmlFor={data.q2.option4}>
                      <input
                        type="radio"
                        value="option4"
                        checked={answerChosenQ2 === 'option4'}
                        onChange={this.handleQuestion2}
                      />
                      {data.q2.option4}
                    </label>
                  </div>
                  <div className="radio">
                    <label htmlFor={data.q2.option5}>
                      <input
                        type="radio"
                        value="option5"
                        checked={answerChosenQ2 === 'option5'}
                        onChange={this.handleQuestion2}
                      />
                      {data.q2.option5}
                    </label>
                  </div>
                  <br />
                  <button onClick={this.closeModal2} type="submit">
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
