/**
 * Created by Xiaotao.Nie on 7/12/2016.
 * All right reserved
 * IF you have any question please email onlythen@yeah.net
 */

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
    binary_pattern = new RegExp("^0[bB]([01]+)");


