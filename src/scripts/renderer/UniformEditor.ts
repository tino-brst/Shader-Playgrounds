import { ShaderVariableType } from "./_constants"
import { IValueReference } from "./UniformsCache"

export class UniformEditor {

    public target: string
    public type: ShaderVariableType
    public locked: boolean
    public setValue: ( value: any ) => void
    private cachedValueReference: IValueReference

    constructor( target: string, type: ShaderVariableType, locked: boolean, cachedValueReference: IValueReference ) {

        this.target = target
        this.type = type
        this.locked = locked
        this.cachedValueReference = cachedValueReference

        if ( locked ) {

            this.setValue = () => { /* no-op */ }

        } else {

            this.setValue = ( value: any ) => {

this.cachedValueReference.value	= value

}

        }

    }

    public getValue() {

        return this.cachedValueReference.value

    }

}