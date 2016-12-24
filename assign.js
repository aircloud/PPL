//变量类型等各种错误检测

var current = 0;//当前语句行号
var sentences = [];
var allTokens = [];


var vars = [];
var functionvars = []
var prebinaries = ['++', '--', '+=', '-=', '*=', '/=', '%=', '**=', '//='];
var brackets = [ '(', '[', '{', ')', ']', '}'];
var binaries = ['+', '-', '*', '/', '%', '**', '//', ';', ':', ',', '.',
    '(', ')', '[', ']', '{', '}',
    '==', '!=', '<>', '>', '<', '>=', '<=', '=',
    '+=', '-=', '*=', '/=', '%=', '**=', '//=', '++', '--',
    '&', '|', '^', '~', '<<', '>>']
    //'and', 'or', 'not', 'in', 'not', 'is'];//not in; is not

function elementClassify(words, index, set){
    //Dict【还没好
    if (words[index] == "{") {
    ;
    }
    //List
    else if (words[index] == "[") {
        var subset = [];
        subset.push("array");
        index ++;
        var subsubset = [];
        while(words[index] != "]"){
            //看样子参数里不能包含运算了？
            if(words[index] == ',')
                index ++;
            index = elementClassify(words, index, subsubset);
            index ++;
        }
        index ++;
        subset.push(subsubset);
        set.push(subset);
    }
    //运算符号
    else if (binaries.indexOf(words[index]) != -1) {
        set.push(["binary", words[index]]);
    }
    //字符串
    else if (words[index].search("\"") == 0) {
        set.push(["string", words[index].substr(1, words[index].length - 2)]);
    }
    //变量（包括复杂数据类型set）或函数
    else if (words[index].search(/\D/g) != -1) {
        if(index < words.length - 1 && words[index+1] == "("){
            //Set
            if(words[index] == "set" && words[index+1] == "(" && words[index+2] == "["){
                var subset = [];
                subset.push("set");
                index += 3;
                var subsubset = [];
                while(words[index] != "]"){
                    //看样子参数里不能包含运算了？
                    if(words[index] == ',')
                        index ++;
                    index = elementClassify(words, index, subsubset);
                    index ++;
                }
                index ++;
                subset.push(subsubset);
                set.push(subset);
            }
            //Function
            else{
                var subset = [];
                subset.push("call");
                subset.push(["name", words[index]]);
                index += 2;
                var subsubset = [];
                while(words[index] != ")"){
                    //看样子参数里不能包含运算了？
                    if(words[index] == ',')
                        index ++;
                    index = elementClassify(words, index, subsubset);
                    index ++;
                }
                subset.push(subsubset);
                set.push(subset);
            }
        }
        else {
            set.push(["name", words[index]]);
        }
    }
    //数字
    else {
        if(index < words.length - 1 && words[index+1] == "."){
            var tempNum = words[index]+ ".";
            index ++;
            if(index < words.length - 1 &&
                binaries.indexOf(words[index+1]) == -1 &&
                words[index+1].search("\"") != 0 &&
                words[index+1].search(/\D/g) == -1
            ){
                tempNum += words[index+1];
                index ++;
            }
            set.push(["num", parseFloat(tempNum)]);
        }
        else {
            set.push(["num", parseFloat(words[index])]);
        }
    }
    return index;
}

