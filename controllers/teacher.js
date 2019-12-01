var jwt = require("jsonwebtoken");
var mongoose = require("../models/mongoose.js");   // 连接mongodb数据库， 解决了数据库的不能多次连接的问题
var secretkey = 'secretkey';


// 登陆
exports.do_login = async function (req, res1, next) {
    var name = req.body.name;
    var pass = req.body.pass;
    var token = "";
    var monUserid = "";
    var content="";
    var image= "";
    var teaInfor=null;

    await new Promise((resolve, reject) => {
        // 在此处使用verify验证判断toekn 是否失效或者根本无效，当时没写（后期补上） 
        if (req.body.token) {
            jwt.verify(req.body.token, secretkey, function (err, data) {
                if (!err) {
                    res1.json({
                        errmsg: "您已经登陆了，无需重复登陆",
                        errno: 1
                    });
                } else {
                    res1.json({
                        errmsg: "登陆失败，请重试，新加的",
                        errno: 0
                    })
                    // 可能存在问题
                    resolve();   // 可能是token失效，也可能是恶意模拟token登陆，往下走
                }
            });
        } else {
            resolve();
        }
    });

    // 在mongodb数据库中是否存在这个登陆的用户
    await new Promise((resolve, reject) => {
        var whereStr1 = { "name": name, "pass": pass };
        mongoose.connection.db.collection("teachers").find(whereStr1).toArray(function (err, result) {
            if (err) {
                throw err;
            }
            teaInfor= result[0];
            monUserid = result[0]._id;
            content= result[0].content;
            image=result[0].image;
            // var _id = result[0]._id.toString();    // _id是object 类型，转化为string类型

            if (result.length > 0) {
                // 第一次登陆的时候生成token (注意使用的是mongodb数据库中的id)
                token = jwt.sign({ username: name, userid: monUserid }, secretkey, { expiresIn: 1000 * 60 * 60 * 24 * 8 });
                resolve();
            } else {
                res1.json({
                    "errmsg": "登陆失败，请重新登陆，用户名或者密码错误",
                    "teaInfor": "",
                    errno: 0
                });
                reject();
            }
        })
    });

    // 在mongodb数据库中更新token字段
    await new Promise((resolve, reject) => {
        mongoose.connection.db.collection("teachers").updateOne(
            { "_id": monUserid },
            { $set: { "token": token } },
            function (err, res) {
                if (err) {
                    console.log(err);
                    res1.json({
                        "errmsg": "登陆失败，请重试",
                        "teaInfor": "",
                        errno: 0
                    });
                } else {
                    // 把存储在mongodb用户的数据存储在session中提供以后使用（可能用不到session了）
                    req.session = { token: token, username: name, pass: pass, monUserid: monUserid ,content: content,image: image};
                    res1.json({
                        "errmsg": "/tealogin,post接口登陆成功",
                        "teaInofr": teaInfor,
                        "errno":101 
                    });
                    resolve();
                }
                resolve();
            })
    });
}

exports.do_login2 = async function (req, res1, next) {
    var name = req.body.name;
    var pass = req.body.pass;
    var token = "";
    var monUserid = "";
    var content="";
    var image= "";
    var teaInfor=null;

    await new Promise((resolve, reject) => {
        // 在此处使用verify验证判断toekn 是否失效或者根本无效，当时没写（后期补上） 
        if (req.body.token) {
            jwt.verify(req.body.token, secretkey, function (err, data) {
                if (!err) {
                    res1.json({
                        message: "您已经登陆了，无需重复登陆",
                        code: 1
                    });
                } else {
                    res1.json({
                        message: "登陆失败，请重试，新加的",
                        code: 0
                    })
                    // 可能存在问题
                    resolve();   // 可能是token失效，也可能是恶意模拟token登陆，往下走
                }
            });
        } else {
            resolve();
        }
    });

    // 在mongodb数据库中是否存在这个登陆的用户
    await new Promise((resolve, reject) => {
        var whereStr1 = { "name": name, "pass": pass };
        mongoose.connection.db.collection("teachers").find(whereStr1).toArray(function (err, result) {
            if (err) {
                throw err;
            }
            teaInfor= result[0];
            monUserid = result[0]._id;
            content= result[0].content;
            image=result[0].image;
            // var _id = result[0]._id.toString();    // _id是object 类型，转化为string类型

            if (result.length > 0) {
                // 第一次登陆的时候生成token (注意使用的是mongodb数据库中的id)
                token = jwt.sign({ username: name, userid: monUserid }, secretkey, { expiresIn: 1000 * 60 * 60 * 24 * 8 });
                resolve();
            } else {
                res1.json({
                    "message": "登陆失败，请重新登陆，用户名或者密码错误",
                    "teaInfor": "",
                    code: 0
                });
                reject();
            }
        })
    });

    // 在mongodb数据库中更新token字段
    await new Promise((resolve, reject) => {
        mongoose.connection.db.collection("teachers").updateOne(
            { "_id": monUserid },
            { $set: { "token": token } },
            function (err, res) {
                if (err) {
                    console.log(err);
                    res1.json({
                        "message": "登陆失败，请重试",
                        "teaInfor": "",
                        code: 0
                    });
                } else {
                    // 把存储在mongodb用户的数据存储在session中提供以后使用（可能用不到session了）
                    req.session = { token: token, username: name, pass: pass, monUserid: monUserid ,content: content,image: image};
                    res1.json({
                        "message": "/tealogin,post接口登陆成功",
                        "teaInofr": teaInfor,
                        "code":20000 
                    });
                    resolve();
                }
                resolve();
            })
    });
}