
## 基于ES6的python解释器

小组成员：

聂小涛，学号：3130104419   
林远，学号：   
赵顾阳，学号：3140102757    
(备注：和fm网站上面稍有出入，fm网站上面无法更改，请老师以此为准，谢谢)

### 目录

* 实现简介
* 样例演示
* 实现过程
	* 代码清理
	* token生成
	* AST树
	* 解析执行
* 组员分工

### 实现简介

我们实现的python解释器主要有以下几个特点：

* 基于ECMAscript2015(ES6)和nodejs
* 基于模块加载
* 将函数看作一等公民
* 没有声明提前
* 动态类型语言(变量无类型,值有类型)

总共实现了以下功能：

* 支持number、string、list、tuple、set、map、function
* 支持"+","-","*","/","%",">","<","=="等基本运算
* 支持部分python内置函数(pow、len、max、min)
* 总体实现的有：
  变量初始化、赋值、调用、运算、逻辑(三目运算、if...else...、while、for循环[增加写法])、函数、函数调用、数据结构(list、tuple、set、map以及其引用、成员方法)、注释(两种)、部分错误处理
  
**在实现过程中，代码清理、生成token、解析token以及生成AST树的过程均为自行开发，没有参考任何第三方代码，在AST树的解析过程中，参考了prython.js,Uglify.js等开源库，由于我们采用的是ES6语法，所以该部分在参考开源代码的情况下采用ES6进行了改写**  

另外我们实现的python解释器秉承多步骤复合增强的理念，每一步骤的解析结果均结合上下文进行处理。即我们在每一个步骤中都有进行错误判断并错误处理，在token处理的过程中维护变量栈，并不是完全上下文无关，在token解析生成AST树的过程中做了绝大多数错误处理，比如函数调用范围的错误，变量使用范围的错误，即时报错，这样可以有效提高解释器的效率，并且能够进行分工难度分散以及每个组员对整体逻辑的把握，便于大家分工协作。


### 样例展示

我们在实现的过程中将输出直接输出控制台，以下是我们的一些样例展示。

* 基本的赋值，输出语句：

![](./ppl/ppl1.png)

* 变量运算操作，复杂表达式的运算，三目运算符：

![](./ppl/ppl2.png)

* 逻辑操作：if...else...，带有嵌套的if...else...以及elif：

![](./ppl/ppl3.png)

* 逻辑操作：while循环

![](./ppl/ppl4.png)

* 逻辑操作：for循环(此种for循环为我们增强实现的部分,考虑到很多编程语言建议采用此种for循环，我们在此进行实现)

![](./ppl/ppl5.png)

* 逻辑操作：for循环：其中的range函数我们用js进行了重写

![](./ppl/ppl6.png)

* 函数的定义和调用：函数可以访问全局变量，也可以维护局部变量：

![](./ppl/ppl7.png)

* 函数的定义和调用：由于在我们的实现中函数是一等公民，因此可以像变量一样到处调用：

![](./ppl/ppl8.png)

* list：我们用js重写了list的一些方法

![](./ppl/ppl9.png)

* dict: dict在这里我们的实现过程实际上是一个语法糖，每一个键值对表示为一个两个元素的数组，整体是一个二维数组，我们同样用js重写了一些方法：

![](./ppl/ppl10.png)

* set：set可以去除重复内容

![](./ppl/ppl11.png)

* tuple：tuple是不能够修改内容的

![](./ppl/ppl12.png)

* 错误处理1: 使用保留字/关键字定义会报错：

![](./ppl/ppl13.png)

* 错误处理2: 函数在声明前使用（因为我们并不存在变量提升)

![](./ppl/ppl14.png)

### 实现过程

#### 代码清理

<!--扯一扯...多写几句-->

#### 生成token
*打印字符串
` print "a string";

token ["print",{string:"a string"}]`
<!--这里就把github上的内容整理一下,放过来,越多越好....-->

#### AST树

AST树在js中实际上是一个非常复杂的数组，我们根据生成的token不同不同类型采用了不同的处理方式。这里我对个别重点进行解释：


* AST树的结构

我们采用递归块的形式创建AST树的结构，每一个语句都是根结点下的一个节点，同时每一个字节点也可以挂载若干字节点，整体样例如下：

```
├─ 0: toplevel
└─ 1
   ├─ 0
   │  ├─ 0: stat
   │  └─ 1
   │     ├─ 0: call
   │     ├─ 1
   │     │  ├─ 0: dot
   │     │  ├─ 1
   │     │  │  ├─ 0: name
   │     │  │  └─ 1: console
   │     │  └─ 2: log
   │     └─ 2
   │        └─ 0
   │           ├─ 0: string
   │           └─ 1: hello world
```
在入口函数(即/control/convert.control.js的entrance函数)中逐条分析token生成AST树。

