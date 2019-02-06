import { vec3, mat4 } from "gl-matrix"

export abstract class GraphicObject {

    public modelMatrix: mat4
    public modelViewMatrix: mat4
    public normalMatrix: mat4

    public position: vec3
    public scale: vec3

    constructor() {

        this.modelMatrix = mat4.create()
        this.modelViewMatrix = mat4.create()
        this.normalMatrix = mat4.create()

        this.position = vec3.fromValues( 0, 0, 0 )
        this.scale = vec3.fromValues( 1, 1, 1 )

    }

    public setPosition( x: number, y: number, z: number ) {

        vec3.set( this.position, x, y, z )

        this.updateModelMatrix()

        return this

    }

    public translate( x: number, y: number, z: number ) {

        const position = this.position

        this.setPosition( position[ 0 ] + x, position[ 1 ] + y, position[ 2 ] + z )

        return this

    }

    public translateX( distance: number ) {

        this.translate( distance, 0, 0 )

        return this

    }

    public translateY( distance: number ) {

        this.translate( 0, distance, 0 )

        return this

    }

    public translateZ( distance: number ) {

        this.translate( 0, 0, distance )

        return this

    }

    public resize( value: number ) {

        vec3.scale( this.scale, this.scale, value )

        this.updateModelMatrix()

        return this

    }

    protected updateModelMatrix() {

        mat4.identity( this.modelMatrix )
        mat4.translate( this.modelMatrix, this.modelMatrix, this.position )
        mat4.scale( this.modelMatrix, this.modelMatrix, this.scale )

    }

}