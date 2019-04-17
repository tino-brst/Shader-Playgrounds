import CodeMirror from "../../lib/codemirror"
import fuzzysort from "fuzzysort"

interface Completion {
    name: string
    extraInfo?: string
    type?: CompletionType
    docs?: string
}

enum CompletionType {
    LocalIdentifier = "local-identifier",
    Type = "type",
    Preprocessor = "preprocessor",
    Macro = "macro",
    StorageQualifier = "storage-qualifier",
    ParameterQualifier = "parameter-qualifier",
    PrecisionQualifier = "precision-qualifier",
    InvarianceQualifier = "invariance-qualifier",
    Variable = "variable",
    Constant = "constant",
    Function = "function",
    Selection = "selection",
    Iteration = "iteration",
    VertexAttribute = "vertex-attribute",
    Uniform = "uniform"
}

const predefinedCompletions: Completion[] = [
    // Types
    { name: "void",         type: CompletionType.Type, docs: "Data type used when the parameter list of a function is empty and when a function does not return a value." },
    { name: "bool",         type: CompletionType.Type, docs: "Data type used for boolean values (true or false)." },
    { name: "int",          type: CompletionType.Type, docs: "Data type used for integer values." },
    { name: "float",        type: CompletionType.Type, docs: "Data type used for floating point (scalar) values." },
    { name: "vec2",         type: CompletionType.Type, docs: "Data type used for floating point vectors with two components." },
    { name: "vec3",         type: CompletionType.Type, docs: "Data type used for floating point vectors with three components." },
    { name: "vec4",         type: CompletionType.Type, docs: "Data type used for floating point vectors with four components." },
    { name: "bvec2",        type: CompletionType.Type, docs: "Data type used for boolean vectors with two components." },
    { name: "bvec3",        type: CompletionType.Type, docs: "Data type used for boolean vectors with three components." },
    { name: "bvec4",        type: CompletionType.Type, docs: "Data type used for boolean vectors with four components." },
    { name: "ivec2",        type: CompletionType.Type, docs: "Data type used for integer vectors with two components." },
    { name: "ivec3",        type: CompletionType.Type, docs: "Data type used for integer vectors with three components." },
    { name: "ivec4",        type: CompletionType.Type, docs: "Data type used for integer vectors with four components." },
    { name: "mat2",         type: CompletionType.Type, docs: "Data type used for 2×2 floating point matrices (in column major order)." },
    { name: "mat3",         type: CompletionType.Type, docs: "Data type used for 3×3 floating point matrices (in column major order)." },
    { name: "mat4",         type: CompletionType.Type, docs: "Data type used for 4×4 floating point matrices (in column major order)." },
    { name: "sampler2D",    type: CompletionType.Type, docs: "Data type used to provide access to a 2D texture. It's a reference to data that has been loaded to a texture unit." },
    { name: "samplerCube",  type: CompletionType.Type, docs: "Data type used to provide access to a cubemap texture. It's a reference to data that has been loaded to a texture unit." },
    // Storage Qualifiers
    { name: "const",     type: CompletionType.StorageQualifier, docs: "Declares a compile-time constant or a read-only function parameter." },
    { name: "attribute", type: CompletionType.StorageQualifier, docs: "Declares a variable shared between the WebGL environment and the vertex shader. Attributes are used to specify per-vertex data." },
    { name: "uniform",   type: CompletionType.StorageQualifier, docs: "Declares a variable shared between the WebGL environment and the shaders. Uniforms are used to specify properties of the object being rendered." },
    { name: "varying",   type: CompletionType.StorageQualifier, docs: "Declares a variable shared between the vertex shader and the fragment shader." },
    // Parameter Qualifiers
    { name: "in",    type: CompletionType.ParameterQualifier, docs: "Marks a function parameter as read-only (default behaviour)." },
    { name: "out",   type: CompletionType.ParameterQualifier, docs: "Marks a function parameter as write-only. The value can be modified by the function and the changes are preserved after the function exits." },
    { name: "inout", type: CompletionType.ParameterQualifier, docs: "Marks a function parameter as read-write. The value can be modified by the function and the changes are preserved after the function exits." },
    // Precision Qualifiers
    { name: "precision", type: CompletionType.PrecisionQualifier },
    { name: "highp",     type: CompletionType.PrecisionQualifier },
    { name: "mediump",   type: CompletionType.PrecisionQualifier },
    { name: "lowp",      type: CompletionType.PrecisionQualifier },
    // Invariance Qualifier
    { name: "invariant", type: CompletionType.InvarianceQualifier },
    // Variables
    { name: "gl_Position",    extraInfo: ": vec4",  type: CompletionType.Variable, docs: "Transformed vertex position. Vertex shader only." },
    { name: "gl_PointSize",   extraInfo: ": float", type: CompletionType.Variable, docs: "Point size of the vertex (radius in pixels, drawn as quad). Only taken into account if the rendered primitives are points. Vertex shader only." },
    { name: "gl_FragCoord",   extraInfo: ": vec4",  type: CompletionType.Variable, docs: "Fragment position in window coordinates (read-only). Fragment shader only." },
    { name: "gl_FrontFacing", extraInfo: ": bool",  type: CompletionType.Variable, docs: "Tells if the fragment belongs to a front-facing primitive (read-only). Fragment shader only." },
    { name: "gl_PointCoord",  extraInfo: ": vec2",  type: CompletionType.Variable, docs: "Fragment position within a point (read-only). Fragment shader only." },
    { name: "gl_FragColor",   extraInfo: ": vec4",  type: CompletionType.Variable, docs: "Color of the fragment (in the RGBA color space). Fragment shader only." },
    { name: "gl_FragData",    extraInfo: ": vec4",  type: CompletionType.Variable },
    // Constants
    { name: "gl_MaxVertexAttribs",             extraInfo: ": int", type: CompletionType.Constant },
    { name: "gl_MaxVertexUniformVectors",      extraInfo: ": int", type: CompletionType.Constant },
    { name: "gl_MaxVaryingVectors",            extraInfo: ": int", type: CompletionType.Constant },
    { name: "gl_MaxVertexTextureImageUnits",   extraInfo: ": int", type: CompletionType.Constant },
    { name: "gl_MaxCombinedTextureImageUnits", extraInfo: ": int", type: CompletionType.Constant },
    { name: "gl_MaxTextureImageUnits",         extraInfo: ": int", type: CompletionType.Constant },
    { name: "gl_MaxFragmentUniformVectors",    extraInfo: ": int", type: CompletionType.Constant },
    { name: "gl_MaxDrawBuffers",               extraInfo: ": int", type: CompletionType.Constant },
    { name: "gl_DepthRange",                   extraInfo: ": gl_DepthRangeParameters", type: CompletionType.Constant },
    // Functions - Entry Point
    { name: "main", extraInfo: "(void): void", type: CompletionType.Function, docs: "Entry point." },
    // Functions - Angle & Trigonometry Functions
    { name: "radians", extraInfo: "(degrees: T): T",    type: CompletionType.Function, docs: "Converts degrees to radians.\n T = float | vec" },
    { name: "degrees", extraInfo: "(radians: T): T",    type: CompletionType.Function, docs: "Converts radians to degrees.\n T = float | vec" },
    { name: "sin",     extraInfo: "(angle: T): T",      type: CompletionType.Function, docs: "Sine of the angle (in radians).\n T = float | vec" },
    { name: "cos",     extraInfo: "(angle: T): T",      type: CompletionType.Function, docs: "Cosine of the angle (in radians).\n T = float | vec" },
    { name: "tan",     extraInfo: "(angle: T): T",      type: CompletionType.Function, docs: "Tangent of the angle (in radians).\n T = float | vec" },
    { name: "asin",    extraInfo: "(x: T): T",          type: CompletionType.Function, docs: "Arcsine (in radians) of x.\n T = float | vec" },
    { name: "acos",    extraInfo: "(x: T): T",          type: CompletionType.Function, docs: "Arccosine (in radians) of x.\n T = float | vec" },
    { name: "atan",    extraInfo: "(y_over_x: T): T",   type: CompletionType.Function, docs: "Arctangent (in radians) of y_over_x.\n T = float | vec" },
    { name: "atan",    extraInfo: "(y: T, x: T): T",    type: CompletionType.Function, docs: "For a point with Cartesian coordinates (x, y), returns the angle θ (in radians) of the same point with polar coordinates (r, θ).\n T = float | vec" },
    // Functions - Exponential
    { name: "pow",         extraInfo: "(x: T, y: T): T", type: CompletionType.Function, docs: "x raised to the power of y (x^y).\n T = float | vec" },
    { name: "exp",         extraInfo: "(x: T): T",       type: CompletionType.Function, docs: "The constant e raised to the power of x.\n T = float | vec" },
    { name: "log",         extraInfo: "(x: T): T",       type: CompletionType.Function, docs: "The power to which the constant e has to be raised to produce x.\n T = float | vec" },
    { name: "exp2",        extraInfo: "(x: T): T",       type: CompletionType.Function, docs: "2 raised to the power of x.\n T = float | vec" },
    { name: "log2",        extraInfo: "(x: T): T",       type: CompletionType.Function, docs: "The power to which 2 has to be raised to produce x.\n T = float | vec" },
    { name: "sqrt",        extraInfo: "(x: T): T",       type: CompletionType.Function, docs: "The square root of x.\n T = float | vec" },
    { name: "inversesqrt", extraInfo: "(x: T): T",       type: CompletionType.Function, docs: "The inverse square root of x.\n T = float | vec" },
    // Functions - Common
    { name: "abs",        extraInfo: "(x: T): T", type: CompletionType.Function, docs: "The absolute value of x.\n T = float | vec" },
    { name: "sign",       extraInfo: "(x: T): T", type: CompletionType.Function, docs: "Returns 1 when x is positive, 0 when x is zero and -1 when x is negative.\n T = float | vec" },
    { name: "floor",      extraInfo: "(x: T): T", type: CompletionType.Function, docs: "The largest integer number that is smaller or equal to x.\n T = float | vec" },
    { name: "ceil",       extraInfo: "(x: T): T", type: CompletionType.Function, docs: "The smallest number that is larger or equal to x.\n T = float | vec" },
    { name: "fract",      extraInfo: "(x: T): T", type: CompletionType.Function, docs: "The fractional part of x, i.e. x minus floor(x).\n T = float | vec" },
    { name: "mod",        extraInfo: "(x: T, y: T): T",     type: CompletionType.Function, docs: "The remainder after the division of x by y.\n T = float | vec" },
    { name: "mod",        extraInfo: "(x: T, y: float): T", type: CompletionType.Function, docs: "The remainder after the division of x by y.\n T = float | vec" },
    { name: "min",        extraInfo: "(x: T, y: T): T",     type: CompletionType.Function, docs: "The smaller of the two arguments.\n T = float | vec" },
    { name: "min",        extraInfo: "(x: T, y: float): T", type: CompletionType.Function, docs: "The smaller of the two arguments.\n T = float | vec" },
    { name: "max",        extraInfo: "(x: T, y: T): T",     type: CompletionType.Function, docs: "The larger of the two arguments.\n T = float | vec" },
    { name: "max",        extraInfo: "(x: T, y: float): T", type: CompletionType.Function, docs: "The larger of the two arguments.\n T = float | vec" },
    { name: "clamp",      extraInfo: "(x: T, minValue: T, maxValue: T): T",         type: CompletionType.Function, docs: "Returns x if minValue < x < maxValue. If x ≤ minValue, the minValue is returned. If x ≥ maxValue, the maxValue is returned.\n T = float | vec" },
    { name: "clamp",      extraInfo: "(x: T, minValue: float, maxValue: float): T", type: CompletionType.Function, docs: "Returns x if minValue < x < maxValue. If x ≤ minValue, the minValue is returned. If x ≥ maxValue, the maxValue is returned.\n T = float | vec" },
    { name: "mix",        extraInfo: "(start: T, end: T, weight: T): T",     type: CompletionType.Function, docs: "Linear interpolation between the start and the end using the weight to fall between them. Computed as start×(1-weight)+end×weight.\n T = float | vec" },
    { name: "mix",        extraInfo: "(start: T, end: T, weight: float): T", type: CompletionType.Function, docs: "Linear interpolation between the start and the end using the weight to fall between them. Computed as start×(1-weight)+end×weight.\n T = float | vec" },
    { name: "step",       extraInfo: "(edge: T, x: T): T",     type: CompletionType.Function, docs: "Returns 0 if x is smaller than the edge, and 1 otherwise.\n T = float | vec" },
    { name: "step",       extraInfo: "(edge: float, x: T): T", type: CompletionType.Function, docs: "Returns 0 if x is smaller than the edge, and 1 otherwise.\n T = float | vec" },
    { name: "smoothstep", extraInfo: "(firstEdge: T, secondEdge, x: T): T",         type: CompletionType.Function, docs: "Returns 0 if x is smaller than the firstEdge and 1 if x is larger than the secondEdge. Otherwise the return value is interpolated between 0 and 1 using Hermite polynomials.\n T = float | vec" },
    { name: "smoothstep", extraInfo: "(firstEdge: float, secondEdge, float: T): T", type: CompletionType.Function, docs: "Returns 0 if x is smaller than the firstEdge and 1 if x is larger than the secondEdge. Otherwise the return value is interpolated between 0 and 1 using Hermite polynomials.\n T = float | vec" },
    // Functions - Geometric
    { name: "length",      extraInfo: "(x: T): float",                              type: CompletionType.Function, docs: "Length of the vector defined by the Euclidean norm, i.e. the square root of the sum of the squared components.\n T = float | vec" },
    { name: "distance",    extraInfo: "(a: T, b: T): float",                        type: CompletionType.Function, docs: "Distance between points a and b.\n T = float | vec" },
    { name: "dot",         extraInfo: "(x: T, y: T): float",                        type: CompletionType.Function, docs: "Dot product of x and y, i.e. the sum of the component-wise products.\n T = float | vec" },
    { name: "cross",       extraInfo: "(x: vec3, y: vec3): vec3",                   type: CompletionType.Function, docs: "Cross product of x and y." },
    { name: "normalize",   extraInfo: "(x: T): T",                                  type: CompletionType.Function, docs: "Returns a unit vector parallel to x, i.e. x divided by its length.\n T = float | vec" },
    { name: "faceforward", extraInfo: "(normal: T, incident: T, refNormal: T ): T", type: CompletionType.Function, docs: "Returns the normal if refNormal•incident < 0, otherwise returns the normal flipped (-normal).\n T = float | vec" },
    { name: "reflect",     extraInfo: "(incident: T, normal: T): T",                type: CompletionType.Function, docs: "Returns a reflection vector given an incident vector and a surface normal. The normal vector should be normalized.\n T = float | vec" },
    { name: "refract",     extraInfo: "(incident: T, normal: T, index: float): T",  type: CompletionType.Function, docs: "Returns a refraction vector given an incident vector, a surface normal, and a refraction index. The incident and normal vectors should be normalized.\n T = float | vec" },
    // Functions - Matrix
    { name: "matrixCompMult", extraInfo: "(x: mat, y: mat): mat", type: CompletionType.Function, docs: "Multiplies x by y component-wise." },
    // Functions - Vector Relational
    { name: "lessThan",         extraInfo: "(x: T, y: T): bvec", type: CompletionType.Function, docs: "Component-wise comparison x < y.\n T = vec | ivec" },
    { name: "lessThanEqual",    extraInfo: "(x: T, y: T): bvec", type: CompletionType.Function, docs: "Component-wise comparison x ≤ y.\n T = vec | ivec" },
    { name: "greaterThan",      extraInfo: "(x: T, y: T): bvec", type: CompletionType.Function, docs: "Component-wise comparison x > y.\n T = vec | ivec" },
    { name: "greaterThanEqual", extraInfo: "(x: T, y: T): bvec", type: CompletionType.Function, docs: "Component-wise comparison x ≥ y.\n T = vec | ivec" },
    { name: "equal",            extraInfo: "(x: T, y: T): bvec", type: CompletionType.Function, docs: "Component-wise comparison x = y.\n T = vec | ivec | bvec" },
    { name: "notEqual",         extraInfo: "(x: T, y: T): bvec", type: CompletionType.Function, docs: "Component-wise comparison x ≠ y.\n T = vec | ivec | bvec" },
    { name: "any",              extraInfo: "(x: bvec): bool", type: CompletionType.Function, docs: "True if any component of x is true." },
    { name: "all",              extraInfo: "(x: bvec): bool", type: CompletionType.Function, docs: "True if all components of x are true." },
    { name: "not",              extraInfo: "(x: bvec): bvec", type: CompletionType.Function, docs: "Logical complement of x." },
    // Functions - Texture Lookup
    { name: "texture2D",   extraInfo: "(sampler: sampler2D, coordinates: vec2): vec4",                type: CompletionType.Function, docs: "Returns the value of the texture at the given coordinates." },
    { name: "texture2D",   extraInfo: "(sampler: sampler2D, coordinates: vec2, bias: float): vec4",   type: CompletionType.Function, docs: "Returns the value of the texture at the given coordinates. The bias is included in the level-of-detail computation that is used to choose mipmap(s) from which to sample." },
    { name: "textureCube", extraInfo: "(sampler: samplerCube, coordinates: vec3): vec4",              type: CompletionType.Function, docs: "Returns the value of the texture at the given coordinates." },
    { name: "textureCube", extraInfo: "(sampler: samplerCube, coordinates: vec3, bias: float): vec4", type: CompletionType.Function, docs: "Returns the value of the texture at the given coordinates. The bias is included in the level-of-detail computation that is used to choose mipmap(s) from which to sample." },
    // Iteration
    { name: "for",      type: CompletionType.Iteration },
    { name: "do",       type: CompletionType.Iteration },
    { name: "while",    type: CompletionType.Iteration },
    { name: "break",    type: CompletionType.Iteration, docs: "Aborts the entire loop. All statements in the body after the break statement are ignored and the loop is exited without executing any further iteration." },
    { name: "continue", type: CompletionType.Iteration, docs: "Aborts a single pass of a loop. All statements in the body after the continue statement are ignored and the next iteration of the loop is executed immediately." },
    // Selection
    { name: "if",   type: CompletionType.Selection },
    { name: "else", type: CompletionType.Selection },
    // Preprocessor
    { name: "#define",    type: CompletionType.Preprocessor },
    { name: "#undef",     type: CompletionType.Preprocessor },
    { name: "#if",        type: CompletionType.Preprocessor },
    { name: "#ifdef",     type: CompletionType.Preprocessor },
    { name: "#ifndef",    type: CompletionType.Preprocessor },
    { name: "#else",      type: CompletionType.Preprocessor },
    { name: "#elif",      type: CompletionType.Preprocessor },
    { name: "#endif",     type: CompletionType.Preprocessor },
    { name: "#error",     type: CompletionType.Preprocessor },
    { name: "#pragma",    type: CompletionType.Preprocessor },
    { name: "#extension", type: CompletionType.Preprocessor },
    { name: "#version",   type: CompletionType.Preprocessor },
    { name: "#line",      type: CompletionType.Preprocessor },
    // Macros
    { name: "__LINE__",                   type: CompletionType.Macro },
    { name: "__VERSION__",                type: CompletionType.Macro },
    { name: "GL_ES",                      type: CompletionType.Macro },
    { name: "GL_FRAGMENT_PRECISION_HIGH", type: CompletionType.Macro },
    // Others
    { name: "gl_DepthRangeParameters" },
    { name: "struct", docs: "Declares a custom data structure based on standard data types." },
    { name: "return" },
    { name: "discard", docs: "Exits the fragment shader immediately and signals the WebGL pipeline that the fragment should not be drawn." },
    { name: "true" },
    { name: "false" }
]
const predefinedVariables: Completion[] = [
    // Available vertex attributes
    { name: "vertexPosition",           extraInfo: ": vec3", type: CompletionType.VertexAttribute },
    { name: "vertexNormal",             extraInfo: ": vec3", type: CompletionType.VertexAttribute },
    { name: "vertexTextureCoordinates", extraInfo: ": vec2", type: CompletionType.VertexAttribute },
    // Available uniforms
    { name: "modelMatrix",      extraInfo: ": mat3", type: CompletionType.Uniform },
    { name: "modelViewMatrix",  extraInfo: ": mat3", type: CompletionType.Uniform },
    { name: "viewMatrix",       extraInfo: ": mat3", type: CompletionType.Uniform },
    { name: "projectionMatrix", extraInfo: ": mat3", type: CompletionType.Uniform },
    { name: "normalMatrix",     extraInfo: ": mat3", type: CompletionType.Uniform }
]
const predefined = predefinedVariables.concat( predefinedCompletions )

