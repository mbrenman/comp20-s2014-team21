var passport = require('passport');
var Account = require('./models/account');

var sendgrid  = require('sendgrid')(
  process.env.SENDGRID_USERNAME,
  process.env.SENDGRID_PASSWORD
);

module.exports = function (app) {
    
  app.get('/', function (req, res) {
      res.render('index', { user : req.user });
  });

  app.get('/register', function(req, res) {
      res.render('register', { });
  });

  app.post('/register', function(req, res) {
      Account.register(new Account({ username : req.body.username, email : req.body.email }), req.body.password, function(err, account) {
          if (err) {
            return res.render("register", {info: "Sorry. That username already exists. Try again."});
          }

          passport.authenticate('local')(req, res, function () {
            res.redirect('/');
          });
      });
  });

  app.get('/login', function(req, res) {
      res.render('login', { user : req.user });
  });

  app.post('/login', passport.authenticate('local'), function(req, res) {
      res.redirect('/');
  });

  app.get('/logout', function(req, res) {
      req.logout();
      res.redirect('/');
  });

  app.get('/ping', function(req, res){
      res.send("pong!", 200);
  });

  app.get('/sendemail', function(req, res){
      sendgrid.send({
        to: 'brettgurman@gmail.com',
        from: 'sender@example.com',
        subject: 'Hello World',
        text: 'Sending email with NodeJS through SendGrid!'
      }, function(err, json) {
      if (err) { return console.error(err); }
        console.log(json);
      });
  });
  
};
