<template>
  <div class="w-100 border-dashed border-1">
    <button v-if="opponentId" @click="joinDebate" class="btn btn-primary">Press to debate against @{{opponentUsername}}</button>
    <button v-else @click="joinDebate" class="btn btn-primary">Press to join debate</button>
  </div>
</template>

<script>
import { Api } from '@/api/v1/Api.js'

export default {
  name: 'JoinDebate',

  props: {
    user: {
      type: String,
    },
  },

  data() {
    return {
      opponentUsername: null,
      user: null,
    }
  },

  mounted() {
    this.setOpponentUsername()
  },

  methods: {
    /**
     * Attempt to join a debate by sending user and opponent IDs to the server
     */
    async joinDebate() {
      try {
        const token = localStorage.getItem("token")
        const userId = localStorage.getItem("userId")
        const debateId = this.$route.params.id

        if (!token || !userId || !debateId) {
          throw new Error("Missing token, user ID, or debate ID")
        }

        await Api.post("/debates/join", {
          debateId,
          userId,
          opponentId: this.opponentId
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

      } catch (error) {
        console.error("Failed to join debate:", error)
      }
    },

    /**
     * Fetch a user's username from the backend by their ID
     * @param {String} id - User ID
     * @returns {Promise<String>} - Username
     */
    async fetchUsername(id) {
      try {
        const token = localStorage.getItem("token")
        if (!token) throw new Error("No token found")

        const { data } = await Api.get(`/users/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        return data.username

      } catch (error) {
        console.error("Failed to fetch user:", error)
        return null
      }
    },

    /**
     * Set the opponent's username if the opponentId exists
     */
    async setOpponentUsername() {
      if (this.opponentId) {
        try {
          const username = await this.fetchUsername(this.opponentId)
          this.opponentUsername = username
        } catch (error) {
          console.error("Failed to fetch opponent:", error)
        }
      }
    }
  }
}
</script>

<style scoped>

</style>
