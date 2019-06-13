import { vec3 } from 'gl-matrix'

export class Face {
  public static verticesCount: number = 3
  public verticesIndices: number[]

  constructor (vertexAIndex: number, vertexBIndex: number, vertexCIndex: number) {
    this.verticesIndices = [ vertexAIndex, vertexBIndex, vertexCIndex ]
  }

  public static computeFaceNormal (a: vec3, b: vec3, c: vec3) {
    const ab = vec3.create()
    const ac = vec3.create()

    vec3.subtract(ab, b, a)
    vec3.subtract(ac, c, a)

    const normal = vec3.create()

    vec3.cross(normal, ab, ac)
    vec3.normalize(normal, normal)

    return normal
  }
}
