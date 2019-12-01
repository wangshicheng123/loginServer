var db=require("./db.js");

exports.do_login=function(name,pass,callback){
    var sql="select * from t_user where name=? and pass=?"
    db.query(sql,[name,pass],callback);
}