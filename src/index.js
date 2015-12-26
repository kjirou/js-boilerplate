import React from 'react';
import ReactDOM from 'react-dom';

import Root from './components/Root';


window.document.addEventListener('DOMContentLoaded', () => {
  const container = window.document.querySelector('#js-app-container');
  ReactDOM.render(React.createElement(Root), container);
});
