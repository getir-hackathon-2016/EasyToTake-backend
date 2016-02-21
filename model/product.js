var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var productSchema = new Schema({
    "oid": String,
    "parentOid": String,
    "name": String,
    "picture": String,
    "price": String,
    "stock": String
});

module.exports = mongoose.model('product', productSchema);