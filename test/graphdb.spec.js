var graphtm = require('../graphdb');

//var mongo = require('mongodb'),
//  MongoClient = require('mongodb').MongoClient,
//  ObjectID = require('mongodb').ObjectID;
//
//var Server = mongo.Server,
//    Db = mongo.Db,
//    BSON = mongo.BSONPure;

// points to the collection object that we'll be using in the tests
//var collection, tmInterface;
//var server = new Server('127.0.0.1', 27017);
//var db = new Db('testFixtureTMdb', server);



//collection = db.collection('nodes');
//tmInterface = new graphtm(collection);
// remember that more meta data can be added to any field if/when it is needed

//from: the TAUS documentation: https://www.tausdata.org/apidoc#langs
//Langs
//
//What we refer to as a "lang" and use throughout the Service is actually a language-region pair, often called a locale. For example fr-CA for Canadian French. When referring to the language only (eg. French), we always call it a "language" to distinguish it from a "lang".
//
//Languages are represented as ISO 639-1 two letter language codes. Regions are represented by ISO 3166-1 alpha-2 two letter country codes (or in a few cases, by non-standard codes such as XL for Latin America). Langs are represented as a language, followed by a dash ("-"), followed by a region. Langs, languages, and regions are case-insensitive.

// beforeEach open test db
//beforeEach(function(done) {
//
//    db.open(function (err, db) {
//      //db.createCollection('nodes', function (err, _collection_) {
//        db.collection('nodes', function (err, _collection_) {
//        if (err) throw err;
//          console.log('creating a new collection');
//          collection = _collection_;
//          tmInterface = new graphtm(collection);
//            done();
//        console.log('created a new collection');
//          setTimeout(function() {
//            console.log('DONE');
//
//          }, 10000);
//        })
//      });
////
////
//  waitsFor(function () { return !!tmInterface; } , 'Timed out', 3000);
////
//});

// afterEach drop test db
//afterEach(function() {
//  collection.drop();
  // closing the db causes an error
  //db.close();
//});

describe('test graphtm core functionality', function () {

  it('should be able to add an entry to the db', function(done) {
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

    // a translation node is a list of translation objects in one or more languages
    // note that multiple entries in the same language _are allowed_, provided that the text in the segment: property is different
    //db.open(function (err, db) {
 //MongoClient.connect('mongodb://127.0.0.1:27017/test', function(err, db) {     //db.createCollection('nodes', function (err, _collection_) {
 //     db.collection('nodes', function (err, _collection_) {
 //       var collection = _collection_;
 //       collection.ensureIndex({lang: 1, segment: "text", "edges.lang": 1}, function(err, index) {
 //       if (err) throw err;
 //       console.log('creating a new collection');
          var dbName = 'testFixtureTMdb';
          var collectionName = 'nodes';
        var tmInterface = new graphtm(dbName, collectionName);
        //done();
        //console.log('created a new collection');

        var newTranslationNodes = [
          {'lang': 'en', 'segment': 'this is a test.'},
          {'lang': 'de', 'segment': 'Dies ist ein Test.'},
          {'lang': 'tr', 'segment': 'bu bir deneme.'}
        ];

        var newNodes = tmInterface.addEntries(newTranslationNodes);
        console.log('add Entries returned');
        newNodes.then(
          function (res) {
            expect(res.length).toEqual(3);
            res.forEach(function (newNode) {
              expect(newNode._id).not.toBeUndefined();
              expect(newNode.links).not.toBeUndefined();

            });
            done();
          }, function (err) {
            console.error(err);
          }
        )
  });

  it('should be able to add a single entry', function(done) {
    var dbName = 'testFixtureTMdb';
    var collectionName = 'nodes';
    var tmInterface = new graphtm(dbName, collectionName);

    var newNode = {'lang': 'en', 'segment': 'this is a test.'};
    var insertPromise = tmInterface.addEntry(newNode);
    insertPromise.then(
      function(res) {
        expect(res).not.toEqual(null);
        done();
      }, function(err) {
        console.error(err);
      }
    );
  });

  //it('should know if an entry exists', function(done) {
  //  var newNode = {'lang': 'en', 'segment': 'this is a test.'}
  //  var insertPromise = tmInterface.addEntry(newNode)
  //  insertPromise.then(
  //    function(res) {
  //      console.log('Checking hasEntry');
  //      var entry = tmInterface.hasEntry(newNode);
  //      entry.then(
  //        function(exists) {
  //          //tmInterface.hasEntry(newNode);
  //          expect(exists).toBeTruthy();
  //          done();
  //        }
  //      )
  //    }, function(err) {
  //      console.error(err);
  //    }
  //  );
  //});

});

