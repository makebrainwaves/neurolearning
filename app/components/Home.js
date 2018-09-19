// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import { Button, Modal } from 'semantic-ui-react';
import routes from '../constants/routes.json';
import styles from './Home.css';

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
        </div>
      </div>
    );
  }
}
