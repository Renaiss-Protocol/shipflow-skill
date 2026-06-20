#!/usr/bin/env node
import { createRequire } from "node:module";
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: __accessProp.bind(mod, key),
        enumerable: true
      });
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// node_modules/commander/lib/error.js
var require_error = __commonJS((exports) => {
  class CommanderError extends Error {
    constructor(exitCode, code, message) {
      super(message);
      Error.captureStackTrace(this, this.constructor);
      this.name = this.constructor.name;
      this.code = code;
      this.exitCode = exitCode;
      this.nestedError = undefined;
    }
  }

  class InvalidArgumentError extends CommanderError {
    constructor(message) {
      super(1, "commander.invalidArgument", message);
      Error.captureStackTrace(this, this.constructor);
      this.name = this.constructor.name;
    }
  }
  exports.CommanderError = CommanderError;
  exports.InvalidArgumentError = InvalidArgumentError;
});

// node_modules/commander/lib/argument.js
var require_argument = __commonJS((exports) => {
  var { InvalidArgumentError } = require_error();

  class Argument {
    constructor(name, description) {
      this.description = description || "";
      this.variadic = false;
      this.parseArg = undefined;
      this.defaultValue = undefined;
      this.defaultValueDescription = undefined;
      this.argChoices = undefined;
      switch (name[0]) {
        case "<":
          this.required = true;
          this._name = name.slice(1, -1);
          break;
        case "[":
          this.required = false;
          this._name = name.slice(1, -1);
          break;
        default:
          this.required = true;
          this._name = name;
          break;
      }
      if (this._name.length > 3 && this._name.slice(-3) === "...") {
        this.variadic = true;
        this._name = this._name.slice(0, -3);
      }
    }
    name() {
      return this._name;
    }
    _concatValue(value, previous) {
      if (previous === this.defaultValue || !Array.isArray(previous)) {
        return [value];
      }
      return previous.concat(value);
    }
    default(value, description) {
      this.defaultValue = value;
      this.defaultValueDescription = description;
      return this;
    }
    argParser(fn) {
      this.parseArg = fn;
      return this;
    }
    choices(values) {
      this.argChoices = values.slice();
      this.parseArg = (arg, previous) => {
        if (!this.argChoices.includes(arg)) {
          throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(", ")}.`);
        }
        if (this.variadic) {
          return this._concatValue(arg, previous);
        }
        return arg;
      };
      return this;
    }
    argRequired() {
      this.required = true;
      return this;
    }
    argOptional() {
      this.required = false;
      return this;
    }
  }
  function humanReadableArgName(arg) {
    const nameOutput = arg.name() + (arg.variadic === true ? "..." : "");
    return arg.required ? "<" + nameOutput + ">" : "[" + nameOutput + "]";
  }
  exports.Argument = Argument;
  exports.humanReadableArgName = humanReadableArgName;
});

// node_modules/commander/lib/help.js
var require_help = __commonJS((exports) => {
  var { humanReadableArgName } = require_argument();

  class Help {
    constructor() {
      this.helpWidth = undefined;
      this.minWidthToWrap = 40;
      this.sortSubcommands = false;
      this.sortOptions = false;
      this.showGlobalOptions = false;
    }
    prepareContext(contextOptions) {
      this.helpWidth = this.helpWidth ?? contextOptions.helpWidth ?? 80;
    }
    visibleCommands(cmd) {
      const visibleCommands = cmd.commands.filter((cmd2) => !cmd2._hidden);
      const helpCommand = cmd._getHelpCommand();
      if (helpCommand && !helpCommand._hidden) {
        visibleCommands.push(helpCommand);
      }
      if (this.sortSubcommands) {
        visibleCommands.sort((a, b) => {
          return a.name().localeCompare(b.name());
        });
      }
      return visibleCommands;
    }
    compareOptions(a, b) {
      const getSortKey = (option) => {
        return option.short ? option.short.replace(/^-/, "") : option.long.replace(/^--/, "");
      };
      return getSortKey(a).localeCompare(getSortKey(b));
    }
    visibleOptions(cmd) {
      const visibleOptions = cmd.options.filter((option) => !option.hidden);
      const helpOption = cmd._getHelpOption();
      if (helpOption && !helpOption.hidden) {
        const removeShort = helpOption.short && cmd._findOption(helpOption.short);
        const removeLong = helpOption.long && cmd._findOption(helpOption.long);
        if (!removeShort && !removeLong) {
          visibleOptions.push(helpOption);
        } else if (helpOption.long && !removeLong) {
          visibleOptions.push(cmd.createOption(helpOption.long, helpOption.description));
        } else if (helpOption.short && !removeShort) {
          visibleOptions.push(cmd.createOption(helpOption.short, helpOption.description));
        }
      }
      if (this.sortOptions) {
        visibleOptions.sort(this.compareOptions);
      }
      return visibleOptions;
    }
    visibleGlobalOptions(cmd) {
      if (!this.showGlobalOptions)
        return [];
      const globalOptions = [];
      for (let ancestorCmd = cmd.parent;ancestorCmd; ancestorCmd = ancestorCmd.parent) {
        const visibleOptions = ancestorCmd.options.filter((option) => !option.hidden);
        globalOptions.push(...visibleOptions);
      }
      if (this.sortOptions) {
        globalOptions.sort(this.compareOptions);
      }
      return globalOptions;
    }
    visibleArguments(cmd) {
      if (cmd._argsDescription) {
        cmd.registeredArguments.forEach((argument) => {
          argument.description = argument.description || cmd._argsDescription[argument.name()] || "";
        });
      }
      if (cmd.registeredArguments.find((argument) => argument.description)) {
        return cmd.registeredArguments;
      }
      return [];
    }
    subcommandTerm(cmd) {
      const args = cmd.registeredArguments.map((arg) => humanReadableArgName(arg)).join(" ");
      return cmd._name + (cmd._aliases[0] ? "|" + cmd._aliases[0] : "") + (cmd.options.length ? " [options]" : "") + (args ? " " + args : "");
    }
    optionTerm(option) {
      return option.flags;
    }
    argumentTerm(argument) {
      return argument.name();
    }
    longestSubcommandTermLength(cmd, helper) {
      return helper.visibleCommands(cmd).reduce((max, command) => {
        return Math.max(max, this.displayWidth(helper.styleSubcommandTerm(helper.subcommandTerm(command))));
      }, 0);
    }
    longestOptionTermLength(cmd, helper) {
      return helper.visibleOptions(cmd).reduce((max, option) => {
        return Math.max(max, this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option))));
      }, 0);
    }
    longestGlobalOptionTermLength(cmd, helper) {
      return helper.visibleGlobalOptions(cmd).reduce((max, option) => {
        return Math.max(max, this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option))));
      }, 0);
    }
    longestArgumentTermLength(cmd, helper) {
      return helper.visibleArguments(cmd).reduce((max, argument) => {
        return Math.max(max, this.displayWidth(helper.styleArgumentTerm(helper.argumentTerm(argument))));
      }, 0);
    }
    commandUsage(cmd) {
      let cmdName = cmd._name;
      if (cmd._aliases[0]) {
        cmdName = cmdName + "|" + cmd._aliases[0];
      }
      let ancestorCmdNames = "";
      for (let ancestorCmd = cmd.parent;ancestorCmd; ancestorCmd = ancestorCmd.parent) {
        ancestorCmdNames = ancestorCmd.name() + " " + ancestorCmdNames;
      }
      return ancestorCmdNames + cmdName + " " + cmd.usage();
    }
    commandDescription(cmd) {
      return cmd.description();
    }
    subcommandDescription(cmd) {
      return cmd.summary() || cmd.description();
    }
    optionDescription(option) {
      const extraInfo = [];
      if (option.argChoices) {
        extraInfo.push(`choices: ${option.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`);
      }
      if (option.defaultValue !== undefined) {
        const showDefault = option.required || option.optional || option.isBoolean() && typeof option.defaultValue === "boolean";
        if (showDefault) {
          extraInfo.push(`default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`);
        }
      }
      if (option.presetArg !== undefined && option.optional) {
        extraInfo.push(`preset: ${JSON.stringify(option.presetArg)}`);
      }
      if (option.envVar !== undefined) {
        extraInfo.push(`env: ${option.envVar}`);
      }
      if (extraInfo.length > 0) {
        return `${option.description} (${extraInfo.join(", ")})`;
      }
      return option.description;
    }
    argumentDescription(argument) {
      const extraInfo = [];
      if (argument.argChoices) {
        extraInfo.push(`choices: ${argument.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`);
      }
      if (argument.defaultValue !== undefined) {
        extraInfo.push(`default: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`);
      }
      if (extraInfo.length > 0) {
        const extraDescription = `(${extraInfo.join(", ")})`;
        if (argument.description) {
          return `${argument.description} ${extraDescription}`;
        }
        return extraDescription;
      }
      return argument.description;
    }
    formatHelp(cmd, helper) {
      const termWidth = helper.padWidth(cmd, helper);
      const helpWidth = helper.helpWidth ?? 80;
      function callFormatItem(term, description) {
        return helper.formatItem(term, termWidth, description, helper);
      }
      let output = [
        `${helper.styleTitle("Usage:")} ${helper.styleUsage(helper.commandUsage(cmd))}`,
        ""
      ];
      const commandDescription = helper.commandDescription(cmd);
      if (commandDescription.length > 0) {
        output = output.concat([
          helper.boxWrap(helper.styleCommandDescription(commandDescription), helpWidth),
          ""
        ]);
      }
      const argumentList = helper.visibleArguments(cmd).map((argument) => {
        return callFormatItem(helper.styleArgumentTerm(helper.argumentTerm(argument)), helper.styleArgumentDescription(helper.argumentDescription(argument)));
      });
      if (argumentList.length > 0) {
        output = output.concat([
          helper.styleTitle("Arguments:"),
          ...argumentList,
          ""
        ]);
      }
      const optionList = helper.visibleOptions(cmd).map((option) => {
        return callFormatItem(helper.styleOptionTerm(helper.optionTerm(option)), helper.styleOptionDescription(helper.optionDescription(option)));
      });
      if (optionList.length > 0) {
        output = output.concat([
          helper.styleTitle("Options:"),
          ...optionList,
          ""
        ]);
      }
      if (helper.showGlobalOptions) {
        const globalOptionList = helper.visibleGlobalOptions(cmd).map((option) => {
          return callFormatItem(helper.styleOptionTerm(helper.optionTerm(option)), helper.styleOptionDescription(helper.optionDescription(option)));
        });
        if (globalOptionList.length > 0) {
          output = output.concat([
            helper.styleTitle("Global Options:"),
            ...globalOptionList,
            ""
          ]);
        }
      }
      const commandList = helper.visibleCommands(cmd).map((cmd2) => {
        return callFormatItem(helper.styleSubcommandTerm(helper.subcommandTerm(cmd2)), helper.styleSubcommandDescription(helper.subcommandDescription(cmd2)));
      });
      if (commandList.length > 0) {
        output = output.concat([
          helper.styleTitle("Commands:"),
          ...commandList,
          ""
        ]);
      }
      return output.join(`
`);
    }
    displayWidth(str) {
      return stripColor(str).length;
    }
    styleTitle(str) {
      return str;
    }
    styleUsage(str) {
      return str.split(" ").map((word) => {
        if (word === "[options]")
          return this.styleOptionText(word);
        if (word === "[command]")
          return this.styleSubcommandText(word);
        if (word[0] === "[" || word[0] === "<")
          return this.styleArgumentText(word);
        return this.styleCommandText(word);
      }).join(" ");
    }
    styleCommandDescription(str) {
      return this.styleDescriptionText(str);
    }
    styleOptionDescription(str) {
      return this.styleDescriptionText(str);
    }
    styleSubcommandDescription(str) {
      return this.styleDescriptionText(str);
    }
    styleArgumentDescription(str) {
      return this.styleDescriptionText(str);
    }
    styleDescriptionText(str) {
      return str;
    }
    styleOptionTerm(str) {
      return this.styleOptionText(str);
    }
    styleSubcommandTerm(str) {
      return str.split(" ").map((word) => {
        if (word === "[options]")
          return this.styleOptionText(word);
        if (word[0] === "[" || word[0] === "<")
          return this.styleArgumentText(word);
        return this.styleSubcommandText(word);
      }).join(" ");
    }
    styleArgumentTerm(str) {
      return this.styleArgumentText(str);
    }
    styleOptionText(str) {
      return str;
    }
    styleArgumentText(str) {
      return str;
    }
    styleSubcommandText(str) {
      return str;
    }
    styleCommandText(str) {
      return str;
    }
    padWidth(cmd, helper) {
      return Math.max(helper.longestOptionTermLength(cmd, helper), helper.longestGlobalOptionTermLength(cmd, helper), helper.longestSubcommandTermLength(cmd, helper), helper.longestArgumentTermLength(cmd, helper));
    }
    preformatted(str) {
      return /\n[^\S\r\n]/.test(str);
    }
    formatItem(term, termWidth, description, helper) {
      const itemIndent = 2;
      const itemIndentStr = " ".repeat(itemIndent);
      if (!description)
        return itemIndentStr + term;
      const paddedTerm = term.padEnd(termWidth + term.length - helper.displayWidth(term));
      const spacerWidth = 2;
      const helpWidth = this.helpWidth ?? 80;
      const remainingWidth = helpWidth - termWidth - spacerWidth - itemIndent;
      let formattedDescription;
      if (remainingWidth < this.minWidthToWrap || helper.preformatted(description)) {
        formattedDescription = description;
      } else {
        const wrappedDescription = helper.boxWrap(description, remainingWidth);
        formattedDescription = wrappedDescription.replace(/\n/g, `
` + " ".repeat(termWidth + spacerWidth));
      }
      return itemIndentStr + paddedTerm + " ".repeat(spacerWidth) + formattedDescription.replace(/\n/g, `
${itemIndentStr}`);
    }
    boxWrap(str, width) {
      if (width < this.minWidthToWrap)
        return str;
      const rawLines = str.split(/\r\n|\n/);
      const chunkPattern = /[\s]*[^\s]+/g;
      const wrappedLines = [];
      rawLines.forEach((line) => {
        const chunks = line.match(chunkPattern);
        if (chunks === null) {
          wrappedLines.push("");
          return;
        }
        let sumChunks = [chunks.shift()];
        let sumWidth = this.displayWidth(sumChunks[0]);
        chunks.forEach((chunk) => {
          const visibleWidth = this.displayWidth(chunk);
          if (sumWidth + visibleWidth <= width) {
            sumChunks.push(chunk);
            sumWidth += visibleWidth;
            return;
          }
          wrappedLines.push(sumChunks.join(""));
          const nextChunk = chunk.trimStart();
          sumChunks = [nextChunk];
          sumWidth = this.displayWidth(nextChunk);
        });
        wrappedLines.push(sumChunks.join(""));
      });
      return wrappedLines.join(`
`);
    }
  }
  function stripColor(str) {
    const sgrPattern = /\x1b\[\d*(;\d*)*m/g;
    return str.replace(sgrPattern, "");
  }
  exports.Help = Help;
  exports.stripColor = stripColor;
});

// node_modules/commander/lib/option.js
var require_option = __commonJS((exports) => {
  var { InvalidArgumentError } = require_error();

  class Option {
    constructor(flags, description) {
      this.flags = flags;
      this.description = description || "";
      this.required = flags.includes("<");
      this.optional = flags.includes("[");
      this.variadic = /\w\.\.\.[>\]]$/.test(flags);
      this.mandatory = false;
      const optionFlags = splitOptionFlags(flags);
      this.short = optionFlags.shortFlag;
      this.long = optionFlags.longFlag;
      this.negate = false;
      if (this.long) {
        this.negate = this.long.startsWith("--no-");
      }
      this.defaultValue = undefined;
      this.defaultValueDescription = undefined;
      this.presetArg = undefined;
      this.envVar = undefined;
      this.parseArg = undefined;
      this.hidden = false;
      this.argChoices = undefined;
      this.conflictsWith = [];
      this.implied = undefined;
    }
    default(value, description) {
      this.defaultValue = value;
      this.defaultValueDescription = description;
      return this;
    }
    preset(arg) {
      this.presetArg = arg;
      return this;
    }
    conflicts(names) {
      this.conflictsWith = this.conflictsWith.concat(names);
      return this;
    }
    implies(impliedOptionValues) {
      let newImplied = impliedOptionValues;
      if (typeof impliedOptionValues === "string") {
        newImplied = { [impliedOptionValues]: true };
      }
      this.implied = Object.assign(this.implied || {}, newImplied);
      return this;
    }
    env(name) {
      this.envVar = name;
      return this;
    }
    argParser(fn) {
      this.parseArg = fn;
      return this;
    }
    makeOptionMandatory(mandatory = true) {
      this.mandatory = !!mandatory;
      return this;
    }
    hideHelp(hide = true) {
      this.hidden = !!hide;
      return this;
    }
    _concatValue(value, previous) {
      if (previous === this.defaultValue || !Array.isArray(previous)) {
        return [value];
      }
      return previous.concat(value);
    }
    choices(values) {
      this.argChoices = values.slice();
      this.parseArg = (arg, previous) => {
        if (!this.argChoices.includes(arg)) {
          throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(", ")}.`);
        }
        if (this.variadic) {
          return this._concatValue(arg, previous);
        }
        return arg;
      };
      return this;
    }
    name() {
      if (this.long) {
        return this.long.replace(/^--/, "");
      }
      return this.short.replace(/^-/, "");
    }
    attributeName() {
      if (this.negate) {
        return camelcase(this.name().replace(/^no-/, ""));
      }
      return camelcase(this.name());
    }
    is(arg) {
      return this.short === arg || this.long === arg;
    }
    isBoolean() {
      return !this.required && !this.optional && !this.negate;
    }
  }

  class DualOptions {
    constructor(options) {
      this.positiveOptions = new Map;
      this.negativeOptions = new Map;
      this.dualOptions = new Set;
      options.forEach((option) => {
        if (option.negate) {
          this.negativeOptions.set(option.attributeName(), option);
        } else {
          this.positiveOptions.set(option.attributeName(), option);
        }
      });
      this.negativeOptions.forEach((value, key) => {
        if (this.positiveOptions.has(key)) {
          this.dualOptions.add(key);
        }
      });
    }
    valueFromOption(value, option) {
      const optionKey = option.attributeName();
      if (!this.dualOptions.has(optionKey))
        return true;
      const preset = this.negativeOptions.get(optionKey).presetArg;
      const negativeValue = preset !== undefined ? preset : false;
      return option.negate === (negativeValue === value);
    }
  }
  function camelcase(str) {
    return str.split("-").reduce((str2, word) => {
      return str2 + word[0].toUpperCase() + word.slice(1);
    });
  }
  function splitOptionFlags(flags) {
    let shortFlag;
    let longFlag;
    const shortFlagExp = /^-[^-]$/;
    const longFlagExp = /^--[^-]/;
    const flagParts = flags.split(/[ |,]+/).concat("guard");
    if (shortFlagExp.test(flagParts[0]))
      shortFlag = flagParts.shift();
    if (longFlagExp.test(flagParts[0]))
      longFlag = flagParts.shift();
    if (!shortFlag && shortFlagExp.test(flagParts[0]))
      shortFlag = flagParts.shift();
    if (!shortFlag && longFlagExp.test(flagParts[0])) {
      shortFlag = longFlag;
      longFlag = flagParts.shift();
    }
    if (flagParts[0].startsWith("-")) {
      const unsupportedFlag = flagParts[0];
      const baseError = `option creation failed due to '${unsupportedFlag}' in option flags '${flags}'`;
      if (/^-[^-][^-]/.test(unsupportedFlag))
        throw new Error(`${baseError}
- a short flag is a single dash and a single character
  - either use a single dash and a single character (for a short flag)
  - or use a double dash for a long option (and can have two, like '--ws, --workspace')`);
      if (shortFlagExp.test(unsupportedFlag))
        throw new Error(`${baseError}
- too many short flags`);
      if (longFlagExp.test(unsupportedFlag))
        throw new Error(`${baseError}
- too many long flags`);
      throw new Error(`${baseError}
- unrecognised flag format`);
    }
    if (shortFlag === undefined && longFlag === undefined)
      throw new Error(`option creation failed due to no flags found in '${flags}'.`);
    return { shortFlag, longFlag };
  }
  exports.Option = Option;
  exports.DualOptions = DualOptions;
});

