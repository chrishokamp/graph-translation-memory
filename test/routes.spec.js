// adding an entry
// working - switch to jasmine

var express = require('express')
  , http = require('http')
  , frisby = require('frisby');

var tmServer = require('../web');

var server;

beforeEach(function(done) {
  // create the graph tm test server
  tmServer(function(graphTMServer) {
    console.log('route tests: graph-tm server initialized');
    server = graphTMServer;
    done();
  });

});

afterEach(function() {
  server.close();
});
//.get('http://httpbin.org/get?foo=bar&bar=baz')
//    .expectJSON({
//      args: {
//        foo: 'bar',
//        bar: 'baz'
//      }
//    })
//  .post('http://httpbin.org/post', {
//      arr: [1, 2, 3, 4],
//      foo: "bar",
//      bar: "baz",
//      answer: 42
//    })
//    .expectJSONTypes('args', {
//      arr: Array,
//      foo: String,
//      bar: String,
//      answer: Number
//    })
// test the graph TM routes with frisbee
frisby.create('test adding an entry to the TM')
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
  .toss();


// deleting an entry

