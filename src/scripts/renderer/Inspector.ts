import transpiler from "glsl-transpiler"
import { InspectorLogEntry, LogEntryType } from "./InspectorLogEntry"
import { Program } from "./Program"
import { Shader } from "./Shader"
import { ShaderVariableType, ShaderType, LanguageVersion } from "./_constants"
import { VertexAttributeBuffer } from "./Buffers"

interface ShaderItems {
  valid: boolean,
  uniforms: { [ key: string ]: any },
  attributes: { [ key: string ]: any },
  varyings: { [ key: string ]: any },
  ins: { [ key: string ]: any },
  outs: { [ key: string ]: any }
}

export class Inspector {
  public availableVertexAttributes: Map < string, ShaderVariableType >
  public defaultUniforms: Map < string, ShaderVariableType >
  public definedUniforms: Map < string, string >
  public languageVersion: LanguageVersion
  private compilationLog: InspectorLogEntry[]
  private uniformsLog: InspectorLogEntry[]
  private attributesLog: InspectorLogEntry[]
  private varyingsLog: InspectorLogEntry[] // named 'in's and 'out's in newer versions of GLSL
  private vertexShaderItems: ShaderItems
  private fragmentShaderItems: ShaderItems

  constructor() {
    this.availableVertexAttributes = new Map()
    this.defaultUniforms = new Map()
    this.definedUniforms = new Map()
    this.languageVersion = LanguageVersion.GLSL_ES300

    this.compilationLog = []
    this.uniformsLog    = []
    this.attributesLog  = []
    this.varyingsLog    = []

    this.vertexShaderItems = {
      valid: true,
      uniforms: {},
      attributes: {},
      varyings: {},
      ins: {},
      outs: {}
    }

    this.fragmentShaderItems = {
      valid: true,
      uniforms: {},
      attributes: {},
      varyings: {},
      ins: {},
      outs: {}
    }
  }

  // 👥  Metodos Publicos

  public inspect( program: Program ) {
    // 🔍 Errors and warnings compilation

    this.compilationLog = []
    this.uniformsLog    = []
    this.attributesLog  = []
    this.varyingsLog    = []

    const vertexShader = program.vertexShader
    const fragmentShader = program.fragmentShader

    // Vertex shader uniforms & attributes inspection
    if ( vertexShader.usable ) {
      this.vertexShaderItems = this.parseItems( vertexShader.source )
      this.checkDefinedUniforms( vertexShader, this.vertexShaderItems, this.uniformsLog )
      this.checkDefinedVertexAttributes( this.vertexShaderItems, this.attributesLog )
    } else {
      this.checkCompilationLog( vertexShader, this.compilationLog )
    }

    // Fragment shader uniforms inspection
    if ( fragmentShader.usable ) {
      this.fragmentShaderItems = this.parseItems( fragmentShader.source )
      this.checkDefinedUniforms( fragmentShader, this.fragmentShaderItems, this.uniformsLog )
    } else {
      this.checkCompilationLog( fragmentShader, this.compilationLog )
    }

    // Vertex and fragment shaders "connection" inspection (varyings | ins & outs)
    if ( vertexShader.usable && fragmentShader.usable) {
      this.checkDefinedVaryings( this.vertexShaderItems, this.fragmentShaderItems, this.varyingsLog )
    }

    // #️⃣ Inspection of uniforms defined across shaders

    this.definedUniforms.clear()

    // Uniforms found by the parser
    for ( const name in this.vertexShaderItems.uniforms ) {
      this.definedUniforms.set( name, this.vertexShaderItems.uniforms[ name ].type )
    }
    for ( const name in this.fragmentShaderItems.uniforms ) {
      this.definedUniforms.set( name, this.fragmentShaderItems.uniforms[ name ].type )
    }

    // Uniforms found by the compiler (used as last resort in case of the parser failing, to at least add the active uniforms)
    for ( const [ name, uniform ] of program.activeUniforms ) {
      this.definedUniforms.set( name, uniform.type )
    }
  }

  public checkVertexShaderAttributes() {
    this.attributesLog = []
    this.checkDefinedVertexAttributes( this.vertexShaderItems, this.attributesLog )
  }

  public getErrorsAndWarnings(): InspectorLogEntry[] {
    return [
      ...this.compilationLog,
      ...this.uniformsLog,
      ...this.attributesLog,
      ...this.varyingsLog
    ]
  }

  public updateAvailableVertexAttributesFromBuffers( buffers: Map <string, VertexAttributeBuffer > ) {
    this.availableVertexAttributes.clear()

    for ( const [ name, buffer ] of buffers ) {
      const type = ( buffer.itemSize === 2 ) ? ShaderVariableType.vec2 : ShaderVariableType.vec3

      this.availableVertexAttributes.set( name, type )
    }
  }

  public updateDefaultUniforms( uniforms: Array < { name: string, type: ShaderVariableType, value: any } > ) {
    this.defaultUniforms.clear()

    for ( const uniform of uniforms ) {
      this.defaultUniforms.set( uniform.name, uniform.type )
    }
  }

