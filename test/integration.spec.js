// test integrating parsers and query engines with the db
var graphtm = require('../graphdb');
var EbmtParser = require('../parsers/EbmtParser')

var mongo = require('mongodb'),
  MongoClient = require('mongodb').MongoClient,
  ObjectID = require('mongodb').ObjectID;

var Q = require('q');

var tmFile1;
var tmFile2;
var tmInterface;

var url = 'mongodb://127.0.0.1:27017/';
var dbName = 'testFixtureTMdb';
var dbUri = url + dbName;

var collection;
var collectionName = 'nodes';

describe('graphtm integration tests', function () {

  beforeEach(
    function(done) {
      // remember that paths are relative to the EbmtParser file location
      var filename1 = 'test/parsers/test_data/1000.en';
      var filename2 = 'test/parsers/test_data/1000.de';
      var lang1 = 'en';
      var lang2 = 'de';
      tmFile1 = {lang: lang1, filename: filename1};
      tmFile2 = {lang: lang2, filename: filename2};

      // create index on the collection
      MongoClient.connect(dbUri, function(err, db) {
        if (err) throw err;
        db.collection(collectionName, function(err, _collection_) {
          collection = _collection_;
          tmInterface = new graphtm(collection);
          collection.ensureIndex({lang: 1, segment: "text", "edges.lang": 1}, function() {
            //collection.ensureIndex( { lang: 1, segment: 1 }, { unique: true }, function() {
              done();
            //});
          });
        });
      });
    }
  );

// afterEach drop test collection
  afterEach(function(done) {
    collection.drop();
    done();
    //closing the db causes an error
    //db.close();
  });

// parse the files, and insert each set of entries into the db
describe('parse files and insert', function () {

  it('should be able to load files, parse them, then insert into the graph-tm', function(done) {
    var segs = EbmtParser.parseFiles(tmFile1, tmFile2);
    // slice to make the tests run faster
    var testSegs = segs.slice(0,100);
    // Careful - note that we need to pass in 'tmInterface' as the 'this arg' to map
    var allPromises = Q.all(testSegs.map(tmInterface.addEntries, tmInterface));
    allPromises.then(
      function (res) {
        expect(res.length).toEqual(testSegs.length);
        res.forEach(function (newNodes) {
          console.log('New Nodes:');
          console.log(newNodes);
          newNodes.forEach(function(newNode) {
            expect(newNode._id).not.toBeUndefined();
            expect(newNode.edges).not.toBeUndefined();
          });
        });
        done();
    })
    .fail(
      function(reason) {
        console.error('Inserting all segments failed');
        console.error(reason.stack)
      }
    )
  });

  // assert that duplicates cannot be returned

});

});
