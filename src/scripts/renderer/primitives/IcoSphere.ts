import { Geometry } from "../geometry/Geometry"
import { vec3 } from "gl-matrix"

export class IcoSphere extends Geometry {
    constructor( radius: number = 1 ) {
        super()

        const t = ( 1 + Math.sqrt( 5 ) ) / 2

        this.addVertexPosition( - 1, t, 0 )
            .addVertexPosition( 1, t, 0 )
            .addVertexPosition( - 1, - t, 0 )
            .addVertexPosition( 1, - t, 0 )
            .addVertexPosition( 0, - 1, t )
            .addVertexPosition( 0, 1, t )
            .addVertexPosition( 0, - 1, - t )
            .addVertexPosition( 0, 1, - t )
            .addVertexPosition( t, 0, - 1 )
            .addVertexPosition( t, 0, 1 )
            .addVertexPosition( - t, 0, - 1 )
            .addVertexPosition( - t, 0, 1 )

        this.addVertex( 0 )
            .addVertex( 1 )
            .addVertex( 2 )
            .addVertex( 3 )
            .addVertex( 4 )
            .addVertex( 5 )
            .addVertex( 6 )
            .addVertex( 7 )
            .addVertex( 8 )
            .addVertex( 9 )
            .addVertex( 10 )
            .addVertex( 11 )

        this.addFace( 0, 11, 5 )
            .addFace( 0, 5, 1 )
            .addFace( 0, 1, 7 )
            .addFace( 0, 7, 10 )
            .addFace( 0, 10, 11 )
            .addFace( 1, 5, 9 )
            .addFace( 5, 11, 4 )
            .addFace( 11, 10, 2 )
            .addFace( 10, 7, 6 )
            .addFace( 7, 1, 8 )
            .addFace( 3, 9, 4 )
            .addFace( 3, 4, 2 )
            .addFace( 3, 2, 6 )
            .addFace( 3, 6, 8 )
            .addFace( 3, 8, 9 )
            .addFace( 4, 9, 5 )
            .addFace( 2, 4, 11 )
            .addFace( 6, 2, 10 )
            .addFace( 8, 6, 7 )
            .addFace( 9, 8, 1 )

        this.computePerFaceVertexNormals()

        // incrementar recursivamente el numero de caras a partir del numero de 'subdivisiones'
        // 🔁

        this.vertexPositions.forEach( ( position ) => {
            vec3.normalize( position, position )
            vec3.scale( position, position, radius )
        } )

        this.loadArrays()
    }
}
