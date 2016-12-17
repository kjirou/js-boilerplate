import React from 'react';
import ReactDOM from 'react-dom';

import Root from './components/Root';

import foo, { x, y, a, b } from './foo';

console.log(foo);
console.log(x);
console.log(y);
console.log(a);
console.log(b);


window.document.addEventListener('DOMContentLoaded', () => {
  const container = window.document.querySelector('.js-app-container');
  ReactDOM.render(React.createElement(Root), container);
});
