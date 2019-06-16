import { ShaderVariableType } from './_constants'
import { ShaderInput } from './ShaderInputs'

export interface IValueReference {
    value: any
}
export interface UniformState {
    name: string,
    type: ShaderVariableType,
    value: any
}

export class UniformsCache {
  private previousContent: Map < string, IValueReference >
  private currentContent: Map < string, IValueReference >

  constructor () {
    this.previousContent = new Map()
    this.currentContent = new Map()

    /*
      • Content examples
      "modelMatrix:mat4" -> { value: ... }
      "color:vec3"       -> { value: ... }
    */
  }

  // 👥  Metodos Publicos

  public add (name: string, type: ShaderVariableType, value?: any) {
    const key = this.toString(name, type)

    if (value === undefined) {
      const previousValue = this.previousContent.get(key)
      if (previousValue !== undefined) {
        value = previousValue.value
      } else {
        value = ShaderInput.getDefaultValueForType(type)
      }
    }

    const cachedValue = { value }
    this.currentContent.set(key, cachedValue)

    return cachedValue
  }

  public get (name: string, type: ShaderVariableType) {
    const cachedValue = this.currentContent.get(this.toString(name, type))

    return (cachedValue !== undefined) ? cachedValue.value : undefined
  }

  public clear () {
    this.previousContent = this.currentContent
    this.currentContent = new Map()
  }

  // ✋🏼  Metodos Privados

  private toString (name: string, type: ShaderVariableType) {
    return `${name}:${type}`
  }
}
