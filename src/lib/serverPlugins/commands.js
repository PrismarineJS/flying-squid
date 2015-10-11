
module.exports = inject;

function inject(serv, settings) {
	serv.commands = [];
	serv.commandSections = [];

	function newCommand(cmd, regex, opt, func) {
		if (!func) {
			func = opt;
			opt = {};
		}

		serv.commands[cmd] = {
			name: cmd,
			shortname: cmd.split(' ')[cmd.split(' ').length - 1], // Only the last word (i.e. ignore section)
			func: func,
			regex: regex,
			usage: opt.usage || 'Incorrect usage',
			help: opt.help || 'Help unknown',
			playerOnly: opt.playerOnly || false
		}
	}
	serv.newCommand = newCommand;

	function runCommand(text, player) {
		var fromServer = !player;
		var cmd = text.split(' ');

		var section = '';
		var sectionLength = 0;

		while (serv.commandSections[(section+' '+cmd[sectionLength]).trim()]) { // Find the deepest section
			section += ' ' + cmd[sectionLength];
			sectionLength++;
		}
		section = section.trim();
		var sectionExtra = section == '' ? '' : section + ' ';

		
		if (!cmd[sectionLength]) {
			return runCommand(text.trim() + ' help', player);
		}

		var command = serv.commands[sectionExtra+cmd[sectionLength]];
		if (!command && cmd[sectionLength] == 'help') {
			command = {
				name: sectionExtra + 'help',
				shortname: 'help',
				func: function(page) {
					return sectionHelp(section, page);
				},
				regex: '(\\d*)',
				usage: '/' + sectionExtra + 'help [n]',
				help: '',
				playerOnly: false
			}
		}

		if (!command) { // If section + cmd doesn't exist...
			return {
				success: false,
				message: section == '' ? cmd[sectionLength] + ' is not a command!' : '"' + cmd[sectionLength] + '" is not a command of "' + section + '"!'
			};
		} else if (command.playerOnly && fromServer) {
			return {
				success: false,
				message: 'This command is for players only!'
			}
		}

		var reg = new RegExp(('^' + command.name + ' ' + command.regex).trim()); // MC is case sensitive I guess
		// And apparently it's fine with anything extra added (hence no $)
		var result = text.match(reg) || (text + ' ').match(reg);

		if (!result && cmd[sectionLength+1] != 'help') {
			return {
				success: false,
				message: 'Usage: ' + command.usage
			};
		} else if (!result) {
			return {
				success: true,
				message: command.help
			}
		}

		if (result.length > 1) {
			result.splice(0, 1); // I think this works. e.g. 'abcdefg'.match(/(c|d)(e|f)/) => ["de", "d", "e"]
		}

		var cmdresult = command.func.apply(player, result);
		if (typeof cmdresult == 'boolean') {
			return {
				success: cmdresult,
				message: 'Command was ' + (cmdresult ? 'successful' : 'unsuccessful')
			}
		} else if (typeof cmdresult == 'string') {
			return {
				success: true,
				message: cmdresult
			}
		} else if (typeof cmdresult == 'object') {
			return cmdresult
		}		
	}
	serv.runCommand = runCommand;

	var HELP_PAGE_LENGTH = 7;

	function newSection(name, opt) {
		if (!name) return new Error('You gotta have a name for serv.newSection(). srsly.')
		if (!opt) opt = {};
		opt.name = name;
		opt.shortname = name.split(' ')[name.split(' ').length - 1], // Only the last word (i.e. ignore section)
		opt.help = opt.help || name;
		serv.commandSections[name] = opt;
	}
	serv.newSection = newSection;

	function sectionHelp(section, page) {
		if (!serv.commandSections[section] && section != '') {
			return {
				success: false,
				message: 'Cannot find command "' + section + '"'
			};
		}
		page = page || 0;

		var sectionExtra = '';
		if (section != '') sectionExtra = section.trim() + ' ';

		var list = [];

		for (var s in serv.commandSections) {
			var result = s.match(new RegExp('^' + sectionExtra + '\\w+$'));
			if (result) list.push(serv.commandSections[s]);
		}

		for (var c in serv.commands) {
						var result = c.match(new RegExp('^' + sectionExtra + '\\w+$'));
						if (result) list.push(serv.commands[c]);
		}

		if (list.length >= HELP_PAGE_LENGTH * (page + 1)) {
			return {
				success: false,
				message: 'There are only ' + Math.ceil(list.length/HELP_PAGE_LENGTH) + ' pages of help!'
			}
		}
		
		list.sort(function(a,b) {
			return a.shortname > b.shortname;
		});

		var str = '== ' + (serv.commandSections[section] ? serv.commandSections[section].help : 'Help') + ' ==';

		for (var i = page*HELP_PAGE_LENGTH; i < Math.min((page + 1)*HELP_PAGE_LENGTH , list.length); i++) {
			str += '\n' + list[i].shortname + ': ' + list[i].help;
		}

		str += '\nPage ' + (parseInt(page) + 1) + ' of ' + Math.ceil(list.length/HELP_PAGE_LENGTH) + '. Use /' + sectionExtra + 'help [n]';

		
		return {
			success: true,
			message: str
		}
	}
	serv.sectionHelp = sectionHelp;

	addCommands(serv);
}

/*

/help shows the first 7 results (alphabetical order)
/help [n] for more commands
"/<command> help [n]" for help on the command
"/<section> <section> <section> <command> help [n]" It can go as deep as you want

Usage automatically detected (based off of your regex)
Look at we example below

*/

function addCommands(serv) {

	serv.newCommand('ping', '(\\d+)', {
		usage: '/ping <number>',
		help: 'Get ponged with your number plus one'
	}, function(num) {
		return 'pong ' + (parseInt(num) + 1);
	});

	serv.newSection('we', {
		help: 'World Edit Commands'
	});

	serv.newCommand('we testing', '', {
		usage: '/we testing',
		help: 'Get a test section command'
	}, function() {
		return 'WE Test!'
	});

	serv.newCommand('we testtwo', '(\\w+) (\\w+)', {
		usage: '/we testtwo <word> <word>',
		help: 'Combine two amazing words!'
	}, function(word1, word2) {
		return 'Combined is..... ' + word1 + word2 + '!!!';
	})
}