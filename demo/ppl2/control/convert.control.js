/**
 * Created by Xiaotao.Nie on 18/12/2016.
 * All right reserved
 * IF you have any question please email onlythen@yeah.net
 */

var parser = require('./UglifyJS/uglify-js').parser;
var genCoder = require('./UglifyJS/uglify-js').uglify;
var Tree = require('treeify');

var original_Token = [];

var AST = [];

var Original = [["num",3],["binary","+"],["num",5],["binary","-"],["num",6],["binary","*"],["num",2]];

var OpPriority = {

    //越小代表优先级越高
    "(": 1,
    "*": 2,
    "/": 2,
    "%": 2,
    "+": 4,
    "-": 4,
    "<": 8,
    ">": 8,

};

var operators = ["+","-","*","/","%",">","<"];

var types = ['num','call','name','string','array',"map","set","new","sub"];

//关于对象的方法的引用我还需要考虑一些
var supports = {

    array:["push","pop","sort","splice"],
    map:["get","pop"],
    set:["add","remove"],
    constArray:[],
    unknown:["push","pop","sort","splice","get","pop","add","remove"],
    original:[],

};

var functionPool = [];

//数据池,对应：变量=>类型
var dataPool = new Map();

//保留字/关键字，如果用了保留字作为名字会报错
var reserved = ['and', 'as', 'assert', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'exec', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'not', 'or', 'pass', 'print', 'raise', 'return', 'try', 'while', 'with', 'yield'];

//这两个应该是最后返回的
var errorTree = ["Error"],tempError;

var warnTree = ["Warn"],tempWarn;

//如果是map或者set需要转化一下
//这是处理多维数组的情况，

//判断某一个对象是不是数组
//这个方法目前还是有点问题啊...回去应该继续看一下参考书
function isArray(o){
    try{
        Array.prototype.toString.call(o);
        return true;
    }
    catch(e){

    }
    return false;
}

//判断一个树对应的变量的数据类型
//只是在赋值中使用
function judgetype(input){

    if(input[0]=="assign" || input[0]=="var"){

        if(isArray(input[2][0][0])){

            //这里说明这是一个复杂的运算
            return "unknown"

        }

        if(input[2][0][0]=="array" ){

            if(input[1].type=="const")
                return "constArray";
            else
                return "array";
        }

        if(input[2][0][0]=="map"){
            return "map";
        }

        if(input[2][0][0]=="set"){
            return "set"
        }

    }

    else if(input[0]=="conditionAssign"){

        return "unknown";
    }

    else

        return "ordinary";

}


function arrayToarrayTree(){


}

function convertMapSet(original){

    var tempExpress = ["new",["name"],[["array",[]]]];

    tempExpress[1][1] = original[0]=="set"?"Set":"Map";

    if(tempExpress[1][1]=="Map")

        for(var ii = 0; ii < original[1].length; ii++){

            tempExpress[2][0][1].push(["array",[["string",original[1][ii][0]],PostToTree(inOrderToPost(original[1][ii][1]))]]);

        }

    else{

        //暂时不够健壮，这里需要改变
        tempExpress[2][0][1] = original[1];

    }

    return tempExpress;


}

//判断是不是用了保留关键字
function judgeReserve(input){

    return (reserved.indexOf(input[1].name)>-1)

}

function errorHandle(NO){

    var error=null;

    switch (NO){

        case 3000:

            error= "Reserved keywords are used";

            break;

        case 3001:

            error = "The variable has not been registered";

            break;

        case 3002:

            error = "Calling a method which does not exist";

            break;

        case 5000:

            error = "some unexpected error";

            break;

        default:

            break;
    }

    if(error){
        errorTree.push(error);
    }

    // return error;
    error=null;

}

function warningHandle(NO,original){

    var warn = null;

    switch (NO){

        default:

            break;
    }

    if(warn){
        warnTree.push(warn);
    }

    warn = null;

}

//检测是不是调用了一个不符合规范的函数
function testDotFuncError(original){

    if(original[1][0]=="dot") {

        if (!dataPool.get(original[1][1][1])) {

            //变量未注册
            errorHandle(3001);

        }

        else
        {
            if( supports[dataPool.get(original[1][1][1])].indexOf(original[1][2]) == -1){

                //调用了一个不存在的方法?
                errorHandle(3002);

            }

        }
    }

}

