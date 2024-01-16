const mongoose = require("mongoose");
const models = require("../models");
const constants = require("../helper/utilities/constants")
module.exports.leadList = async (findQuery) => {
  if (Object.keys(findQuery).length === 0) {
    findQuery = {
      $or: [
        { assignedTo: { $exists: false } },
        { assignedTo: { $in: [null, undefined, ''] } }
      ]
    };
  }
}

module.exports.findLeads = async (findQuery, skip, limit, filters) => {
  if (filters?.startDate) {
    let endDate;
    if (filters.endDate == '') {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      endDate = `${year}-${month}-${day}`;
    } else endDate = filters.endDate;
    findQuery = {
      ...findQuery,
      date: {
        $gte: new Date(filters?.startDate),
        $lt: new Date(endDate + 'T23:59:59.999Z')
      }
    };
  }

  let leadList = await models.lead.find(findQuery).populate('statusId').skip(skip).limit(limit).lean();

  let lead_list = [];
  for (let i = 0; i < leadList.length; i++) {
    let list = leadList[i]
    if (list?.assignedTo) {
      const user = await models.user.findOne({ _id: new mongoose.Types.ObjectId(list.assignedTo) }, 'firstName lastName');
      if (user)
        list.assignedToUser = user?.firstName + ' ' + user?.lastName
    } else {
      list.assignedToUser = ''
    }
    lead_list.push(list);
  }
  return lead_list;
};
module.exports.findTotalLeadCount = async (findQuery) => {
  return await await models.lead.countDocuments(findQuery);
};

module.exports.findLead = async (findCondition) => {
  return await models.lead.findOne(findCondition);
}

module.exports.findUser = async (findCondition) => {
  return await models.user.findOne(findCondition);
}


module.exports.getReminder = async (findCondition) => {
  return await models.reminder.find(findCondition);
}

module.exports.findLeadBySearch = async (findQuery, applyPagination, skip, limit, isselectAllLeads) => {
  let pagination = []
  if (applyPagination && !isselectAllLeads) {
    pagination = [
      {
        $skip: skip // Skip documents based on the current page
      },
      {
        $limit: limit // Limit the number of documents per page
      }
    ]
  }
  let leadList = await models.lead.aggregate([
    ...findQuery,
    {
      $lookup: {
        from: 'users',
        let: {
          userId: { $toObjectId: '$assignedTo' }
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$_id', '$$userId'] }]
              }
            }
          },
          {
            $project: {
              firstName: 1,
              lastName: 1
            }
          }
        ],
        as: 'userInfo'
      },
    },
    {
      $unwind: {
        path: '$userInfo', preserveNullAndEmptyArrays: true
      }
    },
    {
      $addFields: {
        assignedToUser: {
          $concat: [
            { '$ifNull': ['$userInfo.firstName', ""] },
            " ",
            { '$ifNull': ['$userInfo.lastName', ""] },
          ]
        }
      },
    },
    ...pagination])

  return leadList;
};

module.exports.createTimeLines = async (docs) => {
  return await models.timeline.insertMany(docs);
}

module.exports.createTimeLine = async (doc) => {
  return await models.timeline.create(doc);
}
module.exports.getCustomLogin = async (userId) => {
  const existingPreference = await models.email_preference.findOne({ userId: userId })

  const defaultPreference = await models.email_preference.findOne({
    isDefault: true
  })

  if (!existingPreference) {
    return defaultPreference
  }
  else return existingPreference;

}


module.exports.setCustomLogin = async (userId, customEmail, customPwd, customHost, customPort, isDefault) => {

  return await models.email_preference.findOneAndUpdate(
    {
      userId: userId,
      // email: customEmail
    }, // Find document by email
    {
      userId: userId,
      email: customEmail,
      password: customPwd,
      host: customHost,
      port: customPort,
      isDefault: isDefault
    },
    { upsert: true, new: true } // Upsert and return the updated document
  );

}

module.exports.fetchAssignedLeadTimeLine = async (leadId, userId) => {
  return models.timeline.aggregate([
    {
      '$match': {
        'leadId': new mongoose.Types.ObjectId(leadId),
        'userId': new mongoose.Types.ObjectId(userId),
        'timeLineOperation': { "$in": [constants.timeLineOperation.LEAD_ASSIGN] }
      },
    },
    {
      '$project': {
        yearMonthDay: {
          '$dateToString': {
            format: '%Y-%m-%d',
            date: '$createdAt'
          }
        },
        // leadId: 1,
        // userId: 1,
        timeLineOperation: 1,
        actionPerformedBy: 1,
        createdAt: 1
      }
    },
  ])
}

module.exports.fetchLeadEditFields = async (leadId, userId) => {
  return models.timeline.aggregate([
    {
      '$match': {
        'leadId': new mongoose.Types.ObjectId(leadId),
        'userId': new mongoose.Types.ObjectId(userId),
        'timeLineOperation': { "$in": [constants.timeLineOperation.LEAD_EDITED] }
      },
    },
    {
      '$project': {
        yearMonthDay: {
          '$dateToString': {
            format: '%Y-%m-%d',
            date: '$createdAt'
          }
        },
        // leadId: 1,
        // userId: 1,
        leadEditFields: 1,
        timeLineOperation: 1,
        actionPerformedBy: 1,
        createdAt: 1
      }
    },
  ])
}