// node_modules/commander/lib/suggestSimilar.js
var require_suggestSimilar = __commonJS((exports) => {
  var maxDistance = 3;
  function editDistance(a, b) {
    if (Math.abs(a.length - b.length) > maxDistance)
      return Math.max(a.length, b.length);
    const d = [];
    for (let i = 0;i <= a.length; i++) {
      d[i] = [i];
    }
    for (let j = 0;j <= b.length; j++) {
      d[0][j] = j;
    }
    for (let j = 1;j <= b.length; j++) {
      for (let i = 1;i <= a.length; i++) {
        let cost = 1;
        if (a[i - 1] === b[j - 1]) {
          cost = 0;
        } else {
          cost = 1;
        }
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
      }
    }
    return d[a.length][b.length];
  }
  function suggestSimilar(word, candidates) {
    if (!candidates || candidates.length === 0)
      return "";
    candidates = Array.from(new Set(candidates));
    const searchingOptions = word.startsWith("--");
    if (searchingOptions) {
      word = word.slice(2);
      candidates = candidates.map((candidate) => candidate.slice(2));
    }
    let similar = [];
    let bestDistance = maxDistance;
    const minSimilarity = 0.4;
    candidates.forEach((candidate) => {
      if (candidate.length <= 1)
        return;
      const distance = editDistance(word, candidate);
      const length = Math.max(word.length, candidate.length);
      const similarity = (length - distance) / length;
      if (similarity > minSimilarity) {
        if (distance < bestDistance) {
          bestDistance = distance;
          similar = [candidate];
        } else if (distance === bestDistance) {
          similar.push(candidate);
        }
      }
    });
    similar.sort((a, b) => a.localeCompare(b));
    if (searchingOptions) {
      similar = similar.map((candidate) => `--${candidate}`);
    }
    if (similar.length > 1) {
      return `
(Did you mean one of ${similar.join(", ")}?)`;
    }
    if (similar.length === 1) {
      return `
(Did you mean ${similar[0]}?)`;
    }
    return "";
  }
  exports.suggestSimilar = suggestSimilar;
});

