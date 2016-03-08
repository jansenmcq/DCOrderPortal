var express = require('express');
var router = express.Router();
var expressSession = require('express-session');
var json2csv = require('json2csv');
var fs = require('fs');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

module.exports = function(database) {

    var db = database;

    var convertFieldsToBoolean = function(object) {
        var newObject = {};
        for (var key in object) {
            if (typeof object[key] != 'object') {
                if (object[key] == 'true') {
                    newObject[key] = true;
                } else if (object[key] == 'false') {
                    newObject[key] = false;
                } else {
                    newObject[key] = object[key];
                }
            } else {
                newObject[key] = convertFieldsToBoolean(object[key]);
            }
        }
        return newObject;
    };

    var isAuthenticated = function (req, res, next) {
        if (req.user) {
            next();
        } else {
            res.redirect('/login');
        }
    };

    var normalizeTicketNumber = function (ticketAmount) {
        return parseInt(ticketAmount) ? parseInt(ticketAmount) : 0;
    };

    passport.use(new LocalStrategy(function (username, password, done) {
        var userDatabase = db.collection('users');
        userDatabase.findOne()
        .then(function (user) {
            if (user.username == username && user.password == password) {
                return done(null, user);
            } else {
                return done(null, false, {message: 'incorrect username or password. Are you sure you should be here?'});
            }
        })
        .catch(function(err) {
            console.log('Error on setting ticket amounts for admin ticket update route:', err);
            return done('Temporary Database Error. Try again later');
        });
    }));

    passport.serializeUser(function (user, cb) {
        cb(null, user.id);
    });

    passport.deserializeUser(function (id, callback) {
        var userDatabase = db.collection('users');
        userDatabase.findOne()
        .then(function (user) {
            if (id === user.id) {
                callback(null, user);
            } else {
                callback(null, false, {message: 'incorrect username or password. Are you sure you should be here?'});
            }
        })
        .catch(function(err) {
            console.log('Error on finding the user record for admin deserializeUser function:', err);
            callback('Temporary Database Error. Try again later');
        });
    });

    router.use(expressSession({secret: 'getitbyudc', resave: false, saveUninitialized: false}));

    router.use(passport.initialize());
    router.use(passport.session());

    router.post('/login',
        passport.authenticate('local', {failureRedirect: '/login'}),
        function (req, res) {
            res.redirect('/admin');
        }
    );

    router.use(isAuthenticated);

    router.get('/', function (req, res) {
        var shows = db.collection('showInfo');
        var returnObject = {};
        shows.findOne({infoType: 'enableShow'})
            .then(function (item) {
                returnObject.enabledShows = item.data.enabledShows;
                return shows.findOne({infoType: 'showNames'})
            })
            .then(function (item) {
                returnObject.showNames = item.data;
                returnObject.title = 'Admin';
                returnObject.user = req.user;
                returnObject.page = 'home';
                return shows.findOne({infoType: 'bannerText'})
            })
            .then(function(item) {
                returnObject.bannerText = item.data;
                res.render('adminHome', returnObject);
            })
            .catch(function (err) {
                console.log('Error on fetching enabled ticket information for admin Tickets', err);
                res.status(500).send('Temporary internal error. Please wait for a few minutes and try again!');
            });
    });

    router.get('/editAccount', function (req, res) {
        var shows = db.collection('showInfo');
        var returnObject = {};
        shows.findOne({infoType: 'enableShow'})
            .then(function (item) {
                returnObject.enabledShows = item.data.enabledShows;
                return shows.findOne({infoType: 'showNames'})
            })
            .then(function (item) {
                returnObject.showNames = item.data;
                returnObject.title = 'Admin - accountSettings';
                returnObject.user = req.user;
                returnObject.page = 'accountSettings';
                return shows.findOne({infoType: 'bannerText'})
            })
            .then(function(item) {
                returnObject.bannerText = item.data;
                res.render('adminSettings', returnObject);
            })
            .catch(function (err) {
                console.log('Error on fetching enabled ticket information for admin Tickets', err);
                res.status(500).send(err);
            });
    });

    router.get('/editTickets', function (req, res) {
        var shows = db.collection('showInfo');
        var returnObject = {};
        shows.findOne({infoType: 'enableShow'})
            .then(function (item) {
                returnObject.enabledShows = item.data.enabledShows;
                return shows.findOne({infoType: 'showNames'})
            })
            .then(function (item) {
                returnObject.showNames = item.data;
                returnObject.title = 'Admin - edit tickets';
                returnObject.user = req.user;
                returnObject.page = 'tickets';
                return shows.findOne({infoType: 'bannerText'})
            })
            .then(function(item) {
                returnObject.bannerText = item.data;
                res.render('adminTickets', returnObject);
            })
            .catch(function (err) {
                console.log('Error on fetching enabled ticket information for admin Tickets', err);
                res.status(500).send(err);
            });
    });

    router.get('/editShowInfo', function (req, res) {
        var shows = db.collection('showInfo');
        var returnObject = {};
        shows.findOne({infoType: 'enableShow'})
            .then(function (item) {
                returnObject = item.data;
                return shows.findOne({infoType: 'showNames'})
            })
            .then(function (item) {
                returnObject.showNames = item.data;
                return shows.findOne({infoType: 'showTimeText'})
            })
            .then(function (item) {
                returnObject.showTimeText = item.data;
                return shows.findOne({infoType: 'bannerText'})
            })
            .then(function(item) {
                returnObject.bannerText = item.data;
                returnObject.title = 'Admin - edit show';
                returnObject.user = req.user;
                returnObject.page = 'showInfo';
                res.render('adminShowInfo', returnObject);
            })
            .catch(function (err) {
                console.log('Error on fetching enabled ticket information for admin Tickets', err);
                res.status(500).send('Temporary internal error. Please wait for a few minutes and try again!');
            });
    });

    router.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });


    router.get('/recordsapi/presidencyactions/report', function (req, res) {
        var records = db.collection('purchaseRecords');
        records.find().toArray()
            .then(function (purchaseRecords) {
                var fields = ['name', 'email', 'tickets.F7', 'tickets.F9', 'tickets.S7', 'tickets.S9', 'paymentCompleted', 'timeStamp', 'meta'];
                var fieldNames = ['name', 'email', 'Friday 7', 'Friday 9', 'Saturday 7', 'Saturday 9', 'Confirmed Payment', 'Time Stamp', 'Meta Data'];
                json2csv({
                    data: purchaseRecords,
                    fields: fields,
                    fieldNames: fieldNames,
                    nested: true
                }, function (err, csv) {
                    if (err) {
                        console.log('Error on converting purchase records to JSON:', err);
                        res.status(500).send('Database failure');
                        return;
                    } else {
                        fs.writeFile('public/purchaseRecords.csv', csv, function (err) {
                            if (err) {
                                console.log('Error on writing purchase records JSON to file:', err);
                                res.status(500).send('Database failure');
                                return;
                            } else {
                                res.download('public/purchaseRecords.csv');
                            }
                        });
                    }
                });
            }).catch(function (err) {
            console.log('Error on fetching purchase records for admin tickets report', err);
            res.status(500).send('Temporary internal error. Please wait for a few minutes and try again!');
        });
    });

    router.post('/ticketapi/presidencyactions/set', function (req, res) {
        console.log(req.body);
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
        var tickets = db.collection('ticketAmounts');
        tickets.updateOne({}, {$set: setTickets})
            .then(function (result) {
                res.send('success');
                return;
            })
            .catch(function (err) {
                console.log('Error on setting ticket amounts for admin Ticket set', err);
                res.status(500).send('Temporary internal error. Please wait for a few minutes and try again!');
            });
    });

    router.post('/ticketapi/presidencyactions/update', function (req, res) {
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
        var tickets = db.collection('ticketAmounts');
        tickets.updateOne({}, {$inc: updateTickets})
            .then(function (result) {
                res.status(200).send('success');
            })
            .catch(function (err) {
                console.log('Error on setting ticket amounts for admin ticket update route:', err);
                res.status(500).send('Temporary internal error. Please wait for a few minutes and try again!');
            });
    });

    router.post('/accountsapi/presidencyactions/changeUsername', function (req, res) {
        var users = db.collection('users');
        /*var newId = Math.floor(Math.random() * 100)*/
        users.update({}, {$set: {username: req.body.username/*, id: newId*/}})
            .then(function (result) {
                return users.findOne();
            })
            .then(function (result) {
                res.status(200).send({newUsername: result.username});
            })
            .catch(function (err) {
                console.log('Error on changing user name:', err);
                res.status(500).send('Temporary internal error. Please wait for a few minutes and try again!');
            })
    });

    router.post('/accountsapi/presidencyactions/changePassword', function (req, res) {
        var users = db.collection('users');
        /*var newId = Math.floor(Math.random() * 100)*/
        users.update({}, {$set: {password: req.body.password/*, id: newId*/}})
            .then(function (result) {
                return users.findOne();
            })
            .then(function (result) {
                res.status(200).send({newPassword: result.password});
            })
            .catch(function (err) {
                console.log('Error on changing user name:', err);
                res.status(500).send('Temporary internal error. Please wait for a few minutes and try again!');
            });
    });

    router.post('/recordsapi/presidencyactions/reset', function(req,res) {
        var purchaseRecords = db.collection('purchaseRecords');
        purchaseRecords.drop();
        res.status(200).send('success');
    });

    router.post('/infoapi/presidencyactions/saveinfo', function(req, res) {
        var enableShow = convertFieldsToBoolean(req.body.enableShow);
        console.log(enableShow);
        var showInfo = db.collection('showInfo');
        showInfo.update({infoType: 'enableShow'}, {$set: enableShow})
            .then(function (completed) {
                console.log('One');
                return showInfo.update({infoType: 'showNames'}, {$set: req.body.showNames})
            })
            .then(function (completed) {
                console.log('Two');
                return showInfo.update({infoType: 'showTimeText'}, {$set: req.body.showTimeText})
            })
            .then(function (completed) {
                console.log('Three');
                return showInfo.update({infoType: 'bannerText'}, {$set: req.body.bannerText});
            })
            .then(function (completed) {
                console.log('Four');
                res.status(200).send('success');
            })
            .catch(function(err) {
                console.log('Error on saving showInfo:', err);
                res.status(500).send('Temporary internal error. Please wait for a few minutes and try again!');
            })
    });

    router.post('/recordsapi/presidencyactions/sanitizeDatabase', function (req, res) {
        var newTickets = {};
        var showInfo = db.collection('showInfo');
        var purchaseRecords = db.collection('purchaseRecords');
        var tickets = db.collection('ticketAmounts');

        showInfo.findOne({infoType: 'enableShow'})
            .then(function (enabled) {
                var enabledShows = enabled.data.enabledShows;
                for (show in enabledShows) {
                    if (enabledShows[show]) {
                        var showCode = show.substr(0, 2);
                        newTickets[showCode] = 0;
                    }
                }
                return purchaseRecords.find({paymentCompleted: false}).toArray()
            })
            .then(function (failedAttempts) {
                failedAttempts.forEach(function (failedPurchase) {
                    for (show in failedPurchase.tickets) {
                        newTickets[show] += failedPurchase.tickets[show];
                    }
                });
                return tickets.update({}, {$inc: newTickets})
            })
            .then(function (updateMessage) {
                return purchaseRecords.remove({paymentCompleted: false})
            })
            .then(function (deleteMessage) {
                res.status(200).send(deleteMessage.result);
            })
            .catch(function (error) {
                console.log('Error on sanitizing the database:', error);
                res.status(500).send('Temporary internal error. Please wait for a few minutes and try again!');
            });
    });

    return router;
};
