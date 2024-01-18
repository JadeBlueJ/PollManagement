const User = require("../models/User.js");

module.exports.addUser=async(req,res)=>{
    const body = req.body
    User.create({
        email:body.email,
    })

    return res.status(200).json({message: 'User created successfully'})
}