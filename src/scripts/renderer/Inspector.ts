import { InspectorLogEntry, LogEntryType } from "./InspectorLogEntry"
import { Program } from "./Program"
import { Shader } from "./Shader"
import { ShaderVariableType, ShaderType } from "./_constants"
import { VertexAttributeBuffer } from "./Buffers"

export class Inspector {
    public availableVertexAttributes: Map < string, ShaderVariableType >
    public defaultUniforms: Map < string, ShaderVariableType >

    constructor() {
        this.defaultUniforms = new Map()
        this.availableVertexAttributes = new Map()
    }

    // 👥  Metodos Publicos

    public checkForErrorsAndWarnings( program: Program ) {
        const log: InspectorLogEntry[] = []

        const vertexShader = program.vertexShader
        const fragmentShader = program.fragmentShader

        this.checkShader( vertexShader, log )
        this.checkShader( fragmentShader, log )

        if ( vertexShader.usable && fragmentShader.usable ) {
            this.checkDefinedVaryings( vertexShader, fragmentShader, log )
        }

        return log
    }

    public getUniformsInfo( program: Program ) {
        const uniformsInfo: Map < string, string > = new Map()

        this.checkParsedUniformsInfo( program.vertexShader, uniformsInfo )
        this.checkParsedUniformsInfo( program.fragmentShader, uniformsInfo )

        // en caso de error en parser al menos tener en cuenta los uniforms activos

        this.checkActiveUniformsInfo( program, uniformsInfo )

        return uniformsInfo
    }

    // ✋🏼  Metodos Privados

    private checkShader( shader: Shader, log: InspectorLogEntry[] ) {
        if ( shader.usable && shader.items ) {
            this.checkDefinedUniforms( shader, log )

            if ( shader.type === ShaderType.Vertex ) {
                this.checkDefinedVertexAttributes( shader, log )
            }
        } else {
            this.checkForCompilationErrors( shader, log )
        }
    }

    private checkForCompilationErrors( shader: Shader, log: InspectorLogEntry[] ) {
        const errorLines = shader.log.split( "\n" )

        errorLines.pop()  // elimino string vacio [ ... , "" ]

        for ( const line of errorLines ) {
            const lineElements = line.split( ": " )
            const lineNumber = parseInt( lineElements[ 1 ].split( ":" )[ 1 ] )
            const description = lineElements[ 2 ] + "- " + lineElements[ 3 ]

            const error = new InspectorLogEntry(
                shader.type,
                LogEntryType.Error,
                lineNumber,
                description
            )

            log.push( error )
        }
    }

    private checkDefinedUniforms( shader: Shader, log: InspectorLogEntry[] ) {
        const uniforms = shader.items.uniforms

        for ( const name in uniforms ) {
            const uniform = uniforms[ name ]
            const defaultUniformType = this.defaultUniforms.get( name )

            // warning ante uniform con el mismo nombre pero distinto tipo que uno de los definidos por defecto

            if ( ( defaultUniformType !== undefined ) && ( defaultUniformType !== uniform.type ) ) {
                const warning = new InspectorLogEntry(
                    shader.type,
                    LogEntryType.Warning,
                    uniform.node.token.line,
                    `'${ name }' - type mismatch, should be '${ defaultUniformType }'`
                )

                log.push( warning )
            }
        }
    }

    private checkDefinedVertexAttributes( shader: Shader, log: InspectorLogEntry[] ) {
        const vertexAttributes = shader.items.attributes

        for ( const name in vertexAttributes ) {
            const vertexAttribute = vertexAttributes[ name ]
            const availableVertexAttributeType = this.availableVertexAttributes.get( name )

            if ( availableVertexAttributeType === undefined ) {
                // warning ante attributo sin info disponible

                const warning = new InspectorLogEntry(
                    shader.type,
                    LogEntryType.Warning,
                    vertexAttribute.node.token.line,
                    `'${ name }' - no info available, check the available attributes`
                )

                log.push( warning )
            } else if ( vertexAttribute.type !== availableVertexAttributeType ) {
                // warning ante atributo con el mismo nombre pero distinto tipo que uno de los definidos por defecto

                const warning = new InspectorLogEntry(
                    shader.type,
                    LogEntryType.Warning,
                    vertexAttribute.node.token.line,
                    `'${ name }' - type mismatch, should be '${ availableVertexAttributeType }'`
                )

                log.push( warning )
            }
        }
    }

    private checkDefinedVaryings( vertexShader: Shader, fragmentShader: Shader, log: InspectorLogEntry[] ) {
        if ( vertexShader.items && fragmentShader.items ) {
            const vertexShaderVaryings = vertexShader.items.varyings
            const fragmentShaderVaryings = fragmentShader.items.varyings

            // 🔎  analisis de varyings definidos en el shader de vertices

            for ( const name in vertexShaderVaryings ) {
                const varying = vertexShaderVaryings[ name ]

                if ( ! ( name in fragmentShaderVaryings ) ) {
                    const warning = new InspectorLogEntry(
                        ShaderType.Vertex,
                        LogEntryType.Warning,
                        varying.node.token.line,
                        `'${ name }' - value not read by fragment shader`
                    )

                    log.push( warning )
                } else if ( varying.type !== fragmentShaderVaryings[ name ].type ) {
                    const warning = new InspectorLogEntry(
                        ShaderType.Vertex,
                        LogEntryType.Warning,
                        varying.node.token.line,
                        `'${ name }' - type mismatch, the fragment shader expects a '${ fragmentShaderVaryings[ name ].type }'`
                    )

                    log.push( warning )
                }
            }

            // 🔎  analisis de varyings definidos en el shader de fragmentos

            for ( const name in fragmentShaderVaryings ) {
                const varying = fragmentShaderVaryings[ name ]

                if ( ! ( name in vertexShaderVaryings ) ) {
                    const error = new InspectorLogEntry(
                        ShaderType.Fragment,
                        LogEntryType.Error,
                        varying.node.token.line,
                        `'${ name }' - value not sent by vertex shader`
                    )

                    log.push( error )
                } else if ( varying.type !== vertexShaderVaryings[ name ].type ) {
                    const error = new InspectorLogEntry(
                        ShaderType.Fragment,
                        LogEntryType.Error,
                        varying.node.token.line,
                        `'${ name }' - type mismatch, the vertex shader sends a '${ vertexShaderVaryings[ name ].type }' `
                    )

                    log.push( error )
                }
            }
        }
    }

    private checkParsedUniformsInfo( shader: Shader, info: Map < string, string > ) {
        if ( shader.items !== undefined ) {
            const uniforms = shader.items.uniforms

            for ( const name in uniforms ) {
                info.set( name, uniforms[ name ].type )
            }
        }
    }

    private checkActiveUniformsInfo( program: Program, info: Map < string, string > ) {
        for ( const [ name, uniform ] of program.activeUniforms ) {
            info.set( name, uniform.type )
        }
    }
}
