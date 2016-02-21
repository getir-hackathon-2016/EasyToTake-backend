var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var categorySchema = new Schema({
    "oid": String,
    "name": String,
    "picture": String
});
module.exports = mongoose.model('category', categorySchema);