  // ✋🏼  Metodos Privados

  private parseItems( source: string ): ShaderItems {
    const transpile = transpiler( { version: ( this.languageVersion === LanguageVersion.GLSL_ES100 ) ? "100 es" : "300 es" } )

    let items: ShaderItems = {
      valid: true,
      uniforms: {},
      attributes: {},
      varyings: {},
      ins: {},
      outs: {}
    }

    try {
      transpile( source )
      const { uniforms, attributes, varyings, ins, outs } = transpile.compiler
      items = { valid: true, uniforms, attributes, varyings, ins, outs }
    } catch ( error ) {
      const message = `%c❱ %cCould not parse GLSL code %c(${ error })`
      const styles = [ "color: crimson; font-weight: bold;", "font-weight: bold;", "color: gray;" ]
      console.log( message, ...styles )
      items.valid = false
    }

    return items
  }

  private checkCompilationLog( shader: Shader, log: InspectorLogEntry[] ) {
    const errorLines = shader.log.split( "\n" )

    errorLines.pop()  // elimino string vacio [ ... , "" ]

    for ( const line of errorLines ) {
      const lineElements = line.split( ": " )
      const lineNumber = parseInt( lineElements[ 1 ].split( ":" )[ 1 ] ) || 0 // "|| 0" en caso de NaN en nro de linea
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

  private checkDefinedUniforms( shader: Shader, items: ShaderItems, log: InspectorLogEntry[] ) {
    const uniforms = items.uniforms

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

  private checkDefinedVertexAttributes( items: ShaderItems, log: InspectorLogEntry[] ) {
    const attributes = ( this.languageVersion === LanguageVersion.GLSL_ES100 ) ? items.attributes : items.ins

    for ( const name in attributes ) {
      const attribute = attributes[ name ]
      const availableAttributeType = this.availableVertexAttributes.get( name )

      if ( availableAttributeType === undefined ) {
        let description = `'${ name }' - no data available for this attribute`

        if ( name === "vertexTextureCoordinates" ) {
          description = `'${ name }' - no data available for this attribute, look for the models marked with a 'T'`
        }

        // warning ante attributo sin info disponible
        const warning = new InspectorLogEntry(
          ShaderType.Vertex,
          LogEntryType.Warning,
          attribute.node.token.line,
          description
        )

        log.push( warning )
      } else if ( attribute.type !== availableAttributeType ) {
        // warning ante atributo con el mismo nombre pero distinto tipo que uno de los definidos por defecto
        const warning = new InspectorLogEntry(
          ShaderType.Vertex,
          LogEntryType.Warning,
          attribute.node.token.line,
          `'${ name }' - type mismatch, should be '${ availableAttributeType }'`
        )

        log.push( warning )
      }
    }
  }

  private checkDefinedVaryings( vertexItems: ShaderItems, fragmentItems: ShaderItems, log: InspectorLogEntry[] ) {
    if ( ! vertexItems.valid || ! fragmentItems.valid ) return

    let vertexOutputs
    let fragmentInputs

    if ( this.languageVersion === LanguageVersion.GLSL_ES100 ) {
      vertexOutputs  = vertexItems.varyings
      fragmentInputs = fragmentItems.varyings
    } else {
      vertexOutputs  = vertexItems.outs
      fragmentInputs = fragmentItems.ins
    }

    // 🔎  analisis de varyings definidos en el shader de vertices
    for ( const name in vertexOutputs ) {
      const varying = vertexOutputs[ name ]

      if ( ! ( name in fragmentInputs ) ) {
        const warning = new InspectorLogEntry(
          ShaderType.Vertex,
          LogEntryType.Warning,
          varying.node.token.line,
          `'${ name }' - value not read by fragment shader`
        )

        log.push( warning )
      } else if ( varying.type !== fragmentInputs[ name ].type ) {
        const warning = new InspectorLogEntry(
          ShaderType.Vertex,
          LogEntryType.Warning,
          varying.node.token.line,
          `'${ name }' - type mismatch, the fragment shader expects a '${ fragmentInputs[ name ].type }'`
        )

        log.push( warning )
      }
    }

    // 🔎  analisis de varyings definidos en el shader de fragmentos
    for ( const name in fragmentInputs ) {
      const varying = fragmentInputs[ name ]

      if ( ! ( name in vertexOutputs ) ) {
        const error = new InspectorLogEntry(
          ShaderType.Fragment,
          LogEntryType.Error,
          varying.node.token.line,
          `'${ name }' - value not sent by vertex shader`
        )

        log.push( error )
      } else if ( varying.type !== vertexOutputs[ name ].type ) {
        const error = new InspectorLogEntry(
          ShaderType.Fragment,
          LogEntryType.Error,
          varying.node.token.line,
          `'${ name }' - type mismatch, the vertex shader sends a '${ vertexOutputs[ name ].type }' `
        )

        log.push( error )
      }
    }
  }
}
