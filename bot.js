const secrets = require('./config/secrets');
const Discord = require('discord.js');
const bot = new Discord.Client();
const mongoose = require('mongoose');
const request = require('request');
const phin = require('phin');
const { Image, createCanvas, loadImage } = require('canvas');
const Agenda = require('./models/Agenda');
const Event = require('./models/Event');
const User = require('./models/User');
const groups = require('./config/groups');
const groupids = require('./config/groupids');
const arrows = { up: '🔼', down: '🔽', left: '⬅️', right: '➡️', refresh: '🔄' };
var lastEDT = {};
var message = null;

bot.on('ready', () => { console.log(bot.user.tag + " is online"); })

mongoose
    .connect(secrets.db_url, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useFindAndModify: false,
			useCreateIndex: true
		})
    .then(console.log("MongoDB connected"))
    .catch(err => console.log(err));


bot.on('message', msg => { if (msg.content.toLowerCase().startsWith(secrets.prefix)) { message = msg; commandProcess(); } });


async function commandProcess() {
	let rawCommand = message.content;
    let fullCommand = rawCommand.substr(secrets.prefix.length+1);
    let splitCommand = fullCommand.split(' ');
	splitCommand = splitCommand.filter(function(e){return e});
    let primaryCommand = splitCommand[0];
    let arguments = splitCommand.slice(1);

	switch (primaryCommand.toLowerCase()) {
		case 'help':
			showHelp(arguments);
			break;
		case 'edt':
			edtManager(arguments);
			break;
		case 'agenda':
			agendaManager(arguments);
			break;
		default:
			msgReply("cette commande n'existe pas.");
	}
}