// node_modules/commander/lib/command.js
var require_command = __commonJS((exports) => {
  var EventEmitter = __require("node:events").EventEmitter;
  var childProcess = __require("node:child_process");
  var path = __require("node:path");
  var fs = __require("node:fs");
  var process2 = __require("node:process");
  var { Argument, humanReadableArgName } = require_argument();
  var { CommanderError } = require_error();
  var { Help, stripColor } = require_help();
  var { Option, DualOptions } = require_option();
  var { suggestSimilar } = require_suggestSimilar();

  class Command extends EventEmitter {
    constructor(name) {
      super();
      this.commands = [];
      this.options = [];
      this.parent = null;
      this._allowUnknownOption = false;
      this._allowExcessArguments = false;
      this.registeredArguments = [];
      this._args = this.registeredArguments;
      this.args = [];
      this.rawArgs = [];
      this.processedArgs = [];
      this._scriptPath = null;
      this._name = name || "";
      this._optionValues = {};
      this._optionValueSources = {};
      this._storeOptionsAsProperties = false;
      this._actionHandler = null;
      this._executableHandler = false;
      this._executableFile = null;
      this._executableDir = null;
      this._defaultCommandName = null;
      this._exitCallback = null;
      this._aliases = [];
      this._combineFlagAndOptionalValue = true;
      this._description = "";
      this._summary = "";
      this._argsDescription = undefined;
      this._enablePositionalOptions = false;
      this._passThroughOptions = false;
      this._lifeCycleHooks = {};
      this._showHelpAfterError = false;
      this._showSuggestionAfterError = true;
      this._savedState = null;
      this._outputConfiguration = {
        writeOut: (str) => process2.stdout.write(str),
        writeErr: (str) => process2.stderr.write(str),
        outputError: (str, write) => write(str),
        getOutHelpWidth: () => process2.stdout.isTTY ? process2.stdout.columns : undefined,
        getErrHelpWidth: () => process2.stderr.isTTY ? process2.stderr.columns : undefined,
        getOutHasColors: () => useColor() ?? (process2.stdout.isTTY && process2.stdout.hasColors?.()),
        getErrHasColors: () => useColor() ?? (process2.stderr.isTTY && process2.stderr.hasColors?.()),
        stripColor: (str) => stripColor(str)
      };
      this._hidden = false;
      this._helpOption = undefined;
      this._addImplicitHelpCommand = undefined;
      this._helpCommand = undefined;
      this._helpConfiguration = {};
    }
    copyInheritedSettings(sourceCommand) {
      this._outputConfiguration = sourceCommand._outputConfiguration;
      this._helpOption = sourceCommand._helpOption;
      this._helpCommand = sourceCommand._helpCommand;
      this._helpConfiguration = sourceCommand._helpConfiguration;
      this._exitCallback = sourceCommand._exitCallback;
      this._storeOptionsAsProperties = sourceCommand._storeOptionsAsProperties;
      this._combineFlagAndOptionalValue = sourceCommand._combineFlagAndOptionalValue;
      this._allowExcessArguments = sourceCommand._allowExcessArguments;
      this._enablePositionalOptions = sourceCommand._enablePositionalOptions;
      this._showHelpAfterError = sourceCommand._showHelpAfterError;
      this._showSuggestionAfterError = sourceCommand._showSuggestionAfterError;
      return this;
    }
    _getCommandAndAncestors() {
      const result = [];
      for (let command = this;command; command = command.parent) {
        result.push(command);
      }
      return result;
    }
    command(nameAndArgs, actionOptsOrExecDesc, execOpts) {
      let desc = actionOptsOrExecDesc;
      let opts = execOpts;
      if (typeof desc === "object" && desc !== null) {
        opts = desc;
        desc = null;
      }
      opts = opts || {};
      const [, name, args] = nameAndArgs.match(/([^ ]+) *(.*)/);
      const cmd = this.createCommand(name);
      if (desc) {
        cmd.description(desc);
        cmd._executableHandler = true;
      }
      if (opts.isDefault)
        this._defaultCommandName = cmd._name;
      cmd._hidden = !!(opts.noHelp || opts.hidden);
      cmd._executableFile = opts.executableFile || null;
      if (args)
        cmd.arguments(args);
      this._registerCommand(cmd);
      cmd.parent = this;
      cmd.copyInheritedSettings(this);
      if (desc)
        return this;
      return cmd;
    }
    createCommand(name) {
      return new Command(name);
    }
    createHelp() {
      return Object.assign(new Help, this.configureHelp());
    }
    configureHelp(configuration) {
      if (configuration === undefined)
        return this._helpConfiguration;
      this._helpConfiguration = configuration;
      return this;
    }
    configureOutput(configuration) {
      if (configuration === undefined)
        return this._outputConfiguration;
      Object.assign(this._outputConfiguration, configuration);
      return this;
    }
    showHelpAfterError(displayHelp = true) {
      if (typeof displayHelp !== "string")
        displayHelp = !!displayHelp;
      this._showHelpAfterError = displayHelp;
      return this;
    }
    showSuggestionAfterError(displaySuggestion = true) {
      this._showSuggestionAfterError = !!displaySuggestion;
      return this;
    }
    addCommand(cmd, opts) {
      if (!cmd._name) {
        throw new Error(`Command passed to .addCommand() must have a name
- specify the name in Command constructor or using .name()`);
      }
      opts = opts || {};
      if (opts.isDefault)
        this._defaultCommandName = cmd._name;
      if (opts.noHelp || opts.hidden)
        cmd._hidden = true;
      this._registerCommand(cmd);
      cmd.parent = this;
      cmd._checkForBrokenPassThrough();
      return this;
    }
    createArgument(name, description) {
      return new Argument(name, description);
    }
    argument(name, description, fn, defaultValue) {
      const argument = this.createArgument(name, description);
      if (typeof fn === "function") {
        argument.default(defaultValue).argParser(fn);
      } else {
        argument.default(fn);
      }
      this.addArgument(argument);
      return this;
    }
    arguments(names) {
      names.trim().split(/ +/).forEach((detail) => {
        this.argument(detail);
      });
      return this;
    }
    addArgument(argument) {
      const previousArgument = this.registeredArguments.slice(-1)[0];
      if (previousArgument && previousArgument.variadic) {
        throw new Error(`only the last argument can be variadic '${previousArgument.name()}'`);
      }
      if (argument.required && argument.defaultValue !== undefined && argument.parseArg === undefined) {
        throw new Error(`a default value for a required argument is never used: '${argument.name()}'`);
      }
      this.registeredArguments.push(argument);
      return this;
    }
    helpCommand(enableOrNameAndArgs, description) {
      if (typeof enableOrNameAndArgs === "boolean") {
        this._addImplicitHelpCommand = enableOrNameAndArgs;
        return this;
      }
      enableOrNameAndArgs = enableOrNameAndArgs ?? "help [command]";
      const [, helpName, helpArgs] = enableOrNameAndArgs.match(/([^ ]+) *(.*)/);
      const helpDescription = description ?? "display help for command";
      const helpCommand = this.createCommand(helpName);
      helpCommand.helpOption(false);
      if (helpArgs)
        helpCommand.arguments(helpArgs);
      if (helpDescription)
        helpCommand.description(helpDescription);
      this._addImplicitHelpCommand = true;
      this._helpCommand = helpCommand;
      return this;
    }
    addHelpCommand(helpCommand, deprecatedDescription) {
      if (typeof helpCommand !== "object") {
        this.helpCommand(helpCommand, deprecatedDescription);
        return this;
      }
      this._addImplicitHelpCommand = true;
      this._helpCommand = helpCommand;
      return this;
    }
    _getHelpCommand() {
      const hasImplicitHelpCommand = this._addImplicitHelpCommand ?? (this.commands.length && !this._actionHandler && !this._findCommand("help"));
      if (hasImplicitHelpCommand) {
        if (this._helpCommand === undefined) {
          this.helpCommand(undefined, undefined);
        }
        return this._helpCommand;
      }
      return null;
    }
    hook(event, listener) {
      const allowedValues = ["preSubcommand", "preAction", "postAction"];
      if (!allowedValues.includes(event)) {
        throw new Error(`Unexpected value for event passed to hook : '${event}'.
Expecting one of '${allowedValues.join("', '")}'`);
      }
      if (this._lifeCycleHooks[event]) {
        this._lifeCycleHooks[event].push(listener);
      } else {
        this._lifeCycleHooks[event] = [listener];
      }
      return this;
    }
    exitOverride(fn) {
      if (fn) {
        this._exitCallback = fn;
      } else {
        this._exitCallback = (err) => {
          if (err.code !== "commander.executeSubCommandAsync") {
            throw err;
          } else {}
        };
      }
      return this;
    }
    _exit(exitCode, code, message) {
      if (this._exitCallback) {
        this._exitCallback(new CommanderError(exitCode, code, message));
      }
      process2.exit(exitCode);
    }
    action(fn) {
      const listener = (args) => {
        const expectedArgsCount = this.registeredArguments.length;
        const actionArgs = args.slice(0, expectedArgsCount);
        if (this._storeOptionsAsProperties) {
          actionArgs[expectedArgsCount] = this;
        } else {
          actionArgs[expectedArgsCount] = this.opts();
        }
        actionArgs.push(this);
        return fn.apply(this, actionArgs);
      };
      this._actionHandler = listener;
      return this;
    }
    createOption(flags, description) {
      return new Option(flags, description);
    }
    _callParseArg(target, value, previous, invalidArgumentMessage) {
      try {
        return target.parseArg(value, previous);
      } catch (err) {
        if (err.code === "commander.invalidArgument") {
          const message = `${invalidArgumentMessage} ${err.message}`;
          this.error(message, { exitCode: err.exitCode, code: err.code });
        }
        throw err;
      }
    }
    _registerOption(option) {
      const matchingOption = option.short && this._findOption(option.short) || option.long && this._findOption(option.long);
      if (matchingOption) {
        const matchingFlag = option.long && this._findOption(option.long) ? option.long : option.short;
        throw new Error(`Cannot add option '${option.flags}'${this._name && ` to command '${this._name}'`} due to conflicting flag '${matchingFlag}'
-  already used by option '${matchingOption.flags}'`);
      }
      this.options.push(option);
    }
    _registerCommand(command) {
      const knownBy = (cmd) => {
        return [cmd.name()].concat(cmd.aliases());
      };
      const alreadyUsed = knownBy(command).find((name) => this._findCommand(name));
      if (alreadyUsed) {
        const existingCmd = knownBy(this._findCommand(alreadyUsed)).join("|");
        const newCmd = knownBy(command).join("|");
        throw new Error(`cannot add command '${newCmd}' as already have command '${existingCmd}'`);
      }
      this.commands.push(command);
    }
    addOption(option) {
      this._registerOption(option);
      const oname = option.name();
      const name = option.attributeName();
      if (option.negate) {
        const positiveLongFlag = option.long.replace(/^--no-/, "--");
        if (!this._findOption(positiveLongFlag)) {
          this.setOptionValueWithSource(name, option.defaultValue === undefined ? true : option.defaultValue, "default");
        }
      } else if (option.defaultValue !== undefined) {
        this.setOptionValueWithSource(name, option.defaultValue, "default");
      }
      const handleOptionValue = (val, invalidValueMessage, valueSource) => {
        if (val == null && option.presetArg !== undefined) {
          val = option.presetArg;
        }
        const oldValue = this.getOptionValue(name);
        if (val !== null && option.parseArg) {
          val = this._callParseArg(option, val, oldValue, invalidValueMessage);
        } else if (val !== null && option.variadic) {
          val = option._concatValue(val, oldValue);
        }
        if (val == null) {
          if (option.negate) {
            val = false;
          } else if (option.isBoolean() || option.optional) {
            val = true;
          } else {
            val = "";
          }
        }
        this.setOptionValueWithSource(name, val, valueSource);
      };
      this.on("option:" + oname, (val) => {
        const invalidValueMessage = `error: option '${option.flags}' argument '${val}' is invalid.`;
        handleOptionValue(val, invalidValueMessage, "cli");
      });
      if (option.envVar) {
        this.on("optionEnv:" + oname, (val) => {
          const invalidValueMessage = `error: option '${option.flags}' value '${val}' from env '${option.envVar}' is invalid.`;
          handleOptionValue(val, invalidValueMessage, "env");
        });
      }
      return this;
    }
    _optionEx(config, flags, description, fn, defaultValue) {
      if (typeof flags === "object" && flags instanceof Option) {
        throw new Error("To add an Option object use addOption() instead of option() or requiredOption()");
      }
      const option = this.createOption(flags, description);
      option.makeOptionMandatory(!!config.mandatory);
      if (typeof fn === "function") {
        option.default(defaultValue).argParser(fn);
      } else if (fn instanceof RegExp) {
        const regex = fn;
        fn = (val, def) => {
          const m = regex.exec(val);
          return m ? m[0] : def;
        };
        option.default(defaultValue).argParser(fn);
      } else {
        option.default(fn);
      }
      return this.addOption(option);
    }
    option(flags, description, parseArg, defaultValue) {
      return this._optionEx({}, flags, description, parseArg, defaultValue);
    }
    requiredOption(flags, description, parseArg, defaultValue) {
      return this._optionEx({ mandatory: true }, flags, description, parseArg, defaultValue);
    }
    combineFlagAndOptionalValue(combine = true) {
      this._combineFlagAndOptionalValue = !!combine;
      return this;
    }
    allowUnknownOption(allowUnknown = true) {
      this._allowUnknownOption = !!allowUnknown;
      return this;
    }
    allowExcessArguments(allowExcess = true) {
      this._allowExcessArguments = !!allowExcess;
      return this;
    }
    enablePositionalOptions(positional = true) {
      this._enablePositionalOptions = !!positional;
      return this;
    }
    passThroughOptions(passThrough = true) {
      this._passThroughOptions = !!passThrough;
      this._checkForBrokenPassThrough();
      return this;
    }
    _checkForBrokenPassThrough() {
      if (this.parent && this._passThroughOptions && !this.parent._enablePositionalOptions) {
        throw new Error(`passThroughOptions cannot be used for '${this._name}' without turning on enablePositionalOptions for parent command(s)`);
      }
    }
    storeOptionsAsProperties(storeAsProperties = true) {
      if (this.options.length) {
        throw new Error("call .storeOptionsAsProperties() before adding options");
      }
      if (Object.keys(this._optionValues).length) {
        throw new Error("call .storeOptionsAsProperties() before setting option values");
      }
      this._storeOptionsAsProperties = !!storeAsProperties;
      return this;
    }
    getOptionValue(key) {
      if (this._storeOptionsAsProperties) {
        return this[key];
      }
      return this._optionValues[key];
    }
    setOptionValue(key, value) {
      return this.setOptionValueWithSource(key, value, undefined);
    }
    setOptionValueWithSource(key, value, source) {
      if (this._storeOptionsAsProperties) {
        this[key] = value;
      } else {
        this._optionValues[key] = value;
      }
      this._optionValueSources[key] = source;
      return this;
    }
    getOptionValueSource(key) {
      return this._optionValueSources[key];
    }
    getOptionValueSourceWithGlobals(key) {
      let source;
      this._getCommandAndAncestors().forEach((cmd) => {
        if (cmd.getOptionValueSource(key) !== undefined) {
          source = cmd.getOptionValueSource(key);
        }
      });
      return source;
    }
    _prepareUserArgs(argv, parseOptions) {
      if (argv !== undefined && !Array.isArray(argv)) {
        throw new Error("first parameter to parse must be array or undefined");
      }
      parseOptions = parseOptions || {};
      if (argv === undefined && parseOptions.from === undefined) {
        if (process2.versions?.electron) {
          parseOptions.from = "electron";
        }
        const execArgv = process2.execArgv ?? [];
        if (execArgv.includes("-e") || execArgv.includes("--eval") || execArgv.includes("-p") || execArgv.includes("--print")) {
          parseOptions.from = "eval";
        }
      }
      if (argv === undefined) {
        argv = process2.argv;
      }
      this.rawArgs = argv.slice();
      let userArgs;
      switch (parseOptions.from) {
        case undefined:
        case "node":
          this._scriptPath = argv[1];
          userArgs = argv.slice(2);
          break;
        case "electron":
          if (process2.defaultApp) {
            this._scriptPath = argv[1];
            userArgs = argv.slice(2);
          } else {
            userArgs = argv.slice(1);
          }
          break;
        case "user":
          userArgs = argv.slice(0);
          break;
        case "eval":
          userArgs = argv.slice(1);
          break;
        default:
          throw new Error(`unexpected parse option { from: '${parseOptions.from}' }`);
      }
      if (!this._name && this._scriptPath)
        this.nameFromFilename(this._scriptPath);
      this._name = this._name || "program";
      return userArgs;
    }
    parse(argv, parseOptions) {
      this._prepareForParse();
      const userArgs = this._prepareUserArgs(argv, parseOptions);
      this._parseCommand([], userArgs);
      return this;
    }
    async parseAsync(argv, parseOptions) {
      this._prepareForParse();
      const userArgs = this._prepareUserArgs(argv, parseOptions);
      await this._parseCommand([], userArgs);
      return this;
    }
    _prepareForParse() {
      if (this._savedState === null) {
        this.saveStateBeforeParse();
      } else {
        this.restoreStateBeforeParse();
      }
    }
    saveStateBeforeParse() {
      this._savedState = {
        _name: this._name,
        _optionValues: { ...this._optionValues },
        _optionValueSources: { ...this._optionValueSources }
      };
    }
    restoreStateBeforeParse() {
      if (this._storeOptionsAsProperties)
        throw new Error(`Can not call parse again when storeOptionsAsProperties is true.
- either make a new Command for each call to parse, or stop storing options as properties`);
      this._name = this._savedState._name;
      this._scriptPath = null;
      this.rawArgs = [];
      this._optionValues = { ...this._savedState._optionValues };
      this._optionValueSources = { ...this._savedState._optionValueSources };
      this.args = [];
      this.processedArgs = [];
    }
    _checkForMissingExecutable(executableFile, executableDir, subcommandName) {
      if (fs.existsSync(executableFile))
        return;
      const executableDirMessage = executableDir ? `searched for local subcommand relative to directory '${executableDir}'` : "no directory for search for local subcommand, use .executableDir() to supply a custom directory";
      const executableMissing = `'${executableFile}' does not exist
 - if '${subcommandName}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name or path
 - ${executableDirMessage}`;
      throw new Error(executableMissing);
    }
    _executeSubCommand(subcommand, args) {
      args = args.slice();
      let launchWithNode = false;
      const sourceExt = [".js", ".ts", ".tsx", ".mjs", ".cjs"];
      function findFile(baseDir, baseName) {
        const localBin = path.resolve(baseDir, baseName);
        if (fs.existsSync(localBin))
          return localBin;
        if (sourceExt.includes(path.extname(baseName)))
          return;
        const foundExt = sourceExt.find((ext) => fs.existsSync(`${localBin}${ext}`));
        if (foundExt)
          return `${localBin}${foundExt}`;
        return;
      }
      this._checkForMissingMandatoryOptions();
      this._checkForConflictingOptions();
      let executableFile = subcommand._executableFile || `${this._name}-${subcommand._name}`;
      let executableDir = this._executableDir || "";
      if (this._scriptPath) {
        let resolvedScriptPath;
        try {
          resolvedScriptPath = fs.realpathSync(this._scriptPath);
        } catch {
          resolvedScriptPath = this._scriptPath;
        }
        executableDir = path.resolve(path.dirname(resolvedScriptPath), executableDir);
      }
      if (executableDir) {
        let localFile = findFile(executableDir, executableFile);
        if (!localFile && !subcommand._executableFile && this._scriptPath) {
          const legacyName = path.basename(this._scriptPath, path.extname(this._scriptPath));
          if (legacyName !== this._name) {
            localFile = findFile(executableDir, `${legacyName}-${subcommand._name}`);
          }
        }
        executableFile = localFile || executableFile;
      }
      launchWithNode = sourceExt.includes(path.extname(executableFile));
      let proc;
      if (process2.platform !== "win32") {
        if (launchWithNode) {
          args.unshift(executableFile);
          args = incrementNodeInspectorPort(process2.execArgv).concat(args);
          proc = childProcess.spawn(process2.argv[0], args, { stdio: "inherit" });
        } else {
          proc = childProcess.spawn(executableFile, args, { stdio: "inherit" });
        }
      } else {
        this._checkForMissingExecutable(executableFile, executableDir, subcommand._name);
        args.unshift(executableFile);
        args = incrementNodeInspectorPort(process2.execArgv).concat(args);
        proc = childProcess.spawn(process2.execPath, args, { stdio: "inherit" });
      }
      if (!proc.killed) {
        const signals = ["SIGUSR1", "SIGUSR2", "SIGTERM", "SIGINT", "SIGHUP"];
        signals.forEach((signal) => {
          process2.on(signal, () => {
            if (proc.killed === false && proc.exitCode === null) {
              proc.kill(signal);
            }
          });
        });
      }
      const exitCallback = this._exitCallback;
      proc.on("close", (code) => {
        code = code ?? 1;
        if (!exitCallback) {
          process2.exit(code);
        } else {
          exitCallback(new CommanderError(code, "commander.executeSubCommandAsync", "(close)"));
        }
      });
      proc.on("error", (err) => {
        if (err.code === "ENOENT") {
          this._checkForMissingExecutable(executableFile, executableDir, subcommand._name);
        } else if (err.code === "EACCES") {
          throw new Error(`'${executableFile}' not executable`);
        }
        if (!exitCallback) {
          process2.exit(1);
        } else {
          const wrappedError = new CommanderError(1, "commander.executeSubCommandAsync", "(error)");
          wrappedError.nestedError = err;
          exitCallback(wrappedError);
        }
      });
      this.runningCommand = proc;
    }
    _dispatchSubcommand(commandName, operands, unknown) {
      const subCommand = this._findCommand(commandName);
      if (!subCommand)
        this.help({ error: true });
      subCommand._prepareForParse();
      let promiseChain;
      promiseChain = this._chainOrCallSubCommandHook(promiseChain, subCommand, "preSubcommand");
      promiseChain = this._chainOrCall(promiseChain, () => {
        if (subCommand._executableHandler) {
          this._executeSubCommand(subCommand, operands.concat(unknown));
        } else {
          return subCommand._parseCommand(operands, unknown);
        }
      });
      return promiseChain;
    }
    _dispatchHelpCommand(subcommandName) {
      if (!subcommandName) {
        this.help();
      }
      const subCommand = this._findCommand(subcommandName);
      if (subCommand && !subCommand._executableHandler) {
        subCommand.help();
      }
      return this._dispatchSubcommand(subcommandName, [], [this._getHelpOption()?.long ?? this._getHelpOption()?.short ?? "--help"]);
    }
    _checkNumberOfArguments() {
      this.registeredArguments.forEach((arg, i) => {
        if (arg.required && this.args[i] == null) {
          this.missingArgument(arg.name());
        }
      });
      if (this.registeredArguments.length > 0 && this.registeredArguments[this.registeredArguments.length - 1].variadic) {
        return;
      }
      if (this.args.length > this.registeredArguments.length) {
        this._excessArguments(this.args);
      }
    }
    _processArguments() {
      const myParseArg = (argument, value, previous) => {
        let parsedValue = value;
        if (value !== null && argument.parseArg) {
          const invalidValueMessage = `error: command-argument value '${value}' is invalid for argument '${argument.name()}'.`;
          parsedValue = this._callParseArg(argument, value, previous, invalidValueMessage);
        }
        return parsedValue;
      };
      this._checkNumberOfArguments();
      const processedArgs = [];
      this.registeredArguments.forEach((declaredArg, index) => {
        let value = declaredArg.defaultValue;
        if (declaredArg.variadic) {
          if (index < this.args.length) {
            value = this.args.slice(index);
            if (declaredArg.parseArg) {
              value = value.reduce((processed, v) => {
                return myParseArg(declaredArg, v, processed);
              }, declaredArg.defaultValue);
            }
          } else if (value === undefined) {
            value = [];
          }
        } else if (index < this.args.length) {
          value = this.args[index];
          if (declaredArg.parseArg) {
            value = myParseArg(declaredArg, value, declaredArg.defaultValue);
          }
        }
        processedArgs[index] = value;
      });
      this.processedArgs = processedArgs;
    }
    _chainOrCall(promise, fn) {
      if (promise && promise.then && typeof promise.then === "function") {
        return promise.then(() => fn());
      }
      return fn();
    }
    _chainOrCallHooks(promise, event) {
      let result = promise;
      const hooks = [];
      this._getCommandAndAncestors().reverse().filter((cmd) => cmd._lifeCycleHooks[event] !== undefined).forEach((hookedCommand) => {
        hookedCommand._lifeCycleHooks[event].forEach((callback) => {
          hooks.push({ hookedCommand, callback });
        });
      });
      if (event === "postAction") {
        hooks.reverse();
      }
      hooks.forEach((hookDetail) => {
        result = this._chainOrCall(result, () => {
          return hookDetail.callback(hookDetail.hookedCommand, this);
        });
      });
      return result;
    }
    _chainOrCallSubCommandHook(promise, subCommand, event) {
      let result = promise;
      if (this._lifeCycleHooks[event] !== undefined) {
        this._lifeCycleHooks[event].forEach((hook) => {
          result = this._chainOrCall(result, () => {
            return hook(this, subCommand);
          });
        });
      }
      return result;
    }
    _parseCommand(operands, unknown) {
      const parsed = this.parseOptions(unknown);
      this._parseOptionsEnv();
      this._parseOptionsImplied();
      operands = operands.concat(parsed.operands);
      unknown = parsed.unknown;
      this.args = operands.concat(unknown);
      if (operands && this._findCommand(operands[0])) {
        return this._dispatchSubcommand(operands[0], operands.slice(1), unknown);
      }
      if (this._getHelpCommand() && operands[0] === this._getHelpCommand().name()) {
        return this._dispatchHelpCommand(operands[1]);
      }
      if (this._defaultCommandName) {
        this._outputHelpIfRequested(unknown);
        return this._dispatchSubcommand(this._defaultCommandName, operands, unknown);
      }
      if (this.commands.length && this.args.length === 0 && !this._actionHandler && !this._defaultCommandName) {
        this.help({ error: true });
      }
      this._outputHelpIfRequested(parsed.unknown);
      this._checkForMissingMandatoryOptions();
      this._checkForConflictingOptions();
      const checkForUnknownOptions = () => {
        if (parsed.unknown.length > 0) {
          this.unknownOption(parsed.unknown[0]);
        }
      };
      const commandEvent = `command:${this.name()}`;
      if (this._actionHandler) {
        checkForUnknownOptions();
        this._processArguments();
        let promiseChain;
        promiseChain = this._chainOrCallHooks(promiseChain, "preAction");
        promiseChain = this._chainOrCall(promiseChain, () => this._actionHandler(this.processedArgs));
        if (this.parent) {
          promiseChain = this._chainOrCall(promiseChain, () => {
            this.parent.emit(commandEvent, operands, unknown);
          });
        }
        promiseChain = this._chainOrCallHooks(promiseChain, "postAction");
        return promiseChain;
      }
      if (this.parent && this.parent.listenerCount(commandEvent)) {
        checkForUnknownOptions();
        this._processArguments();
        this.parent.emit(commandEvent, operands, unknown);
      } else if (operands.length) {
        if (this._findCommand("*")) {
          return this._dispatchSubcommand("*", operands, unknown);
        }
        if (this.listenerCount("command:*")) {
          this.emit("command:*", operands, unknown);
        } else if (this.commands.length) {
          this.unknownCommand();
        } else {
          checkForUnknownOptions();
          this._processArguments();
        }
      } else if (this.commands.length) {
        checkForUnknownOptions();
        this.help({ error: true });
      } else {
        checkForUnknownOptions();
        this._processArguments();
      }
    }
    _findCommand(name) {
      if (!name)
        return;
      return this.commands.find((cmd) => cmd._name === name || cmd._aliases.includes(name));
    }
    _findOption(arg) {
      return this.options.find((option) => option.is(arg));
    }
    _checkForMissingMandatoryOptions() {
      this._getCommandAndAncestors().forEach((cmd) => {
        cmd.options.forEach((anOption) => {
          if (anOption.mandatory && cmd.getOptionValue(anOption.attributeName()) === undefined) {
            cmd.missingMandatoryOptionValue(anOption);
          }
        });
      });
    }
    _checkForConflictingLocalOptions() {
      const definedNonDefaultOptions = this.options.filter((option) => {
        const optionKey = option.attributeName();
        if (this.getOptionValue(optionKey) === undefined) {
          return false;
        }
        return this.getOptionValueSource(optionKey) !== "default";
      });
      const optionsWithConflicting = definedNonDefaultOptions.filter((option) => option.conflictsWith.length > 0);
      optionsWithConflicting.forEach((option) => {
        const conflictingAndDefined = definedNonDefaultOptions.find((defined) => option.conflictsWith.includes(defined.attributeName()));
        if (conflictingAndDefined) {
          this._conflictingOption(option, conflictingAndDefined);
        }
      });
    }
    _checkForConflictingOptions() {
      this._getCommandAndAncestors().forEach((cmd) => {
        cmd._checkForConflictingLocalOptions();
      });
    }
    parseOptions(argv) {
      const operands = [];
      const unknown = [];
      let dest = operands;
      const args = argv.slice();
      function maybeOption(arg) {
        return arg.length > 1 && arg[0] === "-";
      }
      let activeVariadicOption = null;
      while (args.length) {
        const arg = args.shift();
        if (arg === "--") {
          if (dest === unknown)
            dest.push(arg);
          dest.push(...args);
          break;
        }
        if (activeVariadicOption && !maybeOption(arg)) {
          this.emit(`option:${activeVariadicOption.name()}`, arg);
          continue;
        }
        activeVariadicOption = null;
        if (maybeOption(arg)) {
          const option = this._findOption(arg);
          if (option) {
            if (option.required) {
              const value = args.shift();
              if (value === undefined)
                this.optionMissingArgument(option);
              this.emit(`option:${option.name()}`, value);
            } else if (option.optional) {
              let value = null;
              if (args.length > 0 && !maybeOption(args[0])) {
                value = args.shift();
              }
              this.emit(`option:${option.name()}`, value);
            } else {
              this.emit(`option:${option.name()}`);
            }
            activeVariadicOption = option.variadic ? option : null;
            continue;
          }
        }
        if (arg.length > 2 && arg[0] === "-" && arg[1] !== "-") {
          const option = this._findOption(`-${arg[1]}`);
          if (option) {
            if (option.required || option.optional && this._combineFlagAndOptionalValue) {
              this.emit(`option:${option.name()}`, arg.slice(2));
            } else {
              this.emit(`option:${option.name()}`);
              args.unshift(`-${arg.slice(2)}`);
            }
            continue;
          }
        }
        if (/^--[^=]+=/.test(arg)) {
          const index = arg.indexOf("=");
          const option = this._findOption(arg.slice(0, index));
          if (option && (option.required || option.optional)) {
            this.emit(`option:${option.name()}`, arg.slice(index + 1));
            continue;
          }
        }
        if (maybeOption(arg)) {
          dest = unknown;
        }
        if ((this._enablePositionalOptions || this._passThroughOptions) && operands.length === 0 && unknown.length === 0) {
          if (this._findCommand(arg)) {
            operands.push(arg);
            if (args.length > 0)
              unknown.push(...args);
            break;
          } else if (this._getHelpCommand() && arg === this._getHelpCommand().name()) {
            operands.push(arg);
            if (args.length > 0)
              operands.push(...args);
            break;
          } else if (this._defaultCommandName) {
            unknown.push(arg);
            if (args.length > 0)
              unknown.push(...args);
            break;
          }
        }
        if (this._passThroughOptions) {
          dest.push(arg);
          if (args.length > 0)
            dest.push(...args);
          break;
        }
        dest.push(arg);
      }
      return { operands, unknown };
    }
    opts() {
      if (this._storeOptionsAsProperties) {
        const result = {};
        const len = this.options.length;
        for (let i = 0;i < len; i++) {
          const key = this.options[i].attributeName();
          result[key] = key === this._versionOptionName ? this._version : this[key];
        }
        return result;
      }
      return this._optionValues;
    }
    optsWithGlobals() {
      return this._getCommandAndAncestors().reduce((combinedOptions, cmd) => Object.assign(combinedOptions, cmd.opts()), {});
    }
    error(message, errorOptions) {
      this._outputConfiguration.outputError(`${message}
`, this._outputConfiguration.writeErr);
      if (typeof this._showHelpAfterError === "string") {
        this._outputConfiguration.writeErr(`${this._showHelpAfterError}
`);
      } else if (this._showHelpAfterError) {
        this._outputConfiguration.writeErr(`
`);
        this.outputHelp({ error: true });
      }
      const config = errorOptions || {};
      const exitCode = config.exitCode || 1;
      const code = config.code || "commander.error";
      this._exit(exitCode, code, message);
    }
    _parseOptionsEnv() {
      this.options.forEach((option) => {
        if (option.envVar && option.envVar in process2.env) {
          const optionKey = option.attributeName();
          if (this.getOptionValue(optionKey) === undefined || ["default", "config", "env"].includes(this.getOptionValueSource(optionKey))) {
            if (option.required || option.optional) {
              this.emit(`optionEnv:${option.name()}`, process2.env[option.envVar]);
            } else {
              this.emit(`optionEnv:${option.name()}`);
            }
          }
        }
      });
    }
    _parseOptionsImplied() {
      const dualHelper = new DualOptions(this.options);
      const hasCustomOptionValue = (optionKey) => {
        return this.getOptionValue(optionKey) !== undefined && !["default", "implied"].includes(this.getOptionValueSource(optionKey));
      };
      this.options.filter((option) => option.implied !== undefined && hasCustomOptionValue(option.attributeName()) && dualHelper.valueFromOption(this.getOptionValue(option.attributeName()), option)).forEach((option) => {
        Object.keys(option.implied).filter((impliedKey) => !hasCustomOptionValue(impliedKey)).forEach((impliedKey) => {
          this.setOptionValueWithSource(impliedKey, option.implied[impliedKey], "implied");
        });
      });
    }
    missingArgument(name) {
      const message = `error: missing required argument '${name}'`;
      this.error(message, { code: "commander.missingArgument" });
    }
    optionMissingArgument(option) {
      const message = `error: option '${option.flags}' argument missing`;
      this.error(message, { code: "commander.optionMissingArgument" });
    }
    missingMandatoryOptionValue(option) {
      const message = `error: required option '${option.flags}' not specified`;
      this.error(message, { code: "commander.missingMandatoryOptionValue" });
    }
    _conflictingOption(option, conflictingOption) {
      const findBestOptionFromValue = (option2) => {
        const optionKey = option2.attributeName();
        const optionValue = this.getOptionValue(optionKey);
        const negativeOption = this.options.find((target) => target.negate && optionKey === target.attributeName());
        const positiveOption = this.options.find((target) => !target.negate && optionKey === target.attributeName());
        if (negativeOption && (negativeOption.presetArg === undefined && optionValue === false || negativeOption.presetArg !== undefined && optionValue === negativeOption.presetArg)) {
          return negativeOption;
        }
        return positiveOption || option2;
      };
      const getErrorMessage = (option2) => {
        const bestOption = findBestOptionFromValue(option2);
        const optionKey = bestOption.attributeName();
        const source = this.getOptionValueSource(optionKey);
        if (source === "env") {
          return `environment variable '${bestOption.envVar}'`;
        }
        return `option '${bestOption.flags}'`;
      };
      const message = `error: ${getErrorMessage(option)} cannot be used with ${getErrorMessage(conflictingOption)}`;
      this.error(message, { code: "commander.conflictingOption" });
    }
    unknownOption(flag) {
      if (this._allowUnknownOption)
        return;
      let suggestion = "";
      if (flag.startsWith("--") && this._showSuggestionAfterError) {
        let candidateFlags = [];
        let command = this;
        do {
          const moreFlags = command.createHelp().visibleOptions(command).filter((option) => option.long).map((option) => option.long);
          candidateFlags = candidateFlags.concat(moreFlags);
          command = command.parent;
        } while (command && !command._enablePositionalOptions);
        suggestion = suggestSimilar(flag, candidateFlags);
      }
      const message = `error: unknown option '${flag}'${suggestion}`;
      this.error(message, { code: "commander.unknownOption" });
    }
    _excessArguments(receivedArgs) {
      if (this._allowExcessArguments)
        return;
      const expected = this.registeredArguments.length;
      const s = expected === 1 ? "" : "s";
      const forSubcommand = this.parent ? ` for '${this.name()}'` : "";
      const message = `error: too many arguments${forSubcommand}. Expected ${expected} argument${s} but got ${receivedArgs.length}.`;
      this.error(message, { code: "commander.excessArguments" });
    }
    unknownCommand() {
      const unknownName = this.args[0];
      let suggestion = "";
      if (this._showSuggestionAfterError) {
        const candidateNames = [];
        this.createHelp().visibleCommands(this).forEach((command) => {
          candidateNames.push(command.name());
          if (command.alias())
            candidateNames.push(command.alias());
        });
        suggestion = suggestSimilar(unknownName, candidateNames);
      }
      const message = `error: unknown command '${unknownName}'${suggestion}`;
      this.error(message, { code: "commander.unknownCommand" });
    }
    version(str, flags, description) {
      if (str === undefined)
        return this._version;
      this._version = str;
      flags = flags || "-V, --version";
      description = description || "output the version number";
      const versionOption = this.createOption(flags, description);
      this._versionOptionName = versionOption.attributeName();
      this._registerOption(versionOption);
      this.on("option:" + versionOption.name(), () => {
        this._outputConfiguration.writeOut(`${str}
`);
        this._exit(0, "commander.version", str);
      });
      return this;
    }
    description(str, argsDescription) {
      if (str === undefined && argsDescription === undefined)
        return this._description;
      this._description = str;
      if (argsDescription) {
        this._argsDescription = argsDescription;
      }
      return this;
    }
    summary(str) {
      if (str === undefined)
        return this._summary;
      this._summary = str;
      return this;
    }
    alias(alias) {
      if (alias === undefined)
        return this._aliases[0];
      let command = this;
      if (this.commands.length !== 0 && this.commands[this.commands.length - 1]._executableHandler) {
        command = this.commands[this.commands.length - 1];
      }
      if (alias === command._name)
        throw new Error("Command alias can't be the same as its name");
      const matchingCommand = this.parent?._findCommand(alias);
      if (matchingCommand) {
        const existingCmd = [matchingCommand.name()].concat(matchingCommand.aliases()).join("|");
        throw new Error(`cannot add alias '${alias}' to command '${this.name()}' as already have command '${existingCmd}'`);
      }
      command._aliases.push(alias);
      return this;
    }
    aliases(aliases) {
      if (aliases === undefined)
        return this._aliases;
      aliases.forEach((alias) => this.alias(alias));
      return this;
    }
    usage(str) {
      if (str === undefined) {
        if (this._usage)
          return this._usage;
        const args = this.registeredArguments.map((arg) => {
          return humanReadableArgName(arg);
        });
        return [].concat(this.options.length || this._helpOption !== null ? "[options]" : [], this.commands.length ? "[command]" : [], this.registeredArguments.length ? args : []).join(" ");
      }
      this._usage = str;
      return this;
    }
    name(str) {
      if (str === undefined)
        return this._name;
      this._name = str;
      return this;
    }
    nameFromFilename(filename) {
      this._name = path.basename(filename, path.extname(filename));
      return this;
    }
    executableDir(path2) {
      if (path2 === undefined)
        return this._executableDir;
      this._executableDir = path2;
      return this;
    }
    helpInformation(contextOptions) {
      const helper = this.createHelp();
      const context = this._getOutputContext(contextOptions);
      helper.prepareContext({
        error: context.error,
        helpWidth: context.helpWidth,
        outputHasColors: context.hasColors
      });
      const text = helper.formatHelp(this, helper);
      if (context.hasColors)
        return text;
      return this._outputConfiguration.stripColor(text);
    }
    _getOutputContext(contextOptions) {
      contextOptions = contextOptions || {};
      const error = !!contextOptions.error;
      let baseWrite;
      let hasColors;
      let helpWidth;
      if (error) {
        baseWrite = (str) => this._outputConfiguration.writeErr(str);
        hasColors = this._outputConfiguration.getErrHasColors();
        helpWidth = this._outputConfiguration.getErrHelpWidth();
      } else {
        baseWrite = (str) => this._outputConfiguration.writeOut(str);
        hasColors = this._outputConfiguration.getOutHasColors();
        helpWidth = this._outputConfiguration.getOutHelpWidth();
      }
      const write = (str) => {
        if (!hasColors)
          str = this._outputConfiguration.stripColor(str);
        return baseWrite(str);
      };
      return { error, write, hasColors, helpWidth };
    }
    outputHelp(contextOptions) {
      let deprecatedCallback;
      if (typeof contextOptions === "function") {
        deprecatedCallback = contextOptions;
        contextOptions = undefined;
      }
      const outputContext = this._getOutputContext(contextOptions);
      const eventContext = {
        error: outputContext.error,
        write: outputContext.write,
        command: this
      };
      this._getCommandAndAncestors().reverse().forEach((command) => command.emit("beforeAllHelp", eventContext));
      this.emit("beforeHelp", eventContext);
      let helpInformation = this.helpInformation({ error: outputContext.error });
      if (deprecatedCallback) {
        helpInformation = deprecatedCallback(helpInformation);
        if (typeof helpInformation !== "string" && !Buffer.isBuffer(helpInformation)) {
          throw new Error("outputHelp callback must return a string or a Buffer");
        }
      }
      outputContext.write(helpInformation);
      if (this._getHelpOption()?.long) {
        this.emit(this._getHelpOption().long);
      }
      this.emit("afterHelp", eventContext);
      this._getCommandAndAncestors().forEach((command) => command.emit("afterAllHelp", eventContext));
    }
    helpOption(flags, description) {
      if (typeof flags === "boolean") {
        if (flags) {
          this._helpOption = this._helpOption ?? undefined;
        } else {
          this._helpOption = null;
        }
        return this;
      }
      flags = flags ?? "-h, --help";
      description = description ?? "display help for command";
      this._helpOption = this.createOption(flags, description);
      return this;
    }
    _getHelpOption() {
      if (this._helpOption === undefined) {
        this.helpOption(undefined, undefined);
      }
      return this._helpOption;
    }
    addHelpOption(option) {
      this._helpOption = option;
      return this;
    }
    help(contextOptions) {
      this.outputHelp(contextOptions);
      let exitCode = Number(process2.exitCode ?? 0);
      if (exitCode === 0 && contextOptions && typeof contextOptions !== "function" && contextOptions.error) {
        exitCode = 1;
      }
      this._exit(exitCode, "commander.help", "(outputHelp)");
    }
    addHelpText(position, text) {
      const allowedValues = ["beforeAll", "before", "after", "afterAll"];
      if (!allowedValues.includes(position)) {
        throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${allowedValues.join("', '")}'`);
      }
      const helpEvent = `${position}Help`;
      this.on(helpEvent, (context) => {
        let helpStr;
        if (typeof text === "function") {
          helpStr = text({ error: context.error, command: context.command });
        } else {
          helpStr = text;
        }
        if (helpStr) {
          context.write(`${helpStr}
`);
        }
      });
      return this;
    }
    _outputHelpIfRequested(args) {
      const helpOption = this._getHelpOption();
      const helpRequested = helpOption && args.find((arg) => helpOption.is(arg));
      if (helpRequested) {
        this.outputHelp();
        this._exit(0, "commander.helpDisplayed", "(outputHelp)");
      }
    }
  }
  function incrementNodeInspectorPort(args) {
    return args.map((arg) => {
      if (!arg.startsWith("--inspect")) {
        return arg;
      }
      let debugOption;
      let debugHost = "127.0.0.1";
      let debugPort = "9229";
      let match;
      if ((match = arg.match(/^(--inspect(-brk)?)$/)) !== null) {
        debugOption = match[1];
      } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/)) !== null) {
        debugOption = match[1];
        if (/^\d+$/.test(match[3])) {
          debugPort = match[3];
        } else {
          debugHost = match[3];
        }
      } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/)) !== null) {
        debugOption = match[1];
        debugHost = match[3];
        debugPort = match[4];
      }
      if (debugOption && debugPort !== "0") {
        return `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
      }
      return arg;
    });
  }
  function useColor() {
    if (process2.env.NO_COLOR || process2.env.FORCE_COLOR === "0" || process2.env.FORCE_COLOR === "false")
      return false;
    if (process2.env.FORCE_COLOR || process2.env.CLICOLOR_FORCE !== undefined)
      return true;
    return;
  }
  exports.Command = Command;
  exports.useColor = useColor;
});

// node_modules/commander/index.js
var require_commander = __commonJS((exports) => {
  var { Argument } = require_argument();
  var { Command } = require_command();
  var { CommanderError, InvalidArgumentError } = require_error();
  var { Help } = require_help();
  var { Option } = require_option();
  exports.program = new Command;
  exports.createCommand = (name) => new Command(name);
  exports.createOption = (flags, description) => new Option(flags, description);
  exports.createArgument = (name, description) => new Argument(name, description);
  exports.Command = Command;
  exports.Option = Option;
  exports.Argument = Argument;
  exports.Help = Help;
  exports.CommanderError = CommanderError;
  exports.InvalidArgumentError = InvalidArgumentError;
  exports.InvalidOptionArgumentError = InvalidArgumentError;
});

// src/index.ts
import { createRequire as createRequire2 } from "node:module";

// node_modules/commander/esm.mjs
var import__ = __toESM(require_commander(), 1);
var {
  program,
  createCommand,
  createArgument,
  createOption,
  CommanderError,
  InvalidArgumentError,
  InvalidOptionArgumentError,
  Command,
  Argument,
  Option,
  Help
} = import__.default;

// src/config.ts
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { createHash } from "node:crypto";
var CONFIG_DIR = join(homedir(), ".config", "renaissshipflow");
var CONFIG_FILE = join(CONFIG_DIR, "config.json");
var CREDS_FILE = join(CONFIG_DIR, "credentials.json");
var PROJECTS_FILE = join(CONFIG_DIR, "projects.json");
function ensureDir() {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true, mode: 448 });
  }
}
function readJsonOr(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return fallback;
  }
}
function writeJson(path, value) {
  ensureDir();
  writeFileSync(path, JSON.stringify(value, null, 2) + `
`, {
    encoding: "utf-8",
    mode: 384
  });
}
var loadConfig = () => readJsonOr(CONFIG_FILE, {});
var saveConfig = (c) => writeJson(CONFIG_FILE, c);
var clearConfig = () => {
  try {
    unlinkSync(CONFIG_FILE);
  } catch {}
};
var loadCredentials = () => readJsonOr(CREDS_FILE, null);
var saveCredentials = (c) => writeJson(CREDS_FILE, c);
var loadProjectCache = () => readJsonOr(PROJECTS_FILE, {});
var saveProjectCache = (c) => writeJson(PROJECTS_FILE, c);
function projectCacheKeyForRepoPath(absRepoRoot) {
  return createHash("sha256").update(absRepoRoot).digest("hex").slice(0, 16);
}
function parseBool(v) {
  if (v == null)
    return false;
  return ["true", "1", "on", "yes"].includes(v.trim().toLowerCase());
}
function resolveAutoIssue() {
  if (process.env.SHIPFLOW_AUTO_ISSUE != null)
    return parseBool(process.env.SHIPFLOW_AUTO_ISSUE);
  return loadConfig().autoIssue === true;
}
function resolveApiUrl(flagUrl) {
  return flagUrl || process.env.SHIPFLOW_API_URL || loadConfig().apiUrl || "http://localhost:8080";
}
function resolveAuthToken() {
  const creds = loadCredentials();
  if (creds?.jwt)
    return { token: creds.jwt, kind: "jwt" };
  const k = process.env.SHIPFLOW_API_KEY || loadConfig().apiKey;
  return k ? { token: k, kind: "apiKey" } : null;
}
function resolveApiKey() {
  const a = resolveAuthToken();
  return a?.token;
}

// src/commands/auth.ts
function registerAuthCommands(program2) {
  const auth = program2.command("auth").description("Manage authentication");
  auth.command("login").description("Authenticate with an API key").argument("[api-key]", "API key (sfk_...)").action(async (apiKey) => {
    if (!apiKey) {
      const { createInterface } = await import("node:readline");
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      apiKey = await new Promise((resolve) => {
        rl.question("Enter your RenaissShipFlow API key (sfk_...): ", (answer) => {
          rl.close();
          resolve(answer.trim());
        });
      });
    }
    if (!apiKey) {
      console.error("Error: API key is required.");
      process.exit(1);
    }
    const config = loadConfig();
    config.apiKey = apiKey;
    saveConfig(config);
    console.log("API key saved. You can now use renaiss-shipflow commands.");
  });
  auth.command("logout").description("Clear stored credentials").action(() => {
    clearConfig();
    console.log("Logged out. Stored credentials cleared.");
  });
  auth.command("status").description("Show current authentication status").action(() => {
    const key = resolveApiKey();
    if (key) {
      const masked = key.substring(0, 8) + "..." + key.substring(key.length - 4);
      console.log(`Authenticated with key: ${masked}`);
      if (process.env.SHIPFLOW_API_KEY) {
        console.log("  (from SHIPFLOW_API_KEY env var)");
      } else {
        console.log("  (from ~/.config/renaissshipflow/config.json)");
      }
    } else {
      console.log("Not authenticated. Run: renaiss-shipflow auth login");
    }
  });
}

// src/client.ts
class ApiError extends Error {
  status;
  body;
  constructor(status, body) {
    super(`API error ${status}: ${body}`);
    this.status = status;
    this.body = body;
    this.name = "ApiError";
  }
}

class ClaimConflictError extends Error {
  holder;
  constructor(holder) {
    super(holder ? `issue claimed by ${holder.actor}${holder.agent ? ` (${holder.agent})` : ""} until ${holder.expiresAt}` : "issue already claimed");
    this.holder = holder;
    this.name = "ClaimConflictError";
  }
}

class ShipFlowClient {
  baseUrl;
  apiKey;
  constructor(opts) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.apiKey = opts.jwt || opts.apiKey;
  }
  async request(method, path, body) {
    const headers = {
      "Content-Type": "application/json"
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) {
      const text2 = await res.text().catch(() => res.statusText);
      throw new ApiError(res.status, text2);
    }
    const text = await res.text();
    if (!text)
      return;
    return JSON.parse(text);
  }
  async listRepos(org) {
    return this.request("GET", `/api/v1/orgs/${encodeURIComponent(org)}/repos`);
  }
  async getRepo(org, repo) {
    return this.request("GET", `/api/v1/orgs/${encodeURIComponent(org)}/repos/${encodeURIComponent(repo)}`);
  }
  async updateWorkflow(org, repo, workflowType, body) {
    return this.request("PUT", `/api/v1/orgs/${encodeURIComponent(org)}/repos/${repo}/workflows/${encodeURIComponent(workflowType)}`, body);
  }
  async listActivity(org, params) {
    const qs = new URLSearchParams;
    if (params?.cursor)
      qs.set("cursor", params.cursor);
    if (params?.limit)
      qs.set("limit", String(params.limit));
    const query = qs.toString();
    return this.request("GET", `/api/v1/orgs/${encodeURIComponent(org)}/activity${query ? `?${query}` : ""}`);
  }
  async getStats(org) {
    return this.request("GET", `/api/v1/orgs/${encodeURIComponent(org)}/stats`);
  }
  async getOrg(org) {
    return this.request("GET", `/api/v1/orgs/${org}`);
  }
  async listChannels(org) {
    return this.request("GET", `/api/v1/orgs/${encodeURIComponent(org)}/channels`);
  }
  async addChannel(org, body) {
    return this.request("POST", `/api/v1/orgs/${encodeURIComponent(org)}/channels`, body);
  }
  async exchangeGhToken(ghToken) {
    return this.request("POST", `/api/v1/auth/token`, { access_token: ghToken });
  }
  async refreshJWT(refreshToken) {
    return this.request("POST", `/api/v1/auth/refresh`, { refreshToken });
  }
  async getRepoByFullName(org, owner, repo) {
    return this.request("GET", `/api/v1/orgs/${encodeURIComponent(org)}/repos/by-fullname/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
  }
  async getTriage(org, projectId, repo, issueNumber) {
    const qs = new URLSearchParams({ repo, issue: String(issueNumber) });
    return this.request("GET", `/api/v1/orgs/${encodeURIComponent(org)}/projects/${encodeURIComponent(projectId)}/triage?${qs}`);
  }
  async signal(org, projectId, refKind, number, action, body) {
    await this.request("POST", `/api/v1/orgs/${encodeURIComponent(org)}/projects/${encodeURIComponent(projectId)}/${refKind}/${number}/${action}`, body);
  }
  async attachEvidence(org, projectId, number, opts) {
    const form = new FormData;
    form.set("repo", opts.repo);
    if (opts.pr)
      form.set("pr", String(opts.pr));
    if (opts.previewUrl)
      form.set("previewUrl", opts.previewUrl);
    if (opts.caption)
      form.set("caption", opts.caption);
    for (const img of opts.images) {
      form.append("images", new Blob([img.data]), img.filename);
    }
    const headers = {};
    if (this.apiKey)
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    const res = await fetch(`${this.baseUrl}/api/v1/orgs/${encodeURIComponent(org)}/projects/${encodeURIComponent(projectId)}/issues/${number}/evidence`, { method: "POST", headers, body: form });
    if (!res.ok) {
      throw new ApiError(res.status, await res.text().catch(() => res.statusText));
    }
    return res.json();
  }
  async claimIssue(org, projectId, number, body) {
    try {
      const res = await this.request("POST", `/api/v1/orgs/${encodeURIComponent(org)}/projects/${encodeURIComponent(projectId)}/issues/${number}/claim`, body);
      return res?.claim ?? null;
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        let holder;
        try {
          holder = JSON.parse(e.body).holder;
        } catch {}
        throw new ClaimConflictError(holder);
      }
      throw e;
    }
  }
  async listClaims(org, projectId) {
    const res = await this.request("GET", `/api/v1/orgs/${encodeURIComponent(org)}/projects/${encodeURIComponent(projectId)}/claims`);
    return res?.claims ?? [];
  }
  async triggerRelease(org, projectId, body) {
    return this.request("POST", `/api/v1/orgs/${encodeURIComponent(org)}/projects/${encodeURIComponent(projectId)}/release`, body);
  }
  async triggerWorkflow(org, projectId, workflowType, inputs) {
    return this.request("POST", `/api/v1/orgs/${encodeURIComponent(org)}/projects/${encodeURIComponent(projectId)}/workflows/${encodeURIComponent(workflowType)}/trigger`, inputs);
  }
  async getProjectStatus(org, projectId) {
    return this.request("GET", `/api/v1/orgs/${encodeURIComponent(org)}/projects/${encodeURIComponent(projectId)}/status`);
  }
}

