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
        <h2>Neurolearning</h2>
        <h3>Video Container</h3>
        <Link to={routes.COUNTER}>to Counter</Link>
      </div>
    );
  }
}
