const User = require("../models/user.js");
const OTP = require("../models/otp.js");
const nodemailer = require("nodemailer");

//Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

//function to generate otp
function generateOTP() {
  const otp = Math.floor(10000 + Math.random() * 90000).toString();
  return otp;
}

function sendOTP(email, username, otpCode) {
  //Send OTP
  const mail = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify your account",
    text: `Hello ${username}, your OTP is ${otpCode}. It will expire in 5 minutes.`,
  };

  transporter.sendMail(mail, (error, info) => {
    if (error) {
      console.log("OTP error: ", error);
      req.flash("error", "Failed to send OTP");
      return res.redirect("/signup");
    } else {
      req.flash("success", "OTP sent to your email. Please verify.");
      return res.redirect(`/verify?email=${email}`);
    }
  });
}

//Sign Up
module.exports.getSignup = (req, res) => {
  res.render("users/signup.ejs");
};

module.exports.postSignup = async (req, res, next) => {
  try {
    let { username, email, password } = req.body;
    const newUser = new User({ email: email, username: username });
    let registeredUser = await User.register(newUser, password);
    const otpCode = generateOTP();
    await OTP.findOneAndDelete({ email });
    const otpEntry = new OTP({ email: email, otp: otpCode });
    await otpEntry.save();
    sendOTP(email, username, otpCode);
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
  if (req.user && !req.user.verified) {
    const email = req.user.email;
    const username = req.user.username;
    const otpCode = generateOTP();
    await OTP.findOneAndDelete({ email });
    const otpEntry = new OTP({ email: email, otp: otpCode });
    await otpEntry.save();
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      req.flash("error", "Please verify your email before logging in.");

      sendOTP(email, username, otpCode);
      return res.redirect(`/verify?email=${email}`);
    });
  } else {
    req.flash("success", "Logged in successfully!");
    if (res.locals.redirectUrl) {
      res.redirect(res.locals.redirectUrl);
    } else res.redirect("/listings");
  }
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

//OTP verify
module.exports.getVerify = (req, res) => {
  const email = req.query.email;
  res.render("users/verify.ejs", { email });
};

module.exports.postVerify = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const record = await OTP.findOne({ email });

    if (!record) {
      req.flash("error", "OTP expired or invalid.");
      return res.redirect(`/verify?email=${email}`);
    }

    if (record.otp !== otp) {
      req.flash("error", "Incorrect OTP.");
      return res.redirect(`/verify?email=${email}`);
    }

    const user = await User.findOneAndUpdate({ email }, { verified: true });
    await OTP.deleteOne({ email });

    req.flash("success", "Email verified! You can now log in.");
    req.login(user, (err) => {
      if (err) {
        next(err);
      }
      req.flash("success", "User registered successfully!");
      res.redirect("/listings");
    });
  } catch (error) {
    req.flash("error", "Server error.");
    res.redirect(`/verify?email=${email}`);
  }
};
