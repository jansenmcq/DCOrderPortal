var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var json2csv = require('json2csv');
var fs = require('fs');
var mongoURL = 'mongodb://localhost:27017/tickets';
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

//passport.use(new LocalStrategy(function(username, password, done) {
//    console.log("STRATERRRGY");
//    if (username === 'byudc' && password === 'getitgetit') {
//        console.log("GOOORRD");
//        return done(null, {username: 'byudc', password: 'getit'});
//    } else {
//        console.log("WRRRRORRRRNGGG");
//        return done(null, false, {message: 'incorrect username or password. Are you sure you should be here?'});
//    }
//}));
//
//var isAuthenticated = function(req, res, next) {
//    if (req.isAuthenticated()) {
//        return next();
//    } else {
//        res.redirect('/login');
//    }
//};

/* GET home page. */
router.get('/', function(req, res) {
    res.redirect('/tickets');
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

//router.get('/login', function(req, res) {
//    res.render('login');
//});

router.get('/admin'/*, isAuthenticated*/, function(req, res) {
    res.render('admin');
});

router.get('/test', function(req, res) {
    res.send("Site is up and running, sir!");
});

//router.post('/login',
//    passport.authenticate('local',
//        {   successRedirect: '/admin',
//            failureRedirect: '/login',
//            failureFlash: true
//        }
//    )
//);

router.post('/testtest', function(req, res) {

    MongoClient.connect(mongoURL, function(err, db) {
        var ticketCollection = db.collection('ticketAmounts');
        var ticketCounts = ticketCollection.findOne(function(err, item) {
            //console.log('async '+JSON.stringify(item));
            res.send('all good');
        });
        //console.log('sync '+JSON.stringify(ticketCounts));
    });
});

router.post('/checkout', function(req, res) {
    var mongoURL = 'mongodb://localhost:27017/tickets';
    MongoClient.connect(mongoURL, function(err, db) {
        if (err) {
            console.log('boo hoo it not wanna connect :?');
        } else {
            var ticketCollection = db.collection('ticketAmounts');
            ticketCollection.findOne(function(err, item) {
                if (err) {
                    console.log('ticketCount find error: ' + err);
                    res.status(500);
                } else {
                    var remainingF7 = item.F7 - req.body.friday7Tickets;
                    var remainingF9 = item.F9 - req.body.friday9Tickets;
                    var remainingS7 = item.S7 - req.body.saturday7Tickets;
                    var remainingS9 = item.S9 - req.body.saturday9Tickets;
                    if(remainingF7 < 0 || remainingF9 < 0 || remainingS7 < 0 || remainingS9 < 0) {
                        var errorMessage = {error:{}};
                        if (remainingF7 < 0) {
                            errorMessage.error.F7 = item.F7;
                        }
                        if (remainingF9 < 0) {
                            errorMessage.error.F9 = item.F9;
                        }
                        if (remainingS7 < 0) {
                            errorMessage.error.S7= item.S7;
                        }
                        if (remainingS9 < 0) {
                            errorMessage.error.S9 = item.S9;
                        }
                        //console.log("Error: " + JSON.stringify(errorMessage));
                        db.close();
                        res.status(200).send(errorMessage);
                        return;
                    }
                    ticketCollection.update(
                        {_id: item._id},
                        { $set:
                        {
                            F7: remainingF7,
                            F9: remainingF9,
                            S7: remainingS7,
                            S9: remainingS9
                        }
                        },
                        {w:1},
                        function(err, result) {
                            if (err) {
                                console.log("Error on update: " + err);
                                res.status(500);
                            } else {
                                //console.log("Update result: " + JSON.stringify(result));
                                var purchasers = db.collection('purchaseRecords');
                                purchasers.insert(
                                    {
                                        name: req.body.name,
                                        email: req.body.email,
                                        tickets: {
                                            F7: parseInt(req.body.friday7Tickets) ? parseInt(req.body.friday7Tickets) : 0,
                                            F9: parseInt(req.body.friday9Tickets) ? parseInt(req.body.friday9Tickets) : 0,
                                            S7: parseInt(req.body.saturday7Tickets) ? parseInt(req.body.saturday7Tickets) : 0,
                                            S9: parseInt(req.body.saturday9Tickets) ? parseInt(req.body.saturday9Tickets) : 0
                                        },
                                        paymentCompleted: false
                                    },
                                    {w:1},
                                    function(err, result) {
                                        if (err) {
                                            console.log('Error on insert into purchaseRecords: ' + err);
                                            res.status(500);
                                        } else {
                                            //console.log('Purchase Records result: ' + JSON.stringify(result));
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


/** This route requires an email address to be sent in the POST body
 *
 */
router.post('/checkout/payment_completed', function(req, res) {
    //console.log(JSON.stringify(req.body));
    if (!req.body.ref1val1) {
        console.log("Payment Complete Notification returned the following in the body: " + JSON.stringify(req.body));
        res.status(400).send('Must include email in the POST body with the key "ref1val1"');
        return;
    }
    MongoClient.connect(mongoURL, function(err, db) {
        var purchaseRecords = db.collection('purchaseRecords');
        purchaseRecords.find({email: req.body.ref1val1}).toArray(function(err, itemList) {
            if (err) {
                console.log('Error on find purchase record once payment was complete');
                res.status(500);
                return;
            } else {
                if (itemList.length == 0) {
                    //console.log('No matching record found');
                    res.redirect('http://www.byudivinecomedy.com/');
                    return;
                }
                var item = itemList[itemList.length - 1];
                //console.log(JSON.stringify(item));
                purchaseRecords.update(
                    {_id: item._id},
                    { $set:
                    {
                        paymentCompleted: true
                    }
                    },
                    {w:1},
                    function(err, result) {
                        if (err) {
                            console.log('Error on update purchase record');
                            res.status(500);
                            return;
                        } else {
                            db.close();
                            res.redirect('http://www.byudivinecomedy.com/');
                        }
                    }
                );
            }
        });
    });
});

/** This route requires an email address to be sent in the POST body
 *
 */
router.post('/checkout/payment_failed', function(req, res) {
    if (!req.body.ref1val1) {
        console.log("Payment Failure Notification returned the following in the body: " + JSON.stringify(req.body));
        res.status(400).send('Must include email in the POST body with the key "ref1val1"');
        return;
    }
    MongoClient.connect(mongoURL, function(err, db) {
        var purchaseRecords = db.collection('purchaseRecords');
        purchaseRecords.find({email: req.body.ref1val1}).toArray(function(err, purchaseItemList) {
            if (err) {
                console.log('Error on find purchase record when payment failed');
                res.status(500);
                return;
            } else {
                if (purchaseItemList.length == 0) {
                    //console.log('No matching record found');
                    res.redirect('http://www.byudivinecomedy.com/');
                    return;
                } else {
                    var purchaseItem = purchaseItemList[purchaseItemList.length - 1];
                    //console.log(JSON.stringify(purchaseItem));
                    var restoreF7 = parseInt(purchaseItem.tickets.F7);
                    var restoreF9 = parseInt(purchaseItem.tickets.F9);
                    var restoreS7 = parseInt(purchaseItem.tickets.S7);
                    var restoreS9 = parseInt(purchaseItem.tickets.S9);
                    var ticketCounts = db.collection('ticketAmounts');
                    ticketCounts.findOne(function (err, item) {
                        if (err) {
                            console.log('ticketCount find error: ' + err);
                            res.status(500);
                            return;
                        } else {
                            //console.log(JSON.stringify(item));
                            var remainingF7 = item.F7 + restoreF7;
                            var remainingF9 = item.F9 + restoreF9;
                            var remainingS7 = item.S7 + restoreS7;
                            var remainingS9 = item.S9 + restoreS9;
                            //console.log(remainingF7 + ' ' + remainingF9 + ' ' + remainingS7 + ' ' + remainingS9);
                            ticketCounts.update(
                                {_id: item._id},
                                {
                                    $set: {
                                        F7: remainingF7,
                                        F9: remainingF9,
                                        S7: remainingS7,
                                        S9: remainingS9
                                    }
                                },
                                {w: 1},
                                function (err, result) {
                                    if (err) {
                                        console.log("Error on update: " + err);
                                        res.status(500);
                                        return;
                                    } else {
                                        purchaseRecords.deleteOne({_id: purchaseItem._id}, function (err, result) {
                                            if (err) {
                                                console.log('Error on deleting record: ' + err);
                                                res.status(500);
                                                return;
                                            } else {
                                                //console.log(JSON.stringify(result));
                                                db.close();
                                                res.redirect('http://www.byudivinecomedy.com/');
                                            }
                                        });
                                    }
                                }
                            );
                        }
                    });
                }
            }
        });
    });
});

router.post('/checkout/logout/:email', function(req, res) {
    console.log('HERE');
    if (!req.body.hasOwnProperty('result') && !req.body.hasOwnProperty('response')) {
        console.log('no response field passed into logout route');
        
        res.status(400).send('Must have transaction result field');
        return;
    }
    if (!req.params.email) {
        console.log('No email parameter passed into logout route');
        res.status(400).send('Must send email address with route');
        return;
    }
    var response = req.body.hasOwnProperty('result') ? parseInt(req.body.result) : parseInt(req.body.response);
    if (response == 0) {//Was successful, need to update the purchaser's record to reflect this
        MongoClient.connect(mongoURL, function(err, db) {
            //if (err) //console.log(err);
            var purchaseRecords = db.collection('purchaseRecords');
            purchaseRecords.find({email: req.params.email}).toArray(function(err, itemList) {
                if (err) {
                    console.log('Error on find purchase record once payment was complete');
                    res.status(500);
                    return;
                } else {
                    if (itemList.length == 0) {
                        console.log('No matching record found');
                        res.redirect('http://www.byudivinecomedy.com/');
                        return;
                    }
                    var item = itemList[itemList.length - 1];
                    //console.log(JSON.stringify(item));
                    purchaseRecords.update(
                        {_id: item._id},
                        { $set:
                        {
                            paymentCompleted: true
                        }
                        },
                        {w:1},
                        function(err, result) {
                            if (err) {
                                console.log('Error on update purchase record');
                                res.status(500);
                                return;
                            } else {
                                db.close();
                                res.redirect('http://www.byudivinecomedy.com/');
                            }
                        }
                    );
                }
            });
        });
    } else {//purchase was unsuccessful, wipe record from database
        console.log("Made it to the unsuccessful purchase");
        MongoClient.connect(mongoURL, function(err, db) {
            console.log('connected to the mongo');
            var purchaseRecords = db.collection('purchaseRecords');
            purchaseRecords.find({email: req.params.email}).toArray(function(err, purchaseItemList) {
                if (err) {
                    console.log('Error on find purchase record when payment failed');
                    res.status(500);
                    return;
                } else {
                    console.log(JSON.stringify(purchaseItemList));
                    if (purchaseItemList.length == 0) {
                        console.log('No matching record found');
                        res.redirect('http://www.byudivinecomedy.com/');
                        return;
                    } else {

                        var purchaseItem = purchaseItemList[purchaseItemList.length - 1];
                        console.log(JSON.stringify(purchaseItem));
                        var restoreF7 = parseInt(purchaseItem.tickets.F7);
                        var restoreF9 = parseInt(purchaseItem.tickets.F9);
                        var restoreS7 = parseInt(purchaseItem.tickets.S7);
                        var restoreS9 = parseInt(purchaseItem.tickets.S9);
                        var ticketCounts = db.collection('ticketAmounts');
                        ticketCounts.findOne(function (err, item) {
                            if (err) {
                                console.log('ticketCount find error: ' + err);
                                res.status(500);
                                return;
                            } else {
                                //console.log(JSON.stringify(item));
                                var remainingF7 = item.F7 + restoreF7;
                                var remainingF9 = item.F9 + restoreF9;
                                var remainingS7 = item.S7 + restoreS7;
                                var remainingS9 = item.S9 + restoreS9;
                                //console.log(remainingF7 + ' ' + remainingF9 + ' ' + remainingS7 + ' ' + remainingS9);
                                ticketCounts.update(
                                    {_id: item._id},
                                    {
                                        $set: {
                                            F7: remainingF7,
                                            F9: remainingF9,
                                            S7: remainingS7,
                                            S9: remainingS9
                                        }
                                    },
                                    {w: 1},
                                    function (err, result) {
                                        if (err) {
                                            console.log("Error on update: " + err);
                                            res.status(500);
                                            return;
                                        } else {
                                            purchaseRecords.deleteOne({_id: purchaseItem._id}, function (err, result) {
                                                if (err) {
                                                    console.log('Error on deleting record: ' + err);
                                                    res.status(500);
                                                    return;
                                                } else {
                                                    //console.log(JSON.stringify(result));
                                                    db.close();
                                                    res.redirect('http://www.byudivinecomedy.com/');
                                                }
                                            });
                                        }
                                    }
                                );
                            }
                        });
                    }
                }
            });
        });
    }
});

router.get('/admin/api/tickets', function(req, res) {
    var mongoURL = 'mongodb://localhost:27017/tickets';
    MongoClient.connect(mongoURL, function(err, db) {
        var ticketCounts = db.collection('ticketAmounts');
        ticketCounts.findOne(function(err, item) {
            db.close();
            res.send(item);
        });
    });
});

router.get('/admin/api/report', function(req, res) {
    var mongoURL = 'mongodb://localhost:27017/tickets';
    MongoClient.connect(mongoURL, function(err, db) {
        var records = db.collection('purchaseRecords');
        records.find().toArray(function(err, purchaseRecords) {
            var fields = ['name', 'email', 'tickets.F7', 'tickets.F9', 'tickets.S7', 'tickets.S9', 'paymentCompleted'];
            var fieldNames = ['name', 'email', 'Friday 7', 'Friday 9', 'Saturday 7', 'Saturday 9', 'Confirmed Payment'];
            json2csv({data: purchaseRecords, fields: fields, fieldNames: fieldNames, nested: true}, function(err, csv) {
                if (err) {
                    console.log(err);
                    res.status(500);
                    return;
                } else {
                    fs.writeFile('public/purchaseRecords.csv', csv, function(err) {
                        if (err) {
                            console.log(err);
                            res.status(500);
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

module.exports = router;
