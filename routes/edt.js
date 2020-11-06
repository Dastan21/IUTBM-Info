const express = require('express');
const router = express.Router();


router.get('/', function(req, res, next) {
	if (!req.cookies.token) res.status(401); throw new Error("Unauthorized");

	res.render('edt', { title: 'EDT | IUTBM-Info Bot', cookies: req.cookies });
});

module.exports = router;
