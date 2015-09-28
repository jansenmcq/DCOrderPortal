var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;


/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Home' });
});

router.get('/shows', function(req, res) {
  res.render('shows', {title: 'Shows'});
});

router.get('/auditions', function(req, res) {
  res.render('auditions', {title: 'Auditions'});
});

router.get('/cast-crew', function(req, res) {
  res.render('cast-crew', {title: 'Cast & Crew'});
});

router.get('/faq', function(req, res) {
  res.render('faq', {title: 'FAQ'});
});

router.get('/media', function(req, res) {
  res.render('media', {title: 'Media'});
});

router.get('/tickets', function(req, res) {
  res.render('tickets', {title: 'Tickets'});
});

router.get('/admin', function(req, res) {
  res.render('admin');
});

router.get('/test', function(req, res) {
  res.send("Site is up and running, sir!");
});

router.post('/testtest', function(req, res) {
  var url = 'mongodb://localhost:27017/tickets';
  MongoClient.connect(url, function(err, db) {
    var ticketCollection = db.collection('ticketAmounts');
    var ticketCounts = ticketCollection.findOne(function(err, item) {
      console.log('async '+JSON.stringify(item));
      res.send('all good');
    });
    console.log('sync '+JSON.stringify(ticketCounts));
  });
});

router.post('/checkout', function(req, res) {
  var url = 'mongodb://localhost:27017/tickets';
  MongoClient.connect(url, function(err, db) {
    if (err) {
      console.log('boo hoo it not wanna connect :?');
    } else {
      var ticketCollection = db.collection('ticketAmounts');
      var ticketCounts = ticketCollection.findOne(function(err, item) {
	if (err) {
          console.log('ticketCount find error: ' + err);
          res.status(500).send(err);
        } else {
          console.log(JSON.stringify(item));
          ticketCollection.update(
            {_id: item._id}, 
            { $set:
              {
                F7: item.F7 - req.body.friday7Tickets,
                F9: item.F9 - req.body.friday9Tickets,
                S7: item.S7 - req.body.saturday7Tickets,
                S9: item.S9 - req.body.saturday9Tickets 
              }
            },
            {w:1},
            function(err, result) {
              if (err) {
                console.log("Error on update: " + err);
                res.status(500).send(err);
              } else {
                console.log("Update result: " + JSON.stringify(result));
                var purchasers = db.collection('purchaseRecords');
                purchasers.insert(
  	          {
	            name: req.body.name,
                    email: req.body.email,
                    tickets: {
                      F7: req.body.friday7Tickets ? req.body.friday7Tickets : 0,
                      F9: req.body.friday9Tickets ? req.body.friday9Tickets : 0,
                      S7: req.body.saturday7Tickets ? req.body.saturday7Tickets : 0,
                      S9: req.body.saturday9Tickets ? req.body.saturday9Tickets : 0
                    }
                  },
                  {w:1},          
                  function(err, result) {
                    if (err) {
                      console.log('Error on insert into purchaseRecords: ' + err);
                      res.status(500).send(err);
                    } else {
                      console.log('Purchase Records result: ' + JSON.stringify(result));
                      db.close();
                      res.send('Success!');
                    }
                  }
                );
              }
            }
          );
        }
      });
    }
  });
});

router.get('/admin/api/tickets', function(req, res) {
  var url = 'mongodb://localhost:27017/tickets';
  MongoClient.connect(url, function(err, db) {
    var ticketCounts = db.collection('ticketAmounts');
    ticketCounts.findOne(function(err, item) {
      res.send(item);
    });
  });
});

module.exports = router;
