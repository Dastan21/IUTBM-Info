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
var lastReq = null;


/* Setup Discord bot */
bot.on('ready', () => {
	console.log(bot.user.tag + " is online");
	bot.user.setPresence({
		activity: {
			name: 'iut help'
		},
		status: 'online' }
	)
})


/* Setup Mongo Database */
var url = "mongodb://edtinfo:edtinfobot@localhost/edtinfo_db";
MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, db) {
	if (err) throw err;
	console.log("Database connected");
	// db.close();
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
		case 'help':
			if (arguments.length < 1)
				showHelp(msg);
			else
				showMoreHelp(msg, arguments[0]);
			break;
		case 'edt':
			if (lastReq == null) {
				lastReq = rawCommand;
				showEDT(msg, arguments);
			} else
				msgReply(msg, "merci d'attendre la fin du traitement de la requête `" + lastReq + "`.");
			break;
		case 'agenda':
			msgReply(msg, "cette commande n'est pas disponible pour le moment : en cours de création.");
			// agendaManager(msg, arguments);
			break;
		default:
			msgReply(msg, "cette commande n'existe pas.");
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

function showHelp(msg) {
	let embed = new Discord.MessageEmbed()
		.setColor(config.embedColor)
		.setTitle("Liste des commandes")
		// .setDescription("IUTBM-Info  [...] bla bla jsp.")
		// .setThumbnail(bot.user.displayAvatarURL())
		.setThumbnail(msg.author.displayAvatarURL({ format: 'png', dynamic: true }))
		.addFields(
			{
				name: "[ Général ]",
				value: "`help` `edt` `agenda`"
			},
			{
				name: "[ Agenda ] **(INDISPONIBLE)**",
				value: "`list` `add` `edit` `remove` `done`"
			}
		)
		// .setTimestamp()
		.setFooter("Créé par Loïc DEGRANGE");
	msgSend(msg, embed)
}

function showMoreHelp(msg, cmd) {
	let embed = new Discord.MessageEmbed().setColor(config.embedColor);
	switch (cmd) {
		/* Basic commands */
		case "help":
			embed.setTitle("HELP").addFields({ name: "[ Description ]‎", value: "Vraiment ?!" }, { name: "[ Utilisation ]", value: "`iut help COMMAND`" });
			break;
		case "edt":
			embed.setTitle("EDT").addFields({ name: "[ Description ]" , value: "Affiche l'emploi du temps du groupe." }, { name: "[ Utilisation ]", value: "`iut edt SEMESTRE-GROUPE (SEMAINE)`" }, { name: "[ Défaut ]", value: "• SEMAINE : `0`" });
			break;
		case "agenda":
			embed.setTitle("AGENDA").addFields({ name: "[ Description ]" , value: "Gére l'agenda de l'hôte de la commande." }, { name: "[ Utilisation ]", value: "`iut agenda ACTION`" });
			break;
		case "list":
			embed.setTitle("LIST").addFields({ name: "[ Description ]" , value: "Affiche la liste des événements de la commande." }, { name: "[ Utilisation ]", value: "`iut agenda list`" });
			break;
		case "add":
			embed.setTitle("ADD").addFields({ name: "[ Description ]" , value: "Ajoute un événement dans l'agenda." }, { name: "[ Utilisation ]", value: "`iut agenda add EVENEMENT`" });
			break;
		case "edit":
			embed.setTitle("EDIT").addFields({ name: "[ Description ]" , value: "Modifie un événement dans l'agenda." }, { name: "[ Utilisation ]", value: "`iut agenda edit EVENEMENT`" });
			break;
		case "delete":
			embed.setTitle("DELETE").addFields({ name: "[ Description ]" , value: "Supprime un événement dans l'agenda." }, { name: "[ Utilisation ]", value: "`iut agenda delete EVENEMENT`" });
			break;
		case "done":
			embed.setTitle("DONE").addFields({ name: "[ Description ]" , value: "Établit un événement comme 'terminé' dans l'agenda ." }, { name: "[ Utilisation ]", value: "`iut agenda done EVENEMENT`" });
			break;
		case "todo":
			embed.setTitle("TODO").addFields({ name: "[ Description ]" , value: "Établit un événement comme 'à faire' dans l'agenda ." }, { name: "[ Utilisation ]", value: "`iut agenda todo EVENEMENT`" });
			break;
		default:
			msgReply(msg, "cette commande n'existe pas.");
			return;
	}
	msgSend(msg, embed)
}

async function showEDT(msg, args) {
	var data = {};
	var arg_classe = args[0];
	var arg_semaine = args[1];
	if (!arg_classe) { msgReply(msg, "tu dois choisir un groupe."); lastReq = null; return; }
	arg_classe = arg_classe.toLowerCase();
	if (!groupes_liste.includes(arg_classe)) { msgReply(msg, "le groupe est incorrect."); lastReq = null; return; }
	if (arg_classe[1] < 3) data.annee = "1e"; else data.annee = "2e";
	data.semestre = "s" + arg_classe[1];
	data.classe = arg_classe[3];
	data.groupe = data.classe + arg_classe[4];
	let week = (new Date()).getWeek();
	if (arg_semaine != null) {
		if (isNaN(arg_semaine) || Number(arg_semaine) < 1 || Number(arg_semaine) > 26) { msgReply(msg, "la semaine doit être un nombre compris entre 1 et 26."); lastReq = null; return; }
		week = (week + Number(arg_semaine)) % 54;
	}
	data.semaine = "//button[starts-with(., '"+week+" ')]";
	msgSend(msg, "Groupe : **" + arg_classe.toUpperCase() + "**", new Discord.MessageAttachment(await connectToADE(data), "edt.png"));
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
		await driver.sleep(500);
		await driver.wait(until.elementLocated(By.xpath(data.semaine)), 5000).click();
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
		await driver.quit();
		lastReq = null;
		// await console.log("Chrome webdriver disconnected");
	}
	return screenshot;
}

Date.prototype.getWeek = function() {
	var onejan = new Date(this.getFullYear(),0,1);
	var today = new Date(this.getFullYear(),this.getMonth(),this.getDate());
	var dayOfYear = ((today - onejan + 86400000)/86400000);
	return Math.ceil(dayOfYear/7)
};

async function agendaManager() {

}

bot.login(config.token);
