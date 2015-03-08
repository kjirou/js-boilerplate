import Backbone from 'backbone'
import React from 'react'

import simpleFunc from './simple-func'
import { Person } from './person'


console.log(Backbone.toString());
console.log(React.toString());

console.log(simpleFunc(2, 3));
console.log(new Person('taro').fullname());

// コメントアウトされている方を有効にすると、
// コンパイル時にはエラーにならないが、ブラウザアクセス時に
// Error: Cannot find module './required-data' になる
console.log(require('./required-data'));
//let dataPath = './required-data';
//console.log(require(dataPath));
