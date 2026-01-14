import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
    name:{ type:String, required:true, trim:true, minlength:2 ,maxlength:50 } ,

    email:{type:String, required:true, trim:true, lowercase:true, index: true, unique:true},

    password:{type:String, required:true, trim:true, }

    // passwordHash: { type: String, required: true },

    // isEmailVerified: { type: Boolean, default: false },

    // emailVerifyTokenHash: { type: String, default: null },
    // emailVerifyTokenExpiresAt: { type: Date, default: null },

    // passwordResetTokenHash: { type: String, default: null },
    // passwordResetTokenExpiresAt: { type: Date, default: null },
},{timestamps: true});

// userSchema.set("toJSON", {
//     transform:(doc, ret) => {
//         delete ret.passwordHash;
//         delete ret.emailVerifyTokenExpiresAt;
//         delete ret.emailVerifyTokenHash;
//         delete ret.passwordResetTokenExpiresAt;
//         delete ret.passwordResetTokenHash;
//         return ret;
//         delete ret.__v;
//     }
// })

export default mongoose.model("User", userSchema);