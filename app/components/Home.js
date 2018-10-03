// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import { Button, Modal } from 'semantic-ui-react';
import routes from '../constants/routes.json';
import styles from './Home.css';
import {
  resolveLSLStreams,
  createStreamInlet,
  createEEGObservable
} from '../utils/eeg';

type Props = {};

export default class Home extends Component<Props> {
  props: Props;

  state = { openModal: false };

  close = () => this.setState({ openModal: false });

  open = () => this.setState({ openModal: true });

  render() {
    const { openModal } = this.state;

    return (
      <div className={styles.container} data-tid="container">
        <h3>Neurolearning</h3>
        <h3>Video Container</h3>
        <div>
          <video
            className={styles.video}
            width="70%"
            height="70%"
            src="../app/Bip_KC_Trim.mp4"
            controls
          >
            <track kind="captions" {...Props} />
          </video>
        </div>

        <Modal
          open={openModal}
          className={styles.modal}
          trigger={<Button onClick={this.open}>Show Modal</Button>}
          closeOnEscape={false}
          closeOnDimmerClick={false}
          onClose={this.close}
        >
          <div className={styles.inner}>
            <Modal.Header>Popup Question #1</Modal.Header>
            <Modal.Content className={styles.content}>
              <Modal.Description>
                <p>
                  Which one of the following is NOT a physical characteristic of
                  primates?
                </p>

                <form>
                  <div className="radio">
                    <label htmlFor="locomotion">
                      <input type="radio" value="option1" />
                      locomotion
                    </label>
                  </div>
                  <div className="radio">
                    <label htmlFor="nose">
                      <input type="radio" value="option2" />
                      nose
                    </label>
                  </div>
                  <div className="radio">
                    <label htmlFor="humor">
                      <input type="radio" value="option3" />
                      humor
                    </label>
                  </div>
                  <div className="radio">
                    <label htmlFor="eyesight">
                      <input type="radio" value="option3" />
                      eyesight
                    </label>
                  </div>
                  <br />
                  <Button onClick={this.close} negative>
                    I dont know
                  </Button>
                </form>
              </Modal.Description>
            </Modal.Content>
          </div>
        </Modal>
        <div>
          <Link to={routes.COUNTER}>to Counter</Link>
          <Button
            onClick={() => {
              // This is our guy! Eventually you'll want to store this in redux so you can access it anywhere
              const eegObservable = createEEGObservable();
              let counter = 0.0;
              // All you have to do to get data is subscribe to this observable like this
              eegObservable.subscribe(eegData => {
                console.log(
                  'Received ',
                  eegData.data[0].length,
                  ' samples at  ',
                  eegData.timestamps[0],
                  '. Sampling rate = ',
                  eegData.data[0].length / (eegData.timestamps[0] - counter)
                );
                counter = eegData.timestamps[0];
              });
            }}
          >
            Test EEG
          </Button>
        </div>
      </div>
    );
  }
}
