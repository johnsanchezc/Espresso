/*!
 * subcommand parser
 * @author pfleidi
 *
 * command line parser inspired by https://github.com/substack/node-optimist
 */

// TODO: error handling
// TODO: implement modules

var Util = require('util');
var spaces = '                           ';

var create = exports.create = function (superCommand, command) {

  command.options.help = {
    'description': 'Show help for command ' + command.name,
    'default': false
  };

  /**
   * Parse commandline arguments into an object
   *
   * @option args {Array}
   * @return {Object}
   * @API private
   */ 
  function parseArgs(args) {
    var options = {};
    var key;

    for (var i = 0; i < args.length; i += 1) {
      var arg = args[i];

      // --command=value
      if (arg.match(/^--[\w]+=/)) {
        var m = arg.match(/^--([^=]+)=([\w]*)/);
        options[m[1]] = m[2];
      }

      // --command value
      else if (arg.match(/^--[\w]+/)) {
        key = arg.match(/^--([\w]+)/)[1];
        var nextLong = args[i + 1];
        if (nextLong && !nextLong.match(/^-/)) {
          options[key] = nextLong;
          i += 1;
        } else {
          options[key] = true;
        }
      }

      // -casdf value
      else if (arg.match(/^-[^\-]+/)) {

        // -asdf
        arg.slice(1, -1).split('').forEach(function (letter) {
            options[letter] = true;
          });

        key = arg.slice(-1)[0];
        var nextShort = args[i + 1];

        // -f value
        if (nextShort && !nextShort.match(/^-/)) {
          options[key] = nextShort;
          i += 1;
        } else {
          options[key] = true;
        }
      } 
    }

    return options;
  }

  function genOptions(args) {
    var parsed = parseArgs(args);
    var cmdParams = command.options;
    var options = {};

    Object.keys(cmdParams).forEach(function (option) {
        if (parsed[option]) {
          options[option] = parsed[option];
        } else if (parsed[option[0]]) {
          options[option] = parsed[option[0]];
        } else if (typeof cmdParams[option].default !== 'undefined') {
          options[option] = cmdParams[option].default;
        } else if (cmdParams[option].required) {
          throw new Error('Missing option: ' + option);
        }
      });

    return options;
  }

  function showHelp() {
    var cmdParams = command.options;

    Util.puts('Usage: ' + superCommand + ' ' + command.name + ' [<options>]');
    Util.puts('Available options:');

    Object.keys(cmdParams).forEach(function (option) {
        var opt = cmdParams[option];
        var options =  '-' + option[0] + ', --' + option;
        var firstSpace, secondSpace, def = '';

        if (opt.hasargument) {
          options += '=' + option.toUpperCase();
        }

        firstSpace = spaces.slice(options.length);
        secondSpace = spaces.slice(opt.description.length);

        if (typeof opt.default !== 'undefined') {
          def = secondSpace + ' Default: ' + opt.default;
        }

        Util.puts('   ' + options + firstSpace + ' ' + opt.description + def);
      });
  }

  function dispatch(args) {
    try {
      var options = genOptions(args, command.options);
      if (options.help) {
        showHelp();
      } else {
        command.run(options);
      }
    } catch (ex) {
      Util.puts(ex.message);
      Util.puts(ex.stack);
      showHelp();
    }
  }

  return {
    dispatch: dispatch,
    description: command.description,
    showHelp: showHelp
  };

};

