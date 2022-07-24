const nodemailer = require("nodemailer");
//const { getMaxListeners } = require("../schemas/user");
const smtpTransport = require('nodemailer-smtp-transport');
require("dotenv").config();

// 메일발송 객체
const mailSender = {
  // 메일발송 함수
  sendGmail: function (param) {
    let transporter = nodemailer.createTransport(smtpTransport({
      service: "gmail", 
      // port: 587,
      host: "smtp.gmail.com",
      secure: false,
      auth: {
        // type: "login",
        user: process.env.MAILS_EMAIL,  // gmail 계정 아이디를 입력
        pass: process.env.MAILS_PWD 
      },
    }));

    // mailoptions
    let mailOptions = {
      from: process.env.MAILS_EMAIL, // sender
      to: param.toEmail, 
      subject: param.subject, 
      text: param.text, 
    };

    // 메일 발송
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  },
};


module.exports = mailSender;

