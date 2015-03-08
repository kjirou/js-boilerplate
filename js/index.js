var Backbone = require('backbone');
var React = require('react');


console.log(Backbone.toString());
console.log(React.toString());


// browserify が動かないケースをメモ
// 下のコメントアウト部分は、コンパイルは通るが実行時に
// Cannot find module './required-data'
// のエラーになる
console.log(require('./required-data'));
//var dataPath = './required-data';
//console.log(require(dataPath));
