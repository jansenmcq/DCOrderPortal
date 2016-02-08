var PromisedMongoClient = require('promised-mongo');
var mongoURL = 'mongodb://localhost:27017/test';

var db = PromisedMongoClient(mongoURL);

var test = db.collection('testCollection');
test.insert(
    {   name: 'joe',
        id: 4,
        happy: false
    }
).then(function(result) {
    console.log('Insert Result', result);
    return test.findOne({name: 'joe'});
}).then(function(item) {
    console.log(item.id);
    console.log(item.happy);
    return test.insert(
        {   name: 'henry',
            id: 12,
            happy: true
        }
    );
}).then(function(result) {
    console.log('Insert Result', result);
    return test.find().toArray();
}).then(function(foundItems) {
    foundItems.forEach(function(item) {
        console.log(item);
    });
    return test.remove();
}).then(function(result) {
    console.log('Delete Result', result);
    db.close();
    return;
}).catch(function(err) {
    console.log('err:', err);
    db.close();
    return;
});
