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
import { UniformsCache } from "./UniformsCache"
import { VertexAttribute, Uniform } from "./ShaderInputs"
import { VertexAttributeBuffer } from "./Buffers"
import defaultFragmentShaderSource from "./default_shaders/default.frag.glsl"
import defaultVertexShaderSource from "./default_shaders/default.vert.glsl"

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

    constructor( canvas: HTMLCanvasElement, onTexturesLoaded: ( textures: string[] ) => void ) {
        // setup del canvas y contexto WebGL

        this.canvas = canvas
        this.gl = this.canvas.getContext( "webgl" ) as WebGLRenderingContext

        // seguimiento de estado ( valores que se mantienen de un loop al siguiente )

        this.state = new RendererState( this.gl )

        // asset managers

        this.geometriesManager = new GeometriesManager()
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

        // modelo y shaders por defecto

        this.setModel( "cube" )
        this.setShaderProgram( defaultVertexShaderSource, defaultFragmentShaderSource )
    }

    // 👥  Metodos Publicos

    public setShaderProgram( vertexSaderSource: string, fragmentShaderSource: string ) {
        const programWasUsable = this.program.usable

        this.program.setShadersSourceAndLink( vertexSaderSource, fragmentShaderSource )
        this.clearUniformsCacheAndEditors()

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
        const geometry = this.geometriesManager.get( name )

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

    public setTextureForUnit( name: string, textureUnit: number ) {
        return this.texturesManager.setTextureForUnit( name, textureUnit )
    }

    public setWireframe( enabled: boolean ) {
        this.state.drawMode = enabled ? DrawMode.Lines : DrawMode.Triangles
        this.state.drawBufferNeedsUpdate = true
    }

    public setAnimations( enabled: boolean ) {
        this.state.animationsEnabled = enabled
    }

    public addModel( data: string, name?: string ) {
        this.geometriesManager.add( data, name )
    }

    public addTexture( image: HTMLImageElement, name?: string ) {
        this.texturesManager.add( image, name )
    }

    public getErrorsAndWarnings() {
        return this.inspector.checkForErrorsAndWarnings( this.program )
    }

    public getUniformsEditors() {
        return this.uniformsEditors
    }

    public getAvailableModels() {
        return this.geometriesManager.getAvailableGeometriesInfo()
    }

    public getAvailableTextures() {
        return this.texturesManager.getAvailableTexturesInfo()
    }

    // ✋🏼  Metodos Privados

    private loop() {
        this.state.lastDrawTime = performance.now()

        requestAnimationFrame( now => this.animate( now ) )
    }

    private animate( now: number ) {
        if ( this.state.animationsEnabled ) {
            // cambios por unidad de tiempo

            const timeDelta = Math.max( 0, ( now - this.state.lastDrawTime ) / 1000 )  // milisegundos -> segundos
            const rotationSpeed = - 360 / 30                                     // 360º en 30 segundos ("-" : en sentido horarios)
            const rotationDelta = ( rotationSpeed * timeDelta ) % 360

            // traslaciones, escalado, etc

            mat4.rotateY( this.model.modelMatrix, this.model.modelMatrix, glMatrix.toRadian( rotationDelta ) ) // ⚠️ agregar rotate a clase grafic object
        }

        // renderizado

        this.render( this.model )
    }

    private render( model: BuffersGeometry ) {
        if ( this.program.usable ) {
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

            // registro tiempo de dibujado y solicito proximo frame

            this.state.lastDrawTime = performance.now()

            requestAnimationFrame( now => this.animate( now ) )
        }
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
        const width = this.canvas.clientWidth
        const height = this.canvas.clientHeight

        this.canvas.width = width
        this.canvas.height = height

        this.camera.setAspect( width / height )
        this.state.setViewport( width, height )
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
