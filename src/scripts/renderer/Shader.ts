import transpiler from "glsl-transpiler"
import { ShaderType } from "./_constants"

export class Shader {

    public shaderObject: WebGLShader
    public source: string
    public type: string
    public items: any
    public usable: boolean
    public log: string
    protected gl: WebGLRenderingContext

    constructor( gl: WebGLRenderingContext, type: ShaderType, source?: string ) {

        this.shaderObject = gl.createShader( type === ShaderType.Vertex ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER ) as WebGLShader
        this.source = ""
        this.type = type
        this.items = {}
        this.usable = false
        this.log = ""
        this.gl = gl

        if ( source !== undefined ) {

            this.source = source
            this.compile()

        }

    }

    // 👥  Metodos Publicos

    public compile() {

        this.gl.shaderSource( this.shaderObject, this.source )
        this.gl.compileShader( this.shaderObject )

        this.usable = this.gl.getShaderParameter( this.shaderObject, this.gl.COMPILE_STATUS )
        this.log = this.gl.getShaderInfoLog( this.shaderObject ) as string

        if ( this.usable ) {

this.parseItems()

}

        return this

    }

    // ✋🏼  Metodos Privados

    private parseItems() {

        // console.time( "parse" )

        const transpile = transpiler()

        let shaderItems

        try {

            transpile( this.source )

            shaderItems = transpile.compiler

        } catch ( error ) {

            const message = `%c❱ %cCould not parse GLSL code %c(${ error })`
            const styles = [ "color: crimson; font-weight: bold;", "font-weight: bold;", "color: gray;" ]

            console.log( message, ...styles )

        }

        this.items = shaderItems

        // console.timeEnd( "parse" )

    }

}