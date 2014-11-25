var graphtm = require('../graphdb');

var mongo = require('mongodb'),
  MongoClient = require('mongodb').MongoClient,
  ObjectID = require('mongodb').ObjectID;

//var Server = mongo.Server,
//    Db = mongo.Db,
//    BSON = mongo.BSONPure;

// points to the collection object that we'll be using in the tests
//var collection, tmInterface;
//var server = new Server('127.0.0.1', 27017);
//var db = new Db('testFixtureTMdb', server);

//collection = db.collection('nodes');
// remember that more meta data can be added to any field if/when it is needed
var tmInterface;
var collection, db;
var url = 'mongodb://127.0.0.1:27017/';
var dbName = 'testFixtureTMdb';
var dbUri = url + dbName;

var collectionName = 'nodes';

//from: the TAUS documentation: https://www.tausdata.org/apidoc#langs
//Langs
//
//What we refer to as a "lang" and use throughout the Service is actually a language-region pair, often called a locale. For example fr-CA for Canadian French. When referring to the language only (eg. French), we always call it a "language" to distinguish it from a "lang".
//
//Languages are represented as ISO 639-1 two letter language codes. Regions are represented by ISO 3166-1 alpha-2 two letter country codes (or in a few cases, by non-standard codes such as XL for Latin America). Langs are represented as a language, followed by a dash ("-"), followed by a region. Langs, languages, and regions are case-insensitive.
describe('Graph DB tests', function () {

// beforeEach create tmInterface
  beforeEach(function(done) {
    // create index on the collection
    MongoClient.connect(dbUri, function(err, db) {
      if (err) throw err;
      db.collection(collectionName, function(err, _collection_) {
        collection = _collection_;
        tmInterface = new graphtm(collection);
        //collection.ensureIndex({lang: 1, segment: "text", "edges.lang": 1}, function() {
        collection.ensureIndex({lang: 1, segment: "text"}, function() {
          //collection.ensureIndex( { lang: 1, segment: 1 }, { unique: true }, function() {
            done();
          //});
        });
      });
    });

  });

// afterEach drop test collection
  afterEach(function(done) {
   collection.drop();
    done();
    //closing the db causes an error
    //db.close();
  });

  describe('test graphtm core functionality', function () {

    // an entry looks like:
    /**
     {
       lang: <lang-code>,
       segment: <utf8 text of the segment>,
       source: <optional source id>
       edges: [
         {lang: <lang-code>, id: _objectId}
       ]
     }
     **/

      // when we get a new segment:
      // (1) check if there is already an entry for lang 1
      //      - if yes, get its id, if no, create it
      // (2) check if there is already an entry for lang 2
      //      - if yes, get its id, if no, create it
      // (3) add lang1's edge entry to the 'edges' field of lang2
      // (4) add lang2's edge entry to the 'edges' field of lang1

      // db.tm.ensureIndex({"lang": 1})
      // db.tm.ensureIndex({"segment": "text"})
      // db.tm.ensureIndex({"edges.lang": 1})

    // Mongo textIndex Notes
      //Specify the Index Language within the Document
      //
      //If a collection contains documents or sub-documents that are in different languages, include a field named language in the documents or sub-documents and specify as its value the language for that document or sub-document.
      //{
      //  _id: 1,
      //    language: "portuguese",
      //  original: "A sorte protege os audazes.",
      //  translation:
      //  [
      //    {
      //      language: "english",
      //      quote: "Fortune favors the bold."
      //    },
      //    {
      //      language: "spanish",
      //      quote: "La suerte protege a los audaces."
      //    }
      //  ]
      //}

      // text search languages
      //da or danish
      //nl or dutch
      //en or english
      //fi or finnish
      //fr or french
      //de or german
      //hu or hungarian
      //it or italian
      //nb or norwegian
      //pt or portuguese
      //ro or romanian
      //ru or russian
      //es or spanish
      //sv or swedish
      //tr or turkish

    it('should be able to add an entry to the db', function(done) {
      // a translation node is a list of translation objects in one or more languages
      // note that multiple entries in the same language _are allowed_, provided that the text in the segment: property is different
      var newTranslationNodes = [
        {'lang': 'en', 'segment': 'this is a test.'},
        {'lang': 'de', 'segment': 'Dies ist ein Test.'},
        {'lang': 'tr', 'segment': 'bu bir deneme.'}
      ];

      var newNodes = tmInterface.addEntries(newTranslationNodes);
      newNodes.then(
        function (res) {
          expect(res.length).toEqual(3);
          res.forEach(function (newNode) {
            expect(newNode._id).not.toBeUndefined();
            expect(newNode.edges).not.toBeUndefined();
          });
          done();
        }).fail(function (err) {
          console.error(err);
          done();
        });
    });

    it('should be able to add a single entry', function(done) {

      var newNode = {'lang': 'en', 'segment': 'this is a test.'};
      var insertPromise = tmInterface.addEntry(newNode);
      insertPromise.then(
        function(res) {
          expect(res).not.toEqual(null);
          expect(res._id).not.toEqual(null);
          expect(res.lang).toEqual(newNode.lang);
          expect(res.segment).toEqual(newNode.segment);
          done();
        }).done(function(err) {
          console.error(err);
        });
    });

    it('should know if an entry exists', function(done) {
      var newNode = {'lang': 'en', 'segment': 'this is a test.'}
      tmInterface.addEntry(newNode)
        .then(
        function(res) {
          var entry = tmInterface.hasEntry(newNode);
          entry.then(
            function(exists) {
              expect(exists).toBeTruthy();
              done();
            }
          )
        }, function(err) {
          console.error(err);
        }
      );
    });

    it('should know if an entry does not exist', function(done) {
      var newNode = {'lang': 'en', 'segment': 'is a test.'};
      var entry = tmInterface.hasEntry(newNode);
      entry.then(
        function(exists) {
          expect(exists).toBeFalsy();
          done();
        }).fail(function(err) {
          console.error(err);
        });
    });

    it('should not insert duplicates', function(done) {
      var newNode = {'lang': 'en', 'segment': 'is a test.'};
      tmInterface.addEntry(newNode)
        .then(
        function(node1) {
          tmInterface.addEntry(node1).then(
            function(node2) {
              expect(node1._id).not.toBeUndefined();
              expect(node1._id).toEqual(node2._id);
              done();
            }
          )
        });
    });
  });

  describe('retrieving translations', function () {

    it('should return an empty list if a node does not exist', function (done) {
      var fakeNode = {'lang': 'xx', 'segment': 'xxx xxx xxx'};
      tmInterface.findTargetTranslations(fakeNode.lang, fakeNode.segment)
        .then(
        function (res) {
          expect(res.length).toEqual(0);
          done();
        }
      )
        .fail(function (reason) {
          console.error('ERROR');
          console.error(reason.stack);
          done();
        })
    });

    it('should be able to fetch the translations in a specified target language for a node that has some', function (done) {
      var newTranslationNodes = [
        {'lang': 'en', 'segment': 'this is a test.'},
        {'lang': 'de', 'segment': 'Dies ist ein Test.'},
        {'lang': 'de', 'segment': 'Dies ist ein Test TEST.'},
        {'lang': 'de', 'segment': 'Dies it.'},
        {'lang': 'tr', 'segment': 'bu bir deneme.'}
      ];

      var targetLang = 'tr'
      tmInterface.addEntries(newTranslationNodes)
        .then(
        function (newNodes) {
          var testNode = newTranslationNodes[1];
          tmInterface.findTargetTranslations(testNode.lang, testNode.segment, targetLang)
            .then(
            function (res) {
              expect(res.length).toEqual(1);
              expect(res[0].translations.length).toEqual(1);
              done();
            }).fail(
            function (err) {
              console.error('testTargetTranslations Failed');
              console.error(err.stack);
            }
          );
        }).fail(
        function (err) {
          console.error(err.stack);
        }
      )
    });

    it('should be able to fetch all of the translations available for a node', function (done) {
      var newTranslationNodes = [
        {'lang': 'en', 'segment': 'this is a test.'},
        {'lang': 'de', 'segment': 'Dies ist ein Test.'},
        {'lang': 'de', 'segment': 'Dies ist ein Test TEST.'},
        {'lang': 'de', 'segment': 'Dies it.'},
        {'lang': 'tr', 'segment': 'bu bir deneme.'}
      ];

      tmInterface.addEntries(newTranslationNodes)
        .then(
        function (newNodes) {
          var testNode = newTranslationNodes[1];
          tmInterface.findTranslations(testNode.lang, testNode.segment)
            .then(
            function (res) {
              expect(res.length).toEqual(1);
              expect(res[0].translations.length).toEqual(4);
              done();
            }).fail(
            function (err) {
              console.error('test findAllTranslations failed');
              console.error(err.stack);
            }
          );
        }).fail(
        function (err) {
          console.error(err.stack);
        }
      )
    });
  });

  it('should be able to return fuzzy matches when requested', function (done) {
    var newTranslationNodes = [
      {'lang': 'en', 'segment': 'this is a test.'},
      {'lang': 'en', 'segment': 'these are tests.'},
      {'lang': 'en', 'segment': 'is a test?'},
      // TODO: 'this is a testy.' doesn't match because of the way mongo does fulltext search
      {'lang': 'en', 'segment': 'this is a testy.'},
      {'lang': 'de', 'segment': 'Dies ist ein Test.'},
      {'lang': 'de', 'segment': 'Dies ist ein Test TEST.'},
      {'lang': 'de', 'segment': 'Dies it.'},
      {'lang': 'tr', 'segment': 'bu bir deneme.'}
    ];

    var targetLang = 'de';
    tmInterface.addEntries(newTranslationNodes)
      .then(
      function (newNodes) {
        var testNode = newTranslationNodes[0];
        tmInterface.findTargetTranslations(testNode.lang, testNode.segment, targetLang, true)
          .then(
          function (res) {
            expect(res.length).toEqual(3);
            expect(res[0].translations.length).toEqual(3);
            done();
          }).fail(
          function (err) {
            console.error('test fuzzy translations Failed');
            console.error(err.stack);
          }
        );
      }).fail(
      function (err) {
        console.error(err.stack);
      }
    )
  });

  it('should only return exact matches when requested', function (done) {
    var newTranslationNodes = [
      {'lang': 'en', 'segment': 'this is a test.'},
      {'lang': 'en', 'segment': 'these are tests.'},
      {'lang': 'en', 'segment': 'is a test?'},
      // TODO: 'this is a testy.' doesn't match because of the way mongo does fulltext search
      {'lang': 'en', 'segment': 'this is a testy.'},
      {'lang': 'de', 'segment': 'Dies ist ein Test.'},
      {'lang': 'de', 'segment': 'Dies ist ein Test TEST.'},
      {'lang': 'de', 'segment': 'Dies it.'},
      {'lang': 'tr', 'segment': 'bu bir deneme.'}
    ];

    var targetLang = 'de';
    tmInterface.addEntries(newTranslationNodes)
      .then(
      function (newNodes) {
        var testNode = newTranslationNodes[0];
        // the last arg is 'false' because we _don't_ want fuzzy matches
        tmInterface.findTargetTranslations(testNode.lang, testNode.segment, targetLang, false)
          .then(
          function (res) {
            expect(res.length).toEqual(1);
            expect(res[0].translations.length).toEqual(3);
            done();
          }).fail(
          function (err) {
            console.error('test exact translations Failed');
            console.error(err.stack);
          }
        );
      }).fail(
      function (err) {
        console.error(err.stack);
      }
    )
  });

});



