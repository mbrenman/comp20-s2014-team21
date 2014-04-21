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
	var userName = req.user.username; 
	User.findOne({ name: userName }, function (err, obj) {
		console.log("start \n"); 
		if (err) {
			console.log(err + "\n\n\n"); 
			res.send(err); 
		}
		if (!obj) {
			console.log("no object");
			res.send("no obj");  
		} else {
			console.log(obj + "\n\n\n"); 
			//res.send(obj);
			res.render('mygroups', {
				title: 'My Groups',
				obj : obj["groups"]
			});
		}
	});
});

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
});

app.listen(app.get('port'), function(){
  console.log(("Express server listening on port " + app.get('port')))
});
