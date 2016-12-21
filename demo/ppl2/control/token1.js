function tokenizer(input) {
// 'current'记录字符串位置
    var current = 0;
// 'token'数组用来放置token的地方
    var tokens = [];
// 储存'input'的当前字符
    var char = input[0];
//while循环current增加
    while (current < input.length) {
//匹配输入的开头是不是print
        if (input.match(/^print/g) == ["print"]) {
            tokens.push({
                type: 'print',
                value: print
            });
//如果是print，current在print的后面加5
            current = input.search(/print/) + 5;
            continue;
        }
//如果是print后面空白格直接跳过
        var WHITESPACE = /\S/;
        if (WHITESPACE.test(char)) {
            current++;
            continue;
        }

//定义字符串储存在string,.表示任意字符
        var String = /./;
        if (String.test(char)) {
// 创建一个 `value` 字符串，用于 push 字符
            var value = '';
// 然后我们循环遍历接下来的字符，直到我们遇到的字符不再是数字字符为止，把遇到的每
// 一个数字字符 push 进 `value` 中，然后自增 `current`。
            while (String.test(char)) {
                value += char;
                char = input[++current];
            }
// 把类型为 `string` 的 token 放入 `tokens` 数组中。
            tokens.push({
                type: 'string',
                value: value
            });
            continue;
        }

    }

}

console.log(tokenizer("print \"123\""));