type Name = string
type NameWithType = string
type NameWithParametersAndType = string
type Docs = string
type CodeSnippet = string

/* 📝 Formats
 • Name: used as-is
 • NameWithType: "name: type"
 • NameWithParametersAndType: "name(param1: type1 [, ...[, paramN: typeN]]): return-type"
 • Docs: used as-is
 • CodeSnippet: double mustaches mark a {{placeholder}} in the snippet
 */

type Keywords = Array<[ Name, Docs? ]>
type Variables = Array<[ NameWithType, Docs? ]>
type Functions = Array<[ NameWithParametersAndType, Docs? ]>
type Snippets = Array<[ Name, CodeSnippet, Docs? ]>

const snippets: Snippets = [
  // Miscellaneous
  [ 'main', 'void main () {\n{{code}}\n}', 'Entry point.' ],
  [ 'struct', 'struct {{name}} {\n{{components}}\n}', 'Declares a custom data structure based on standard data types.' ],
  [ 'function', '{{return type}} {{name}} ({{parameters}}) {\n{{code}}\n}', 'Encapsulates logic and behaviour.' ],
  // Iteration
  [ 'for', 'for ({{int i = 0}}; {{i < 42}}; {{i++}}) {\n{{code}}\n}', 'Repeats code a given number of times.' ],
  [ 'while', 'while ({{condition}}) {\n{{code}}\n}', 'Repeats code while the condition is true.' ],
  [ 'do-while', 'do {\n{{code}}\n} while ({{condition}});', 'Runs code once and then repeats while the condition is true.' ],
  // Flow
  [ 'if', 'if ({{condition}}) {\n{{code}}\n}', 'Changes which path your code takes.' ],
  [ 'if-else', 'if ({{condition}}) {\n{{code}}\n} else {\n{{code}}\n}', 'Changes which path your code takes.' ]
]
const predefinedAttributes: Variables = [
  [ 'vertexPosition: vec3' ],
  [ 'vertexNormal: vec3' ],
  [ 'vertexTextureCoordinates: vec2' ]
]
const predefinedUniforms: Variables = [
  [ 'modelMatrix: mat4' ],
  [ 'viewMatrix: mat4' ],
  [ 'modelViewMatrix: mat4' ],
  [ 'projectionMatrix: mat4' ],
  [ 'normalMatrix: mat4', 'Inverse transpose of the modelViewMatrix.' ]
]

