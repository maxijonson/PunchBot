exports.run = (client, message) => {
    try {
        if (!message.content.startsWith(client.config.PREFIX)) return;
        var args = message.content.slice(client.config.PREFIX.length).trim().split(/ +/g);
        var command = args.shift().toLowerCase();

        // Load command file
        let commandFile;
        try {
            commandFile = require(`../commands/${command}.js`);
        } catch (err) {
            return;
        }

        // Run the command
        commandFile.run(client, message, args);
    } catch (err) {
        console.error(err.stack);
    }
}
