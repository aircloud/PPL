//init....

function GetSourceFromScript(scriptID)
{
    var shaderScript = document.getElementById(scriptID);
    if (shaderScript == null) return "";

    var sourceCode = "";
    var child = shaderScript.firstChild;
    while (child)
    {
        if (child.nodeType == child.TEXT_NODE ) sourceCode += child.textContent;
        child = child.nextSibling;
    }

    return sourceCode;
}


code = GetSourceFromScript("test01");

code2 = "if a < 1:\n" +
    "\ta ++\n" +
    "if b == 1:\n" +
    "\tif c ==1:\n" +
    "\t\t b++\n" +
    "\telif c ==2:\n" +
    "\telse:\n" +
    "\t\t b = a+2\n" +
    "else:\n" +
    "\ta = a+2";

code = code.replace(/^\n/g,"");
code = code.replace(/[ ]{4}/g,"\t");
code = code.replace(/\n+/g,"\n");

console.log("code:",code);
console.log("__________________________________")
console.log("code2:",code2);

sentences = code.split("\n");
for (current = 0; current < sentences.length; current++){
    tokenizer(sentences[current], allTokens, vars);
}
console.log(allTokens);
console.log(allTokens[1][2][0][3]);

//ajax传送 

// var XHR2 = new XMLHttpRequest();

// XHR2.open("post","http://127.0.0.1:4000/convert");
// XHR2.setRequestHeader("Content-Type","application/json");

// var lock = true;

// XHR2.onload = function(){
//     if(XHR2.status==200 && (lock)){
//         lock=false;
//         console.log(XHR2.responseText);
//     }
//     console.log("onload");
// };
// console.log("JSON.stringify(allTokens",JSON.stringify(allTokens));
// XHR2.send(JSON.stringify(allTokens));