import { GraphicObject } from './GraphicObject'
import { VertexAttributeBuffer, IndexBuffer } from './Buffers'
import { Geometry } from './geometry/Geometry'

export class BuffersGeometry extends GraphicObject {
  public vertexAttributesBuffers: Map < string, VertexAttributeBuffer >
  public trianglesIndexBuffer!: IndexBuffer
  public linesIndexBuffer!: IndexBuffer
  private gl: WebGLRenderingContext

  constructor (gl: WebGLRenderingContext, geometry?: Geometry) {
    super()

    this.vertexAttributesBuffers = new Map()
    this.trianglesIndexBuffer = new IndexBuffer(gl)
    this.linesIndexBuffer = new IndexBuffer(gl)
    this.gl = gl

    if (geometry !== undefined) {
      this.updateBuffersFromGeometry(geometry)
    }
  }

  public updateBuffersFromGeometry (geometry: Geometry) {
    // update de atributos de vertices
    const unusedBuffers = new Set(this.vertexAttributesBuffers.keys())

    for (const [ name, attributeArray ] of geometry.vertexAttributesArrays) {
      const attributeBuffer = this.vertexAttributesBuffers.get(name)

      if (attributeBuffer === undefined) {
        this.vertexAttributesBuffers.set(name, new VertexAttributeBuffer(this.gl, attributeArray.array, attributeArray.itemSize))
      } else {
        attributeBuffer.setData(attributeArray.array, attributeArray.itemSize)
      }

      unusedBuffers.delete(name)
    }

    for (const name of unusedBuffers) {
      this.vertexAttributesBuffers.delete(name)
    }

    // update de indices
    this.trianglesIndexBuffer.setData(geometry.trianglesIndexArray.array)
    this.linesIndexBuffer.setData(geometry.linesIndexArray.array)
  }
}
