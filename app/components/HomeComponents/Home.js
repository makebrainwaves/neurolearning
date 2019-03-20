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
import $ from 'jquery';
import { CSVLink } from 'react-csv';
import { isNil } from 'lodash';
import { Observable } from 'rxjs';
import routes from '../../constants/routes.json';
import styles from './Home.css';
import { createEEGObservable } from '../../utils/eeg';

import videoSrc1 from '../Biomass.mp4';
import videoSrc2 from '../Fuel.mp4';
import videoSrc3 from '../Combustion_new_final.mp4';
import videoSrc4 from '../Photosynth.mp4';

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
  electrodesChosen: string[];
}

const expTypeWidth = '40%';
const time = new Date().getTime();
const date = new Date(time).toString();

// TODO: Move this into global constants
const CLASSIFIER_OPTIONS = [
  { key: 'alpha', value: 'alpha', text: 'Alpha' },
  { key: 'thetaBeta', value: 'thetaBeta', text: 'Theta/Beta' }
];

const ELECTRODES = [
  { id: 0, value: 'P7', checked: false },
  { id: 1, value: 'P4', checked: false },
  { id: 2, value: 'Cz', checked: false },
  { id: 3, value: 'Pz', checked: false },
  { id: 4, value: 'P3', checked: false },
  { id: 5, value: 'P8', checked: false },
  { id: 6, value: 'O1', checked: false },
  { id: 7, value: 'O2', checked: false },
  { id: 8, value: 'T8', checked: false },
  { id: 9, value: 'F8', checked: false },
  { id: 10, value: 'C4', checked: false },
  { id: 11, value: 'F4', checked: false },
  { id: 12, value: 'Fp2', checked: false },
  { id: 13, value: 'Fz', checked: false },
  { id: 14, value: 'C3', checked: false },
  { id: 15, value: 'F3', checked: false },
  { id: 16, value: 'Fp1', checked: false },
  { id: 17, value: 'T7', checked: false },
  { id: 18, value: 'F7', checked: false },
  { id: 19, value: 'Oz', checked: false },
  { id: 20, value: 'PO4', checked: false },
  { id: 21, value: 'FC6', checked: false },
  { id: 22, value: 'FC2', checked: false },
  { id: 23, value: 'AF4', checked: false },
  { id: 24, value: 'CP6', checked: false },
  { id: 25, value: 'CP2', checked: false },
  { id: 26, value: 'CP1', checked: false },
  { id: 27, value: 'CP5', checked: false },
  { id: 28, value: 'FC1', checked: false },
  { id: 29, value: 'FC5', checked: false },
  { id: 30, value: 'AF3', checked: false },
  { id: 31, value: 'PO3', checked: false }
];

$(document).ready(() => {
  $('#nomineeInfo').on('change', '.positionTypes', () => {
    // Get the selected options of all positions
    const allSelected = $('.positionTypes')
      .map(function() {
        return $(this).val();
      })
      .get();

    // set all enabled
    $('.positionTypes option').removeAttr('disabled');

    // Disable selected options in other positions
    $(".positionTypes option:not(:selected):not([value='0'])").each(function() {
      if ($.inArray($(this).val(), allSelected) !== -1) {
        $(this).attr('disabled', true);
      }
    });
  });
});

export default class Home extends Component<Props, State> {
  props: Props;
  state: State;
  handleSubjectId: Object => void;
  handleExperimenterId: Object => void;
  handleVideo: Object => void;
  handleExperimentType: Object => void;
  handleConnectEEG: () => void;
  handleClassiferType: (Object, Object) => void;
  handleCreateWorkspace: () => void;
  selectAllElectrodes: Object => void;
  electrodesChosen: () => string[];

