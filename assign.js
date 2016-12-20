//变量类型等各种错误检测
// +=, -+ 等
// ++， -- 等

var vars = [];
var binaries = ['+', '-', '*', '/', '%', '**', '(', ')',
    '//', '==', '!=', '<>', '>', '<', '>=', '<=',
    '=', '+=', '-=', '*=', '/=', '%=', '**=', '//=',
    '&', '|', '^', '~', '<<', '>>',
    'and', 'or', 'not', 'in', 'not', 'is'];//not in; is not

//先假定符号（包括左右括号）前后都有空格
function tokenizer(input){
    var tokens = [];
    var words = input.split(" ");
    if (vars.indexOf(words[0]) == -1) {
        vars.push(words[0]);
        tokens.push("var");
        tokens.push({name: words[0], type:"var"});
    }
    else {
        tokens.push("assign");
        tokens.push({name: words[0], type:"assign"});
    }
    //处理等号后的部分
    var sets = [];
    var i, word;
    for(i = 2; i < words.length; i++) {
        word = words[i];
        if (binaries.indexOf(word) != -1) {
            sets.push(["binary", word]);
        }
        else if (vars.indexOf(word) != -1) {
            sets.push(["name", word]);
        }
        else if (word.search("\"") == -1){
            if(parseFloat(word) == NaN)
                ;//变量未声明的错误处理
            sets.push(["num", parseFloat(word)]);
        }
        else {
            var str = '';
            str += word;
            while (!(((word.match("\"").length - word.match("\\\"").length) == 2) ||
            ((word.lastIndexOf("\"") == word.length-1) && (word.lastIndexOf("\\\"") != word.length-2))) ){
                i ++;
                word = words[i];
                str += ' ' + word;
            }

            sets.push([
                "string",
                str.substr(1, str.length-2)
            ]);
        }
    }
    tokens.push(sets);

    //return words;
    return tokens;
}

console.log(tokenizer("a = 123;"));
console.log(tokenizer("a = 456;"));
console.log(tokenizer("a = \"a string\""));
console.log(tokenizer("a = \"another string\""));
console.log(tokenizer("a = 3 + 5 - 6 * 2"));
console.log(tokenizer("b = 6"));
console.log(tokenizer("a = b + 2"));
console.log(tokenizer("a = 3 * ( 4 + 5 )"));
console.log(tokenizer("a = \"string\" + \"a string\" + \"another string\" + \"\"another string\"\""));
console.log(tokenizer("a = b + \"another string\""));
//console.log(tokenizer("a = b > 2 ? 3 : 4"));

