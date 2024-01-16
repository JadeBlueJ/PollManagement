const models = require("../models");
const constants = require("../helper/utilities/constants");


module.exports.logsReport = async (condition, options, applyPagination, skip, limit) => {
    let pagination = [];
    if (applyPagination) {
        pagination = [
            {
                $skip: parseInt(skip - 1) * parseInt(limit) // Skip documents based on the current page
            },
            {
                $limit: parseInt(limit) // Limit the number of documents per page
            }
        ]
    }

    // if (options.selectedUser == constants.reportCategory.ALL) {
    //     return await models.noteLog.aggregate([
    //         {
    //             $lookup: {
    //                 from: "users",
    //                 localField: "userId",
    //                 foreignField: "_id",
    //                 as: "user"
    //             }
    //         },
    //         {
    //             $match: {
    //                 ...condition.whereCondition
    //             }
    //         },
    //         {
    //             $group: {
    //                 _id: "$userId",
    //                 firstName: { $last: { $arrayElemAt: ["$user.firstName", 0] } },
    //                 lastName: { $last: { $arrayElemAt: ["$user.lastName", 0] } },
    //                 email: { $last: { $arrayElemAt: ["$user.email", 0] } },
    //                 ...condition.groupCondition
    //             }
    //         },
    //         {
    //             $project: {
    //                 _id: 1,
    //                 firstName: 1,
    //                 lastName: 1,
    //                 email: 1,
    //                 ...condition.projectCondition
    //             }
    //         },
    //         ...pagination
    //     ]);
    // }

    return await models.noteLog.aggregate([
        {
            $lookup: {
                from: "leads",
                localField: "leadId",
                foreignField: "_id",
                as: "lead"
            }
        },
        {
            $match: {
                ...condition.whereCondition
            }
        },
        {
            $group: {
                _id: "$leadId",
                firstName: { $last: { $arrayElemAt: ["$lead.firstName", 0] } },
                lastName: { $last: { $arrayElemAt: ["$lead.lastName", 0] } },
                email: { $last: { $arrayElemAt: ["$lead.email", 0] } },
                mobileNumber: { $last: { $arrayElemAt: ["$lead.mobileNumber", 0] } },
                ...condition.groupCondition
            }
        },
        {
            $project: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                email: 1,
                mobileNumber: 1,
                ...condition.projectCondition
            }
        },
        ...pagination
    ]);
}