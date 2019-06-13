import { BuffersGeometry } from "./BuffersGeometry"
import { Camera } from "./Camera"
import { CameraOrbitControls } from "./CameraOrbitControls"
import { GeometriesManager } from "./GeometriesManager"
import { Inspector } from "./Inspector"
import { mat4, glMatrix } from "gl-matrix"
import { Program } from "./Program"
import { RendererState } from "./RendererState"
import { ShaderVariableType, DrawMode, LanguageVersion } from "./_constants"
import { TexturesManager } from "./TexturesManager"
import { UniformEditor } from "./UniformEditor"
import { UniformsCache, UniformState } from "./UniformsCache"
import { VertexAttribute, Uniform } from "./ShaderInputs"
import { VertexAttributeBuffer } from "./Buffers"

export interface Model {
  name: string,
  attributes: {
    positions: boolean,
    normals: boolean,
    textureCoordinates: boolean
  }
}

export class Renderer {
  private canvas: HTMLCanvasElement
  private gl: WebGLRenderingContext
  private state: RendererState
  private inspector: Inspector
  private program: Program
  private uniformsCache: UniformsCache
  private uniformsEditors: Map < string, UniformEditor >
  private camera: Camera
  private cameraOrbitControls: CameraOrbitControls
  private model: BuffersGeometry
  private geometriesManager: GeometriesManager
  private texturesManager: TexturesManager

  constructor( canvas: HTMLCanvasElement, onGeometriesLoaded: () => void, onTexturesLoaded: () => void ) {
    // setup del canvas y contexto WebGL
    this.canvas = canvas
    this.gl = this.canvas.getContext( "webgl2" ) as WebGLRenderingContext

    // seguimiento de estado ( valores que se mantienen de un loop al siguiente )
    this.state = new RendererState( this.gl )

    // asset managers
    this.geometriesManager = new GeometriesManager( onGeometriesLoaded )
    this.texturesManager = new TexturesManager( this.gl, onTexturesLoaded )

    // setup de programa principal
    this.program = new Program( this.gl )

    // objeto en escena
    this.model = new BuffersGeometry( this.gl )

    // setup de camara
    this.camera = new Camera().setPosition( 4, 4, 4 )
    this.cameraOrbitControls = new CameraOrbitControls( this.camera, this.canvas )

    // uniforms por defecto
    const defaultUniforms: Array < { name: string, type: ShaderVariableType, value: any } > = [
      { name: "modelMatrix", type: ShaderVariableType.mat4, value: this.model.modelMatrix },
      { name: "modelViewMatrix", type: ShaderVariableType.mat4, value: this.model.modelViewMatrix },
      { name: "normalMatrix", type: ShaderVariableType.mat4, value: this.model.normalMatrix },
      { name: "viewMatrix", type: ShaderVariableType.mat4, value: this.camera.viewMatrix },
      { name: "projectionMatrix", type: ShaderVariableType.mat4, value: this.camera.projectionMatrix }
    ]

    // cache de uniforms
    this.uniformsCache = new UniformsCache()
    this.initUniformsCache( defaultUniforms )

    // inspector de programa
    this.inspector = new Inspector()
    this.inspector.updateDefaultUniforms( defaultUniforms )

    // editores de uniforms
    this.uniformsEditors = new Map()

    // modelo por defecto
    this.setModel( "cube" )
  }

  // 👥  Metodos Publicos

  public setShaderProgram( vertexSaderSource: string, fragmentShaderSource: string ) {
    const programWasUsable = this.program.usable

    this.program.setShadersSourceAndLink( vertexSaderSource, fragmentShaderSource )
    this.inspector.inspect( this.program )

    if ( this.program.usable ) {
      this.program.use()
      this.updateUniformsCacheAndEditors( this.inspector.definedUniforms )
      this.state.attributeBuffersNeedUpdate = true

      if ( ! programWasUsable ) {
        this.loop()
        this.cameraOrbitControls.enabled = true
      }
    } else {
      this.cameraOrbitControls.enabled = false
    }

    return this.program.usable
  }