// src/commands/helpers.ts
function getClient(cmd) {
  const opts = cmd.optsWithGlobals();
  const apiKey = resolveApiKey();
  if (!apiKey) {
    console.error("Error: No API key found. Set SHIPFLOW_API_KEY env var or run: renaiss-shipflow auth login");
    process.exit(1);
  }
  return new ShipFlowClient({
    baseUrl: resolveApiUrl(opts.apiUrl),
    apiKey
  });
}
function getOrg(cmd) {
  return cmd.optsWithGlobals().org || "default";
}
function getFormat(cmd) {
  const opts = cmd.opts();
  if (opts.json)
    return "json";
  if (opts.yaml)
    return "yaml";
  return "table";
}
function handleError(err) {
  if (err instanceof Error) {
    console.error(`Error: ${err.message}`);
  } else {
    console.error("An unknown error occurred.");
  }
  process.exit(1);
}

// src/output.ts
function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}
function printYaml(data) {
  console.log(toYaml(data, 0));
}
function toYaml(value, indent) {
  const prefix = "  ".repeat(indent);
  if (value === null || value === undefined)
    return "null";
  if (typeof value === "string")
    return value.includes(`
`) ? `|
${value.split(`
`).map((l) => prefix + "  " + l).join(`
`)}` : value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0)
      return "[]";
    return value.map((item) => {
      const inner = toYaml(item, indent + 1);
      if (typeof item === "object" && item !== null && !Array.isArray(item)) {
        const lines = inner.split(`
`);
        return `${prefix}- ${lines[0]}
${lines.slice(1).map((l) => prefix + "  " + l).join(`
`)}`;
      }
      return `${prefix}- ${inner}`;
    }).join(`
`);
  }
  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0)
      return "{}";
    return entries.map(([k, v]) => {
      const inner = toYaml(v, indent + 1);
      if (typeof v === "object" && v !== null) {
        return `${prefix}${k}:
${inner}`;
      }
      return `${prefix}${k}: ${inner}`;
    }).join(`
`);
  }
  return String(value);
}
function printTable(headers, rows) {
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => (r[i] || "").length)));
  const sep = widths.map((w) => "-".repeat(w + 2)).join("+");
  const formatRow = (row) => row.map((cell, i) => ` ${(cell || "").padEnd(widths[i])} `).join("|");
  console.log(formatRow(headers));
  console.log(sep);
  rows.forEach((row) => console.log(formatRow(row)));
}
function formatOutput(format, data, tableFormatter) {
  switch (format) {
    case "json":
      printJson(data);
      break;
    case "yaml":
      printYaml(data);
      break;
    case "table":
      tableFormatter();
      break;
  }
}

