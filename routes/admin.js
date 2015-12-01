var express = require('express');
var router = express.Router();
var expressSession = require('express-session');
var MongoClient = require('mongodb').MongoClient;
var json2csv = require('json2csv');
var fs = require('fs');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var mongoURL = 'mongodb://localhost:27017/tickets';

var userObject = {username: 'byudc', password: 'getitgetit', id: 21};

var isAuthenticated = function(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.redirect('/login');
    }
};

var normalizeTicketNumber = function(ticketAmount) {
    return parseInt(ticketAmount) ? parseInt(ticketAmount) : 0;
};

passport.use(new LocalStrategy(function(username, password, done) {
    if (username === 'byudc' && password === 'getitgetit') {
        return done(null, userObject);
    } else {
        return done(null, false, {message: 'incorrect username or password. Are you sure you should be here?'});
    }
}));

passport.serializeUser(function(user, cb) {
    cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
    if (id === 21) {
        cb(null, userObject)
    } else {
        cb(null, false, {message: 'incorrect username or password. Are you sure you should be here?'});
    }
});


router.use(expressSession({secret: 'getitbyudc', resave: false, saveUninitialized: false}));

router.use(passport.initialize());
router.use(passport.session());

router.post('/login',
    passport.authenticate('local', {failureRedirect: '/login' }),
    function(req, res) {
        res.redirect('/admin');
    }
);

router.use(isAuthenticated);

router.get('/', function(req, res) {
    res.render('admin', {title: 'Admin', user: req.user});
});


router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});


router.get('/recordsapi/presidencyactions/report', function(req, res) {
    MongoClient.connect(mongoURL, function(err, db) {
        var records = db.collection('purchaseRecords');
        records.find().toArray(function(err, purchaseRecords) {
            var fields = ['name', 'email', 'tickets.F7', 'tickets.F9', 'tickets.S7', 'tickets.S9', 'paymentCompleted', 'timeStamp', 'meta'];
            var fieldNames = ['name', 'email', 'Friday 7', 'Friday 9', 'Saturday 7', 'Saturday 9', 'Confirmed Payment', 'Time Stamp', 'Meta Data'];
            json2csv({data: purchaseRecords, fields: fields, fieldNames: fieldNames, nested: true}, function(err, csv) {
                if (err) {
                    console.log(err);
                    res.status(500).send('Database failure');
                    return;
                } else {
                    fs.writeFile('public/purchaseRecords.csv', csv, function(err) {
                        if (err) {
                            console.log(err);
                            res.status(500).send('Database failure');
                            return;
                        } else {
                            db.close();
                            res.download('public/purchaseRecords.csv');
                        }
                    });
                }
            });
        });

    });

});

router.post('/ticketapi/presidencyactions/set', function(req, res) {
    var setTickets = {};
    if (req.body.F7) {
        setTickets.F7 = normalizeTicketNumber(req.body.F7);
    }
    if (req.body.F9) {
        setTickets.F9 = normalizeTicketNumber(req.body.F9);
    }
    if (req.body.S7) {
        setTickets.S7 = normalizeTicketNumber(req.body.S7);
    }
    if (req.body.S9) {
        setTickets.S9 = normalizeTicketNumber(req.body.S9);
    }
    MongoClient.connect(mongoURL, function(err, db) {
        var tickets = db.collection('ticketAmounts');
        tickets.updateOne(
            {},
            {$set: setTickets},
            {w:1},
            function(err, result) {
                if (err) {
                    console.log(err);
                    res.status(500).send('Database failure, please try again');
                    return;
                } else {
                    db.close();
                    res.send('success');
                    return;
                }
            }
        );
    });
});

router.post('/ticketapi/presidencyactions/update', function(req, res) {
    var updateTickets = {};
    if (req.body.F7) {
        updateTickets.F7 = normalizeTicketNumber(req.body.F7);
    }
    if (req.body.F9) {
        updateTickets.F9 = normalizeTicketNumber(req.body.F9);
    }
    if (req.body.S7) {
        updateTickets.S7 = normalizeTicketNumber(req.body.S7);
    }
    if (req.body.S9) {
        updateTickets.S9 = normalizeTicketNumber(req.body.S9);
    }
    console.log(updateTickets);
    MongoClient.connect(mongoURL, function(err, db) {
        var tickets = db.collection('ticketAmounts');
        console.log("here");
        tickets.updateOne(
            {},
            {$inc: updateTickets},
            {w:1},
            function(err, result) {
                if (err) {
                    console.log(err);
                    res.status(500).send('Database failure, please try again');
                    return;
                } else {
                    db.close();
                    res.status(200).send('success');
                }
            }
        );
    });
});



module.exports = router;