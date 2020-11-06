var express = require('express');
var router = express.Router();


router.get('/', function(req, res, next) {
	if (!req.cookies.token) res.redirect('/');

	res.render('profile', { title: 'Profile | IUTBM-Info Bot', cookies: req.cookies });
});

module.exports = router;
