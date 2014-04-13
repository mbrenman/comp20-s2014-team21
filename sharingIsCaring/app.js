
/**
 * Module dependencies.
 */
var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');

var mongo = require('mongodb');


var app = express();

var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/local';

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
 });

app.get('/', routes.index);
app.get('/users', user.list);

app.post('/newGroup.json', function (req, res){
  mongo.Db.connect(mongoUri, function (err, db){
    db.collection("groups", function (er, collection){
    	console.log('\n\n\n' + req.body + '\n\n\n');
		var groupname = req.body.groupname;
		var members = req.body.members;
		var items = req.body.items;
		// var supplies = {}
		// for(var i=0; i<items.length; i++){
		// 	var itemname = items[i];
		// 	for(var j=0; j<members.length; j++){
		// 		var uname = members[j];
		// 		supplies[itemname][uname] = 0;
		// 	}
		// }
		// console.log(supplies);
		console.log(groupname);
		console.log(members);
		console.log(items);
		res.send('success!');
	});
  });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
