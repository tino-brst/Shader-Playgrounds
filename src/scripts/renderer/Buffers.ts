import { DrawMode } from "./_constants"

export class Buffer {

    public bufferObject: WebGLBuffer
    public type: number
    public itemSize: ValidItemSize
    public itemType: number
    public itemCount: number
    protected gl: WebGLRenderingContext

    constructor( gl: WebGLRenderingContext, bufferType: number, itemSize: ValidItemSize, itemType: number ) {

        this.gl = gl
        this.bufferObject = gl.createBuffer() as WebGLBuffer
        this.type = bufferType
        this.itemSize = itemSize
        this.itemType = itemType
        this.itemCount = 0

    }

    // 👥  Metodos Publicos

    public bind() {

        this.gl.bindBuffer( this.type, this.bufferObject )

        return this

    }

    public unbind() {

        this.gl.bindBuffer( this.type, null )

        return this

    }

    public setData( array: TypedArray, itemSize?: ValidItemSize ) {

        this.itemSize = ( itemSize !== undefined ) ? itemSize : this.itemSize

        this.itemCount = array.length / this.itemSize

        this.gl.bindBuffer( this.type, this.bufferObject )
        this.gl.bufferData( this.type, array, this.gl.STATIC_DRAW )
        this.gl.bindBuffer( this.type, null )

    }

}

export class VertexAttributeBuffer extends Buffer {

    constructor( gl: WebGLRenderingContext, array: Float32Array, itemSize: ValidItemSize ) {

        const bufferType = gl.ARRAY_BUFFER
        const itemType = gl.FLOAT

        super( gl, bufferType, itemSize , itemType )

        this.setData( array )

    }

}

export class IndexBuffer extends Buffer {

    constructor( gl: WebGLRenderingContext, array: Uint16Array = new Uint16Array( [] ) ) {

        const bufferType = gl.ELEMENT_ARRAY_BUFFER
        const itemSize = 1
        const itemType = gl.UNSIGNED_SHORT

        super( gl, bufferType, itemSize, itemType )

        this.setData( array )

    }

    public draw( mode: DrawMode ) {

        switch ( mode ) {

            case DrawMode.Lines:

                this.gl.drawElements( this.gl.LINES, this.itemCount, this.itemType, 0 )

                break

            case DrawMode.Triangles:

                this.gl.drawElements( this.gl.TRIANGLES, this.itemCount, this.itemType, 0 )

                break

        }

    }

}