  constructor(props: Props) {
    super(props);

    this.state = {
      subjectId: '',
      experimenterId: '',
      firstVideo: videoSrc1,
      secondVideo: videoSrc2,
      thirdVideo: videoSrc3,
      fourthVideo: videoSrc4,
      firstVideoName: 'Biomass',
      secondVideoName: 'Fuel',
      thirdVideoName: 'Gas',
      fourthVideoName: 'Photosynth',
      firstVideoType: 'control',
      secondVideoType: 'control',
      thirdVideoType: 'control',
      fourthVideoType: 'control',
      rawEEGObservable: null,
      classifierType: 'alpha',
      electrodes: ELECTRODES
    };
    this.handleSubjectId = this.handleSubjectId.bind(this);
    this.handleExperimenterId = this.handleExperimenterId.bind(this);
    this.handleVideo = this.handleVideo.bind(this);
    this.handleExperimentType = this.handleExperimentType.bind(this);
    this.handleConnectEEG = this.handleConnectEEG.bind(this);
    this.handleClassiferType = this.handleClassiferType.bind(this);
    this.selectAllElectrodes = this.selectAllElectrodes.bind(this);
    this.electrodesChosen = this.electrodesChosen.bind(this);
  }

  getVideoName = value => {
    let videoName = '';
    if (
      value ===
      'http://localhost:1212/dist/bab08a1b5e70073aa05bda2923a835f2.mp4'
    ) {
      videoName = 'Biomass';
    } else if (
      value ===
      'http://localhost:1212/dist/bcc000d9e3048f485822cc246c74a0e5.mp4'
    ) {
      videoName = 'Fuel';
    } else if (
      value ===
      'http://localhost:1212/dist/8eaa1fc371098f3407941ac9ef7b99b2.mp4'
    ) {
      videoName = 'Gas';
    } else if (
      value ===
      'http://localhost:1212/dist/adf2b55277c0e5538ff5ba60a1f4a756.mp4'
    ) {
      videoName = 'Photosynth';
    } else {
      videoName = 'Unknown';
    }
    return videoName;
  };

  handleVideo(event: Object) {
    if (event.target.value === '1') {
      this.setState({
        [event.target.id.slice(0, -4)]: videoSrc1, // thirdVideo = localhost...
        [event.target.id]: 'biomass' // thirdVideoName = Gas
      });
    }
    if (event.target.value === '2') {
      this.setState({
        [event.target.id.slice(0, -4)]: videoSrc2, // thirdVideo = localhost...
        [event.target.id]: 'fuel' // thirdVideoName = Gas
      });
    }
    if (event.target.value === '3') {
      this.setState({
        [event.target.id.slice(0, -4)]: videoSrc3, // thirdVideo = localhost...
        [event.target.id]: 'gas' // thirdVideoName = Gas
      });
    }
    if (event.target.value === '4') {
      this.setState({
        [event.target.id.slice(0, -4)]: videoSrc4, // thirdVideo = localhost...
        [event.target.id]: 'photosynth' // thirdVideoName = Gas
      });
    }
  }

  handleExperimentType(event: Object, data) {
    this.setState({ [data.name]: data.value });
  }

  handleSubjectId(event: Object) {
    this.setState({ subjectId: event.target.value });
  }

  handleExperimenterId(event: Object) {
    this.setState({ experimenterId: event.target.value });
  }

  handleConnectEEG() {
    const selectedChannels = this.state.electrodes
      .filter(electrode => electrode.checked)
      .map(electrode => electrode.id);
    // console.log('selectedChannels', selectedChannels);
    try {
      const eegObservable = createEEGObservable(250, selectedChannels);
      if (!isNil(eegObservable)) {
        this.setState({ rawEEGObservable: eegObservable });
      }
      // eegObservable.subscribe(console.log);
    } catch (e) {
      console.log('Error in handleConnectEEG: ', e);
    }
  }

  handleClassiferType(event: Object, data: Object) {
    console.log('classifier data from home', data);
    this.setState({ classifierType: data.value });
  }

  selectAllElectrodes() {
    const x = document.getElementsByTagName('Checkbox')[0];
    console.log('all class', x);
    x.checked = true;
  }

  selectElectrode = (event: Object, data) => {
    const electrodes = this.state.electrodes;
    electrodes.forEach(electrode => {
      if (electrode.value === data.label) {
        electrode.checked = data.checked;
      }
    });
    this.setState({ electrodes });
  };

