function $Node(type){
    this.type = type
    this.children=[]
    this.yield_atoms = []


    //在末尾插入
    this.add = function(child){
        // Insert as the last child
        this.children[this.children.length]=child
        child.parent = this
        child.module = this.module
    }

    //在特定位置插入
    this.insert = function(pos,child){
        // Insert child at position pos
        this.children.splice(pos,0,child)
        child.parent = this
        child.module = this.module
    }

    this.toString = function(){return "<object 'Node'>"} 

    //显示创建的语法树，用于调试用的
    this.show = function(indent){
        // For debugging purposes
        var res = ''
        if(this.type==='module'){
            for(var i=0;i<this.children.length;i++){
                res += this.children[i].show(indent)
            }
            return res
        }
            
        indent = indent || 0
        res += ' '.repeat(indent)
        res += this.context
        if(this.children.length>0) res += '{'
        res +='\n'
        for(var i=0;i<this.children.length;i++){
           res += '['+i+'] '+this.children[i].show(indent+4)
        }
        if(this.children.length>0){
          res += ' '.repeat(indent)
          res+='}\n'
        }
        return res
    }

    //转化成js
    this.to_js = function(indent){
        // 传入的indent表示要缩紧多少
        // 这个时候大多数内容其实都已经存到上下文里了
        // Convert the node into a string with the translation in Javascript
        
        if(this.js!==undefined) return this.js

        this.res = []
        var pos=0
        this.unbound = []
        if(this.type==='module'){
          //如果是module,那么就分块转化
          for(var i=0;i<this.children.length;i++){
             this.res[pos++]=this.children[i].to_js()
             this.children[i].js_index = pos //this.res.length+0
          }
          this.js = this.res.join('')
          //比较关键
          return this.js
        }
        indent = indent || 0
        var ctx_js = this.context.to_js()
        if(ctx_js){ // empty for "global x"
          this.res[pos++]=' '.repeat(indent)
          this.res[pos++]=ctx_js
          this.js_index = pos //this.res.length+0
          if(this.children.length>0) this.res[pos++]='{'
          this.res[pos++]='\n'
          for(var i=0;i<this.children.length;i++){
             this.res[pos++]=this.children[i].to_js(indent+4)
             this.children[i].js_index = pos //this.res.length+0
          }
          if(this.children.length>0){
             this.res[pos++]=' '.repeat(indent)
             this.res[pos++]='}\n'
          }
        }

        this.js = this.res.join('')
        return this.js
    }
    
    this.transform = function(rank){
        // Apply transformations to each node recursively
        // Returns an offset : in case children were inserted by transform(),
        // we must jump to the next original node, skipping those that have
        // just been inserted
        
        // 处理有yield关键字的情况，实际上大多数时候应该没有这个关键字，所以不用考虑太多

        if(this.yield_atoms.length>0){
            // If the node contains 'yield' atoms, we must split the node into
            // several nodes
            // The line 'a = yield X' is transformed into 4 lines :
            //     $yield_value0 = X
            //     yield $yield_value0
            //     $yield_value0 = <value sent to generator > or None
            //     a = $yield_value

            // remove original line
            this.parent.children.splice(rank,1)
            var offset = 0
            for(var i=0;i<this.yield_atoms.length;i++){

                // create a line to store the yield expression in a
                // temporary variable
                var temp_node = new $Node()
                var js = 'var $yield_value'+$loop_num
                js += '='+(this.yield_atoms[i].to_js() || 'None')
                new $NodeJSCtx(temp_node,js)
                this.parent.insert(rank+offset, temp_node)
                
                // create a node to yield the yielded value
                var yield_node = new $Node()
                this.parent.insert(rank+offset+1, yield_node)
                var yield_expr = new $YieldCtx(new $NodeCtx(yield_node))
                new $StringCtx(yield_expr,'$yield_value'+$loop_num)

                // create a node to set the yielded value to the last
                // value sent to the generator, if any
                var set_yield = new $Node()
                set_yield.is_set_yield_value=true
                
                // the JS code will be set in py_utils.$B.make_node
                js = $loop_num
                new $NodeJSCtx(set_yield,js)
                this.parent.insert(rank+offset+2, set_yield)
                
                // in the original node, replace yield atom by None   
                this.yield_atoms[i].to_js = (function(x){
                    return function(){return '$yield_value'+x}
                    })($loop_num)

                $loop_num++
                offset += 3
          }
          // insert the original node after the yield nodes
          this.parent.insert(rank+offset, this)
          this.yield_atoms = []
            
          // Because new nodes were inserted in node parent, return the 
          // offset for iteration on parent's children
          return offset+1
        }

        if(this.type==='module'){
          // module doc string
          this.doc_string = $get_docstring(this)
          var i=0
          while(i<this.children.length){
             var offset = this.children[i].transform(i)
             if(offset===undefined){offset=1}
             i += offset
          }
        }else{
          var elt=this.context.tree[0], ctx_offset
          if(elt.transform !== undefined){
              ctx_offset = elt.transform(this,rank)
          }
          var i=0
          while(i<this.children.length){
              var offset = this.children[i].transform(i)
              if(offset===undefined){offset=1}
              i += offset
          }
          if(ctx_offset===undefined){ctx_offset=1}

            if(this.context && this.context.tree!==undefined &&
                this.context.tree[0].type=="generator"){
                    var def_node = this,
                        def_ctx = def_node.context.tree[0]
                    var blocks = [],
                        node = def_node.parent_block
                     
                    while(true){
                        var node_id = node.id.replace(/\./g, '_')
                        blocks.push('"$locals_'+node_id+'": $locals_'+node_id)
                        node = node.parent_block
                        if(node===undefined || node.id == '__builtins__'){break}
                    }
                    blocks = '{'+blocks+'}'
                    if(def_ctx.name=='fgnx'){
                        console.log('blocks', blocks)
                    }
                    
                    var parent = this.parent
                    while(parent!==undefined && parent.id===undefined){
                        parent = parent.parent
                    }

                    var g = $B.$BRgenerator2(def_ctx.name, blocks,
                        def_ctx.id, def_node),
                        block_id = parent.id.replace(/\./g, '_'),
                        res = '$locals_'+block_id+'["'+def_ctx.name+
                            '"] = $B.genfunc("'+def_ctx.name+'", '+blocks+
                            ',['+g+'])'
                    this.parent.children.splice(rank, 2)
                    this.parent.insert(rank+offset-1,
                        $NodeJS(res))
            }

          return ctx_offset
        }
    }

    this.clone = function(){
        var res = new $Node(this.type)
        for(var attr in this){res[attr] = this[attr]}
        return res
    }

}