function showHelp(cmds) {
	let embed = createEmbed();
	if (cmds.length == 0) {
		embed.setTitle("PANNEAU D'AIDE - HELP")
			.setDescription("‎IUTBM-Info est un bot Discord qui permet de voir les EDT sur ADE et de gérer des agendas.\n‎")
			.addFields(
				{ name: "Utilisation générale", value: "`iut [command]`\n‎" },
				{ name: "Argument", value: "[command] : `edt` `agenda`\n‎" },
				{ name: "Utilisation de la commande help", value: "`iut help [command1] [command2] [command3]...`\n‎" },
				{ name: "Exemples", value: "`iut help edt`\n`iut help edt show`\n`iut help agenda modify title`\n`iut help agenda edit description`\n‎" },
			);
	} else {
		cmds[0].toLowerCase();
		if (cmds.length > 1) cmds[1].toLowerCase();
		switch (cmds[0]) {
			case "edt":
				switch (cmds[1]) {
					case "show":
						embed.setTitle("PANNEAU D'AIDE - EDT > DISPLAY")
							.setDescription("Afficher l'emploi du temps du groupe.\n‎")
							.addFields(
								{ name: "Utilisation", value: "`iut edt show [group] [week]`\n‎" },
								{ name: "Arguments", value: "[group] : **string** ∈ [S1-A1, S4-C2]\n[week] : **integer** ∈ [0, 8] *(default = 0)*\n‎" },
								{ name: "Exemples", value: "`iut edt show`\n`iut edt show "+randomInt(1,8)+"`\n`iut edt show "+randomGroupe()+"`\n`iut edt show "+randomGroupe()+" "+randomInt(1,8)+"`\n‎" }
							);
						break;
					case "set":
						embed.setTitle("PANNEAU D'AIDE - EDT > SET")
							.setDescription("Attribuer un groupe à l'utilisateur.\n‎")
							.addFields(
								{ name: "Utilisation", value: "`iut edt set [group]`\n‎" },
								{ name: "Argument", value: "[group] : **string** ∈ [S1-A1, S4-C2]\n‎" },
								{ name: "Exemple", value: "`iut edt set "+randomGroupe()+"`\n‎" }
							);
						break;
					case "get":
						embed.setTitle("PANNEAU D'AIDE - EDT > GET")
							.setDescription("Connaître à quel groupe l'utilisateur appartient.\n‎")
							.addFields(
								{ name: "Utilisation", value: "`iut edt get`\n‎" }
							);
						break;
					default:
						embed.setTitle("PANNEAU D'AIDE - EDT")
							.setDescription("Afficher l'emploi du temps d'un groupe et définir un groupe pour l'utilisateur.\n‎")
							.addFields(
								{ name: "Utilisation", value: "`iut edt [actionEDT]`\n‎" },
								{ name: "Arguments", value: "[actionEDT] : `show` `set` `get`\n‎" }
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
								{ name: "Utilisation", value: "`iut agenda create \"[title]\" [private]`\n‎" },
								{ name: "Arguments", value: "[title] : **string** < 20\n[private] : **boolean** *(default = false)*\n‎" },
								{ name: "Exemples", value: "`iut agenda create \"Agenda des "+randomGroupe().slice(0,-1)+"\"`\n`iut agenda create \"Memo perso\" true`\n‎" }
							);
						break;
					case "modify":
						if (cmds.length > 2) cmds[2].toLowerCase();
						switch (cmds[2]) {
							case "title":
								embed.setTitle("PANNEAU D'AIDE - AGENDA > MODIFY > TITLE")
								.setDescription("Modifier le titre d'un agenda.\n‎")
								.addFields(
									{ name: "Utilisation", value: "`iut agenda modify [agendaID] title \"[title]\"`\n‎" },
									{ name: "Arguments", value: "[agendaID] : **integer**\n‎[title] : **string**\n‎" },
									{ name: "Exemple", value: "`iut agenda modify "+randomInt(1,9)+" title \"Agenda des "+randomGroupe().slice(0,-1)+"\"`\n‎" }
								);
								break;
							case "private":
								embed.setTitle("PANNEAU D'AIDE - AGENDA > MODIFY > PRIVATE")
								.setDescription("Modifier la visibilité d'un agenda.\n‎")
								.addFields(
									{ name: "Utilisation", value: "`iut agenda modify [agendaID] private [private]`\n‎" },
									{ name: "Arguments", value: "[agendaID] : **integer**\n‎[private] : **boolean**\n‎" },
									{ name: "Exemple", value: "`iut agenda modify "+randomInt(1,9)+" private true`\n‎" }
								);
								break;
							default:
								embed.setTitle("PANNEAU D'AIDE - AGENDA > MODIFY")
								.setDescription("Modifier un agenda.\n‎")
								.addFields(
									{ name: "Utilisation", value: "`iut agenda modify [agendaID] [actionModify]`\n‎" },
									{ name: "Arguments", value: "[agendaID] : **integer**\n[actionModify] : `title` `private`\n‎" }
								);
						}
						break;
					case "delete":
						embed.setTitle("PANNEAU D'AIDE - AGENDA > DELETE")
							.setDescription("Supprimer un agenda.\n‎")
							.addFields(
								{ name: "Utilisation", value: "`iut agenda delete [agendaID]`\n‎" },
								{ name: "Argument", value: "[agendaID] : **integer**\n‎" },
								{ name: "Exemple", value: "`iut agenda delete "+randomInt(1,9)+"`\n‎" }
							);
						break;
					case "invite":
						embed.setTitle("PANNEAU D'AIDE - AGENDA > INVITE")
							.setDescription("Créer une invitation pour un agenda.\n‎")
							.addFields(
								{ name: "Utilisation", value: "`iut agenda invite [agendaID]`\n‎" },
								{ name: "Argument", value: "[agendaID] : **integer**\n‎" },
								{ name: "Exemple", value: "`iut agenda invite "+randomInt(1,9)+"`\n‎" }
							);
						break;
					case "join":
						embed.setTitle("PANNEAU D'AIDE - AGENDA > JOIN")
							.setDescription("Rejoindre un agenda.\n‎")
							.addFields(
								{ name: "Utilisation", value: "`iut agenda join [agendaID]`\n‎" },
								{ name: "Argument", value: "[agendaID] : **integer**\n‎" },
								{ name: "Exemple", value: "`iut agenda join "+randomInt(1,9)+"`\n‎" }
							);
						break;
					case "leave":
						embed.setTitle("PANNEAU D'AIDE - AGENDA > LEAVE")
							.setDescription("Quitter un agenda.\n‎")
							.addFields(
								{ name: "Utilisation", value: "`iut agenda leave [agendaID]`\n‎" },
								{ name: "Argument", value: "[agendaID] : **integer**\n‎" },
								{ name: "Exemple", value: "`iut agenda leave "+randomInt(1,9)+"`\n‎" }
							);
						break;
					case "show":
						embed.setTitle("PANNEAU D'AIDE - AGENDA > EVENT > SHOW")
							.setDescription("Afficher tous les événements d'un agenda.\n‎")
							.addFields(
								{ name: "Utilisation", value: "`iut agenda [agendaID] show [state]`\n‎" },
								{ name: "Arguments", value: "[agendaID] : **integer**\n[state] : **string** ∈ [todo,done] *(default = null)*\n‎" },
								{ name: "Exemples", value: "`iut agenda "+randomInt(1,9)+" show`‎\n`iut agenda "+randomInt(1,9)+" show todo`\n‎" }
							);
						break;
					case "add":
						embed.setTitle("PANNEAU D'AIDE - AGENDA > EVENT > ADD")
							.setDescription("Ajouter un événement dans un agenda.\n‎")
							.addFields(
								{ name: "Utilisation", value: "`iut agenda [agendaID] add \"[title]\" \"[description]\" [date]`\n‎" },
								{ name: "Arguments", value: "[agendaID] : **integer**\n[title] : **string** < 20\n[description] : **string** < 300\n[date] : **date** JJ/MM/YYYY\n‎" },
								{ name: "Exemples", value: "`iut agenda "+randomInt(1,9)+" add \"TD Algo\" \"Finir exo "+randomInt(1,3)+" et relire cours\" "+(("0"+randomInt(1,27)).slice(-2))+"/"+(("0"+randomInt(1,12)).slice(-2))+"/202"+randomInt(0,1)+"`\n`iut agenda "+randomInt(1,9)+" add \"DM Web à rendre\" \"\" "+(("0"+randomInt(1,27)).slice(-2))+"/"+(("0"+randomInt(1,12)).slice(-2))+"/202"+randomInt(0,1)+"`\n`iut agenda "+randomInt(1,9)+" add \"TP Expression\" \"Lire cours et faire résumé\" null`\n‎" }
							);
						break;
					case "edit":
						if (cmds.length > 2) cmds[2].toLowerCase();
						switch (cmds[2]) {
							case "title":
								embed.setTitle("PANNEAU D'AIDE - AGENDA > EVENT > EDIT > TITLE")
									.setDescription("Modifier le titre d'un agenda.\n‎")
									.addFields(
										{ name: "Utilisation", value: "`iut agenda [agendaID] edit [eventID] title \"[title]\"`\n‎" },
										{ name: "Arguments", value: "[agendaID] : **integer**\n‎[eventID] : **integer**\n[title] : **string** < 20\n‎" },
										{ name: "Exemple", value: "`iut agenda "+randomInt(1,9)+" edit "+randomInt(1,15)+" title \"TP Expression\"`\n‎" }
									);
								break;
							case "description":
								embed.setTitle("PANNEAU D'AIDE - AGENDA > EVENT > EDIT > DESCRIPTION")
									.setDescription("Modifier la visibilité d'un agenda.\n‎")
									.addFields(
										{ name: "Utilisation", value: "`iut agenda [agendaID] edit [eventID] description \"[description]\"`\n‎" },
										{ name: "Arguments", value: "[agendaID] : **integer**\n‎[eventID] : **integer**\n[description] : **string** < 300\n‎" },
										{ name: "Exemples", value: "`iut agenda "+randomInt(1,9)+" edit "+randomInt(1,15)+" description \"Exo "+randomInt(1,3)+" à finir\"`\n`iut agenda "+randomInt(1,9)+" edit "+randomInt(1,15)+" description \"\"`\n‎" }
									);
								break;
							case "date":
								embed.setTitle("PANNEAU D'AIDE - AGENDA > EVENT > EDIT > DATE")
									.setDescription("Modifier la visibilité d'un agenda.\n‎")
									.addFields(
										{ name: "Utilisation", value: "`iut agenda [agendaID] edit [eventID] date [date]`\n‎" },
										{ name: "Arguments", value: "[agendaID] : **integer**\n‎[eventID] : **integer**\n[date] : **date** JJ/MM/YYYY\n‎" },
										{ name: "Exemples", value: "`iut agenda "+randomInt(1,9)+" edit "+randomInt(1,15)+" date "+(("0"+randomInt(1,27)).slice(-2))+"/"+(("0"+randomInt(1,12)).slice(-2))+"/202"+randomInt(0,1)+"`\n`iut agenda "+randomInt(1,9)+" edit "+randomInt(1,15)+" date null`\n‎" }
									);
								break;
							default:
								embed.setTitle("PANNEAU D'AIDE - AGENDA > EVENT > EDIT")
									.setDescription("Modifier un événement d'un agenda.\n‎")
									.addFields(
										{ name: "Utilisation", value: "`iut agenda [agendaID] edit [eventID] [actionEdit]`\n‎" },
										{ name: "Arguments", value: "[agendaID] : **integer**\n[eventID] : **integer**\n[actionEdit] : `title` `description` `date`\n‎" }
									);
						}
						break;
					case "remove":
						embed.setTitle("PANNEAU D'AIDE - AGENDA > EVENT > REMOVE")
							.setDescription("Supprimer un événement d'un agenda.\n‎")
							.addFields(
								{ name: "Utilisation", value: "`iut agenda [agendaID] remove [eventID]`\n‎" },
								{ name: "Arguments", value: "[agendaID] : **integer**\n[eventID] : **integer**\n‎" },
								{ name: "Exemple", value: "`iut agenda "+randomInt(1,9)+" remove "+randomInt(1,9)+"`" }
							);
						break;
					case "todo":
						embed.setTitle("PANNEAU D'AIDE - AGENDA > EVENT > TODO")
							.setDescription("Établir un événement d'un agenda comme 'à faire'.\n‎")
							.addFields(
								{ name: "Utilisation", value: "`iut agenda [agendaID] todo [eventID]`\n‎" },
								{ name: "Arguments", value: "[agendaID] : **integer**\n[eventID] : **integer**\n‎" },
								{ name: "Exemple", value: "`iut agenda "+randomInt(1,9)+" todo "+randomInt(1,9)+"`" }
							);
						break;
					case "done":
						embed.setTitle("PANNEAU D'AIDE - AGENDA > EVENT > DONE")
							.setDescription("Établir un événement d'un agenda comme 'terminé'.\n‎")
							.addFields(
								{ name: "Utilisation", value: "`iut agenda [agendaID] done [eventID]`\n‎" },
								{ name: "Arguments", value: "[agendaID] : **integer**\n[eventID] : **integer**\n‎" },
								{ name: "Exemple", value: "`iut agenda "+randomInt(1,9)+" done "+randomInt(1,9)+"`" }
							);
						break;
					default:
						embed.setTitle("PANNEAU D'AIDE - AGENDA")
							.setDescription("Gérer un ou plusieurs agendas.\n‎")
							.addFields(
								{ name: "Utilisations", value: "`iut agenda [actionAgenda]`\n`iut agenda [agendaID] [actionEvent]`\n‎" },
								{ name: "Arguments", value: "[actionAgenda] : `list` `create` `modify` `delete` `invite` `join` `leave`\n[agendaID] : **integer**\n[actionEvent] : `show` `add` `edit` `remove` `done` `todo`\n‎" }
							);
					}
				break;
			default:
				msgReply("cette commande n'existe pas.");
				return;
		}
	}
	msgSend("", embed)
}


