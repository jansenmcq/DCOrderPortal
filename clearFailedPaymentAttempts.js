var MongoClient = require('mongodb').MongoClient;
var mongoURL ='mongodb://localhost:27017/tickets';
var ObjectID = require('mongodb').ObjectID;


//var clearFailedAttempts = function(failedAttemptsArray, index, purchaseRecords, callback) {
//    purchaseRecords.deleteOne({_id: failedAttemptsArray[index]._id}, function(err, result) {
//        if (!err) {
//            if (index < failedAttemptsArray.length - 1) {
//                clearFailedAttempts(failedAttemptsArray, index + 1, purchaseRecords, function(ticketCounts) {
//                    var newCounts = {
//                        F7: ticketCounts.F7 + failedAttemptsArray[index].tickets.F7,
//                        F9: ticketCounts.F9 + failedAttemptsArray[index].tickets.F9,
//                        S7: ticketCounts.S7 + failedAttemptsArray[index].tickets.S7,
//                        S9: ticketCounts.S9 + failedAttemptsArray[index].tickets.S9
//                    };
//                    callback(newCounts);
//                });
//            } else {
//                var ticketCounts = {
//                    F7: failedAttemptsArray[index].tickets.F7,
//                    F9: failedAttemptsArray[index].tickets.F9,
//                    S7: failedAttemptsArray[index].tickets.S7,
//                    S9: failedAttemptsArray[index].tickets.S9
//                };
//                callback(ticketCounts);
//            }
//        } else {
//            console.log("Broke");
//            console.log(index);
//            console.log(failedAttemptsArray[index]);
//            return;
//        }
//    });
//};

MongoClient.connect(mongoURL, function(err, db) {
    var purchaseRecords = db.collection('purchaseRecords');
    var newTickets = {
        F7: 0,
        F9: 0,
        S7: 0,
        S9: 0
    };
    purchaseRecords.find({paymentCompleted: false}).toArray(function(err, failedAttempts) {
        failedAttempts.forEach(function(failedPurchase) {
            for (show in failedPurchase.tickets) {
                newTickets[show] += failedPurchase.tickets[show];
            }
        });

        var tickets = db.collection('ticketAmounts');
        tickets.findOne(function(err, ticketAmounts) {
            console.log(ticketAmounts);
            console.log('More tickets\n',newTickets);
            var rF7 = ticketAmounts.F7 + newTickets.F7;
            var rF9 = ticketAmounts.F9 + newTickets.F9;
            var rS7 = ticketAmounts.S7 + newTickets.S7;
            var rS9 = ticketAmounts.S9 + newTickets.S9;
            tickets.update(
                {_id: ticketAmounts._id},
                { $set:
                {
                    F7: rF7,
                    F9: rF9,
                    S7: rS7,
                    S9: rS9
                }
                },
                {w:1},
                function(err, result) {
                    if (err) {
                        console.log("Error in updating");
                    } else {
                        console.log("Apparently succeeded");
                        console.log(result);
                        purchaseRecords.deleteMany({paymentCompleted: false}, function(err, result) {
                            if (err) {
                                console.log("Couldn't delete all: ", err);
                            } else {
                                console.log(result);
                                db.close();
                            }
                        });
                    }
                })
        });

        //clearFailedAttempts(failedAttempts, 0, purchaseRecords, function(ticketCounts) {
        //    var tickets = db.connect('ticketAmounts');
        //    tickets.findOne(function(err, ticketAmounts) {
        //        var rF7 = ticketAmounts.F7 + ticketCounts.F7;
        //        var rF9 = ticketAmounts.F9 + ticketCounts.F9;
        //        var rS7 = ticketAmounts.S7 + ticketCounts.S7;
        //        var rS9 = ticketAmounts.S9 + ticketCounts.S9;
        //        tickets.update(
        //            {_id: ticketAmounts._id},
        //            { $set:
        //                {
        //                    F7: rF7,
        //                    F9: rF9,
        //                    S7: rF7,
        //                    S9:rF9
        //                }
        //            },
        //            {w:1},
        //            function(err, result) {
        //                if (err) {
        //                    console.log("Error in updating");
        //                } else {
        //                    console.log("Apparently succeeded");
        //                    console.log(result);
        //                    db.close();
        //                    return;
        //                }
        //            })
        //    })
        //});
    });
});