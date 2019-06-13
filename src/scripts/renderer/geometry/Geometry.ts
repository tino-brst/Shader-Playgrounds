import { Face } from "./Face"
import { vec2, vec3 } from "gl-matrix"
import { VertexAttributeArray, IndexArray } from "./GeometryArrays"
import { Vertex, IVertexOptionals } from "./Vertex"

export class Geometry {
  public vertices: Vertex[]
  public vertexPositions: vec3[]
  public vertexNormals: vec3[]
  public vertexTextureCoordinates: vec2[]
  public faces: Face[]
  public vertexAttributesArrays!: Map < string, VertexAttributeArray >
  public trianglesIndexArray!: IndexArray
  public linesIndexArray!: IndexArray

  constructor( geometryData?: string ) {
    this.vertices = []
    this.vertexPositions = []
    this.vertexNormals = []
    this.vertexTextureCoordinates = []
    this.faces = []

    if ( geometryData ) {
      this.parseOBJ( geometryData )

      if ( ! this.hasNormals() ) {
        this.computePerFaceVertexNormals()
      }

      this.normalize()

      this.loadArrays()
    }
  }

  public addVertexPosition( x: number, y: number, z: number ) {
    this.vertexPositions.push( vec3.fromValues( x, y, z ) )

    return this
  }

  public addVertexNormal( x: number, y: number, z: number ) {
    this.vertexNormals.push( vec3.fromValues( x, y, z ) )

    return this
  }

  public addVertexTextureCoordinates( x: number, y: number ) {
    this.vertexTextureCoordinates.push( vec2.fromValues( x, y ) )

    return this
  }

  public addVertex( positionIndex: number, optionals?: IVertexOptionals ) {
    this.vertices.push( new Vertex( positionIndex, optionals ) )

    return this
  }

  public addFace( vertexAIndex: number, vertexBIndex: number, vertexCIndex: number ) {
    this.faces.push( new Face( vertexAIndex, vertexBIndex, vertexCIndex ) )

    return this
  }

  public computePerFaceVertexNormals() {
    // console.time( "computePerFaceVertexNormals" )

    const newVertices = []

    const alreadyAddedVertices: Map < string, number > = new Map()
    const alreadyAddedNormals: Map < string, number > = new Map()

    this.vertexNormals = []

    for ( const face of this.faces ) {
      // calculo de normal

      const vertexPositionA = this.vertexPositions[ this.vertices[ face.verticesIndices[ 0 ] ].positionIndex ]
      const vertexPositionB = this.vertexPositions[ this.vertices[ face.verticesIndices[ 1 ] ].positionIndex ]
      const vertexPositionC = this.vertexPositions[ this.vertices[ face.verticesIndices[ 2 ] ].positionIndex ]

      const faceNormal = Face.computeFaceNormal( vertexPositionA, vertexPositionB, vertexPositionC )
      const faceNormalString = faceNormal.toString()

      let faceNormalIndex = alreadyAddedNormals.get( faceNormalString )

      if ( faceNormalIndex === undefined ) {
        // @ts-ignore
        this.addVertexNormal( ...faceNormal )
        faceNormalIndex = this.vertexNormals.length - 1
        alreadyAddedNormals.set( faceNormalString, faceNormalIndex )
      }

      // generacion de nuevos vertices ( manteniendo info de posicion y textura y reemplazando la normal )

      const newVerticesIndices = []

      for ( const vertexIndex of face.verticesIndices ) {
        const vertex = this.vertices[ vertexIndex ]

        const normalIndex = faceNormalIndex
        const positionIndex = vertex.positionIndex
        const textureCoordinatesIndex = vertex.textureCoordinatesIndex

        const vertexIndicesString = Vertex.toString( positionIndex, { normalIndex, textureCoordinatesIndex } )

        let newVertexIndex = alreadyAddedVertices.get( vertexIndicesString )

        if ( newVertexIndex === undefined ) {
          const newVertex = new Vertex( positionIndex, { normalIndex, textureCoordinatesIndex } )
          newVertices.push( newVertex )
          newVertexIndex = newVertices.length - 1
          alreadyAddedVertices.set( vertexIndicesString, newVertexIndex )
        }

        newVerticesIndices.push( newVertexIndex )
      }

      face.verticesIndices = newVerticesIndices
    }

    this.vertices = newVertices

    // console.timeEnd( "computePerFaceVertexNormals" )

    return this
  }

  public center() {  // 🚧  Pasar a modelo de Bounding Sphere
    let xValuesSum = 0
    let yValuesSum = 0
    let zValuesSum = 0

    for ( const position of this.vertexPositions ) {
      xValuesSum += position[ 0 ]
      yValuesSum += position[ 1 ]
      zValuesSum += position[ 2 ]
    }

    const xValuesAverage = xValuesSum / this.vertexPositions.length
    const yValuesAverage = yValuesSum / this.vertexPositions.length
    const zValuesAverage = zValuesSum / this.vertexPositions.length

    const center = vec3.fromValues( xValuesAverage, yValuesAverage, zValuesAverage )

    for ( const position of this.vertexPositions ) {
      vec3.subtract( position, position, center )
    }
  }

  public normalize() {  // 🚧  Pasar a modelo de Bounding Sphere
    // console.time( "normalize" )

    this.center()

    let largestDistance = 0

    for ( const position of this.vertexPositions ) {
      const distanceToOrigin = vec3.length( position )

      if ( distanceToOrigin > largestDistance ) {
        largestDistance = distanceToOrigin
      }
    }

    const scaleFactor = 1 / largestDistance

    for ( const position of this.vertexPositions ) {
      vec3.scale( position, position, scaleFactor )
    }

    // console.timeEnd( "normalize" )
  }

