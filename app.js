/**
 * used only for serve test data
 */

//var jsonServer = require("json-server");
//var server = jsonServer.create();
//server.use(jsonServer.defaults());
//var router = jsonServer.router("data/db.json");
//server.use(router);
//server.listen(3000);


var express = require("express");
var mongoose = require("mongoose");
var app = express();
var bodyParser = require("body-parser");
var router = express.Router();

var redis = require('redis');
var client = redis.createClient('redis://h:p4ajgf5980l9s8fg2h8cq8c6ung@ec2-46-137-76-242.eu-west-1.compute.amazonaws.com:7879');
var async = require("async");


var MESSENGER = require("./model/messenger");
var CATEGORY = require("./model/category");
var PRODUCT = require("./model/product");
var SHOPPINGCARD = require("./model/shoppingcard");


mongoose.connect('mongodb://easytotake:easytotake@ds031691.mongolab.com:31691/easytotake', function () {

    console.log("dropping database...");

    mongoose.connection.db.dropDatabase(function (err, result) {

        console.log("generating initalize data...");

        /**
         * set init data after drop
         */

        var l = 0;
        for (var i = 0; i < 10; i++) {
            var ms = new MESSENGER();
            ms.oid = i + 1;
            ms.name = "Messenger-" + (i + 1);
            ms.status = "READY"; // READY o IN_PROGRESS

            if (i % 2) {
                ms.latitude = 41.077529 + (i * (Math.floor(Math.random() * 5) + 1) / 1000);
                ms.longitude = 29.024492 + (i * (Math.floor(Math.random() * 5) + 1) / 1000);
            } else {
                ms.latitude = 41.077529 - (i * (Math.floor(Math.random() * 5) + 1) / 1000);
                ms.longitude = 29.024492 - (i * (Math.floor(Math.random() * 5) + 1) / 1000);
            }
            ms.picture = "ready.png";

            ms.save(function (err) {
                if (err) {
                    console.log("error when data is save" + err)
                }
            });

            var cg = new CATEGORY();
            cg.oid = i + 1;
            cg.name = "Category-" + (i + 1);
            cg.picture = "ready.png";

            cg.save(function (err) {
                if (err) {
                    console.log("error when data is save" + err)
                }
            });

            for (var k = 0; k < 10; k++) {
                l++;
                var p = new PRODUCT();
                p.oid = l;
                p.parentOid = i + 1;
                p.name = "Product-" + l;
                p.picture = "ready.png";
                p.price = (i + 1);
                p.stock = (i + 1);

                p.save(function (err) {
                    if (err) {
                        console.log("error when data is save" + err)
                    }
                });
            }

        }


        //MESSENGER.find({}, function (err, data) {
        //    // Mongo command to fetch all data from collection.
        //    if (err) {
        //        console.log("error when data is find:" + err)
        //    } else {
        //        console.log("no error:" + data);
        //    }
        //});
        //
        //CATEGORY.find({}, function (err, data) {
        //    // Mongo command to fetch all data from collection.
        //    if (err) {
        //        console.log("error when data is find:" + err)
        //    } else {
        //        console.log("no error:" + data);
        //    }
        //});
        //
        //PRODUCT.find({}, function (err, data) {
        //    // Mongo command to fetch all data from collection.
        //    if (err) {
        //        console.log("error when data is find:" + err)
        //    } else {
        //        console.log("no error:" + data);
        //    }
        //});
    });
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({"extended": false}));

// serve static image files
app.use(express.static('images'));

// TODO handle exceptions

router.get("/messengers", function (req, res) {
    MESSENGER.find({}, function (err, dataList) {
        // Mongo command to fetch all data from collection.
        var response = [];
        if (err) {
            dataList = [];
        } else {
            for (var i = 0; i < dataList.length; i++) {
                var item = dataList[i];
                /**
                 *
                 * Direk setleyemedi ? bu yüzden yeni obje yaratıp eklendi.
                 */

                var obj = {};
                obj["distance"] = (Math.floor(Math.random() * 20) + 1) + " minutes";
                obj["oid"] = item.oid;
                obj["name"] = item.name;
                obj["picture"] = item.picture;
                obj["latitude"] = item.latitude;
                obj["longitude"] = item.longitude;
                obj["status"] = item.status;
                response.push(obj)
            }
        }
        res.json(response);
    });
});

router.get("/categories", function (req, res) {

    var page = Number(req.query.page);
    var take = Number(req.query.take);


    CATEGORY.find({}, function (err, dataList) {
        if (err) {
            dataList = [];
        }
        res.json(dataList);
    }).skip(page > 0 ? ((page - 1) * take) : 0).limit(take);
});

router.get("/products", function (req, res) {

    var page = Number(req.query.page);
    var take = Number(req.query.take);
    var parentOid = req.query.parentOid;

    PRODUCT.find({parentOid: {$eq: parentOid}}, function (err, dataList) {
        if (err) {
            dataList = [];
        }
        res.json(dataList);
    }).skip(page > 0 ? ((page - 1) * take) : 0).limit(take);
});

router.get("/products/top", function (req, res) {

    console.log("Getting request for top product ");

    var take = Number(req.query.take);

    PRODUCT.find({}, function (err, dataList) {
        if (err) {
            dataList = [];
        }
        res.json(dataList);
    }).limit(take);
});

router.get("/shoppingCard", function (req, res) {

    console.log("Getting request for list cached shopping card ");

    var userOid = req.query.userOid;

    client.smembers(userOid, function (err, arr) {

        var response = [];

        if (arr.length > 0) {
            arr.forEach(function (item) {
                var _obj = JSON.parse(item);
                var key = (userOid + _obj.oid);
                client.get(key, function (err, result) {
                    var obj = JSON.parse(item);
                    if (result) { // that has
                        obj.price = (Number(result)) * (Number(obj.price));
                    }
                    console.log("get", obj);
                    response.push(obj);

                    if (response.length == arr.length) {
                        res.json(response);
                    }
                });
            });
        } else {
            res.json([]);
        }


    });


});

router.get("/shoppingCard/count", function (req, res) {

    console.log("Getting request for get count of cached shopping card ");

    var userOid = req.query.userOid;

    console.log(userOid)

    client.smembers(userOid, function (err, arr) {
        var count = 0;

        var dummy = [];
        if (arr.length > 0) {
            arr.forEach(function (item) {
                var _obj = JSON.parse(item);
                var key = (userOid + _obj.oid);
                client.get(key, function (err, result) {
                    console.log("result is " + result);
                    if (result) { // that has
                        count += (Number(result))
                    } else {
                        count++;
                    }
                    dummy.push(_obj);

                    if (dummy.length == arr.length) {
                        console.log("count is " + count)
                        var response = {"content": count + "", "success": true};
                        res.json(response);
                    }


                });
            });
        } else {
            var response = {"content": "0", "success": true};
            res.json(response);
        }

    });


});

router.post("/updateshoppingcard", function (req, res) {

    console.log("post request for add product to cached ");

    console.log(req.body.parentOid)

    client.sadd(req.body.parentOid, JSON.stringify(req.body), function (err, fresult) {
        if (fresult == 0) { // thats mean already has item
            var key = (req.body.parentOid + req.body.oid);

            console.log("key for update is :" + key)

            client.get(key, function (err, result) {
                if (result) { // that has
                    client.set(key, (Number(result) + 1));
                } else {
                    client.set(key, 2);
                }

                console.log("result:" + result);
            });

        }

    });

    var response = {"content": "ignore", "success": true};
    res.json(response);

});

router.post("/romoveshoppingcard", function (req, res) {

    console.log("post request for remove product to cached ");

    console.log(req.body.parentOid);

    var key = (req.body.parentOid + req.body.oid);

    client.get(key, function (err, result) {
        if (result) { // that mean has more
            client.set(key, (Number(result) - 1)); // decrement 1
        } else {
            client.srem(req.body.parentOid, JSON.stringify(req.body))
        }

        console.log("result:" + result);
    });

    var response = {"content": "ignore", "success": true};
    res.json(response);

});

router.post("/checkout", function (req, res) {

    /**
     * TODO decrement stock
     */

    console.log("post request for check out product to cached ");

    var userOid = req.query.userOid;


    function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }

    client.smembers(userOid, function (err, arr) {

        var items = [];

        for (var i = 0; i < arr.length; i++) {
            var item = arr[i];
            var obj = JSON.parse(item);

            var key = (userOid + obj.oid);

            client.get(key, function (err, result) {
                if (result) { // that has
                    obj.price = (Number(result)) * (Number(obj.price));
                }
                items.push(obj);
            });
        }

        var groupOid = guid();

        for (var i = 0; i < items.length; i++) {

            var item = items[i];

            var sc = new SHOPPINGCARD();
            sc.groupOid = groupOid;
            sc.userOid = userOid;
            sc.price = item.price;
            sc.parentOid = item.parentOid;

            sc.save(function (err) {
                console.log("shopping card chekout err:" + err)
            });


            /**
             * update Messenger status
             */

            MESSENGER.findOne({oid: {$eq: parentOid}}, function (err, item) {
                if (err) {
                    item.status = "IN_PROGRESS";
                    item.picature = "busy.png";
                    MESSENGER.update(item); // TODO i am ignore
                }
            });

        }
    });


    var response = {"content": "ignore", "success": true};
    res.json(response);

});

app.use('/', router);

app.listen(3001, function () {
    console.log('app listening on port 3001!');
});

client.FLUSHALL();

client.on('connect', function () {
    console.log('redis connected with default configuration!');
});

client.flushall(function (didSucceed) {
    console.log("redis deleted all old items" + didSucceed);
});

