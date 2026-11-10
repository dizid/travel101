<script setup lang="ts">
/**
 * <Teleport to="body"> that only renders in the browser, after mount.
 *
 * vite-ssg prerenders every page but doesn't write teleported HTML into <body>.
 * When the client hydrates a server-rendered Teleport, Vue looks for the teleport's
 * markers in <body>, doesn't find them, and replaces the whole #app with a comment.
 * Everything we teleport is a modal or popup that starts hidden, so rendering it
 * only on the client loses nothing.
 */
import { ref, onMounted } from 'vue'

const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})
</script>

<template>
  <Teleport v-if="mounted" to="body">
    <slot />
  </Teleport>
</template>
