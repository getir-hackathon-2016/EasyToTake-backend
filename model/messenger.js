var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var messengerSchema = new Schema({
    "oid": String,
    "name": String,
    "picture": String,
    "latitude": String,
    "longitude": String,
    "status": String
});
module.exports = mongoose.model('messenger', messengerSchema);