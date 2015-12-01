var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var mongoURL = 'mongodb://localhost:27017/tickets';
var ObjectID = require('mongodb').ObjectID;
var passport = require('passport');

var adminRoutes = require('./admin');

var normalizeTicketNumber = function(ticketAmount) {
    return parseInt(ticketAmount) ? parseInt(ticketAmount) : 0;
};

router.use('/admin', adminRoutes);

/* GET home page. */
router.get('/', function(req, res) {
    //res.send('This site is down as there are no tickets to be sold. Sorry!')
    res.redirect('/tickets');
});

router.get('/tickets', function(req, res) {
    //res.send('This site is down as there are no tickets to be sold. Sorry!')
    //res.send('Sorry, we\'re experiencing technical difficulties right now. Please be patient and try again soon!');
    res.render('tickets', {title: 'Tickets'});
});

router.get('/login', function(req, res) {
    res.render('login', {title: 'Login'});
});

router.get('/test', function(req, res) {
    res.send("Site is up and running, sir!");
});


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
    MongoClient.connect(mongoURL, function(err, db) {
        if (err) {
            console.log('boo hoo it not wanna connect :?');
        } else {
            var ticketCollection = db.collection('ticketAmounts');
            ticketCollection.findOne(function(err, item) {
                if (err) {
                    console.log('ticketCount find error: ' + JSON.stringify(err));
                    res.status(500).send('Database failure');
                    return;
                } else {
                    var remainingF7 = item.F7 - normalizeTicketNumber(req.body.friday7Tickets);
                    var remainingF9 = item.F9 - normalizeTicketNumber(req.body.friday9Tickets);
                    var remainingS7 = item.S7 - normalizeTicketNumber(req.body.saturday7Tickets);
                    var remainingS9 = item.S9 - normalizeTicketNumber(req.body.saturday9Tickets);
                    if(remainingF7 < 0 || remainingF9 < 0 || remainingS7 < 0 || remainingS9 < 0) {
                        var errorMessage = {error: {tickets: {} } };
                        if (remainingF7 < 0) {
                            errorMessage.error.tickets.F7 = item.F7;
                        }
                        if (remainingF9 < 0) {
                            errorMessage.error.tickets.F9 = item.F9;
                        }
                        if (remainingS7 < 0) {
                            errorMessage.error.tickets.S7= item.S7;
                        }
                        if (remainingS9 < 0) {
                            errorMessage.error.tickets.S9 = item.S9;
                        }
                        //console.log("Error: " + JSON.stringify(errorMessage));
                        db.close();
                        res.status(200).send(errorMessage);
                        return;
                    }

                    var purchasers = db.collection('purchaseRecords');

                    purchasers.find({email: req.body.email, paymentCompleted: false}).toArray(function(err, failedPurchases) {
                        if (err) {
                            console.log('error in looking up past transactions');
                            res.status(500).send('Database failure');
                            return;
                        } else {
                            if (failedPurchases.length > 0) {
                                var errorMessage = {error: {unfinishedPurchase: failedPurchases[failedPurchases.length - 1] } };
                                db.close();
                                res.status(200).send(errorMessage);
                                return;
                            }
                            ticketCollection.updateOne(
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
                                        console.log("Error on update: " + JSON.stringify(err));
                                        res.status(500).send('Database failure');
                                    } else {
                                        //console.log("Update result: " + JSON.stringify(result));
                                        var date = new Date();
                                        date.setHours(date.getHours() - 6);
                                        purchasers.insert(
                                            {
                                                name: req.body.name,
                                                email: req.body.email,
                                                tickets: {
                                                    F7: normalizeTicketNumber(req.body.friday7Tickets),
                                                    F9: normalizeTicketNumber(req.body.friday9Tickets),
                                                    S7: normalizeTicketNumber(req.body.saturday7Tickets),
                                                    S9: normalizeTicketNumber(req.body.saturday9Tickets)
                                                },
                                                paymentCompleted: false,
                                                timeStamp: date.toJSON(),
                                                meta: ''
                                            },
                                            {w: 1},
                                            function (err, result) {
                                                if (err) {
                                                    console.log('Error on insert into purchaseRecords: ' + JSON.stringify(err));
                                                    res.status(500).send('Database failure');
                                                } else {
                                                    //console.log('Purchase Records result: ' + JSON.stringify(result));
                                                    db.close();
                                                    res.send('Success!');
                                                    //console.log("Affirm my concept of express");
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
        }
    });
});


/** This route requires an email address to be sent in the POST body
 *
 */
router.post('/checkout/payment_completed', function(req, res) {
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
                res.status(500).send('Database failure');
                return;
            } else {
                if (itemList.length == 0) {
                    console.log('No matching record found on completion of purchase for email: ', req.body.ref1val1);
                    console.log('  --If you see this it\'s because the record was deleted before being confirmed');
                    res.status(400).send('No matching record found');
                    return;
                }
                var item = itemList[itemList.length - 1];
                //console.log(JSON.stringify(item));
                purchaseRecords.updateOne(
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
                            res.status(500).send('Database failure');
                            return;
                        } else {
                            console.log('Payment confirmed for: ', req.body.ref1val1);
                            db.close();
                            //Changed from res.redirect('http://www.byudivinecomedy.com/');
                            //so that cashnet server believes they are going through
                            res.status(200).send('success');
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
                res.status(500).send('Database failure');
                return;
            } else {
                if (purchaseItemList.length == 0) {
                    console.log('No matching record found for email: ' + req.body.ref1val1);
                    res.status(400).send('No matching record found');
                    return;
                } else {
                    var purchaseItem = purchaseItemList[purchaseItemList.length - 1];
                    //console.log(JSON.stringify(purchaseItem));
                    if (purchaseItem.paymentCompleted) {
                        purchaseRecords.updateOne(
                            {_id: purchaseItem._id},
                            {
                                $set: {
                                    meta: 'Purchase already cleared, but received a failure notification'
                                }
                            },
                            {w:1},
                            function(err, result) {
                                if (err) {
                                    db.close();
                                    console.log('Purchase record update error: ' + JSON.stringify(err));
                                    res.status(500).send('Database failure');
                                    return;
                                } else {
                                    db.close();
                                    console.log('Received a failure notification for a purchase that was already cleared:');
                                    console.log('\t'+JSON.stringify(purchaseItem));
                                    //changing the following: res.redirect('http://www.byudivinecomedy.com/');
                                    //to a 200 so cashnet thinks it's okay
                                    res.status(200).send('No change');
                                    return;
                                }
                            });
                    }
                    var restoreF7 = normalizeTicketNumber(purchaseItem.tickets.F7);
                    var restoreF9 = normalizeTicketNumber(purchaseItem.tickets.F9);
                    var restoreS7 = normalizeTicketNumber(purchaseItem.tickets.S7);
                    var restoreS9 = normalizeTicketNumber(purchaseItem.tickets.S9);
                    var ticketCounts = db.collection('ticketAmounts');
                    ticketCounts.findOne(function (err, item) {
                        if (err) {
                            console.log('ticketCount find error: ' + JSON.stringify(err));
                            res.status(500).send('Database failure');
                            return;
                        } else {
                            //console.log(JSON.stringify(item));
                            var remainingF7 = item.F7 + restoreF7;
                            var remainingF9 = item.F9 + restoreF9;
                            var remainingS7 = item.S7 + restoreS7;
                            var remainingS9 = item.S9 + restoreS9;
                            //console.log(remainingF7 + ' ' + remainingF9 + ' ' + remainingS7 + ' ' + remainingS9);
                            ticketCounts.updateOne(
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
                                        console.log("Error on update: " + JSON.stringify(err));
                                        res.status(500).send('Database failure');
                                        return;
                                    } else {
                                        console.log(purchaseItem);
                                        purchaseRecords.deleteOne({_id: purchaseItem._id}, function (err, result) {
                                            if (err) {
                                                console.log('Error on deleting record: ' + JSON.stringify(err));
                                                res.status(500).send('Database failure');
                                                return;
                                            } else {
                                                console.log('Deleting record:');
                                                console.log(JSON.stringify(result));
                                                db.close();
                                                console.log('Payment failed from cashnet for: ' + purchaseItem.email);
                                                //changed response from a redirct to the BYU site to a 200 response so
                                                //that cashnet will think that everything is working
                                                res.status(200).send('success');
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

router.post('/checkout/record/delete', function(req, res) {
    MongoClient.connect(mongoURL, function(err, db) {
        var purchaseRecords = db.collection('purchaseRecords');
        var newId = new ObjectID(req.body.id);
        purchaseRecords.findOne({_id: newId}, function(err, record) {
            if (err) {
                console.log('Error on finding record for record that needs to be deleted');
                db.close();
                res.status(500).send('error');
                return;
            } else {
                var restoreF7 = normalizeTicketNumber(record.tickets.F7);
                var restoreF9 = normalizeTicketNumber(record.tickets.F9);
                var restoreS7 = normalizeTicketNumber(record.tickets.S7);
                var restoreS9 = normalizeTicketNumber(record.tickets.S9);

                var updateTickets = {F7: restoreF7, F9: restoreF9, S7: restoreS7, S9: restoreS9};

                purchaseRecords.deleteOne({_id: newId}, function (err, result) {
                    if (err) {
                        console.log('Error on deleting record: ' + JSON.stringify(err));
                        db.close();
                        res.status(500).send('error');
                        return;
                    } else {
                        if (result.result.n == 0) {
                            console.log('Error on deleting record; no record found');
                            db.close();
                            res.status(500).send('error');
                            return;
                        } else {
                            console.log('Payment being deleted for email: ' + req.body.email);
                            var tickets = db.collection('ticketAmounts');
                            tickets.updateOne(
                                {},
                                {$inc: updateTickets},
                                {w:1},
                                function(err, result) {
                                    if (err) {
                                        console.log(err);
                                        res.status(500).send('Database failure');
                                        return;
                                    } else {
                                        db.close();
                                        res.status(200).send('success');
                                        return;
                                    }
                                }
                            );
                        }
                    }
                });
            }
        });

    });
});

router.post('/checkout/record/contested_record', function(req, res) {
    MongoClient.connect(mongoURL, function(err, db) {
        var purchaseRecords = db.collection('purchaseRecords');
        var newId = new ObjectID(req.body.id);
        purchaseRecords.updateOne(
            {_id: newId},
            {$set: {
                meta: 'Incomplete record that user declined to delete. May have been validated without communicating to the server',
                paymentCompleted: true
            }},
            {w: 1},
            function(err, result) {
                if (err) {
                    console.log('error on updating the record to acknowledge inconsistent purchases');
                    db.close();
                    res.status(200).send('error');
                    return;
                } else {
                    console.log('Marking incomplete: ' + JSON.stringify(result));
                    db.close();
                    res.status(200).send('success');
                    return;
                }
            }
        );
    });
});

router.post('/checkout/logout/:email', function(req, res) {
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
                    res.status(500).send('Database failure');
                    return;
                } else {
                    if (itemList.length == 0) {
                        console.log('No matching record found');
                        res.redirect('http://www.byudivinecomedy.com/');
                        return;
                    }
                    var item = itemList[itemList.length - 1];
                    //console.log(JSON.stringify(item));
                    purchaseRecords.updateOne(
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
                                res.status(500).send('Database failure');
                                return;
                            } else {
                                db.close();
                                console.log("Purchase completed after logout for: ",item.email, ' modified: ', result.result ? result.result : result);
                                res.redirect('http://www.byudivinecomedy.com/');
                            }
                        }
                    );
                }
            });
        });
    } else {//purchase was unsuccessful, wipe record from database
        //console.log("Made it to the unsuccessful purchase");
        MongoClient.connect(mongoURL, function(err, db) {
            //console.log('connected to the mongo');
            var purchaseRecords = db.collection('purchaseRecords');
            purchaseRecords.find({email: req.params.email}).toArray(function(err, purchaseItemList) {
                if (err) {
                    console.log('Error on find purchase record when payment failed');
                    res.status(500).send('Database failure');
                    return;
                } else {
                    //console.log(JSON.stringify(purchaseItemList));
                    if (purchaseItemList.length == 0) {
                        console.log('No matching record found');
                        res.redirect('http://www.byudivinecomedy.com/');
                        return;
                    } else {
                        var purchaseItem = purchaseItemList[purchaseItemList.length - 1];
                        //console.log(JSON.stringify(purchaseItem));
                        if (purchaseItem.paymentCompleted) {
                            purchaseRecords.updateOne(
                                {_id: purchaseItem._id},
                                {
                                    $set: {
                                        meta: 'Purchase already cleared, but received a failure notification'
                                    }
                                },
                                {w:1},
                                function(err, result) {
                                    if (err) {
                                        console.log('ticketCount find error: ' + JSON.stringify(err));
                                        res.status(500).send('Database failure');
                                        return;
                                    } else {
                                        db.close();
                                        console.log('Received a failure notification for a purchase that was already cleared:');
                                        console.log('\t'+JSON.stringify(purchaseItem));
                                        res.redirect('http://www.byudivinecomedy.com/');
                                        return;
                                    }
                                });
                        }
                        var restoreF7 = normalizeTicketNumber(purchaseItem.tickets.F7);
                        var restoreF9 = normalizeTicketNumber(purchaseItem.tickets.F9);
                        var restoreS7 = normalizeTicketNumber(purchaseItem.tickets.S7);
                        var restoreS9 = normalizeTicketNumber(purchaseItem.tickets.S9);
                        var ticketCounts = db.collection('ticketAmounts');
                        ticketCounts.findOne(function (err, item) {
                            if (err) {
                                console.log('ticketCount find error: ' + JSON.stringify(err));
                                res.status(500).send('Database failure');
                                return;
                            } else {
                                //console.log(JSON.stringify(item));
                                var remainingF7 = item.F7 + restoreF7;
                                var remainingF9 = item.F9 + restoreF9;
                                var remainingS7 = item.S7 + restoreS7;
                                var remainingS9 = item.S9 + restoreS9;
                                //console.log(remainingF7 + ' ' + remainingF9 + ' ' + remainingS7 + ' ' + remainingS9);
                                ticketCounts.updateOne(
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
                                            console.log("Error on update: " + JSON.stringify(err));
                                            res.status(500).send('Database failure');
                                            return;
                                        } else {
                                            purchaseRecords.deleteOne({_id: purchaseItem._id}, function (err, result) {
                                                if (err) {
                                                    console.log('Error on deleting record: ' + JSON.stringify(err));
                                                    res.status(500).send('Database failure');
                                                    return;
                                                } else {
                                                    //console.log(JSON.stringify(result));
                                                    db.close();
                                                    console.log('Payment failed because of logout for: ' + purchaseItem.email);
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

router.get('/ticketapi/get', function(req, res) {
    MongoClient.connect(mongoURL, function(err, db) {
        var ticketCounts = db.collection('ticketAmounts');
        ticketCounts.findOne(function(err, item) {
            db.close();
            res.send(item);
        });
    });
});

module.exports = router;
