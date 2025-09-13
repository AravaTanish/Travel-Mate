const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const pasportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  // for verification (OTP)
  verified: {
    type: Boolean,
    default: false,
  },
});

userSchema.plugin(pasportLocalMongoose); //adds username, hash and salt fields
module.exports = mongoose.model("User", userSchema);
