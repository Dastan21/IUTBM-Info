const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const config = require('../configs/config');
const catchAsync = fn => (
  (req, res, next) => {
    const routePromise = fn(req, res, next);
    if (routePromise.catch) {
      routePromise.catch(err => next(err));
    }
  }
);

const CLIENT_ID = config.client_id;
const CLIENT_SECRET = config.client_secret;
const redirect_callback = `http://localhost:3333/discord/callback`;


router.get('/login', function(req, res) {
	if (req.cookies && req.cookies.token) res.redirect('/');
	res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirect_callback}&response_type=code&scope=identify`);
});

router.get('/logout', function(req, res) {
	if (!req.cookies.token) res.redirect('/');
	res
		.clearCookie('token')
		.clearCookie('id')
		.clearCookie('username')
		.clearCookie('avatar')
		.redirect('/');
});

router.get('/callback', catchAsync(async function(req, res) {
	if (req.cookies && req.cookies.token) throw new Error("Unautorized");
	if (!req.query.code) throw new Error("No Code Provided");
	const code = req.query.code;
	let data = {
		client_id: CLIENT_ID,
		client_secret: CLIENT_SECRET,
		grant_type: "authorization_code",
		code: code,
		redirect_uri: redirect_callback,
		scope: "identify"
	}

	const res_token = await fetch("https://discord.com/api/oauth2/token", {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: _encode(data)
	});
	const json_token = await res_token.json();

	const res_user = await fetch("https://discord.com/api/users/@me", {
		method: 'GET',
		headers: { 'Authorization': `${json_token.token_type} ${json_token.access_token}` }
	});
	const json_user = await res_user.json();

	res
		.cookie('token', json_token.access_token, { expires: new Date(Date.now() + 1000*60*60*24*7) })
		.cookie('id', json_user.id, { expires: new Date(Date.now() + 1000*60*60*24*7) })
		.cookie('username', json_user.username, { expires: new Date(Date.now() + 1000*60*60*24*7) })
		.cookie('avatar', json_user.avatar, { expires: new Date(Date.now() + 1000*60*60*24*7) })
		.redirect('/');
}));


function _encode(obj) {
	let string = "";

	for (const [key, value] of Object.entries(obj)) {
		if (!value) continue;
		string += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
	}

	return string.substring(1);
}

module.exports = router;
