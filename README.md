# loginServer
防慕课网项目登录服务器
## 目录
- [项目简要说明](项目简要说明)
- [项目图片](项目图片)
- [项目目录](项目目录)
- [遇到的问题](遇到的问题)

### 项目简要说明
```
  1. 首先我们这个仿慕课网项目是一个拥有一个网页版的客户端和多个子系统的项目；
  2. 为了解决客户端与子系统之间的通信，我们在两者之间开发了一个登陆服务器
  技术栈有： nodejs, express,mongodb ,JsonWebToken, Oauth2， express-session等技术;
  3. 用户从客户端进行注册，登录等操作都需要通过nodejs中间层服务器进行登录认证，
  以及存储用户的注册信息以及用户的登录状态。
  4. 所以说我们的登录服务器主要是处理注册和登录操作的项目。
```
### 项目部分图片截图
![项目图片展示](http://49.232.143.111:3000/images/login1.png)
![项目图片展示](http://49.232.143.111:3000/images/login2.png)
![项目图片展示](http://49.232.143.111:3000/images/login3.png)

### 项目目录
![项目目录截图](http://49.232.143.111:3000/images/dir5.png)

### 遇到的问题
  （简化操作说明：只使用用户名和密码进行注册和登录）
  1. 注册流程说明
  ```
    问题： 注册操作过程中需要检测是否是已经注册过的用户
    
    首先用户携带用户名和密码向注册接口发起post请求，
    然后我们在node服务端接收用户名和密码，查询用户数据库判断是否存在此用户，
    最后如果不存在我们则把用户基本信息插入到用户数据库中，返回注册成功状态。
    
    客户端判断为注册成功状态，则直接跳转的登录页面;
    
    node服务端代码片段：
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
  ```
  2. 登录流程说明
  ```
    问题： 如何在浏览器客户端与多个子系统之间保存用户的登录状态
    
    首先我们把登陆的用户分为三种：
      一：用户第一次登陆，本地化存储中不存在token， 需要进行登录操作
      二：用户不是第一次登录，此时服务端验证token有效（jwt.verify()），处于登录状态，直接返回登录成功状态
      三：用户不是第一次登录，此时服务端验证token失效（jwt.verify()），需要重新进行登录操作
      
    然后对于一，三两种用户进行登录处理，把获取的用户名和密码查询mongodb数据库判断是否存在这个用户，
      如果不存在，直接返回登陆失败的状态；
      如果存在，获取查询记录的唯一标识 _id, 然后结合用户名生成token， 把token存储在mongodb数据库中，把token以及登录成功的状态返回给客户端；
      // token = jwt.sign({ username: name, userid: monUserid }, secretkey, { expiresIn: 1000 * 60 * 60 * 24 * 8 });
    
    最后客户端接收到token存储到本地化中；
    
    node服务端代码片段：
    // 登陆
    exports.do_login = async function (req, res1, next) {
        var name = req.body.name;
        var pass = req.body.pass;
        var token = "";
        var monUserid = "";
        var userInfor = null;

        // session: {token: token, username: name, monUserid: monUserid }，
        await new Promise((resolve, reject) => {
            // 在此处使用verify验证判断toekn 是否失效或者根本无效
            if (req.body.token) {
                jwt.verify(req.body.token, secretkey, function (err, data) {
                    if (!err) {
                        res1.json({
                            message: "您已经登陆了，无需重复登陆",
                            code: 1
                        });
                    } else {
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
  ```
  






















