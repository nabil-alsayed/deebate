<template>
  <div class="analysis-card d-flex flex-column px-3 py-3 rounded-4" style="font-family: Inter,serif">
    <div class="d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center gap-2">
        <!-- Avatar -->
        <img :src="gptavatar" alt="ChatGPT" class="rounded-circle"
             style="width: 48px; height: 48px; border: 3px solid #007769">
        
        <!-- Label -->
        <h5 class="title-text fw-bold mb-0">ChatGPT</h5>

        <!-- Winner badge -->
        <div
          class="d-flex flex-row column gap-1 px-2 rounded text-black fw-bold align-items-center"
          :style="{
            fontSize: '14px',
            maxWidth: 'fit-content',
            backgroundColor: winner.backgroundColor
          }"
        >
          <p class="m-0" style="color: white">{{ winner.text }}</p>
          <i class="bi bi-trophy-fill" style="font-size: 12px; color: white" />
        </div>
      </div>
    </div>

    <!-- Analysis text -->
    <p class="argument-content-text p-2">{{ content }}</p>
  </div>
</template>

<script>
import chatgptAvatar from '@/assets/avatars/chatgpt-avatar.webp'

export default {
  name: 'ChatGPTAnalysis',
  props: {
    debate: {
      type: Object,
      required: true
    },
    chatgptAvatar: {
      type: String,
      default: 'https://cdn.chatgpt.com/branding/chatgpt-avatar.png'
    }
  },
  setup(props) {
    return {
      winner: {
        text: props.debate.winnerByAI === 'with' ? 'With' : 'Against',
        backgroundColor: 'goldenrod'
      },
      content: props.debate.analysis,
      gptavatar: chatgptAvatar
    }
  }
}
</script>

<style scoped>

.analysis-card {
  border: 0.5px solid #dad9d9;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.07);
}

.title-text {
  font-size: 16px;
}

@media (max-width: 576px) {
  .title-text {
    font-size: 15px;
  }

  .argument-content-text {
    font-size: 14px;
  }
}

</style>
