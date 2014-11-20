module.exports = {
  production: {
    db: {
      name        : 'graphtm',
      collection: 'nodes',
      url: 'mongodb://127.0.0.1:27017/'
    }
  },
  development: {
    db: {
      name      : 'graphtm',
      collection: 'nodes',
      url: 'mongodb://127.0.0.1:27017/'
    }

  }
};
