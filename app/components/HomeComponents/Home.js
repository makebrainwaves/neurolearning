// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Dropdown,
  Segment,
  Icon,
  Input,
  Select
} from 'semantic-ui-react';
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
  classifierType: string;
}

// TODO: Move this into global constants
const CLASSIFIER_OPTIONS = [
  { key: 'thetaBeta', value: 'thetaBeta', text: 'Theta/Beta' },
  { key: 'alpha', value: 'alpha', text: 'Alpha' }
];

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
  handleConnectEEG: () => void;
  handleClassiferType: (Object, Object) => void;

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
      rawEEGObservable: null,
      classifierType: 'alpha'
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
    this.handleClassiferType = this.handleClassiferType.bind(this);
  }

  handleFirstVideo(event: Object, data) {
    this.setState({ firstVideo: data.value });
  }

  handleFirstVideoType(event: Object, data) {
    this.setState({ firstVideoType: data.value });
  }

  handleSecondVideo(event: Object, data) {
    this.setState({ secondVideo: data.value });
  }

  handleSecondVideoType(event: Object, data) {
    this.setState({ secondVideoType: data.value });
  }

  handleThirdVideo(event: Object, data) {
    this.setState({ thirdVideo: data.value });
  }

  handleThirdVideoType(event: Object, data) {
    this.setState({ thirdVideoType: data.value });
  }

  handleFourthVideo(event: Object, data) {
    this.setState({ fourthVideo: data.value });
  }

  handleFourthVideoType(event: Object, data) {
    this.setState({ fourthVideoType: data.value });
  }

  handleSubjectId(event: Object) {
    this.setState({ subjectId: event.target.value });
  }

  handleConnectEEG() {
    try {
      const eegObservable = createEEGObservable();
      if (!isNil(eegObservable)) {
        this.setState({ rawEEGObservable: eegObservable });
      }
    } catch (e) {
      console.log('Error in handleConnectEEG: ', e);
    }
  }

  handleClassiferType(event: Object, data: Object) {
    console.log(data);
    this.setState({ classifierType: data.value });
  }

  renderEEGConnector() {
    if (!isNil(this.state.rawEEGObservable)) {
      return (
        <Segment basic>
          Connected
          <Icon name="check" color="green" />
          <Select
            placeholder="Select classifier type"
            options={CLASSIFIER_OPTIONS}
            onChange={this.handleClassiferType}
          />
        </Segment>
      );
    }
    return (
      <Segment basic>
        <Button primary onClick={this.handleConnectEEG}>
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
      rawEEGObservable,
      classifierType
    } = this.state;

    const videoOptions = [
      { key: 'vid1', value: 'vid1', text: 'vid1' },
      { key: 'vid2', value: 'vid2', text: 'vid2' },
      { key: 'vid3', value: 'vid3', text: 'vid3' },
      { key: 'vid4', value: 'vid4', text: 'vid4' }
    ];

    const experimentOptions = [
      { key: 'control', value: 'control', text: 'control' },
      { key: 'experimental', value: 'experimental', text: 'experimental' }
    ];

    return (
      <div className={styles.container} data-tid="container">
        <h2>Neurolearning Project</h2>

        <div>
          <p>Welcome</p>
        </div>

        <div>
          <p>Please enter a subject ID, then choose a video set:</p>
        </div>

        <Input
          placeholder="Subject ID"
          type="text"
          value={subjectId}
          onChange={this.handleSubjectId}
        />

        <div className={styles.selectionContainer}>
          <span className={styles.selectionText}>Play first:</span>
          <Dropdown
            placeholder="Select First Video"
            value={firstVideo}
            onChange={this.handleFirstVideo}
            selection
            options={videoOptions}
          />
          <Dropdown
            placeholder="Select Experiment Type"
            value={firstVideoType}
            onChange={this.handleFirstVideoType}
            selection
            options={experimentOptions}
          />
        </div>

        <div className={styles.selectionContainer}>
          <span className={styles.selectionText}>Play second:</span>
          <Dropdown
            placeholder="Select Second Video"
            value={secondVideo}
            onChange={this.handleSecondVideo}
            selection
            options={videoOptions}
          />
          <Dropdown
            placeholder="Select Experiment Type"
            value={secondVideoType}
            onChange={this.handleSecondVideoType}
            selection
            options={experimentOptions}
          />
        </div>

        <div className={styles.selectionContainer}>
          <span className={styles.selectionText}>Play third:</span>
          <Dropdown
            placeholder="Select Third Video"
            value={thirdVideo}
            onChange={this.handleThirdVideo}
            selection
            options={videoOptions}
          />
          <Dropdown
            placeholder="Select Experiment Type"
            value={thirdVideoType}
            onChange={this.handleThirdVideoType}
            selection
            options={experimentOptions}
          />
        </div>

        <div className={styles.selectionContainer}>
          <span className={styles.selectionText}>Play fourth:</span>
          <Dropdown
            placeholder="Select Fourth Video"
            value={fourthVideo}
            onChange={this.handleFourthVideo}
            selection
            options={videoOptions}
          />
          <Dropdown
            placeholder="Select Experiment Type"
            value={fourthVideoType}
            onChange={this.handleFourthVideoType}
            selection
            options={experimentOptions}
          />
        </div>

        <div className={styles.submitButton}>
          <Button>
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
                  subjectId,
                  rawEEGObservable,
                  classifierType
                }
              }}
            >
              SUBMIT
            </Link>
          </Button>
        </div>
        {this.renderEEGConnector()}
      </div>
    );
  }
}
