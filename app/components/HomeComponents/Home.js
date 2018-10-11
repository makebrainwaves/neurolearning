// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import routes from '../../constants/routes.json';
import styles from './Home.css';

type Props = {};

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
}

export default class Home extends Component<Props> {
  props: Props;

  state: State;

  constructor(props) {
    super(props);
    this.state = {
      subjectId: '',
      firstVideo: 'vid1',
      secondVideo: 'vid2',
      thirdVideo: 'vid3',
      fourthVideo: 'vid4',
      firstVideoType: 'control',
      secondVideoType: 'control',
      thirdVideoType: 'control',
      fourthVideoType: 'control'
    };
    this.handleSubjectId = this.handleSubjectId.bind(this);
    this.handleFirstVideo = this.handleFirstVideo.bind(this);
    this.handleFirstVideoType = this.handleFirstVideoType.bind(this);
    this.handleSecondVideo = this.handleSecondVideo.bind(this);
    this.handleSecondVideoType = this.handleSecondVideoType.bind(this);
    this.handleThirdVideo = this.handleThirdVideo.bind(this);
    this.handleThirdVideoType = this.handleThirdVideoType.bind(this);
    this.handleFourthVideo = this.handleFourthVideo.bind(this);
    this.handleFourthVideoType = this.handleFourthVideoType.bind(this);
  }

  handleFirstVideo(event) {
    this.setState({ firstVideo: event.target.value });
  }

  handleFirstVideoType(event) {
    this.setState({ firstVideoType: event.target.value });
  }

  handleSecondVideo(event) {
    this.setState({ secondVideo: event.target.value });
  }

  handleSecondVideoType(event) {
    this.setState({ secondVideoType: event.target.value });
  }

  handleThirdVideo(event) {
    this.setState({ thirdVideo: event.target.value });
  }

  handleThirdVideoType(event) {
    this.setState({ thirdVideoType: event.target.value });
  }

  handleFourthVideo(event) {
    this.setState({ fourthVideo: event.target.value });
  }

  handleFourthVideoType(event) {
    this.setState({ fourthVideoType: event.target.value });
  }

  handleSubjectId(event) {
    this.setState({ subjectId: event.target.value });
  }

  render() {
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
    } = this.state;

    return (
      <div className={styles.container} data-tid="container">
        <h2>Neurolearning Project</h2>

        <div>
          <p>Welcome</p>
        </div>

        <div>
          <p>Please enter a subject ID, then choose a video set:</p>
        </div>

        <div>
          <p>
            <input
              placeholder="Subject ID"
              type="text"
              value={subjectId}
              onChange={this.handleSubjectId}
            />
          </p>
        </div>

        <div className={styles.selectionContainer}>
          <div className={styles.selection}>
            <span className={styles.selectionText}>Play first:</span>
            <div className={styles.addValue}>
              <select value={firstVideo} onChange={this.handleFirstVideo}>
                <option value="vid1">Video 1</option>
                <option value="vid2">Video 2</option>
                <option value="vid3">Video 3</option>
                <option value="vid4">Video 4</option>
              </select>
              <select
                value={firstVideoType}
                onChange={this.handleFirstVideoType}
              >
                <option value="control">Control</option>
                <option value="experimental">Experimental</option>
              </select>
            </div>
          </div>

          <div className={styles.selection}>
            <span className={styles.selectionText}>Play second:</span>
            <div className={styles.addValue}>
              <select value={secondVideo} onChange={this.handleSecondVideo}>
                <option value="vid1">Video 1</option>
                <option value="vid2">Video 2</option>
                <option value="vid3">Video 3</option>
                <option value="vid4">Video 4</option>
              </select>
              <select
                value={secondVideoType}
                onChange={this.handleSecondVideoType}
              >
                <option value="control">Control</option>
                <option value="experimental">Experimental</option>
              </select>
            </div>
          </div>

          <div className={styles.selection}>
            <span className={styles.selectionText}>Play third:</span>
            <div className={styles.addValue}>
              <select value={thirdVideo} onChange={this.handleThirdVideo}>
                <option value="vid1">Video 1</option>
                <option value="vid2">Video 2</option>
                <option value="vid3">Video 3</option>
                <option value="vid4">Video 4</option>
              </select>
              <select
                value={thirdVideoType}
                onChange={this.handleThirdVideoType}
              >
                <option value="control">Control</option>
                <option value="experimental">Experimental</option>
              </select>
            </div>
          </div>

          <div className={styles.selection}>
            <span className={styles.selectionText}>Play fourth:</span>
            <div className={styles.addValue}>
              <select value={fourthVideo} onChange={this.handleFourthVideo}>
                <option value="vid1">Video 1</option>
                <option value="vid2">Video 2</option>
                <option value="vid3">Video 3</option>
                <option value="vid4">Video 4</option>
              </select>
              <select
                value={fourthVideoType}
                onChange={this.handleFourthVideoType}
              >
                <option value="control">Control</option>
                <option value="experimental">Experimental</option>
              </select>
            </div>
          </div>
        </div>

        <div className={styles.submitButton}>
          <Link
            to={{
              pathname: routes.VIDEOSET,
              state: {
                firstVideo,
                firstVideoType,
                secondVideo,
                secondVideoType,
                thirdVideo,
                thirdVideoType,
                fourthVideo,
                fourthVideoType,
                subjectId
              }
            }}
          >
            SUBMIT
          </Link>
        </div>
      </div>
    );
  }
}
