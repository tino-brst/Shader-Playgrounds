import { IndexBuffer } from "./Buffers"
import { DrawMode } from "./_constants"

export class RendererState {

    public lastDrawTime!: number
    public drawBuffer!: IndexBuffer
    public drawMode: DrawMode
    public animationsEnabled: boolean
    public drawBufferNeedsUpdate: boolean
    public attributeBuffersNeedUpdate: boolean
    private currentlyEnabledVertexAttributes: Set < number >
    private previouslyEnabledVertexAttributes: Set < number >
    private gl: WebGLRenderingContext

    constructor( gl: WebGLRenderingContext ) {

        this.gl = gl
        this.currentlyEnabledVertexAttributes = new Set()
        this.previouslyEnabledVertexAttributes = new Set()
        this.drawMode = DrawMode.Triangles
        this.drawBufferNeedsUpdate = true
        this.attributeBuffersNeedUpdate = true
        this.animationsEnabled = true

        this.gl.clearColor( 0.08, 0.08, 0.08, 1 )
        this.gl.pixelStorei( this.gl.UNPACK_FLIP_Y_WEBGL, 1 )
        this.gl.enable( this.gl.DEPTH_TEST )
        this.gl.enable( this.gl.CULL_FACE )

    }

    public clearEnabledVertexAttributes() {

        this.previouslyEnabledVertexAttributes = this.currentlyEnabledVertexAttributes
        this.currentlyEnabledVertexAttributes = new Set()

    }

    public enableVertexAttribute( location: number ) {

        if ( ! this.currentlyEnabledVertexAttributes.has( location ) ) {

            this.currentlyEnabledVertexAttributes.add( location )

            if ( ! this.previouslyEnabledVertexAttributes.has( location ) ) {

                this.gl.enableVertexAttribArray( location )

            }

        }

    }

    public disableUnusedVertexAttributes() {

        for ( const location of this.previouslyEnabledVertexAttributes ) {

            if ( ! this.currentlyEnabledVertexAttributes.has( location ) ) {

                this.gl.disableVertexAttribArray( location )

            }

        }

    }

    public clearBuffers() {

        this.gl.clear( this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT )

    }

    public setViewport( width: number, height: number ) {

        this.gl.viewport( 0, 0, width, height )

    }

}