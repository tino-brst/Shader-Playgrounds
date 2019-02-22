import UniformEditorOthers from "@/components/uniforms_editors/Others.vue"
import UniformEditorFloat from "@/components/uniforms_editors/Float.vue"
import UniformEditorVec2 from "@/components/uniforms_editors/Vec2.vue"
import UniformEditorVec3 from "@/components/uniforms_editors/Vec3.vue"
import UniformEditorVec4 from "@/components/uniforms_editors/Vec4.vue"
import UniformEditorSampler2D from "@/components/uniforms_editors/Sampler2D.vue"

export default {
    others: UniformEditorOthers,
    float: UniformEditorFloat,
    vec2: UniformEditorVec2,
    vec3: UniformEditorVec3,
    vec4: UniformEditorVec4,
    sampler2D: UniformEditorSampler2D
}
