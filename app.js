var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cookieSession = require("cookie-session");

var cors = require('cors');
var jwt = require("jsonwebtoken");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var secretkey = 'secretkey';

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cookieSession({
  name: "session",
  keys: ["0123456789"],
  maxAge: 2 * 24 * 60 * 60 * 1000
}));

app.use(cors());  // 解决跨域问题

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// 除了登陆注册以外的接口进行jwt token 登陆验证(自定义一个中间件)
// app.use(async function (req, res, next) {
  // /getUserInfor
  // req.path!="/checkToken"&&req.path!="/teaLogin"&&req.path != "/deleteResource" && req.path != "/removeRole" && req.path != "/addRole" && req.path != "/login" && req.path != "/reg" && req.path != '/oauth/redirect'
//   if (req.path!="/getUserInfor"&&req.path!="/checkToken"&&req.path!="/teaLogin" && req.path != "/login" && req.path != "/reg") {
//     var token = req.body.token || req.query.token || req.headers.token;
//     jwt.verify(token, secretkey, function (err, decode) {
//       if (err) {
//         res.json({
//           message: 'token过期，请重新登录'
//         })
//       } else {
//         next();
//       }
//     })
//   } else {
//     next();
//   }
// });


app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
