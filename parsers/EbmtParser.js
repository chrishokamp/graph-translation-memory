var fs = require('fs')
var assert = require('assert')

function zip(arrays) {
  return arrays[0].map(function(_,i){
    return arrays.map(function(array){return array[i]})
  });
}

var createTMObj = function(str, lang) {
  return {lang: lang, segment: str};
}

module.exports.parseFiles = function(tmFile1, tmFile2) {
  var lines1 = fs.readFileSync(tmFile1.filename, {encoding: 'utf8'}).trim().split('\n');
  var lines2 = fs.readFileSync(tmFile2.filename, {encoding: 'utf8'}).trim().split('\n');
  assert.equal(lines1.length, lines2.length, 'Error: the two files must have the same number of lines');

  var segs1 = lines1.map(function(seg) {
    return createTMObj(seg, tmFile1.lang)
  });
  var segs2 = lines2.map(function(seg) {
    return createTMObj(seg, tmFile2.lang)
  });

  return zip([segs1,segs2]);
}

