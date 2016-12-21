/**
 * Created by Xiaotao.Nie on 21/12/2016.
 * All right reserved
 * IF you have any question please email onlythen@yeah.net
 */

//前置函数
function isArray(o){
    try{
        Array.prototype.toString.call(o);
        return true;
    }
    catch(e){

    }
    return false;
}


function abs(x){

    if(x<0)
        return -x;
    return x;

}


function pow(x,y){

    return Math.pow(x,y);

}


//list/tuple 支持函数
function len(o){
    return o.length;
}

//tuple内置函数 比较两个元组
//非tuple中也有这个函数，所以要做一个区分
function cmp(x,y){

    if(isArray(x)&&isArray(y)){

        if(x.length!=y.length){
            return x.length>y.length?1:-1;
        }
        else{
            for(var temp=0;temp<x.length;temp++){
                if(cmp(x[temp],y[temp]))
                    return cmp(x[temp],y[temp]);
            }
            return 0;
        }

    }
    else{
        if(x==y){
            return 0;
        }
        else return x>y?1:-1;
    }

}

//tuple内置函数
function max(tuple1){
    return Math.max.apply(null, tuple1);
}

//tuple内置函数
function min(tuple1){
    return Math.min.apply(null, tuple1);
}


