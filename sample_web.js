Error.stackTraceLimit = Infinity;

var express = require('express'),
  bodyParser = require('body-parser'),
  http = require('http'),
  methodOverride = require('method-override'),
  params = require('express-params'),
  cors = require('cors'),
  config = require('./config/config');
  //noop = require('node-noop')

var app = express();
var graphtm = require('./graphdb');

var MongoClient = require('mongodb').MongoClient;

// App Configuration ('production' or 'development')
var env = process.env.NODE_ENV || 'development';

var dbName, dbUrl, collectionName;

if ('production' === env) {
  dbName = config.production.db.name;
  collectionName = config.production.db.collection;
  dbUrl = config.development.db.url;
} else {
  dbName = config.development.db.name;
  collectionName = config.development.db.collection;
  dbUrl = config.development.db.url;
}

app.use(cors());
// bodyParser should be above methodOverride
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());

params.extend(app);

var server;
// this gets reassigned to the callback
var callback = function () {};

//Bootstrap routes - remember that routes must be added after application middleware
var dbUri = dbUrl + dbName;
MongoClient.connect(dbUri, function(err, db) {
  if (err) throw err;
  db.collection(collectionName, function(err, _collection_) {
    var collection = _collection_;
    var tmInterface = new graphtm(collection);
    collection.ensureIndex({lang: 1, segment: "text", "edges.lang": 1}, function() {
      collection.ensureIndex( { lang: 1, segment: 1 }, { unique: true }, function() {
        require('./config/routes')(app, tmInterface);
        server = http.createServer(app);
        server.listen(process.env.PORT || 8899);
        console.log('graph TM express server is listening on port: %s', server.address().port);
        callback(server);
      });
    });
  });
});

module.exports = function(cb){
    if(typeof server != 'undefined'){
        cb(server); // If server is already defined don't wait
    } else {
        callback = cb;
    }
}



