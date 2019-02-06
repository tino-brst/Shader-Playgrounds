export class GeometryArray {

    public array: TypedArray
    public itemSize: ValidItemSize
    public itemCount: number

    constructor( array: TypedArray, itemSize: ValidItemSize ) {

        this.array = array
        this.itemSize = itemSize
        this.itemCount = array.length / itemSize

    }

}

export class VertexAttributeArray extends GeometryArray {

    public array!: Float32Array

    constructor( array: number[], itemSize: ValidItemSize ) {

        super( new Float32Array( array ), itemSize )

    }

}

export class IndexArray extends GeometryArray {

    public array!: Uint16Array

    constructor( array: number[] ) {

        super( new Uint16Array( array ), 1 )

    }

}