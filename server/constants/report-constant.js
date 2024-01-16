const COLUMN_NAME_FOR_EMAIL = [
    // {header: 'S.No', name: 's_no', align: 'center'},
    {header: 'First Name', name: 'firstName', align: 'center'},
    {header: 'Last Name', name: 'lastName', align: 'center'},
    {header: 'Email', name: 'email', align: 'center'},
    {header: 'Assigned To', name: 'assignTo', align: 'center'},
    {header: 'Address', name: 'address', align: 'center'},
    {header: 'Open Count', name:'countEmailOpen', align:'center'},
    
]

const COLUMN_NAME_FOR_ACTIVITY = [
    // {header: 'S.No', name: 's_no', align: 'center'},
    {header: 'First Name', name: 'firstName', align: 'center'},
    {header: 'Last Name', name: 'lastName', align: 'center'},
    {header: 'Email', name: 'email', align: 'center'},
    {header: 'Assigned To', name: 'assignTo', align: 'center'},
    {header: 'Address', name: 'address', align: 'center'},
    {header: 'Email Note', name: 'countEmailNote', align: 'center'},
    {header: 'Call Note', name: 'countCallNote', align: 'center'},
    {header: 'Social Note', name: 'countSocialNote', align: 'center'},
]

module.exports = {
    COLUMN_NAME_FOR_EMAIL,
    COLUMN_NAME_FOR_ACTIVITY
}