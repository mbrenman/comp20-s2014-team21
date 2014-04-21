// dependencies
var path = require('path');
var express = require('express');
var http = require('http');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

// main config
var app = express();
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('view options', { layout: false });
app.use(express.logger());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
});

// passport config
var Account = require('./models/account');
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

var db = mongoose.connection;

// mongoose
mongoose.connect('mongodb://localhost/local');

// var itemSchema = new mongoose.Schema({
// 	member: String, 
// 	quantity: Number 
// });

// var supplySchema = new mongoose.Schema({
// 	supplies: 
// 	{
// 		item: itemSchema
// 	}
// });

// var groupSchema = new mongoose.Schema({
//   name: String
// , supplies: supplySchema
// });

var groupSchema = new mongoose.Schema({
	name: String,
	supplies: { type: mongoose.Schema.Types.Mixed }
});

var Group = mongoose.model('Group', groupSchema);

// routes
require('./routes')(app);

app.post('/newGroup.json', function (req, res){
  // mongo.Db.connect(mongoUri, function (err, db){
    // db.collection("groups", function (er, collection){
    	console.log('\n\n\n' + req.body + '\n\n\n');
		var groupname = req.body.groupname;
		var members = req.body.members;
		var items = req.body.items;
		var supplylist = {}
		for(var i=0; i<items.length; i++){
			var itemname = items[i];
			supplylist[itemname] = {}
			for(var j=0; j<members.length; j++){
				var uname = members[j];
				supplylist[itemname][uname] = 0;
			}
		}

		var data = {};
		data["groupname"] = groupname;
		data["supplies"] = supplylist;

		var d = new Group({
			name: groupname,
			supplies: supplylist
		});

		d.save(function(err, r) {
 			if (err) return console.error(err);
  			console.dir(r);
		});
		// console.log(supplies);

		// collection.insert(data, function (err, r){});
        res.send("Successful entry!\n");
	// });
  // });
});

app.post('/incrementItem.json', function(req, res){
	var groupname = req.body.groupname;
	var name = req.body.name;
	var item = req.body.item;
	Group.findOne({ name: groupname }, function(err, r) {
  		if (err) return console.error(err);
  		console.log(r);
  		new_doc = new Group({
  			name: r.name,
  			supplies: r.supplies
  		});
  		new_doc.supplies[item][name] += 1;
  		new_doc.save(function(err, r) {
 			if (err) return console.error(err);
  			console.dir(r);
		});
		r.remove();
  		res.send("Updated!\n");
	});

	// mongo.Db.connect(mongoUri, function (err, db){
	// 	db.collection("groups", function (er, col){
	// 		var groupname = req.body.groupname;
	// 		var name = req.body.name;
	// 		var item = req.body.item;
	// 		console.log(groupname);
	// 		col.find({groupname : groupname}).toArray(function(e, x){
	// 			var newGroup = {
	// 				groupname: groupname,
	// 				supplies: x[0]["supplies"]
	// 			};
	// 			console.log(x[0]);
	// 			console.log(item);
	// 			console.log(name);
	// 			console.log(newGroup["supplies"][item][name])
				
	// 			var quantity = parseInt(newGroup["supplies"][item][name]);
	// 			newGroup["supplies"][item][name] = quantity + 1;
	// 			console.log(x[0]["_id"]);
	// 			col.remove({groupname : groupname}, function (error, result){});
	// 			col.insert(newGroup, function (err, r){});
	//         	res.send("Successful Update!\n");
	// 		});
	// 	});
	// });
});

app.listen(app.get('port'), function(){
  console.log(("Express server listening on port " + app.get('port')))
});
