const express = require('express');
const router = express.Router();


router.get('/', function(req, res, next) {
	if (!req.cookies.token) res.redirect('/');

	res.render('agenda', { title: 'Agenda | IUTBM-Info Bot', cookies: req.cookies });
});

module.exports = router;