// src/commands/repos.ts
function registerRepoCommands(program2) {
  const repos = program2.command("repos").description("Manage tracked repositories");
  repos.command("list").description("List tracked repositories").option("--json", "Output as JSON").option("--yaml", "Output as YAML").action(async function() {
    try {
      const client = getClient(this);
      const org = getOrg(this);
      const data = await client.listRepos(org);
      const format = getFormat(this);
      formatOutput(format, data, () => {
        if (data.length === 0) {
          console.log("No repositories tracked. Use: renaiss-shipflow repos add <owner/repo>");
          return;
        }
        printTable(["Name", "Full Name", "Active", "Workflows", "Last Activity"], data.map((r) => [
          r.name,
          r.fullName,
          r.isActive ? "yes" : "no",
          `${r.enabledWorkflowCount}/${r.workflowCount}`,
          r.lastActivityAt ?? "never"
        ]));
      });
    } catch (err) {
      handleError(err);
    }
  });
  repos.command("add").description("Start tracking a new repository").argument("<repo>", "Full repository name (owner/repo)").action(async function(repo) {
    try {
      const client = getClient(this);
      const org = getOrg(this);
      await client.updateWorkflow(org, repo, "issue_triage", { enabled: false });
      console.log(`Repository "${repo}" is now tracked by RenaissShipFlow.`);
    } catch (err) {
      handleError(err);
    }
  });
  repos.command("show").description("Show details for a specific repository").argument("<repo>", "Repository name").option("--json", "Output as JSON").option("--yaml", "Output as YAML").action(async function(repo) {
    try {
      const client = getClient(this);
      const org = getOrg(this);
      const data = await client.getRepo(org, repo);
      const format = getFormat(this);
      formatOutput(format, data, () => {
        console.log(`Repository: ${data.fullName}`);
        console.log(`  Active: ${data.isActive ? "yes" : "no"}`);
        console.log(`  URL: ${data.htmlUrl}`);
        console.log(`  Created: ${data.createdAt}`);
        console.log(`  Workflows:`);
        if (data.workflowConfigs.length === 0) {
          console.log("    (none configured)");
        } else {
          for (const wf of data.workflowConfigs) {
            const status = wf.enabled ? "enabled" : "disabled";
            const lastRun = wf.lastRunAt ?? "never";
            console.log(`    - ${wf.workflowType}: ${status} (last run: ${lastRun})`);
          }
        }
      });
    } catch (err) {
      handleError(err);
    }
  });
}

