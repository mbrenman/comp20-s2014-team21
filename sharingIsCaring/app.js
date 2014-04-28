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

//Schemas
var groupSchema = new mongoose.Schema({
	name: String,
	supplies: { type: mongoose.Schema.Types.Mixed }
});

var Group = mongoose.model('Group', groupSchema);

var userSchema = new mongoose.Schema({
	name: String,
	groups: [ String ] //Groups that the member belongs to
});

var User = mongoose.model('User', userSchema);

// routes
require('./routes')(app);

app.get('/mygroups', function (req, res){
	try {
		var userName = req.user.username; 
	} catch (e) {
		res.redirect('/');
	}

	User.findOne({ name: userName }, function (err, obj) {
		console.log("start \n"); 
		if (err) {
			console.log(err + "\n\n\n"); 
			res.send(err); 
		} else {
			if (!obj) {
				res.render('mygroups', {
					title: 'My Groups',
					obj : []
				}); 
			} else {
				res.render('mygroups', {
					title: 'My Groups',
					obj : obj["groups"]
				});
			}
		}
	});
});

app.get('/supplies', function (req, res){
	try {
		var userName = req.user.username; 
	} catch (e) {
		res.redirect('/');
		return;
	}

	var groupName = req.query.name; 

	User.findOne({ name: userName }, function (err, obj) {
		if(err) {
			res.send(err); 
		} else if (!obj){
			res.redirect('/mygroups'); 
		} else {
			var userGroups = obj["groups"]; 
			if (userGroups.indexOf(groupName) < 0){
				res.redirect('/mygroups');
			};
		}

	});

	Group.findOne({ name: groupName }, function (err, obj) {
		if (err) {
			console.log(err+"\n\n\n");
			res.send(err); 
		}
		if (!obj) {
			res.send("no object"); 
		} else {
			console.log(obj);
			var list = obj["supplies"];
			keysSorted = Object.keys(list).sort();
			// console.log(keysSorted);
			var sortedSupplies = {};
			for (var i=0; i<keysSorted.length; i++) {
				// console.log(keysSorted[i]);
				// console.log(list[keysSorted[i]]);
				var peopleList = list[keysSorted[i]];
				console.log(peopleList);
				peopleKeysSorted = Object.keys(peopleList).sort();
				console.log(peopleKeysSorted);
				var sortedPeople = {};
				for (var j=0; j<peopleKeysSorted.length; j++) {
					sortedPeople[peopleKeysSorted[j]] = peopleList[peopleKeysSorted[j]];
				}
				// console.log(sortedPeople);
				sortedSupplies[keysSorted[i]] = sortedPeople;
			}
			console.dir(sortedSupplies);
			res.render('supplies', {
				title: 'Supplies',
				obj: sortedSupplies,
				groupname: groupName
			}) 
		}
	}); 
});

app.get('/newgroup', function (req, res) {
	try {
		var userName = req.user.username; 
	} catch (e) {
		res.redirect('/');
	}
	res.render('newgroup'); 
})

app.post('/newGroup.json', function (req, res){
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
	var d = new Group({
		name: groupname,
		supplies: supplylist
	});
	d.save(function(err, r) {
		if (err) return console.error(err);
  		console.dir(r);
	});
	addGroupToUsers(members, groupname);
    res.send("Successful entry!\n");
});

function addGroupToUsers(members, groupname){
	for(var i=0; i<members.length; i++){
		var username = members[i];
		console.log(username);
		(function(username) {
			User.findOne({ name: username }, function(err, obj) {
	  			if (err) return console.error(err);
	  			console.log('~~~~~~~~~~~~~~\n' + obj + '\n~~~~~~~~~~~~~~\n' + username + '\n~~~~~~~~~~~~~~\n');
	  			if (!obj) {
	  				var groups = new Array();
	  				groups[0] = groupname;
	  				
	  				var n = new User({
	  					name: username,
	  					groups: groups
	  				});
	  				n.save(function(err, r) {
						if (err) return console.error(err);
				  		console.dir(r);
					});
	  			} else {
	  				console.log('\n\n\n' + obj['groups'] + '\n\n\n');
	  				var shouldAdd = true;
	  				for(var j=0; j<obj.length; j++){
	  					if (obj[j] == username){
	  						shouldAdd = false;
	  					}
	  				}
	  				if (shouldAdd){
	  					var newgroups = obj['groups']
	  					newgroups[newgroups.length] = groupname
		  				var n = new User({
		  					name: obj['name'],
		  					groups: newgroups
		  				});
		  				n.save(function(err, r) {
							if (err) return console.error(err);
					  		console.dir(r);
					  		obj.remove();
						});
	  				}
	  			}
	  		});
		}(username));
	}
}

