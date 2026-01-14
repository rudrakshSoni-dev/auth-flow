import brcypt from "bcrypt"
import crypto from "crypto"
import User from "../models/User.js"

const signup = async (req,res)=> {
    const { name,email,password } = req.validated.body;//fetch the name ,etx from req.body

    const exists = await User.findOne({ email }); // findOne email cuz we have selected index:true in userSchema model for signup 
    if(exists){
        return res.status(409).json({message: "Email already registered"});
    }

    const user = await User.create({
        name,
        email,
        password,
    })
}

export default signup ;