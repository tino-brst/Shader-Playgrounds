export interface IVertexOptionals {
    normalIndex?: number
    textureCoordinatesIndex?: number
}

export class Vertex {
    public positionIndex: number
    public normalIndex: number | undefined
    public textureCoordinatesIndex: number | undefined

    constructor( positionIndex: number, optionals?: IVertexOptionals ) {
        this.positionIndex = positionIndex

        optionals = optionals || {}
        this.normalIndex = optionals.normalIndex
        this.textureCoordinatesIndex = optionals.textureCoordinatesIndex
    }

    public static toString( positionIndex: number, optionals?: IVertexOptionals ) {
        optionals = optionals || {}

        const vertexValues = []

        vertexValues.push( positionIndex )
        vertexValues.push( optionals.textureCoordinatesIndex )
        vertexValues.push( optionals.normalIndex )

        return vertexValues.join( "/" )
    }
}