// src/commands/workflows.ts
function registerWorkflowCommands(program2) {
  const workflows = program2.command("workflows").description("Manage repository workflows");
  workflows.command("list").description("List workflows for a repository").requiredOption("--repo <repo>", "Repository name").option("--json", "Output as JSON").option("--yaml", "Output as YAML").action(async function() {
    try {
      const client = getClient(this);
      const org = getOrg(this);
      const opts = this.opts();
      const repo = await client.getRepo(org, opts.repo);
      const format = getFormat(this);
      formatOutput(format, repo.workflowConfigs, () => {
        if (repo.workflowConfigs.length === 0) {
          console.log("No workflows configured for this repository.");
          return;
        }
        printTable(["Type", "Enabled", "Last Run", "Status"], repo.workflowConfigs.map((wf) => [
          wf.workflowType,
          wf.enabled ? "yes" : "no",
          wf.lastRunAt ?? "never",
          wf.lastRunStatus ?? "-"
        ]));
      });
    } catch (err) {
      handleError(err);
    }
  });
  workflows.command("enable").description("Enable a workflow for a repository").argument("<type>", "Workflow type (e.g. issue_triage, patch_notes)").requiredOption("--repo <repo>", "Repository name").action(async function(type) {
    try {
      const client = getClient(this);
      const org = getOrg(this);
      const opts = this.opts();
      await client.updateWorkflow(org, opts.repo, type, { enabled: true });
      console.log(`Workflow "${type}" enabled on ${opts.repo}.`);
    } catch (err) {
      handleError(err);
    }
  });
  workflows.command("disable").description("Disable a workflow for a repository").argument("<type>", "Workflow type (e.g. issue_triage, patch_notes)").requiredOption("--repo <repo>", "Repository name").action(async function(type) {
    try {
      const client = getClient(this);
      const org = getOrg(this);
      const opts = this.opts();
      await client.updateWorkflow(org, opts.repo, type, { enabled: false });
      console.log(`Workflow "${type}" disabled on ${opts.repo}.`);
    } catch (err) {
      handleError(err);
    }
  });
  workflows.command("configure").description("Configure workflow settings").argument("<type>", "Workflow type").requiredOption("--repo <repo>", "Repository name").option("--set <key=value...>", "Set configuration values", collectKeyValue, {}).action(async function(type) {
    try {
      const client = getClient(this);
      const org = getOrg(this);
      const opts = this.opts();
      const settings = opts.set;
      if (Object.keys(settings).length === 0) {
        console.error("Error: At least one --set key=value is required.");
        process.exit(1);
      }
      await client.updateWorkflow(org, opts.repo, type, { settings });
      console.log(`Workflow "${type}" configured on ${opts.repo}.`);
      for (const [k, v] of Object.entries(settings)) {
        console.log(`  ${k} = ${v}`);
      }
    } catch (err) {
      handleError(err);
    }
  });
}
function collectKeyValue(value, prev) {
  const idx = value.indexOf("=");
  if (idx === -1) {
    console.error(`Error: Invalid --set format "${value}". Expected key=value.`);
    process.exit(1);
  }
  prev[value.substring(0, idx)] = value.substring(idx + 1);
  return prev;
}

// src/commands/activity.ts
function registerActivityCommand(program2) {
  program2.command("activity").description("View recent workflow activity").option("--last <n>", "Number of recent events to show", "10").option("--json", "Output as JSON").option("--yaml", "Output as YAML").action(async function() {
    try {
      const client = getClient(this);
      const org = getOrg(this);
      const opts = this.opts();
      const limit = parseInt(opts.last, 10) || 10;
      const format = getFormat(this);
      const result = await client.listActivity(org, { limit });
      const events = result.data;
      formatOutput(format, events, () => {
        if (events.length === 0) {
          console.log("No recent activity.");
          return;
        }
        printTable(["Time", "Repo", "Workflow", "Status", "Trigger"], events.map((e) => [
          e.startedAt,
          e.repoName || e.repositoryId || "-",
          e.workflowType,
          e.status,
          e.triggerEvent || "-"
        ]));
      });
    } catch (err) {
      handleError(err);
    }
  });
}

// src/commands/channels.ts
function registerChannelCommands(program2) {
  const channels = program2.command("channels").description("Manage notification channels");
  channels.command("list").description("List notification channels").option("--json", "Output as JSON").option("--yaml", "Output as YAML").action(async function() {
    try {
      const client = getClient(this);
      const org = getOrg(this);
      const data = await client.listChannels(org);
      const format = getFormat(this);
      formatOutput(format, data, () => {
        if (data.length === 0) {
          console.log("No notification channels configured.");
          return;
        }
        printTable(["ID", "Type", "Label", "Identifier", "Created"], data.map((c) => [
          c.id,
          c.channelType,
          c.label,
          c.channelIdentifier,
          c.createdAt
        ]));
      });
    } catch (err) {
      handleError(err);
    }
  });
  channels.command("add").description("Add a notification channel").requiredOption("--type <type>", "Channel type (discord, slack, webhook, email)").requiredOption("--identifier <id>", "Channel identifier (e.g. channel ID, URL)").requiredOption("--label <name>", "Display label").action(async function() {
    try {
      const client = getClient(this);
      const org = getOrg(this);
      const opts = this.opts();
      const channel = await client.addChannel(org, {
        channelType: opts.type,
        channelIdentifier: opts.identifier,
        label: opts.label
      });
      console.log(`Channel "${channel.label}" (${channel.channelType}) added.`);
      console.log(`  ID: ${channel.id}`);
    } catch (err) {
      handleError(err);
    }
  });
}

// src/commands/stats.ts
function registerStatsCommand(program2) {
  program2.command("stats").description("Show usage statistics for the current billing period").option("--json", "Output as JSON").option("--yaml", "Output as YAML").action(async function() {
    try {
      const client = getClient(this);
      const org = getOrg(this);
      const format = getFormat(this);
      const stats = await client.getStats(org);
      formatOutput(format, stats, () => {
        console.log(`Usage Statistics`);
        console.log(`  Total Executions: ${stats.totalExecutions}`);
        console.log(`  Succeeded:        ${stats.successCount}`);
        console.log(`  Failed:           ${stats.failureCount}`);
        console.log(`  Active Repos:     ${stats.activeRepos}`);
        if (stats.workflowBreakdown && Object.keys(stats.workflowBreakdown).length > 0) {
          console.log(`  By Workflow:`);
          for (const [type, count] of Object.entries(stats.workflowBreakdown)) {
            console.log(`    ${type}: ${count}`);
          }
        }
      });
    } catch (err) {
      handleError(err);
    }
  });
}

// src/commands/trigger.ts
function registerTriggerCommand(program2) {
  program2.command("trigger").description("Manually trigger a workflow").argument("<workflow-type>", "Workflow type to trigger (e.g. regression_tests)").requiredOption("--repo <repo>", "Repository name").action(async function(workflowType) {
    try {
      const client = getClient(this);
      const org = getOrg(this);
      const opts = this.opts();
      await client.updateWorkflow(org, opts.repo, workflowType, {
        settings: { _trigger: true }
      });
      console.log(`Workflow "${workflowType}" triggered on ${opts.repo}.`);
    } catch (err) {
      handleError(err);
    }
  });
}

