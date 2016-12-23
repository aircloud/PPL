/**
 * Created by Xiaotao.Nie on 21/12/2016.
 * All right reserved
 * IF you have any question please email onlythen@yeah.net
 */
var Convert = require("../convert.control");
var parser = require('../UglifyJS/uglify-js').parser;
var genCoder = require('../UglifyJS/uglify-js').uglify;
var Tree = require('treeify');

var entrance = Convert;

//这实际上是一个测试函数
module.exports = function Test(original_Token) {


    //测试print
    // console.log(genCoder.gen_code(entrance([["print",{string:"a string"},{name:"a"},{name:"b"},{string:"another string"}]])));

    //测试var
    // console.log(genCoder.gen_code(entrance([["var",{name:"a",type:"var"},[["num",3],["binary","+"],["num",5],["binary","-"],["num",6],["binary","*"],["num",2]]]])));

    //测试assign
    // console.log(genCoder.gen_code(entrance([["assign",{name:"a",type:"assign"},[["num",3],["binary","+"],["num",5],["binary","-"],["num",6],["binary","*"],["num",2]]]])));

    //测试三目运算符
    // console.log(genCoder.gen_code(entrance([["conditionAssign",{name:"a",type:"assign"},[
    //     [ ["name","b"],["binary",">"],["num",2]], [["num",3]], [["num",4]]]]])));

    //测试if
    // console.log(genCoder.gen_code(entrance([["if",
    //     [["name","a"],["binary","<"],["num",1]],
    //     [
    //         ["assign",{name:"a"},[["num",123]]],
    //         ["assign",{name:"a"},[["num",456]]]
    //     ],[
    //         ["assign",{name:"a"},[["num",789]]]
    //     ]]
    // ])));

    //测试for
    // console.log(genCoder.gen_code(entrance([
    //     ["for",
    //         ["assign",{name:"i",type:"assign"},[["num",0]]],
    //         [["name","i"],["binary","<"],["num",1]],
    //         ["assign",{name:"i",type:"assign"},[["name","i"],["binary","+"],["num",1]]],
    //         [
    //             ["print",{string:"abc"}],
    //             ["print",{string:"def"}]
    //         ]]
    // ])));

    //测试while
    // console.log(genCoder.gen_code(entrance([
    //
    //     ["while",
    //         [["name","i"],["binary","<"],["num",6]],
    //         [
    //             ["assign",{name:"i",type:"assign"},[["name","i"],["binary","+"],["num",1]]]
    //         ]
    //     ]
    //
    // ])));

    //测试函数定义
    // console.log(genCoder.gen_code(entrance([
    //     [   "defun",
    //         {name:"func"},
    //         ["x","y"],
    //         [
    //             ["print",{string:"x等于"},{name:"x"}],
    //             ["var",{name:"x",type:"var"},[["num",2]]],
    //             ["print",{string:"局部变量x改变为"},{name:"x"}],
    //             ["return",[["name","x"]]]
    //         ]
    //     ]
    // ])));

    //测试函数调用
    // console.log(genCoder.gen_code(entrance([
    //     ["conditionAssign",{name:"a",type:"assign"},[
    //         [["name","b"],["binary",">"],["num",2]],
    //         [
    //             ["num",3]
    //         ],
    //         [
    //             ["call", ["name","f1"], [["num",3],["num",5]] ]
    //         ]
    //     ]]
    // ])));

    //测试直接调用函数
    // console.log(genCoder.gen_code(entrance([
    //     ["call",["name","f1"], [["num",3],["num",4],["num",5]]]
    // ])));

    //测试基础的Map
    // console.log(genCoder.gen_code(entrance([
    //     ["assign",{name:"a",type:"assign"},[["map",[['Michael', [["num",95]]],['Bob',[["num",75]]], ['Tracy', [["num",85]] ] ] ]	] ]
    // ])));

    //测试基础的set
    // console.log(genCoder.gen_code(entrance([
    //     ["assign",{name:"s",type:"assign"},[["set",[["num",1],["num",2],["num",3]]]]]
    // ])));

    //测试稍微复杂点的Map
    // console.log(genCoder.gen_code(entrance([
    //     ["assign",{name:"d",type:"assign"},[["map",[['Michael', [["num",95]]],['Bob',[["string","hello"]]], ['Tracy', [["call",["name","somefunc"], [["num",1],["string","string0"]]]] ] ] ]] ]
    // ])));

    //测试简单的tuple
    // console.log(genCoder.gen_code(entrance([
    //     ["var",{name:"a",type:"const"},[["array",[["num",2],["num",3],["num",4],["string","example string"]]]]]
    // ])));

    //测试简单的list 1
    // console.log(genCoder.gen_code(entrance([
    //     ["assign",{name:"a",type:"assign"},[["array",[["num",2],["num",3],["num",4],["num",5]]]]]
    // ])));

    //测试list嵌套
    // console.log(genCoder.gen_code(entrance([
    //     ["assign",{name:"a",type:"assign"},[["array",[["array",[["num",2],["num",3]]],["num",4],["num",5]]]]]
    // ])));

    //测试简单的点式调用方法
    // console.log(genCoder.gen_code(entrance([
    //     ["call",["dot",["name","a"],"pop"],[]]
    // ])));

    // 测试有点复杂的点式调用的方法
    // console.log(genCoder.gen_code(entrance([
    //     ["call",["dot",["name","a"],"somefunc"],[["num",4],["num",5]]]
    // ])));

    //测试访问数组中某一个元素
    // console.log(genCoder.gen_code(entrance([
    //     ["assign",{name:"a",type:"assign"},[['sub',["name","a"],["num",3]]]]
    // ])));

    //测试python for...of...循环:1
    // console.log(genCoder.gen_code(entrance([
    //     ["forin",["name","x"],
    //         ["array",[["num",2],["num",3],["num",4],["num",5]]],
    //         [
    //             ["var",{name:"a",type:"var"},[["num",123]]]
    //         ]
    //     ]
    // ])));

    //测试python for...of...循环:2
    // console.log(genCoder.gen_code(entrance([
    //     ["forin",["name","i"],
    //         ["call",["name","range"], [["num",100]] ],
    //         [
    //             ["var",{name:"a",type:"var"},[["num",123]]]
    //         ]
    //     ]
    // ])));

    //测试python for...of...循环:3
    // console.log(genCoder.gen_code(entrance([
    //     ["forin",["name","x"],
    //         ["name","sv"],
    //         [
    //             ["var",{name:"a",type:"var"},[["num",123]]],
    //             ["var",{name:"a",type:"var"},[["num",456]]]
    //
    //         ]
    //     ]
    // ])));

};