const predefinedVariableNames = predefinedVariables.map( variable => variable.name )

function render( element: HTMLLIElement, data: CodeMirror.Hints, cur: CodeMirror.Hint ) {
    const typeIcon = document.createElement( "span" )
    typeIcon.classList.add( "icon" )
    element.appendChild( typeIcon )

    const textSpan = document.createElement( "span" )
    textSpan.classList.add( "display-text" )
    textSpan.innerHTML = highlight( cur.displayText || cur.text, cur.indexes || [] )
    element.appendChild( textSpan )
}

function highlight( text: string, indexes: number[] = [], openingMark: string = "<b>", closingMark: string = "</b>" ) {
    var highlighted = ""
    var matchesIndex = 0
    var opened = false
    var textLength = text.length
    var matchesBest = indexes

    for ( var i = 0; i < textLength; ++ i ) {
        var char = text[i]

        if ( matchesBest[matchesIndex] === i ) {
            ++ matchesIndex

            if ( ! opened ) {
                opened = true
                highlighted += openingMark
            }

            if ( matchesIndex === matchesBest.length ) {
                highlighted += char + closingMark + text.substr( i + 1 )
                break
            }
        } else {
            if ( opened ) {
                opened = false
                highlighted += closingMark
            }
        }
        highlighted += char
    }

    return highlighted
}

