const model = require("../models");
const constants = require("../helper/utilities/constants")
module.exports.getLeadTask = async (userId, leadId) => {
    return model.task.find({ userId: userId, leadId: leadId }).populate('statusId');
}

module.exports.setLeadTask = async (doc) => {
    return await model.task.create(doc);
}
module.exports.updateLeadTask = async (taskId, updateObj) => {
    const updateQuery = {};
    console.log(`tid: ${taskId}`)
    console.log(`updateObj : ${updateObj}`)
    if (updateObj.statusId) {
        updateQuery.$set = { statusId: updateObj.statusId };
    }
    if (updateObj.emailNote) {
        updateQuery.$push = { emailNote: updateObj.emailNote };
    }

    if (updateObj.callNote) {
        if (!updateQuery.$push) updateQuery.$push = {};
        updateQuery.$push.callNote = updateObj.callNote;
    }

    if (updateObj.socialNote) {
        if (!updateQuery.$push) updateQuery.$push = {};
        updateQuery.$push.socialNote = updateObj.socialNote;
    }

    if (updateObj.reminder) {
        if (!updateQuery.$push) updateQuery.$push = {};
        updateQuery.$push.reminder = updateObj.reminder;
    }

    if (Object.keys(updateQuery).length === 0) {
        // No valid parameters found in task object
        return Promise.resolve();
    }

    return await model.task.findOneAndUpdate(
        { _id: taskId },
        updateQuery,
        { new: true } // This option returns the updated document
    );
}

module.exports.addNote = async (docs) => {
    return await model.note.create(docs);
}

module.exports.getNotes = async (leadId) => {
    return await model.note.find({ leadId: leadId });
}

module.exports.updateNote = async (taskId, note, noteType) => {
    try {
        let fieldToUpdate;

        // Determine which note field to update based on the noteType
        switch (noteType) {
            case 1:
                fieldToUpdate = 'emailNote';
                break;
            case 2:
                fieldToUpdate = 'callNote';
                break;
            case 3:
                fieldToUpdate = 'socialNote';
                break;
            default:
                return { success: false, message: 'Invalid note type' };
        }

        const updatedTask = await model.task.findOneAndUpdate(
            { _id: taskId, [`${fieldToUpdate}._id`]: note.noteId },
            { $set: { [`${fieldToUpdate}.$.text`]: note.text } },
            { new: true }
        );

        if (updatedTask) {
            const updatedNote = updatedTask[fieldToUpdate]
            return { success: true, message: `${fieldToUpdate} updated successfully`, updatedNote };
        } else {
            return { success: false, message: `${fieldToUpdate} not found or not updated` };
        }
    } catch (error) {
        return { success: false, message: `Error updating ${fieldToUpdate}: ` + error.message };
    }
}

module.exports.deleteNote = async (taskId, note, noteType) => {
    try {
        let fieldToUpdate;

        // Determine which note field to update based on the noteType
        switch (noteType) {
            case 1:
                fieldToUpdate = 'emailNote';
                break;
            case 2:
                fieldToUpdate = 'callNote';
                break;
            case 3:
                fieldToUpdate = 'socialNote';
                break;
            default:
                return { success: false, message: 'Invalid note type' };
        }

        // Use the findOneAndUpdate method to delete the specific note
        const updatedTask = await model.task.findOneAndUpdate(
            { _id: taskId },
            { $pull: { [fieldToUpdate]: { _id: note.noteId } } },
            { new: true } // This option returns the updated document
        );

        if (updatedTask) {
            const updatedNoteArray = updatedTask[fieldToUpdate];
            return { success: true, message: `${fieldToUpdate} deleted successfully`, updatedNoteArray };
        } else {
            return { success: false, message: `${fieldToUpdate} not found or not deleted` };
        }
    } catch (error) {
        return { success: false, message: `Error deleting ${fieldToUpdate}: ` + error.message };
    }
}

module.exports.createNoteLog = async (logNote) => {
    return await model.noteLog.create(logNote);
}

module.exports.updateName = async (id, firstName, lastName) => {
    return await model.user.findOneAndUpdate({ _id: id }, { firstName: firstName, lastName: lastName }, { new: false });
};

module.exports.updateEmail = async (id, email) => {
    return await model.user.findOneAndUpdate(
        { _id: id },
        {
            email,
            status: 0,
        },
        { new: false }
    );
};
module.exports.createReminder = async (document) => {
    return await model.reminder.create(document);
}


module.exports.updateReminderStatus = async (taskId, reminderIndex, newStatus) => {
    // return await model.task.updateOne(findCondition, updateCondition)
    try {
        console.log(`task: `)
        const task = await model.task.findOne({ _id: taskId });
        if (!task) {
            console.log(`task not found`)
            return { success: false, message: "Task not found" };
        }
        console.log(`task: ${task}`)
        // Update the status of the specific reminder
        if (
            task.reminder &&
            task.reminder.length > reminderIndex
        ) {
            console.log(`inside save handler`)
            task.reminder[reminderIndex].status = newStatus;
            await task.save();
            console.log(`Reminder status updated successfully`)
            return { success: true, message: "Reminder status updated successfully", updatedTask: task };
        } else {
            console.log(`Invalid reminder index or structure`)
            return { success: false, message: "Invalid reminder index or structure" };
        }
    } catch (error) {
        console.log(`Error updating reminder status: ${error}`)

        return { success: false }
    }

}


