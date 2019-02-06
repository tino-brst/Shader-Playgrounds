// File imports

declare module "*.glsl" {
    const content: string
    export default content
}

declare module "*.obj" {
    const content: string
    export default content
}

declare module "*.jpg" {
    const content: string
    export default content
}

// Types

declare type TypedArray = Float32Array | Uint16Array
declare type ValidItemSize = 1 | 2 | 3

// Modules

declare module "glsl-transpiler"
