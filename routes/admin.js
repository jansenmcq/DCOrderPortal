var express = require('express');
var router = express.Router();
var expressSession = require('express-session');
var MongoClient = require('mongodb').MongoClient;
var PromisedMongo = require('promised-mongo');
var mongoURL = 'mongodb://localhost:27017/tickets';
var json2csv = require('json2csv');
var fs = require('fs');
var userRoutes = require('./users');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;


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
    MongoClient.connect(mongoURL, function(err, db) {
        var userDatabase = db.collection('users');
        userDatabase.findOne(function (err, user) {
            if (err) {
                console.log('There was an error upon trying to find the user record');
                return done('Temporary Database Error. Try again later');
            } else {
                if (user.username == username && user.password == password) {
                    return done(null, user);
                } else {
                    return done(null, false, {message: 'incorrect username or password. Are you sure you should be here?'});
                }
            }
        });
    });
}));

passport.serializeUser(function(user, cb) {
    cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
    MongoClient.connect(mongoURL, function(err, db) {
        var userDatabase = db.collection('users');
        userDatabase.findOne(function (err, user) {
            if (err) {
                console.log('There was an error upon trying to find the user record');
                cb('Temporary Database Error. Try again later');
            } else {
                if (id === user.id) {
                    cb(null, user);
                } else {
                    cb(null, false, {message: 'incorrect username or password. Are you sure you should be here?'});
                }
            }
        });
    });
});

router.use('/userAPI', userRoutes);

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
    var db = PromisedMongo(mongoURL);
    var shows = db.collection('showInfo');
    var returnObject = {};
    shows.findOne({infoType: 'enableShow'})
    .then(function(item) {
        returnObject.enabledShows = item.data.enabledShows;
        return shows.findOne({infoType: 'showNames'})
    })
    .then(function(item) {
        returnObject.showNames = item.data;
        returnObject.title = 'Admin';
        returnObject.user = req.user;
        returnObject.page = 'home';

        db.close();
        res.render('adminHome', returnObject);
    })
    .catch(function(err) {
        console.log('Error on fetching enabled ticket information for admin Tickets', err);
        res.status(500).send(err);
    });
});

router.get('/editAccount', function(req, res) {
    var db = PromisedMongo(mongoURL);
    var shows = db.collection('showInfo');
    var returnObject = {};
    shows.findOne({infoType: 'enableShow'})
    .then(function(item) {
        returnObject.enabledShows = item.data.enabledShows;
        return shows.findOne({infoType: 'showNames'})
    })
    .then(function(item) {
        returnObject.showNames = item.data;
        returnObject.title = 'Admin - accountSettings';
        returnObject.user = req.user;
        returnObject.page = 'accountSettings';

        db.close();
        res.render('adminSettings', returnObject);
    })
    .catch(function(err) {
        console.log('Error on fetching enabled ticket information for admin Tickets', err);
        res.status(500).send(err);
    });
});

router.get('/editTickets', function(req, res) {
    var db = PromisedMongo(mongoURL);
    var shows = db.collection('showInfo');
    var returnObject = {};
    shows.findOne({infoType: 'enableShow'})
    .then(function(item) {
        returnObject.enabledShows = item.data.enabledShows;
        return shows.findOne({infoType: 'showNames'})
    })
    .then(function(item) {
        returnObject.showNames = item.data;
        returnObject.title = 'Admin - edit tickets';
        returnObject.user = req.user;
        returnObject.page = 'tickets';

        db.close();
        res.render('adminTickets', returnObject);
    })
    .catch(function(err) {
        console.log('Error on fetching enabled ticket information for admin Tickets', err);
        res.status(500).send(err);
    });
});

