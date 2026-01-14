<template>
  <div class="volume-slider-container">
    <div class="volume-slider-title">系统音量</div>
    <div class="volume-slider-row">
      <div class="volume-icon">
        <svg v-if="volume === 0" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
        <svg v-else-if="volume < 50" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
      </div>
      <div class="slider-wrapper">
        <div class="slider-fill" :style="{ width: volume + '%' }"></div>
        <input
          type="range"
          min="0"
          max="100"
          v-model.number="volume"
          class="volume-slider"
          @input="updateVolume"
        >
      </div>
      <div class="volume-value">{{ volume }}%</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const volume = ref(0)

const updateVolume = () => {
  window.electronAPI.setVolume(volume.value)
}

onMounted(async () => {
  try {
    const vol = await window.electronAPI.getVolume()
    volume.value = vol
  } catch (e) {
    console.error('Failed to get volume', e)
  }
})
</script>