  public setLanguageVersion( version: LanguageVersion ) {
    this.inspector.languageVersion = version
    this.inspector.inspect( this.program )
  }

  public setModel( name: string ) {
    const geometry = this.geometriesManager.getGeometry( name )

    if ( geometry !== undefined ) {
      this.model.updateBuffersFromGeometry( geometry )
      this.inspector.updateAvailableVertexAttributesFromBuffers( this.model.vertexAttributesBuffers )
      this.inspector.checkVertexShaderAttributes()

      this.state.drawBufferNeedsUpdate = true
      this.state.attributeBuffersNeedUpdate = true

      return true
    } else {
      return false
    }
  }

  public setTextureForUnit( name: string, unit: number ) {
    return this.texturesManager.setTextureForUnit( name, unit )
  }

  public setWireframe( enabled: boolean ) {
    this.state.drawMode = enabled ? DrawMode.Lines : DrawMode.Triangles
    this.state.drawBufferNeedsUpdate = true
  }

  public setAnimation( enabled: boolean ) {
    this.state.animationEnabled = enabled
  }

  public setUniformsState( uniforms: UniformState[] ) {
    for ( let uniform of uniforms ) {
      const name = uniform.name
      const type = uniform.type
      const value = uniform.value instanceof Array ? new Float32Array( uniform.value ) : uniform.value

      this.uniformsCache.add( name, type, value )
    }
  }

  public getErrorsAndWarnings() {
    return this.inspector.getErrorsAndWarnings()
  }

  public getUniformsEditors() {
    return this.program.usable ? Array.from( this.uniformsEditors.values() ) : []
  }

  public getUniformsState() {
    const uniformsState: UniformState[] = []

    if ( this.program.usable ) {
      for ( let [ name, editor ] of this.uniformsEditors ) {
        if ( ! editor.locked ) {
          const type = editor.type
          const rawValue = editor.getValue()
          const value = rawValue instanceof Float32Array ? Array.from( rawValue ) : rawValue
          uniformsState.push( { name, type, value } )
        }
      }
    }

    return uniformsState
  }

  public getAvailableModels() {
    const geometries = this.geometriesManager.getAvailableGeometries()
    const models: Model[] = []

    for ( let [ name, geometry ] of geometries ) {
      models.push( {
        name,
        attributes: {
          positions: geometry.hasPositions(),
          normals: geometry.hasNormals(),
          textureCoordinates: geometry.hasTextureCoordinates()
        }
      } )
    }

    return models
  }

  public getAvailableTextures() {
    return this.texturesManager.getAvailableTextures()
  }

  public getTexturesAssignedToTextureUnits() {
    return this.texturesManager.getTexturesAssignedToTextureUnits()
  }

  public getAvailableTextureUnitsCount() {
    return this.texturesManager.getAvailableTextureUnitsCount()
  }

  // ✋🏼  Metodos Privados

  private loop() {
    this.state.lastDrawTime = performance.now()

    requestAnimationFrame( now => this.render( now ) )
  }

  private render( now: number ) {
    // in case of canvas display size changes
    this.updateViewSize()

    // milisegundos -> segundos
    const timeSinceLastFrame = Math.max( 0, ( now - this.state.lastDrawTime ) * 0.001 )

    if ( this.state.animationEnabled ) {
      // cambios por unidad de tiempo
      const rotationSpeed = - 360 / 30  // 360º en 30 segundos ("-" : en sentido horarios)
      const rotationDelta = ( rotationSpeed * timeSinceLastFrame ) % 360

      // traslaciones, escalado, etc
      mat4.rotateY( this.model.modelMatrix, this.model.modelMatrix, glMatrix.toRadian( rotationDelta ) ) // ⚠️ agregar rotate a clase grafic object
    }

    if ( this.program.usable ) {
      // renderizado
      this.drawModel( this.model )

      // registro tiempo de dibujado y solicito proximo frame
      this.state.lastDrawTime = performance.now()
      requestAnimationFrame( now => this.render( now ) )
    }
  }