//把一个中缀表达式转化为后缀表达式
function inOrderToPost(original){

    var stack = [];

    var result = [];

    var tempIndex;

    for(var ii = 0; ii < original.length; ii++){

        //数字、函数调用、变量
        if(types.indexOf(original[ii][0])>-1){

            if(original[ii][0]=="map" || original[ii][0]=="set"){
                original[ii]=convertMapSet(original[ii]);
            }


            result.push(original[ii]);

        }

        else if(original[ii][0] == "binary" &&  original[ii][1] == "(" ){
            stack.push(original[ii]);
        }
        else if(original[ii][0] == "binary" &&  original[ii][1] == ")" ){

            tempIndex = stack.length-1;

            while(stack[tempIndex][1]!="("){
                result.push(stack.pop());
                tempIndex--;
            }
            stack.pop();
        }
        else if(original[ii][0] == "binary" &&  operators.indexOf(original[ii][1])>-1) {
            tempIndex = stack.length - 1;

            while (tempIndex > -1 && OpPriority[stack[tempIndex][1]] <= OpPriority[original[ii][1]]) {
                result.push(stack.pop());
                tempIndex--;
            }
            stack.push(original[ii])
        }
    }

    while(stack.length){
        result.push(stack.pop());
    }

    console.log("post result:\n",result);
    return result;
}

//根据后缀表达式构造出一个AST树需要的表达式树
function PostToTree(original){

    var stack = [];

    var result = [];

    var tempIndex;

    var tempSubTree,tempSubTree1,tempSubTree2;

    for(var ii = 0; ii < original.length; ii++){

        if(types.indexOf(original[ii][0])>-1){

            result.push(original[ii]);

        }

        else if(original[ii][0] == "binary"){

            if(result.length < 2){

                throw new Error("ERROR: The post expresion is not correct");
                return;

            }

            else{

                tempIndex = result.length-1;

                //tempSubTree1 是在右侧的，应该后压栈
                tempSubTree1 = result.pop();
                tempSubTree2 = result.pop();

                tempSubTree = [];
                tempSubTree.push(original[ii][0]);
                tempSubTree.push(original[ii][1]);
                tempSubTree.push(tempSubTree2);
                tempSubTree.push(tempSubTree1);

                result.push(tempSubTree);

            }
        }

    }

    // result=result[1];

    console.log("Tree result:\n",Tree.asTree(result,true));

    return result[0];

}