function getLocalIdentifiers( editor: CodeMirror.Editor ): string[] {
    const identifiers: Set<string> = new Set()

    const document   = editor.getDoc()
    const firstLine  = document.firstLine()
    const lastLine   = document.lastLine()

    // @ts-ignore
    const cursor = editor.getCursor() as CodeMirror.Position

    for ( let line = firstLine; line <= lastLine; line ++ ) {
        const tokens = editor.getLineTokens( line )

        if ( line !== cursor.line ) {
            // cuando la linea no corresponde a la del cursor agrego todos los identificadores
            for ( let token of tokens ) {
                if ( token.type === "identifier" && ! predefinedVariableNames.includes( token.string ) ) identifiers.add( token.string )
            }
        } else {
            // cuando coincide con la del cursor me fijo de no estar agregando al token que se esta tipeando
            for ( let token of tokens ) {
                if ( ! ( token.start <= cursor.ch && cursor.ch <= token.end ) && token.type === "identifier" ) identifiers.add( token.string )
            }
        }
    }

    return Array.from( identifiers )
}

CodeMirror.registerHelper( "hint", "glsl", ( editor: CodeMirror.Editor, options: any ) => {
    // @ts-ignore
    const cursor = editor.getCursor()
    const tokenAtCursor = editor.getTokenAt( cursor )
    const cursorFollowsWhitespace = tokenAtCursor.string.trimLeft().length === 0

    const start = cursorFollowsWhitespace ? cursor.ch : tokenAtCursor.start // si no hay caracteres previos al activar el autocomplete lo alineo con el cursor ()
    const end   = tokenAtCursor.end > cursor.ch ? tokenAtCursor.end : cursor.ch

    const localIdentifiers: Completion[] = getLocalIdentifiers( editor ).map( identifier => ( { name: identifier, type: CompletionType.LocalIdentifier } ) )

    // en caso de estar tipeando un atributo, solo paso la lista de identificadores
    const completions = tokenAtCursor.type === "attribute" || tokenAtCursor.string === "." ? localIdentifiers : predefined.concat( localIdentifiers )
    const results = fuzzysort.go<Completion>( tokenAtCursor.string, completions, { key: "name" } )

    let list: CodeMirror.Hint[]

    if ( options.trigger === undefined && results.length === 0 ) {
        list = completions.map( ( completion ): CodeMirror.Hint => ( {
            text: completion.name,
            displayText: completion.name + ( completion.extraInfo === undefined ? "" : completion.extraInfo ),
            className: completion.type,
            render,
            docs: completion.docs
        } ) )
    } else {
        list = results.map( ( result ): CodeMirror.Hint => ( {
            text: result.obj.name,
            displayText: result.obj.name + ( result.obj.extraInfo === undefined ? "" : result.obj.extraInfo ),
            className: result.obj.type,
            render,
            indexes: result.indexes,
            docs: result.obj.docs
        } ) )
    }

    const from = CodeMirror.Pos( cursor.line, start )
    const to   = CodeMirror.Pos( cursor.line, end )

    return { list, from, to }
} )
