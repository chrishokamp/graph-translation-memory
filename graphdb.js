var Q = require('q');
//var config = require('./config');

var mongo = require('mongodb'),
  MongoClient = require('mongodb').MongoClient,
  ObjectID = require('mongodb').ObjectID;

// Constructor
function TMInterface(dbName, collectionName) {
  // always initialize all instance properties
  // TODO: this index must be ensured beforehand
  //collection.ensureIndex({lang: 1, segment: "text", "edges.lang": 1}, function() {
  //  console.log('test callback');
  //});
  this.dbName = dbName;
  this.collectionName = collectionName;
  this.url = 'mongodb://127.0.0.1:27017/';
  this.dbUrl = function() {
    return this.url +  this.dbName;
  }
}

// TODO: implement
//TMInterface.prototype.findTranslations

TMInterface.prototype.hasEntry = function(tmObj) {
  var deferred = Q.defer();
  // using quotes looks only for an exact phrasal match
  this.collection.find( { lang: tmObj.lang, $text: { $search: '"' + tmObj.segment + '"'}},function(err, res) {
    if (err) deferred.reject(err);
    res.toArray(function(err, items) {
      if (err) deferred.reject(err);

      if (items.length) {
        deferred.resolve(true);
      } else {
        deferred.resolve(false);
      }
    });
  });
  return deferred.promise;
}

// only called if entry doesn't exist
TMInterface.prototype.addEntry = function(tmObj) {
  var self = this;
  var deferred = Q.defer();

  MongoClient.connect(this.dbUrl(), function(err, db) {
    db.collection(self.collectionName, function(err, collection) {

      collection.insert(tmObj, function(err, newEntry) {
        if (err) {
          deferred.reject(err);
          db.close();
        } else {
          // return res[0] because mongo returns a list, but this method is (semantically) only for one item
          deferred.resolve(newEntry[0]);
          db.close();
        }
      });
    });
  });
  return deferred.promise;
}

TMInterface.prototype.addTranslations = function(objectId, translations) {
  var deferred = Q.defer();
  var self = this;
  var idObj = new ObjectID(objectId);
  MongoClient.connect(this.dbUrl(), function(err, db) {
    db.collection(self.collectionName, function(err, collection) {
      collection.update({_id: idObj}, {$addToSet: { links: {$each: translations }}}, function(err) {

        if (err) {
          console.error('Error updating translation');
          console.error(err);
          deferred.reject(err);
        } else {
          collection.findOne({_id: idObj}, function (err, obj) {
            if (err) {
              console.error('Error updating translation');
              console.error(err);
              deferred.reject(err);
              db.close();
            } else {
              deferred.resolve(obj);
              db.close();
            }
          });
        }
      });
    });
  });
  return deferred.promise;
}

TMInterface.prototype.addEntries = function (tmObjList) {
  var self = this;
  var deferred = Q.defer();

  // todo: chain promises to see if TM has the entry (check true/false)
  var mongoObjects = Q.all(tmObjList.map(function(tmObj) {
    return self.addEntry(tmObj);
  }));

  // after all of the entries have been added or retrieved, add their object ids to every other entry in the list
  mongoObjects.done(function(objects) {
    var ids = objects.map(function(obj) {
      return obj._id;
    });
    var updateProms = ids.map(

      function(nodeId, idx, idList) {
        // copy the list of ids, splice out the current index, and add the others as links to the current obj
        var others = idList.slice()
        others.splice(idx, 1);
        var updateProm = self.addTranslations(nodeId, others);
        return updateProm;
      });
    var finalObjects = Q.all(updateProms);
    finalObjects.then(
      function(res) {
        deferred.resolve(res);
      }, function(err) {
        console.error(err);
      }
    );
  });

  return deferred.promise;
}


module.exports = TMInterface;
