import fs from "fs-jetpack"
import path from "path"
import Worker from "worker-loader!./TexturesManager.worker" // eslint-disable-line

const TEXTURES_FOLDER = "assets/textures"
const TEXTURES_EXTENSION = "jpg"

export enum TextureType {
    color   = "color",
    normals = "normals"
}

export class TexturesManager {
    private textures: Map < string, WebGLTexture >
    private unitsTextures: Map < number, string >
    private maxTextureUnits: number
    private editingUnit: number
    private availableTextureUnits: number
    private gl: WebGLRenderingContext

    constructor( gl: WebGLRenderingContext, onTexturesLoaded: () => void ) {
        this.gl = gl
        this.textures = new Map()
        this.unitsTextures = new Map()
        this.maxTextureUnits = this.gl.getParameter( this.gl.MAX_TEXTURE_IMAGE_UNITS )
        this.editingUnit = this.maxTextureUnits - 1
        this.availableTextureUnits = this.maxTextureUnits - 1

        this.initUnitTextures()
        this.loadAvailableTextures( onTexturesLoaded )
    }

    // 👥  Metodos Publicos

    public getAvailableTextures() {
        return Array.from( this.textures.keys() )
    }

    public getAvailableTextureUnits() {
        return this.availableTextureUnits
    }

    public getTextureAssignedToUnit( unit: number ) {
        return this.unitsTextures.get( unit )
    }

    public setTextureForUnit( name: string, textureUnit: number ) {
        if ( textureUnit < this.availableTextureUnits ) {
            const texture = this.textures.get( name )

            if ( texture !== undefined ) {
                this.gl.activeTexture( this.gl.TEXTURE0 + textureUnit )
                this.gl.bindTexture( this.gl.TEXTURE_2D, texture )

                return true
            }
        }

        return false
    }

    // ✋🏼  Metodos Privados

    private initUnitTextures() {
        // creo y asigno a todas las unidades de textura una textura "en blanco"

        const defaultTexture = this.gl.createTexture() as WebGLTexture
        const defaultTextureName = "blank"

        this.setTextureAsBlank( defaultTexture )
        this.textures.set( defaultTextureName, defaultTexture )

        for ( let unitNumber = 0; unitNumber < this.availableTextureUnits; unitNumber ++ ) {
            this.unitsTextures.set( unitNumber, defaultTextureName )
            this.setTextureForUnit( defaultTextureName, unitNumber )
        }
    }

    private loadAvailableTextures( onTexturesLoaded: () => void ) {
        // cargo texturas por defecto ( ⚠️ chequear primero que exista la carpeta! )

        // paths a imagenes que el worker va a levantar (formato: "assets/textures/image.jpg")
        const texturesPaths = fs.find( __static + "/" + TEXTURES_FOLDER, {
            matching: "*" + TEXTURES_EXTENSION,
            files: true,
            directories: false,
            recursive: false
        } ).map( texturePath => TEXTURES_FOLDER + "/" + path.basename( texturePath ) )

        const worker = new Worker()
        worker.postMessage( texturesPaths )
        worker.onmessage = ( { data: imagesData } ) => {
            // creo texturas con cada imagen
            for ( let index = 0; index < texturesPaths.length; index ++ ) {
                const texturePath = texturesPaths[ index ]
                const textureName = path.basename( texturePath, "." + TEXTURES_EXTENSION )
                const image = imagesData[ index ]

                this.loadTexture( image, textureName )
            }
            onTexturesLoaded()
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

    private loadTexture( image: TexImageSource, name?: string ) {
        const newTextureName = this.getAvailableName( name )
        const newTexture = this.gl.createTexture() as WebGLTexture

        this.setTextureImage( newTexture, image )
        this.textures.set( newTextureName, newTexture )
    }

    private getAvailableName( name: string = "untitled" ) {
        let availableName = name

        availableName.trim()
        availableName.toLowerCase()

        if ( availableName === "" ) {
            availableName = "untitled"
        }

        if ( this.textures.has( availableName ) ) {
            const separator = " "

            let index = 1

            while ( this.textures.has( availableName + separator + index ) ) {
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

    private isPowerOf2( value: number ) {
        return ( value & ( value - 1 ) ) === 0
    }
}
