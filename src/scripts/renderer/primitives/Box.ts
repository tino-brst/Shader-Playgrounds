import { Geometry } from "../geometry/Geometry"

export class Box extends Geometry {

    constructor( width: number = 2, height: number = 2, depth: number = 2 ) {

        super()

        const halfWidth  = width  / 2
        const halfHeight = height / 2
        const halfDepth  = depth  / 2

        this.addVertexPosition( - halfWidth, halfHeight, halfDepth )
            .addVertexPosition( halfWidth, halfHeight, halfDepth )
            .addVertexPosition( halfWidth, halfHeight, - halfDepth )
            .addVertexPosition( - halfWidth, halfHeight, - halfDepth )
            .addVertexPosition( - halfWidth, - halfHeight, halfDepth )
            .addVertexPosition( halfWidth, - halfHeight, halfDepth )
            .addVertexPosition( halfWidth, - halfHeight, - halfDepth )
            .addVertexPosition( - halfWidth, - halfHeight, - halfDepth )

        this.addVertex( 0 )
            .addVertex( 1 )
            .addVertex( 2 )
            .addVertex( 3 )
            .addVertex( 4 )
            .addVertex( 5 )
            .addVertex( 6 )
            .addVertex( 7 )

        this.addFace( 0, 1, 2 )
            .addFace( 0, 2, 3 )
            .addFace( 4, 1, 0 )
            .addFace( 4, 5, 1 )
            .addFace( 5, 6, 2 )
            .addFace( 5, 2, 1 )
            .addFace( 6, 7, 3 )
            .addFace( 6, 3, 2 )
            .addFace( 7, 4, 0 )
            .addFace( 7, 0, 3 )
            .addFace( 4, 7, 6 )
            .addFace( 4, 6, 5 )

        // this.computePerFaceVertexNormals()

        this.loadArrays()

    }

}