'use strict';
var Q = require('q');

var path = require('path');
var validate = require('isvalid-express');

/**
 *
 * @param app: an express app instance
 * @param tmInterface: an object implementing the tmInterface API
 */
module.exports = function(app, tmInterface) {

  // parse requests to /tm using params
  // WORKING - add fuzzy and exact params
  app.get('/tm', function(req, res) {
    var sourcelang = req.param('sourcelang');
    var targetlang = req.param('targetlang');
    var segment = req.param('segment');
    var fuzzy = req.param('fuzzy');
    // careful cast to boolean
    if (fuzzy === 'true') {
      fuzzy = true;
    } else {
      fuzzy = false;
    }

    tmInterface.findTargetTranslations(sourcelang, segment, targetlang, fuzzy)
      .then(function(matches) {
        console.log('route: ');
        console.log('MATCHES: ');
        console.log(matches);
        res.status(200).send(matches);
      }, function(err) {
        res.status(500).send(err);
      });
  });

  // Validate something like this: {"nodes": [{"lang": "en", "segment":"test seg"}]}
  var newTranslationsValidationSchema = {
    "nodes": [
      {
        "lang"   : {type: String, required: true},
        "segment": {type: String, required: true},
        "createdBy": {type: String, required: false},
        "date": {type: String, required: false}
      }
    ]
  };

  // add a TM entry
  app.post('/tm', validate.body(newTranslationsValidationSchema), function(req, res) {
    // If body could not be validated, an error was sent to the express error handler.

    var nodes = req.body.nodes;
    tmInterface.addEntries(nodes)
    .then(function(newNodes) {
      res.status(200).send(newNodes);
    }, function(err) {
      res.status(500).send(err);
    });
  });

  // query for monolingual concordances
  app.get('/concordancer', function(req, res) {
    var lang = req.param('lang');
    var query = req.param('query');

    // sort first by segment length descending, then by score descending
    var rankMatches = function(origMatches) {
      // copy because Array.prototype.sort is in-place
      // note: this is a shallow copy, but that's ok, because we're not modifying the objects in the list
      var matches = origMatches.slice(0);

      // sort by segment length
      matches.sort(function(a,b) {
        if (a.segment.length > b.segment.length) {
          return 1;
        }
        if (a.segment.length < b.segment.length) {
          return -1;
        }
        return 0;
      });

      // sort by score
      matches.sort(function(a,b) {
        if (a.score > b.score) {
          return 1;
        }
        if (a.score < b.score) {
          return -1;
        }
        return 0;
      });

      // switch to descending order
      matches.reverse();
      return matches;
    }

    tmInterface.findConcordances(lang, query)
      .then(function(matches) {
        var sortedMatches = rankMatches(matches);
        res.status(200).send(sortedMatches);
      }, function(err) {
        res.status(500).send(err);
      });
  });

  // update a TM entry
  //app.put('/tm', function(req, res) {
  //
  //}

}

