"use strict";

var Discord = require('discord.js'), // https://discord.js.org/#/docs/main/stable/general/welcome
  auth = require('./auth.json'),
  fs = require('fs'),
  Enmap = require('enmap'),
  EnmapLevel = require('enmap-level');

const WARN_INTERVAL = 5000, // 5 seconds
  WARN_TRIGGER = 60 * 6, // 6 hours
  PUNCHOUT_TRIGGER = 60 * 12 // 12 hours;

///////////////////////////////////////////////////////// Init Bot /////////////////////////////////////////////////////////
var client = new Discord.Client();

client.moment = require('moment');
client.shortid = require('shortid');
client.config = require('./conf.json');

client.WARN_INTERVAL = WARN_INTERVAL;
client.WARN_TRIGGER = WARN_TRIGGER;
client.PUNCHOUT_TRIGGER = PUNCHOUT_TRIGGER;

client.shortid.characters('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!*');

// Colors
client.colors = {
  info: 0xFFFFFF,
  black: 0x000000,
  error: 0xff4444,
  success: 0x7aff66,
  warn: 0xFF8B07,
  blue: 0x0000FF
};

// Database
client.punch = new Enmap({
  name: "punch",
  persistent: true,
  provider: new EnmapLevel({
    name: "punch"
  })
});

// Message Reply
client.embedReply = (message, options, mention) => {
  if (!options) throw new Error("No options provided");
  if (typeof (options) === "string") return message.channel.send({ embed: { description: options } });
  if (typeof (options) !== "object") throw new Error("Options provided is not an object");

  var embed = new Discord.RichEmbed(options);

  return mention ? message.reply(embed) : message.channel.send(embed);
}
// Simple message embeds
client.warn = (message, reply) => {
  return client.embedReply(message, { color: client.colors.warn, description: `:warning: ${reply}` });
}
client.info = (message, reply) => {
  return client.embedReply(message, { color: client.colors.info, description: `${reply}` });
}
client.error = (message, reply) => {
  return client.embedReply(message, { color: client.colors.error, description: `:x: ${reply}` });
}
client.success = (message, reply) => {
  return client.embedReply(message, { color: client.colors.success, description: `:white_check_mark: ${reply}` });
}

// Shift related functions
client.CalculateShiftMinutes = (shift) => {
  return client.moment.duration(client.moment(shift.end).diff(shift.start)).asMinutes();
};
client.CalculateMinutes = (p) => {
  var minutes = 0.0;
  p.shifts.forEach((shift) => {
    minutes += client.CalculateShiftMinutes(shift);
  });
  return minutes;
};
client.ParseToTime = (minutes) => {
  minutes = Math.floor(minutes);
  var hours = Math.floor(minutes / 60);
  var mins = Math.floor(minutes - hours * 60);
  return `${hours > 0 ? hours + 'h ' : ''}${mins}m`;
};

//// ROUND
client.punchRound = setInterval(() => {
  client.punch.forEach((punch, id) => {

    if (punch.current) {
      console.log(!punch.warned && client.CalculateMinutes(punch) > WARN_TRIGGER);
      if (!punch.warned && client.CalculateMinutes({shifts: [{start: punch.current, end: new Date()}]}) > WARN_TRIGGER) {

        client.users.get(id).send(new Discord.RichEmbed({
          description: `:warning: You've been punched in for ${client.ParseToTime(client.CalculateShiftMinutes({ start: punch.current, end: new Date() }))}. Don't forget to punch out with \`${client.config.PREFIX}punch out\` when you're done! You can also edit shifts with \`${client.config.PREFIX}punch edit\`.`,
          color: client.colors.warn
        }));
        punch.warned = true;
        client.punch.set(id, punch);

      } else if (client.CalculateMinutes({shifts: [{start: punch.current, end: new Date()}]}) > PUNCHOUT_TRIGGER) {

        client.users.get(id).send(new Discord.RichEmbed({
          description: `:warning: Look, you've been punched in for ${client.ParseToTime(client.CalculateShiftMinutes({ start: punch.current, end: new Date() }))}, which is a ridiculous amount of time without breaks! I'm going to assume you forgot to punch out and do it for you... If this is no mistake, take a break mate. Otherwise you can always edit your shift with \`${client.config.PREFIX}punch edit\``,
          color: client.colors.warn
        }));

        var shift = {
          id: client.shortid.generate(),
          start: punch.current,
          end: new Date(),
          title: 'PUNCHED OUT BY BOT'
        };
        punch.shifts.push(shift);
        punch.current = null;
        punch.warned = false;
        client.punch.set(id, punch);
      }
    }
  });

}, WARN_INTERVAL);

fs.readdir("./events/", (err, files) => {
  if (err) return console.error(err);
  files.forEach(file => {
    let eventFunction = require(`./events/${file}`);
    let eventName = file.split(".")[0];
    client.on(eventName, (...args) => eventFunction.run(client, ...args));
  });
});

///////////////////////////////////////////////////////// /Init Bot /////////////////////////////////////////////////////////

client.login(auth.token);