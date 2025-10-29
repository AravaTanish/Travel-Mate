const User = require("../models/user.js");
const OTP = require("../models/otp.js");
const Sib = require("sib-api-v3-sdk");

// Initialize Brevo API
const client = Sib.ApiClient.instance;
client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;
const tranEmailApi = new Sib.TransactionalEmailsApi();

// Function to generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Function to send OTP via Brevo
async function sendOTP(email, username, otpCode) {
  try {
    const sender = {
      email: process.env.EMAIL_USER,
      name: "Travel Mate",
    };

    const receivers = [{ email: email }];

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.4;">
        <div style="max-width:600px; margin:0 auto; padding:24px; border:1px solid #e6e6e6; border-radius:8px;">
          <h2 style="margin:0 0 12px; color:#0b5ed7;">Verify your Travel Mate account</h2>
          <p style="margin:0 0 18px;">Hello <strong>${username}</strong>,</p>

          <p style="margin:0 0 8px;">Use the verification code below to complete your sign up or login. This code will expire in <strong>5 minutes</strong>.</p>

          <div style="display:flex; justify-content:center; align-items:center; margin:18px 0;">
            <div style="background:#f7f9ff; border:1px dashed #cfe0ff; padding:14px 22px; border-radius:8px; font-size:20px; letter-spacing:4px;">
              <strong style="font-size:22px; color:#0b5ed7;">${otpCode}</strong>
            </div>
          </div>

          <p style="margin:0 0 8px;">If you didn't request this, you can safely ignore this email.</p>

          <p style="margin:14px 0 0; color:#555;">
            Need help? Reply to this email and we'll assist you.
          </p>

          <hr style="border:none; border-top:1px solid #eee; margin:18px 0;" />

          <p style="margin:0; color:#777; font-size:13px;">
            Travel Mate • Building better journeys
          </p>
        </div>
      </div>
    `;

    await tranEmailApi.sendTransacEmail({
      sender,
      to: receivers,
      subject: "Your Travel Mate verification code",
      htmlContent,
    });

    console.log(`OTP email sent successfully to ${email}`);
  } catch (error) {
    console.error("sendOTP failed:", error);
    throw error;
  }
}

// Function to create unique username
async function generateUniqueUsername(firstName, lastName) {
  let baseUsername = (firstName + lastName).toLowerCase().replace(/\s+/g, "");
  let username = baseUsername;
  let count = 0;

  while (await User.findOne({ username })) {
    count++;
    username = baseUsername + count;
  }

  return username;
}

// Sign Up
module.exports.getSignup = (req, res) => {
  if (req.isAuthenticated()) {
    req.flash("error", "You are already logged in!");
    return res.redirect("/listings");
  }
  res.render("users/signup.ejs");
};

module.exports.postSignup = async (req, res) => {
  try {
    let { first_name, last_name, password, email } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash(
        "error",
        "An account with this email already exists. Please login instead."
      );
      return res.redirect("/user/login");
    }

    const username = await generateUniqueUsername(first_name, last_name);
    const newUser = new User({
      email: email,
      username: username,
    });

    let registeredUser = await User.register(newUser, password);

    const otpCode = generateOTP();
    await OTP.findOneAndDelete({ email });
    const otpEntry = new OTP({ email: email, otp: otpCode });
    await otpEntry.save();

    try {
      await sendOTP(email, username, otpCode);
      return res.redirect(`/user/verify?email=${email}`);
    } catch (mailErr) {
      console.error("sendOTP failed in postSignup:", mailErr);
      await User.deleteOne({ _id: registeredUser._id }).catch(() => {});
      await OTP.deleteOne({ email }).catch(() => {});
      req.flash(
        "error",
        "Failed to send verification email. Please try signing up again later."
      );
      return res.redirect("/user/signup");
    }
  } catch (err) {
    console.error("postSignup error:", err);
    req.flash("error", err.message || "Server error during signup.");
    res.redirect("/user/signup");
  }
};

// Log In
module.exports.getLogin = (req, res) => {
  if (req.isAuthenticated()) {
    req.flash("error", "You are already logged in!");
    return res.redirect("/listings");
  }
  res.render("users/login.ejs");
};

module.exports.postLogin = async (req, res, next) => {
  try {
    if (req.user && !req.user.verified) {
      const email = req.user.email;
      const username = req.user.username;
      const otpCode = generateOTP();
      await OTP.findOneAndDelete({ email });
      const otpEntry = new OTP({ email: email, otp: otpCode });
      await otpEntry.save();

      req.logout(async (err) => {
        if (err) {
          return next(err);
        }
        try {
          await sendOTP(email, username, otpCode);
          req.flash("success", "OTP sent to your email. Please verify.");
          return res.redirect(
            `/user/verify?email=${encodeURIComponent(email)}`
          );
        } catch (error) {
          console.error("OTP send failed in postLogin:", error);
          req.flash("error", "Failed to send OTP. Please try again.");
          return res.redirect("/user/login");
        }
      });
    } else {
      req.flash("success", "Logged in successfully!");
      if (res.locals.redirectUrl) {
        return res.redirect(res.locals.redirectUrl);
      } else {
        return res.redirect("/listings");
      }
    }
  } catch (err) {
    console.error("postLogin error:", err);
    req.flash("error", "Server error during login.");
    res.redirect("/user/login");
  }
};

// Log Out
module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "Logged out successfully!");
    res.redirect("/listings");
  });
};

// OTP verify
module.exports.getVerify = (req, res) => {
  const email = req.query.email;
  res.render("users/verify.ejs", { email });
};

module.exports.postVerify = async (req, res, next) => {
  const { email, otp } = req.body;
  try {
    const record = await OTP.findOne({ email });

    if (!record) {
      req.flash("error", "OTP expired or invalid.");
      return res.redirect(`/user/verify?email=${email}`);
    }

    if (record.otp !== otp) {
      req.flash("error", "Incorrect OTP.");
      return res.redirect(`/user/verify?email=${email}`);
    }

    const user = await User.findOneAndUpdate({ email }, { verified: true });
    await OTP.deleteOne({ email });

    req.flash("success", "Email verified! You can now log in.");
    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", "User registered successfully!");
      res.redirect("/listings");
    });
  } catch (error) {
    console.error("postVerify error:", error);
    req.flash("error", "Server error.");
    res.redirect(`/user/verify?email=${email}`);
  }
};

// Resend OTP
module.exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      req.flash("error", "Email not found.");
      return res.redirect("/user/verify");
    }

    const newOtp = generateOTP();
    await OTP.findOneAndDelete({ email });
    const otpEntry = new OTP({ email, otp: newOtp });
    await otpEntry.save();

    const user = await User.findOne({ email });
    const username = user ? user.username : "User";

    await sendOTP(email, username, newOtp);

    req.flash("success", "A new OTP has been sent to your email.");
    res.redirect(`/user/verify?email=${email}`);
  } catch (err) {
    console.error("resendOtp error:", err);
    req.flash("error", "Failed to resend OTP. Try again later.");
    res.redirect(`/user/verify?email=${req.body.email}`);
  }
};