* 复杂运算

我们以下类型变量都可以参与运算：

```
['num','call','name','string','array',"map","set","new","sub"];
```

运算符优先级规则如下：

```
    "(": 1,
    ">>": 2,
    "<<": 2,
    "&": 2,
    "|": 2,
    "*": 2,
    "/": 2,
    "%": 2,
    "+": 4,
    "-": 4,
    "<": 8,
    ">": 8,
    "==":8
    "&&":9
    "||":10
```

之后我们先转化为后缀表达式，然后再转化成AST表达式树(具体代码详见附件，这里给出框架)：

```
function inOrderToPost(original){
    var stack = [];
    var result = [];
    var tempIndex;

    for(var ii = 0; ii < original.length; ii++){
 		//循环处理
       //此处代码省略
    }
    while(stack.length){
        result.push(stack.pop());
    }
    // console.log("post result:\n",result);
    return result;
}

//根据后缀表达式构造出一个AST树需要的表达式树
function PostToTree(original){
    var stack = [];
    var result = [];
    var tempIndex;
    var tempSubTree,tempSubTree1,tempSubTree2;
    for(var ii = 0; ii < original.length; ii++){
       //循环处理
       //此处代码省略
    }
    return result[0];

}
```

* 函数和其他类型变量

我们维护了一个函数池和变量池(不包括函数，虽然函数也是变量)，来保存当前作用域函数和变量的信息，这样就可以在函数或者变量被调用的时候分析是不是已经被定义，也可以在变量被赋值的时候确定该变量是不是第一次被赋值(实际上在token处理的过程中已经考虑到该情况)

```
//函数池，存储函数信息
var functionPool = [];

//数据池,对应：变量=>类型
var dataPool = new Map();
```

### 解释执行

我们可以利用之前生成的AST树，直接模拟执行JS代码，也可以根据AST树存储的信息，生成特殊的JS代码交由引擎去执行。

由于我们重写了一些函数作为python的支持函数，实际上这些支持的函数是不能被放入AST树中的，所以生成特殊的JS代码是一种比较方便的方式。

我们生成AST树之后，直接根据节点类型递归遍历即可，下面的函数简明说明了这一点：

```
var walkers = {
        "string": function(str) {
            return [ this[0], str ];
        },
        "num": function(num) {
            return [ this[0], num ];
        },
        "name": function(name) {
            return [ this[0], name ];
        },
        "toplevel": function(statements) {
            return [ this[0], MAP(statements, walk) ];
        },
        "var": _vardefs,
        "const": _vardefs,
        "try": function(t, c, f) {
            return [
                this[0],
                MAP(t, walk),
                c != null ? [ c[0], MAP(c[1], walk) ] : null,
                f != null ? MAP(f, walk) : null
            ];
        },
      
        "new": function(ctor, args) {
            return [ this[0], walk(ctor), MAP(args, walk) ];
        },
     
     
        "assign": function(op, lvalue, rvalue) {
            return [ this[0], op, walk(lvalue), walk(rvalue) ];
        },
        "dot": function(expr) {
            return [ this[0], walk(expr) ].concat(slice(arguments, 1));
        },
        "call": function(expr, args) {
            return [ this[0], walk(expr), MAP(args, walk) ];
        },
        "function": function(name, args, body) {
            return [ this[0], name, args.slice(), MAP(body, walk) ];
        },
    
        "defun": function(name, args, body) {
            return [ this[0], name, args.slice(), MAP(body, walk) ];
        },
        "if": function(conditional, t, e) {
            return [ this[0], walk(conditional), walk(t), walk(e) ];
        },
        "for": function(init, cond, step, block) {
            return [ this[0], walk(init), walk(cond), walk(step), walk(block) ];
        },
        "for-in": function(vvar, key, hash, block) {
            return [ this[0], walk(vvar), walk(key), walk(hash), walk(block) ];
        },
        "for-of": function(vvar, key, hash, block) {
            return [ this[0], walk(vvar), walk(key), walk(hash), walk(block) ];
        },
        "while": function(cond, block) {
            return [ this[0], walk(cond), walk(block) ];
        },
};
```
之后我们可以直接执行指定我们生成的特殊js代码。

### 组员分工
 
查阅资料，完成整体设计，确定我们要实现的功能：小组三人。   
代码清理，生成token(部分)：赵顾阳   
生成token，对接语法树：林远   
构造生成语法树、错误处理、解析执行：聂小涛   
JS重写python默认支持函数：小组三人   
前端界面：聂小涛

