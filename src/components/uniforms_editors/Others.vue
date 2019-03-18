<template>
    <div class="uniform-editor-others">
        <span class="type">
            {{ editor.type }}
        </span>
        <span class="identifier">
            {{ identifier }}
        </span>
        <template v-if="attribute">
            <span class="punctuation">
                .
            </span>
            <span class="attribute">
                {{ attribute }}
            </span>
        </template>
    </div>
</template>

<script lang="ts">
import Vue from "vue"
import { UniformEditor } from "@/scripts/renderer/UniformEditor"

export default Vue.extend( {
    name: "UniformEditorOthers",
    props: {
        editor: {
            type: Object as () => UniformEditor,
            default: null
        }
    },
    data: () => ( {
        splitTargetName: [] as string[]
    } ),
    computed: {
        identifier(): string {
            return this.splitTargetName[ 0 ] || ""
        },
        attribute(): string {
            return this.splitTargetName[ 1 ] || ""
        }
    },
    watch: {
        editor: {
            handler() {
                this.splitTargetName = this.editor.target.split( "." )
            },
            immediate: true
        }
    }
} )
</script>

<style>
.uniform-editor-others {
    width: fit-content;
    height: fit-content;
    display: flex;
    align-items: center;
    margin: 8px 10px;
    font-size: 14px;
}

.uniform-editor-others .identifier {
    font-family: IBM Plex Mono;
    color: white;
}
.uniform-editor-others .punctuation {
    font-family: IBM Plex Sans;
    color: gray;
}
.uniform-editor-others .attribute {
    font-family: IBM Plex Sans;
    font-style: italic;
    color: gainsboro;
}

.uniform-editor-others .type {
    margin-right: 10px;
    font-family: IBM Plex Sans;
    padding: 2px 4px;
    font-size: 12px;
    background: rgba(255, 255, 255, 0.5);
    color: rgb( 50, 50, 50 );
    border-radius: 3px;
    font-weight: 500;
    letter-spacing: 0.03rem;
}
</style>
