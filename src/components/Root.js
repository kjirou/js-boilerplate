import React from 'react';


export default class Root extends React.Component {

  render() {
    return (
      <div className="root">
        <p>Root Component</p>
        <div className="hagure_metal-image" style={ { width: 300, height: 300 } } />
      </div>
    );
  }
}
