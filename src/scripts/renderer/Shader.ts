import { ShaderType } from './_constants'

export class Shader {
  public shaderObject: WebGLShader
  public source: string
  public type: string
  public usable: boolean
  public log: string
  protected gl: WebGLRenderingContext

  constructor (gl: WebGLRenderingContext, type: ShaderType, source?: string) {
    this.shaderObject = gl.createShader(type === ShaderType.Vertex ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER) as WebGLShader
    this.source = ''
    this.type = type
    this.usable = false
    this.log = ''
    this.gl = gl

    if (source !== undefined) {
      this.source = source
      this.compile()
    }
  }

  // 👥  Metodos Publicos

  public compile () {
    this.gl.shaderSource(this.shaderObject, this.source)
    this.gl.compileShader(this.shaderObject)

    this.usable = this.gl.getShaderParameter(this.shaderObject, this.gl.COMPILE_STATUS)
    this.log = this.gl.getShaderInfoLog(this.shaderObject) as string

    return this
  }
}
