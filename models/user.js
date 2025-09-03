const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const pasportLocalMongoose = require("passport-local-mongoose");
const { listingSchema } = require("../schema");

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
});

userSchema.plugin(pasportLocalMongoose); //adds username, hash and salt fields
module.exports = mongoose.model("User", userSchema);
