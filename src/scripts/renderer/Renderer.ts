import { BuffersGeometry } from "./BuffersGeometry"
import { Camera } from "./Camera"
import { CameraOrbitControls } from "./CameraOrbitControls"
import { GeometriesManager } from "./GeometriesManager"
import { Inspector } from "./Inspector"
import { mat4, glMatrix } from "gl-matrix"
import { Program } from "./Program"
import { RendererState } from "./RendererState"
import { ShaderVariableType, DrawMode } from "./_constants"
import { TexturesManager } from "./TexturesManager"
import { UniformEditor } from "./UniformEditor"
import { UniformsCache, UniformState } from "./UniformsCache"
import { VertexAttribute, Uniform } from "./ShaderInputs"
import { VertexAttributeBuffer } from "./Buffers"
import defaultFragmentShaderSource from "./defaults/default.frag.glsl"
import defaultVertexShaderSource from "./defaults/default.vert.glsl"

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
        this.gl = this.canvas.getContext( "webgl" ) as WebGLRenderingContext

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

        const defaultUniforms: Array < [ string, ShaderVariableType, any ] > = [
            [ "modelMatrix", ShaderVariableType.mat4, this.model.modelMatrix ],
            [ "modelViewMatrix", ShaderVariableType.mat4, this.model.modelViewMatrix ],
            [ "normalMatrix", ShaderVariableType.mat4, this.model.normalMatrix ],
            [ "viewMatrix", ShaderVariableType.mat4, this.camera.viewMatrix ],
            [ "projectionMatrix", ShaderVariableType.mat4, this.camera.projectionMatrix ]
        ]

        // cache de uniforms

        this.uniformsCache = new UniformsCache()
        this.initUniformsCache( defaultUniforms )

        // inspector de programa

        this.inspector = new Inspector()
        this.initInspector( this.model, defaultUniforms )

        // editores de uniforms

        this.uniformsEditors = new Map()

        // tamaño inicial del viewport / aspect de la camara / etc

        this.updateSize()

        // modelo por defecto

        this.setModel( "cube" )
    }

    // 👥  Metodos Publicos

    public setShaderProgram( vertexSaderSource: string, fragmentShaderSource: string ) {
        const programWasUsable = this.program.usable

        this.program.setShadersSourceAndLink( vertexSaderSource, fragmentShaderSource )

        if ( this.program.usable ) {
            this.program.use()
            this.updateUniformsCacheAndEditors( this.inspector.getUniformsInfo( this.program ) )
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

    public setModel( name: string ) {
        const geometry = this.geometriesManager.getGeometry( name )

        if ( geometry !== undefined ) {
            this.model.updateBuffersFromGeometry( geometry )
            this.updateInspectorAvailableVertexAttributes( this.model.vertexAttributesBuffers )
            this.inspector.checkForErrorsAndWarnings( this.program )

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
        return this.inspector.checkForErrorsAndWarnings( this.program )
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

    // ✋🏼  Metodos Privados

    private loop() {
        this.state.lastDrawTime = performance.now()

        requestAnimationFrame( now => this.animate( now ) )
    }

    private animate( now: number ) {

        requestAnimationFrame( now => this.animate( now ) )

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
            this.render( this.model )

            // registro tiempo de dibujado y solicito proximo frame
            this.state.lastDrawTime = performance.now()
        }
    }

    private render( model: BuffersGeometry ) {
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

    private updateInspectorAvailableVertexAttributes( buffers: Map < string, VertexAttributeBuffer > ) {
        this.inspector.availableVertexAttributes.clear()

        for ( const [ name, buffer ] of buffers ) {
            const type = ( buffer.itemSize === 2 ) ? ShaderVariableType.vec2 : ShaderVariableType.vec3

            this.inspector.availableVertexAttributes.set( name, type )
        }
    }

    private updateSize() {
        const displayWidth = Math.floor( this.canvas.clientWidth * window.devicePixelRatio )
        const displayHeight = Math.floor( this.canvas.clientHeight * window.devicePixelRatio )

        this.canvas.width = displayWidth
        this.canvas.height = displayHeight

        this.camera.setAspect( displayWidth / displayHeight )
        this.state.setViewport( displayWidth, displayHeight )
    }

    private initUniformsCache( defaultUniforms: Array < [ string, ShaderVariableType, any ] > ) {
        for ( const uniform of defaultUniforms ) {
            const name  = uniform[ 0 ]
            const type  = uniform[ 1 ]
            const value = uniform[ 2 ]

            this.uniformsCache.addDefault( name, type, value )
        }
    }

    private initInspector( geometry: BuffersGeometry, defaultUniforms: Array < [ string, ShaderVariableType, any ] > ) {
        for ( const uniform of defaultUniforms ) {
            const name  = uniform[ 0 ]
            const type  = uniform[ 1 ]

            this.inspector.defaultUniforms.set( name, type )
        }

        this.updateInspectorAvailableVertexAttributes( geometry.vertexAttributesBuffers )
    }

    private clearUniformsCacheAndEditors() {
        this.uniformsCache.clear()
        this.uniformsEditors.clear()
    }
}
