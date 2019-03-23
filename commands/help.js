exports.run = (client, message, args) => {
    client.info(message, `Hey! I'm Punch Bot! I take care of calculating your shifts. Whether it's work or school, I keep track of how crazy you are willing to go! I was made for my creator's school because he had to track what he did in a certain period of time for his project. I'll show you the ropes to use me...
    
    First, you can punch in with \`${client.config.PREFIX}punch in\`. I will start keeping track of your time. If your session exceeds ${client.ParseToTime(client.WARN_TRIGGER)}, I will notify you. If it exceeds ${client.ParseToTime(client.PUNCHOUT_TRIGGER)}, I will punch you out myself!
    
    Use \`${client.config.PREFIX}punch out <title>\` to punch out. I will keep this session in mind if you ever need to look back at it. Give it a short descriptive title!
    
    Use \`${client.config.PREFIX}punch report\` to list your total time and shifts recorded. Please note that for my creator's convenience and the lack of time to implement solutions, time recorded is relative to Montreal, Quebec's time.
    
    Use \`${client.config.PREFIX}punch clear\` to clear your shift list. This will trigger the same as the report command.
    
    Finally, \`${client.config.PREFIX}punch edit\` to edit a shift's start/end time, title or simply delete it!
    
    Now get to work!`);
}