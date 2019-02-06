import { ShaderVariableType } from "./_constants"
import { ShaderInput } from "./ShaderInputs"

export interface IValueReference {
    value: any
}

export class UniformsCache {

    private defaults: Map < string, IValueReference >
    private previousContent: Map < string, IValueReference >
    private currentContent: Map < string, IValueReference >

    constructor() {

        this.defaults = new Map()
        this.previousContent = new Map()
        this.currentContent = new Map()

        /*
		 * • Content
		 * "modelMatrix:mat4" -> { value: ... }
		 * "color:vec3"       -> { value: ... }
		 *  ...
		 */

    }

    // 👥  Metodos Publicos

    public add( name: string, type: ShaderVariableType ) {

        const key = this.toString( name, type )

        let value

        const defaultValue = this.defaults.get( key )

        if ( defaultValue !== undefined ) {

            value = defaultValue.value

        } else {

            const previousValue = this.previousContent.get( key )

            if ( previousValue !== undefined ) {

                value = previousValue.value

            } else {

                value = ShaderInput.getDefaultValueForType( type )

            }

        }

        const cachedValue = { value }

        this.currentContent.set( key, cachedValue )

        return cachedValue

    }

    public get( name: string, type: ShaderVariableType ) {

        const cachedValue = this.currentContent.get( this.toString( name, type ) )

        return ( cachedValue !== undefined ) ? cachedValue.value : undefined

    }

    public addDefault( name: string, type: ShaderVariableType, value: any ) {

        this.defaults.set( this.toString( name, type ), { value } )

    }

    public clear() {

        this.previousContent = this.currentContent
        this.currentContent = new Map()

    }

    // ✋🏼  Metodos Privados

    private toString( name: string, type: ShaderVariableType ) {

        return `${ name }:${ type }`

    }

}