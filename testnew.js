function tokenizer(input){
    var current = 0;
    var tokens =[];
    var patt = new RegExp(input,"g");
    var result;
    if((result=patt.exec(input)==null)){
        return true;
    }
    else{
        tokens.push({
            type:'print',
            value:'print'
        })
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

            tokens.push({
                type: 'string',
                value: value
            });
        current=input.length;
        }
    }

    // 词法分析器的最后我们返回 tokens 数组。
    return tokens;
}
console.log(tokenizer("print \"123\""));
console.log("print \"123\"");