  public hasPositions() {
    return this.vertexPositions.length > 0
  }

  public hasNormals() {
    return this.vertexNormals.length > 0
  }

  public hasTextureCoordinates() {
    return this.vertexTextureCoordinates.length > 0
  }

  protected loadArrays() {
    // console.time( "loadArrays" )

    if ( this.vertices.length > ( Math.pow( 2, 16 ) ) ) {
      console.warn( "Indices data can't be stored on array of type Uint16Array" )
    }

    // atributos de vertices

    this.vertexAttributesArrays = new Map()

    const positionsData: number[] = []
    const normalsData: number[] = []
    const textureCoordinatesData: number[] = []

    if ( this.hasPositions() ) {
      for ( const vertex of this.vertices ) {
        positionsData.push( ...this.vertexPositions[ vertex.positionIndex ] )
      }

      this.vertexAttributesArrays.set( "vertexPosition", new VertexAttributeArray( positionsData, 3 ) )
    }

    if ( this.hasNormals() ) {
      for ( const vertex of this.vertices ) {
        normalsData.push( ...this.vertexNormals[ vertex.normalIndex as number ] )
      }

      this.vertexAttributesArrays.set( "vertexNormal", new VertexAttributeArray( normalsData, 3 ) )
    }

    if ( this.hasTextureCoordinates() ) {
      for ( const vertex of this.vertices ) {
        textureCoordinatesData.push( ...this.vertexTextureCoordinates[ vertex.textureCoordinatesIndex as number ] )
      }

      this.vertexAttributesArrays.set( "vertexTextureCoordinates", new VertexAttributeArray( textureCoordinatesData, 2 ) )
    }

    // indice para dibujo con gl.TRIANGLES

    const trianglesIndexData: number[] = []

    for ( const face of this.faces ) {
      trianglesIndexData.push( ...face.verticesIndices )
    }

    this.trianglesIndexArray = new IndexArray( trianglesIndexData )

    // indice para dibujo con gl.LINES

    const linesIndexData: number[] = []
    const alreadyAddedLines: Set < string > = new Set()

    for ( const face of this.faces ) {
      for ( let i = 0; i < Face.verticesCount; i ++ ) {
        const a = face.verticesIndices[ i ]
        const b = face.verticesIndices[ ( i + 1 ) % Face.verticesCount ]

        if ( ! alreadyAddedLines.has( `${ a }_${ b }` ) ) {
          linesIndexData.push( a )
          linesIndexData.push( b )

          alreadyAddedLines.add( `${ a }_${ b }` )
          alreadyAddedLines.add( `${ b }_${ a }` )
        }
      }
    }

    this.linesIndexArray = new IndexArray( linesIndexData )

    // console.timeEnd( "loadArrays" )
  }

  protected parseOBJ( geometryData: string ) {
    // console.time( "parseOBJ" )

    const alreadyAddedVertices: Map < string, number > = new Map()

    const lines = geometryData.split( "\n" )
    const splitLines = lines.map( line => line.split( " " ) )  // "v 1 2 3" -> [ "v", "1", "2", "3" ]

    const vertexPositionsLines          = splitLines.filter( line => line[0] === "v" )
    const vertexNormalsLines            = splitLines.filter( line => line[0] === "vn" )
    const vertexTextureCoordinatesLines = splitLines.filter( line => line[0] === "vt" )
    const facesLines                    = splitLines.filter( line => line[0] === "f" )

    for ( const line of vertexPositionsLines ) {
      const a = parseFloat( line[ 1 ] )
      const b = parseFloat( line[ 2 ] )
      const c = parseFloat( line[ 3 ] )

      this.addVertexPosition( a, b, c )
    }

    for ( const line of vertexNormalsLines ) {
      const a = parseFloat( line[ 1 ] )
      const b = parseFloat( line[ 2 ] )
      const c = parseFloat( line[ 3 ] )

      this.addVertexNormal( a, b, c )
    }

    for ( const line of vertexTextureCoordinatesLines ) {
      const a = parseFloat( line[ 1 ] )
      const b = parseFloat( line[ 2 ] )

      this.addVertexTextureCoordinates( a, b )
    }

    for ( const line of facesLines ) {
      line.splice( 0, 1 )  // [ "f", "1/1/1", "2/2/2", ... ] -> [ "1/1/1", "2/2/2", ... ]

      const verticesIndices: number[] = []

      for ( const vertexIndicesString of line ) {
        let vertexIndex = alreadyAddedVertices.get( vertexIndicesString )

        if ( vertexIndex === undefined ) {
          const vertexIndicesStrings = vertexIndicesString.split( "/" )  // "1/1/1" -> [ "1", "1", "1" ]
          const vertexIndices = vertexIndicesStrings.map( index => parseInt( index ) )

          const positionIndex           = vertexIndices[ 0 ] - 1
          const textureCoordinatesIndex = isNaN( vertexIndices[ 1 ] ) ? undefined : vertexIndices[ 1 ] - 1
          const normalIndex             = isNaN( vertexIndices[ 2 ] ) ? undefined : vertexIndices[ 2 ] - 1

          const vertex = new Vertex( positionIndex, { normalIndex, textureCoordinatesIndex } )
          this.vertices.push( vertex )
          vertexIndex = this.vertices.length - 1
          alreadyAddedVertices.set( vertexIndicesString, vertexIndex )
        }

        verticesIndices.push( vertexIndex )
      }

      // @ts-ignore
      this.addFace( ...verticesIndices )
    }

    // console.timeEnd( "parseOBJ" )
  }
}
