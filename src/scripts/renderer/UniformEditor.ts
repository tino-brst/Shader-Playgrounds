import { ShaderVariableType } from './_constants'
import { IValueReference } from './UniformsCache'

export class UniformEditor {
  public target: string
  public type: ShaderVariableType
  public setValue: (value: any) => void
  private cachedValueReference: IValueReference

  constructor (target: string, type: ShaderVariableType, cachedValueReference: IValueReference) {
    this.target = target
    this.type = type
    this.cachedValueReference = cachedValueReference
    this.setValue = (value: any) => { this.cachedValueReference.value = value }
  }

  public getValue () {
    return this.cachedValueReference.value
  }
}
