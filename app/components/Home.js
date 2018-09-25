// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Input } from 'semantic-ui-react';
import routes from '../constants/routes.json';
import styles from './Home.css';

type Props = {};

export default class Home extends Component<Props> {
  props: Props;

  render() {
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
            <Input placeholder="Subject ID" />
          </p>
        </div>
        <div>
          <p>
            <Link to={routes.VIDEOSET}>Video Set #1</Link>
          </p>
        </div>
        <div>
          <p>
            <Link to={routes.VIDEOSET}>Video Set #2</Link>
          </p>
        </div>
        <div>
          <p>
            <Link to={routes.VIDEOSET}>Video Set #3</Link>
          </p>
        </div>
        <div>
          <p>
            <Link to={routes.VIDEOSET}>Video Set #4</Link>
          </p>
        </div>
      </div>
    );
  }
}
