// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Button, Modal } from 'semantic-ui-react';
import styles from './VideoSet.css';
import routes from '../constants/routes.json';

type Props = {
  videoset: number
};

export default class VideoSet extends Component<Props> {
  props: Props;

  state = { openModal: false };

  close = () => this.setState({ openModal: false });

  open = () => this.setState({ openModal: true });

  render() {
    const { openModal } = this.state;

    return (
      <div className={styles.videoContainer}>
        <div className={styles.backButton} data-tid="backButton">
          <Link to={routes.HOME}>
            <i className="fa fa-arrow-left fa-3x" />
          </Link>
        </div>

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
        <div className={styles.btnGroup}>
          <button className={styles.btn} data-tclass="btn" type="button">
            Play
          </button>
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
      </div>
    );
  }
}
