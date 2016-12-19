function tokenizer(input){
	var current = 0;
	var tokens = [];
	while (current<input.length){
		var char = input[current];
		if(input.search(/print/)!=-1){
			tokens.push({
				type:'print',
				value: 'print'
			});
			current=input.search(/print/)+6;
			continue;}
		else{
			break;
		}
    var WHITESPACE = /\s/;
    if (WHITESPACE.test(char)) {
      current++;
      continue;
    }
    var STRING = /./;
    if (STRING.test(char)) {

      // 创建一个 `value` 字符串，用于 push 字符。
      var value = '';

      // 然后我们循环遍历接下来的字符，直到我们遇到的字符不再是数字字符为止，把遇到的每
      // 一个数字字符 push 进 `value` 中，然后自增 `current`。
      while (STRING.test(char)) {
        value += char;
        char = input[++current];
      }

      // 然后我们把类型为 `number` 的 token 放入 `tokens` 数组中。
      tokens.push({
        type: 'string',
        value: value
      });

      // 进入下一次循环。
      continue;
    }
    // 最后如果我们没有匹配上任何类型的 token，那么我们抛出一个错误。
    throw new TypeError('I dont know what this character is: ' + char);
  }

  // 词法分析器的最后我们返回 tokens 数组。
  return tokens;
}
    console.log(tokenizer("print \"123\""));
    console.log("print \"123\"");

