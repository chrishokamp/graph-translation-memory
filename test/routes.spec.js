// adding an entry
// working - switch to jasmine
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

  describe('route tests', function () {

// test the graph TM routes with frisbee
    it('should be able to add a single node', function() {
      console.log('TEST');

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

    it('should be able to retrieve the translations for a node', function() {
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
        .expectStatus(200)
        .expectHeaderContains('content-type', 'application/json')
        .after(function(err, res, body) {
          frisby.create('retrieve the translations for a node')
            .get('http://localhost:8899/tm?sourcelang=en&targetlang=de&segment=this is a test')
            .expectJSONTypes('?', {
              sourceLang: String,
              sourceSegment: String,
              translations: Array
            })
            .expectStatus(200)
            .toss()
        })
        .toss();
    });

// deleting an entry

  });
});
