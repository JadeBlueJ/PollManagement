const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const XLSX = require('xlsx');
const constants = require("./utilities/constants");
const day = require("dayjs");
const moment = require('moment-timezone');

module.exports.hashPassword = async (password) => {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;

}

module.exports.comparePassword = async (password, hashedPassword) => {
    const match = await bcrypt.compare(password, hashedPassword);
    return match;
}


module.exports.getJWTTOKEN = async (user, uuid) => {
    const token = jwt.sign(
        { userId: user._id, email: user.email, token: uuid },
        CONFIG.JWT_SECRET_KEY,
        {
            expiresIn: "2h",
        }
    );
    return token;
}

module.exports.bindLoginObj = async (user) => {
    let uuid = uuidv4();
    let token = await exports.getJWTTOKEN(user, uuid);
    let loginObj = {
        uid: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        token: token,
        systemUserType: user.systemUserType,
        role: user?.roleId,
    };
    return loginObj;
}

module.exports.convertSheetToJSON = async (filePath) => {
    const workBook = XLSX.readFile(filePath);
    const sheetName = workBook.SheetNames[0];
    const workSheet = workBook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(workSheet, { header: 1 });

    // Transform the array of rows into an object with key-value pairs
    const managedJSON = jsonData.map(row => {
        const obj = {};
        for (let i = 0; i < row.length; i++) {
            const cellValue = row[i];
            const header = jsonData[0][i]; // Assuming the first row contains the column headers
            obj[header] = cellValue;
        }
        return obj;
    });

    //now removing duplicate in sheets...
    let leadEmails = [];
    let output = [];
    for (let i = 0; i < managedJSON.length; i++) {
        let lead = managedJSON[i];
        if (i != 0 && lead && lead.firstName) {
            let email = lead.email ? lead.email.trim().toLowerCase() : '';

            if(email){
                if(!leadEmails.includes(email)){
                    lead.date = Date.now();
                    output.push(lead)
                }
                leadEmails.push(email)
            }
        }
    }
    return output;
}


module.exports.convertDateTimeToCronTime = async (dateTime) => {
    const dateObj = new Date(dateTime);
    // Extract the individual components from the Date object
    const minute = dateObj.getMinutes();
    const hour = dateObj.getHours();
    const day = dateObj.getDate();
    const month = dateObj.getMonth() + 1; // Note: Months are zero-based in JavaScript Date objects
    const dayOfWeek = dateObj.getDay(); // 0 for Sunday, 1 for Monday, and so on
    // Create the cron expression using the extracted components
    const cronExpression = `${minute} ${hour} ${day} ${month} ${dayOfWeek}`;
    return cronExpression;
}


module.exports.setUpReminderTemplateData = async (lead, user, message) => {
    let template = {
        leadName: lead.name ? lead.name : '--',
        email: lead.email ? lead.email : '--',
        mobileNumber: lead.mobileNumber ? lead.mobileNumber : '--',
        industry: lead.industry ? lead.industry : '--',
        country: lead.country ? lead.country : '--',
        websiteUrl: lead.websiteUrl ? lead.websiteUrl : '--',
        socialMediaUrl: lead.socialMediaUrl ? lead.socialMediaUrl : '--',
        firstName: user.firstName ? user.firstName : '--',
        lastName: user.lastName ? user.lastName : '--',
        message: message
    }

    return template;
}


module.exports.generateRanges = async (options) => {

    if (options.selectTimePeriod == constants.timePeriod.CUSTOM) {
        const startDateParts = options.startDate.split('-')
        const endDateParts = options.endDate.split('-')
        
        const startDate = `${startDateParts[2]}-${startDateParts[1]}-${startDateParts[0]}`
        const endDate = `${endDateParts[2]}-${endDateParts[1]}-${endDateParts[0]}`

        return { startDate: startDate, endDate: endDate };
    }
    return { startDate: day().startOf(options.selectTimePeriod).format("YYYY-MM-DD"), endDate: day().endOf(options.selectTimePeriod).format("YYYY-MM-DD") };
}


