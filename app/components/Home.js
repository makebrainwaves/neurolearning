// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import ReactPlayer from 'react-player';
import routes from '../constants/routes.json';
import styles from './Home.css';

type Props = {};

export default class Home extends Component<Props> {
  props: Props;

  render() {
    return (
      <div className={styles.container} data-tid="container">
        <h3>Neurolearning</h3>
        <h3>Video Container</h3>
        <ReactPlayer
          url="https://www.youtube.com/watch?v=_3x6_doymmw"
          playing
        />
        <Link to={routes.COUNTER}>to Counter</Link>
      </div>
    );
  }
}