app.post('/incrementItem.json', function(req, res){
	var groupname = req.body.groupname;
	var name = req.body.name;
	var item = req.body.item;
	var amount = parseInt(req.body.amount);
	Group.findOne({ name: groupname }, function(err, r) {
  		if (err) return console.error(err);
  		console.log(r);
  		new_doc = new Group({
  			name: r.name,
  			supplies: r.supplies
  		});
  		new_doc.supplies[item][name] += amount;
  		var min_name = name;
  		var min = new_doc.supplies[item][name];
  		for (iter in new_doc.supplies[item]) {
  			if (new_doc.supplies[item][iter] <= min) {
  				min_name = iter;
  				min = new_doc.supplies[item][iter];
  			}	
  		}
  		console.log("min person is: ", min_name, " ", min);
  		new_doc.save(function(err, r) {
 			if (err) return console.error(err);
  			console.dir(r);
		});
		r.remove();
  		res.send("Updated!\n");
	});
});

app.post('/newItem', function (req, res){
	console.log('\n\n\n' + req.body + '\n\n\n');
	var groupName = req.body.groupname;
	var newItem = req.body.item;
	// console.log(groupName);
	// console.log(newItem);
	Group.findOne({ name: groupName }, function (err, obj) {
		if (err) {
			console.log(err+"\n\n\n");
			res.send(err); 
		}
		if (!obj) {
			res.send("no object"); 
		} else {
			console.log(obj); 
			/*res.render('supplies', {
				title: 'Supplies',
				obj: obj["supplies"]
			})*/ 
			var newSupply = {};
			var peopleArray = [];
			for (item in obj.supplies) {
				// console.log(obj.supplies[item]);
				for (people in obj.supplies[item]) {
					console.log(people);
					newSupply[people] = 0;
				}
				break;
				// array.push(item);
			}
			newItemList = {};
			newItemList[newItem] = newSupply;
			console.log(newSupply);
			console.log(newItemList);
			new_doc = new Group ({
				name: obj.name,
				supplies: obj.supplies
			});
			console.log(new_doc);
			new_doc.supplies[newItem] = newSupply;
			console.log(new_doc);
			new_doc.save(function(err, r){
				if (err) return console.error(err);
				console.dir(r);
				obj.remove();
			})
			// console.log(newItem);
			res.send('New item added!');
		}
	}); 
});

app.post('/removeItem', function(req,res) {
	console.log('\n\n\n' + req.body + '\n\n\n');
	var groupName = req.body.groupname;
	var removeItem = req.body.item;
	// console.log(groupName);
	console.log("I am removing: ", removeItem);
	Group.findOne({ name: groupName }, function (err, obj) {
		if (err) {
			console.log(err+"\n\n\n");
			res.send(err); 
		}
		if (!obj) {
			res.send("no object"); 
		} else {
			// console.log(obj); 
			/*res.render('supplies', {
				title: 'Supplies',
				obj: obj["supplies"]
			})*/ 
			var newSupply = {};
			var peopleArray = [];
			for (item in obj.supplies) {
				if (item == removeItem) {
					console.log("found it");
					console.log(obj.supplies[item]);
				}
				if (item != removeItem) {
					newSupply[item] = obj.supplies[item];
				}
				// array.push(item);
			}
			console.log(newSupply);
			/*newItemList = {};
			newItemList[newItem] = newSupply;
			console.log(newSupply);
			console.log(newItemList);*/
			new_doc = new Group ({
				name: obj.name,
				supplies: newSupply
			});
			console.log(new_doc);
			// new_doc.supplies[newItem] = newSupply;
			// console.log(new_doc);
			new_doc.save(function(err, r){
				if (err) return console.error(err);
				console.dir(r);
				obj.remove();
			})
			// console.log(newItem);
		}
	}); 
});

app.listen(app.get('port'), function(){
  console.log(("Express server listening on port " + app.get('port')))
});