  electrodesChosen() {
    const electrodesChosen = this.state.electrodes
      .filter(electrode => electrode.checked)
      .map(electrode => electrode.value);

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
      { key: 'vid0', value: 0, text: 'Select Video' },
      { key: 'vid1', value: videoSrc1, text: 'Biomass' },
      { key: 'vid2', value: videoSrc2, text: 'Fuel' },
      { key: 'vid3', value: videoSrc3, text: 'Gas' },
      { key: 'vid4', value: videoSrc4, text: 'Photosynth' }
    ];

    const experimentOptions = [
      { key: 'control', value: 'control', text: 'C' },
      { key: 'experimental', value: 'experimental', text: 'E' }
    ];

    const electrodesChosen = this.electrodesChosen();

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
              <Grid.Column>
                <div id="nomineeInfo">
                  <div>
                    1.
                    <select
                      className="ui selection dropdown positionTypes"
                      onChange={this.handleVideo}
                      id="firstVideoName"
                    >
                      <option value="0">Select First Video</option>
                      <option value="1">Biomass</option>
                      <option value="2">Fuel</option>
                      <option value="3">Gas</option>
                      <option value="4">Photosynth</option>
                    </select>
                  </div>
                  <div>
                    2.
                    <select
                      className="ui selection dropdown positionTypes"
                      onChange={this.handleVideo}
                      id="secondVideoName"
                    >
                      <option value="0">Select Second Video</option>
                      <option value="1">Biomass</option>
                      <option value="2">Fuel</option>
                      <option value="3">Gas</option>
                      <option value="4">Photosynth</option>
                    </select>
                  </div>
                  <div>
                    3.
                    <select
                      className="ui selection dropdown positionTypes"
                      onChange={this.handleVideo}
                      id="thirdVideoName"
                    >
                      <option value="0">Select Third Video</option>
                      <option value="1">Biomass</option>
                      <option value="2">Fuel</option>
                      <option value="3">Gas</option>
                      <option value="4">Photosynth</option>
                    </select>
                  </div>
                  <div>
                    4.
                    <select
                      className="ui selection dropdown positionTypes"
                      onChange={this.handleVideo}
                      id="fourthVideoName"
                    >
                      <option value="0">Select Fourth Video</option>
                      <option value="1">Biomass</option>
                      <option value="2">Fuel</option>
                      <option value="3">Gas</option>
                      <option value="4">Photosynth</option>
                    </select>
                  </div>
                </div>
              </Grid.Column>

              <Grid.Column style={{ width: expTypeWidth }}>
                <Dropdown
                  placeholder="Select Experiment Type"
                  name="firstVideoType"
                  value={firstVideoType}
                  onChange={this.handleExperimentType}
                  selection
                  options={experimentOptions}
                />

                <Dropdown
                  placeholder="Select Experiment Type"
                  name="secondVideoType"
                  value={secondVideoType}
                  onChange={this.handleExperimentType}
                  selection
                  options={experimentOptions}
                />

                <Dropdown
                  placeholder="Select Experiment Type"
                  name="thirdVideoType"
                  value={thirdVideoType}
                  onChange={this.handleExperimentType}
                  selection
                  options={experimentOptions}
                />

                <Dropdown
                  placeholder="Select Experiment Type"
                  name="fourthVideoType"
                  value={fourthVideoType}
                  onChange={this.handleExperimentType}
                  selection
                  options={experimentOptions}
                />
              </Grid.Column>
            </Grid>
          </Grid.Column>

          <Grid.Column>
            <h3>Step 2: Select electrodes:</h3>
            <Grid divided="vertically">
              <Grid.Row columns={4} className={styles.labelPaddingTop}>
                <Grid.Column>
                  <Grid.Row>
                    <Checkbox
                      id="1"
                      label="P7"
                      value={electrodes.P7}
                      name="P7"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      id="2"
                      label="P4"
                      value={electrodes.P4}
                      name="P4"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      id="3"
                      label="Cz"
                      value={electrodes.Cz}
                      name="Cz"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      id="4"
                      label="Pz"
                      value={electrodes.Pz}
                      name="Pz"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      id="5"
                      label="P3"
                      value={electrodes.P3}
                      name="P3"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      id="6"
                      label="P8"
                      value={electrodes.P8}
                      name="P8"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      id="7"
                      label="O1"
                      value={electrodes.O1}
                      name="O1"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      id="8"
                      label="O2"
                      value={electrodes.O2}
                      name="O2"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
                    />
                  </Grid.Row>
                </Grid.Column>