//src 是需要被处理的python字符串
function $tokenize(src,module,locals_id,parent_block_id,line_info){
    var br_close = {")":"(","]":"[","}":"{"}
    var br_stack = ""
    var br_pos = []
    var kwdict = ["class","return","break",
        "for","lambda","try","finally","raise","def","from",
        "nonlocal","while","del","global","with",
        "as","elif","else","if","yield","assert","import",
        "except","raise","in", //"not",
        "pass","with","continue","__debugger__",
        "IMPRT" // experimental for asynchronous imports
        // "and',"or","is"
        ]
    var unsupported = []
    var $indented = ['class','def','for','condition','single_kw','try','except','with']
    // from https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Reserved_Words

    var int_pattern = new RegExp("^\\d+(j|J)?"),
        float_pattern1 = new RegExp("^\\d+\\.\\d*([eE][+-]?\\d+)?(j|J)?"),
        float_pattern2 = new RegExp("^\\d+([eE][+-]?\\d+)(j|J)?"),
        hex_pattern = new RegExp("^0[xX]([0-9a-fA-F]+)"),
        octal_pattern = new RegExp("^0[oO]([0-7]+)"),
        binary_pattern = new RegExp("^0[bB]([01]+)")
        
    var context = null
    var root = new $Node('module')
    
    root.indent = -1
    root.module = module
    var new_node = new $Node(),
        current = root,
        name = "",
        _type = null,
        pos = 0,
        indent = null,
        string_modifier = false

    var lnum = 1

    while(pos<src.length){
        var car = src.charAt(pos)
        // build tree structure from indentation
        if(indent===null){
            var indent = 0
            while(pos<src.length){
                var _s=src.charAt(pos)
                if(_s==" "){indent++;pos++}
                else if(_s=="\t"){ 
                    // tab : fill until indent is multiple of 8
                    indent++;pos++
                    if(indent%8>0) indent+=8-indent%8
                }else{break}
            }
            // ignore empty lines
            var _s=src.charAt(pos)
            if(_s=='\n'){pos++;lnum++;indent=null;continue}
            else if(_s==='#'){ // comment
                var offset = src.substr(pos).search(/\n/)
                if(offset===-1){break}
                pos+=offset+1;lnum++;indent=null;continue
            }
            new_node.indent = indent
            new_node.line_num = lnum
            new_node.module = module
            // attach new node to node with indentation immediately smaller
            if(indent>current.indent){
                // control that parent ended with ':'
                if(context!==null){
                    if($indented.indexOf(context.tree[0].type)==-1){
                        $pos = pos
                        $_SyntaxError(context,'unexpected indent',pos)
                    }
                }
                // add a child to current node
                current.add(new_node)
            }else if(indent<=current.indent &&
                $indented.indexOf(context.tree[0].type)>-1 &&
                context.tree.length<2){
                    $pos = pos
                    $_SyntaxError(context,'expected an indented block',pos)
            }else{ // same or lower level
                while(indent!==current.indent){
                    current = current.parent
                    if(current===undefined || indent>current.indent){
                        $pos = pos
                        $_SyntaxError(context,'unexpected indent',pos)
                    }
                }
                current.parent.add(new_node)
            }
            current = new_node
            context = new $NodeCtx(new_node)
            continue
        }
        // comment
        if(car=="#"){
            var end = src.substr(pos+1).search('\n')
            if(end==-1){end=src.length-1}
            pos += end+1;continue
        }
        // string
        if(car=='"' || car=="'"){
            var raw = context.type == 'str' && context.raw,
                bytes = false ,
                end = null;
            if(string_modifier){
                switch(string_modifier) {
                  case 'r': // raw string
                    raw = true
                    break
                  case 'u':
                    // in string literals, '\U' and '\u' escapes in raw strings 
                    // are not treated specially.
                    break
                  case 'b':
                    bytes = true
                    break
                  case 'rb':
                  case 'br':
                    bytes=true;raw=true
                    break
                }
                string_modifier = false
            }
            if(src.substr(pos,3)==car+car+car){_type="triple_string";end=pos+3}
            else{_type="string";end=pos+1}
            var escaped = false
            var zone = car
            var found = false
            while(end<src.length){
                if(escaped){
                    zone+=src.charAt(end)
                    if(raw && src.charAt(end)=='\\'){zone+='\\'}
                    escaped=false;end+=1
                }else if(src.charAt(end)=="\\"){
                    if(raw){
                        if(end<src.length-1 && src.charAt(end+1)==car){
                            zone += '\\\\'+car
                            end += 2
                        }else{
                            zone += '\\\\'
                            end++
                        }
                        escaped = true
                    } else {
                        if(src.charAt(end+1)=='\n'){
                            // explicit line joining inside strings
                            end += 2
                            lnum++
                        } else {
                            if(end < src.length-1 &&
                                is_escaped[src.charAt(end+1)]==undefined){
                                    zone += '\\'
                            }
                            zone+='\\'
                            escaped=true;end+=1
                        }
                    }
                } else if(src.charAt(end)=='\n' && _type!='triple_string'){
                    // In a string with single quotes, line feed not following
                    // a backslash raises SyntaxError
                    $pos = end
                    $_SyntaxError(context, ["EOL while scanning string literal"])
                } else if(src.charAt(end)==car){
                    if(_type=="triple_string" && src.substr(end,3)!=car+car+car){
                        zone += src.charAt(end)
                        end++
                    } else {
                        found = true
                        // end of string
                        $pos = pos
                        // Escape quotes inside string, except if they are already escaped
                        // In raw mode, always escape
                        var $string = zone.substr(1),string=''
                        for(var i=0;i<$string.length;i++){
                            var $car = $string.charAt(i)
                            if($car==car &&
                                (raw || (i==0 || $string.charAt(i-1)!=='\\'))){
                                    string += '\\'
                            }
                            string += $car
                        }
                        if(bytes){
                            context = $transition(context,'str','b'+car+string+car)
                        }else{
                            context = $transition(context,'str',car+string+car)
                        }
                        context.raw = raw;
                        pos = end+1
                        if(_type=="triple_string"){pos = end+3}
                        break
                    }
                } else { 
                    zone += src.charAt(end)
                    if(src.charAt(end)=='\n'){lnum++}
                    end++
                }
            }
            if(!found){
                if(_type==="triple_string"){
                    $_SyntaxError(context,"Triple string end not found")
                }else{
                    $_SyntaxError(context,"String end not found")
                }
            }
            continue
        }
        // identifier ?
        if(name=="" && car!='$'){
            // regexIdentifier is defined in brython_builtins.js. It is a regular
            // expression that matches all the valid Python identifier names,
            // including those in non-latin writings (cf issue #358)
            if($B.regexIdentifier.exec(car)){
                name=car // identifier start
                var p0=pos
                pos++
                while(pos<src.length && $B.regexIdentifier.exec(src.substring(p0, pos+1))){
                    name+=src.charAt(pos)
                    pos++
                }
            }
            if(name){
                //pos += name.length
                if(kwdict.indexOf(name)>-1){
                    $pos = pos-name.length
                    if(unsupported.indexOf(name)>-1){
                        $_SyntaxError(context,"Unsupported Python keyword '"+name+"'")                    
                    }
                    context = $transition(context,name)
                } else if($operators[name]!==undefined 
                    && $B.forbidden.indexOf(name)==-1) { 
                    // Literal operators : "and", "or", "is", "not"
                    // The additional test is to exclude the name "constructor"
                    if(name=='is'){
                        // if keyword is "is", see if it is followed by "not"
                        var re = /^\s+not\s+/
                        var res = re.exec(src.substr(pos))
                        if(res!==null){
                            pos += res[0].length
                            $pos = pos-name.length
                            context = $transition(context,'op','is_not')
                        }else{
                            $pos = pos-name.length
                            context = $transition(context,'op', name)
                        }
                    }else if(name=='not'){
                        // if keyword is "not", see if it is followed by "in"
                        var re = /^\s+in\s+/
                        var res = re.exec(src.substr(pos))
                        if(res!==null){
                            pos += res[0].length
                            $pos = pos-name.length
                            context = $transition(context,'op','not_in')
                        }else{
                            $pos = pos-name.length
                            context = $transition(context,name)
                        }
                    }else{
                        $pos = pos-name.length
                        context = $transition(context,'op',name)
                    }
                } else if((src.charAt(pos)=='"'||src.charAt(pos)=="'")
                    && ['r','b','u','rb','br'].indexOf(name.toLowerCase())!==-1){
                    string_modifier = name.toLowerCase()
                    name = ""
                    continue
                } else {
                    if($B.forbidden.indexOf(name)>-1){name='$$'+name}
                    $pos = pos-name.length
                    context = $transition(context,'id',name)
                }
                name=""
                continue
            }
        }

        switch(car) {
          case ' ':
          case '\t':
            pos++
            break
          case '.':
            // point, ellipsis (...)
            if(pos<src.length-1 && /^\d$/.test(src.charAt(pos+1))){
                // number starting with . : add a 0 before the point
                var j = pos+1
                while(j<src.length && src.charAt(j).search(/\d|e|E/)>-1){j++}
                context = $transition(context,'float','0'+src.substr(pos,j-pos))
                pos = j
                break
            }
            $pos = pos
            context = $transition(context,'.')
            pos++
            break
          case '0':
            // octal, hexadecimal, binary
            //if(car==="0"){
            var res = hex_pattern.exec(src.substr(pos))
            if(res){
                context=$transition(context,'int',[16,res[1]])
                pos += res[0].length
                break
            }
            var res = octal_pattern.exec(src.substr(pos))
            if(res){
                context=$transition(context,'int',[8,res[1]]) //parseInt(res[1],8))
                pos += res[0].length
                break
            }
            var res = binary_pattern.exec(src.substr(pos))
            if(res){
                context=$transition(context,'int',[2,res[1]]) //parseInt(res[1],2))
                pos += res[0].length
                break
            }
            // literal like "077" is not valid in Python3
            if(src.charAt(pos+1).search(/\d/)>-1){
                // literal like "000" is valid in Python3
                if(parseInt(src.substr(pos)) === 0){
                    res = int_pattern.exec(src.substr(pos))
                    $pos = pos
                    context = $transition(context,'int',[10,res[0]])
                    pos += res[0].length
                    break
                }else{$_SyntaxError(context,('invalid literal starting with 0'))}
            }
          case '0':
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
          case '6':
          case '7':
          case '8':
          case '9':
            // digit
            var res = float_pattern1.exec(src.substr(pos))
            if(res){
                $pos = pos
                if(res[2]!==undefined){
                    context = $transition(context,'imaginary',
                        res[0].substr(0,res[0].length-1))
                }else{context = $transition(context,'float',res[0])}
            }else{
                res = float_pattern2.exec(src.substr(pos))
                if(res){
                    $pos =pos
                    if(res[2]!==undefined){
                        context = $transition(context,'imaginary',
                            res[0].substr(0,res[0].length-1))
                    }else{context = $transition(context,'float',res[0])}
                }else{
                    res = int_pattern.exec(src.substr(pos))
                    $pos = pos
                    if(res[1]!==undefined){
                        context = $transition(context,'imaginary',
                            res[0].substr(0,res[0].length-1))
                    }else{context = $transition(context,'int',[10,res[0]])}
                }
            }
            pos += res[0].length
            break
          case '\n':
            // line end
            lnum++
            if(br_stack.length>0){
                // implicit line joining inside brackets
                pos++;//continue
            } else {
                if(current.context.tree.length>0){
                    $pos = pos
                    context = $transition(context,'eol')
                    indent=null
                    new_node = new $Node()
                }else{
                    new_node.line_num = lnum
                }
                pos++
            }
            break
          case '(':
          case '[':
          case '{':
            br_stack += car
            br_pos[br_stack.length-1] = [context,pos]
            $pos = pos
            context = $transition(context,car)
            pos++
            break
          case ')':
          case ']':
          case '}':
            if(br_stack==""){
                $_SyntaxError(context,"Unexpected closing bracket")
            } else if(br_close[car]!=br_stack.charAt(br_stack.length-1)){
                $_SyntaxError(context,"Unbalanced bracket")
            } else {
                br_stack = br_stack.substr(0,br_stack.length-1)
                $pos = pos
                context = $transition(context,car)
                pos++
            }
            break
          case '=':
            if(src.charAt(pos+1)!="="){
                $pos = pos
                context = $transition(context,'=')
                pos++; //continue
            } else {
                $pos = pos
                context = $transition(context,'op','==')
                pos+=2
            }
            break
          case ',':
          case ':': 
            $pos = pos
            context = $transition(context,car)
            pos++
            break
          case ';':
            $transition(context,'eol') // close previous instruction
            // create a new node, at the same level as current's parent
            if(current.context.tree.length===0){
                // consecutive ; are not allowed
                $pos=pos
                $_SyntaxError(context,'invalid syntax')
            }
            // if ; ends the line, ignore it
            var pos1 = pos+1
            var ends_line = false
            while(pos1<src.length){
                var _s=src.charAt(pos1)
                if(_s=='\n' || _s=='#'){ends_line=true;break}
                else if(_s==' '){pos1++}
                else{break}
            }
            if(ends_line){pos++;break}
            
            new_node = new $Node()
            new_node.indent = $get_node(context).indent
            new_node.line_num = lnum
            new_node.module = module
            $get_node(context).parent.add(new_node)
            current = new_node
            context = new $NodeCtx(new_node)
            pos++
            break
          case '/':
          case '%':
          case '&':
          case '>':
          case '<':
          case '-':
          case '+':
          case '*':
          case '/':
          case '^':
          case '=':
          case '|':
          case '~':
          case '!':
          //case 'i':
          //case 'n':
            // operators
            
            // special case for annotation syntax
            if(car=='-' && src.charAt(pos+1)=='>'){
                context = $transition(context,'annotation')
                pos += 2
                continue
            }
            // find longest match
            var op_match = ""
            for(var op_sign in $operators){
                if(op_sign==src.substr(pos,op_sign.length) 
                    && op_sign.length>op_match.length){
                    op_match=op_sign
                }
            }
            //if(car=='!'){alert('op_match '+op_match)}
            $pos = pos
            if(op_match.length>0){
                if(op_match in $augmented_assigns){
                    context = $transition(context,'augm_assign',op_match)
                }else{
                    context = $transition(context,'op',op_match)
                }
                pos += op_match.length
            }else{
                $_SyntaxError(context,'invalid character: '+car)
            }
            break
          case '\\':
            if (src.charAt(pos+1)=='\n'){
              lnum++ 
              pos+=2
              break
            }
          case '@':
            $pos = pos
            context = $transition(context,car)
            pos++
            break
          default:
            $pos=pos;$_SyntaxError(context,'unknown token ['+car+']')
        } //switch
    }

    if(br_stack.length!=0){
        var br_err = br_pos[0]
        $pos = br_err[1]
        $_SyntaxError(br_err[0],["Unbalanced bracket "+br_stack.charAt(br_stack.length-1)])
    }
    if(context!==null && $indented.indexOf(context.tree[0].type)>-1){
        $pos = pos-1
        $_SyntaxError(context,'expected an indented block',pos)    
    }
    
    return root
}