// src/gh.ts
import { execSync, spawnSync } from "node:child_process";
var FIELDS = "number,title,body,state,labels,assignees,url,createdAt";
var _exec = execSync;
var _spawn = spawnSync;
function ghInstalled() {
  try {
    _exec("command -v gh", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
function ghAuthStatus() {
  try {
    _exec("gh auth status", { stdio: "ignore" });
    return "logged-in";
  } catch {
    return "logged-out";
  }
}
function ghAuthToken() {
  return _exec("gh auth token").toString().trim();
}
function ghAuthLogin() {
  const r = _spawn("gh", ["auth", "login"], { stdio: "inherit" });
  return r.status === 0;
}
function ghIssueView(repo, number) {
  const out = _exec(`gh issue view ${number} --repo ${shellQuote(repo)} --json ${FIELDS}`).toString();
  return JSON.parse(out);
}
function ghIssueCreate(repo, title, body) {
  const out = _exec(`gh issue create --repo ${shellQuote(repo)} --title ${shellQuote(title)} --body ${shellQuote(body)} --json number,url`).toString();
  return JSON.parse(out);
}
function ghIssueList(repo, state = "open", limit = 30) {
  const out = _exec(`gh issue list --repo ${shellQuote(repo)} --state ${state} --limit ${limit} --json ${FIELDS}`).toString();
  return JSON.parse(out);
}
function ghPRCreate(args) {
  const parts = ["gh pr create", `--repo ${shellQuote(args.repo)}`, `--body ${shellQuote(args.body)}`];
  if (args.title)
    parts.push(`--title ${shellQuote(args.title)}`);
  if (args.base)
    parts.push(`--base ${shellQuote(args.base)}`);
  if (args.head)
    parts.push(`--head ${shellQuote(args.head)}`);
  if (args.draft)
    parts.push(`--draft`);
  const out = _exec(parts.join(" ")).toString().trim();
  const number = parseInt(out.split("/").pop() || "0", 10);
  return { url: out, number };
}
function ghPRMerge(repo, number, mode = "squash", deleteBranch = true) {
  const flags = [`--${mode}`];
  if (deleteBranch)
    flags.push("--delete-branch");
  _exec(`gh pr merge ${number} --repo ${shellQuote(repo)} ${flags.join(" ")}`, { stdio: "inherit" });
  const view = _exec(`gh pr view ${number} --repo ${shellQuote(repo)} --json mergeCommit`).toString();
  const parsed = JSON.parse(view);
  return { mergedSha: parsed.mergeCommit?.oid ?? "" };
}
var PR_FIELDS = "number,title,headRefName,url,isDraft,reviewDecision,reviews,comments,statusCheckRollup,closingIssuesReferences,updatedAt";
function ghPRListMine(repo, limit = 30) {
  const out = _exec(`gh pr list --repo ${shellQuote(repo)} --author @me --state open --limit ${limit} --json ${PR_FIELDS}`).toString();
  return JSON.parse(out);
}
function ghCurrentLogin() {
  try {
    return _exec("gh api user --jq .login").toString().trim();
  } catch {
    return "";
  }
}
function ghIssueListByLabel(repo, label, limit = 30) {
  const out = _exec(`gh issue list --repo ${shellQuote(repo)} --state open --label ${shellQuote(label)} --limit ${limit} --json ${FIELDS},comments`).toString();
  return JSON.parse(out);
}
function shellQuote(s) {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

// src/prompts.ts
import { createInterface } from "node:readline";
async function promptText(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => {
    rl.question(question, (a) => {
      rl.close();
      res(a.trim());
    });
  });
}
async function promptSelect(question, options) {
  console.log(question);
  options.forEach((o, i) => console.log(`  ${i + 1}. ${o}`));
  const ans = await promptText(`Choice (1-${options.length}): `);
  const n = parseInt(ans, 10);
  if (Number.isNaN(n) || n < 1 || n > options.length) {
    throw new Error(`Invalid choice: ${ans}`);
  }
  return n - 1;
}

// src/commands/login.ts
function registerLoginCommand(program2) {
  program2.command("login").description("Sign in to ShipFlow (uses gh auth)").option("--no-gh-bootstrap", "Don't auto-run `gh auth login` if gh isn't logged in").action(async (opts) => {
    if (!ghInstalled()) {
      console.error("gh (GitHub CLI) is not installed. See https://cli.github.com/");
      process.exit(1);
    }
    if (ghAuthStatus() === "logged-out") {
      if (!opts.ghBootstrap) {
        console.error("gh is not logged in. Run `gh auth login` first or omit --no-gh-bootstrap.");
        process.exit(1);
      }
      if (!ghAuthLogin()) {
        console.error("gh auth login was cancelled or failed.");
        process.exit(1);
      }
    }
    const ghToken = ghAuthToken();
    if (!ghToken) {
      console.error("Could not read gh auth token.");
      process.exit(1);
    }
    const apiUrl = resolveApiUrl(program2.opts().apiUrl);
    const client = new ShipFlowClient({ baseUrl: apiUrl });
    const result = await client.exchangeGhToken(ghToken);
    let chosen = result.tenants[0];
    if (result.tenants.length > 1) {
      const idx = await promptSelect("You belong to multiple ShipFlow tenants. Pick one:", result.tenants.map((t) => `${t.tenant.displayName} (${t.tenant.githubOrg})`));
      chosen = result.tenants[idx];
    }
    saveCredentials({
      jwt: chosen.token,
      refreshToken: chosen.refreshToken,
      tenantId: chosen.tenant.id,
      org: chosen.tenant.githubOrg,
      expiresAt: Math.floor(Date.now() / 1000) + 24 * 60 * 60
    });
    const cfg = loadConfig();
    cfg.defaultOrg = chosen.tenant.githubOrg;
    cfg.apiUrl = apiUrl;
    saveConfig(cfg);
    console.log(`Signed in as @${process.env.USER ?? "you"} for ${chosen.tenant.displayName} (${apiUrl}).`);
  });
}

// src/commands/init.ts
import { resolve as resolve2 } from "node:path";

// src/project.ts
import { execSync as execSync2 } from "node:child_process";
import { resolve } from "node:path";
function parseGitRemote(url) {
  let m = url.match(/^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (m)
    return { owner: m[1], repo: m[2] };
  m = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/);
  if (m)
    return { owner: m[1], repo: m[2] };
  return null;
}
function getCwdRepoRoot() {
  try {
    return execSync2("git rev-parse --show-toplevel", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return null;
  }
}
function getCwdRemote() {
  try {
    const url = execSync2("git remote get-url origin", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    return parseGitRemote(url);
  } catch {
    return null;
  }
}
async function resolveProject(client, creds) {
  const root = getCwdRepoRoot();
  if (!root) {
    throw new Error("Not in a git repository.");
  }
  const remote = getCwdRemote();
  if (!remote) {
    throw new Error("origin remote is not a github.com URL.");
  }
  const repoFullName = `${remote.owner}/${remote.repo}`;
  const cacheKey = projectCacheKeyForRepoPath(resolve(root));
  const cache = loadProjectCache();
  if (cache[cacheKey])
    return { ...cache[cacheKey], repoFullName };
  const lookup = await client.getRepoByFullName(creds.org, remote.owner, remote.repo);
  if (!lookup.projects || lookup.projects.length === 0) {
    throw new Error(`Repo ${repoFullName} is not in any ShipFlow project. Run \`renaiss-shipflow init\`.`);
  }
  let chosen = lookup.projects[0];
  if (lookup.projects.length > 1) {
    const idx = await promptSelect(`Repo ${repoFullName} is in multiple ShipFlow projects. Pick one:`, lookup.projects.map((p) => p.name));
    chosen = lookup.projects[idx];
  }
  const entry = {
    projectId: chosen.id,
    projectName: chosen.name,
    org: creds.org,
    tenantId: creds.tenantId
  };
  cache[cacheKey] = entry;
  saveProjectCache(cache);
  return { ...entry, repoFullName };
}

// src/commands/init.ts
function registerInitCommand(program2) {
  program2.command("init").description("Link the current repo to a ShipFlow project").action(async () => {
    const auth = resolveAuthToken();
    const creds = loadCredentials();
    if (!auth || !creds) {
      console.error("Not signed in. Run: renaiss-shipflow login");
      process.exit(1);
    }
    const root = getCwdRepoRoot();
    const remote = getCwdRemote();
    if (!root || !remote) {
      console.error("Not in a git repo with a github.com origin remote.");
      process.exit(1);
    }
    const client = new ShipFlowClient({ baseUrl: resolveApiUrl(program2.opts().apiUrl), jwt: auth.token });
    const lookup = await client.getRepoByFullName(creds.org, remote.owner, remote.repo);
    if (!lookup.projects?.length) {
      console.error(`Repo ${remote.owner}/${remote.repo} is not in any project on this org.`);
      console.error("Add it via the dashboard first, then re-run init.");
      process.exit(1);
    }
    const chosen = lookup.projects.length === 1 ? lookup.projects[0] : lookup.projects[await promptSelect("Pick a project to link:", lookup.projects.map((p) => p.name))];
    const cache = loadProjectCache();
    cache[projectCacheKeyForRepoPath(resolve2(root))] = {
      projectId: chosen.id,
      projectName: chosen.name,
      org: creds.org,
      tenantId: creds.tenantId
    };
    saveProjectCache(cache);
    console.log(`Linked ${remote.owner}/${remote.repo} → ${chosen.name}.`);
  });
}

// src/commands/status.ts
function registerStatusCommand(program2) {
  program2.command("status").description("Show ShipFlow status for the current project").option("--json", "Output JSON").action(async (opts) => {
    const auth = resolveAuthToken();
    const creds = loadCredentials();
    if (!auth || !creds) {
      console.error("Not signed in. Run: renaiss-shipflow login");
      process.exit(1);
    }
    const client = new ShipFlowClient({ baseUrl: resolveApiUrl(program2.opts().apiUrl), jwt: auth.token });
    const project = await resolveProject(client, creds);
    const status = await client.getProjectStatus(creds.org, project.projectId);
    if (opts.json) {
      console.log(JSON.stringify({ project, status }, null, 2));
      return;
    }
    console.log(`Project: ${project.projectName}`);
    console.log(`Repo:    ${project.repoFullName}`);
    console.log(`Org:     ${project.org}`);
    const recent = status.recentWorkflows ?? [];
    console.log(`Recent workflows: ${recent.length}`);
    const summaries = status.latestSummaries ?? {};
    for (const [k, v] of Object.entries(summaries)) {
      const summary = v?.data?.exec_summary || v?.summary || "(no summary)";
      console.log(`  ${k}: ${String(summary).split(`
`)[0]}`);
    }
  });
}

// src/commands/issues.ts
function registerIssuesCommand(program2) {
  const issues = program2.command("issues").description("Issue listing");
  issues.command("list").description("List open issues for the current repo, with ShipFlow triage overlay").option("--state <state>", "Issue state", "open").option("--limit <n>", "Max results", "30").option("--json", "Output JSON").action(async (opts) => {
    const auth = resolveAuthToken();
    const creds = loadCredentials();
    if (!auth || !creds) {
      console.error("Not signed in. Run: renaiss-shipflow login");
      process.exit(1);
    }
    const client = new ShipFlowClient({ baseUrl: resolveApiUrl(program2.opts().apiUrl), jwt: auth.token });
    const project = await resolveProject(client, creds);
    const list = ghIssueList(project.repoFullName, opts.state, parseInt(opts.limit, 10));
    if (opts.json) {
      console.log(JSON.stringify({ project, issues: list }, null, 2));
      return;
    }
    for (const i of list) {
      console.log(`#${i.number}  ${i.title}`);
      if (i.labels.length)
        console.log(`     ${i.labels.map((l) => l.name).join(", ")}`);
    }
  });
}

// src/commands/issue.ts
import { hostname } from "node:os";
import { readFileSync as readFileSync2 } from "node:fs";
import { basename } from "node:path";

// src/issue-order.ts
var PRIORITY_RANK = { critical: 4, high: 3, medium: 2, low: 1 };
var SEVERITY_RANK = { blocking: 4, major: 3, minor: 2, cosmetic: 1 };
function labelRank(labels, prefix, ranks) {
  let best = 0;
  for (const l of labels) {
    const name = l.name.toLowerCase();
    if (name.startsWith(prefix))
      best = Math.max(best, ranks[name.slice(prefix.length)] ?? 0);
  }
  return best;
}
function sortIssuesForPickup(issues) {
  return [...issues].sort((a, b) => {
    const byPriority = labelRank(b.labels, "priority:", PRIORITY_RANK) - labelRank(a.labels, "priority:", PRIORITY_RANK);
    if (byPriority !== 0)
      return byPriority;
    const bySeverity = labelRank(b.labels, "severity:", SEVERITY_RANK) - labelRank(a.labels, "severity:", SEVERITY_RANK);
    if (bySeverity !== 0)
      return bySeverity;
    return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
  });
}

// src/commands/issue.ts
function registerIssueCommand(program2) {
  const issue = program2.command("issue").description("Issue actions");
  issue.command("create").description("Open a new issue (and signal ShipFlow)").option("--repo <fullname>", "Override target repo").option("--title <title>", "Issue title").option("--body <body>", "Issue body (- for stdin)").action(async (opts) => {
    const ctx = await loadCtx(program2);
    const repo = opts.repo ?? ctx.project.repoFullName;
    const title = opts.title ?? await promptText("Title: ");
    const body = opts.body === "-" ? await readStdin() : opts.body ?? "";
    const created = ghIssueCreate(repo, title, body);
    console.log(created.url);
  });
  issue.command("work <number>").description("Exclusively claim an issue (lock + dump context); exits 3 when another agent holds it").option("--repo <fullname>", "Override target repo").option("--agent <name>", "Agent label recorded on the claim (default: $SHIPFLOW_AGENT or hostname)").option("--ttl <minutes>", "Claim lifetime in minutes (default 120)").option("--json", "Output JSON").action(async (numberStr, opts) => {
    const ctx = await loadCtx(program2);
    const number = parseInt(numberStr, 10);
    const repo = opts.repo ?? ctx.project.repoFullName;
    const agent = opts.agent ?? process.env.SHIPFLOW_AGENT ?? hostname();
    try {
      await ctx.client.claimIssue(ctx.creds.org, ctx.project.projectId, number, {
        repo,
        agent,
        ttlMinutes: opts.ttl ? parseInt(opts.ttl, 10) : undefined
      });
    } catch (e) {
      if (e instanceof ClaimConflictError) {
        console.error(`⛔ #${number} is taken: ${e.message}`);
        process.exit(3);
      }
      console.warn(`Claim failed (continuing unlocked): ${e.message}`);
    }
    const issueData = ghIssueView(repo, number);
    const triage = await ctx.client.getTriage(ctx.creds.org, ctx.project.projectId, repo, number).catch(() => null);
    printIssueContext(issueData, triage, repo, ctx.project, opts.json);
  });
  issue.command("next").description("Pick & claim the next open, unclaimed issue (for the work loop); exits 4 when none remain").option("--repo <fullname>", "Override target repo").option("--label <label>", "Only consider issues with this label").option("--assignee <login>", "Only consider issues assigned to this user").option("--agent <name>", "Agent label recorded on the claim (default: $SHIPFLOW_AGENT or hostname)").option("--ttl <minutes>", "Claim lifetime in minutes (default 120)").option("--json", "Output JSON").action(async (opts) => {
    const ctx = await loadCtx(program2);
    const repo = opts.repo ?? ctx.project.repoFullName;
    const agent = opts.agent ?? process.env.SHIPFLOW_AGENT ?? hostname();
    const open = ghIssueList(repo, "open", 50);
    const claims = await ctx.client.listClaims(ctx.creds.org, ctx.project.projectId).catch(() => []);
    const claimed = new Set(claims.filter((c) => c.repo === repo).map((c) => c.issueNumber));
    const matching = open.filter((i) => {
      if (claimed.has(i.number))
        return false;
      if (opts.label && !i.labels.some((l) => l.name === opts.label))
        return false;
      if (opts.assignee && !i.assignees.some((a) => a.login === opts.assignee))
        return false;
      return true;
    });
    const candidates = sortIssuesForPickup(matching);
    for (const cand of candidates) {
      try {
        await ctx.client.claimIssue(ctx.creds.org, ctx.project.projectId, cand.number, {
          repo,
          agent,
          ttlMinutes: opts.ttl ? parseInt(opts.ttl, 10) : undefined
        });
      } catch (e) {
        if (e instanceof ClaimConflictError)
          continue;
        console.warn(`Claim failed for #${cand.number} (skipping): ${e.message}`);
        continue;
      }
      const issueData = ghIssueView(repo, cand.number);
      const triage = await ctx.client.getTriage(ctx.creds.org, ctx.project.projectId, repo, cand.number).catch(() => null);
      printIssueContext(issueData, triage, repo, ctx.project, opts.json);
      return;
    }
    if (opts.json) {
      console.log(JSON.stringify({ issue: null, reason: "no_actionable_issues" }, null, 2));
    } else {
      console.log("✅ No actionable issues — every open issue is claimed or filtered out.");
    }
    process.exit(4);
  });
  issue.command("done <number>").description("Release an issue (signal only)").option("--reason <reason>", "Why you're releasing it (e.g. blocked, finished)").option("--repo <fullname>", "Override target repo").action(async (numberStr, opts) => {
    const ctx = await loadCtx(program2);
    const number = parseInt(numberStr, 10);
    const repo = opts.repo ?? ctx.project.repoFullName;
    await ctx.client.signal(ctx.creds.org, ctx.project.projectId, "issues", number, "release-claim", { repo, reason: opts.reason ?? "" });
    console.log(`Released #${number}.`);
  });
  issue.command("evidence <number>").description("Attach testing screenshots/video to an issue (reporter thread + GitHub comment)").option("--image <path...>", "Screenshot file(s)").option("--file <path...>", "Any media file(s) — screenshots or video (mp4/mov/webm)").option("--pr <n>", "Related PR number").option("--preview-url <url>", "Testing site URL").option("--caption <text>", "Short note shown with the evidence").option("--repo <fullname>", "Override target repo").option("--json", "Output JSON").action(async (numberStr, opts) => {
    const paths = [...opts.file ?? [], ...opts.image ?? []];
    if (!paths.length) {
      console.error("At least one --file (or --image) is required.");
      process.exit(1);
    }
    const ctx = await loadCtx(program2);
    const number = parseInt(numberStr, 10);
    const repo = opts.repo ?? ctx.project.repoFullName;
    const images = paths.slice(0, 4).map((p) => ({
      filename: basename(p),
      data: new Uint8Array(readFileSync2(p))
    }));
    const res = await ctx.client.attachEvidence(ctx.creds.org, ctx.project.projectId, number, {
      repo,
      pr: opts.pr ? parseInt(opts.pr, 10) : undefined,
      previewUrl: opts.previewUrl,
      caption: opts.caption,
      images
    });
    if (opts.json) {
      console.log(JSON.stringify(res, null, 2));
      return;
    }
    const where = [];
    if (res.threadNotified)
      where.push("reporter thread");
    if (res.githubCommented)
      where.push("GitHub issue comment");
    console.log(`\uD83E\uDDEA Evidence delivered to: ${where.join(" + ") || "nowhere (check server logs)"}`);
    for (const u of res.threadImageUrls ?? [])
      console.log(`  ${u}`);
  });
}
function printIssueContext(issueData, triage, repo, project, json) {
  if (json) {
    console.log(JSON.stringify({ issue: issueData, triage, project }, null, 2));
    return;
  }
  console.log(`Issue #${issueData.number} — "${issueData.title}"`);
  console.log(`Repo:  ${repo}`);
  console.log(`State: ${issueData.state} • Labels: ${issueData.labels.map((l) => l.name).join(", ") || "(none)"}`);
  console.log("");
  console.log(issueData.body || "(no body)");
  if (triage) {
    console.log(`
── ShipFlow context ──`);
    if (triage.priority)
      console.log(`Priority: ${triage.priority}`);
    if (triage.relatedFeatures?.length)
      console.log(`Features touched: ${triage.relatedFeatures.join(", ")}`);
    if (triage.relatedFiles?.length) {
      console.log("Files likely involved:");
      triage.relatedFiles.slice(0, 10).forEach((f) => console.log(`  ${f}`));
    }
    if (triage.relatedCommits?.length) {
      console.log("Recent commits in same area:");
      triage.relatedCommits.slice(0, 5).forEach((c) => console.log(`  ${c}`));
    }
  }
}
async function loadCtx(program2) {
  const auth = resolveAuthToken();
  const creds = loadCredentials();
  if (!auth || !creds) {
    console.error("Not signed in. Run: renaiss-shipflow login");
    process.exit(1);
  }
  const client = new ShipFlowClient({ baseUrl: resolveApiUrl(program2.opts().apiUrl), jwt: auth.token });
  const project = await resolveProject(client, creds);
  return { auth, creds, client, project };
}
async function readStdin() {
  const chunks = [];
  for await (const c of process.stdin)
    chunks.push(c);
  return Buffer.concat(chunks).toString("utf-8");
}

// src/commands/inbox.ts
var IN_PROGRESS_LABEL = "\uD83E\uDD16 in-progress";
var FAILING = new Set(["FAILURE", "TIMED_OUT", "CANCELLED", "ACTION_REQUIRED", "ERROR", "STARTUP_FAILURE"]);
function prAttentionReasons(pr, me) {
  const reasons = [];
  if (pr.reviewDecision === "CHANGES_REQUESTED")
    reasons.push("changes_requested");
  const failing = (pr.statusCheckRollup ?? []).some((c) => FAILING.has((c.conclusion ?? "").toUpperCase()) || FAILING.has((c.state ?? "").toUpperCase()));
  if (failing)
    reasons.push("ci_failing");
  const fromOthers = (a) => !!a.author && a.author.login !== me;
  const reviewFeedback = (pr.reviews ?? []).filter((r) => fromOthers(r) && (r.state === "CHANGES_REQUESTED" || r.state === "COMMENTED"));
  const otherComments = (pr.comments ?? []).filter(fromOthers);
  if (reviewFeedback.length || otherComments.length)
    reasons.push("review_comments");
  return reasons;
}
function issueNeedsReply(comments, me) {
  if (!comments?.length)
    return null;
  const last = comments[comments.length - 1];
  return last.author && last.author.login !== me ? last : null;
}
function registerInboxCommand(program2) {
  program2.command("inbox").description("Open PRs (review feedback / failing CI) and in-progress issues (new comments) needing follow-up before new work").option("--repo <fullname>", "Override target repo").option("--json", "Output JSON").action(async (opts) => {
    const auth = resolveAuthToken();
    const creds = loadCredentials();
    if (!auth || !creds) {
      console.error("Not signed in. Run: renaiss-shipflow login");
      process.exit(1);
    }
    const client = new ShipFlowClient({ baseUrl: resolveApiUrl(program2.opts().apiUrl), jwt: auth.token });
    const project = await resolveProject(client, creds);
    const repo = opts.repo ?? project.repoFullName;
    const me = ghCurrentLogin();
    const prs = ghPRListMine(repo).map((pr) => {
      const reasons = prAttentionReasons(pr, me);
      return {
        number: pr.number,
        title: pr.title,
        branch: pr.headRefName,
        url: pr.url,
        draft: pr.isDraft,
        reviewDecision: pr.reviewDecision || "none",
        closesIssues: (pr.closingIssuesReferences ?? []).map((i) => i.number),
        needsAttention: reasons.length > 0,
        reasons
      };
    });
    const issues = ghIssueListByLabel(repo, IN_PROGRESS_LABEL).map((i) => {
      const reply = issueNeedsReply(i.comments ?? [], me);
      return {
        number: i.number,
        title: i.title,
        url: i.url,
        newComment: reply ? { author: reply.author?.login, at: reply.createdAt } : null,
        needsAttention: !!reply
      };
    });
    const prAttn = prs.filter((p) => p.needsAttention).length;
    const issueAttn = issues.filter((i) => i.needsAttention).length;
    if (opts.json) {
      console.log(JSON.stringify({ repo, prs, issues, summary: { prsNeedingAttention: prAttn, issuesNeedingAttention: issueAttn } }, null, 2));
      return;
    }
    console.log(`\uD83D\uDCE5 Inbox for ${repo}`);
    console.log(`Open PRs: ${prs.length} (${prAttn} need attention) · in-progress issues: ${issues.length} (${issueAttn} with new comments)`);
    for (const p of prs)
      console.log(`  ${p.needsAttention ? "⚠️ " : "✓ "}PR #${p.number} — ${p.title}  [${p.reasons.join(", ") || "ok"}]`);
    for (const i of issues)
      console.log(`  ${i.needsAttention ? "\uD83D\uDCAC " : "✓ "}#${i.number} — ${i.title}${i.newComment ? `  (last: @${i.newComment.author})` : ""}`);
  });
}

// src/commands/config.ts
var KEYS = ["auto-issue"];
function registerConfigCommand(program2) {
  const config = program2.command("config").description("Get/set ShipFlow CLI preferences");
  config.command("set <key> <value>").description(`Set a preference. Keys: ${KEYS.join(", ")}`).action((key, value) => {
    if (key === "auto-issue") {
      const cfg = loadConfig();
      cfg.autoIssue = parseBool(value);
      saveConfig(cfg);
      console.log(`auto-issue = ${cfg.autoIssue}`);
      return;
    }
    console.error(`Unknown key: ${key} (supported: ${KEYS.join(", ")})`);
    process.exit(1);
  });
  config.command("get <key>").description("Read a preference (env vars override stored config)").option("--json", "Output JSON").action((key, opts) => {
    if (key === "auto-issue") {
      const v = resolveAutoIssue();
      console.log(opts.json ? JSON.stringify({ autoIssue: v }) : String(v));
      return;
    }
    console.error(`Unknown key: ${key} (supported: ${KEYS.join(", ")})`);
    process.exit(1);
  });
  config.command("list").description("Show all preferences (effective values)").option("--json", "Output JSON").action((opts) => {
    const settings = { autoIssue: resolveAutoIssue() };
    if (opts.json) {
      console.log(JSON.stringify(settings, null, 2));
      return;
    }
    console.log(`auto-issue: ${settings.autoIssue}`);
  });
}

// src/commands/claims.ts
function registerClaimsCommand(program2) {
  program2.command("claims").description("List active agent claims (who is working on what)").option("--json", "Output JSON").action(async (opts) => {
    const auth = resolveAuthToken();
    const creds = loadCredentials();
    if (!auth || !creds) {
      console.error("Not signed in. Run: renaiss-shipflow login");
      process.exit(1);
    }
    const client = new ShipFlowClient({ baseUrl: resolveApiUrl(program2.opts().apiUrl), jwt: auth.token });
    const project = await resolveProject(client, creds);
    const claims = await client.listClaims(creds.org, project.projectId);
    if (opts.json) {
      console.log(JSON.stringify({ claims }, null, 2));
      return;
    }
    if (claims.length === 0) {
      console.log("No active claims — every open issue is up for grabs.");
      return;
    }
    for (const c of claims) {
      const agent = c.agent ? ` (${c.agent})` : "";
      console.log(`#${c.issueNumber} ${c.repo} — ${c.actor}${agent}, expires ${c.expiresAt}`);
    }
  });
}

// src/commands/pr.ts
import { execSync as execSync3 } from "node:child_process";
function registerPRCommand(program2) {
  const pr = program2.command("pr").description("Pull request actions");
  pr.command("create").description("Open a PR; prepends ShipFlow context to the body and signals ShipFlow").option("--issue <n>", "Issue number this PR closes (auto-detected from branch if omitted)").option("--title <title>", "PR title").option("--body <body>", "PR body (added under ShipFlow header)").option("--base <ref>", "Base branch").option("--draft", "Create as draft").option("--preview-url <url>", "Testing/preview site for this PR (relayed to the issue reporter)").option("--json", "Output JSON").action(async (opts) => {
    const ctx = await loadCtx2(program2);
    const branch = currentBranch();
    const issueNumber = opts.issue ? parseInt(opts.issue, 10) : detectIssueFromBranch(branch);
    const triage = issueNumber ? await ctx.client.getTriage(ctx.creds.org, ctx.project.projectId, ctx.project.repoFullName, issueNumber).catch(() => null) : null;
    const header = buildShipFlowHeader(ctx.project.projectName, issueNumber, triage);
    const body = `${header}

${opts.body ?? ""}`;
    const created = ghPRCreate({ repo: ctx.project.repoFullName, body, title: opts.title, base: opts.base, head: branch, draft: opts.draft });
    try {
      await ctx.client.signal(ctx.creds.org, ctx.project.projectId, "prs", created.number, "opened", {
        repo: ctx.project.repoFullName,
        branch,
        headSha: execSync3("git rev-parse HEAD").toString().trim(),
        issueRefs: issueNumber ? [issueNumber] : [],
        previewUrl: opts.previewUrl ?? ""
      });
    } catch (e) {
      console.warn(`PR opened but ShipFlow signal failed: ${e.message}`);
    }
    if (opts.json) {
      console.log(JSON.stringify(created));
      return;
    }
    console.log(created.url);
  });
  pr.command("merge <number>").description("Merge a PR; signals ShipFlow (no downstream cascade)").option("--mode <mode>", "squash | merge | rebase", "squash").option("--keep-branch", "Don't delete the head branch").action(async (numberStr, opts) => {
    const ctx = await loadCtx2(program2);
    const number = parseInt(numberStr, 10);
    const result = ghPRMerge(ctx.project.repoFullName, number, opts.mode, !opts.keepBranch);
    try {
      await ctx.client.signal(ctx.creds.org, ctx.project.projectId, "prs", number, "merged", {
        repo: ctx.project.repoFullName,
        mergedSha: result.mergedSha
      });
    } catch (e) {
      console.warn(`Merged but ShipFlow signal failed: ${e.message}`);
    }
    console.log(`merged: ${result.mergedSha}`);
  });
}
async function loadCtx2(program2) {
  const auth = resolveAuthToken();
  const creds = loadCredentials();
  if (!auth || !creds) {
    console.error("Not signed in. Run: renaiss-shipflow login");
    process.exit(1);
  }
  const client = new ShipFlowClient({ baseUrl: resolveApiUrl(program2.opts().apiUrl), jwt: auth.token });
  const project = await resolveProject(client, creds);
  return { auth, creds, client, project };
}
function currentBranch() {
  return execSync3("git rev-parse --abbrev-ref HEAD").toString().trim();
}
function detectIssueFromBranch(branch) {
  const m = branch.match(/^(?:issue|fix|feat)\/(\d+)/);
  return m ? parseInt(m[1], 10) : undefined;
}
function buildShipFlowHeader(project, issue, triage) {
  const lines = ["## ShipFlow context", `- Project: ${project}`];
  if (issue)
    lines.push(`- Closes #${issue}`);
  if (triage?.priority)
    lines.push(`- Triage priority: ${triage.priority}`);
  if (triage?.relatedFeatures?.length)
    lines.push(`- Features: ${triage.relatedFeatures.join(", ")}`);
  return lines.join(`
`);
}

// src/commands/test.ts
import { spawnSync as spawnSync2 } from "node:child_process";
import { existsSync as existsSync2 } from "node:fs";
import { join as join2 } from "node:path";
function registerTestCommand(program2) {
  program2.command("test").description("Run the project's local test command (auto-detected)").allowUnknownOption().action(() => {
    const root = getCwdRepoRoot();
    if (!root) {
      console.error("Not in a git repo.");
      process.exit(1);
    }
    const runner = detectRunner(root);
    if (!runner) {
      console.error("Could not detect a test runner. Run your test command manually.");
      process.exit(2);
    }
    console.log(`> ${runner.cmd} ${runner.args.join(" ")}`);
    const r = spawnSync2(runner.cmd, runner.args, { stdio: "inherit", cwd: root });
    process.exit(r.status ?? 1);
  });
}
function detectRunner(root) {
  if (existsSync2(join2(root, "package.json"))) {
    if (existsSync2(join2(root, "bun.lockb")) || existsSync2(join2(root, "bun.lock")))
      return { cmd: "bun", args: ["test"] };
    if (existsSync2(join2(root, "pnpm-lock.yaml")))
      return { cmd: "pnpm", args: ["test"] };
    if (existsSync2(join2(root, "yarn.lock")))
      return { cmd: "yarn", args: ["test"] };
    return { cmd: "npm", args: ["test"] };
  }
  if (existsSync2(join2(root, "go.mod")))
    return { cmd: "go", args: ["test", "./..."] };
  if (existsSync2(join2(root, "Cargo.toml")))
    return { cmd: "cargo", args: ["test"] };
  if (existsSync2(join2(root, "pyproject.toml")) || existsSync2(join2(root, "pytest.ini")))
    return { cmd: "pytest", args: [] };
  return null;
}

// src/commands/regression.ts
import { execSync as execSync4 } from "node:child_process";
function registerRegressionCommand(program2) {
  program2.command("regression").description("Trigger ShipFlow's server-side regression test_runner").option("--ref <sha>", "Ref to test (defaults to current HEAD)").option("--json", "Output JSON").action(async (opts) => {
    const auth = resolveAuthToken();
    const creds = loadCredentials();
    if (!auth || !creds) {
      console.error("Not signed in. Run: renaiss-shipflow login");
      process.exit(1);
    }
    const ref = opts.ref ?? execSync4("git rev-parse HEAD").toString().trim();
    const client = new ShipFlowClient({ baseUrl: resolveApiUrl(program2.opts().apiUrl), jwt: auth.token });
    const project = await resolveProject(client, creds);
    const result = await client.triggerWorkflow(creds.org, project.projectId, "test_runner", { repo: project.repoFullName, ref });
    if (opts.json) {
      console.log(JSON.stringify(result));
      return;
    }
    console.log(`Regression run queued: ${result.runId}`);
  });
}

// src/commands/release.ts
import { execSync as execSync5 } from "node:child_process";
function registerReleaseCommand(program2) {
  program2.command("release").description("Trigger a ShipFlow release (patch_notes + regression + downstream workflows)").option("--tag <tag>", "Release tag (e.g. v0.7.3)").option("--base-tag <tag>", "Previous tag (auto-detect if omitted)").option("--env <env>", "Target environment (staging|prod)").option("--wait", "Block and stream status until terminal").option("--json", "Output JSON").action(async (opts) => {
    const auth = resolveAuthToken();
    const creds = loadCredentials();
    if (!auth || !creds) {
      console.error("Not signed in. Run: renaiss-shipflow login");
      process.exit(1);
    }
    const client = new ShipFlowClient({ baseUrl: resolveApiUrl(program2.opts().apiUrl), jwt: auth.token });
    const project = await resolveProject(client, creds);
    const tag = opts.tag ?? await promptText("Tag (e.g. v0.7.3): ");
    const baseTag = opts.baseTag ?? safeLatestTag();
    const result = await client.triggerRelease(creds.org, project.projectId, {
      repo: project.repoFullName,
      tag,
      baseTag,
      env: opts.env
    });
    if (opts.json) {
      console.log(JSON.stringify(result));
      return;
    }
    console.log(`Release queued: ${result.releaseRunId}`);
    console.log(`Workflows: ${result.workflowRunIds.join(", ")}`);
    if (opts.wait) {
      console.log("(--wait not yet implemented; check the dashboard for status.)");
    }
  });
}
function safeLatestTag() {
  try {
    return execSync5("git describe --tags --abbrev=0", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return;
  }
}

// src/index.ts
var pkg = createRequire2(import.meta.url)("../package.json");
var program2 = new Command;
program2.name("renaiss-shipflow").description("CLI for RenaissShipFlow - AI-powered project management automation").version(pkg.version).option("--api-url <url>", "RenaissShipFlow API base URL").option("--org <org>", 'Organization slug (default: "default")', "default");
registerAuthCommands(program2);
registerRepoCommands(program2);
registerWorkflowCommands(program2);
registerActivityCommand(program2);
registerChannelCommands(program2);
registerStatsCommand(program2);
registerTriggerCommand(program2);
registerLoginCommand(program2);
registerInitCommand(program2);
registerStatusCommand(program2);
registerIssuesCommand(program2);
registerIssueCommand(program2);
registerInboxCommand(program2);
registerConfigCommand(program2);
registerClaimsCommand(program2);
registerPRCommand(program2);
registerTestCommand(program2);
registerRegressionCommand(program2);
registerReleaseCommand(program2);
program2.parse();
