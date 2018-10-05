/* eslint flowtype-errors/show-errors: 0 */
/* eslint linebreak-style: 0 */
import React from 'react';
import { Switch, Route } from 'react-router';
import routes from './constants/routes.json';
import App from './containers/App';
import HomePage from './containers/HomePage';
import CounterPage from './containers/CounterPage';
import VideoSetPage from './containers/VideoSetPage';

export default () => (
  <App>
    <Switch>
      <Route path={routes.VIDEOSET} component={VideoSetPage} />
      <Route path={routes.COUNTER} component={CounterPage} />
      <Route path={routes.HOME} component={HomePage} />
    </Switch>
  </App>
);
