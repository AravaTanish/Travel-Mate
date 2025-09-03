const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const { saveUrl } = require("../middleware.js");
const userController = require("../controllers/user.js");

//Sign Up
router
  .route("/signup")
  .get(userController.getSignup)
  .post(wrapAsync(userController.postSignup));

//Log In
router
  .route("/login")
  .get(userController.getLogin)
  .post(
    saveUrl,
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    userController.postLogin
  );

//Log Out
router.get("/logout", userController.logout);

module.exports = router;