const glslES100 = {
  types: [
    [ 'void', 'Data type used when the parameter list of a function is empty or when a function does not return a value.' ],
    [ 'bool', 'Data type used for boolean values (true or false).' ],
    [ 'int', 'Data type used for integer values.' ],
    [ 'float', 'Data type used for floating point (scalar) values.' ],
    [ 'vec2', 'Data type used for floating point vectors with two components.' ],
    [ 'vec3', 'Data type used for floating point vectors with three components.' ],
    [ 'vec4', 'Data type used for floating point vectors with four components.' ],
    [ 'bvec2', 'Data type used for boolean vectors with two components.' ],
    [ 'bvec3', 'Data type used for boolean vectors with three components.' ],
    [ 'bvec4', 'Data type used for boolean vectors with four components.' ],
    [ 'ivec2', 'Data type used for integer vectors with two components.' ],
    [ 'ivec3', 'Data type used for integer vectors with three components.' ],
    [ 'ivec4', 'Data type used for integer vectors with four components.' ],
    [ 'mat2', 'Data type used for 2×2 floating point matrices (in column major order).' ],
    [ 'mat3', 'Data type used for 3×3 floating point matrices (in column major order).' ],
    [ 'mat4', 'Data type used for 4×4 floating point matrices (in column major order).' ],
    [ 'sampler2D', "Data type used to provide access to a 2D texture. It's a reference to data that has been loaded to a texture unit." ],
    [ 'samplerCube', "Data type used to provide access to a cubemap texture. It's a reference to data that has been loaded to a texture unit." ]
  ] as Keywords,
  storageQualifiers: [
    [ 'const', 'Declares a compile-time constant or a read-only function parameter.' ],
    [ 'attribute', 'Declares a variable shared between the WebGL environment and the vertex shader. Attributes are used to specify per-vertex data.' ],
    [ 'uniform', 'Declares a variable shared between the WebGL environment and the shaders. Uniform variables are read-only and have the same value among all processed vertices.' ],
    [ 'varying', 'Declares a variable shared between the vertex shader and the fragment shader.' ]
  ] as Keywords,
  parameterQualifiers: [
    [ 'in', 'Marks a function parameter as read-only (default behaviour).' ],
    [ 'out', 'Marks a function parameter as write-only. The value can be modified by the function and the changes are preserved after the function exits.' ],
    [ 'inout', 'Marks a function parameter as read-write. The value can be modified by the function and the changes are preserved after the function exits.' ]
  ] as Keywords,
  precisionQualifiers: [
    [ 'precision' ],
    [ 'highp' ],
    [ 'mediump' ],
    [ 'lowp' ]
  ] as Keywords,
  invarianceQualifiers: [
    [ 'invariant' ]
  ] as Keywords,
  preprocessor: [
    [ '#define' ],
    [ '#undef' ],
    [ '#if' ],
    [ '#ifdef' ],
    [ '#ifndef' ],
    [ '#else' ],
    [ '#elif' ],
    [ '#endif' ],
    [ '#error' ],
    [ '#pragma' ],
    [ '#extension' ],
    [ '#version' ],
    [ '#line' ]
  ] as Keywords,
  macros: [
    [ '__LINE__' ],
    [ '__VERSION__' ],
    [ 'GL_ES' ],
    [ 'GL_FRAGMENT_PRECISION_HIGH' ]
  ] as Keywords,
  others: [
    [ 'gl_DepthRangeParameters' ],
    [ 'return' ],
    [ 'break', 'Aborts the entire loop. All statements in the body after the break statement are ignored and the loop is exited without executing any further iteration.' ],
    [ 'continue', 'Aborts a single pass of a loop. All statements in the body after the continue statement are ignored and the next iteration of the loop is executed immediately.' ],
    [ 'discard', 'Exits the fragment shader immediately and signals the WebGL pipeline that the fragment should not be drawn.' ]
  ] as Keywords,
  variables: [
    [ 'gl_Position: vec4', 'Transformed vertex position in clip coordinates. Vertex shader only.' ],
    [ 'gl_PointSize: float', 'Point size of the vertex (radius in pixels, drawn as quad). Only taken into account if the rendered primitives are points. Vertex shader only.' ],
    [ 'gl_FragCoord: vec4', 'Fragment position in window coordinates (read-only). Fragment shader only.' ],
    [ 'gl_FrontFacing: bool', 'Tells if the fragment belongs to a front-facing primitive (read-only). Fragment shader only.' ],
    [ 'gl_PointCoord: vec2', 'Fragment position within a point (read-only). Fragment shader only.' ],
    [ 'gl_FragColor: vec4', 'Color of the fragment (in the RGBA color space). Fragment shader only.' ],
    [ 'gl_FragData: vec4' ]
  ] as Variables,
  constants: [
    [ 'true: bool' ],
    [ 'false: bool' ],
    [ 'gl_MaxVertexAttribs: int' ],
    [ 'gl_MaxVertexUniformVectors: int' ],
    [ 'gl_MaxVaryingVectors: int' ],
    [ 'gl_MaxVertexTextureImageUnits: int' ],
    [ 'gl_MaxCombinedTextureImageUnits: int' ],
    [ 'gl_MaxTextureImageUnits: int' ],
    [ 'gl_MaxFragmentUniformVectors: int' ],
    [ 'gl_MaxDrawBuffers: int' ],
    [ 'gl_DepthRange: gl_DepthRangeParameters' ]
  ] as Variables,
  functions: [
    // Angle & Trigonometry Functions
    [ 'radians(degrees: T): T', 'Converts degrees to radians.\n T ≡ float | vec' ],
    [ 'degrees(radians: T): T', 'Converts radians to degrees.\n T ≡ float | vec' ],
    [ 'sin(angle: T): T', 'Sine of the angle (in radians).\n T ≡ float | vec' ],
    [ 'cos(angle: T): T', 'Cosine of the angle (in radians).\n T ≡ float | vec' ],
    [ 'tan(angle: T): T', 'Tangent of the angle (in radians).\n T ≡ float | vec' ],
    [ 'asin(x: T): T', 'Arcsine (in radians) of x.\n T ≡ float | vec' ],
    [ 'acos(x: T): T', 'Arccosine (in radians) of x.\n T ≡ float | vec' ],
    [ 'atan(y_over_x: T): T', 'Arctangent (in radians) of y_over_x.\n T ≡ float | vec' ],
    [ 'atan(y: T, x: T): T', 'For a point with Cartesian coordinates (x, y), returns the angle θ (in radians) of the same point with polar coordinates (r, θ).\n T ≡ float | vec' ],
    // Exponential
    [ 'pow(x: T, y: T): T', 'x raised to the power of y (x^y).\n T ≡ float | vec' ],
    [ 'exp(x: T): T', 'The constant e raised to the power of x.\n T ≡ float | vec' ],
    [ 'log(x: T): T', 'The power to which the constant e has to be raised to produce x.\n T ≡ float | vec' ],
    [ 'exp2(x: T): T', '2 raised to the power of x.\n T ≡ float | vec' ],
    [ 'log2(x: T): T', 'The power to which 2 has to be raised to produce x.\n T ≡ float | vec' ],
    [ 'sqrt(x: T): T', 'The square root of x.\n T ≡ float | vec' ],
    [ 'inversesqrt(x: T): T', 'The inverse square root of x.\n T ≡ float | vec' ],
    // Common
    [ 'abs(x: T): T', 'The absolute value of x.\n T ≡ float | vec' ],
    [ 'sign(x: T): T', 'Returns 1 when x is positive, 0 when x is zero and -1 when x is negative.\n T ≡ float | vec' ],
    [ 'floor(x: T): T', 'The largest integer number that is smaller or equal to x.\n T ≡ float | vec' ],
    [ 'ceil(x: T): T', 'The smallest number that is larger or equal to x.\n T ≡ float | vec' ],
    [ 'fract(x: T): T', 'The fractional part of x, i.e. x minus floor(x).\n T ≡ float | vec' ],
    [ 'mod(x: T, y: T): T', 'The remainder after the division of x by y.\n T ≡ float | vec' ],
    [ 'mod(x: T, y: float): T', 'The remainder after the division of x by y.\n T ≡ float | vec' ],
    [ 'min(x: T, y: T): T', 'The smaller of the two arguments.\n T ≡ float | vec' ],
    [ 'min(x: T, y: float): T', 'The smaller of the two arguments.\n T ≡ float | vec' ],
    [ 'max(x: T, y: T): T', 'The larger of the two arguments.\n T ≡ float | vec' ],
    [ 'max(x: T, y: float): T', 'The larger of the two arguments.\n T ≡ float | vec' ],
    [ 'clamp(x: T, minValue: T, maxValue: T): T', 'Returns x if minValue < x < maxValue. If x ≤ minValue, the minValue is returned. If x ≥ maxValue, the maxValue is returned.\n T ≡ float | vec' ],
    [ 'clamp(x: T, minValue: float, maxValue: float): T', 'Returns x if minValue < x < maxValue. If x ≤ minValue, the minValue is returned. If x ≥ maxValue, the maxValue is returned.\n T ≡ float | vec' ],
    [ 'mix(start: T, end: T, weight: T): T', 'Linear interpolation between the start and the end using the weight to fall between them. Computed as start×(1-weight)+end×weight.\n T ≡ float | vec' ],
    [ 'mix(start: T, end: T, weight: float): T', 'Linear interpolation between the start and the end using the weight to fall between them. Computed as start×(1-weight)+end×weight.\n T ≡ float | vec' ],
    [ 'step(edge: T, x: T): T', 'Returns 0 if x is smaller than the edge, and 1 otherwise.\n T ≡ float | vec' ],
    [ 'step(edge: float, x: T): T', 'Returns 0 if x is smaller than the edge, and 1 otherwise.\n T ≡ float | vec' ],
    [ 'smoothstep(firstEdge: T, secondEdge: T, x: T): T', 'Returns 0 if x is smaller than the firstEdge and 1 if x is larger than the secondEdge. Otherwise the return value is interpolated between 0 and 1 using Hermite polynomials.\n T ≡ float | vec' ],
    [ 'smoothstep(firstEdge: float, secondEdge: float, x: T): T', 'Returns 0 if x is smaller than the firstEdge and 1 if x is larger than the secondEdge. Otherwise the return value is interpolated between 0 and 1 using Hermite polynomials.\n T ≡ float | vec' ],
    // Geometric
    [ 'length(x: T): float', 'Length of the vector defined by the Euclidean norm, i.e. the square root of the sum of the squared components.\n T ≡ float | vec' ],
    [ 'distance(a: T, b: T): float', 'Distance between points a and b.\n T ≡ float | vec' ],
    [ 'dot(x: T, y: T): float', 'Dot product of x and y, i.e. the sum of the component-wise products.\n T ≡ float | vec' ],
    [ 'cross(x: vec3, y: vec3): vec3', 'Cross product of x and y.' ],
    [ 'normalize(x: T): T', 'Vector x normalized to length 1, i.e. x divided by its length.\n T ≡ float | vec' ],
    [ 'faceforward(normal: T, incident: T, refNormal: T ): T', 'Returns the normal if refNormal•incident < 0, otherwise returns the normal flipped (-normal).\n T ≡ float | vec' ],
    [ 'reflect(incident: T, normal: T): T', 'Returns a reflection vector given an incident vector and a surface normal. The normal vector should be normalized.\n T ≡ float | vec' ],
    [ 'refract(incident: T, normal: T, index: float): T', 'Returns a refraction vector given an incident vector, a surface normal, and a refraction index. The incident and normal vectors should be normalized.\n T ≡ float | vec' ],
    // Matrix
    [ 'matrixCompMult(x: mat, y: mat): mat', 'Multiplies x by y component-wise.' ],
    // Vector Relational
    [ 'lessThan(x: T, y: T): bvec', 'Component-wise comparison x < y.\n T ≡ vec | ivec' ],
    [ 'lessThanEqual(x: T, y: T): bvec', 'Component-wise comparison x ≤ y.\n T ≡ vec | ivec' ],
    [ 'greaterThan(x: T, y: T): bvec', 'Component-wise comparison x > y.\n T ≡ vec | ivec' ],
    [ 'greaterThanEqual(x: T, y: T): bvec', 'Component-wise comparison x ≥ y.\n T ≡ vec | ivec' ],
    [ 'equal(x: T, y: T): bvec', 'Component-wise comparison x = y.\n T ≡ vec | ivec | bvec' ],
    [ 'notEqual(x: T, y: T): bvec', 'Component-wise comparison x ≠ y.\n T ≡ vec | ivec | bvec' ],
    [ 'any(x: bvec): bool', 'True if any component of x is true.' ],
    [ 'all(x: bvec): bool', 'True if all components of x are true.' ],
    [ 'not(x: bvec): bvec', 'Logical complement of x.' ],
    // Texture Lookup
    [ 'texture2D(sampler: sampler2D, coordinates: vec2): vec4', 'Returns the value of the texture at the given coordinates.' ],
    [ 'texture2D(sampler: sampler2D, coordinates: vec2, bias: float): vec4', 'Returns the value of the texture at the given coordinates. The bias is included in the level-of-detail computation that is used to choose mipmap(s) from which to sample.' ],
    [ 'textureCube(sampler: samplerCube, coordinates: vec3): vec4', 'Returns the value of the texture at the given coordinates.' ],
    [ 'textureCube(sampler: samplerCube, coordinates: vec3, bias: float): vec4', 'Returns the value of the texture at the given coordinates. The bias is included in the level-of-detail computation that is used to choose mipmap(s) from which to sample.' ]
  ] as Functions
}
const glslES300 = {
  types: [
    [ 'void', 'Data type used when the parameter list of a function is empty or when a function does not return a value.' ],
    [ 'bool', 'Data type used for boolean values (true or false).' ],
    [ 'int', 'Data type used for integer values.' ],
    [ 'uint', 'Data type used for unsigned integer values.' ],
    [ 'float', 'Data type used for floating point (scalar) values.' ],
    [ 'vec2', 'Data type used for floating point vectors with two components.' ],
    [ 'vec3', 'Data type used for floating point vectors with three components.' ],
    [ 'vec4', 'Data type used for floating point vectors with four components.' ],
    [ 'bvec2', 'Data type used for boolean vectors with two components.' ],
    [ 'bvec3', 'Data type used for boolean vectors with three components.' ],
    [ 'bvec4', 'Data type used for boolean vectors with four components.' ],
    [ 'ivec2', 'Data type used for integer vectors with two components.' ],
    [ 'ivec3', 'Data type used for integer vectors with three components.' ],
    [ 'ivec4', 'Data type used for integer vectors with four components.' ],
    [ 'uvec2', 'Data type used for unsigned integer vectors with two components.' ],
    [ 'uvec3', 'Data type used for unsigned integer vectors with three components.' ],
    [ 'uvec4', 'Data type used for unsigned integer vectors with four components.' ],
    [ 'mat2', 'Data type used for 2×2 floating point matrices (in column major order).' ],
    [ 'mat3', 'Data type used for 3×3 floating point matrices (in column major order).' ],
    [ 'mat4', 'Data type used for 4×4 floating point matrices (in column major order).' ],
    [ 'mat2x2', 'Data type used for 2×2 floating point matrices (in column major order).' ],
    [ 'mat2x3', 'Data type used for 2×3 floating point matrices (in column major order).' ],
    [ 'mat2x4', 'Data type used for 2×4 floating point matrices (in column major order).' ],
    [ 'mat3x2', 'Data type used for 3×2 floating point matrices (in column major order).' ],
    [ 'mat3x3', 'Data type used for 3×3 floating point matrices (in column major order).' ],
    [ 'mat3x4', 'Data type used for 3×4 floating point matrices (in column major order).' ],
    [ 'mat4x2', 'Data type used for 4×2 floating point matrices (in column major order).' ],
    [ 'mat4x3', 'Data type used for 4×3 floating point matrices (in column major order).' ],
    [ 'mat4x4', 'Data type used for 4×4 floating point matrices (in column major order).' ],
    [ 'sampler2D', "Data type used to provide access to a 2D texture. It's a reference to data that has been loaded to a texture unit." ],
    [ 'sampler3D', "Data type used to provide access to a 3D texture. It's a reference to data that has been loaded to a texture unit." ],
    [ 'samplerCube', "Data type used to provide access to a cubemap texture. It's a reference to data that has been loaded to a texture unit." ],
    [ 'sampler2DArray', "Data type used to provide access to a 2D array texture. It's a reference to data that has been loaded to a texture unit." ],
    [ 'samplerCubeShadow', "Data type used to provide access to a cubemap depth texture with comparison. It's a reference to data that has been loaded to a texture unit." ],
    [ 'sampler2DShadow', "Data type used to provide access to a 2D depth texture with comparison. It's a reference to data that has been loaded to a texture unit." ],
    [ 'sampler2DArrayShadow', "Data type used to provide access to a 2D array depth texture with comparison. It's a reference to data that has been loaded to a texture unit." ],
    [ 'isampler2D', "Data type used to provide access to an integer 2D texture. It's a reference to data that has been loaded to a texture unit." ],
    [ 'isampler3D', "Data type used to provide access to an integer 3D texture. It's a reference to data that has been loaded to a texture unit." ],
    [ 'isamplerCube', "Data type used to provide access to an integer cubemap texture. It's a reference to data that has been loaded to a texture unit." ],
    [ 'isampler2DArray', "Data type used to provide access to an integer 2D array texture. It's a reference to data that has been loaded to a texture unit." ],
    [ 'usampler2D', "Data type used to provide access to an unsigned integer 2D texture. It's a reference to data that has been loaded to a texture unit." ],
    [ 'usampler3D', "Data type used to provide access to an unsigned integer 3D texture. It's a reference to data that has been loaded to a texture unit." ],
    [ 'usamplerCube', "Data type used to provide access to an unsigned integer cubemap texture. It's a reference to data that has been loaded to a texture unit." ],
    [ 'usampler2DArray', "Data type used to provide access to an unsigned integer 2D array texture. It's a reference to data that has been loaded to a texture unit." ]
  ] as Keywords,
  storageQualifiers: [
    [ 'const', 'Declares a compile-time constant or a read-only function parameter.' ],
    [ 'uniform', 'Declares a variable shared between the WebGL environment and the shaders. Uniform variables are read-only and have the same value among all processed vertices.' ],
    [ 'in', 'Linkage into a shader from a previous stage.' ],
    [ 'out', 'Linkage out of a shader to a subsequent stage.' ]
  ] as Keywords,
  parameterQualifiers: [
    [ 'in', 'Marks a function parameter as read-only (default behaviour).' ],
    [ 'out', 'Marks a function parameter as write-only. The value can be modified by the function and the changes are preserved after the function exits.' ],
    [ 'inout', 'Marks a function parameter as read-write. The value can be modified by the function and the changes are preserved after the function exits.' ]
  ] as Keywords,
  precisionQualifiers: [
    [ 'precision' ],
    [ 'highp' ],
    [ 'mediump' ],
    [ 'lowp' ]
  ] as Keywords,
  interpolationQualifiers: [
    [ 'smooth', 'A variable qualified as smooth will be interpolated in a perspective-correct manner over the primitive being rendered.' ],
    [ 'flat', 'A variable qualified as flat will not be interpolated. Instead, it will have the same value for every fragment within the primitive being rendered, defined by its provoking vertex.' ]
  ] as Keywords,
  invarianceQualifiers: [
    [ 'invariant' ]
  ] as Keywords,
  preprocessor: [
    [ '#define' ],
    [ '#undef' ],
    [ '#if' ],
    [ '#ifdef' ],
    [ '#ifndef' ],
    [ '#else' ],
    [ '#elif' ],
    [ '#endif' ],
    [ '#error' ],
    [ '#pragma' ],
    [ '#extension' ],
    [ '#version' ],
    [ '#line' ]
  ] as Keywords,
  macros: [
    [ '__LINE__' ],
    [ '__FILE__' ],
    [ '__VERSION__' ],
    [ 'GL_ES' ]
  ] as Keywords,
  others: [
    [ 'gl_DepthRangeParameters' ],
    [ 'return' ],
    [ 'break', 'Aborts the entire loop. All statements in the body after the break statement are ignored and the loop is exited without executing any further iteration.' ],
    [ 'continue', 'Aborts a single pass of a loop. All statements in the body after the continue statement are ignored and the next iteration of the loop is executed immediately.' ],
    [ 'discard', 'Exits the fragment shader immediately and signals the WebGL pipeline that the fragment should not be drawn.' ]
  ] as Keywords,
  variables: [
    [ 'gl_VertexID: int', 'Index of the current vertex.' ],
    [ 'gl_InstanceID: int', 'Instance number of the current primitive in an instanced draw command.' ],
    [ 'gl_Position: vec4', 'Transformed vertex position in clip coordinates. Vertex shader only.' ],
    [ 'gl_PointSize: float', 'Point size of the vertex (radius in pixels, drawn as quad). Only taken into account if the rendered primitives are points. Vertex shader only.' ],
    [ 'gl_FragCoord: vec4', 'Fragment position in window coordinates (read-only). Fragment shader only.' ],
    [ 'gl_FrontFacing: bool', 'Tells if the fragment belongs to a front-facing primitive (read-only). Fragment shader only.' ],
    [ 'gl_PointCoord: vec2', 'Fragment position within a point (read-only). Fragment shader only.' ],
    [ 'gl_FragDepth: vec4', 'Establishes a depth value for the current fragment.' ]
  ] as Variables,
  constants: [
    [ 'true: bool' ],
    [ 'false: bool' ],
    [ 'gl_MaxVertexAttribs: int' ],
    [ 'gl_MaxVertexUniformVectors: int' ],
    [ 'gl_MaxVertexOutputVectors: int' ],
    [ 'gl_MaxFragmentInputVectors: int' ],
    [ 'gl_MaxVertexTextureImageUnits: int' ],
    [ 'gl_MaxCombinedTextureImageUnits: int' ],
    [ 'gl_MaxTextureImageUnits: int' ],
    [ 'gl_MaxFragmentUniformVectors: int' ],
    [ 'gl_MaxDrawBuffers: int' ],
    [ 'gl_MinProgramTexelOffset: int' ],
    [ 'gl_MaxProgramTexelOffset: int' ],
    [ 'gl_DepthRange: gl_DepthRangeParameters' ]
  ] as Variables,
  functions: [
    // Angle & Trigonometry Functions
    [ 'radians(degrees: T): T', 'Converts degrees to radians.\n T ≡ float | vec' ],
    [ 'degrees(radians: T): T', 'Converts radians to degrees.\n T ≡ float | vec' ],
    [ 'sin(angle: T): T', 'Sine of the angle (in radians).\n T ≡ float | vec' ],
    [ 'cos(angle: T): T', 'Cosine of the angle (in radians).\n T ≡ float | vec' ],
    [ 'tan(angle: T): T', 'Tangent of the angle (in radians).\n T ≡ float | vec' ],
    [ 'asin(x: T): T', 'Arcsine (in radians) of x.\n T ≡ float | vec' ],
    [ 'acos(x: T): T', 'Arccosine (in radians) of x.\n T ≡ float | vec' ],
    [ 'atan(y_over_x: T): T', 'Arctangent (in radians) of y_over_x.\n T ≡ float | vec' ],
    [ 'atan(y: T, x: T): T', 'For a point with Cartesian coordinates (x, y), returns the angle θ (in radians) of the same point with polar coordinates (r, θ).\n T ≡ float | vec' ],
    [ 'sinh(angle: T): T', 'Hyperbolic sine of the angle (in radians).\n T ≡ float | vec' ],
    [ 'cosh(angle: T): T', 'Hyperbolic cosine of the angle (in radians).\n T ≡ float | vec' ],
    [ 'tanh(angle: T): T', 'Hyperbolic tangent of the angle (in radians).\n T ≡ float | vec' ],
    [ 'asinh(angle: T): T', 'Arc hyperbolic sine of the angle (in radians); inverse of sinh.\n T ≡ float | vec' ],
    [ 'acosh(angle: T): T', 'Arc hyperbolic cosine of the angle (in radians); non-negative inverse of cosh.\n T ≡ float | vec' ],
    [ 'atanh(angle: T): T', 'Arc hyperbolic tangent of the angle (in radians); inverse of tanh.\n T ≡ float | vec' ],
    // Exponential
    [ 'pow(x: T, y: T): T', 'x raised to the power of y (x^y).\n T ≡ float | vec' ],
    [ 'exp(x: T): T', 'The constant e raised to the power of x.\n T ≡ float | vec' ],
    [ 'log(x: T): T', 'The power to which the constant e has to be raised to produce x.\n T ≡ float | vec' ],
    [ 'exp2(x: T): T', '2 raised to the power of x.\n T ≡ float | vec' ],
    [ 'log2(x: T): T', 'The power to which 2 has to be raised to produce x.\n T ≡ float | vec' ],
    [ 'sqrt(x: T): T', 'The square root of x.\n T ≡ float | vec' ],
    [ 'inversesqrt(x: T): T', 'The inverse square root of x.\n T ≡ float | vec' ],
    // Common
    [ 'abs(x: T): T', 'The absolute value of x.\n T ≡ float | int | vec | ivec' ],
    [ 'sign(x: T): T', 'Returns 1 when x is positive, 0 when x is zero and -1 when x is negative.\n T ≡ float | int | vec | ivec' ],
    [ 'floor(x: T): T', 'The largest integer number that is smaller or equal to x.\n T ≡ float | vec' ],
    [ 'trunc(x: T): T', 'The nearest integer number n such that |n| ≤ |x|.\n T ≡ float | vec' ],
    [ 'round(x: T): T', 'Rounds to nearest integer.\n T ≡ float | vec' ],
    [ 'roundEven(x: T): T', 'Rounds to nearest integer.\n T ≡ float | vec' ],
    [ 'ceil(x: T): T', 'The smallest number that is larger or equal to x.\n T ≡ float | vec' ],
    [ 'fract(x: T): T', 'The fractional part of x, i.e. x minus floor(x).\n T ≡ float | vec' ],
    [ 'mod(x: T, y: T): T', 'The remainder after the division of x by y.\n T ≡ float | vec' ],
    [ 'mod(x: T, y: float): T', 'The remainder after the division of x by y.\n T ≡ float | vec' ],
    [ 'modf(x: T, i: float): T', 'Separates a floating point value x into its integer and fractional parts. The fractional part of the number is returned from the function and the integer part (as a floating point quantity) is returned in the output parameter i.\n T ≡ float | vec' ],
    [ 'min(x: T, y: T): T', 'The smaller of the two arguments.\n T ≡ float | int | uint | vec | ivec | uvec' ],
    [ 'min(x: T, y: float): T', 'The smaller of the two arguments.\n T ≡ float | vec' ],
    [ 'min(x: T, y: int): T', 'The smaller of the two arguments.\n T ≡ int | ivec' ],
    [ 'min(x: T, y: uint): T', 'The smaller of the two arguments.\n T ≡ uint | uvec' ],
    [ 'max(x: T, y: T): T', 'The larger of the two arguments.\n T ≡ float | int | uint | vec | ivec | uvec' ],
    [ 'max(x: T, y: float): T', 'The larger of the two arguments.\n T ≡ float | vec' ],
    [ 'max(x: T, y: int): T', 'The larger of the two arguments.\n T ≡ int | ivec' ],
    [ 'max(x: T, y: uint): T', 'The larger of the two arguments.\n T ≡ uint | uvec' ],
    [ 'clamp(x: T, minValue: T, maxValue: T): T', 'Returns x if minValue < x < maxValue. If x ≤ minValue, the minValue is returned. If x ≥ maxValue, the maxValue is returned.\n T ≡ float | int | uint | vec | ivec | uvec' ],
    [ 'clamp(x: T, minValue: float, maxValue: float): T', 'Returns x if minValue < x < maxValue. If x ≤ minValue, the minValue is returned. If x ≥ maxValue, the maxValue is returned.\n T ≡ float | vec' ],
    [ 'clamp(x: T, minValue: int, maxValue: int): T', 'Returns x if minValue < x < maxValue. If x ≤ minValue, the minValue is returned. If x ≥ maxValue, the maxValue is returned.\n T ≡ int | ivec' ],
    [ 'clamp(x: T, minValue: uint, maxValue: uint): T', 'Returns x if minValue < x < maxValue. If x ≤ minValue, the minValue is returned. If x ≥ maxValue, the maxValue is returned.\n T ≡ uint | uvec' ],
    [ 'mix(start: T, end: T, weight: T): T', 'Linear interpolation between the start and the end using the weight to fall between them. Computed as start×(1-weight)+end×weight.\n T ≡ float | vec' ],
    [ 'mix(start: T, end: T, weight: float): T', 'Linear interpolation between the start and the end using the weight to fall between them. Computed as start×(1-weight)+end×weight.\n T ≡ float | vec' ],
    [ 'step(edge: T, x: T): T', 'Returns 0 if x is smaller than the edge, and 1 otherwise.\n T ≡ float | vec' ],
    [ 'step(edge: float, x: T): T', 'Returns 0 if x is smaller than the edge, and 1 otherwise.\n T ≡ float | vec' ],
    [ 'smoothstep(firstEdge: T, secondEdge: T, x: T): T', 'Returns 0 if x is smaller than the firstEdge and 1 if x is larger than the secondEdge. Otherwise the return value is interpolated between 0 and 1 using Hermite polynomials.\n T ≡ float | vec' ],
    [ 'smoothstep(firstEdge: float, secondEdge: float, x: T): T', 'Returns 0 if x is smaller than the firstEdge and 1 if x is larger than the secondEdge. Otherwise the return value is interpolated between 0 and 1 using Hermite polynomials.\n T ≡ float | vec' ],
    // Geometric
    [ 'length(x: T): float', 'Length of the vector defined by the Euclidean norm, i.e. the square root of the sum of the squared components.\n T ≡ float | vec' ],
    [ 'distance(a: T, b: T): float', 'Distance between points a and b.\n T ≡ float | vec' ],
    [ 'dot(x: T, y: T): float', 'Dot product of x and y, i.e. the sum of the component-wise products.\n T ≡ float | vec' ],
    [ 'cross(x: vec3, y: vec3): vec3', 'Cross product of x and y.' ],
    [ 'normalize(x: T): T', 'Vector x normalized to length 1, i.e. x divided by its length.\n T ≡ float | vec' ],
    [ 'faceforward(normal: T, incident: T, refNormal: T ): T', 'Returns the normal if refNormal•incident < 0, otherwise returns the normal flipped (-normal).\n T ≡ float | vec' ],
    [ 'reflect(incident: T, normal: T): T', 'Returns a reflection vector given an incident vector and a surface normal. The normal vector should be normalized.\n T ≡ float | vec' ],
    [ 'refract(incident: T, normal: T, index: float): T', 'Returns a refraction vector given an incident vector, a surface normal, and a refraction index. The incident and normal vectors should be normalized.\n T ≡ float | vec' ],
    // Matrix
    [ 'matrixCompMult(x: mat, y: mat): mat', 'Multiplies x by y component-wise.' ],
    // Vector Relational
    [ 'lessThan(x: T, y: T): bvec', 'Component-wise comparison x < y.\n T ≡ vec | ivec' ],
    [ 'lessThanEqual(x: T, y: T): bvec', 'Component-wise comparison x ≤ y.\n T ≡ vec | ivec' ],
    [ 'greaterThan(x: T, y: T): bvec', 'Component-wise comparison x > y.\n T ≡ vec | ivec' ],
    [ 'greaterThanEqual(x: T, y: T): bvec', 'Component-wise comparison x ≥ y.\n T ≡ vec | ivec' ],
    [ 'equal(x: T, y: T): bvec', 'Component-wise comparison x = y.\n T ≡ vec | ivec | bvec' ],
    [ 'notEqual(x: T, y: T): bvec', 'Component-wise comparison x ≠ y.\n T ≡ vec | ivec | bvec' ],
    [ 'any(x: bvec): bool', 'True if any component of x is true.' ],
    [ 'all(x: bvec): bool', 'True if all components of x are true.' ],
    [ 'not(x: bvec): bvec', 'Logical complement of x.' ],
    // Texture Lookup
    [ 'texture(sampler: S, coordinates: T): vec4', 'Returns the value of the texture at the given coordinates. \n S ≡ sampler2D | sampler3D, T ≡ vec2 | vec3' ],
    [ 'texture(sampler: S, coordinates: T, bias: float): vec4', 'Returns the value of the texture at the given coordinates. The bias is included in the level-of-detail computation that is used to choose mipmap(s) from which to sample. \n S ≡ sampler2D | sampler3D, T ≡ vec2 | vec3' ]
  ] as Functions
}

export {
  glslES100,
  glslES300,
  snippets,
  predefinedAttributes,
  predefinedUniforms,
  Name,
  NameWithType,
  NameWithParametersAndType,
  Docs,
  CodeSnippet
}
