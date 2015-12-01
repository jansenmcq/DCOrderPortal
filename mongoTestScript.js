var MongoClient = require('mongodb').MongoClient;
var mongoURL ='mongodb://localhost:27017/test';
var ObjectID = require('mongodb').ObjectID;

//var newObjects = [];
//for (var i = 0; i < 100; i++) {
//    newObjects.push({ObjectIndex: i, name: 'bob' + i});
//}

MongoClient.connect(mongoURL, function(err, db) {
    var testCollection = db.collection('testCollection');
    testCollection.insert({ObjectIndex: 1, name: 'fred'}, function(err, result) {
        if (err) {
            console.log('Insert err: ',err);
            db.close();
            return;
        } else {
            //console.log(result);
            testCollection.find().toArray(function(err, resultsArray) {
                if (err) {
                    console.log('Find err: ',err);
                    db.close();
                    return;
                } else {
                    var thing = resultsArray[resultsArray.length - 1];
                    testCollection.deleteOne({_id: thing._id}, function(err, result) {
                        if (err) {
                            console.log('delete err: ', err);
                        } else {
                            console.log(result);
                            db.close();
                        }
                    });

                }


            });
        }
    });
});