                <Grid.Column>
                  <Grid.Row>
                    <Checkbox
                      id="9"
                      label="T8"
                      value={electrodes.T8}
                      name="T8"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      id="10"
                      label="F8"
                      value={electrodes.F8}
                      name="F8"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      id="11"
                      label="C4"
                      value={electrodes.C4}
                      name="C4"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      id="12"
                      label="F4"
                      value={electrodes.F4}
                      name="F4"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      id="13"
                      label="Fp2"
                      value={electrodes.Fp2}
                      name="Fp2"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      id="14"
                      label="Fz"
                      value={electrodes.Fz}
                      name="Fz"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      id="15"
                      label="C3"
                      value={electrodes.C3}
                      name="C3"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      id="16"
                      label="F3"
                      value={electrodes.F3}
                      name="F3"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
                    />
                  </Grid.Row>
                </Grid.Column>

                <Grid.Column>
                  <Grid.Row>
                    <Checkbox
                      id="17"
                      label="Fp1"
                      value={electrodes.Fp1}
                      name="Fp1"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      id="18"
                      label="T7"
                      value={electrodes.T7}
                      name="T7"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      id="19"
                      label="F7"
                      value={electrodes.F7}
                      name="F7"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      id="20"
                      label="Oz"
                      value={electrodes.Oz}
                      name="Oz"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      id="21"
                      label="PO4"
                      value={electrodes.PO4}
                      name="PO4"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      id="22"
                      label="FC6"
                      value={electrodes.FC6}
                      name="FC6"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      id="23"
                      label="FC2"
                      value={electrodes.FC2}
                      name="FC2"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      id="24"
                      label="AF4"
                      value={electrodes.AF4}
                      name="AF4"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
                    />
                  </Grid.Row>
                </Grid.Column>

                <Grid.Column>
                  <Grid.Row>
                    <Checkbox
                      id="25"
                      label="CP6"
                      value={electrodes.CP6}
                      name="CP6"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      id="26"
                      label="CP2"
                      value={electrodes.CP2}
                      name="CP2"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      id="27"
                      label="CP1"
                      value={electrodes.CP1}
                      name="CP1"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      id="28"
                      label="CP5"
                      value={electrodes.CP5}
                      name="CP5"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      id="29"
                      label="FC1"
                      value={electrodes.FC1}
                      name="FC1"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      id="30"
                      label="FC5"
                      value={electrodes.FC5}
                      name="FC5"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      id="31"
                      label="AF3"
                      value={electrodes.AF3}
                      name="AF3"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
                    />
                  </Grid.Row>
                  <Grid.Row>
                    <Checkbox
                      id="32"
                      label="PO3"
                      value={electrodes.PO3}
                      name="PO3"
                      className={styles.electrode}
                      onChange={this.selectElectrode}
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

          <Grid.Column className={styles.submitButton}>
            {electrodesChosen.length !== 0 &&
              subjectId &&
              experimenterId && (
                <Button secondary>
                  <Link
                    to={{
                      pathname: routes.VIDEOSET,
                      state: {
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
                        subjectId,
                        experimenterId,
                        rawEEGObservable,
                        classifierType,
                        electrodesChosen
                      }
                    }}
                  >
                    SUBMIT
                  </Link>
                </Button>
              )}
          </Grid.Column>
        </Grid.Row>

        <Grid.Row columns={1}>
          <Grid.Column>
            {!subjectId && (
              <h3 className={styles.electrodeWarning}>
                Please enter a subject ID to continue.
              </h3>
            )}
            {!experimenterId && (
              <h3 className={styles.electrodeWarning}>
                Please enter an experimenter ID to continue.
              </h3>
            )}
            {electrodesChosen.length === 0 && (
              <h3 className={styles.electrodeWarning}>
                Please select at least one electrode to continue.
              </h3>
            )}
          </Grid.Column>
        </Grid.Row>
      </Grid>
    );
  }
}
