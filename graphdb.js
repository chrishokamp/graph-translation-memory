var Q = require('q');
var ObjectID = require('mongodb').ObjectID;


// Database Configuration
var env = process.env.NODE_ENV || 'development';

if ('development' == env) {

}

if ('production' == env) {

}

// constructor
function TMInterface(collection) {
  this.collection= collection;
}

// TODO: almost all of this code is duplicated in TMInterface.prototype.findTargetTranslations
/**
 * find all translations (i.e. all nodes which have an incoming edge from the match(es) for the query
 * given a language and a segment, retrieve the matching segments by $text search, then retrieve their edges
 * @param qLang
 * @param qSegment
 * @param fuzzy
 * @returns {promise|*|Q.promise}
 */
TMInterface.prototype.findTranslations = function(qLang, qSegment, fuzzy) {
  var self = this;
  if (!fuzzy || typeof(fuzzy) !== 'boolean') {
    fuzzy = false;
  }

  var deferred = Q.defer();
  var translationCallback = function (err, cursor) {
    if (err) deferred.reject(err);
    cursor.toArray(
      function (err, items) {
        if (err) deferred.reject(err);
        if (items.length > 0) {
          var translationPromises = items.map(function(item) {
            var itemDeferred = Q.defer();
            // get the object ids, then return those
            if (item.edges) {
              var edgeIds = item.edges.map(function(edge) {
                return edge._id;
              })
              self.collection.find({_id: {$in: edgeIds}}, function (err, cursor) {
                if (err) itemDeferred.reject(err);
                cursor.toArray(function (err, matches) {
                  if (err) itemDeferred.reject(err);
                  itemDeferred.resolve({'sourceLang': item.lang, 'sourceSegment': item.segment, 'translations': matches});
                })
              });
            }
            return itemDeferred.promise;
          });
          var allPromises = Q.all(translationPromises);
          allPromises.then(
            function(mapObjects) {
              deferred.resolve(mapObjects);
            },
            function(err) {
              deferred.reject(err);
            }
          )
        } else {
          deferred.resolve([]);
        }
      }
    );
  }

  if (fuzzy) {
    self.collection.find({lang: qLang, $text: {$search: qSegment}},
      {
        score: {$meta: "textScore"},
        edges: 1
      }, translationCallback)
  } else {
    // using quotes looks only for an exact phrasal match
    self.collection.find({lang: qLang, $text: {$search: '"' + qSegment + '"'}}
      , translationCallback)
  }
  return deferred.promise;
}

/**
 * find exact or fuzzy matches for a query
 * @param qLang
 * @param qSegment
 * @param targetLang
 * @param fuzzy
 * @returns {promise|*|Q.promise}
 */
TMInterface.prototype.findTargetTranslations = function(qLang, qSegment, targetLang, fuzzy) {
  var self = this;
  if (!fuzzy || typeof(fuzzy) !== 'boolean') {
    fuzzy = false;
  }

  var deferred = Q.defer();
  var translationCallback = function (err, cursor) {
    if (err) deferred.reject(err);
    cursor.toArray(
      function (err, items) {
        if (err) deferred.reject(err);
        if (items.length > 0) {
          var translationPromises = items.map(function(item) {
            var itemDeferred = Q.defer();
            // get the object ids, then return those
            if (item.edges) {
              var edgeIds = item.edges.map(function(edge) {
                return edge._id;
              })
              self.collection.find({_id: {$in: edgeIds}}, function (err, cursor) {
                if (err) itemDeferred.reject(err);
                cursor.toArray(function (err, matches) {
                  if (err) itemDeferred.reject(err);
                  // filter matches to only those of lang = targetLang
                  var targetLangMatches = matches.filter(function(item) {
                    return item.lang == targetLang;
                  });
                  itemDeferred.resolve({'sourceLang': item.lang, 'sourceSegment': item.segment, 'translations': targetLangMatches, 'targetLang': targetLang});
                })
              });
            }
            return itemDeferred.promise;
          });
          var allPromises = Q.all(translationPromises);
          allPromises.then(
            function(mapObjects) {
              deferred.resolve(mapObjects);
            },
            function(err) {
              deferred.reject(err);
            }
          )
        } else {
          deferred.resolve([]);
        }
      }
    );
  }

  if (fuzzy) {
    // this could get very inefficient if a node has many matches, and it also wastes our index on 'target.lang'
    self.collection.find({lang: qLang, $text: {$search: qSegment}},
      {
        lang: 1,
        segment: 1,
        score: {$meta: "textScore"},
        edges: 1
      }, translationCallback)
  } else {
    // using quotes looks only for an exact phrasal match
    self.collection.find({lang: qLang, $text: {$search: '"' + qSegment + '"'}}
      , translationCallback)
  }
  return deferred.promise;
}

