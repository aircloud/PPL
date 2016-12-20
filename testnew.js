function tokenizer(input){
    var current = 0;
    var tokens =[];
    var patt = new RegExp("print","g");
    var result;
    if((result=patt.exec(input))==null){
        return false;
    }
    else{
        tokens.push(
        "print"

        )
        current = input.search(/print/)+6;
    }
    while (current<input.length){
        var char = input[current];
        var WHITESPACE = /\s/;
        if (WHITESPACE.test(char)) {
            current++;
            continue;
        }
        var STRING = /\S/;
        if (STRING.test(char)) {

            // 创建一个 `value` 字符串，用于 push 字符。
            var value = '';

            value = input.substring(current);
            // 然后我们把类型为 `number` 的 token 放入 `tokens` 数组中。
            tokens.push({
                string: value,

            });
        current=input.length;
        }
    }

    // 词法分析器的最后我们返回 tokens 数组。
    return tokens;
}
console.log(tokenizer("print \"123\""));
console.log("print \"123\"");
