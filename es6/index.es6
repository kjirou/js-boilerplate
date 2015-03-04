import Backbone from 'backbone'
import React from 'react'

import simpleFunc from './simple-func'
import { Person } from './person'

console.log(Backbone);
console.log(React);

console.log(simpleFunc(2, 3));
console.log(new Person('taro').fullname());
