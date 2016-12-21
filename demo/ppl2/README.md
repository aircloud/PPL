整个代码段分块解析，块的意思是：

如果是函数块，那么整个函数算一块。

如果是普通的语句，比如赋值，加减、函数调用等，那么就算一块。

整体是一个二维数组，每一块是一个一维数组，每一个一维数组要用一个单词表示这一块是干什么的。之后的每一个元素，**应该是一个一个的token，每一个token是一个键值对**。

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

