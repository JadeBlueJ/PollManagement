const models = require("../models");


module.exports.getUsers = async function (query, skip, limit) {
  return await models.user.find(query).sort({ createdAt: -1 }).populate('roleId', 'title').skip(skip).limit(limit);
};

module.exports.findTotalUserCount = async (query) => {
  return await models.user.countDocuments(query);
}

module.exports.getUser = async function (uid) {
  return await models.user.findOne({ _id: uid }).populate('roleId', 'title');
};
module.exports.getCustomLoginDetails = async function (uid) {
  const result = await models.email_preference.findOne({ userId: uid })
  return result
};


module.exports.deleteUser = async function (id) {
  // Delete the user from the database
  return await models.user.findOneAndDelete({ _id: id });

};

module.exports.updateUser = async function (id, userName, newEmail, status) {
  // Delete the user from the database
  return await models.user.findOneAndUpdate(
    { _id: id },
    { userName, email: newEmail, status },
    { new: true }
  );
};

module.exports.getTracker = async (uid) => {
  try {
    const existingTracker = await models.tracker.findOne({ uid });

    if (!existingTracker) {
      throw new Error('Tracker not found'); // Handle error if the tracker with the given uid is not found
    }
    else return existingTracker
  } catch (error) {
    console.error('Error getting tracker:', error);
    throw error;
  }
};

module.exports.updateTracker = async (uid) => {
  try {
    const existingTracker = await models.tracker.findOne({ uid });

    if (!existingTracker) {
      throw new Error('Tracker not found'); // Handle error if the tracker with the given uid is not found
    }

    // Update isOpened and openedAt only if isOpened is currently false
    const updatedTracker = await models.tracker.findOneAndUpdate(
      { uid },
      {
        $push: {
          openedAt: new Date(),
        },
        $inc: {
          openCount: 1
        }
      },
      { new: true }
    );
    return updatedTracker;

  } catch (error) {
    console.error('Error updating tracker:', error);
    throw error;
  }
};