async function edtManager(args) {
	if (args.length == 0) { showHelp(["edt"]); return; }
	var user_doc = await User.findOne({ id: message.author.id });
	if (user_doc == null) { user_doc = new User({ id: message.author.id, username: message.author.username }); await user_doc.save(); }
	var group;
	for (i = 0; i < args.length; i++) args[i] = args[i].toLowerCase();
	switch (args[0].toLowerCase()) {
		case "show":
			group = args[1];
			if (group == undefined || !isNaN(group)) {
				group = user_doc.group;
				for (i = 0; i < message.member._roles.length; i++) {
					let role = message.guild.roles.cache.get(message.member._roles[i]).name.toLowerCase();
					if (groups.list.includes(role)) { group = role; break; }
				}
			}
			if (group == undefined) { msgReply("tu n'es assigné à aucun groupe."); return; }
			if (!groups.list.includes(group)) { msgReply("ce groupe n'existe pas."); return; }
			let weeks_ahead = args[args.length-1] !== group && args[args.length-1] != args[0] ? args[args.length-1] : 0;
			if (weeks_ahead != 0 && (isNaN(weeks_ahead) || Number(weeks_ahead) < 0 || Number(weeks_ahead) > 20)) { msgReply("la semaine doit être un nombre compris entre 0 et 20."); return; }

			msgSend("", await getEDT(group, weeks_ahead))
				.then(message => {
					for (var k in arrows) message.react(arrows[k]).catch(err => { console.log(err); });
					lastEDT[message.channel.guild.id] = {};
					lastEDT[message.channel.guild.id].msgId = message.id;
					lastEDT[message.channel.guild.id].weekId = weeks_ahead;
					lastEDT[message.channel.guild.id].groupId = Object.keys(groupids).indexOf(group);
				}).catch(err => { console.log(err); });
			break;
		case "set":
			if (args.length == 1) { showHelp(["edt"].concat(args)); return; }
			group = args[1];
			if (!groups.list.includes(group)) { msgReply("ce groupe n'existe pas."); return; }
			if (user_doc.group === group) { msgReply("tu es déjà dans le groupe `" + group.toUpperCase() + "`."); return; }
			await User.updateOne(user_doc, {group: group});
			await user_doc.save();
			msgReply("tu es désormais dans le groupe `" + group.toUpperCase() + "`.");
			break;
		case "get":
			if (user_doc.group == undefined)
				msgReply("tu n'es assigné à encore aucun groupe.");
			else
				msgReply("tu es dans le groupe `" + user_doc.group.toUpperCase() + "`.");
			break;
		default:
			msgReply("cette commande n'existe pas.");
	}
}
function getEDT(group, weeks_ahead) {
	return new Promise((resolve, reject) => {
		request('https://sedna.univ-fcomte.fr/jsp/custom/ufc/mplanif.jsp?id=' + groupids[group] + "&jours=" + (7*(Number(weeks_ahead)+1)), function (err, res, body) {
			if (err) reject(error);
			let start = body.indexOf('https://');
			let end = body.indexOf('">Affichage pla');
			let url = body.slice(start, end).replace("height=480", "height=960").replace("displayConfId=35", "displayConfId=45").replace("idPianoDay=0%2C1%2C2%2C3%2C4%2C5", "&idPianoDay=0%2C1%2C2%2C3%2C4");
			let week_str = weeks_ahead > 0 ? ` - Semaine +${weeks_ahead}` : "";
			resolve(createEmbed().setTitle(`**Groupe ${group.toUpperCase()}${week_str}**`).setThumbnail(null).setImage(url));
		});
	});
}
bot.on('messageReactionAdd', (messageReaction, user) => {
	if (!user.bot && lastEDT[messageReaction.message.channel.guild.id].msgId.includes(String(messageReaction.message.id)) && Object.values(arrows).includes(messageReaction._emoji.name)) {
		let msgReact = messageReaction.message;
		switch (messageReaction._emoji.name) {
			case arrows.up: lastEDT[msgReact.channel.guild.id].groupId--; break;
			case arrows.down: lastEDT[msgReact.channel.guild.id].groupId++; break;
			case arrows.left: if (lastEDT[msgReact.channel.guild.id].weekId == 0) { return; } lastEDT[msgReact.channel.guild.id].weekId--; break;
			case arrows.right: if (lastEDT[msgReact.channel.guild.id].weekId == 20) { return; } lastEDT[msgReact.channel.guild.id].weekId++; break;
			default: ;
		}
		const userReactions = msgReact.reactions.cache.filter(reaction => reaction.users.cache.has(user.id));
		try { for (const reaction of userReactions.values()) { reaction.users.remove(user.id); }
		} catch (error) { console.error('Failed to remove reactions.'); }
		lastEDT[msgReact.channel.guild.id].groupId = (lastEDT[msgReact.channel.guild.id].groupId + groups.list.length) % groups.list.length;
		lastEDT[msgReact.channel.guild.id].weekId %= 21;
		let group = groups.list[lastEDT[msgReact.channel.guild.id].groupId];
		getEDT(group, lastEDT[msgReact.channel.guild.id].weekId).then(embed => {
			msgReact.edit("", embed);
		});
	}
});


