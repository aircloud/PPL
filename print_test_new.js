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
console.log(tokenizer("print \"123\",a,b,c,\"1234\", e"));
console.log("print \"123\"");
