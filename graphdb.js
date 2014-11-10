var Q = require('q');
//var config = require('./config');

var MongoClient = require('mongodb').MongoClient,
    ObjectID = require('mongodb').ObjectID;

// Constructor
function TMInterface(dbName, collectionName) {
  this.dbName = dbName;
  this.collectionName = collectionName;
  this.url = 'mongodb://127.0.0.1:27017/';
  this.dbUrl = function() {
    return this.url +  this.dbName;
  }
}

TMInterface.prototype.findTranslations = function(qLang, qSegment, target) {
  var self = this;
  var deferred = Q.defer();

  MongoClient.connect(self.dbUrl(), function(err, db) {
    db.collection(self.collectionName, function(err, collection) {
      if (err) throw err;
      db.collection(self.collectionName, function(err, collection) {
        // TODO: this index creation was failing in the tests -- why??
          collection.find({ lang: qLang, $text: { $search: qSegment}},
            { score: { $meta: "textScore" },
              edges: 1
            },
            function(err, cursor) {
            if (err) deferred.reject(err);
            cursor.toArray(
              function(err, items) {
                if (err) deferred.reject(err);
                // TODO: extend this to list of lists
                if (items.length >0 ){
                  console.log('ITEMS:');
                  console.log(items);
                  var item = items[0]
                  // get the object ids, then return those
                  collection.find({_id: {$in: item.edges}}, function(err,cursor) {
                    cursor.toArray(function(err,matches) {
                      if (err) deferred.reject(err);
                      deferred.resolve(matches);
                      db.close();
                    })
                  });
                }
              }
            );
        });
      });
    });
  });
  return deferred.promise;
}
// given a language and a segment, retrieve the matching segments by $text search, then retrieve their edges
// return all edges to this translation node

TMInterface.prototype.hasEntry = function(tmObj) {
  var self = this;
  var deferred = Q.defer();
  MongoClient.connect(this.dbUrl(), function(err, db) {
    db.collection(self.collectionName, function(err, collection) {
  // using quotes looks only for an exact phrasal match
      collection.findOne( { lang: tmObj.lang, $text: { $search: '"' + tmObj.segment + '"'}},function(err, item) {
        if (err) deferred.reject(err);
          if (item) {
            deferred.resolve(item);
          } else {
            deferred.resolve(false);
          }
      });
    });
  });
  return deferred.promise;
}

// should only be called if entry doesn't exist
TMInterface.prototype.addEntry = function(tmObj) {
  var self = this;
  var deferred = Q.defer();
  if (!tmObj.lang || !tmObj.segment) {
    deferred.reject(new Error('the tmObj does not have the right fields'));
  }

  MongoClient.connect(this.dbUrl(), function(err, db) {
    db.collection(self.collectionName, function(err, collection) {
      if (err) throw  err;
      //collection.insert(tmObj, function(err, newEntry) {
      self.hasEntry(tmObj)
        .then(
        function(item) {
          if (item) {
            deferred.resolve(item)
          } else {
            collection.insert(tmObj, function (err, newEntry) {
              if (err) {
                deferred.reject(err);
                db.close();
              } else {
                // return res[0] because mongo returns a list, but this method is (semantically) only for one item
                deferred.resolve(newEntry[0]);
                db.close();
              }

            });
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
      collection.update({_id: idObj}, {$addToSet: { edges: {$each: translations }}}, function(err) {

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
        // copy the list of ids, splice out the current index, and add the others as edges to the current obj
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