module.exports.updateReminder = async (taskDetails, request) => {
    // return await model.task.updateOne(findCondition, updateCondition)
    try {
        // console.log(`taskDetails: ${taskDetails}`)
        let task = await model.task.findOne({ _id: taskDetails._id });

        // Find the index of the reminder to update
        const reminderIndex = task.reminder.findIndex(reminder => reminder._id.toString() === request._id);

        if (reminderIndex !== -1) {
            // Create an object with the updated reminder data
            const updatedReminderObj = {
                text: request.text,
                scheduleTime: request.scheduleTime,
                reminderEnabled: request.reminderEnabled,
                status: request.status
            };

            // Update the reminder at the specified index
            task.reminder[reminderIndex] = updatedReminderObj;

            // Save the updated task
            await task.save();

            return { reminder: task.reminder, success: true, message: 'Reminder updated successfully' };
        } else {
            return { success: false, message: 'Reminder not found' };
        }
    } catch (error) {
        return { success: false, message: 'Error updating reminder: ' + error.message };
    }

}



module.exports.deleteReminder = async (taskId, reminder) => {
    try {
        const updatedTask = await model.task.findOneAndUpdate(
            { _id: taskId },
            { $pull: { 'reminder': { _id: reminder._id } } },
            { new: true }
        );

        if (updatedTask) {
            return { success: true, message: 'Reminder status updated successfully', updatedTask };
        } else {
            return { success: false, message: 'Reminder not found or not updated' };
        }
    } catch (error) {
        return { success: false, message: 'Error updating reminder status: ' + error.message };
    }
}


module.exports.createLeadEmailDetails = async (obj) => {
    return await model.lead_emails.create(obj);
}
module.exports.createTracker = async (uid, threadId, messageId, userId, leadId, subject, leadEmailId) => {
    return await model.tracker.create({
        uid,
        leadEmailId,
        threadId,
        messageId,
        leadId,
        userId,
        subject,
        openCount: 0,

    });
}
// module.exports.findUserEmailThreads = async (userEmail) => {
//     const userThreads = await model.lead_emails.find(
//         {
//             $or: [
//                 { sender: userEmail },
//                 { receivers: userEmail }
//             ]
//         },
//         { threadId: 1, _id: 0, lastPolledAt: 1, userId: 1, leadId: 1 }
//     );
//     return userThreads.map((thread) => thread.toObject());
// };

module.exports.findUserEmailThreads = async (userEmail, uid) => {
    try {
        // Step 1: Find unique threadIds associated with the user's email
        const query = uid && uid!=null? {
            $and: [
                {
                    $or: [
                        { sender: userEmail },
                        { receivers: userEmail }
                    ]
                },
                { uid: uid }
            ]
        }
            : {
                $or: [
                    { sender: userEmail },
                    { receivers: userEmail }
                ]
            }
        const uniqueThreadIds = await model.lead_emails.distinct('threadId', {
            ...query
        });

        // Step 2: Find the latest email details for each unique threadId
        const userThreads = await Promise.all(uniqueThreadIds.map(async (threadId) => {
            const latestEmail = await model.lead_emails
                .findOne({ threadId })
                .sort({ lastPolledAt: -1 }) // Sort by lastPolledAt in descending order to get the latest email
                .select({ threadId: 1, _id: 0, lastPolledAt: 1, userId: 1, leadId: 1, });

            // Find the maximum value of lastPolledSeq for this threadId
            const maxLastPolledSeq = await model.lead_emails
                .find({ threadId })
                .sort({ lastPolledSeq: -1 }) // Sort by lastPolledSeq in descending order to get the maximum value
                .limit(1) // Limit to 1 result (the maximum value)
                .select({ lastPolledSeq: 1 });

            // If there are results for maxLastPolledSeq, set it; otherwise, set it to 0
            const lastPolledSeq = maxLastPolledSeq.length > 0 ? maxLastPolledSeq[0].lastPolledSeq : 0;
            // Include lastPolledSeq in the latestEmail object
            latestEmail.lastPolledSeq = lastPolledSeq;

            return latestEmail.toObject();
        }));

        return userThreads;
    } catch (error) {
        // Handle the error if necessary
        console.error('Error finding user email threads:', error);
        throw error;
    }
};


module.exports.updateLeadEmailDetails = async (replyEmailData, threadId) => {
    try {
        // Find the email in the lead_emails collection based on the sender and threadId
        const thread = await model.lead_emails.findOne({ threadId });

        if (!thread) {
            // Email not found, handle the error or throw an error if required
            throw new Error('Email not found');
        }
        return await model.lead_emails.create(replyEmailData);
    } catch (error) {
        // Handle the error if necessary
        console.error('Error updating lead email entry:', error);
        throw error;
    }
};
