function SortShifts(p) {
    p.shifts.sort(function (a, b) {
        if (a.end > b.end) return -1;
        if (a.end < b.end) return 1;
        return 0;
    });
    return p;
}

function LastShift(p) {
    return SortShifts(p)[0];
}

function GetShiftById(p, id) {
    return p.shifts.find(shift => shift.id == id);
}

function EditShift(p, id, shift) {
    var i = p.shifts.findIndex(shift => shift.id == id);
    p.shifts[i] = shift;
}

exports.run = (client, message, args) => {
    const defaultPunch = {
        shifts: [],
        current: null,
        warned: false
    };
    const DATE_FORMAT = "MMMM D YYYY h:mmA",
        SMALL_DATE_FORMAT = "MMM D YY h:mmA",
        TITLE_MAX_LENGTH = 20;

    if (args.length == 0) return client.error(message, `Must specify \`punch in\`, \`punch out <message>\`, \`punch report\`, \`punch edit\` or \`punch clear\``);
    if (!client.punch.get(message.author.id)) client.punch.set(message.author.id, defaultPunch);

    var action = args.shift();
    var userPunch = client.punch.get(message.author.id);

    if (!userPunch) return client.warn(message, `Something went wrong...`);
    switch (action) {
        case "in":
            if (userPunch.current) return client.warn(message, `You're already punched (since ${client.moment(userPunch.current).format(DATE_FORMAT)})`);
            userPunch.current = new Date();
            client.punch.set(message.author.id, userPunch);
            client.info(message, `You're punched in! Git productive! (but don't push to production)`);
            break;

        case "out":
            if (!userPunch.current) return client.warn(message, `You're not punched in! Last punch out was ${client.moment(LastShift(userPunch).end).format(DATE_FORMAT)} (${LastShift(userPunch).title})`);
            if (args.length == 0) return client.error(message, `Write a short title to your shift!`);

            var title = args.join(" ");
            if (message.length > TITLE_MAX_LENGTH) return client.warn(message, `TL;DR; Keep it short please, descriptive but short! (${TITLE_MAX_LENGTH} chars max)`);

            var shift = {
                id: client.shortid.generate(),
                start: userPunch.current,
                end: new Date(),
                title
            };
            userPunch.shifts.push(shift);
            userPunch.current = null;
            userPunch.warned = false;
            client.punch.set(message.author.id, userPunch);

            client.info(message, `You're punched out! Go enjoy the day (or the night)!
        ID: \`${shift.id}\`
        Start: \`${client.moment(shift.start).format(DATE_FORMAT)}\` 
        End: \`${client.moment(shift.end).format(DATE_FORMAT)}\` 
        Time: \`${client.ParseToTime(client.CalculateShiftMinutes(shift))}\`
        Title: \`${shift.title}\``);
            break;

        case "edit":
            if (args.length == 0) return client.warn(message, `Please specify the shift ID to edit (use punch report)`);
            var id = args.shift();
            var shift = GetShiftById(userPunch, id);
            if (!shift) return client.error(message, `Invalid shift ID`);
            if (args.length == 0) return client.error(message, `Please specify edit action: \`start\`, \`end\`, \`title\`, \`delete\``);
            var editAction = args.shift();

            switch (editAction) {
                case "start":
                    if (args.length == 0) return client.warn(message, `Must specify new DateTime following the *moment.js* format \`MM-D-YYYY H:mm\`. (e.g.: 07-27-1998 21:02) `);
                    var momentDate = client.moment(args.join(" "));
                    if (!momentDate.isValid()) return client.error(message, `Invalid format (MM-D-YYYY H:mm). example format: \`11/03/2000 2:13\` `);
                    if (momentDate.isSameOrAfter(shift.end)) return client.error(message, `Start cannot be after or same as End`);
                    shift.start = momentDate.format();
                    EditShift(userPunch, id, shift);
                    client.punch.set(message.author.id, userPunch);
                    return client.success(message, `Shift start edited to \`${client.moment(GetShiftById(userPunch, id).start).format(DATE_FORMAT)}\``);
                    break;

                case "end":
                    if (args.length == 0) return client.warn(message, `Must specify new DateTime following the *moment.js* format \`MM-D-YYYY H:mm\`. (e.g.: 07-27-1998 21:02) `);
                    var momentDate = client.moment(args.join(" "));
                    if (!momentDate.isValid()) return client.error(message, `Invalid format (MM-D-YYYY H:mm). example format: \`11/03/2000 2:13\` `);
                    if (momentDate.isSameOrBefore(shift.start)) return client.error(message, `End cannot be before or same as Start`);
                    shift.end = momentDate.format();
                    EditShift(userPunch, id, shift);
                    client.punch.set(message.author.id, userPunch);
                    return client.success(message, `Shift end edited to \`${client.moment(GetShiftById(userPunch, id).end).format(DATE_FORMAT)}\``);
                    break;

                case "title":
                    if (args.length == 0) return client.warn(message, `Must specify new title`);
                    var title = args.join(" ");
                    if (title.length > TITLE_MAX_LENGTH) return client.error(message, `Title may not exceed ${TITLE_MAX_LENGTH}`);
                    shift.title = title;
                    EditShift(userPunch, id, shift);
                    client.punch.set(message.author.id, userPunch);
                    return client.success(message, `Shift title edited to \`${GetShiftById(userPunch, id).title}\``);
                    break;

                case "delete":
                    userPunch.shifts.splice(userPunch.shifts.findIndex(shift => shift.id == id), 1);
                    client.punch.set(message.author.id, userPunch);
                    return client.success(message, `Shift deleted (${shift.title})`);
                    break;

                default:
                    return client.error(message, `${editAction} is not a valid edit action.`);
            }
            break;

        case "clear":
        case "report":
            var totalMinutes = client.CalculateMinutes(userPunch);
            var m = `You've accomplished ${client.ParseToTime(totalMinutes)} recorded hours${userPunch.current ? " (excluding the current shift hours)" : ""}.`;
            if (userPunch.current) m += `\nCurrent shift: ${client.ParseToTime(client.CalculateShiftMinutes({ start: userPunch.current, end: new Date() }))}`;
            SortShifts(userPunch).shifts.forEach((shift) => {
                m += `\n[\`${shift.id}\`] **${shift.title}**: __${client.moment(shift.start).format(SMALL_DATE_FORMAT)}__ - __${client.moment(shift.end).format(SMALL_DATE_FORMAT)}__ (${client.ParseToTime(client.CalculateShiftMinutes(shift))})`;
            });

            if (action == "clear") {
                userPunch.shifts = [];
                client.punch.set(message.author.id, userPunch);
                m += `\n\nShift history cleared.`;
            }

            return client.info(message, m);
            break;

        default:
            client.error(message, 'Invalid punch action');
    }
}