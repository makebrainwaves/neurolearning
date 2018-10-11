// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Button, Segment, Icon } from 'semantic-ui-react';
import { isNil } from 'lodash';
import { Observable } from 'rxjs';
import routes from '../../constants/routes.json';
import styles from './Home.css';
import { createEEGObservable } from '../../utils/eeg';

type Props = {};

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
  rawEEGObservable: Observable<Object>;
}

export default class Home extends Component<Props, State> {
  props: Props;
  state: State;
  handleSubjectId: Object => void;
  handleFirstVideo: Object => void;
  handleFirstVideoType: Object => void;
  handleSecondVideo: Object => void;
  handleSecondVideoType: Object => void;
  handleThirdVideo: Object => void;
  handleThirdVideoType: Object => void;
  handleFourthVideo: Object => void;
  handleFourthVideoType: Object => void;

  constructor(props: Props) {
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
      fourthVideoType: 'control',
      rawEEGObservable: null
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
    this.handleConnectEEG = this.handleConnectEEG.bind(this);
  }

  handleFirstVideo(event: Object) {
    this.setState({ firstVideo: event.target.value });
  }

  handleFirstVideoType(event: Object) {
    this.setState({ firstVideoType: event.target.value });
  }

  handleSecondVideo(event: Object) {
    this.setState({ secondVideo: event.target.value });
  }

  handleSecondVideoType(event: Object) {
    this.setState({ secondVideoType: event.target.value });
  }

  handleThirdVideo(event: Object) {
    this.setState({ thirdVideo: event.target.value });
  }

  handleThirdVideoType(event: Object) {
    this.setState({ thirdVideoType: event.target.value });
  }

  handleFourthVideo(event: Object) {
    this.setState({ fourthVideo: event.target.value });
  }

  handleFourthVideoType(event: Object) {
    this.setState({ fourthVideoType: event.target.value });
  }

  handleSubjectId(event: Object) {
    this.setState({ subjectId: event.target.value });
  }

  handleConnectEEG() {
    try {
      const eegObservable = createEEGObservable();
      if (!isNil(eegObservable)) {
        this.setState({ rawEEGObservable: eegObservable });
        eegObservable.subscribe(eegData => {
          console.log(eegData.data);
        });
      }
    } catch (e) {
      console.log('Error in handleConnectEEG: ', e);
    }
  }

  renderEEGConnector() {
    if (!isNil(this.state.rawEEGObservable)) {
      return (
        <Segment basic>
          Connected
          <Icon name="check" color="green" />
        </Segment>
      );
    }
    return (
      <Segment basic>
        <Button primary fluid onClick={this.handleConnectEEG}>
          Connect to EEG Stream
        </Button>
      </Segment>
    );
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
      fourthVideoType,
      rawEEGObservable
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
          {this.renderEEGConnector()}
        </div>
      </div>
    );
  }
}