/**
 * find the monolingual concordances for a query
 * @param lang
 * @param query
 */
TMInterface.prototype.findConcordances = function(lang, query) {
  var self = this;
  var deferred = Q.defer();
  self.collection.find({lang: lang, $text: {$search: query}},
    {
      lang: 1,
      segment: 1,
      score: {$meta: "textScore"}
    }, function(err, cursor) {
      if (err) deferred.reject(err);
      cursor.toArray(
        function (err, items) {
          if (err) deferred.reject(err);
          deferred.resolve(items);
        }
      );
    }
  );
  return deferred.promise;
}

TMInterface.prototype.hasEntry = function(tmObj) {
  var self = this;
  var deferred = Q.defer();
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

// add a set of translations (links) to an existing translation nodes
TMInterface.prototype.addTranslations = function(objectId, translations) {
  var deferred = Q.defer();
  var self = this;
  var idObj = new ObjectID(objectId);
  self.collection.update({_id: idObj}, {$addToSet: { edges: {$each: translations }}}, function(err) {

    if (err) {
      deferred.reject(err);
    } else {
      self.collection.findOne({_id: idObj}, function (err, obj) {
        if (err) {
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

// TODO: What other metadata belongs on an edge?
TMInterface.prototype.addEntries = function (tmObjList) {
  var self = this;
  var deferred = Q.defer();

  var mongoObjects = Q.all(tmObjList.map(function(tmObj) {
    return self.addEntry(tmObj);
  }));

  // after all of the entries have been added or retrieved, add their object ids to every other entry in the list
  mongoObjects.done(function(objects) {
    var ids = objects.map(function(obj) {
      return {'_id': obj._id, 'lang': obj.lang};
    });
    var updateProms = ids.map(
      function(nodeRef, idx, idList) {
        // copy the list of ids, splice out the current index, and add the others as edges to the current obj
        var others = idList.slice()
        others.splice(idx, 1);
        var nodeId = nodeRef._id;
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


// retrieve an entry
// get its objectID
// retrieve all of its links
// delete their reference to this object
// return the deleted node
TMInterface.prototype.deleteEntry = function (objectId) {
  var self = this;
  var deferred = Q.defer();
  var idObj = new ObjectID(objectId);

  self.collection.findOne({'_id': idObj},function(err, item) {
    if (err) deferred.reject(err);
    if (item) {
      // delete the node and all of its links
      self.collection.remove({'_id': idObj}, function(err, status) {
        if (item.edges === undefined) item.edges = [];
        var edgeDeletePromises = item.edges.map(function (edge) {
          var deleteDeferred = Q.defer();
          var edgeIds = item.edges.map(function (edge) {
            return edge._id;
          });
          // TODO: - WORKING - just remove the edge, not the whole node!
          self.collection.find({_id: {$in: edgeIds}}, function (err, cursor) {
            if (err) deleteDeferred.reject(err);
            cursor.toArray(function (err, matches) {
              if (err) deleteDeferred.reject(err);
              matches.forEach(function(node) {
                self.collection.update({'_id': node._id}, {'$pull': {'edges': {'_id': idObj}}}, function(err,status) {
                 deleteDeferred.resolve(true);
                });
              });
            })
          });
          return deleteDeferred.promise;
        });
        var allDeleted = Q.all(edgeDeletePromises);
        allDeleted.then(
          function(deleted) {
            deferred.resolve(deleted);
          },
          function(err) {
            deferred.reject(err);
          }
        );
      });
    } else {
      deferred.resolve(false);
    }
  });

  return deferred.promise;
}

// check if the object id is in the collection
TMInterface.prototype.hasObject = function (objectId) {
  var self = this;
  var deferred = Q.defer();
  var idObj = new ObjectID(objectId);

  self.collection.findOne({ '_id': idObj},function(err, item) {
    if (err) deferred.reject(err);
    if (item) {
      deferred.resolve(true);
    } else {
      deferred.resolve(false);
    }
  });
  return deferred.promise;
}

// get an edge from a node by objectId
// returns null if there's no edge
//TMInterface.prototype.getEdge(function() {

//})

TMInterface.prototype.getNode = function(objectId) {
  var self = this;
  var deferred = Q.defer();
  var idObj = new ObjectID(objectId);

  self.collection.findOne({ '_id': idObj},function(err, item) {
    if (err) deferred.reject(err);
    if (item) {
      deferred.resolve(item);
    } else {
      deferred.resolve(null);
    }
  });
  return deferred.promise;
}


module.exports = TMInterface;
