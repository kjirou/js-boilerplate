var Backbone = require('backbone');
var React = require('react');


console.log(Backbone.toString());
console.log(React.toString());


//
// browserify の変に見える挙動の再現
//
// 下のコードは正常に動くが
// 最初の false ブロック内の require を削除すると、
// 実行時に Cannot find module './required-data' のエラーになる
//
// これはそもそも限られたファイルを事前に結合する仕様上、
// 明示されていないパスのソースは読み込まない、たぶん仕様。
//
// https://github.com/substack/node-browserify/issues/883
//
// どちらかというと、これがそれを解決するハックっぽい
//
if (false) {
  require('./required-data');
} else {
  var dataPath = './required-data';
  console.log(require(dataPath));
}
