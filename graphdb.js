var Q = require('q');
var ObjectID = require('mongodb').ObjectID;


// Database Configuration
var env = process.env.NODE_ENV || 'development';

if ('development' == env) {

}

if ('production' == env) {

}

function TMInterface(collection) {
  this.collection= collection;
}

TMInterface.prototype.findTranslations = function(qLang, qSegment, target) {
  var self = this;
  var deferred = Q.defer();

      self.collection.find({ lang: qLang, $text: { $search: qSegment}},
        { score: { $meta: "textScore" },
          edges: 1
        },
        function(err, cursor) {
          if (err) deferred.reject(err);
          cursor.toArray(
            function(err, items) {
              if (err) deferred.reject(err);
              // TODO: extend this to list of lists, because we will find multiple fuzzy matches
              if (items.length >0 ){
                var item = items[0]
                // get the object ids, then return those
                // TODO: this throws an error if the item has no edges
                if (item.edges) {
                  self.collection.find({_id: {$in: item.edges}}, function(err,cursor) {
                    if (err) deferred.reject(err);
                    cursor.toArray(function(err,matches) {
                      if (err) deferred.reject(err);
                      deferred.resolve(matches);
                    })
                  });
                }
              } else {
                deferred.resolve([]);
              }
            }
          );
        });
  return deferred.promise;
}
// given a language and a segment, retrieve the matching segments by $text search, then retrieve their edges
// return all edges to this translation node

TMInterface.prototype.hasEntry = function(tmObj) {
  var self = this;
  var deferred = Q.defer();
  //MongoClient.connect(this.dbUrl(), function(err, db) {
    // using quotes looks only for an exact phrasal match
    self.collection.findOne( { lang: tmObj.lang, $text: { $search: '"' + tmObj.segment + '"'}},function(err, item) {
      if (err) deferred.reject(err);
      if (item) {
        deferred.resolve(item);
      } else {
        deferred.resolve(false);
      }
    });
  return deferred.promise;
}

// should only be called if entry doesn't exist

TMInterface.prototype.addTranslations = function(objectId, translations) {
  var deferred = Q.defer();
  var self = this;
  var idObj = new ObjectID(objectId);
  self.collection.update({_id: idObj}, {$addToSet: { edges: {$each: translations }}}, function(err) {

    if (err) {
      console.error('Error updating translation');
      console.error(err);
      deferred.reject(err);
    } else {
      self.collection.findOne({_id: idObj}, function (err, obj) {
        if (err) {
          console.error('Error updating translation');
          console.error(err);
          deferred.reject(err);
        } else {
          deferred.resolve(obj);
        }
      });
    }
  });
  return deferred.promise;
}

TMInterface.prototype.addEntry = function(tmObj) {
  var self = this;
  var deferred = Q.defer();
  if (!tmObj.lang || !tmObj.segment) {
    deferred.reject(new Error('the tmObj does not have the right fields -- lang: ' + tmObj.lang + ' segment: ' + tmObj.segment));
  }

  self.hasEntry(tmObj)
    .then(
    function(item) {
      if (item) {
        deferred.resolve(item);
      } else {
        self.collection.insert(tmObj, function (err, newEntry) {
          if (err) {
            deferred.reject(err);
          } else {
            // return res[0] because mongo returns a list, but this method is (semantically) only for one item
            deferred.resolve(newEntry[0]);
          }
        });
      }
    }).fail(
    function(err) {
      deferred.reject(err)
    }
  );
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