  private drawModel( model: BuffersGeometry ) {
    // limpiamos el canvas
    this.state.clearBuffers()

    // actualizamos matrices
    this.updateMatrices( model, this.camera )

    // seteamos uniforms por defecto
    this.updateUniformValuesFromCache( this.program.activeUniforms, this.uniformsCache )

    // reconeccion de nuevos buffers de atributos ante cambios en la geometria o programa
    if ( this.state.attributeBuffersNeedUpdate ) {
      this.updateVertexAttributes( this.program.activeVertexAttributes, model.vertexAttributesBuffers )
      this.state.attributeBuffersNeedUpdate = false
    }

    // reconeccion de buffer de indices ante cambio en modo de dibujado
    if ( this.state.drawBufferNeedsUpdate ) {
      this.updateDrawBuffer( model )
      this.state.drawBufferNeedsUpdate = false
    }

    // dibujamos
    this.state.drawBuffer.draw( this.state.drawMode )
  }

  private updateMatrices( model: BuffersGeometry, camera: Camera ) {
    // model view matrix
    mat4.multiply( model.modelViewMatrix, camera.viewMatrix, model.modelMatrix )

    // normal matrix
    mat4.invert( model.normalMatrix, model.modelViewMatrix )
    mat4.transpose( model.normalMatrix, model.normalMatrix )
  }

  private updateUniformValuesFromCache( uniforms: Map < string, Uniform >, cache: UniformsCache ) {
    for ( const [ name, info ] of uniforms ) {
      const value = cache.get( name, info.type )

      if ( value !== undefined ) {
        info.setValue( value )
      }
    }
  }

  private updateVertexAttributes( vertexAttributes: Map < string, VertexAttribute >, buffers: Map < string, VertexAttributeBuffer > ) {
    this.state.clearEnabledVertexAttributes()

    for ( const [ name, info ] of vertexAttributes ) {
      const buffer = buffers.get( name )

      if ( buffer !== undefined ) {
        buffer.bind()
        this.state.enableVertexAttribute( info.location )
        this.gl.vertexAttribPointer( info.location, buffer.itemSize, buffer.itemType, false, 0, 0 )
      }
    }

    this.state.disableUnusedVertexAttributes()
  }

  private updateDrawBuffer( model: BuffersGeometry ) {
    switch ( this.state.drawMode ) {
      case DrawMode.Lines:
        this.state.drawBuffer = model.linesIndexBuffer
        break
      case DrawMode.Triangles:
        this.state.drawBuffer = model.trianglesIndexBuffer
        break
    }

    this.state.drawBuffer.bind()
  }

  private updateUniformsCacheAndEditors( uniformsInfo: Map < string, string > ) {
    this.clearUniformsCacheAndEditors()

    for ( const [ name, type ] of uniformsInfo ) {
      if ( type in ShaderVariableType ) {
        const cachedValue = this.uniformsCache.add( name, type as ShaderVariableType )
        const locked = this.inspector.defaultUniforms.has( name )
        const uniformEditor = new UniformEditor(
          name,
          type as ShaderVariableType,
          locked,
          cachedValue
        )

        this.uniformsEditors.set( name, uniformEditor )
      }
    }
  }

  private updateViewSize() {
    // current canvas display size
    const displayWidth = Math.floor( this.canvas.clientWidth * window.devicePixelRatio )
    const displayHeight = Math.floor( this.canvas.clientHeight * window.devicePixelRatio )

    // update canvas drawing-buffer size and viewport if canvas display size changed
    if ( this.canvas.width !== displayWidth || this.canvas.height !== displayHeight ) {
      this.canvas.width = displayWidth
      this.canvas.height = displayHeight

      this.camera.setAspect( displayWidth / displayHeight )
      this.state.setViewport( displayWidth, displayHeight )
    }
  }

  private initUniformsCache( uniforms: Array < { name: string, type: ShaderVariableType, value: any } > ) {
    for ( const uniform of uniforms ) {
      this.uniformsCache.addDefault( uniform.name, uniform.type, uniform.value )
    }
  }

  private clearUniformsCacheAndEditors() {
    this.uniformsCache.clear()
    this.uniformsEditors.clear()
  }
}
