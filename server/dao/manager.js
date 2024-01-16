const models = require("../models");

module.exports.addLead = async (document) => {
    return await models.lead.create(document);
}

module.exports.importLeads = async (documents) => {
    return await models.lead.insertMany(documents);
}

module.exports.deleteLead = async (matchCondition, setObj) => {
    return await models.lead.updateOne(matchCondition, setObj);
}

module.exports.assignLead = async (selectedUser, selectedLeads) => {
    return await models.lead.updateMany({ _id: { $in: selectedLeads } }, { assignedTo: selectedUser });
}

module.exports.getNoteLog = async (leadId) => {
    return await models.noteLog.find({ leadId: leadId }).sort({ createdAt: -1 });
}


// module.exports.getLeadEmails = async (userId, leadId) => {
//     return await models.lead_emails.find({ userId, leadId }).sort({ createdAt: -1 }).exec();
// }
module.exports.getLeadEmails = async (userId, leadId) => {
    try {
        // Find all unique threadIds for the given userId and leadId
        const uniqueThreadIds = await models.lead_emails.distinct('threadId', { userId, leadId });

        // Initialize an array to store the latest emails for each thread
        let latestEmails = [];

        // Iterate through unique threadIds
        for (const threadId of uniqueThreadIds) {
            // Find the latest email in each thread based on createdAt
            let latestEmail = await models.lead_emails
                .findOne({ userId, leadId, threadId })
                .sort({ createdAt: -1 });

            if (latestEmail) {
                const openedEmailsCount = await models.tracker.countDocuments({
                    userId,
                    leadId,
                    threadId,
                    openCount: { $gt: 0 },
                });
                // Calculate the total number of emails in this thread
                const totalEmailsCount = await models.tracker.countDocuments({
                    userId,
                    leadId,
                    threadId,
                });
                // Add the counts to the latestEmail object
                latestEmail = latestEmail.toObject(); // Convert to plain JavaScript object
                latestEmail.openRate = `${openedEmailsCount}/${totalEmailsCount}`;
                latestEmails.push(latestEmail);
            }
        }

        // Sort the latest emails by createdAt in descending order (most recent first)
        latestEmails.sort((a, b) => b.createdAt - a.createdAt);

        return latestEmails;
    } catch (error) {
        console.error('Error getting latest lead emails:', error);
        throw error;
    }
}


module.exports.updateLead = async (matchCondition, setObj) => {
    return await models.lead.updateOne(matchCondition, setObj);
}

module.exports.deleteThread = async (threadId) => {
    return await models.lead_emails.deleteMany({ threadId });
}


module.exports.getCustomEmailThread = async(threadId)=>{
    return await models.lead_emails.find({threadId})
}