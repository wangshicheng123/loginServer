var express = require('express');
var router = express.Router();
var User = require("../controllers/user.js");
var Teacher= require("../controllers/teacher.js");

// 测试接口
router.get("/exercise/list", User.getExerciseList);


// 权限相关接口
router.post("/addRole", User.addRole);               // 添加角色以及对应的资源
router.post("/removeRole",User.removeRole);          // 移除角色
router.post("/deleteResource",User.deleteResource);  // 移除资源

router.post("/addUserRole",User.addUserRole);        // 对用户添加角色
router.post("/deleteUserRole",User.deleteUserRole);  // 移除用户的角色

// 处理学生注册登录逻辑
router.post("/reg", User.do_reg);                    // 注册逻辑
router.post("/login",User.do_login);                 // 登陆逻辑
router.post("/getUserInfor",User.getUserInfor);     // 获取(单个或者多个)用户基本信息


// 处理教师登陆逻辑
router.post("/teaLogin",Teacher.do_login);           // 教师登陆
router.post("/teaMangeLogin",Teacher.do_login2);

// 检测token是否失效
router.get("/checkToken",User.checkToken)          // 检测token是否失效






router.get("/oauth/redirect",User.deal_oauth2Login_test);   // hithub第三方登录
module.exports = router;