const config = require('./configs/config')
const Discord = require('discord.js')
const bot = new Discord.Client()
const mongoose = require('mongoose')
const { Builder, By, Key, until } = require('selenium-webdriver');
const { Options } = require('selenium-webdriver/chrome');
const Agenda = require('./models/Agenda')
const Event = require('./models/Event')
const User = require('./models/User')
const groups = require('./configs/groups')
var lastReq = null;


/* Setup Discord Bot */
bot.on('ready', () => { console.log(bot.user.tag + " is online"); })


/* Setup Mongo Database */
mongoose
    .connect(config.db_url, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useFindAndModify: false,
			useCreateIndex: true
		})
    .then(console.log("MongoDB connected"))
    .catch(err => console.log(err));


/* The main "loop" */
bot.on('message', msg => { if (msg.content.toLowerCase().startsWith(config.prefix)) commandProcess(msg); });

async function commandProcess(msg) {
	let rawCommand = msg.content;
    let fullCommand = rawCommand.substr(config.prefix.length+1);
    let splitCommand = fullCommand.split(' ');
    let primaryCommand = splitCommand[0].toLowerCase();
    let arguments = splitCommand.slice(1);

	switch (primaryCommand) {
		case 'debug':
			console.log(arguments.join(' ').replace(/["]/g,''));
			break;
		case 'help':
				await showMoreHelp(msg, arguments);
			break;
		case 'edt':
				edtManager(msg, arguments);
			break;
		case 'agenda':
			msgReply(msg, "désolé la commande n'est pas disponible pour le moment.");
			// agendaManager(msg, arguments);
			break;
		default:
			msgReply(msg, "cette commande n'existe pas.");
	}
}

async function showMoreHelp(msg, cmds) {
	let embed = await createEmbed(msg);
	if (cmds.length == 0) {
		embed.setTitle("PANNEAU D'AIDE - GÉNÉRAL")
			.setDescription("‎IUTBM-Info est un bot Discord qui permet de voir les EDT sur ADE et de gérer des agendas.\n‎")
			.addFields({ name: "Commandes principales :", value: "`help` `edt` `agenda`\n‎" })
	} else {
		switch (cmds[0]) {
			/* Basic commands */
			case "help":
				embed.setTitle("PANNEAU D'AIDE - HELP")
					.setDescription("Afficher les informations relatives à la commande.\n‎")
					.addFields(
						{ name: "Utilisation", value: "`iut help <MAIN_COMMAND> <SUB_COMMAND>`\n‎" },
						{ name: "Arguments", value: "`<MAIN_COMMAND>` : **string**\n`<SUB_COMMAND>` : **string**\n‎" },
						{ name: "Exemples", value: "`iut help edt`\n`iut help edt show`\n‎" }
					);
				break;
			case "edt":
				switch (cmds[1]) {
					case "show":
						embed.setTitle("PANNEAU D'AIDE - EDT > SHOW")
							.setDescription("Afficher l'emploi du temps du groupe.\n‎")
							.addFields(
								{ name: "Utilisation", value: "`iut edt show <GROUPE> <SEMAINE>`\n‎" },
								{ name: "Arguments", value: "`<GROUPE>` : **string** ∈ [S1-A1, S4-C2]\n`<SEMAINE>` : **integer** ∈ [0, 8] *(défaut = 0)*\n‎" },
								{ name: "Exemples", value: "`iut edt show`\n`iut edt show "+randomInt(1,8)+"`\n`iut edt show "+randomGroupe()+"`\n`iut edt show "+randomGroupe()+" "+randomInt(1,8)+"`\n‎" }
							);
						break;
					case "set":
						embed.setTitle("PANNEAU D'AIDE - EDT > SET")
							.setDescription("Définir .\n‎")
							.addFields(
								{ name: "Utilisation", value: "`iut edt set <GROUPE>`\n‎" },
								{ name: "Arguments", value: "`<GROUPE>` : **string** ∈ [S1-A1, S4-C2]\n‎" },
								{ name: "Exemple", value: "`iut edt set "+randomGroupe()+"`\n‎" }
							);
						break;
					default:
						embed.setTitle("PANNEAU D'AIDE - EDT")
							.setDescription("Afficher l'emploi du temps d'un groupe et définir un groupe pour l'utilisateur.\n‎")
							.addFields(
								{ name: "Utilisation", value: "`iut edt <EDT_ACTION>`\n‎" },
								{ name: "Arguments", value: "`<EDT_ACTION>` : `show` `set`\n‎" }
							);
				}
				break;
			case "agenda":
				switch (cmds[1]) {
					case "list":
						embed.setTitle("PANNEAU D'AIDE - AGENDA > LIST")
							.setDescription("Afficher la liste des agendas dont l'utilisateur a accès.\n‎")
							.addFields(
								{ name: "Utilisation", value: "`iut agenda list`\n‎" }
							);
						break;
					case "create":
						embed.setTitle("PANNEAU D'AIDE - AGENDA > CREATE")
							.setDescription("Créer un agenda.\n‎")
							.addFields(
								{ name: "Utilisation", value: "`iut agenda create \"<NAME>\" <PRIVATE>`\n‎" },
								{ name: "Arguments", value: "`<NAME>` : **string** < 40 caractères\n`<PRIVATE>` : **boolean** *(défaut = false)*\n‎" },
								{ name: "Exemples", value: "`iut agenda create \"Agenda des "+randomGroupe().slice(0,-1)+"\"`\n`iut agenda create \"Agenda des "+randomGroupe().slice(0,-1)+"\" true`\n‎" }
							);
						break;
					case "delete":
						embed.setTitle("PANNEAU D'AIDE - AGENDA > DELETE")
							.setDescription("Supprimer un agenda.\n‎")
							.addFields(
								{ name: "Utilisation", value: "`iut agenda delete <ID_AGENDA>`\n‎" },
								{ name: "Arguments", value: "`<ID_AGENDA>` : **integer**\n‎" },
								{ name: "Exemple", value: "`iut agenda delete "+randomInt(1,9)+"`\n‎" }
							);
						break;
					case "join":
						embed.setTitle("PANNEAU D'AIDE - AGENDA > JOIN")
							.setDescription("Rejoindre un agenda.\n‎")
							.addFields(
								{ name: "Utilisation", value: "`iut agenda join <ID_AGENDA>`\n‎" },
								{ name: "Arguments", value: "`<ID_AGENDA>` : **integer**\n‎" },
								{ name: "Exemple", value: "`iut agenda join "+randomInt(1,9)+"`\n‎" }
							);
						break;
					case "leave":
						embed.setTitle("PANNEAU D'AIDE - AGENDA > LEAVE")
							.setDescription("Quitter un agenda.\n‎")
							.addFields(
								{ name: "Utilisation", value: "`iut agenda leave <ID_AGENDA>`\n‎" },
								{ name: "Arguments", value: "`<ID_AGENDA>` : **integer**\n‎" },
								{ name: "Exemple", value: "`iut agenda leave "+randomInt(1,9)+"`\n‎" }
							);
						break;
					case "show":
						embed.setTitle("PANNEAU D'AIDE - AGENDA > SHOW")
							.setDescription("Afficher tous les événements d'un agenda.\n‎")
							.addFields(
								{ name: "Utilisation", value: "`iut agenda <ID_AGENDA> show`\n‎" },
								{ name: "Arguments", value: "`<ID_AGENDA>` : **integer**\n‎" },
								{ name: "Exemple", value: "`iut agenda "+randomInt(1,9)+" show`‎" }
							);
						break;
					case "add":
						embed.setTitle("PANNEAU D'AIDE - AGENDA > ADD")
							.setDescription("Ajouter un événement dans un agenda.\n‎")
							.addFields(
								{ name: "Utilisation", value: "`iut agenda <ID_AGENDA> add \"<TITLE>\" \"<DESCRIPTION>\" <DATE>`\n‎" },
								{ name: "Arguments", value: "`<ID_AGENDA>` : **integer**\n`<TITLE>` : **string** < 40 caractères\n`<DESCRIPTION>` : **string** < 300 caractères *(défaut = null)*\n`<DATE>` : **string** JJ/MM *(défaut = null)*\n‎" },
								{ name: "Exemples", value: "`iut agenda "+randomInt(1,9)+" add \"TD Algo\" \"Finir exo "+randomInt(1,3)+"\\nRelire cours\"`\n`iut agenda "+randomInt(1,9)+" add \"TD Algo\" "+(("0"+randomInt(1,27)).slice(-2))+"/"+(("0"+randomInt(1,12)).slice(-2))+"`\n`iut agenda "+randomInt(1,9)+" add \"TD Algo\" \"Finir exo "+randomInt(2,4)+"\" "+(("0"+randomInt(1,27)).slice(-2))+"/"+(("0"+randomInt(1,12)).slice(-2))+"`\n‎" }
							);
						break;
					case "edit":
						embed.setTitle("PANNEAU D'AIDE - AGENDA > EDIT")
							.setDescription("Modifier un événement d'un agenda.\n‎")
							.addFields(
								{ name: "Utilisation", value: "`iut agenda <ID_AGENDA> edit \"<TITLE>\" \"<DESCRIPTION>\" <DATE>`\n‎" },
								{ name: "Arguments", value: "`<ID_AGENDA>` : **integer**\n`<ID_EVENT>` : **integer**\n`<TITLE>` : **string** < 40 caractères\n`<DESCRIPTION>` : **string** < 300 caractères *(défaut = null)*\n`<DATE>` : **string** JJ/MM *(défaut = null)*\n‎" },
								{ name: "Exemples", value: "`iut agenda "+randomInt(1,9)+" edit \"TD Algo\" \"Faire exo "+randomInt(1,3)+"\\nRelire cours\"`\n`iut agenda "+randomInt(1,9)+" edit \"TD Algo\" "+(("0"+randomInt(1,27)).slice(-2))+"/"+(("0"+randomInt(1,12)).slice(-2))+"`\n`iut agenda "+randomInt(1,9)+" edit \"TD Algo\" \"Lire cours\" "+(("0"+randomInt(1,27)).slice(-2))+"/"+(("0"+randomInt(1,12)).slice(-2))+"`\n‎" }
							);
						break;
					case "remove":
						embed.setTitle("PANNEAU D'AIDE - AGENDA > REMOVE")
							.setDescription("Supprimer un événement d'un agenda.\n‎")
							.addFields(
								{ name: "Utilisation", value: "`iut agenda <ID_AGENDA> remove <ID_EVENT>`\n‎" },
								{ name: "Arguments", value: "`<ID_AGENDA>` : **integer**\n`<ID_EVENT>` : **integer**\n‎" },
								{ name: "Exemple", value: "`iut agenda "+randomInt(1,9)+" remove "+randomInt(1,9)+"`" }
							);
						break;
						case "todo":
						embed.setTitle("PANNEAU D'AIDE - AGENDA > TODO")
							.setDescription("Établir un événement comme 'à faire' d'un agenda.\n‎")
							.addFields(
								{ name: "Utilisation", value: "`iut agenda <ID_AGENDA> todo <ID_EVENT>`\n‎" },
								{ name: "Arguments", value: "`<ID_AGENDA>` : **integer**\n`<ID_EVENT>` : **integer**\n‎" },
								{ name: "Exemple", value: "`iut agenda "+randomInt(1,9)+" todo "+randomInt(1,9)+"`" }
							);
						break;
					case "done":
						embed.setTitle("PANNEAU D'AIDE - AGENDA > DONE")
							.setDescription("Établir un événement comme 'terminé' d'un agenda.\n‎")
							.addFields(
								{ name: "Utilisation", value: "`iut agenda <ID_AGENDA> done <ID_EVENT>`\n‎" },
								{ name: "Arguments", value: "`<ID_AGENDA>` : **integer**\n`<ID_EVENT>` : **integer**\n‎" },
								{ name: "Exemple", value: "`iut agenda "+randomInt(1,9)+" done "+randomInt(1,9)+"`" }
							);
						break;
					default:
						embed.setTitle("PANNEAU D'AIDE - AGENDA")
							.setDescription("Gérer un ou plusieurs agendas.\n‎")
							.addFields(
								{ name: "Utilisations", value: "`iut agenda <AGENDA_ACTION>`\n`iut agenda <ID_AGENDA> <EVENT_ACTION>`\n‎" },
								{ name: "Arguments", value: "`<AGENDA_ACTION>` : `list` `create` `delete` `join` `leave`\n`<ID_AGENDA>` : **integer**\n`<EVENT_ACTION>` : `show` `add` `edit` `remove` `done` `todo`\n‎" }
							);
					}
				break;
			default:
				msgReply(msg, "cette commande n'existe pas.");
				return;
		}
	}
	msgSend(msg, embed)
}

async function edtManager(msg, args) {
	if (args.length == 0) { await showMoreHelp(msg, ["edt"]); return; }
	var user_doc = await User.findOne({ id: msg.author.id });
	let group;
	switch (args[0]) {
		case "show":
			group = (user_doc != null && user_doc.group != undefined) ? user_doc.group : args[1];
			if (!groups.list.includes(group)) { msgReply(msg, "ce groupe n'existe pas."); return; }
			let weeks_ahead = args[args.length-1] !== group && args[args.length-1] != args[0] ? args[args.length-1] : 0;
			if (weeks_ahead != 0 && (isNaN(weeks_ahead) || Number(weeks_ahead) < 0 || Number(weeks_ahead) > 8)) { msgReply(msg, "la semaine doit être un nombre compris entre 0 et 8."); return; }
			if (lastReq != null) { msgReply(msg, "merci d'attendre la fin du traitement de la requête `" + lastReq + "`."); return; }
			lastReq = "iut edt " + args.join(' ');
			msgSend(msg, "Groupe : **" + group.toUpperCase() + "**", new Discord.MessageAttachment(await getEDTFromADE(getEDTData(group, weeks_ahead)), "edt.png"));
			break;
		case "set":
			if (args.length == 1) { await showMoreHelp(msg, ["edt"].concat(args)); return; }
			group = args[1].toLowerCase();
			if (!groups.list.includes(group)) { msgReply(msg, "ce groupe n'existe pas."); return; }
			if (user_doc != null && user_doc.group === group) { msgReply(msg, "tu es déjà dans le groupe `" + group.toUpperCase() + "`."); return; }
			if (user_doc == null) 	user_doc = new User({id: msg.author.id, username: msg.author.username, group: group});
			else 					await User.updateOne(user_doc, {group: group});
			msgReply(msg, "tu es désormais dans le groupe `" + group.toUpperCase() + "`.");
			await user_doc.save();
			break;
	}
}

function getEDTData(group, weeks_ahead) {
	let data = {};
	/* Group */
	data.annee = group[1] < 3 ? "1e" : "2e";
	data.semestre = "s" + group[1];
	data.classe = group[3];
	data.groupe = data.classe + group[4];
	/* Week */
	data.semaine = ((new Date()).getWeek() + Number(weeks_ahead)) % 54;
	return data;
}

async function getEDTFromADE(data) {
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
		let el = await driver.wait(until.elementLocated(By.xpath(groups[data.annee].xpath)), 10000);
		await el.click();
		await driver.sleep(500);
		await driver.actions().doubleClick(el).perform();
		el = await driver.wait(until.elementLocated(By.xpath(groups[data.annee][data.semestre].xpath)), 5000);
		await el.click();
		await driver.sleep(500);
		await driver.actions().doubleClick(el).perform();
		el = await driver.wait(until.elementLocated(By.xpath(groups[data.annee][data.semestre][data.classe].xpath)), 5000);
		await el.click();
		await driver.sleep(500);
		await driver.actions().doubleClick(el).perform();
		await driver.wait(until.elementLocated(By.xpath(groups[data.annee][data.semestre][data.classe][data.groupe].xpath)), 5000).click();
		await driver.sleep(500);
		await driver.wait(until.elementLocated(By.xpath("//button[starts-with(., '" + data.semaine + " ')]")), 5000).click();
		el = await driver.wait(until.elementLocated(By.xpath(groups[data.annee][data.semestre][data.classe].xpath)), 5000);
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

async function agendaManager(msg, args) {
	if (args.length == 0) { await showMoreHelp(msg, ["agenda"]); return; }
	if (args.length == 1) { await showMoreHelp(msg, ["agenda"].concat(args)); return; }
	var ev = null;
	const agenda = await db.collection("agenda");
	const user = await db.collection("user");
	let usr = await user.findOne({id: msg.author.id});
	if (usr == null) await user.insertOne({
		id: msg.author.id,

	});
	switch (args[0]) {
		case 'list':
			let list = [];
			let embed = new Discord.MessageEmbed()
				.setColor(config.embedColor)
				.setTitle("Liste des événements")
				.setFooter("Agenda de " + msg.author.username, msg.author.displayAvatarURL({ format: 'png', dynamic: true}));
			var evenements = await agenda.find().forEach(function(ev) {
				list.push({name:"[" + ev.id + "] " + ev.title + " : le " + ev.date + " à " + ev.time + "\n", value: ev.description});
			});
			if (list.length == 0) list = {name: "‎", value: "Il n'y aucun événement."};
			embed.addFields(list);
			msgSend(msg, embed);
			break;
		case 'add':
			// iut agenda add {"title":"TitreEvenement","description":"description[...]","date":"08/10/2020","time":"15:00"}
			ev = args.slice(1).join(' ');
			ev = ev.slice(0, 1) + "\"id\":"+(await agenda.countDocuments()+1)+"," + ev.slice(1);
			try { ev = JSON.parse(ev); } catch (e) { msgReply(msg, "la syntaxe de l'événement est incorrect."); return; }
			await agenda.insertOne(ev);
			msgReply(msg, "événement ajouté !");
			break;
		case 'edit':
			// iut agenda edit 2 {"title":"EditedTitre","description":"desc2"}
			ev = await eventValidator(msg, args[1], agenda); if (ev == null) return;
			let edit = args.slice(2).join(' ');
			try { edit = JSON.parse(edit); } catch (e) { msgReply(msg, "la syntaxe de l'événement est incorrect."); return; }
			await agenda.updateOne(ev, {$set:edit});
			msgReply(msg, "événement modifié !");
			break;
		case 'remove':
			// iut agenda remove 3
			ev = await eventValidator(msg, args[1], agenda); if (ev == null) return;
			await agenda.deleteOne(ev);
			msgReply(msg, "événement supprimé !");
			break;
		case 'done':
			// iut agenda done 5
			// ev = await eventValidator(msg, args[1], agenda); if (ev == null) return;
			msgReply(msg, "cette option n'est pas encore implémentée.");
			break;
		case 'todo':
			// iut agenda todo 1
			msgReply(msg, "cette option n'est pas encore implémentée.");
			break;
		default:
			msgReply(msg, "cette commande n'existe pas.");
	}
}

function createEventJson() {
	let json = null;

	return json;
}

async function eventValidator(msg, num, agenda) {
	if (isNaN(num)) { msgReply(msg, "le numéro de l'événement est incorrect."); return null; }
	let ev = await agenda.findOne({id: Number(num)});
	if (ev == null) { msgReply(msg, "l'événement n°" + num + " n'existe pas."); return null; }
	return ev;
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

async function createEmbed() {
	let owner = await bot.users.fetch('310450863845933057');
	return new Discord.MessageEmbed().setColor(config.embedColor).setThumbnail(bot.user.displayAvatarURL()).setURL("https://github.com/Dastan21").setFooter(owner.username+"#"+owner.discriminator, owner.displayAvatarURL({ format: 'png', dynamic: true}));
}

function randomInt(min, max) {
	return Math.floor((Math.random()*Math.floor(max))+Math.floor(min));
}

function randomGroupe() {
	return groups.list[randomInt(0,groups.list.length-1)].toUpperCase();
}

Date.prototype.getWeek = function() {
	var target  = new Date(this.valueOf());
	var dayNr   = (this.getDay() + 6) % 7;
	target.setDate(target.getDate() - dayNr + 3);
	var jan4    = new Date(target.getFullYear(), 0, 4);
	var dayDiff = (target - jan4) / 86400000;
	if (new Date(target.getFullYear(), 0, 1).getDay() < 5)
		return 1 + Math.ceil(dayDiff / 7);
	return Math.ceil(dayDiff / 7);
};







bot.login(config.token);
