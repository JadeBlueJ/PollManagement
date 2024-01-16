module.exports.httpStatus = {
    OK: 200,
    UNAUTHORIZED: 401,
    SERVER_ERROR: 500,
    NOT_FOUND: 404,
    BAD_REQUEST: 400,
    NETWORK_ERROR: 599
}


module.exports.systemUserType = {
    MANAGER: 1,
    TEAM_MEMBER: 2
}

module.exports.emailTemplateType = {
    REMINDER_EMAIL: 1,
    FORGET_PASSWORD: 2,
    VERIFY_PASSWORD: 3,
}

module.exports.status = {
    NOT_SEND: 1,
    SEND: 2,
    DELETED: 3
}

module.exports.timePeriod = {
    TODAY: "today",
    WEEK: "week",
    MONTH: "month",
    YEAR: "year",
    CUSTOM: "custom"
}


module.exports.reportCategory = {
    EMAIL: 1,
    CALL: 2,
    SOCIALMEDIA: 3,
    ALL: "all"
}

module.exports.communicationType = {
    1: 'Email',
    2: 'Call',
    3: 'Social Media',
}

module.exports.sampleSheetHeader = [
    'firstName',
    'middleName',
    'lastName',
    'title',
    'email',
    'mobileNumber',
    'address',
    'companyName',
    'facebookUrl',
    'linkedinUrl',
    'websiteUrl',
    'industry',
    // 'country',
];

module.exports.iziToast = {
    SUCCESS_TOAST: {
        title: 'Info',
        color: 'green',
        icon: 'icon-info',
    },
    ERROR_TOAST: {
        title: 'Error',
        color: 'red',
        icon: 'icon-cross',
    },
    WARNING_TOAST: {
        title: 'Warning',
        color: 'yellow',
        icon: 'icon-alert',
    }
}


module.exports.leadStatus = {
    NEW: 1,
    INPROGRESS: 2,
    NOTRESPONDED: 3,
    WONLOST: 4,
    WON: 4,
    LOST: 4,
    'IN-PROGRESS': 2,
    'NOT RESPONDED': 3,
    'WON/LOST': 4,
    'WON': 4,
    'LOST': 4,
    "IN PROGRESS": 2,
    1: 'New',
    2: 'In-Progress',
    3: 'Not Responded',
    4: ' Won/Lost',
    null: "New"

}

module.exports.timeLineOperation = {
    LEAD_ASSIGN: 1,
    NOTE_ADDED: 2,
    NOTE_EDITED: 3,
    NOTE_DELETED: 4,
    REMINDER_ADDED: 5,
    REMINDER_EDITED: 6,
    REMINDER_DELETED: 7,
    LEAD_EDITED: 8,
    //
    EMAIL_SENT: 9,
    EMAIL_OPENED: 10,
    SENT_EMAIL_REPLY: 11,
    REC_EMAIL_REPLY: 12,
    1: 'Lead Assign',
    2: 'Note Added',
    3: 'Note Edited',
    4: "Note Deleted",
    5: "Reminder Added",
    6: "Reminder Edited",
    7: "Reminder Deleted",
    8: "Field Edited",
    //
    9: "Email sent",
    10: "Email opened ",
    11: "Sent a reply",
    12: "Received reply from lead",
}

module.exports.leadFields = {
    status: 'Status',
    firstName: 'FirstName',
    middleName: 'MiddleName',
    lastName: 'LastName',
    title: 'Title',
    email: 'Email',
    mobileNumber: 'Phone',
    address: 'Address',
    companyName: 'Company Name',
    facebookUrl: 'Facebook',
    linkedinUrl: 'Linkedin',
    websiteUrl: 'WebSite Url',
    industry: 'Industry',
    country: 'Country',
    socialMediaUrl: 'Socials',
    actions: 'Actions',
    date: 'Date',
    state: 'State',
    city: 'City',

}