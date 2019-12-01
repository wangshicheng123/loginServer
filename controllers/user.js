var jwt = require("jsonwebtoken");
var mongoose = require("../models/mongoose.js");   // 连接mongodb数据库， 解决了数据库的不能多次连接的问题
var secretkey = 'secretkey';
// var acl = require("acl");
var request = require("request");
var axios = require("axios");
var ObjectID = require("mongodb").ObjectID;



// 检测token是否失效
exports.checkToken = async function (req, res, next) {
    jwt.verify(req.query.token, secretkey, function (err, data) {
        if (!err) {
            res.json({
                message: "token正常",
                code: 1
            });
        } else {
            res.json({
                message: "token失效",
                code: 0
            })
        }
    });
}

// 注册
exports.do_reg = async function (req, res, next) {
    var name = req.body.name;
    var pass = req.body.pass;
    // 验证用户是否已经注册过
    await new Promise((resolve, reject) => {
        if (!name || !pass) {
            res.json({
                message: '用户名或密码错误，请重新注册',
                code: 0
            })
        }

        var whereStr1 = { "name": name, "pass": pass };
        mongoose.connection.db.collection("users").find(whereStr1).toArray(function (err, result) {
            if (err) {
                throw err;
            }
            if (result.length > 0) {
                res.json({
                    message: "用户已经存在，请直接登陆",
                    code: 1
                });
                reject();
            } else {
                resolve();
            }
        })

    });

    // 在mongodb数据库中插入数据 
    await new Promise((resolve, reject) => {
        var num = Math.floor(Math.random() * 10 + 1);
        var imgSrc = 'http://login.superlanlanlan.cn/images/' + num + ".png";
        var userObj = { name: name, pass: pass, token: "", image: imgSrc };
        mongoose.connection.db.collection("users").insertOne(userObj, function (err, result) {
            if (err) {
                throw err;
            }
            res.json({
                "message": "reg接口,post请求成功，注册成功",
                code: 2
            });
            resolve();
        });
    });
}

