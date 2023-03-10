const OTP = require("../models/otp");
const User = require("../models/users");
const url = require("url");
const Course = require("../models/courses");
const Package = require("../models/package");

module.exports = {
  async verification(req, res) {
    try {
      let cart = req.session.cart;
      var { user: userID } = req.query;
      if (userID) {
        let user = await User.findById(userID);
        // if verified user then redirect to payment
        if (user.verified) {
          return res.redirect(
            url.format({
              pathname: "/payment",
              query: {
                user: user._id.toString(),
              },
            })
          );
        } else {
          if (cart.itemType == "course" && cart.item) {
            let course = await Course.findById(cart.item);
            user.total = course.price;
          }
          if (cart.itemType == "package" && cart.item) {
            let package = await Package.findById(cart.item);
            var { price, tax } = package;
            user.total = Math.round(price * ((100 + tax) / 100));
          }
          return res.render("verification", {
            title: "Verification",
            user,
          });
        }
      }
      return res.redirect("/");
    } catch (error) {
      console.log("Error at verification:", error.message);
      return res.redirect("/");
    }
  },
  async doVerification(req, res) {
    const { val1, val2, val3, val4, userID } = req.body;
    const code = val1 + val2 + val3 + val4;
    const otp = await OTP.findOne({ otp: code });
    if (!otp) {
      let user = await User.findById(userID)
        .populate("package")
        .populate("courses");
      if (user.package) {
        var { price, tax } = user.package;
        user.total = price * ((100 + tax) / 100); //total price with tax
      } else {
        user.total = user.courses[0].price;
      }

      return res.render("verification", {
        title: "Verification",
        user,
        err: "OTP incorrect or expired.",
      });
    }
    const user = await User.findByIdAndUpdate(userID, { verified: true });
    await otp.deleteOne();
    res.redirect(
      url.format({
        pathname: "/payment",
        query: {
          user: user._id.toString(),
        },
      })
    );
  },
};
