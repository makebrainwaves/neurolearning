// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import routes from '../constants/routes.json';
import styles from './Home.css';

type Props = {};

export default class Home extends Component<Props> {
  props: Props;

  render() {
    return (
      <div className={styles.container} data-tid="container">
        <h3>Neurolearning Video Container</h3>
        <video width="70%" height="70%" src="../app/Bip_KC_Trim.mp4" controls>
          <track kind="captions" {...Props} />
        </video>
        <div>
          <Link to={routes.COUNTER}>to Counter</Link>
        </div>
      </div>
    );
  }
}
