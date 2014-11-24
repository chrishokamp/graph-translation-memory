'use strict';
var Q = require('q');

var path = require('path');
module.exports = function(app, tmInterface) {

  // parse requests to /tm using params
  app.get('/', function(req, res) {
    var sourcelang = req.param('sourcelang');
    console.log('Lang: ' + sourcelang);
    var segment = req.param('segment');
    console.log('Segment: ' + segment);

    // TODO: this should return all translations
    tmInterface.findTranslations(sourcelang, segment)
      .then(function(matches) {
        res.status(200).send(matches);
      }, function(err) {
        res.status(500).send(err);
      });
  });

  // User Routes
  //var users = require('../controllers/users');

  // - automatically calls a function when the userId parameter is present
  //app.param('userId', users.user);

  // Check if username is available
  //app.get('/auth/check_username/:username', users.exists);
  //app.post('/auth/users', users.create);
  //app.get('/auth/users/:userId', users.show);
  //// todo: this lets any logged-in user update another user's taus TM data
  //app.put('/auth/users/:userId', auth.ensureAuthenticated, users.update);
  //app.delete('/auth/users/:userId', auth.ensureAuthenticated, users.destroy);

  // TAUS data API routes - TODO - extend this into a general interface to translation memories - move taus-specific code outside of this module
  // Working - use named resources to map a user's available resources to their URLs
  // note: a new user needs to register with TAUS - or the specific translation service for this to work
  // Direct users here to register for an account: http://www.tausdata.org/index.php/component/users/?view=registration
  // sample call to the TAUS segment API
  // TODO - implement errors to let users know which translation services they can access
  // https://www.tausdata.org/api/segment.json?source_lang=en-US&target_lang=fr-FR&q=data+center
  //app.post('/users/tausdata', users.setTausData);
  // call the taus data API with source_lang=en-US, target_lang=fr-FR, q=<user query>
  //app.get('/users/tausdata', users.setTausData);

  // TODO: this route should actually add add an entry to the TM, not set the user's taus data
  //app.post('/users/tm', auth.ensureAuthenticated, users.setTausData);
//  app.get('/users/tm', auth.ensureAuthenticated, users.queryTM);

  // Working - implement /users/:userId/tm - this user's TM resources
  // if there isn't an entry in the user's tm, ask the global TM
  //app.get('/users/:userId/tm', auth.ensureAuthenticated, users.checkTMCache, users.queryTM);
  // TODO - add a 'global' user whose resources are accessible to every other user (i.e. global.checkTMCache)
}