module.exports.searchLeadCondition = async (options, assignedTo) => {

    let dateRangeCondition = {};
    if(options?.filters){
        let filterObj = JSON.parse(options.filters);
        if(filterObj?.startDate){
            let endDate;
            if(filterObj.endDate == ''){  
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0'); 
            const day = String(currentDate.getDate()).padStart(2, '0');
            endDate = `${year}-${month}-${day}`;  
            } else endDate = filterObj.endDate;

            dateRangeCondition = {
                date: {
                    $gte: new Date(filterObj?.startDate),
                    $lt: new Date(endDate + 'T23:59:59.999Z')
                }
            }
        }
    }


    let searchCondition = [];
    if (options.searchTerm.trim() != '') {
        searchCondition = {
            $or: [
                { firstName: { '$regex': "^" + options.searchTerm + "", "$options": 'si' } },
                { lastName: { '$regex': "^" + options.searchTerm + "", "$options": 'si' } },
                { mobileNumber: { '$regex': options.searchTerm , "$options": 'si' } },
                { email: { '$regex': options.searchTerm , "$options": 'si' } },
            ]
        }
    }

    let matchCondition = []
    if (assignedTo && options.searchTerm.trim() != '') {
        matchCondition = [
            {
                $match: {
                    ...assignedTo,
                    ...searchCondition,
                    ...dateRangeCondition
                }
            },
            {
                $lookup: {
                    from: "status",
                    localField: 'statusId',
                    foreignField: "_id",
                    as: "statusId"
                }
            },
            {
                $unwind: { 'path': '$statusId', 'preserveNullAndEmptyArrays': true }
            },
        ]
    }
    else {
        matchCondition = [
            {
                $match: {
                    ...searchCondition,
                    ...dateRangeCondition
                }
            },
            {
                $lookup: {
                    from: "status",
                    localField: 'statusId',
                    foreignField: "_id",
                    as: "statusId"
                }
            },
            {
                $unwind: { 'path': '$statusId', 'preserveNullAndEmptyArrays': true }
            },
        ]
    }


    return [...matchCondition];
}

module.exports.manageAssignedLead = async (data, timeLineOperation, actionPerformedBy) => {
    let leads = data.selectedLeads;
    let user = data.selectedUser;
    let timeLines = [];
    for (let i = 0; i < leads.length; i++) {
        let timeLine = {};
        timeLine.leadId = leads[i];
        timeLine.userId = user;
        timeLine.timeLineOperation = timeLineOperation;
        timeLine.actionPerformedBy = `Admin: ${actionPerformedBy}`;
        timeLines.push(timeLine);
    }
    return timeLines;
}


module.exports.manageTimeLine = async (assigned, notes, reminders, email, leadupdateDetails) => {
    let timelines = [...assigned, ...notes, ...reminders, ...leadupdateDetails, ...email];
    //first we are sorting that array on the bases on createdAt...
    timelines.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    //now groupedObj this array....
    let groupedObj = {};
    for (let i = 0; i < timelines.length; i++) {
        //need to set the datetime first..
        let timelineObj = timelines[i];
        let noteTypeText = timelineObj.noteType ? `(${constants.communicationType[timelineObj.noteType]})` : "";
        timelineObj.action = constants.timeLineOperation[timelineObj.timeLineOperation]+ noteTypeText;
        let createdAtIST = moment(timelineObj.createdAt).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
        timelineObj.dateTime = day(createdAtIST).format('h:mm A');
        let arr = groupedObj[timelines[i].yearMonthDay] ? [...groupedObj[timelines[i].yearMonthDay], timelineObj] : [timelineObj];
        groupedObj[timelines[i].yearMonthDay] = arr;
    }
    timelines = [];
    for (const key in groupedObj) {
        timelines.push({
            date: key,
            timeLines: groupedObj[key]
        })
    }

    return timelines;
}


module.exports.excludeFields = async (leadForm) => {
    delete leadForm._id;
    delete leadForm._attributes;
    delete leadForm._disabledPriority;
    delete leadForm.rowSpanMap;
    delete leadForm._relationListItemMap;
    delete leadForm.__v;
    delete leadForm.uniquekey;
    delete leadForm.createdAt;
    delete leadForm.updatedAt;
}

