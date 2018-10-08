/* eslint class-methods-use-this: ["error", { "exceptMethods": ["handleSubmit"] }] */
// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Button, Modal } from 'semantic-ui-react';
import { CSVLink } from 'react-csv';
import styles from './VideoSet.css';
import routes from '../constants/routes.json';
import * as data from '../questions/questions.json';

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
  questionAlreadyShown: boolean;
  answer1: string;
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
    this.handleSubmit = this.handleSubmit.bind(this);

    this.state = {
      isRunning: 'false',
      questionAlreadyShown: 'false',
      answer1: 'option5'
    };
  }

  state = {
    modalIsOpen: false,
    isRunning: false,
    questionAlreadyShown: false
  };

  closeModal = () => this.setState({ modalIsOpen: false });

  openModal = () =>
    this.setState({
      modalIsOpen: true
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
    const { questionAlreadyShown, answer1, isRunning } = this.state;
    const vidCurrTime = document.getElementById('vidID').currentTime;
    console.log('isRunning', isRunning);
    console.log('questionAlreadyShown', questionAlreadyShown);
    console.log('current time', vidCurrTime);
    console.log('state of answer 1', answer1);

    if (questionAlreadyShown) {
      if (vidCurrTime >= controlPauseTime) {
        this.setState({ questionAlreadyShown: !questionAlreadyShown });
        this.pauseVideo();
        this.openModal();
      }
    }
  };

  generateCsvs = () => {
    console.log('your video has ended');
  };

  handleQuestion1(event) {
    console.log('you have chosen', event.target.value);
    this.setState({
      answer1: event.target.value
    });
  }

  handleSubmit(event) {
    console.log('what is the handleSubmit event?', event);
  }

  render() {
    const { modalIsOpen, answer1 } = this.state;
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
                        checked={answer1 === 'option1'}
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
                        checked={answer1 === 'option2'}
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
                        checked={answer1 === 'option3'}
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
                        checked={answer1 === 'option4'}
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
                        checked={answer1 === 'option5'}
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
