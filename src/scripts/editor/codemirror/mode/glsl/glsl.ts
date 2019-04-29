import CodeMirror from "../../lib/codemirror"
import "../../addon/mode/simple"

const es100 = {
    types: [
        "void", "bool", "int", "float",
        "vec2", "vec3", "vec4",
        "bvec2", "bvec3", "bvec4",
        "ivec2", "ivec3", "ivec4",
        "mat2", "mat3", "mat4",
        "sampler2D", "samplerCube"
    ],
    preprocessor: [
        "#define", "#undef", "#if", "#ifdef", "#ifndef", "#else", "#elif", "#endif", "#error", "#pragma", "#extension", "#version", "#line"
    ],
    operators: [
        "++", "--",
        "<=", ">=", "!=",
        "&&", "||", "^^",
        "+", "-", "!", "*", "/", "?", ":",
        "<", ">"
    ],
    assignments: [
        "+=", "-=", "*=", "/=", "="
    ],
    functions: [
        "main",
        "radians", "degrees", "sin", "cos", "tan", "asin", "acos", "atan",
        "pow", "exp", "log", "exp2", "log2", "sqrt", "inversesqrt",
        "abs", "sign", "floor", "ceil", "fract", "mod", "min", "max", "clamp", "mix", "step", "smoothstep",
        "length", "distance", "dot", "cross", "normalize", "faceforward", "reflect", "refract",
        "matrixCompMult",
        "lessThan", "lessThanEqual", "greaterThan", "greaterThanEqual", "equal", "notEqual", "any", "all", "not",
        "texture2DLod", "texture2DProjLod", "textureCubeLod", "textureCube", "texture2D"
    ],
    variablesAndConstants: [
        "gl_Position", "gl_PointSize",
        "gl_FragCoord", "gl_FrontFacing", "gl_PointCoord", "gl_FragColor", "gl_FragData",
        "gl_MaxVertexAttribs", "gl_MaxVertexUniformVectors", "gl_MaxVaryingVectors", "gl_MaxVertexTextureImageUnits", "gl_MaxCombinedTextureImageUnits", "gl_MaxTextureImageUnits", "gl_MaxFragmentUniformVectors", "gl_MaxDrawBuffers",
        "gl_DepthRangeParameters", "gl_DepthRange"
    ],
    keywords: [
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
}

const es300 = {
    types: [
        "void", "bool", "uint", "int", "float",
        "vec2", "vec3", "vec4",
        "bvec2", "bvec3", "bvec4",
        "ivec2", "ivec3", "ivec4",
        "uvec2", "uvec3", "uvec4",
        "mat2", "mat3", "mat4",
        "mat2x2", "mat2x3", "mat2x4",
        "mat3x2", "mat3x3", "mat3x4",
        "mat4x2", "mat4x3", "mat4x4",
        "sampler2D", "sampler3D",
        "samplerCube",
        "sampler2DArray",
        "samplerCubeShadow",
        "sampler2DShadow",
        "sampler2DArrayShadow",
        "isampler2D", "isampler3D",
        "isamplerCube",
        "isampler2DArray",
        "usampler2D", "usampler3D",
        "usamplerCube",
        "usampler2DArray"
    ],
    preprocessor: [
        "#define", "#undef", "#if", "#ifdef", "#ifndef", "#else", "#elif", "#endif", "#error", "#pragma", "#extension", "#version", "#line"
    ],
    operators: [
        "++", "--",
        "<=", ">=", "!=",
        "&&", "||", "^^",
        ">>", "<<",
        "+", "-", "~", "!", "*", "%", "/", "?", ":",
        "<", ">", "&", "^", "|"
    ],
    assignments: [
        "+=", "-=", "*=", "/=", "%=", "<<=", ">>=", "&=", "^=", "|=", "="
    ],
    functions: [
        "main",
        "radians", "degrees", "sin", "cos", "tan", "asin", "acos", "atan", "sinh", "cosh", "tanh", "asinh", "acosh", "atanh",
        "pow", "exp", "log", "exp2", "log2", "sqrt", "inversesqrt",
        "abs", "sign", "floor", "trunc", "round", "roundEven", "ceil", "fract", "mod", "modf", "min", "max", "clamp", "mix", "step", "smoothstep", "isnan", "isinf", "floatBitsToInt", "floatBitsToUint", "intBitsToFloat", "uintBitsToFloat",
        "packSnorm2x16", "packUnorm2x16", "unpackSnorm2x16", "unpackUnorm2x16", "packHalf2x16", "unpackHalf2x16",
        "length", "distance", "dot", "cross", "normalize", "faceforward", "reflect", "refract",
        "matrixCompMult", "outerProduct", "transpose", "determinant", "inverse",
        "lessThan", "lessThanEqual", "greaterThan", "greaterThanEqual", "equal", "notEqual", "any", "all", "not",
        "textureSize", "texture", "textureProj", "textureLod", "textureOffset", "texelFetch", "texelFetchOffset", "textureProjOffset", "textureLodOffset", "textureProjLod", "textureProjLodOffset", "textureGrad", "textureGradOffset", "textureProjGrad", "textureProjGradOffset",
        "dFdx", "dFdy", "fwidth"
    ],
    variablesAndConstants: [
        "gl_Position", "gl_PointSize",
        "gl_FragCoord", "gl_FrontFacing", "gl_PointCoord", "gl_FragDepth",
        "gl_MaxVertexAttribs", "gl_MaxVertexUniformVectors", "gl_MaxVertexOutputVectors", "gl_MaxFragmentInputVectors", "gl_MaxVertexTextureImageUnits", "gl_MaxCombinedTextureImageUnits", "gl_MaxTextureImageUnits", "gl_MaxFragmentUniformVectors", "gl_MaxDrawBuffers", "gl_MinProgramTexelOffset", "gl_MaxProgramTexelOffset",
        "gl_DepthRangeParameters", "gl_DepthRange"
    ],
    keywords: [
        "struct",
        "for", "do", "while",
        "if", "else", "switch", "case",
        "break", "continue", "return", "discard",
        "__LINE__", "__FILE__", "__VERSION__", "GL_ES",
        "const", "uniform", "centroid", "in", "out",
        "smooth", "flat",
        "inout",
        "precision", "highp", "mediump", "lowp",
        "invariant"
    ]
}

CodeMirror.defineSimpleMode( "glsl-es-100", {
    start: [
        // keywords
        { regex: asRegExp( es100.types ), token: "type" },
        { regex: asRegExp( es100.functions ), token: "builtin" },
        { regex: asRegExp( es100.keywords ), token: "keyword" },
        { regex: asRegExp( es100.variablesAndConstants, { prefix: "gl_" } ), token: "atom" },
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
        // operators & assignments
        { regex: /==/, token: "operator" }, // special case to avoid it falling inside the "assignments" category
        { regex: new RegExp( "(" + es100.assignments.map( operator => escapeSpecialCharacters( operator ) ).join( "|" ) + ")" ), token: "operator assign" },
        { regex: new RegExp( "(" + es100.operators.map( operator => escapeSpecialCharacters( operator ) ).join( "|" ) + ")" ), token: "operator" },
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
        lineComment: "//",
        closeBrackets: { pairs: "()[]{}''\"\"", closeBefore: ")]}'\";", explode: "[]{}()" }
    }
} )

CodeMirror.defineSimpleMode( "glsl-es-300", {
    start: [
        // keywords
        { regex: asRegExp( es300.types ), token: "type" },
        { regex: asRegExp( es300.functions ), token: "builtin" },
        { regex: asRegExp( es300.keywords ), token: "keyword" },
        { regex: asRegExp( es300.variablesAndConstants, { prefix: "gl_" } ), token: "atom" },
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
        // operators & assignments
        { regex: /==/, token: "operator" }, // special case to avoid it falling inside the "assignments" category
        { regex: new RegExp( "(" + es300.assignments.map( operator => escapeSpecialCharacters( operator ) ).join( "|" ) + ")" ), token: "operator assign" },
        { regex: new RegExp( "(" + es300.operators.map( operator => escapeSpecialCharacters( operator ) ).join( "|" ) + ")" ), token: "operator" },
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
        lineComment: "//",
        closeBrackets: { pairs: "()[]{}''\"\"", closeBefore: ")]}'\";", explode: "[]{}()" }
    }
} )

// Utils 🛠

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