module.exports.manageLeadEditForTL = async (before, after) => {
    after = JSON.parse(JSON.stringify(after));
    await exports.excludeFields(after);
    before = JSON.parse(JSON.stringify(before));
    await exports.excludeFields(before);
    let updateObj = [];

    for (const key in before) {
        //it means this is our update fields for this we need to update this fields....
        if (key != 'country' && key != 'state') {
            if (before[key] != after[key]) {
                if (key == "date") {
                    updateObj.push({
                        field: constants.leadFields[key],
                        before: day(before[key]).format("DD-MM-YYYY"),
                        after: day(after[key]).format("DD-MM-YYYY"),
                    })
                } else {
                    updateObj.push({
                        field: constants.leadFields[key],
                        before: before[key],
                        after: after[key],
                    })
                }
            }
        }
        else if (key == 'country' || key == 'state') {
            if (before[key]?.name != after[key]?.name) {

                updateObj.push({
                    field: constants.leadFields[key],
                    before: before[key]?.name,
                    after: after[key]?.name,
                })

            }
        }

    }
    return updateObj;
}
// commonHelper.js

const exactMatch = (field, value) => {
    return { [field]: new RegExp(`^${value}$`, 'i') };
};

const containsMatch = (field, value) => {
    return { [field]: new RegExp(value, 'i') };
};

const startsWithMatch = (field, value) => {
    return { [field]: new RegExp(`^${value}`, 'i') };
};

const endsWithMatch = (field, value) => {
    return { [field]: new RegExp(`${value}$`, 'i') };
};

module.exports.filterLeadCondition = async (options, assignedTo) => {
    let filterCondition = {};
    if (assignedTo) {
        filterCondition.assignedTo = assignedTo;
    }
    // Handle filter for Status (exact matches and contains)
    if (options.status?.value) {
        const statusOperator = options.status.operator;
        const statusValue = options.status.value;

        if (statusOperator === 1) {
            filterCondition = { ...filterCondition, ...exactMatch('status', statusValue) };
        } else if (statusOperator === 2) {
            filterCondition = { ...filterCondition, ...containsMatch('status', statusValue) };
        }
    }

    // Handle filter for Country (exact matches, contains, starts with, ends with)
    if (options.country?.value) {
        const countryOperator = options.country.operator;
        const countryValue = options.country.value;

        if (countryOperator === '1') {
            filterCondition = { ...filterCondition, ...exactMatch('country', countryValue) };
        } else if (countryOperator === '2') {
            filterCondition = { ...filterCondition, ...containsMatch('country', countryValue) };
        } else if (countryOperator === '3') {
            filterCondition = { ...filterCondition, ...startsWithMatch('country', countryValue) };
        } else if (countryOperator === '4') {
            filterCondition = { ...filterCondition, ...endsWithMatch('country', countryValue) };
        }
    }

    // Handle filter for Industry (exact matches, contains, starts with, ends with)
    if (options.industry?.value) {
        const industryOperator = options.industry.operator;
        const industryValue = options.industry.value;

        if (industryOperator === '1') {
            filterCondition = { ...filterCondition, ...exactMatch('industry', industryValue) };
        } else if (industryOperator === '2') {
            filterCondition = { ...filterCondition, ...containsMatch('industry', industryValue) };
        } else if (industryOperator === '3') {
            filterCondition = { ...filterCondition, ...startsWithMatch('industry', industryValue) };
        } else if (industryOperator === '4') {
            filterCondition = { ...filterCondition, ...endsWithMatch('industry', industryValue) };
        }
    }

    return filterCondition;
};


module.exports.listFindQuery = async (query) => {
    const assignedTo = query.assignedTo
    const assignedToUser = query?.assignedToUser

    if(assignedToUser && assignedToUser != ''){
        return { assignedTo: assignedToUser, status: { $ne: constants.status.DELETED } };
    }

    if(assignedTo == 'unassigned'){
        return {assignedTo: {$exists: false}, status: { $ne: constants.status.DELETED }}
    }else if(assignedTo ==  'assigned'){
        return {assignedTo: {$exists: true}, status: { $ne: constants.status.DELETED }};
    }else if(assignedTo == 'all'){
        return {status: { $ne: constants.status.DELETED }}
    }else{
        return { assignedTo: assignedTo, status: { $ne: constants.status.DELETED } };
    }
}
