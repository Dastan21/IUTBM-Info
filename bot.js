const Discord = require('discord.js')
const bot = new Discord.Client()
// var mongo = require('mongodb')
// var MongoClient = require('mongodb').MongoClient;
const { Builder, By, Key, until } = require('selenium-webdriver');
const { Options } = require('selenium-webdriver/chrome');
/* Personal imports */
const config = require('./config')
const id_groups = require('./id_groups')
const groupes_liste = [
	"s1-a1", "s1-a2", "s1-b1", "s1-b2", "s1-c1", "s1-c2", "s1-d1",
	"s2-a1", "s2-a2", "s2-b1", "s2-b2", "s2-c1", "s2-c2", "s2-d1",
	"s3-a1", "s3-a2", "s3-b1", "s3-b2", "s3-c1", "s3-c2",
	"s4-a1", "s4-a2", "s4-b1", "s4-b2", "s4-c1", "s4-c2",
];

/* Setup Discord bot */
bot.on('ready', () => {
	console.log(bot.user.tag + " is online");
	bot.user.setPresence({
		activity: {
			name: '`edt help`'
		},
		status: 'online' }
	)
})



/* Setup Mongo Database */
// var url = "mongodb://edtinfo:edtinfobot@localhost/edtinfo_db";
// MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, db) {
// 	if (err) throw err;
// 	console.log("Database connected");
// 	db.close();
// });



bot.on('message', msg => {
	if (msg.content.toLowerCase().startsWith(config.prefix))
		commandProcess(msg);
});

async function commandProcess(msg) {
	let rawCommand = msg.content;
    let fullCommand = rawCommand.substr(config.prefix.length+1);
    let splitCommand = fullCommand.split(' ');
    let primaryCommand = splitCommand[0];
    let arguments = splitCommand.slice(1);

	switch (primaryCommand) {
		case 'show':
			showEDT(msg, arguments);
			break;
		default:

	}
}

function msgSend(msg, message){
	msgSend(msg, message, null);
}

async function msgSend(msg, message, attachment) {
	await msg.channel
		.send(message, attachment)
		.catch(err => {
			console.log(err);
		});
}

async function msgReply(msg, message){
	await msg
		.reply(message)
		.catch(err => {
			console.log(err);
		});
}

async function showEDT(msg, args) {
	msg.channel.startTyping();
	var data = {};
	var arg_classe = args[0];
	var arg_semaine = args[1];
	if (!arg_classe) { msgReply(msg, "le groupe ne peut-être vide"); return; }
	arg_classe = arg_classe.toLowerCase();
	if (!groupes_liste.includes(arg_classe)) { msgReply(msg, "le format du semestre/groupe est mal indiqué (voir `edt help show`)."); return; }
	if (arg_classe[1] < 3) data.annee = "1e"; else data.annee = "2e";
	data.semestre = "s" + arg_classe[1];
	data.classe = arg_classe[3];
	data.groupe = data.classe + arg_classe[4];
	if (arg_semaine != null) {
		if (isNaN(arg_semaine) || Number(arg_semaine) < 1 || Number(arg_semaine) > 53) { msgReply(msg, "la semaine doit être un nombre compris entre 1 et 53."); return; }
		data.semaine = "//button[starts-with(., '"+arg_semaine+"')]";
	}
	msgSend(msg, "", new Discord.MessageAttachment(await connectToADE(data), "edt.png"));
	await msg.channel.stopTyping();
}

async function connectToADE(data) {
	var screenshot = null;
	let driver = await new Builder()
		.forBrowser('chrome')
		.setChromeOptions(new Options().headless().windowSize({ width: 1920, height: 1080 }))
		// .setChromeOptions(new Options().windowSize({ width: 1920, height: 1080 })) // DEBUG
		.build();
	try {
		await driver.get('https://sedna.univ-fcomte.fr/direct/myplanning.jsp').catch(err => { console.error("couldn't connect to ADE : " + err); });
		// await console.log("Chrome webdriver connected");
		await driver.findElement(By.id('username')).sendKeys(config.cas_auth.id);
		await driver.findElement(By.id('password')).sendKeys(config.cas_auth.password);
		await driver.findElement(By.name('submit')).click();
		await driver.sleep(3000);
		let el = await driver.wait(until.elementLocated(By.xpath(id_groups[data.annee].xpath)), 10000);
		await el.click();
		await driver.sleep(500);
		await driver.actions().doubleClick(el).perform();
		el = await driver.wait(until.elementLocated(By.xpath(id_groups[data.annee][data.semestre].xpath)), 5000);
		await el.click();
		await driver.sleep(500);
		await driver.actions().doubleClick(el).perform();
		el = await driver.wait(until.elementLocated(By.xpath(id_groups[data.annee][data.semestre][data.classe].xpath)), 5000);
		await el.click();
		await driver.sleep(500);
		await driver.actions().doubleClick(el).perform();
		await driver.wait(until.elementLocated(By.xpath(id_groups[data.annee][data.semestre][data.classe][data.groupe].xpath)), 5000).click();
		if (data.semaine != null) {
			await driver.sleep(500);
			await driver.wait(until.elementLocated(By.xpath(data.semaine)), 5000).click();
		}
		el = await driver.wait(until.elementLocated(By.xpath(id_groups[data.annee][data.semestre][data.classe].xpath)), 5000);
		await driver.sleep(500);
		await driver.actions().keyDown(Key.CONTROL).click(await driver.findElement(By.xpath("//button[text()='Sam']"))).perform();
		await driver.sleep(500);
		await driver.actions().keyDown(Key.CONTROL).click(await driver.findElement(By.xpath("//button[text()='Dim']"))).perform();
		await driver.sleep(2000);
		await driver.findElement(By.id('x-auto-19')).takeScreenshot()
			.then(str => { screenshot = Buffer.from(str, "base64"); })
			.catch(err => { console.error("couldn't take screenshot: " + err); });
	} finally {
		// await driver.quit();
		// await console.log("Chrome webdriver disconnected");
	}
	return screenshot;
}

bot.login(config.token);
