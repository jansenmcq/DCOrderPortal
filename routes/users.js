var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var mongoURL = 'mongodb://localhost:27017/tickets';

router.post('/changePassword', function(req, res, next) {
  MongoClient.connect(mongoURL, function(err, db) {

    var userDatabase = db.collection('users');
    var newID = Math.floor(Math.random() * 100);
    userDatabase.updateOne(
      {},
      {
        $set: {
          password: req.body.password,
          id: newID
        }
      },
      {w: 1},
      function(err, user) {
        if (err) {
          console.log('Error on trying to change the user password');
          res.status(500).send('Temporary Database Error, try again soon');
        } else {
          console.log('Password successfully changed');
          res.status(200).send('Success');
        }
    });
  });
});

router.post('/changeUsername', function(req, res, next) {
  MongoClient.connect(mongoURL, function(err, db) {

    var userDatabase = db.collection('users');
    var newID = Math.floor(Math.random() * 100);
    userDatabase.updateOne(
      {},
      {
        $set: {
          username: req.body.username,
          id: newID
        }
      },
      {w: 1},
      function(err, user) {
        if (err) {
          console.log('Error on trying to change the user password');
          res.status(500).send('Temporary Database Error, try again soon');
        } else {
          console.log('Password successfully changed');
          res.status(200).send('Success');
        }
      }
    );
  });
});

module.exports = router;
