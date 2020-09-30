const Discord = require('discord.js')
const bot = new Discord.Client()
const config = require('./config')
const id_groups = require('./id_groups')
var mongo = require('mongodb')
var MongoClient = require('mongodb').MongoClient;
const { Builder, By, Key, until } = require('selenium-webdriver');
const { Options } = require('selenium-webdriver/chrome');
const groupes_liste = [
	"s1-a1", "s1-a2", "s1-b1", "s1-b2", "s1-c1", "s1-c2", "s1-d1",
	"s2-a1", "s2-a2", "s2-b1", "s2-b2", "s2-c1", "s2-c2", "s2-d1",
	"s3-a1", "s3-a2", "s3-b1", "s3-b2", "s3-c1", "s3-c2",
	"s4-a1", "s4-a2", "s4-b1", "s4-b2", "s4-c1", "s4-c2",
];

/* Setup Discord bot */
bot.on('ready', () => {
  console.log(bot.user.tag + " is online");
	bot.user.setStatus('online');
})



/* Setup Mongo Database */
var url = "mongodb://edtinfo:edtinfobot@localhost/edtinfo_db";
MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, db) {
	if (err) throw err;
	console.log("Database connected");
	db.close();
});



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
			showEDT(msg, arguments[0]);
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

async function showEDT(msg, arg) {
	arg = arg.toLowerCase();
	if (!groupes_liste.includes(arg)) { msgReply(msg, "le format du semestre/groupe est mal indiqué (voir `edt help show`)"); return; }
	let annee, semestre, classe, groupe;
	if (arg[1] < 3) annee = "1e"; else annee = "2e";
	semestre = "s" + arg[1];
	classe = arg[3];
	groupe = classe + arg[4];
	msgSend(msg, "", new Discord.MessageAttachment(await connectToADE(annee, semestre, classe, groupe), "edt.png"));
}

async function connectToADE(annee, semestre, classe, groupe) {
	var screenshot = null;
	let driver = await new Builder()
		.forBrowser('chrome')
		.setChromeOptions(new Options().headless().windowSize({ width: 1920, height: 1080 }))
		// .setChromeOptions(new Options().windowSize({ width: 1920, height: 1080 })) // DEBUG
		.build();
	try {
		await driver.get('https://sedna.univ-fcomte.fr/direct/myplanning.jsp');
		// await console.log("Chrome webdriver connected");
		await driver.findElement(By.id('username')).sendKeys(config.cas_auth.id);
		await driver.findElement(By.id('password')).sendKeys(config.cas_auth.password);
		await driver.findElement(By.name('submit')).click();
		await driver.sleep(3000);
		let el = await driver.wait(until.elementLocated(By.xpath(id_groups[annee].xpath)), 10000);
		await el.click();
		await driver.sleep(500);
		await driver.actions().doubleClick(el).perform();
		el = await driver.wait(until.elementLocated(By.xpath(id_groups[annee][semestre].xpath)), 5000);
		await el.click();
		await driver.sleep(500);
		await driver.actions().doubleClick(el).perform();
		el = await driver.wait(until.elementLocated(By.xpath(id_groups[annee][semestre][classe].xpath)), 5000);
		await el.click();
		await driver.sleep(500);
		await driver.actions().doubleClick(el).perform();
		await driver.wait(until.elementLocated(By.xpath(id_groups[annee][semestre][classe][groupe].xpath)), 5000).click();
		await driver.sleep(2000);
		await driver.findElement(By.id('x-auto-19')).takeScreenshot()
			.then(str => {
				screenshot = Buffer.from(str, "base64");
			})
			.catch(err => { console.error("Couldn't take screenshot: " + err); });
	} finally {
		await driver.quit();
		// await console.log("Chrome webdriver disconnected");
	}
	return screenshot;
}

bot.login(config.token);