module.exports = function entrance(original_Token){

    var resultTree = ["toplevel",[]];

    var tempExpress;

    var tempIndex,tempLength;

    for(var ii=0; ii<original_Token.length; ii++){

        switch (original_Token[ii][0]){

            case "print":

                // ["print",{strinnodeg:"a string"},{name:a},{name:b},{string:"another string"}]
                tempExpress = ["stat",  ["call",  ["dot",["name","console"],"log"],  [] ]];

                tempLength = original_Token[ii].length;

                tempIndex = 1;

                for(tempIndex;tempIndex<tempLength;tempIndex++){

                    if(original_Token[ii][tempIndex].hasOwnProperty("string")){
                        tempExpress[1][2].push(["string",original_Token[ii][tempIndex]['string']]);
                    }

                    else if(original_Token[ii][tempIndex].hasOwnProperty("name")){
                        tempExpress[1][2].push(["name",original_Token[ii][tempIndex]['name']]);
                    }
                }

                resultTree[1].push(tempExpress);

                break;

            case "var":

                dataPool.set(original_Token[ii][1].name,judgetype(original_Token[ii]));
                //维持这样一个资源池;

                if(original_Token[ii][1].type=="const"){
                    tempExpress = ["const",[[ /*to be added*/ ]]];
                }

                else{
                    tempExpress = ["var",[[ /*to be added*/ ]]];
                }

                //判断是否使用保留关键字
                if(judgeReserve(original_Token[ii]))
                    errorHandle(3000);

                tempExpress[1][0][0] = original_Token[ii][1].name;

                tempExpress[1][0][1] = PostToTree(inOrderToPost(original_Token[ii][2]));

                resultTree[1].push(tempExpress);

                break;

            case "assign":

                dataPool.set(original_Token[ii][1].name,judgetype(original_Token[ii]));

                tempExpress = ["stat",["assign",true,["name",""],/*to be added*/]];

                tempExpress[1][2][1] = original_Token[ii][1].name;

                tempExpress[1][3] = PostToTree(inOrderToPost(original_Token[ii][2]));

                resultTree[1].push(tempExpress);

                break;

            case "conditionAssign":

                dataPool.set(original_Token[ii][1].name,judgetype(original_Token[ii]));

                if(original_Token[ii][1].type == "const"){

                    //向已经定义过的const赋值错误
                    tempError="Attemp to change the value of the const variable "+original_Token[ii][1].name;
                    errorTree.push(tempError);

                }

                if(original_Token[ii][1].type == "var"){

                    tempExpress = ["var",[[ /*to be added*/ ]]];

                    tempExpress[1][0][0] = original_Token[ii][1].name;

                    tempExpress[1][0][1] = ["conditional"];

                    tempExpress[1][0][1][1] = PostToTree(inOrderToPost(original_Token[ii][2][0]));
                    tempExpress[1][0][1][2] = PostToTree(inOrderToPost(original_Token[ii][2][1]));
                    tempExpress[1][0][1][3] = PostToTree(inOrderToPost(original_Token[ii][2][2]));

                }
                else if(original_Token[ii][1].type == "assign"){

                    tempExpress = ["stat",["assign",true,["name",""],/*to be added*/]];

                    tempExpress[1][2][1] = original_Token[ii][1].name;

                    tempExpress[1][3] = ["conditional"];

                    tempExpress[1][3][1] = PostToTree(inOrderToPost(original_Token[ii][2][0]));
                    tempExpress[1][3][2] = PostToTree(inOrderToPost(original_Token[ii][2][1]));
                    tempExpress[1][3][3] = PostToTree(inOrderToPost(original_Token[ii][2][2]));

                }

                resultTree[1].push(tempExpress);

                break;

            case "if":

                tempExpress = ['if'];

                tempExpress[1] = PostToTree(inOrderToPost(original_Token[ii][1]));

                tempExpress[2] = ["block",entrance(original_Token[ii][2])[1]];

                tempExpress[3] = ["block",entrance(original_Token[ii][3])[1]];

                resultTree[1].push(tempExpress);

                break;

            case "for":

                tempExpress=['for'];

                tempExpress[1] = entrance([original_Token[ii][1]])[1][0];

                tempExpress[2] = PostToTree(inOrderToPost(original_Token[ii][2]));

                tempExpress[3] = entrance([original_Token[ii][3]])[1][0];

                tempExpress[4] = ["block",entrance(original_Token[ii][4])[1]];

                resultTree[1].push(tempExpress);

                break;

            case "while":

                tempExpress=['while'];

                tempExpress[1] = PostToTree(inOrderToPost(original_Token[ii][1]));

                tempExpress[2] = ["block",entrance(original_Token[ii][2])[1]];

                resultTree[1].push(tempExpress);

                break;

            case "return":

                tempExpress=['return'];

                tempExpress[1] = PostToTree(inOrderToPost(original_Token[ii][1]));

                resultTree[1].push(tempExpress);

                break;

            case "defun":

                //判断函数是否重复声明
                if(functionPool.indexOf(original_Token[ii][1].name>-1)){
                    tempWarn="There is a repeated statement for function "+original_Token[ii][1].name;
                    warnTree.push(tempWarn);
                }
                else {
                    functionPool.push(original_Token[ii][1].name);
                }

                //判断是否使用保留关键字
                if(judgeReserve(original_Token[ii]))
                    errorTree.push(errorHandle(3000));

                tempExpress=['defun',original_Token[ii][1].name,original_Token[ii][2]];

                tempExpress[3] = entrance(original_Token[ii][3])[1];

                resultTree[1].push(tempExpress);

                break;

            case "sub":
                //直接sub的情况?好像没有

                break;

            case "call":
                //函数直接调用可能成为一条语句，我们要考虑这种情况,直接调用或者点式调用
                if(functionPool.indexOf(original_Token[ii][1][1])==-1){
                    tempError="The calling function "+original_Token[ii][1][1]+"is not declared before";
                    errorTree.push(tempError);
                }

                tempExpress = ['stat'];

                tempExpress[1] = original_Token[ii];

                resultTree[1].push(tempExpress);

                break;

            case "forin":

                //在ES6中，有三类数据结构原生具备Iterator接口：数组、某些类似数组的对象、Set和Map结构。
                //而这里,我们用到的就是这个接口

                tempExpress=["for-of",["var",[[ original_Token[ii][1][1] ]] ],["name",[original_Token[ii][1][1]]],original_Token[ii][2]];

                tempExpress[4] = ["block",entrance(original_Token[ii][3])[1]];

                resultTree[1].push(tempExpress);

                break;

            default:

                break;

        }

    }

    console.log("resultTree:\n",Tree.asTree(resultTree,true));

    return resultTree;

    //这里应该也把error和warn一并返回

};

