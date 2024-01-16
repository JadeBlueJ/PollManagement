const models = require("../models");

module.exports.userInfo = async function (email) {
  return await models.user.findOne({ email: email }).populate('roleId');
};

module.exports.createUser = async (user) => {
  const createdUser = await user.save();
  return createdUser
};

module.exports.findUserUID = async (uid) => {
  return await models.user.findOne({ _id: uid });
};


module.exports.updatePassword = async (user, hashedPassword) => {
  user.password = hashedPassword;
  const updatedUser = await user.save();
  return updatedUser
};


module.exports.createNewPassword = async (findCondition, updateCondition) => {
  return await models.user.updateOne(findCondition, updateCondition)
}