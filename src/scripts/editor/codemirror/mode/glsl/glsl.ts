import CodeMirror from "../../lib/codemirror"
import "../../addon/mode/simple"

const types = [
    "void", "bool", "int", "float",
    "vec2", "vec3", "vec4",
    "bvec2", "bvec3", "bvec4",
    "ivec2", "ivec3", "ivec4",
    "mat2", "mat3", "mat4",
    "sampler2D", "samplerCube"
]
const preprocessor = [
    "#define", "#undef", "#if", "#ifdef", "#ifndef", "#else", "#elif", "#endif", "#error", "#pragma", "#extension", "#version", "#line"
]
const operators = [
    "++", "--",
    "+", "-", "!", "*", "/", "?", ":",
    "<", ">", "<=", ">=", "==", "!=",
    "&&", "||", "^^",
    "+=", "-=", "*=", "/="
]
const functions = [
    "main",
    "radians", "degrees", "sin", "cos", "tan", "asin", "acos", "atan",
    "pow", "exp", "log", "exp2", "log2", "sqrt", "inversesqrt",
    "abs", "sign", "floor", "ceil", "fract", "mod", "min", "max", "clamp", "mix", "step", "smoothstep",
    "length", "distance", "dot", "cross", "normalize", "faceforward", "reflect", "refract",
    "matrixCompMult",
    "lessThan", "lessThanEqual", "greaterThan", "greaterThanEqual", "equal", "notEqual", "any", "all", "not",
    "texture2DLod", "texture2DProjLod", "textureCubeLod", "textureCube", "texture2D"
]
const variablesAndConstants = [
    "gl_Position", "gl_PointSize",
    "gl_FragCoord", "gl_FrontFacing", "gl_PointCoord", "gl_FragColor", "gl_FragData",
    "gl_MaxVertexAttribs", "gl_MaxVertexUniformVectors", "gl_MaxVaryingVectors", "gl_MaxVertexTextureImageUnits", "gl_MaxCombinedTextureImageUnits", "gl_MaxTextureImageUnits", "gl_MaxFragmentUniformVectors", "gl_MaxDrawBuffers",
    "gl_DepthRangeParameters", "gl_DepthRange"
]
const keywords = [
    "struct",
    "for", "do", "while",
    "if", "else",
    "break", "continue", "return", "discard",
    "__LINE__", "__VERSION__", "GL_ES", "GL_FRAGMENT_PRECISION_HIGH",
    "const", "attribute", "uniform", "varying",
    "in", "out", "inout",
    "precision", "highp", "mediump", "lowp",
    "invariant"
]

CodeMirror.defineSimpleMode( "glsl", {
    start: [
        // keywords
        { regex: asRegExp( types ), token: "type" },
        { regex: asRegExp( functions ), token: "builtin" },
        { regex: asRegExp( keywords ), token: "keyword" },
        { regex: asRegExp( variablesAndConstants, { prefix: "gl_" } ), token: "atom" },
        // attributes
        { regex: /(\.)([a-zA-Z_][\w]*)/, token: [ "punctuation", "attribute" ] },
        // preprocessor
        { regex: /#[a-z]*/, token: "meta" },
        // boolean values
        { regex: /true|false/, token: "boolean" },
        // remaining identifiers
        { regex: /[a-zA-Z_][\w]*/, token: "identifier" },
        // numbers
        { regex: /(\d+\.\d*|\d*\.\d+)([eE][\-+]?\d+)?/, token: "number.float" },
        { regex: /\d+[eE]([\-+]?\d+)/, token: "number.float" },
        { regex: /0[xX]([0-9a-fA-F])+/, token: "number.hex" },
        { regex: /0([0-7])+/, token: "number.octal" },
        { regex: /\d[\d]*/, token: "number" },
        // comments
        { regex: /\/\/.*/, token: "comment" },
        { regex: /\/\*/, token: "comment", next: "comment" },
        // operators
        { regex: new RegExp( "(" + operators.map( operator => escapeSpecialCharacters( operator ) ).join( "|" ) + ")" ), token: "operator" },
        { regex: /=/, token: "operator assign" },
        // punctuation
        { regex: /\.|;|,/, token: "punctuation" },
        // brackets, indentation
        { regex: /[\{\[\(]/, token: "bracket", indent: true },
        { regex: /[\}\]\)]/, token: "bracket", dedent: true }
    ],
    comment: [
        { regex: /.*?\*\//, token: "comment", next: "start" },
        { regex: /.*/, token: "comment" }
    ],
    meta: {
        fold: [ "brace" ],
        lineComment: "//"
    }
} )

function asRegExp( values: string[], options?: { prefix?: string } ) {
    options = options || {}
    if ( options.prefix === undefined ) options.prefix = ""

    // @ts-ignore
    if ( options.prefix.length > 0 ) values = values.map( value => value.slice( options.prefix.length ) )
    const valuesEscaped = values.map( value => escapeSpecialCharacters( value ) )
    let regexString = "\\b" + options.prefix + "(" + valuesEscaped.join( "|" ) + ")" + "\\b"

    return new RegExp( regexString )
}

function escapeSpecialCharacters( regExpString: string ) {
    return regExpString.replace( /\.|\^|\$|\\|\+|\*|\?|\|/g, match => "\\" + match )
}
