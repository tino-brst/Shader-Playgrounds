import { ShaderVariableType } from "./_constants"
import { mat3, mat4, vec2, vec3, vec4 } from "gl-matrix"

export abstract class ShaderInput {
    public name: string
    public type: ShaderVariableType
    public size: number
    public location: number
    protected gl: WebGLRenderingContext

    constructor( gl: WebGLRenderingContext, name: string, type: ShaderVariableType, size: number, location: number ) {
        this.gl = gl
        this.name = name
        this.type = type
        this.size = size
        this.location = location
    }

    // 👥  Metodos Publicos

    public static toShaderVariableType( gl: WebGLRenderingContext, type: number ) {
        switch ( type ) {
            case gl.INT:

                return ShaderVariableType.int

            case gl.FLOAT:

                return ShaderVariableType.float

            case gl.FLOAT_VEC2:

                return ShaderVariableType.vec2

            case gl.FLOAT_VEC3:

                return ShaderVariableType.vec3

            case gl.FLOAT_VEC4:

                return ShaderVariableType.vec4

            case gl.FLOAT_MAT3:

                return ShaderVariableType.mat3

            case gl.FLOAT_MAT4:

                return ShaderVariableType.mat4

            case gl.SAMPLER_2D:

                return ShaderVariableType.sampler2D

            default:

                console.error( "toGLSLVariableType: unknown type" )

                return "?"
        }
    }

    public static getDefaultValueForType( type: ShaderVariableType ) {
        switch ( type ) {
            case ShaderVariableType.int:

                return 0

            case ShaderVariableType.float:

                return 0

            case ShaderVariableType.mat3:

                return mat3.create()

            case ShaderVariableType.mat4:

                return mat4.create()

            case ShaderVariableType.vec2:

                return vec2.create()

            case ShaderVariableType.vec3:

                return vec3.create()

            case ShaderVariableType.vec4:

                return vec4.create()

            case ShaderVariableType.sampler2D:

                return 0

            default:

                console.error( "getDefaultValueForType: unknown type" )

                return undefined
        }
    }
}

export class VertexAttribute extends ShaderInput {
    constructor( gl: WebGLRenderingContext, name: string, type: ShaderVariableType, size: number, location: number ) {
        super( gl, name, type, size, location )
    }
}

export class Uniform extends ShaderInput {
    public setValue: ( value: any ) => void

    constructor( gl: WebGLRenderingContext, name: string, type: ShaderVariableType, size: number, location: number ) {
        super( gl, name, type, size, location )

        this.setValue = this.getValueSetter( type )
    }

    // ✋🏼  Metodos Privados

    private getValueSetter( type: string ) {
        switch ( type ) {
            case ShaderVariableType.float:

                return ( value: number ) => {
                    this.gl.uniform1f( this.location, value )
                }

            case ShaderVariableType.vec2:

                return ( value: Float32Array ) => {
                    this.gl.uniform2fv( this.location, value )
                }

            case ShaderVariableType.vec3:

                return ( value: Float32Array ) => {
                    this.gl.uniform3fv( this.location, value )
                }

            case ShaderVariableType.vec4:

                return ( value: Float32Array ) => {
                    this.gl.uniform4fv( this.location, value )
                }

            case ShaderVariableType.int:

                return ( value: number ) => {
                    this.gl.uniform1i( this.location, value )
                }

            case ShaderVariableType.mat3:

                return ( value: Float32Array ) => {
                    this.gl.uniformMatrix3fv( this.location, false, value )
                }

            case ShaderVariableType.mat4:

                return ( value: Float32Array ) => {
                    this.gl.uniformMatrix4fv( this.location, false, value )
                }

            case ShaderVariableType.sampler2D:

                return ( value: number ) => {
                    this.gl.uniform1i( this.location, value )
                }

            default:

                return () => {
                    console.warn( "🤷🏻‍♂️ No match found" )
                }
        }
    }
}