module.exports.fetchReminderTimeLines = async (leadId, userId) => {
  return models.timeline.aggregate([
    {
      '$match': {
        'leadId': new mongoose.Types.ObjectId(leadId),
        'userId': new mongoose.Types.ObjectId(userId),
        'timeLineOperation': { "$in": [constants.timeLineOperation.REMINDER_ADDED, constants.timeLineOperation.REMINDER_EDITED, constants.timeLineOperation.REMINDER_DELETED] }
      },
    },
    {
      '$project': {
        yearMonthDay: {
          '$dateToString': {
            format: '%Y-%m-%d',
            date: '$createdAt'
          }
        },
        // leadId: 1,
        // userId: 1,
        timeLineOperation: 1,
        actionPerformedBy: 1,
        text: "$reminderMessage",
        createdAt: 1
      }
    },
  ])
}

module.exports.fetchNotesTimeLines = async (leadId, userId) => {
  return await models.timeline.aggregate([
    {
      '$match': {
        'leadId': new mongoose.Types.ObjectId(leadId),
        'userId': new mongoose.Types.ObjectId(userId),
        'timeLineOperation': {
          '$in': [constants.timeLineOperation.NOTE_ADDED, constants.timeLineOperation.NOTE_EDITED, constants.timeLineOperation.NOTE_DELETED]
        }
      }
    },
    {
      '$project': {
        _id: 0,
        text: 1, // Extract the 'text' field from the 'note' array
        actionPerformedBy: 1,
        timeLineOperation: 1,
        noteType: 1,
        createdAt: 1,
        text: 1,
        yearMonthDay: {
          '$dateToString': {
            'format': '%Y-%m-%d',
            'date': '$createdAt'
          }
        }
      }
    },
  ]);

}

module.exports.fetchEmailTimelines = async (leadId, userId) => {
  return models.timeline.aggregate([
    {
      '$match': {
        'leadId': new mongoose.Types.ObjectId(leadId),
        'userId': new mongoose.Types.ObjectId(userId),
        'timeLineOperation': { "$in": [constants.timeLineOperation.EMAIL_SENT, constants.timeLineOperation.EMAIL_OPENED, constants.timeLineOperation.SENT_EMAIL_REPLY, constants.timeLineOperation.REC_EMAIL_REPLY] }
      },
    },
    {
      '$project': {
        yearMonthDay: {
          '$dateToString': {
            format: '%Y-%m-%d',
            date: '$createdAt'
          }
        },
        // leadId: 1,
        // userId: 1,
        emailDetails: 1,
        timeLineOperation: 1,
        actionPerformedBy: 1,
        createdAt: 1
      }
    },
  ])
}

module.exports.findLastNoteLog = async (noteId) => {
  return await models.noteLog.findOne(noteId).sort({ timestampField: -1 });
}

module.exports.findLeadByFilter = async (filterConditions, applyPagination, skip, limit) => {
  let pipeline = [];

  // Add the $match stage for filter conditions
  if (Object.keys(filterConditions).length > 0) {
    pipeline.push({ $match: filterConditions });
  }

  // Add the $skip and $limit stages for pagination
  if (applyPagination) {
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });
  }

  return await models.lead.aggregate(pipeline);
};

module.exports.getDistinctFields = async (field, assignedTo) => {
  let query = {};

  if (assignedTo !== '') {
    // query = { assignedTo: assignedTo };
    query = { ...assignedTo }
  }

  query[field] = { $ne: null }; // Add a filter to exclude null values

  return await models.lead
    .find(query)
    .distinct(field)
    .exec();
};

module.exports.unsubsribeLead = async (leadId) => {
  return await models.lead.findOneAndUpdate({ _id: leadId }, { $set: { unsubscribed: true } }, { new: true })
}

module.exports.checkEmailSent = async (userId, leadId) => {
  try {
    const response = await models.lead_emails.findOne({ leadId: leadId, userId: userId });
    // console.log(`response: ${response}`)
    if (response != null) {
      // An entry with the given criteria exists
      return true;
    } else {
      // No matching entry found
      return false;
    }
  } catch (error) {
    console.error('Error checking email sent:', error);
    throw error;
  }
};

module.exports.checkOpenCount = async (userId, leadId, filters) => {
  try {
    const { lessThan, greaterThan } = filters;

    const trackerData = await models.tracker.find({ leadId: leadId, userId: userId });
    console.log(`trackerDtaa: ${trackerData}`)
    if (!trackerData || trackerData.length === 0) {
      // If no data is found, return false
      return false;
    }

    // Check if any openCount matches the conditions
    const hasOpenCountMatch = trackerData.some((data) => {
      if (lessThan && greaterThan) {
        return data.openCount <= lessThan && data.openCount >= greaterThan;
      } else if (lessThan) {
        return data.openCount <= lessThan;
      } else if (greaterThan) {
        return data.openCount >= greaterThan;
      }
      return false;
    });

    return hasOpenCountMatch;
  } catch (error) {
    console.error('Error checking open count:', error);
    throw error;
  }
};
