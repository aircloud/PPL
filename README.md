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

```
a = 123;
token ["var",{name:a},{type:number,value:123}];

//声明之后然后给它赋值
a = 456
token ["assign",{name:a},{type:number,value:456}]

//如果是字符串道理相同：

a = "a string";
token ["var",{name:a},{type:string,value:"a string"}];

//声明之后然后给它赋值
a = "another string"
token ["assign",{name:a},{type:string,value:"another string"}]

//先赋值成字符串之后变成数字以及反之都是可以的，这里不多举例子了。
```

* 语句的基本运算   
这里面要涉及数据结构的中缀表达式的生成，当然这不是词法解析时候的事情，所以token的生成还是不怎么变的，只是生成的token有所变化，这里的基本运算涉及数字之间的四则运算，以及和变量之间的四则运算，直接举例：

```

a = 3 + 5 - 6 * 2;
token ["advanceAssign",{name:a},[["num",3],["binary","+"],["num",5],["binary","-"],["num",6],["binary","*"],["num",2]]]
//请仔细注意，这里的token和前面有所区分

b = 6;
//这里的token前面写过了，就不重复了

a = b + 2;
token ["advanceAssign",{name:a},[["name",b],["binary","+"],["num",5]]

a = 3 * (4 + 5)
token ["advanceAssign",{name:a},[["num",3],["binary","*"],['bracket',"("],["num",4],["binary","+"],["num",5],['bracket',")"]]]
//这是一个带括号的，一般也是只会产生小括号，中括号和大括号应该是没有的

```






