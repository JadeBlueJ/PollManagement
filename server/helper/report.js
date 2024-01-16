const dayjs = require("dayjs");
const constants = require("../helper/utilities/constants")
const mongoose = require("mongoose");
const XLSX = require('xlsx');
module.exports.generateFetchCondition = async (options, ranges) => {
    const timeCondition = {
        createdAt: {
            $gte: new Date(ranges.startDate),
            $lt: new Date(ranges.endDate + 'T23:59:59.999Z')
        }
    };

    let userCondition = {}
    let reportCategoryCondition = {};
    let groupFilter = {
        emailCount: {
            $sum: { $cond: [{ $eq: ["$noteType", 1] }, 1, 0] }
        },
        callCount: {
            $sum: { $cond: [{ $eq: ["$noteType", 2] }, 1, 0] }
        },
        socialMediaCount: {
            $sum: { $cond: [{ $eq: ["$noteType", 3] }, 1, 0] }
        }
    };

    let projectFilter = {
        emailCount: 1,
        callCount: 1,
        socialMediaCount: 1
    }

    if (options.selectedUser != constants.reportCategory.ALL) {
        userCondition = { userId: new mongoose.Types.ObjectId(options.selectedUser) };
    }
    if (options.selectedReportCategory != constants.reportCategory.ALL) {
        reportCategoryCondition = { noteType: parseInt(options.selectedReportCategory) }
        groupFilter = {
            count: { $sum: { $cond: [{ $eq: ["$noteType", parseInt(options.selectedReportCategory)] }, 1, 0] } }
        }
        projectFilter = {
            count: 1
        }
    }

    let whereCondition = {
        ...timeCondition,
        ...userCondition,
        ...reportCategoryCondition,
    }

    let groupCondition = {
        ...groupFilter,
    }

    let projectCondition = {
        ...projectFilter
    }

    return {
        whereCondition,
        groupCondition,
        projectCondition
    }
}

module.exports.manageColumns = async (options) => {
    const typeColumn = options.selectedReportCategory == constants.reportCategory.ALL ? [
        { header: 'EmailCount', name: 'emailCount', align: 'center', },
        { header: 'CallCount', name: 'callCount', align: 'center', },
        { header: 'SocialMediaCount', name: 'socialMediaCount', align: 'center' }]
        : [{ header: "CommunicationCount", name: 'count', align: 'center' }];
    const userOrLeadColumn = options.selectedUser == constants.reportCategory.ALL ?
        [{ header: 'S.No.', name: 'sno', align: 'center' },
        { header: 'FirstName', name: 'firstName', align: 'center' },
        { header: 'LastName', name: 'lastName', align: 'center' },
        { header: 'Email', name: 'email', align: 'center' }]
        : [{ header: 'S.No.', name: 'sno', align: 'center' },
        { header: 'FirstName', name: 'firstName', align: 'center' },
        { header: 'LastName', name: 'lastName', align: 'center' },
        { header: 'Email', name: 'email', align: 'center' },
        { header: 'Mobile', name: 'mobileNumber', align: 'center' }];

    return [
        ...userOrLeadColumn,
        ...typeColumn,
    ]
}

module.exports.manageReportData = async (reportData, options, totalCount = 0) => {
    let columns = await exports.manageColumns(options);
    reportData = reportData.map((row,index) => { 
        let rowData = {sno:index+1, ...row}       
        return {            
            ...rowData,
            _attributes: {
                editable: false
            }
        }
    })    
    return {
        columns,
        rows: reportData,
        totalCount: totalCount.length
    }
}



module.exports.createSpreadSheet = async (reportData) => {
    let rows = reportData.rows;
    let columns = reportData.columns;
    columns = columns.map(col => col.header);
    rows = rows.map(row => {
        delete row?._id;
        delete row?.leadId;
        delete row?.openDateList;
        
        const arr = Object.values(row);
        return arr;
    });
    // Create a new workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.sheet_add_aoa(worksheet, [columns], { origin: -1 });
    XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: -1 });   

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // Generate the buffer containing the Excel file data
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return {
        fileName: dayjs().format('DDMMYYHHmmssSSS'),
        buffer: buffer
    }
}


