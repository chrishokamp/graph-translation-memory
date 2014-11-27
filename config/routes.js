'use strict';
var Q = require('q');

var path = require('path');
module.exports = function(app, tmInterface) {

  // WORKING: map methods to the taus TM, or MyMemory, or both
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

  // add a TM entry
  //app.post('/tm', function(req, res) {
  //
  //}

  // update a TM entry
  //app.put('/tm', function(req, res) {
  //
  //}

}
