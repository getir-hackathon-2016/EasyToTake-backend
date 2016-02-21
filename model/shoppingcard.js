var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var shoppingcardSchema = new Schema({
    "oid": String,
    "name": String,
    "price": String,
    "userOid": String,
    "parentOid": String // Product Oid
});
module.exports = mongoose.model('shoppingcard', shoppingcardSchema);