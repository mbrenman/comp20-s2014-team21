var path = require("path");

exports.index = function(req, res){
  res.render('index', { title: "Passport-Examples"});
};

exports.ping = function(req, res){
  res.send("pong!", 200);
};

exports.mygroups = function(res, res){
	var userName = req.user.username; 
	res.send(userName); 
};