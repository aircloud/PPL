//变量类型等各种错误检测
// +=, -+ 等
// ++， -- 等

var vars = [];
var prebinaries = ['++', '--', '+=', '-=', '*=', '/=', '%=', '**=', '//='];
var brackets = [ '(', ')', '[', ']', '{', '}'];
var binaries = ['+', '-', '*', '/', '%', '**', '//',
    '(', ')', '[', ']', '{', '}',
    '==', '!=', '<>', '>', '<', '>=', '<=', '=',
    '+=', '-=', '*=', '/=', '%=', '**=', '//=', '++', '--',
    '&', '|', '^', '~', '<<', '>>']
    //'and', 'or', 'not', 'in', 'not', 'is'];//not in; is not

//先假定符号（包括左右括号）前后都有空格
//引号里套引号就先不考虑啦
//还没有去除；
function tokenizer(input){
    //预处理
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
    while(input.search("  ") != -1){
        input = input.replace(/  /g, " ");
    }
    var words = input.split(" ");
    while( words.indexOf('') != -1 ) {
        words.splice(words.indexOf('', 1));
    }

    //语句处理
    var tokens = [];

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
        ;
    }
    //处理非块语句,普通的赋值和运算
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
        var sets = [];
        //处理特殊符号
        if (prebinaries.indexOf(words[1]) != -1){
            if(prebinaries.indexOf(words[1]) == 0 || prebinaries.indexOf(words[1]) == 1){
                words.push(words[0]);
                words.push(words[1][0]);
                words.push("1");
            }
            else{
                words.splice(2, 0, words[0], words[1].substr(0,words[1].length-1), "(");
                words.push(")");
            }
        }
        //处理等号后的部分
        for (i = 2; i < words.length; i++) {
            word = words[i];
            if (binaries.indexOf(word) != -1) {
                sets.push(["binary", word]);
            }
            else if ((word.search("\"") == -1) && (word.search(/\D/g) != -1 )) {
                sets.push(["name", word]);
            }
            else if (word.search("\"") == -1) {
                sets.push(["num", parseFloat(word)]);
            }
            //处理字符串
            else {
                var str = '';
                str += word;
                while (!(((word.match("\"").length - word.match("\\\"").length) == 2) ||
                ((word.lastIndexOf("\"") == word.length - 1) && (word.lastIndexOf("\\\"") != word.length - 2)))) {
                    i++;
                    word = words[i];
                    str += ' ' + word;
                }

                sets.push([
                    "string",
                    str.substr(1, str.length - 2)
                ]);
            }
        }
        tokens.push(sets);
    }
    //return words;
    return tokens;
}


console.log(tokenizer("a=123"));
console.log(tokenizer("a = 456"));
console.log(tokenizer("a =\"a string\""));
console.log(tokenizer("a= \"another string\""));
console.log(tokenizer("a = 3+5-6*2"));
console.log(tokenizer("b = 6"));
console.log(tokenizer("a = b + 2"));
console.log(tokenizer("a = 3 * (4 + 5)"));
//console.log(tokenizer("a = \"string\" + \"a string\" + \"another string\" + \"\"another string\"\""));
console.log(tokenizer("a = b + \"another string\""));
 console.log(tokenizer("a++"));
console.log(tokenizer("a += 1"));
//console.log(tokenizer("a = b > 2 ? 3 : 4"));

