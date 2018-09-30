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

        <div className={styles.selectionContainer}>
          <div className={styles.selection}>
            <span className={styles.selectionText}>Play first:</span>
            <div className={styles.addValue}>
              <select>
                <option value="vid1"> Video 1</option>
                <option value="vid2"> Video 2</option>
                <option value="vid3"> Video 3</option>
                <option value="vid4"> Video 4</option>
              </select>
              <select>
                <option value="control">Control</option>
                <option value="experimental">Experimental</option>
              </select>
            </div>
          </div>

          <div className={styles.selection}>
            <span className={styles.selectionText}>Play second:</span>
            <div className={styles.addValue}>
              <select>
                <option value="vid1"> Video 1</option>
                <option value="vid2"> Video 2</option>
                <option value="vid3"> Video 3</option>
                <option value="vid4"> Video 4</option>
              </select>
              <select>
                <option value="control">Control</option>
                <option value="experimental">Experimental</option>
              </select>
            </div>
          </div>

          <div className={styles.selection}>
            <span className={styles.selectionText}>Play third:</span>
            <div className={styles.addValue}>
              <select>
                <option value="vid1"> Video 1</option>
                <option value="vid2"> Video 2</option>
                <option value="vid3"> Video 3</option>
                <option value="vid4"> Video 4</option>
              </select>
              <select>
                <option value="control">Control</option>
                <option value="experimental">Experimental</option>
              </select>
            </div>
          </div>

          <div className={styles.selection}>
            <span className={styles.selectionText}>Play fourth:</span>
            <div className={styles.addValue}>
              <select>
                <option value="vid1"> Video 1</option>
                <option value="vid2"> Video 2</option>
                <option value="vid3"> Video 3</option>
                <option value="vid4"> Video 4</option>
              </select>
              <select>
                <option value="control">Control</option>
                <option value="experimental">Experimental</option>
              </select>
            </div>
          </div>
        </div>
        <div className={styles.submitButton}>
          <Link to={routes.VIDEOSET}>Submit</Link>
        </div>
      </div>
    );
  }
}
