//变量类型等各种错误检测

var vars = [];
var prebinaries = ['++', '--', '+=', '-=', '*=', '/=', '%=', '**=', '//='];
var brackets = [ '(', ')', '[', ']', '{', '}'];
var binaries = ['+', '-', '*', '/', '%', '**', '//', ';', ':',
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
function tokenizer(input){
    //预处理
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

    //处理def
    if (words[0] == "def"){
        ;
    }
    //处理if
    else if(words[0] == "if"){
        ;
    }
    //处理for
    else if(words[0] == "for"){
        ;
    }
    //处理while
    else if(words[0] == "while"){
        ;
    }
    //处理print
    else if(words[0] == "print"){

        var current = 0;

        tokens.push(
            "print"

        )
        current = 6;
        while (current<input.length){
            var char = input[current];
            var WHITESPACE = /\s/;
            if (WHITESPACE.test(char)) {
                current++;
                continue;
            }
            var remainString = input.substring(current)

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
            current=input.length;
        }

        // 词法分析器的最后我们返回 tokens 数组。
        return tokens;
    }
    //处理非块语句,普通的赋值和运算
    else {
        //处理三目运算符
        if(words.indexOf("?") != -1 && words.indexOf("=") == 1){
            tokens.push("conditionAssign");
            if (vars.indexOf(words[0]) == -1) {
                tokens.push({name: words[0], type: "var"});
            }
            else {
                tokens.push({name: words[0], type: "assign"});
            }
            i = 2;
            word = words[i];
            while(word != "?"){
                elementClassify(word, sets);
                i++;
                word = words[i];
            }
            i++;
            word = words[i];
            var subsets = [];
            while(word != ":"){
                elementClassify(word, subsets);
                i++;
                word = words[i];
            }
            sets.push(subsets);
            i++;
            word = words[i];
            var subsets = []
            for (; i < words.length; i++) {
                elementClassify(word, subsets);
                word = words[i];
            }
            sets.push(subsets);
            tokens.push(sets);
        }
        //普通的单行语句
        else {
            if (vars.indexOf(words[0]) == -1) {
                vars.push(words[0]);
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
    return tokens;
}

console.log(tokenizer("a = b > 2 ? 3 : 4;   "))
/*
code = "a=123;  \n" +
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
    "print \"123\",a,b,c,\"1234\", e";
var sentences = code.split("\n");
var current;
var allTokens = [];
for (current = 0; current < sentences.length; current++){
    allTokens.push(tokenizer(sentences[current]));
}
console.log(allTokens);
console.log(allTokens[1][2]);
*/