//引号里套引号就先不考虑啦
function tokenizer(input, token, varRange){
    //预处理
    input = input.replace(/^\s+/, "");
    input = input.replace(/;*\s*$/, "");
    var i, j, word;
    var words = input.split("\"");
    if (words.length % 2 == 0)
    {
        return "Endless String";
    }
    input = '';
    for (i = 0; i < words.length; i += 2){
        var tempWord = '';
        for (j = 0; j < binaries.length; j++) {
            var count = j;
            var index = words[i].indexOf(binaries[j]);
            if (index != -1) {
                //第一个符号就是操作符怎么办??
                tempWord += words[i].substr(0, index);
                if(!((index > 0) &&
                    (binaries.indexOf(words[i][index-1]) != -1) &&
                    (brackets.indexOf(words[i][index-1]) == -1))){
                    tempWord +=  " ";
                    }
                tempWord += words[i][index];
                while((index <= words[i].length) &&
                    (binaries.indexOf(words[i][index+1]) != -1) &&
                    (brackets.indexOf(words[i][index+1]) == -1)) {
                    index++;
                    tempWord += words[i][index];
                }
                tempWord +=  " ";
                //最后一个符号是操作符怎么办??
                words[i] = words[i].substr(index+1,words[i].length);
                j--;
            }
            if(count == j) {
                words[i] = tempWord + words[i];
                tempWord = '';
            }
        }
        input += words[i];
        if ( i < words.length - 1 ){
            input += " \"" + words[i+1] + "\" ";
        }
    }
    input = input.replace(/ +/g, " ");
    var words = input.split(" ");
    for(i = 0; i < words.length; i++){
        word = words[i];
        if (word[0] == "\""){
            while(i < words.length - 1 && word[word.length-1] != "\""){
                words.splice(i, 2, word +  " " + words[i+1]);
                word = words[i];
            }
            if(word[word.length-1] != "\""){
                return "Endless String";//一个错误,字符串未结束
            }
        }
    }
    while( words.indexOf('') != -1 ) {
        words.splice(words.indexOf('', 1));
    }
    //处理特殊符号
    for (i = 0; i < words.length; i++) {
        word = words[i];
        if (prebinaries.indexOf(word) != -1) {
            if (word == "++" || word == "--") {
                words.splice(i, 1, "=", words[i-1], word[0], "1");
            }
            else {
                words.splice(i, 1, "=", words[i-1], words[i].substr(0, words[i].length - 1), "(");
                var index = i;
                var countBracket = 0;
                while (index < words.length && words[index] != ";"){
                    if (words[index] == "(")
                        countBracket ++;
                    if (words[index]  == ")")
                        countBracket --;
                    if (countBracket < 0)
                        break;
                    index ++;
                }
                words.splice(index, 0, ")");
            }
        }
    }

    //语句处理
    var tokens = [];
    var sets = [];
    var subsets = [];
    //
    //处理def
    if (words[0] == "def"){
        if (sentences[current].search(/:\s*$/) == ":"){
            return "Illegal DEFUN";
        }
        tokens.push("defun");
        tokens.push({name:words[1]});
        sets = [];
        for(i = 3; i < words.length-2; i++){
            if(words[i] != ',')
                sets.push(words[i]);
        }
        tokens.push(sets);
        sets = [];
        //content
        current++;
        while(sentences[current] != undefined && sentences[current][0] == "\t"){
            tokenizer(sentences[current], sets, functionvars);
            current ++;
        }
        tokens.push(sets);
        sets = [];
    }
    //处理if
    else if(words[0] == "if"){
        if (sentences[current].search(/:\s*$/) == ":"){
            return "Illegal IF";
        }
        tokens.push("if");
        sets = [];
        i = 1;
        while(words[i] != ":"){
            i = elementClassify(words, i, sets);
            i++;
        }
        tokens.push(sets);
        sets = [];
        //content
        current ++;
        while(sentences[current] != undefined && sentences[current][0] == "\t"){
            tokenizer(sentences[current], sets, vars);
            current ++;
        }
        tokens.push(sets);
        sets = [];
        //else and elif
        while(sentences[current] != undefined && sentences[current].substr(0,2) == "el"){
            if ( sentences[current].search(/:\s*$/) == -1){
                current --;
                return "Illegal ELSE ";
            }
            if (sentences[current].substr(2,2) == "if"){
                ;//这个是不是还没分好类啊
            }
            else if(sentences[current].substr(2,2) == "se"){
                current++;
                while(sentences[current] != undefined && sentences[current][0] == "\t"){
                    tokenizer(sentences[current], sets, vars);
                    current ++;
                }
            }
            tokens.push(sets);
            sets = [];
        }
        current--;
    }
    //处理for【....不对啊，python只有 for in 啊....
    else if(words[0] == "for"){
        tokens.push("for");
        if (sentences[current].search(/:\s*$/) == ":"){
            return "Illegal FOR";
        }
        sets = [];
        sentences0 = sentences[current].replace(/for\(\s*/,"");
        sentences1=sentences0.replace(/\s*\)\:/,"")
        sentences2 = sentences1.split(";");
        for(i=0;i<sentences2.length;i++){
            sets=[];
            sentences3 = sentences2[i].split(" ");
            b = 0;
            while(b<sentences3.length) {
                wordmean = sentences3[b];

               b++;
                elementClassify(wordmean,sets);
            }

            tokens.push(sets);
        }


        //content
        current++;
        while(sentences[current] != undefined && sentences[current][0] == "\t"){
            tokenizer(sentences[current], sets, vars);
            current ++;
        }
        tokens.push(sets);
        sets = [];

    }
    //处理while
    else if(words[0] == "while"){
        if (sentences[current].search(/:\s*$/) == ":"){
            return "Illegal WHILE";
        }
        tokens.push("while");
        sets = [];
        i = 1;
        while(words[i] != ":"){
            i = elementClassify(words, i, sets);
            i++;
        }
        tokens.push(sets);
        sets = [];
        //content
        current++;
        while(sentences[current] != undefined && sentences[current][0] == "\t"){
            tokenizer(sentences[current], sets, vars);
            current ++;
        }
        tokens.push(sets);
        sets = [];
    }
    //处理print,print里会不会有函数啊。。。
    else if(words[0] == "print"){
        var wordcurrent = 0;
        tokens.push(
            "print"
        )
        wordcurrent = 6;
        while (wordcurrent<input.length){
            var char = input[wordcurrent];
            var WHITESPACE = /\s/;
            if (WHITESPACE.test(char)) {
                wordcurrent++;
                continue;
            }
            var remainString = input.substring(wordcurrent)

            strs = remainString.split(",");
            var re = /^\"/
            for(i=0;i<strs.length;i++){
                if (strs[i].match(re)!=null){

                    value =strs[i].replace(/^\s+|\s+$/g,"");
                    tokens.push({
                        string:value,});
                }
                else{
                    value =strs[i].replace(/^\s+|\s+$/g,"")
                    tokens.push({
                        name:value,});
                }
            }
            wordcurrent=input.length;
        }
    }
    //处理return
    else if(words[0] == "return"){
        sets = []
        tokens.push("return");
        for (i = 1; i < words.length; i++) {
            i = elementClassify(words, i, sets);
        }
        tokens.push(sets);
    }
    //处理非块语句,普通的赋值和运算【处理复杂变量，处理函数调用
    else {
        //处理三目运算符
        if(words.indexOf("?") != -1 && words.indexOf("=") == 1){
            tokens.push("conditionAssign");
            if (varRange.indexOf(words[0]) == -1) {
                tokens.push({name: words[0], type: "var"});
            }
            else {
                tokens.push({name: words[0], type: "assign"});
            }
            subsets = [];
            i = 2;
            while(words[i] != "?"){
                i = elementClassify(words, i, subsets);
                i++;
            }
            sets.push(subsets);
            subsets = [];
            i++;
            while(words[i] != ":"){
                i = elementClassify(words, i, subsets);
                i++;
            }
            sets.push(subsets);
            i++;
            subsets = [];
            for (; i < words.length; i++) {
                i = elementClassify(words, i, subsets);
            }
            sets.push(subsets);
            tokens.push(sets);
        }
        //普通的单行语句
        else {
            //好烦，不想考虑字符串里有“=”的情况
            //if (input.match("=").length != input.match(/\"\w*=\w*\"/).length) {
            if (input.search("=") != -1 || words.indexOf("=") != -1){
                if (varRange.indexOf(words[0]) == -1) {
                    varRange.push(words[0]);
                    tokens.push("var");
                    tokens.push({name: words[0], type: "var"});
                }
                else {
                    tokens.push("assign");
                    tokens.push({name: words[0], type: "assign"});
                }
            }

            //处理等号后的部分
            //Tuple特殊处理,感觉可能不太对【没有处理完
            /*if (words[2]  == "(" && words.indexOf(",") != -1) {
                var subset = [];
                subset.push("array");
                tokens[1].type = "const";
                i = 3;
                var subsubset = [];
                while(words[i] != ")"){
                    //看样子参数里不能包含运算了？
                    if(words[i] == ',')
                        i ++;
                    i = elementClassify(words, i, subsubset);
                    i ++;
                }
                i ++;
                subset.push(subsubset);
                sets.push(subset);
            }*/
            for (i = 2; i < words.length; i++) {
                i = elementClassify(words, i, sets);
            }
            tokens.push(sets);
        }
    }

    //return words;
    token.push(tokens);
}