module.exports.createSampleUploadSheet = async () => {
    let columns = constants.sampleSheetHeader;
    let rows = [[]];

    // Create a new workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([]);

    // Add the columns array as the first row (header)
    XLSX.utils.sheet_add_aoa(worksheet, [columns], { origin: 0 });

    // Add the rows data
    XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: -1 });

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // Generate the buffer containing the Excel file data
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });


    return {
        fileName: `sample-sheet`,
        buffer: buffer
    }
}
module.exports.setPDFColumn = async (columns) => {
    let columnHTML = `<tr>`;
    for (let i = 0; i < columns.length; i++) {
        let column = columns[i];
        columnHTML += `<th> ${column}</th>`
    }
    columnHTML += `</tr>`;
    return columnHTML;
}


module.exports.setPDFRow = async (rows) => {
    let rowsHTML = ``;
    for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        let rowHTML = `<tr>`;
        for (let item = 0; item < row.length; item++) {
            rowHTML += `<td> ${row[item]}</td>`
        }
        rowHTML += `</tr>`;
        rowsHTML += rowHTML;
    }
    return rowsHTML
}

module.exports.getRowsAndColumn = async (reportData, options) => {
    let rows = reportData.rows;
    let columns = reportData.columns;
    columns = columns.map(col => col.header);
    // rows = rows.map(row => {
    //     delete row._id;
    //     const arr = Object.values(row);
    //     return arr;
    // });

    if(options.selectedReportCategory == constants.reportCategory.ALL && options.selectedUser == constants.reportCategory.ALL){
        rows = rows.map((ele, index) => ({
            'S.No.': String(index+1),
            'FirstName': ele.firstName || '',
            'LastName': ele.lastName || '',
            'Email': ele.email || '',
            'EmailCount': String(ele.emailCount) || ' ',
            'SocialMediaCount':  String(ele.socialMediaCount) || ' ',
            'CallCount': String(ele.callCount) || ' '
        }));
    } else if(options.selectedReportCategory == constants.reportCategory.ALL && options.selectedUser != constants.reportCategory.ALL){
        rows = rows.map((ele, index) => ({
            'S.No.': String(index+1),
            'FirstName': ele.firstName || '',
            'LastName': ele.lastName || '',
            'Email': ele.email || '',
            'Mobile': String(ele.mobileNumber) || ' ',
            'EmailCount': String(ele.emailCount) || ' ',
            'SocialMediaCount':  String(ele.socialMediaCount) || ' ',
            'CallCount': String(ele.callCount) || ' '
        }));
    } else if(options.selectedUser == constants.reportCategory.ALL && options.selectedReportCategory != constants.reportCategory.ALL){
        rows = rows.map((ele, index) => ({
            'S.No.': String(index+1),
            'FirstName': ele.firstName || '',
            'LastName': ele.lastName || '',
            'Email': ele.email || '',
            'CommunicationCount': String(ele.count) || ' '
        }));
    }else {
        rows = rows.map((ele, index) => ({
            'S.No.': String(index+1),
            'FirstName': ele.firstName || '',
            'LastName': ele.lastName || '',
            'Email': ele.email || '',
            'Mobile': String(ele.mobileNumber) || ' ',
            'CommunicationCount': String(ele.count) || ' '
        }));
    }

//     const htmlTemplate = `
//     <html>
//       <head>
//         <style>
//         .pdf-table {
//             width: 100%;
//             border-collapse: collapse;
//           }

//           .pdf-table th, .pdf-table td {
//             padding: 8px;
//             border-bottom: 1px solid #ddd;
//             text-align: left;
//           }

//           .pdf-table th {
//             background-color: #f2f2f2;
//             font-weight: bold;
//           }
//         </style>
//       </head>
//       <body>
//         <h1>ReportPdf</h1>
//         <table class="pdf-table">
//           <thead>
//                 ${await exports.setPDFColumn(columns)}
//           </thead>
//           <tbody>
//                 ${await exports.setPDFRow(rows)}
//           </tbody>
//         </table>
//       </body>
//     </html>
//   `;
//     return htmlTemplate;

return {columns, rows}
}