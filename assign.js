//变量类型等各种错误检测

var current = 0;//当前语句行号
var sentences;
var allTokens = [];


var vars = [];
var functionvars = []
var prebinaries = ['++', '--', '+=', '-=', '*=', '/=', '%=', '**=', '//='];
var brackets = [ '(', ')', '[', ']', '{', '}'];
var binaries = ['+', '-', '*', '/', '%', '**', '//', ';', ':', ',',
    '(', ')', '[', ']', '{', '}',
    '==', '!=', '<>', '>', '<', '>=', '<=', '=',
    '+=', '-=', '*=', '/=', '%=', '**=', '//=', '++', '--',
    '&', '|', '^', '~', '<<', '>>']
    //'and', 'or', 'not', 'in', 'not', 'is'];//not in; is not

function elementClassify(word, set){
    if (binaries.indexOf(word) != -1) {
        set.push(["binary", word]);
    }
    else if (word.search("\"") == 0) {
        set.push(["string", word.substr(1, word.length - 2)]);
    }
    else if (word.search(/\D/g) != -1) {
        set.push(["name", word]);
    }
    else {
        set.push(["num", parseFloat(word)]);
    }
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
        word = words[i];
        while(word != ":"){
            elementClassify(word, sets);
            i++;
            word = words[i];
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
                sets = [];
        sentences0 = sentences[current].replace(/for\(\s*/,"");
        sentences1=sentences0.replace(/\s*\)\:/,"")
        sentences2 = sentences1.split(";");
        for(i=0;i<sentences2.length;i++){
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
        word = words[i];
        while(word != ":"){
            elementClassify(word, sets);
            i++;
            word = words[i];
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
    //处理print
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
            word = words[i];
            elementClassify(word, sets);
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
            word = words[i];
            while(word != "?"){
                elementClassify(word, subsets);
                i++;
                word = words[i];
            }
            sets.push(subsets);
            subsets = [];
            i++;
            word = words[i];
            while(word != ":"){
                elementClassify(word, subsets);
                i++;
                word = words[i];
            }
            sets.push(subsets);
            i++;
            word = words[i];
            subsets = [];
            for (; i < words.length; i++) {
                elementClassify(word, subsets);
                word = words[i];
            }
            sets.push(subsets);
            tokens.push(sets);
        }
        //普通的单行语句
        else {
            if (varRange.indexOf(words[0]) == -1) {
                varRange.push(words[0]);
                tokens.push("var");
                tokens.push({name: words[0], type: "var"});
            }
            else {
                tokens.push("assign");
                tokens.push({name: words[0], type: "assign"});
            }
            //处理特殊符号
            if (prebinaries.indexOf(words[1]) != -1) {
                if (words[1] == "++" || words[1] == "--") {
                    words.push(words[0]);
                    words.push(words[1][0]);
                    words.push("1");
                }
                else {
                    words.splice(2, 0, words[0], words[1].substr(0, words[1].length - 1), "(");
                    words.push(")");
                }
            }
            //处理等号后的部分
            for (i = 2; i < words.length; i++) {
                word = words[i];
                elementClassify(word, sets);
            }
            tokens.push(sets);
        }
    }

    //return words;
    token.push(tokens);
}


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

code="for( i = 1;i < 4;i = i + 1 ):\n" +
    "\ta = 2\n" +
        "\tprint 3"
sentences = code.split("\n");
for (current = 0; current < sentences.length; current++){
    tokenizer(sentences[current], allTokens, vars);
}
console.log(allTokens);
