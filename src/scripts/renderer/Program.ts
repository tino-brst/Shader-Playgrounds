import { Shader } from './Shader'
import { VertexAttribute, Uniform, ShaderInput } from './ShaderInputs'
import { ShaderVariableType, ShaderType } from './_constants'

export class Program {
  public programObject: WebGLProgram
  public vertexShader: Shader
  public fragmentShader: Shader
  public activeVertexAttributes: Map < string, VertexAttribute >
  public activeUniforms: Map < string, Uniform >
  public usable: boolean
  public log: string
  private gl: WebGLRenderingContext

  constructor (gl: WebGLRenderingContext, vertexShaderSource?: string, fragmentShaderSource?: string) {
    this.programObject = gl.createProgram() as WebGLProgram
    this.vertexShader = new Shader(gl, ShaderType.Vertex)
    this.fragmentShader = new Shader(gl, ShaderType.Fragment)
    this.activeVertexAttributes = new Map()
    this.activeUniforms = new Map()
    this.gl = gl
    this.usable = false
    this.log = ''

    this.forceUseOfAttributeLocationZero()

    if ((vertexShaderSource !== undefined) && (fragmentShaderSource !== undefined)) {
      this.setShadersSourceAndLink(vertexShaderSource, fragmentShaderSource)
    }
  }

  // 👥  Metodos Publicos

  public setShadersSourceAndLink (vertexShaderSource: string, fragmentShaderSource: string) {
    this.vertexShader.source = vertexShaderSource
    this.vertexShader.compile()

    this.fragmentShader.source = fragmentShaderSource
    this.fragmentShader.compile()

    this.usable = false

    if (this.vertexShader.usable && this.fragmentShader.usable) {
      this.link()
    }
  }

  public use () {
    this.gl.useProgram(this.programObject)
  }

  // ✋🏼  Metodos Privados

  private link () {
    this.gl.attachShader(this.programObject, this.vertexShader.shaderObject)
    this.gl.attachShader(this.programObject, this.fragmentShader.shaderObject)

    this.gl.linkProgram(this.programObject)

    this.gl.detachShader(this.programObject, this.vertexShader.shaderObject)
    this.gl.detachShader(this.programObject, this.fragmentShader.shaderObject)

    this.log = this.gl.getProgramInfoLog(this.programObject) as string
    this.usable = this.gl.getProgramParameter(this.programObject, this.gl.LINK_STATUS)

    if (this.usable) {
      this.loadActiveVertexAttributes()
      this.loadActiveUniforms()
    }
  }

  private loadActiveVertexAttributes () {
    this.activeVertexAttributes.clear()

    const activeAttributesCount = this.gl.getProgramParameter(this.programObject, this.gl.ACTIVE_ATTRIBUTES)

    for (let index = 0; index < activeAttributesCount; index++) {
      const activeInfo = this.gl.getActiveAttrib(this.programObject, index) as WebGLActiveInfo

      const name = activeInfo.name
      const type = ShaderInput.toShaderVariableType(this.gl, activeInfo.type) as ShaderVariableType
      const size = activeInfo.size
      const location = this.gl.getAttribLocation(this.programObject, name) as number

      const attributeInfo = new VertexAttribute(this.gl, name, type, size, location)

      this.activeVertexAttributes.set(attributeInfo.name, attributeInfo)
    }
  }

  private loadActiveUniforms () {
    this.activeUniforms.clear()

    const activeUniformsCount = this.gl.getProgramParameter(this.programObject, this.gl.ACTIVE_UNIFORMS)

    for (let index = 0; index < activeUniformsCount; index++) {
      const activeInfo = this.gl.getActiveUniform(this.programObject, index) as WebGLActiveInfo

      const name = activeInfo.name
      const type = ShaderInput.toShaderVariableType(this.gl, activeInfo.type) as ShaderVariableType
      const size = activeInfo.size
      const location = this.gl.getUniformLocation(this.programObject, name) as number

      const uniformInfo = new Uniform(this.gl, name, type, size, location)

      this.activeUniforms.set(uniformInfo.name, uniformInfo)
    }
  }

  private forceUseOfAttributeLocationZero () {
    /*
      • From MDNs 'WebGL best practices'
      Always have vertex attrib 0 array enabled. If you draw with
      vertexattrib 0 array disabled, you will force the browser to
      do complicated emulation when running on desktop OpenGL
      (e.g. on Mac OSX). This is because in desktop OpenGL, nothing
      gets drawn if vertex attrib 0 is not array-enabled. You can use
      bindAttribLocation() to force a vertex attribute to use location 0,
      and use enableVertexAttribArray() to make it array-enabled.
    */

    this.gl.bindAttribLocation(this.programObject, 0, 'vertexPosition')
  }
}
