'use strict';
var Q = require('q');

var path = require('path');
var validate = require('isvalid-express');

module.exports = function(app, tmInterface) {

  // parse requests to /tm using params
  // WORKING - map this to /tm/:sourcelang/:targetlang using the swagger syntax
  app.get('/tm', function(req, res) {
    var sourcelang = req.param('sourcelang');
    var targetlang = req.param('targetlang');
    var segment = req.param('segment');

    tmInterface.findTargetTranslations(sourcelang, segment, targetlang)
      .then(function(matches) {
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
        "segment": {type: String, required: true}
      }
    ]
  };

  // add a TM entry
  app.post('/tm', validate.body(newTranslationsValidationSchema), function(req, res) {
    var newTMObj = req.body;
    // req.body is now validated and no further validation needs to take place.
    // If body could not be validated, an error was sent to the express error handler.
    console.log('req body: ');
    console.log(newTMObj);
    res.send(200);
  });

  // update a TM entry
  //app.put('/tm', function(req, res) {
  //
  //}

}

