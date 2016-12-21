/**
 * Created by Xiaotao.Nie on 17/12/2016.
 * All right reserved
 * IF you have any question please email onlythen@yeah.net
 */

var parser = require('./UglifyJS/uglify-js').parser;
var genCoder = require('./UglifyJS/uglify-js').uglify;
var Tree = require('treeify');
var fs = require('fs');

module.exports = {

    test1:function(){

        var buffer = new Buffer(63000);

        var path = __dirname+ "/process.control.js";

        fs.open(path,'a+',function(err,fd){

            // console.log(err);

            fs.read(fd,buffer,0,63000,0,function(err,byteRead,buffer){

                // console.log(err,byteRead);

                var data = buffer.slice(0,byteRead).toString();

                // console.log("fsData:\n",data);

                var ast = parser.parse(data);

                console.log(Tree.asTree(ast,true));
                console.log("%j",ast);
                console.log("---------------");

                console.log(genCoder.gen_code(ast));
                console.log("---------------");

            })
        })

    },

 };