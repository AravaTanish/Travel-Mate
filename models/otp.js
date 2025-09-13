const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const otpSchema = new Schema({
  email: String,
  otp: String,
  created_at: {
    type: Date,
    expires: 300, // 5 mins
    default: Date.now,
  },
});

module.exports = mongoose.model("OTP", otpSchema);
