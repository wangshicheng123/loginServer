var mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/testManage', { useNewUrlParser: true });  // 在此处连接数据库
module.exports = mongoose;  