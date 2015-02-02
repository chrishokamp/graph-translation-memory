// adding an entry
describe('route tests', function () {


  var express = require('express')
    , http = require('http')
    , frisby = require('frisby');

  var server;

  beforeEach(function(done) {

    // create the graph tm test server
    if (server === undefined) {
      var tmServer = require('../web');
      tmServer(function(graphTMServer) {
        console.log('route tests: graph-tm server initialized');
        server = graphTMServer;
        done();
      });
    } else {
      done();
    }
  });

  // TODO: the tests currently persist the added nodes in the testDB -- these should really be deleted after each test
  // TODO: these tests can't be automatically rerun by watching changes because of the 'address in use' error

  describe('route tests', function () {

// test the graph TM routes with frisbee
    it('should be able to add a single node', function() {

      frisby.create('test adding several nodes and links to the TM')
        .post('http://localhost:8899/tm', {
          nodes: [
            {'lang': 'en', 'segment': 'this is a test.'}
          ]
        })
        .expectJSONTypes('?', {
          _id: String,
          lang: String,
          segment: String,
          edges: Array
        })
        .expectStatus(200)
        .expectHeaderContains('content-type', 'application/json')
        .toss();

    });

    it('should be able to add multiple nodes', function() {
      frisby.create('test adding several nodes and links to the TM')
        .post('http://localhost:8899/tm', {
          nodes: [
            {'lang': 'en', 'segment': 'this is a test.'},
            {'lang': 'de', 'segment': 'Dies ist ein Test.'},
            {'lang': 'de', 'segment': 'Dies ist ein Test TEST.'},
            {'lang': 'de', 'segment': 'Dies it.'},
            {'lang': 'tr', 'segment': 'bu bir deneme.'}
          ]
        })
        .expectJSONTypes('?', {
          _id: String,
          lang: String,
          segment: String,
          edges: Array
        })
        .expectStatus(200)
        .expectHeaderContains('content-type', 'application/json')
        .toss();

    });

    it('should be able to retrieve the exact-match translations for a node', function() {
      frisby.create('test adding several nodes and links to the TM')
        .post('http://localhost:8899/tm', {
          nodes: [
            {'lang': 'en', 'segment': 'this is a test.'},
            {'lang': 'en', 'segment': 'this sentence is a test.'},
            {'lang': 'de', 'segment': 'Dies ist ein Test.'},
            {'lang': 'de', 'segment': 'Dies ist ein Test TEST.'},
            {'lang': 'de', 'segment': 'Dies it.'},
            {'lang': 'tr', 'segment': 'bu bir deneme.'}
          ]
        })
        .expectStatus(200)
        .expectHeaderContains('content-type', 'application/json')
        .after(function(err, res, body) {
          frisby.create('retrieve the exact translations for a node')
            .get('http://localhost:8899/tm?sourcelang=en&targetlang=de&segment=this is a test&fuzzy=false')
            .expectJSONLength(1)
            .expectJSONTypes('?', {
              sourceLang: String,
              targetLang: String,
              sourceSegment: String,
              translations: Array
            })
            .expectJSON('?', {
              sourceLang: 'en',
              targetLang: 'de',
              sourceSegment: 'this is a test.',
              translations: function(val) {expect(val.length).toEqual(3)}
            })
            .expectStatus(200)
            .toss()
        })
        .toss();
    });

    it('should be able to return fuzzy matches', function() {
      frisby.create('test returning exact or fuzzy matches')
        .post('http://localhost:8899/tm', {
          nodes: [
            {'lang': 'en', 'segment': 'this is a test.'},
            {'lang': 'en', 'segment': 'this a test.'},
            {'lang': 'en', 'segment': 'this sentence is a test.'},
            {'lang': 'de', 'segment': 'Dies ist ein Test.'},
            {'lang': 'de', 'segment': 'Dies ist ein Test TEST.'},
            {'lang': 'de', 'segment': 'Dies it.'},
            {'lang': 'tr', 'segment': 'bu bir deneme.'}
          ]
        })
        .expectStatus(200)
        .expectHeaderContains('content-type', 'application/json')
        .after(function(err, res, body) {
          frisby.create('retrieve the fuzzy translations for a node')
            .get('http://localhost:8899/tm?sourcelang=en&targetlang=de&segment=this is a test&fuzzy=true')
            .expectJSONLength(3)
            .expectJSONTypes('?', {
              sourceLang: String,
              targetLang: String,
              sourceSegment: String,
              translations: Array
            })
            .expectJSON('?', {
              sourceLang: 'en',
              targetLang: 'de',
              sourceSegment: 'this is a test.',
              // add translations param
              translations: function(val) { expect(val.length).toEqual(3) }
            })
            .expectStatus(200)
            .toss()
        })
        .toss();
    });

    // deleting an entry

  });
});
