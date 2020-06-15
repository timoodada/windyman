import React, { FC } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { Switch, useLocation } from 'react-router-dom';
import './style.scss';
import { combineClassNames } from '../../common/utils';

interface FixedRouterProps {
  defaultPath: string;
}
const FixedRouter: FC<FixedRouterProps> = function(props): JSX.Element {
  const { children, defaultPath } = props;
  const location = useLocation();
  return (
    <TransitionGroup>
      <CSSTransition
        key={location.key}
        timeout={300}
        classNames={'windy-slide'}
      >
        <div className={combineClassNames('windy-fixed-router', location.pathname === defaultPath ? 'windy-fixed-router-exited' : '')}>
          <Switch location={location}>{children}</Switch>
        </div>
      </CSSTransition>
    </TransitionGroup>
  );
};

export { FixedRouter };
