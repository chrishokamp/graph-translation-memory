var EbmtParser = require('../../parsers/EbmtParser');

var tmFile1;
var tmFile2;


beforeEach(
  function() {
    // remember that paths are relative to the EbmtParser file location
    var filename1 = 'test/parsers/test_data/1000.en';
    var filename2 = 'test/parsers/test_data/1000.de';
    var lang1 = 'en';
    var lang2 = 'de';
    tmFile1 = {lang: lang1, filename: filename1};
    tmFile2 = {lang: lang2, filename: filename2};
  }
);

describe('EbmtParser tests', function () {

  it('should open two files and return a list of segment objects', function() {
    var segs = EbmtParser.parseFiles(tmFile1, tmFile2);
    console.log('segs:');
    console.log(segs.slice(0,10));
    expect(segs[100].length).toEqual(2);
    expect(segs[100][0].lang).toEqual('en');
    expect(segs[100][1].lang).toEqual('de');
  });

});