/*
var code = "a=123;  \n" +
    "a = 456\n" +
    "a = \"a string\"\n" +
    "a= \"another string\"\n" +
    "a = 3+5-6*2\n" +
    "b = 6\n" +
    "print \"123\",a,b,c,\"1234\", e\n" +
    "a = b + 2\n" +
    "a = 3 * (4 + 5)\n" +
    "a = b + \"another string\"\n" +
    "a++\n" +
    "a += 1\n" +
    "print \"123\",a,b,c,\"1234\", e\n" +
    "a = b > 2 ? 3 : 4;   ";
code = "if(a == 1):\n" +
    "\ta = 2\n" +
    "\tprint 3\n" +
    "else:\n" +
    "\tprint \"else\"\n" +
    "while a < 1:\n" +
    "\t b +=1";
code = "x = 50;\n" +
    "\tx = 3\n" +
    "def fun(x,y):\n" +
    "\tprint \"aaa\"\n" +
    "\tx = 2\n" +
    "\treturn x;";
<<<<<<< HEAD
*/
code = "a=f1(2,2.5)-a\n" +
    "s = set([2,4,6]);\n" +//样例里少了一层括号，真心的。
    "b = [1,2,3,\"asd\"]";
    //"c = (8,9,  \"@#$\")";
=======

code="for( i = 1;i < 4;i = i + 1 ):\n" +
    "\ta = 2\n" +
        "\tprint 3"
>>>>>>> 0b67b0d4490e168a5626a278a7412448ded9e053
sentences = code.split("\n");
for (current = 0; current < sentences.length; current++){
    tokenizer(sentences[current], allTokens, vars);
}
console.log(allTokens);
<<<<<<< HEAD
console.log(allTokens[3][2]);
=======
>>>>>>> 0b67b0d4490e168a5626a278a7412448ded9e053