async function agendaManager(args) {
	let i, j, data, inDM;
	var user_doc, agenda_doc, event_doc, user_pop, agenda_pop;
	var embed = createEmbed();
	if (args.length == 0) { showHelp(["agenda"]); return; }
	user_doc = await User.findOne({ id: message.author.id });
	if (user_doc == null) { user_doc = new User({ id: message.author.id, username: message.author.username }); await user_doc.save(); }
	args[0] = args[0].toLowerCase();
	if (args.length == 1 && args[0] !== "list") { showHelp(["agenda"].concat(args)); return; }
	if (args.length == 2 && args[0] === "modify") { showHelp(["agenda"].concat(args)); return; }
	if (args[1] && ["modify","delete","invite","leave"].includes(args[0])) {
		if (isNaN(args[1])) { msgReply("le numéro d'agenda est invalide."); return; }
		user_pop = await User.findOne(user_doc).populate('_agendas');
		agenda_doc = user_pop._agendas[Number(args[1])];
		if (agenda_doc == undefined) { msgReply("tu n'as pas d'agenda avec ce numéro."); return; }
		if (args[0] !== "leave" && String(agenda_doc._users[0]) !== String(user_doc._id)) { msgReply("seul le créateur de cet agenda peut utiliser cette commande."); return; }
	}
	if (args.length == 2 && ["add","edit","remove","done","todo"].includes(args[1])) { showHelp(["agenda"].concat(args.slice(1))); return; }
	if (args.length == 2 && args[0] === "edit") { showHelp(["agenda"].concat(args)); return; }
	if (args[0] && ["show","add","edit","remove","done","todo"].includes(args[1])) {
		if (isNaN(args[0])) { msgReply("le numéro d'agenda est invalide."); return; }
		user_pop = await User.findOne(user_doc).populate('_agendas');
		agenda_doc = user_pop._agendas[Number(args[0])];
		if (agenda_doc == undefined) { msgReply("tu n'as pas d'agenda avec ce numéro."); return; }
		if (!["show","add"].includes(args[1])) {
			if (isNaN(args[2])) { msgReply("le numéro d'événement est invalide."); return; }
			agenda_pop = await Agenda.findOne(agenda_doc).populate('_events');
			event_doc = agenda_pop._events[Number(args[2])];
			if (event_doc == undefined) { msgReply("tu n'as pas d'événement avec ce numéro."); return; }
		}
	}
	switch (args[0]) {
		case 'list':
			inDM = message.channel.type === "dm" ? true : false;
			embed.setTitle("Liste des agendas de " + message.author.username).setDescription("‎");
			user_pop = await User.findOne(user_doc).populate('_agendas');
			if (user_pop != null) {
				for (i = 0; i < user_pop._agendas.length; i++) {
					let users_str = "";
					agenda_pop = await Agenda.findOne({ _id: user_pop._agendas[i]._id }).populate('_users');
					for (j = 0; j < agenda_pop._users.length && j < 5; j++)
						users_str += ", " + agenda_pop._users[j].username;
					users_str = users_str.slice(2);
					if (agenda_pop._users.length > 5) users_str += " [" + (agenda_pop._users.length-5) + "]";
					users_str += "\n‎";
					if (inDM || (!inDM && !user_pop._agendas[i].private))
						embed.addField("[" + i + "] " + user_pop._agendas[i].title, users_str);
				}
			}
			if (embed.fields.length == 0) embed.addField("Tu n'as pas encore d'agenda ou d'agenda public à afficher.", "‎");
			msgSend("", embed);
			break;
		case 'create':
			if (args[1] === '""') { msgReply("le titre ne peut être vide."); return; }
			if (!args[1].startsWith('"')) { msgReply("le titre est invalide."); return; }
			data = { title: args[1] };
			i = 1; while (i < args.length && !args[i].endsWith('"')) { i++; data.title += " " + args[i]; }
			if (i == args.length && args[args.length-1]) { msgReply("le titre est invalide."); return; }
			i += 1; data.title.includes(args[i]) || args[i] == undefined ? data.private = "false" : data.private = args[i];
			if (!["true","false"].includes(data.private)) { msgReply("la visibilité est invalide."); return; }
			try {
				data.private = JSON.parse(data.private);
			} catch (e) { msgReply("la visibilité est invalide."); return; }
			data.title = data.title.replace(/"/gm, '');
			if (data.title.length > 20) { msgReply("le titre est trop long."); return; }
			agenda_doc = new Agenda(data);
			agenda_doc._users.push(user_doc._id);
			await agenda_doc.save();
			user_doc._agendas.push(agenda_doc._id);
			await user_doc.save();
			msgReply("l'agenda `" + data.title + "` a été créé.");
			break;
		case 'modify':
			args = args.slice(2);
			if (args.length == 1) { showHelp(["agenda"].concat(args)); return; }
			switch (args[0]) {
				case "title":
					if (args[1] === '""') { msgReply("le titre ne peut être vide."); return; }
					if (!args[1].startsWith('"')) { msgReply("le titre est invalide."); return; }
					data = { title: args[1] };
					i = 1; while (i < args.length && !args[i].endsWith('"')) { i++; data.title += " " + args[i]; }
					if (i == args.length && args[args.length-1]) { msgReply("le titre est invalide."); return; }
					if (data.title.length > 20) { msgReply("le titre est trop long."); return; }
					data.title = data.title.replace(/"/gm, '');
					agenda_doc.title = data.title;
					await agenda_doc.save();
					break;
				case "private":
					if (args[args.length-1].endsWith('"')) { msgReply("la visibilité ne peut être vide."); return; }
					if (!["true","false"].includes(args[args.length-1])) { msgReply("la visibilité est invalide."); return; }
					if (i == args.length && args[args.length-1]) { msgReply("le titre est invalide."); return; }
					agenda_doc.private = args[1];
					await agenda_doc.save();
					break;
				default:
					showHelp(["agenda","modify"]);
					return;
			}
			msgReply("l'agenda `" + agenda_doc.title + "` a été modifié.");
			break;
		case 'delete':
			i = 0; while (i < user_doc._agendas.length && user_doc._agendas[i]._id === agenda_doc._id) { i++; }
			if (i == user_doc._agendas.length) { msgReply("tu ne peux pas supprimer cet agenda."); return; }
			agenda_pop = await Agenda.findOne(agenda_doc).populate('_users');
			await Agenda.deleteOne(agenda_doc);
			for (i = 0; i < agenda_pop._users.length; i++) {
				agenda_pop._users[i]._agendas.splice(agenda_pop._users[i]._agendas.indexOf(agenda_doc._id), 1);
				await agenda_pop._users[i].save();
			}
			msgReply("l'agenda `" + agenda_doc.title + "` a été supprimé.");
			break;
		case 'invite':
			if (agenda_doc.invite == null) {
				agenda_doc.invite = randomId();
				await agenda_doc.save();
			}
			dmSend("L'invitation pour l'agenda `" + agenda_doc.title + "` est `" + agenda_doc.invite + "`.");
			break;
		case 'join':
			agenda_pop = await Agenda.findOne({invite: args[1]}).populate('_agendas');
			if (agenda_pop == null) { msgReply("l'invitation est incorrecte ou a déjà été utilisée."); return; }
			i = 0; while (i < user_doc._agendas.length && String(user_doc._agendas[i]._id) != String(agenda_pop._id)) { i++; }
			if (i != user_doc._agendas.length) { msgReply("tu as déjà rejoint cet agenda."); return; }
			agenda_pop._users.push(user_doc._id);
			await agenda_pop.save();
			user_doc._agendas.push(agenda_pop._id);
			await user_doc.save();
			msgReply("tu viens de rejoindre l'agenda `" + agenda_pop.title + "`.");
			break;
		case 'leave':
			i = 0; while (i < user_doc._agendas.length && user_doc._agendas[i]._id === agenda_doc._id) { i++; }
			if (i == user_doc._agendas.length) { msgReply("tu n'as pas d'agenda avec cet identifiant."); return; }
			if (String(user_doc._id) == String(agenda_doc._users[0]._id)) { msgReply("tu ne peux pas quitter ton propre agenda."); return; }
			agenda_doc._users.splice(agenda_doc._users.indexOf(user_doc._id), 1);
			agenda_doc.invite = null;
			await agenda_doc.save();
			user_doc._agendas.splice(user_doc._agendas.indexOf(agenda_doc._id), 1);
			await user_doc.save();
			msgReply("tu as quitté l'agenda `" + agenda_doc.title + "`.");
			break;
	}
	switch (args[1]) {
		case 'show':
			data = {};
			if (args[2] && ["todo","done"].includes(args[2])) data.state = args[2];
			inDM = message.channel.type === "dm" ? true : false;
			embed.setTitle("Liste des événements de l'agenda \"" + agenda_doc.title + "\" de " + message.author.username).setDescription("‎");
			agenda_pop = await Agenda.findOne(agenda_doc).populate('_events');
			if (agenda_pop != null) {
				for (i = 0; i < agenda_pop._events.length; i++) {
					event_doc = agenda_pop._events[i];
					let state = event_doc.state === "todo" ? ' | :red_circle:' : ' | :green_circle:';
					let date = event_doc.date != null ? " | "+("0"+event_doc.date.getDate()).slice(-2)+"/"+("0"+(event_doc.date.getMonth()+1)).slice(-2)+"/"+event_doc.date.getFullYear() : "";
					if (event_doc.state == data.state || !["todo","done"].includes(args[2]))
						embed.addField("[" + i + "] " + event_doc.title + date + state, event_doc.description + "\n‎");
				}
			}
			if (embed.fields.length == 0) embed.addField("Il n'y a pas encore d'événement dans cet agenda.", "\n‎");
			if (agenda_doc.private)
				dmSend("", embed);
			else
				msgSend("", embed);
			break;
		case 'add':
			args = args.slice(1);
			msgReply("le titre ne peut être vide.");
			if (args[1] === '""') { msgReply("le titre ne peut être vide."); return; }
			if (!args[1].startsWith('"')) { msgReply("le titre est invalide."); return; }
			data = { title: args[1] };
			i = 1; while (i < args.length && !args[i].endsWith('"')) { i++; data.title += " " + args[i]; }
			if (i == args.length && args[args.length-1]) { msgReply("le titre est invalide."); return; }
			if (data.title.length > 20) { msgReply("le titre est trop long."); return; }
			data.title = data.title.replace(/"/gm, '');
			i += 1;
			data.description = args[i];
			while (i < args.length && !args[i].endsWith('"')) { i++; data.description += " " + args[i]; }
			if (i == args.length && args[args.length-1]) { msgReply("la description est invalide."); return; }
			if (data.description.length > 300) { msgReply("la description est trop longue."); return; }
			data.description = data.description.replace(/"/gm, '');
			i += 1; data.date = args[i];
			if (data.date.endsWith('"')) { msgReply("la date doit être indiquée."); return; }
			if (data.date !== "null") {
				if (args[args.length-1].length != 10) { msgReply("la date est invalide."); return; }
				data.date = new Date((args[args.length-1]).split('/').reverse().join('-'));
				if (isNaN(data.date) || data.date.length) { msgReply("la date est invalide."); return; }
			} else data.date = null;
			data.state = 'todo';
			data._agenda = agenda_doc._id;
			event_doc = new Event(data);
			await event_doc.save();
			agenda_doc._events.push(event_doc._id);
			await agenda_doc.save();
			msgReply("l'événement `" + event_doc.title + "` a été ajouté dans l'agenda `" + agenda_doc.title + "`.");
			break;
		case 'edit':
			args = args.slice(3);
			if (args.length == 1) { showHelp(["agenda"].concat(args)); return; }
			let prev_title = event_doc.title;
			switch (args[0]) {
				case "title":
					if (args[1] === '""') { msgReply("le titre ne peut être vide."); return; }
					if (!args[1].startsWith('"')) { msgReply("le titre est invalide."); return; }
					data = { title: args[1] };
					i = 1; while (i < args.length && !args[i].endsWith('"')) { i++; data.title += " " + args[i]; }
					if (i == args.length && args[args.length-1]) { msgReply("le titre est invalide."); return; }
					if (data.title.length > 20) { msgReply("le titre est trop long."); return; }
					data.title = data.title.replace(/"/gm, '');
					event_doc.title = data.title;
					await event_doc.save();
					break;
				case "description":
					if (!args[1].startsWith('"')) { msgReply("la description est invalide."); return; }
					data = { description: args[1] };
					i = 1; while (i < args.length && !args[i].endsWith('"')) { i++; data.description += " " + args[i]; }
					if (i == args.length && args[args.length-1]) { msgReply("la description est invalide."); return; }
					if (data.description.length > 300) { msgReply("la description est trop longue."); return; }
					data.description = data.description.replace(/"/gm, '');
					event_doc.description = data.description;
					await event_doc.save();
					break;
				case "date":
					data = { date: null };
					if (args[1] !== "null") {
						if (args[1].length != 10) { msgReply("la date est invalide."); return; }
						data.date = new Date((args[args.length-1]).split('/').reverse().join('-'));
						if (isNaN(data.date) || data.date.length) { msgReply("la date est invalide."); return; }
					}
					event_doc.date = data.date;
					await event_doc.save();
					break;
				default:
					showHelp(["agenda","edit"]);
					return;
			}
			msgReply("l'événement `" + prev_title + "` a bien été édité.");
			break;
		case 'remove':
			await Event.deleteOne(event_doc);
			agenda_doc._events.splice(agenda_doc._events.indexOf(event_doc._id), 1);
			await agenda_doc.save();
			msgReply("l'événement `" + event_doc.title + "` a été supprimé.");
			break;
		case 'todo':
		case 'done':
			event_doc.state = args[1];
			await event_doc.save();
			msgReply("l'événement `" + event_doc.title + "` a été définit comme `" + args[1] + "`");
			break;
	}
}


function msgSend(content){
	return msgSend(content, null);
}
async function msgSend(content, attachment) {
	if (message.channel.type === "dm")
		return dmSend(content, attachment)
	else {
		return await message.channel
			.send(content, attachment)
			.catch(err => {
				console.log(err);
			});
	}
}
async function msgReply(content){
	if (message.channel.type === "dm")
		return dmSend(content, null);
	else {
		return await message
			.reply(content)
			.catch(err => {
				console.log(err);
			});
	}
}
async function dmSend(content, attachment) {
	return await message.author
		.send(content.charAt(0).toUpperCase()+content.slice(1), attachment)
		.catch(err => {
			console.log(err);
		});
}
function createEmbed() {
	return new Discord.MessageEmbed().setColor(secrets.embedColor).setThumbnail(bot.user.displayAvatarURL()).setURL("https://github.com/Dastan21/IUTBM-Info").setFooter(message.author.tag, message.author.displayAvatarURL({ format: 'png', dynamic: true}));
}
function randomInt(min, max) {
	return Math.round((Math.random()*Math.floor(max))+Math.floor(min));
}
function randomGroupe() {
	return groups.list[randomInt(0,groups.list.length-1)].toUpperCase();
}
function randomId() {
	let result = "";
	const chars = "abcdefghijklmnopqrstuvwxyz";
	for (var i = 0; i < 5; i++) {
		result += chars.charAt(Math.floor(Math.random()*chars.length));
   }
   return result;
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


bot.login(secrets.token);
