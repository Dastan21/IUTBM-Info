var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var edtRouter = require('./routes/edt');
var agendaRouter = require('./routes/agenda');
var discordRouter = require('./routes/discord');
var profileRouter = require('./routes/profile');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/edt', edtRouter);
app.use('/agenda', agendaRouter);
app.use('/discord', discordRouter);
app.use('/profile', profileRouter);


// error handler
app.use(function(err, req, res, next) {
	// render the error page
	console.log("err status : "+err.status);
	let status = err.status || 500;
	res.status(status);
	res.render('error', { title: "Error "+status+" | IUTBM-Info Bot", error: err });

	// switch (err.message) {
	// 	case 'Bad Request':
	// 	case 'No Code Provided':
	// 		return res.status(400).render('error', { error: err });
	// 	case 'Forbidden':
	// 		return res.status(401).render('error', { error: err });
	// 	case 'Forbidden':
	// 		return res.status(403).render('error', { error: err });
	// 	case 'Not Found':
	// 		return res.status(404).render('error', { error: err });
	// 	default:
	// 		return res.status(500).render('error', { error: err });
	// }
});

module.exports = app;
