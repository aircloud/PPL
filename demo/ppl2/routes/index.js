var express = require('express');
var router = express.Router();
var parser = require('../control/UglifyJS/uglify-js').parser;
var genCoder = require('../control/UglifyJS/uglify-js').uglify;
var Tree = require('treeify');

var Convert = require("../control/convert.control");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post("/convert",function(req,res,next){

  //这里调用函数，返回代码

});


module.exports = router;
