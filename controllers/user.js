const User = require("../models/user.js");

//Sign Up
module.exports.getSignup = (req, res) => {
  res.render("users/signup.ejs");
};

module.exports.postSignup = async (req, res, next) => {
  try {
    let { username, email, password } = req.body;
    const newUser = new User({ email: email, username: username });
    let registeredUser = await User.register(newUser, password);
    // console.log(registeredUser);
    req.login(registeredUser, (err) => {
      if (err) {
        next(err);
      }
      req.flash("success", "User registered successfully!");
      res.redirect("/listings");
    });
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/signup");
  }
};

//Log In
module.exports.getLogin = (req, res) => {
  res.render("users/login.ejs");
};

module.exports.postLogin = async (req, res) => {
  req.flash("success", "Logged in successfully!");
  if (res.locals.redirectUrl) {
    res.redirect(res.locals.redirectUrl);
  } else res.redirect("/listings");
};

//Log Out
module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "Logged out successfully!");
    res.redirect("/listings");
  });
};
