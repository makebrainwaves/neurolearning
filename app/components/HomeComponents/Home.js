// @flow
/* eslint class-methods-use-this: ["error", { "exceptMethods": ["selectAllElectrodes", "electrodesChosen"] }] */
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Dropdown,
  Segment,
  Icon,
  Input,
  Select,
  Container,
  Grid,
  Checkbox,
  Header
} from 'semantic-ui-react';
import { CSVLink } from 'react-csv';
import { isNil } from 'lodash';
import { Observable } from 'rxjs';
import routes from '../../constants/routes.json';
import styles from './Home.css';
import { createEEGObservable } from '../../utils/eeg';

import videoSrc1 from '../Bip_KC_Trim.mp4';
import videoSrc2 from '../Lipid_KZ.mp4';
import videoSrc3 from '../Bip_KC.mp4';
import videoSrc4 from '../Insulin_KZ.mp4';

type Props = {};

interface State {
  subjectId: string;
  experimenterId: string;
  firstVideo: string;
  firstVideoName: string;
  firstVideoType: string;
  secondVideo: string;
  secondVideoName: string;
  secondVideoType: string;
  thirdVideo: string;
  thirdVideoName: string;
  thirdVideoType: string;
  fourthVideo: string;
  fourthVideoName: string;
  fourthVideoType: string;
  rawEEGObservable: Observable<Object>;
  classifierType: string;
  electrodes: Object;
}

const time = new Date().getTime();
const date = new Date(time).toString();

// TODO: Move this into global constants
const CLASSIFIER_OPTIONS = [
  { key: 'thetaBeta', value: 'thetaBeta', text: 'Theta/Beta' },
  { key: 'alpha', value: 'alpha', text: 'Alpha' }
];

