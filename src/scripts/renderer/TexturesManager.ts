import fs from "fs-jetpack"
import path from "path"
import Jimp from "jimp"
import Worker from "worker-loader!./TexturesManager.worker" // eslint-disable-line

const TEXTURES_FOLDER = "/assets/textures"
const TEXTURES_EXTENSION = "jpg"

interface ITextureInfo {
    name: string
    locked: boolean
}

export class TexturesManager {
    private defaultTextures: Map < string, WebGLTexture >
    private userTextures: Map < string, WebGLTexture >
    private unitsTextures: Map < number, string >
    private maxTextureUnits: number
    private editingUnit: number
    private availableTextureUnits: number
    private gl: WebGLRenderingContext

    constructor( gl: WebGLRenderingContext, onTexturesLoaded: () => void ) {
        this.gl = gl
        this.defaultTextures = new Map()
        this.userTextures = new Map()
        this.unitsTextures = new Map()
        this.maxTextureUnits = this.gl.getParameter( this.gl.MAX_TEXTURE_IMAGE_UNITS )
        this.editingUnit = this.maxTextureUnits - 1
        this.availableTextureUnits = this.maxTextureUnits - 1

        this.initTextures()
        // this.loadTextures().then( onTexturesLoaded )

        const worker = new Worker()
        worker.postMessage( "assets/textures/crate.jpg" )
        worker.onmessage = ( event ) => {
            const newTextureName = this.getAvailableName( "crate" )
            const newTexture = this.gl.createTexture() as WebGLTexture

            this.setTextureImage( newTexture, event.data )
            this.defaultTextures.set( newTextureName, newTexture )

            onTexturesLoaded()
        }
    }

    // 👥  Metodos Publicos

    public getAvailableTexturesInfo() {
        const texturesInfo: ITextureInfo[] = []

        for ( const [ name, geometry ] of this.defaultTextures ) {
            texturesInfo.push( { name, locked: true } )
        }

        for ( const [ name, geometry ] of this.userTextures ) {
            texturesInfo.push( { name, locked: false } )
        }

        return texturesInfo
    }

    public getTextureAssignedToUnit( unit: number ) {
        return this.unitsTextures.get( unit )
    }

    public setTextureForUnit( name: string, textureUnit: number ) {
        if ( textureUnit < this.availableTextureUnits ) {
            const texture = this.defaultTextures.get( name ) || this.userTextures.get( name )

            if ( texture !== undefined ) {
                this.gl.activeTexture( this.gl.TEXTURE0 + textureUnit )
                this.gl.bindTexture( this.gl.TEXTURE_2D, texture )

                return true
            }
        }

        return false
    }

    public add( image: TexImageSource, name?: string ) {
        const newTextureName = this.getAvailableName( name )
        const newTexture = this.gl.createTexture() as WebGLTexture

        this.setTextureImage( newTexture, image )
        this.userTextures.set( newTextureName, newTexture )
    }

    // ✋🏼  Metodos Privados

    private getAvailableName( name: string = "untitled" ) {
        let availableName = name

        availableName.trim()
        availableName.toLowerCase()

        if ( availableName === "" ) {
            availableName = "untitled"
        }

        if ( this.userTextures.has( availableName ) || this.defaultTextures.has( availableName ) ) {
            const separator = " "

            let index = 1

            while ( this.userTextures.has( availableName + separator + index ) ) {
                index ++
            }

            availableName += separator + index
        }

        return availableName
    }

    private setTextureImage( texture: WebGLTexture, image: TexImageSource ) {
        this.gl.activeTexture( this.gl.TEXTURE0 + this.editingUnit )
        this.gl.bindTexture( this.gl.TEXTURE_2D, texture )

        const level = 0
        const internalFormat = this.gl.RGB
        const srcFormat = this.gl.RGB
        const srcType = this.gl.UNSIGNED_BYTE

        this.gl.texImage2D( this.gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image )

        if ( this.isPowerOf2( image.width ) && this.isPowerOf2( image.height ) ) { // 📝 convertir a potencia de dos
            this.gl.generateMipmap( this.gl.TEXTURE_2D )
            this.gl.texParameteri( this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR )
        } else {
            this.gl.texParameteri( this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE )
            this.gl.texParameteri( this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE )
            this.gl.texParameteri( this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR )
        }
    }

    private setTextureAsBlank( texture: WebGLTexture ) {
        this.gl.activeTexture( this.gl.TEXTURE0 + this.editingUnit )
        this.gl.bindTexture( this.gl.TEXTURE_2D, texture )

        const level = 0
        const width = 1
        const height = 1
        const border = 0
        const internalFormat = this.gl.RGBA
        const srcFormat = this.gl.RGBA
        const srcType = this.gl.UNSIGNED_BYTE
        const pixel = new Uint8Array( [ 200, 200, 200, 255 ] )

        this.gl.texImage2D( this.gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel )
    }

    private initTextures() {
        // creo y asigno a todas las unidades de textura una textura "en blanco"

        const defaultTexture = this.gl.createTexture() as WebGLTexture
        const defaultTextureName = "blank"

        this.setTextureAsBlank( defaultTexture )
        this.defaultTextures.set( defaultTextureName, defaultTexture )

        for ( let unitNumber = 0; unitNumber < this.availableTextureUnits; unitNumber ++ ) {
            this.unitsTextures.set( unitNumber, defaultTextureName )
            this.setTextureForUnit( defaultTextureName, unitNumber )
        }
    }

    private async loadTextures() {
        // cargo texturas por defecto ( ⚠️ chequear primero que exista la carpeta! )
        // const availableTexturesFiles = fs.find( __static + TEXTURES_FOLDER, {
        //     matching: "*" + TEXTURES_EXTENSION,
        //     files: true,
        //     directories: false,
        //     recursive: false
        // } ).map( texturePath => path.basename( texturePath ) )

        // const image = await Jimp.read( "assets/textures/crate.jpg" )

        // const data = new Uint8ClampedArray( image.bitmap.data )
        // const imageData = new ImageData( data, image.bitmap.width, image.bitmap.height )

        // const newTextureName = this.getAvailableName( "crate" )
        // const newTexture = this.gl.createTexture() as WebGLTexture

        // this.setTextureImage( newTexture, imageData )
        // this.defaultTextures.set( newTextureName, newTexture )
    }

    private isPowerOf2( value: number ) {
        return ( value & ( value - 1 ) ) === 0
    }
}
