<template>
  <div class="uniform-editor vec3">
    <v-float-input
      v-model="x"
      label="x"
    />
    <div class="separator" />
    <v-float-input
      v-model="y"
      label="y"
    />
    <div class="separator" />
    <v-float-input
      v-model="z"
      label="z"
    />
  </div>
</template>

<script lang="ts">
import '@/styles/uniform_editor.css'
import Vue from 'vue'
import FloatInput from '@/components/FloatInput.vue'
import { UniformEditor } from '@/scripts/renderer/UniformEditor'

export default Vue.extend({
  name: 'UniformEditorVec3',
  components: {
    'v-float-input': FloatInput
  },
  props: {
    editor: {
      type: Object as () => UniformEditor,
      default: null
    }
  },
  data: () => ({
    x: 0 as number,
    y: 0 as number,
    z: 0 as number,
    vec3: new Float32Array(3)
  }),
  computed: {
  },
  watch: {
    x () {
      this.vec3[ 0 ] = this.x
      this.editor.setValue(this.vec3)
    },
    y () {
      this.vec3[ 1 ] = this.y
      this.editor.setValue(this.vec3)
    },
    z () {
      this.vec3[ 2 ] = this.z
      this.editor.setValue(this.vec3)
    },
    editor () {
      this.loadValue()
    }
  },
  activated () {
    this.loadValue()
  },
  methods: {
    loadValue () {
      this.vec3 = this.editor.getValue() as Float32Array
      [ this.x, this.y, this.z ] = this.vec3
    }
  }
})
</script>
