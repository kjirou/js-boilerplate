import assert from 'power-assert';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import Root from '../src/components/Root';


describe('components', () => {

  it('should be', () => {
    const rootElement = <Root />;
    const html = ReactDOMServer.renderToStaticMarkup(rootElement);
    assert(/Root Component/.test(html));
  });
});