router.get('/editShowInfo', function(req, res) {
    var db = PromisedMongo(mongoURL);
    var shows = db.collection('showInfo');
    var returnObject = {};
    shows.findOne({infoType: 'enableShow'})
    .then(function(item) {
        returnObject.enabledShows = item.data.enabledShows;
        return shows.findOne({infoType: 'showNames'})
    })
    .then(function(item) {
        returnObject.showNames = item.data;
        returnObject.title = 'Admin - edit show';
        returnObject.user = req.user;
        returnObject.page = 'showInfo';

        db.close();
        res.render('adminShowInfo', returnObject);
    })
    .catch(function(err) {
        console.log('Error on fetching enabled ticket information for admin Tickets', err);
        res.status(500).send(err);
    });
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
    if ('F7' in req.body) {
        setTickets.F7 = normalizeTicketNumber(req.body.F7);
    }
    if ('F9' in req.body) {
        setTickets.F9 = normalizeTicketNumber(req.body.F9);
    }
    if ('S7' in req.body) {
        setTickets.S7 = normalizeTicketNumber(req.body.S7);
    }
    if ('S9' in req.body) {
        setTickets.S9 = normalizeTicketNumber(req.body.S9);
    }
    if ('T1' in req.body) {
        setTickets.T1 = normalizeTicketNumber(req.body.T1);
    }
    if ('T2' in req.body) {
        setTickets.T2 = normalizeTicketNumber(req.body.T2);
    }
    if ('T3' in req.body) {
        setTickets.T3 = normalizeTicketNumber(req.body.T3);
    }
    if ('T4' in req.body) {
        setTickets.T4 = normalizeTicketNumber(req.body.T4);
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
    if (req.body.T1) {
        updateTickets.T1 = normalizeTicketNumber(req.body.T1);
    }
    if (req.body.T2) {
        updateTickets.T2 = normalizeTicketNumber(req.body.T2);
    }
    if (req.body.T3) {
        updateTickets.T3 = normalizeTicketNumber(req.body.T3);
    }
    if (req.body.T4) {
        updateTickets.T4 = normalizeTicketNumber(req.body.T4);
    }
    //console.log(updateTickets);
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

router.post('/accountsapi/presidencyactions/changeUsername', function(req, res) {
    var db = PromisedMongo(mongoURL);
    var users = db.collection('users');
    users.update({}, {$set: {username: req.body.username}})
    .then(function(result) {
        return users.findOne();
    })
    .then(function(result) {
        db.close();
        res.status(200).send({newUsername: result.username});
    })
    .catch(function(err) {
        console.log('Error on changing user name:', err);
        res.status(500).send(err);
    })
});

router.post('/accountsapi/presidencyactions/changePassword', function(req, res) {
    var db = PromisedMongo(mongoURL);
    var users = db.collection('users');
    users.update({}, {$set: {password: req.body.password}})
    .then(function(result) {
        return users.findOne();
    })
    .then(function(result) {
        db.close();
        res.status(200).send({newPassword: result.password});
    })
    .catch(function(err) {
        console.log('Error on changing user name:', err);
        res.status(500).send(err);
    });
});

router.post('/recordsapi/presidencyactions/sanitizeDatabase', function(req, res) {
    var db = PromisedMongo(mongoURL);
    var newTickets = {};
    var showInfo = db.collection('showInfo');
    var purchaseRecords = db.collection('purchaseRecords');
    var tickets = db.collection('ticketAmounts');

    showInfo.findOne({infoType: 'enableShow'})
    .then(function(enabled) {
        var enabledShows = enabled.data.enabledShows;
        for (show in enabledShows) {
            if (enabledShows[show]) {
                var showCode = show.substr(0,2);
                newTickets[showCode] = 0;
                updateTickets[showCode] = 0;
            }
        }
        return purchaseRecords.find({paymentCompleted: false}).toArray()
    })
    .then(function(failedAttempts) {
        failedAttempts.forEach(function(failedPurchase) {
            for (show in failedPurchase.tickets) {
                newTickets[show] += failedPurchase.tickets[show];
            }
        });
        return tickets.update({}, {$inc:newTickets})
    })
    .then(function(updateMessage) {
        console.log('The update message from the call to sanitizeDatabase reads: ', updateMessage);
        return purchaseRecords.remove({paymentCompleted: false})
    })
    .then(function(deleteMessage) {
        console.log('The delete message from the call to sanitizeDaabase reads:', deleteMessage);
        res.status(200).send('success');
    })
    .catch(function (error) {
       console.log('Error on sanitizing the database:', error);
    });
});

module.exports = router;