// 登陆
exports.do_login = async function (req, res1, next) {
    var name = req.body.name;
    var pass = req.body.pass;
    var token = "";
    var monUserid = "";
    var userInfor = null;

    // session: {token: token, username: name, monUserid: monUserid }，
    await new Promise((resolve, reject) => {
        // 在此处使用verify验证判断toekn 是否失效或者根本无效，当时没写（后期补上） 
        if (req.body.token) {
            jwt.verify(req.body.token, secretkey, function (err, data) {
                if (!err) {
                    res1.json({
                        message: "您已经登陆了，无需重复登陆",
                        code: 1
                    });
                    // resolve()
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

    // 初始化用户角色
    // await new Promise((resolve, reject) => {
    //     acl = new acl(new acl.mongodbBackend(mongoose.connection.db, "acl_"));
    //     acl.allow([
    //         {
    //             roles: 'member',
    //             allows: [
    //                 { resources: '/video/viewFree', permissions: '*' },
    //             ],
    //         },
    //         {
    //             roles: 'vipone',
    //             allows: [
    //                 { resources: '/video/viewVip', permissions: '*' },
    //             ],
    //         },
    //         {
    //             roles: 'viptwo',
    //             allows: [
    //                 { resources: '/video/add', permissions: '*' },
    //             ],
    //         },
    //         {
    //             roles: 'superVip',
    //             allows: [
    //                 { resources: '/video/delete', permissions: '*' }
    //             ],
    //         }
    //     ])
    //     acl.addRoleParents('vipone', 'member')
    //     acl.addRoleParents('viptwo', 'member')
    //     acl.addRoleParents('superVip', 'vipone')
    //     acl.addRoleParents('superVip', 'viptwo')
    //     resolve();
    // })

    // 在mongodb数据库中是否存在这个登陆的用户
    await new Promise((resolve, reject) => {
        var whereStr1 = { "name": name, "pass": pass };
        mongoose.connection.db.collection("users").find(whereStr1).toArray(function (err, result) {
            if (err) {
                throw err;
            }
            userInfor = result[0];
            monUserid = result[0]._id;
            var _id = result[0]._id.toString();    // _id是object 类型，转化为string类型

            if (result.length > 0) {
                // 第一次登陆的时候生成token (注意使用的是mongodb数据库中的id)
                token = jwt.sign({ username: name, userid: monUserid }, secretkey, { expiresIn: 1000 * 60 * 60 * 24 * 8 });

                // 给用户添加角色
                //  其实在登陆的时候需要进行判断，如果用户是第一次进行登陆，我们就给其分配默认角色
                // acl.addUserRoles(_id, ["member"]);
                resolve();
            } else {
                res1.json({
                    "message": "登陆失败，请重新登陆，用户名或者密码错误",
                    "userInfor": "",
                    code: 0
                });
                reject();
            }
        })
    });

    // 在mongodb数据库中更新token字段
    await new Promise((resolve, reject) => {
        mongoose.connection.db.collection("users").updateOne(
            { "_id": monUserid },
            { $set: { "token": token } },
            function (err, res) {
                if (err) {
                    console.log(err);
                    res1.json({
                        "message": "登陆失败，请重试",
                        "token": "",
                        code: 0
                    });
                } else {
                    // 把存储在mongodb用户的数据存储在session中提供以后使用（可能用不到session了）
                    req.session = { token: token, username: name, pass: pass, monUserid: monUserid };
                    res1.json({
                        "message": "/login,post接口登陆成功",
                        "userInfor": userInfor,
                        code: 2
                    });
                    resolve();
                }

                resolve();
            })
    });
}

// 根据mongo_id 组成的对象数组拿到一系列用户基本信息
exports.getUserInfor = async function (req, res, next) {
    var resultArr = [];
    var tokenIdArr = req.body.tokenIdArr;

    tokenIdArr.forEach((item, index) => {
        var whereStr1 = { "_id": new ObjectID(item.tokenId) };
        new Promise((resolve) => {
            mongoose.connection.db.collection("users").find(whereStr1).toArray(function (err, result) {
                if (err) {
                    throw err;
                }
                if (result.length > 0) {
                    resultArr.push(result[0]);
                    if (tokenIdArr.length == index + 1) {
                        res.json({
                            message: "请求数据成功",
                            code: 1,
                            data: resultArr
                        });
                        resolve();
                    }
                }
            })
        });

    });

}

exports.getExerciseList = async function (req, res, next) {
    res.json({
        errno: 101,
        errmsg: '请求成功',
        data: [
            {
                "title": "习题1",
                "url": "http://login.superlanlanlan.cn/excise1"
            },
            {
                "title": "习题2",
                "url": "http://login.superlanlanlan.cn/excise2"
            },
            {
                "title": "习题3",
                "url": "http://login.superlanlanlan.cn/excise3"
            },
            {
                "title": "习题4",
                "url": "http://login.superlanlanlan.cn/excise3"
            }
        ]
    });
}

// 传入参数：token(无需验证，因为在app.js中已经验证有效啦)
// 返回值是当前用户的: userid 
function getIdByToken(token) {
    return new Promise((resolve) => {
        var obj = { "token": token };
        mongoose.connection.db.collection("users").find(obj).toArray(function (err, result) {
            if (err) {
                throw err;
            }
            monUserid = result[0]._id;
            var _id = result[0]._id.toString();    // _id是object 类型，转化为string类型
            resolve(_id);
        })
    })

}


// acl 相关接口
// 根据传入的角色名称，给相应的用户添加角色
exports.addUserRole = async function (req, res, next) {
    var _id = await getIdByToken(req.body.token);
    console.log(req.body.roleName);
    acl.addUserRoles(_id, req.body.roleName, function (err) {
        if (err) {
            console.log(err);
            res.json({
                message: "/addUserRole post接口请求失败",
                code: 0
            });
        }
        res.json({
            message: "/addUserRole post接口请求成功",
            code: 1
        });
    });
}

// 根据传入的角色名称，给相应的用户删除角色
exports.deleteUserRole = async function (req, res, next) {
    var _id = await getIdByToken(req.body.token);
    console.log(req.body.roleName);
    acl.removeUserRoles(_id, req.body.roleName, function (err) {
        if (err) {
            console.log(err);
            res.json({
                message: "/deleteUserRole post接口请求失败",
                code: 0
            });
        }
        res.json({
            message: "/deleteUserRole post接口请求成功",
            code: 1
        });
    });
}

// 添加角色，以及角色对应的权限
// 参数： 角色名称， 资源名称（string）或者资源名称数组, 传入角色的parents
exports.addRole = async function (req, res, next) {

    console.log(req.body.resource);  // 角色对应的资源接口
    console.log(req.body.son);    // 角色对应的parent
    console.log(req.body.roleName)       // 添加角色的名称
    console.log(req.body.parent);

    // 由于是嵌套回调，所有我分开判断然后操作
    await new Promise((resolve) => {
        acl.allow(req.body.roleName, [req.body.resource], "*", function (err) {
            if (err) {
                throw err;
            } else {
                console.log("添加角色以及其资源接口成功");
                resolve();
            }
        })
    });

    await new Promise((resolve) => {
        if (req.body.son) {
            acl.addRoleParents(req.body.son, req.body.roleName, function (err) {
                if (err) {
                    throw err
                } else {
                    console.log("添加角色的继承者son成功")
                    resolve();
                }

            });
        }
    });

    await new Promise((resolve) => {
        if (req.body.roleName) {
            acl.addRoleParents(req.body.roleName, req.body.parent, function (err) {
                if (err) {
                    throw err
                } else {
                    console.log("添加角色的被继承者parent成功")
                    resolve();
                }
            });
        }
    });

    res.json({
        message: "添加角色以及其角色之间的关系成功",
        code: 1
    });
}

// 删除指定角色 ： 参数： 角色名称
exports.removeRole = async function (req, res, next) {

    console.log(req.body.roleName);
    acl.removeRole(req.body.roleName, function (err) {
        if (err) { throw err }
        console.log("删除角色成功");
        res.json({
            message: "删除角色成功"
        });
    })
}

// 删除指定的资源： 参数： 资源名称
exports.deleteResource = async function (req, res, next) {

    console.log(req.body.resourceName);
    acl.removeResource(req.body.resourceName, function (err) {
        if (err) { throw err }
        console.log("删除资源成功");
        res.json({
            message: "删除资源成功"
        });
    });
}



// 使用axios模块进行服务端请求,正常拿到数据
exports.deal_oauth2Login_test = async function (req, res, next) {
    // 获取授权码
    var requestToken = req.query.code;
    console.log(requestToken);
    // 客户端ID(标识客户端身份)
    var clientID = "7b42a88712cd9fd024b9";
    // 客户端密匙
    var clientSecret = "cbebd4aedca1873d7cac0ae12327573ccf900e96";

    // 用于保存令牌
    // var accessToken = "";

    var tokenResponse = await axios({
        method: "post",
        url: 'https://github.com/login/oauth/access_token?' +
            `client_id=${clientID}&` +
            `client_secret=${clientSecret}&` +
            `code=${requestToken}`,
        headers: {
            accept: "application/json"
        }
    });
    // accessToken = tokenResponse.data.access_token;
    // console.log(`access token: ${accessToken}`);

    var result = await axios({
        method: 'get',
        url: `https://api.github.com/user`,
        headers: {
            accept: 'application/json',
            Authorization: `token ${tokenResponse.data.access_token}`
        }
    });
    res.json({
        message: "第三方登录成功",
        code: 200,
        data: result.data
    });
}
// request模块 最后一步已经拿到了access-token,但是获取不到用户的数据
exports.deal_oauth2Login = async function (req, res, next) {
    var code = req.query.code;
    console.log(code);
    var client_id = "7b42a88712cd9fd024b9";
    var client_secret = "cbebd4aedca1873d7cac0ae12327573ccf900e96";
    var access_token = "";
    await new Promise((resolve, reject) => {
        var url = "https://github.com/login/oauth/access_token";
        var requestData = { client_id: client_id, client_secret: client_secret, code: code };
        console.log(requestData);

        request.post({ url: url, formData: requestData }, function optionalCallback(err, httpResponse, body) {
            if (err) {
                return console.error('upload failed:', err);
            }
            // console.log(body);
            var result = [];
            body.split("&").forEach((item) => {
                var it = item.split("=")[1];
                result.push(it);
            });
            access_token = result[0];
            resolve();
        });
    });
    await new Promise((resolve, reject) => {
        var url1 = "https://github.com/user";
        console.log("测试输出：" + access_token);
        var str = "https://api.github.com/user?access_token=" + access_token
        request(str, function (err, res, body) {
            console.log(res.data);
        });
    });

}


