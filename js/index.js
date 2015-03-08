var Backbone = require('backbone');
var React = require('react');


console.log(Backbone.toString());
console.log(React.toString());


//
// browserify のたぶんバグの再現
//
// 下のコードは正常に動くが
// 最初の false ブロック内の require を削除すると
// Cannot find module './required-data'
// のエラーになる
//
if (false) {
  require('./required-data');
} else {
  var dataPath = './required-data';
  console.log(require(dataPath));
}