export default class Home extends Component<Props, State> {
  props: Props;
  state: State;
  handleSubjectId: Object => void;
  handleExperimenterId: Object => void;
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
  selectAllElectrodes: Object => void;
  electrodesChosen: Object => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      subjectId: '',
      experimenterId: '',
      firstVideo: videoSrc1,
      secondVideo: videoSrc2,
      thirdVideo: videoSrc3,
      fourthVideo: videoSrc4,
      firstVideoName: 'Niches',
      secondVideoName: 'Lipids',
      thirdVideoName: 'BIP',
      fourthVideoName: 'Insulin',
      firstVideoType: 'control',
      secondVideoType: 'control',
      thirdVideoType: 'control',
      fourthVideoType: 'control',
      rawEEGObservable: null,
      classifierType: 'alpha',
      electrodes: {
        P7: true,
        P4: true,
        Cz: true,
        Pz: true,
        P3: true,
        P8: true,
        O1: true,
        O2: true,
        T8: true,
        F8: true,
        C4: true,
        F4: true,
        Fp2: true,
        Fz: true,
        C3: true,
        F3: true,
        Fp1: true,
        T7: true,
        F7: true,
        Oz: true,
        PO4: true,
        FC6: true,
        FC2: true,
        AF4: true,
        CP6: true,
        CP2: true,
        CP1: true,
        CP5: true,
        FC1: true,
        FC5: true,
        AF3: true,
        PO3: true
      }
    };

    this.handleSubjectId = this.handleSubjectId.bind(this);
    this.handleExperimenterId = this.handleExperimenterId.bind(this);
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
    this.selectAllElectrodes = this.selectAllElectrodes.bind(this);
    this.electrodesChosen = this.electrodesChosen.bind(this);
  }

  getVideoName = value => {
    let videoName = '';
    if (
      value ===
      'http://localhost:1212/dist/0aaa1f67050e199bf65b346ed1e6bddf.mp4'
    ) {
      videoName = 'Niches';
    } else if (
      value ===
      'http://localhost:1212/dist/2ab8ce87a09d1d6b7303006753ca0251.mp4'
    ) {
      videoName = 'Lipids';
    } else if (
      value ===
      'http://localhost:1212/dist/0b30e12cf7d23e654b6d6c306bd13618.mp4'
    ) {
      videoName = 'BIP';
    } else if (
      value ===
      'http://localhost:1212/dist/a6e5c47df7b77a974f47cce5b094f90c.mp4'
    ) {
      videoName = 'Insulin';
    } else {
      videoName = 'Unknown';
    }
    return videoName;
  };

  handleFirstVideo(event: Object, data) {
    this.setState({
      firstVideo: data.value,
      firstVideoName: this.getVideoName(data.value)
    });
  }

  handleFirstVideoType(event: Object, data) {
    this.setState({ firstVideoType: data.value });
  }

  handleSecondVideo(event: Object, data) {
    this.setState({
      secondVideo: data.value,
      secondVideoName: this.getVideoName(data.value)
    });
  }

  handleSecondVideoType(event: Object, data) {
    this.setState({ secondVideoType: data.value });
  }

  handleThirdVideo(event: Object, data) {
    this.setState({
      thirdVideo: data.value,
      thirdVideoName: this.getVideoName(data.value)
    });
  }

  handleThirdVideoType(event: Object, data) {
    this.setState({ thirdVideoType: data.value });
  }

  handleFourthVideo(event: Object, data) {
    this.setState({
      fourthVideo: data.value,
      fourthVideoName: this.getVideoName(data.value)
    });
  }

  handleFourthVideoType(event: Object, data) {
    this.setState({ fourthVideoType: data.value });
  }

  handleSubjectId(event: Object) {
    this.setState({ subjectId: event.target.value });
  }

  handleExperimenterId(event: Object) {
    this.setState({ experimenterId: event.target.value });
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

  selectAllElectrodes() {
    const x = document.getElementsByTagName('Checkbox')[0];
    console.log('all class', x);
    x.checked = true;
  }

  electrodesChosen(electrodes) {
    let electrodesChosen = '';
    const entries = Object.entries(electrodes);
    for (const entry of entries) {
      if (entry[1] === true) {
        electrodesChosen = electrodesChosen.concat(`${entry[0]}, `);
      }
    }
    return electrodesChosen;
  }

  renderEEGConnector() {
    if (!isNil(this.state.rawEEGObservable)) {
      return (
        <div>
          Connected
          <Icon name="check" color="green" />
          <Select
            placeholder="Select classifier type"
            options={CLASSIFIER_OPTIONS}
            onChange={this.handleClassiferType}
          />
        </div>
      );
    }
    return (
      <Button primary onClick={this.handleConnectEEG}>
        Connect to EEG Stream
      </Button>
    );
  }

  render() {
    const {
      subjectId,
      experimenterId,
      firstVideo,
      firstVideoName,
      firstVideoType,
      secondVideo,
      secondVideoName,
      secondVideoType,
      thirdVideo,
      thirdVideoName,
      thirdVideoType,
      fourthVideo,
      fourthVideoName,
      fourthVideoType,
      rawEEGObservable,
      classifierType,
      electrodes
    } = this.state;

    const videoOptions = [
      { key: 'vid1', value: videoSrc1, text: 'Niches' },
      { key: 'vid2', value: videoSrc2, text: 'Lipids' },
      { key: 'vid3', value: videoSrc3, text: 'BIP' },
      { key: 'vid4', value: videoSrc4, text: 'Insulin' }
    ];

    const experimentOptions = [
      { key: 'control', value: 'control', text: 'control' },
      { key: 'experimental', value: 'experimental', text: 'experimental' }
    ];

    const electrodesChosen = this.electrodesChosen(electrodes);

    const subjectCsvData = [
      {
        DayTime: date,
        SubjectID: subjectId,
        ExperimenterID: experimenterId,
        SequenceNumber: '1',
        VideoName: firstVideoName,
        ExperimentType: firstVideoType,
        Classifier: classifierType,
        Electrodes: electrodesChosen
      },
      {
        DayTime: date,
        SubjectID: subjectId,
        ExperimenterID: experimenterId,
        SequenceNumber: '2',
        VideoName: secondVideoName,
        ExperimentType: secondVideoType,
        Classifier: classifierType
      },
      {
        DayTime: date,
        SubjectID: subjectId,
        ExperimenterID: experimenterId,
        SequenceNumber: '3',
        VideoName: thirdVideoName,
        ExperimentType: thirdVideoType,
        Classifier: classifierType
      },
      {
        DayTime: date,
        SubjectID: subjectId,
        ExperimenterID: experimenterId,
        SequenceNumber: '4',
        VideoName: fourthVideoName,
        ExperimentType: fourthVideoType,
        Classifier: classifierType
      }
    ];

    return (
      <Grid divided="vertically">
        <Grid.Row columns={1} className={styles.title}>
          <Grid.Column>
            <h2>Neurolearning Project</h2>
          </Grid.Column>
        </Grid.Row>

        <Grid.Row columns={2} divided>
          <Grid.Column>
            <h3>Step 1: Choose a video sequence:</h3>
            <Grid columns={2}>
              <Grid.Row>
                <Grid.Column>
                  1.
                  <Dropdown
                    placeholder="Select First Video"
                    onChange={this.handleFirstVideo}
                    selection
                    options={videoOptions}
                  />
                </Grid.Column>
                <Grid.Column>
                  <Dropdown
                    placeholder="Select Experiment Type"
                    value={firstVideoType}
                    onChange={this.handleFirstVideoType}
                    selection
                    options={experimentOptions}
                  />
                </Grid.Column>
              </Grid.Row>

              <Grid.Row>
                <Grid.Column>
                  2.
                  <Dropdown
                    placeholder="Select Second Video"
                    onChange={this.handleSecondVideo}
                    selection
                    options={videoOptions}
                  />
                </Grid.Column>
                <Grid.Column>
                  <Dropdown
                    placeholder="Select Experiment Type"
                    value={secondVideoType}
                    onChange={this.handleSecondVideoType}
                    selection
                    options={experimentOptions}
                  />
                </Grid.Column>
              </Grid.Row>

              <Grid.Row>
                <Grid.Column>
                  3.
                  <Dropdown
                    placeholder="Select Third Video"
                    onChange={this.handleThirdVideo}
                    selection
                    options={videoOptions}
                  />
                </Grid.Column>
                <Grid.Column>
                  <Dropdown
                    placeholder="Select Experiment Type"
                    value={thirdVideoType}
                    onChange={this.handleThirdVideoType}
                    selection
                    options={experimentOptions}
                  />
                </Grid.Column>
              </Grid.Row>

              <Grid.Row>
                <Grid.Column>
                  4.
                  <Dropdown
                    placeholder="Select Fourth Video"
                    onChange={this.handleFourthVideo}
                    selection
                    options={videoOptions}
                  />
                </Grid.Column>
                <Grid.Column>
                  <Dropdown
                    placeholder="Select Experiment Type"
                    value={fourthVideoType}
                    onChange={this.handleFourthVideoType}
                    selection
                    options={experimentOptions}
                  />
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </Grid.Column>

          <Grid.Column>
            <h3>Step 2: Select electrodes:</h3>
            <Grid divided="vertically">
              <Grid.Row columns={3} className={styles.labelPaddingBottom}>
                <Grid.Column>
                  <Checkbox
                    name="electrode"
                    defaultChecked
                    label="Select/Deselect All"
                    onChange={this.selectAllElectrodes}
                  />
                </Grid.Column>
                <Grid.Column>
                  <Checkbox label="Alpha only" />
                </Grid.Column>
                <Grid.Column>
                  <Checkbox label="Theta/Beta only" />
                </Grid.Column>
              </Grid.Row>

              <Grid.Row columns={4} className={styles.labelPaddingTop}>
                <Grid.Column>
                  <Grid.Row>
                    <Checkbox
                      label="P7"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      label="P4"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      label="Cz"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      label="Pz"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      label="P3"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      label="P8"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      label="O1"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      label="O2"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                </Grid.Column>

                <Grid.Column>
                  <Grid.Row>
                    <Checkbox
                      label="T8"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      label="F8"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      label="C4"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      label="F4"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      label="Fp2"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      label="Fz"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      label="C3"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      label="F3"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                </Grid.Column>

                <Grid.Column>
                  <Grid.Row>
                    <Checkbox
                      label="Fp1"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      label="T7"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      label="F7"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      label="Oz"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      label="PO4"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      label="FC6"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      label="FC2"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      label="AF4"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                </Grid.Column>

                <Grid.Column>
                  <Grid.Row>
                    <Checkbox
                      label="CP6"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      label="CP2"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      label="CP1"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      label="CP5"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      label="FC1"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      label="FC5"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      label="AF3"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      label="PO3"
                      defaultChecked
                      className={styles.electrode}
                    />
                  </Grid.Row>
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </Grid.Column>
        </Grid.Row>

        <Grid.Row columns={4}>
          <Grid.Column>
            Step 3: Enter subject ID
            <Input
              placeholder="Subject ID"
              type="text"
              value={subjectId}
              onChange={this.handleSubjectId}
            />
          </Grid.Column>

          <Grid.Column>
            Step 4: Enter experimenter ID
            <Input
              placeholder="Experimenter ID"
              type="text"
              value={experimenterId}
              onChange={this.handleExperimenterId}
            />
          </Grid.Column>

          <Grid.Column>
            Step 5: Connect to EEG Stream
            {this.renderEEGConnector()}
          </Grid.Column>

          <Grid.Column>
            Step 6: D/L subject info
            <Button secondary>
              <CSVLink data={subjectCsvData} filename={subjectId}>
                Download Subject Info
              </CSVLink>
            </Button>
          </Grid.Column>
        </Grid.Row>

        <Grid.Row columns={1}>
          <Grid.Column>
            <Button secondary>
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
          </Grid.Column>
        </Grid.Row>
      </Grid>
    );
  }
}
