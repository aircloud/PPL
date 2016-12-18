*Init the program by AirCloud*

---

注：因为有点复杂，后来也有改动，因此不排除有些错误和说的不清楚的地方，因此如果有哪里没有说清楚，请直接跟我讲。

整个代码段分块解析，块的意思是：

如果是函数块，那么整个函数算一块。

如果是普通的语句，比如赋值，加减、函数调用等，那么就算一块。

整体是一个二维数组，每一块是一个一维数组，每一个一维数组要用一个单词表示这一块是干什么的[**这个单词的命名规范，我都采用的小驼峰方式命名，区分大小写**]。之后的每一个元素，**应该是一个一个的token，每一个token是一个键值对**。

现在我们按照当初的那个概要一个一个的实现，我这里每一个都给一个token的样例。

* 打印字符串  
 
```
print "a string";

token ["print",{string:"a string"}]

```

* 打印变量


```
print a;

token ["print",{name:a}]

```

* 打印多个变量或者变量加字符串(我这里给的例子是不加括号的，为了健壮性，实际上加括号也是可以的)

```
print "a string",a,b,"another string"
token ["print",{string:"a string"},{name:a},{name:b},{string:"another string"}]

```

* 基本赋值语句（python中变量直接用就行，js在声明的时候要用"var"来声明，我们做的时候要考虑这一点，第一次出现的时候是声明，其他的时候是赋值，你在做的时候要考虑到这一点)
也就是说，第一次使用这个变量的话要用var，如果不是第一次使用了要用assign。(第二部分要重复声明一遍，这不是重复，是为了和其他赋值方式保持统一统一处理)。

```
a = 123;
token ["var",{name:a,type:"var"},{type:number,value:123}];

//声明之后然后给它赋值
a = 456
token ["assign",{name:a,type:"assign"},{type:number,value:456}]

//如果是字符串道理相同：

a = "a string";
token ["var",{name:a,type:"var"},{type:string,value:"a string"}];

//声明之后然后给它赋值
a = "another string"
token ["assign",{name:a,type:"assign"},{type:string,value:"another string"}]

//先赋值成字符串之后变成数字以及反之都是可以的，这里不多举例子了。
```

* 语句的基本运算   
这里面要涉及数据结构的中缀表达式的生成，当然这不是词法解析时候的事情，所以token的生成还是不怎么变的，只是生成的token有所变化，这里的基本运算涉及数字之间的四则运算，以及和变量之间的四则运算，直接举例：

```

a = 3 + 5 - 6 * 2;
token ["advanceAssign",{name:a,type:"assign"},[["num",3],["binary","+"],["num",5],["binary","-"],["num",6],["binary","*"],["num",2]]]
//请仔细注意，这里的token和前面有所区分

b = 6;
//这里的token前面写过了，就不重复了

a = b + 2;
token ["advanceAssign",{name:a,type:"assign"},[["name",b],["binary","+"],["num",5]]

a = 3 * (4 + 5)
token ["advanceAssign",{name:a,type:"assign"},[["num",3],["binary","*"],['bracket',"("],["num",4],["binary","+"],["num",5],['bracket',")"]]]
//这是一个带括号的，一般也是只会产生小括号，中括号和大括号应该是没有的

```

* 自增、自减运算符    
对于i++、i--这种的，实际上是独立的语句块，我们解析的时候，首先把它转化成i=i+1和i=i-1再用上面的规则解析，就不重新定义规则了，这样大家都方便。

* 三目运算符  
三目运算符通常只有一行，但是也有点复杂，应该这样分：也是一开始一个标志符，之后是被赋值的目标，之后是一个三个元素的数组，三个元素分别是：判断条件、前一个代码块，后一个代码块,这里面的前一个代码块和后一个代码块通常是算式,需要按上面解析语句基本运算的方式去解析。

```
a = b > 2 ? 3 : 4;
token ["conditionAssign",{name:a,type:"assign"},[
 [["name",b],["binary",">"],["num",2]],
 [
 	["num":3]
 ]
 [
 	["num":4]
 ]
]]
```


* 语句块：if else      
我们的最基本的if else应该是这样的：整个if else语句块虽然占多行，但是应该写在一个token里，这算一整块，解析AST树的时候这也应该在一个节点下面。

```
if(a<1){
    a = 2;
    a = 3;
}
else{
    a = 0;
}

//这里的token有四块内容，依次是：标志符"if"，判断的内容，if里面的内容，else里面的内容，if里面的内容和else里的内容实际上比较复杂，因为是一个语句块，之后解析的话可能很多个token组成一个token数组，来表示这个语句块，所以这里面要用一个函数的递归(不明请讲)

token ["if",
[["name",a],["binary","<"],["num",1]],
[
      ["assign",{name:a},{type:number,value:2}],
      ["assign",{name:a},{type:number,value:3}]
],[
	  ["assign",{name:a},{type:number,value:0}]
]]

```

* 语句块：for循环    
for 循环是一个涵盖多行的语句块，也是写在一个大的token里，也可能用到函数递归，甚至for循环里还有if/else等其他语句块。

```
for(i = 0;i<4;i++){
    print("abc");
    print("def");
}

//这里的token应该有五项内容，分别是：标志符"for“，for循环判断条件里的三块内容[这里我们默认每一个块只有一句话，也就是只有一个token(其实判断语句根本不是一个独立的句子，这里稍微扩展了一下概念)]，语句块内容。

token ["for",
["assign",{name:i},{type:number,value:0}],
[["name",i],["binary","<"],["num",1]],
["advanceAssign",{name:i},[["name",i],["binary","+"],["num",1]],
[
	["print",{string:"abc"}],
	["print",{string:"def"}]
]]

```
 
* 语句块 while循环    
while循环相比for循环较为简单

```
while(i<6){
    i++;
}

//这里的token有三项内容，分别是"while"标志符，判断条件，默认是一条语句，语句块内容，可能有好多内容...

token ["while",
[["name",i],["binary","<"],["num",6]],
[
 ["advanceAssign",{name:i},[["name",i],["binary","+"],["num",1]]
]]
```






