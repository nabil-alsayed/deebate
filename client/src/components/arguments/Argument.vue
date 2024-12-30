<template>
  <div class="argument-card d-flex flex-column px-3 py-3 rounded-4" style="font-family: Inter, serif">
    <div class="d-flex justify-content-between align-items-center">
      <!-- Owner and Profile Image - Suspense and Data -->
      <div class="d-flex align-items-center gap-2">
        <!-- Skeleton loader while loading -->
        <div v-if="loading" class="skeleton skeleton-avatar"></div>
        <div v-else>
          <router-link v-if="owner._id" :to="'/users/' + owner._id" class="d-flex align-items-center flex-row column-gap-2" style="text-decoration: none; color: black">
            <img :src="owner.profileImg || avatar"
                 :alt="owner.username || 'User Profile Image'"
                 class="rounded-circle"
                 style="width: 48px; height: 48px; border: 3px solid #007769">
            <div>
              <h5 class="title-text fw-bold mb-0">{{ owner.firstName }} {{ owner.lastName }}</h5>
              <h6 class="subtitle-text fw-light mb-0">@{{ owner.username }}</h6>
            </div>
          </router-link>
        </div>

        <!-- Suspense for side tag -->
        <div v-if="loading" class="skeleton skeleton-tag"></div>
        <div v-else class="tag rounded text-black fw-bold"
             :style="{ fontSize: '14px', backgroundColor: side.backgroundColor }">
          <p class="m-0" style="color: white">{{ side.text }}</p>
        </div>

        <!-- Trophy icons - Suspense -->
        <div v-if="!loading">
          <i v-if="isWinnerByAI" class="bi bi-trophy-fill" style="font-size: 15px; color: goldenrod" />
          <i v-if="isWinnerByAudience" class="bi bi-people-fill" style="font-size: 15px; color: #007769" />
        </div>
      </div>

      <!-- Trash icon for delete - Suspense -->
      <div v-if="loading" class="skeleton skeleton-icon"></div>
      <i v-else-if="isOwner && $props.debate.status !== 'closed'" @click="deleteArgument" class="bi bi-trash" style="font-size: 15px; color: #a83737; cursor: pointer" />
    </div>

    <!-- Argument Content - Suspense -->
    <p v-if="loading" class="skeleton skeleton-text"></p>
    <p v-else class="argument-content-text p-2">{{ content }}</p>

    <!-- Comments Count - Suspense -->
    <div v-if="loading" class="skeleton skeleton-comments"></div>
    <div v-else style="cursor: pointer" class="d-flex align-items-center gap-2" @click="showCommentsPopup = true">
      <i class="bi bi-chat-fill text-muted"></i>
      <span class="fw-bold" style="font-size: 14px">{{ commentsWithUserDetails.length }}</span>
    </div>

    <div v-if="showCommentsPopup" class="comments-popup">
      <div class="comments-popup-content">
        <div class="d-flex flex-row justify-content-end">
          <i class="bi bi-x"
             style="font-size: 30px; color: #007769; cursor: pointer"
             @click="showCommentsPopup = false"
          ></i>
        </div>
        <div class="comments-list">
          <ul class="list-unstyled">
            <li v-for="comment in commentsWithUserDetails" :key="comment._id" class="mb-3 p-2">
              <div class="d-flex gap-2 w-100">
                <img :src="comment.userDetails?.profileImg || avatar"
                     :alt="comment.userDetails?.username"
                     class="rounded-circle"
                     style="width: 40px; height: 40px; border: 2px solid #007769">
                <div>
                  <h6 class="m-0 fw-bold">{{ comment.userDetails?.firstName }} {{ comment.userDetails?.lastName }}</h6>
                  <small class="text-muted">@{{ comment.userDetails?.username }}</small>
                </div>
              </div>
              <p class="mb-0 mt-2 comment-content">{{ comment.content }}</p>
              <button v-if="isCommentOwner(comment)" @click="startUpdateComment(comment)" class="btn btn-sm btn-primary mt-2">
                Edit comment <i class="fa-regular fa-pen-to-square"></i>
              </button>
            </li>
          </ul>
        </div>

        <div v-if="updatingComment">
          <textarea v-model="updatedCommentContent" class="form-control mb-2 rounded-4"></textarea>
          <button @click="submitCommentUpdate" class="btn btn-primary me-2">Save</button>
          <button @click="cancelCommentUpdate" class="btn btn-secondary">Cancel</button>
        </div>

        <div>
          <textarea v-model="newComment" placeholder="Type your comment" class="form-control mb-2 rounded-4"></textarea>
          <button  @click="submitComment" class="btn btn-primary" style="width: 100%;">Comment</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Api } from '@/api/v1/Api.js'
import { getLoggedInUser } from '@/api/v1/usersApi.js'
import defaultAvatar from '@/assets/avatars/user-avatar.svg'

export default {
  name: 'Argument',
  props: {
    argument: { type: String, required: true },
    debate: { type: Object, required: true },
  },
  data() {
    return {
      content: '',
      owner: { _id: '', username: '', avatar: '' },
      commentsWithUserDetails: [],
      newComment: '',
      isOwner: false,
      isWinnerByAI: false,
      isWinnerByAudience: false,
      showCommentsPopup: false,
      side: {
        text: '',
        backgroundColor: ''
      },
      avatar: defaultAvatar,
      updatingComment: null,
      updatedCommentContent: '',
      loading: true
    }
  },
  async created() {
    await this.fetchData()
  },
  methods: {
    async fetchData() {
      try {
        await this.fetchArgument();
        await this.fetchOwner();
        await this.checkIfOwner();
        await this.fetchCommentUserDetails();
        await this.fetchUserSide();
        this.checkWinner();
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        this.loading = false; // End loading state
      }
    },
    async checkIfOwner() {
      try {
        const user = await getLoggedInUser()
        this.isOwner = user && user._id === this.owner._id
      } catch (error) {
        console.error('Failed to check ownership:', error)
      }
    },
    checkWinner() {
      // Ensure the argument's side and winner's side are both lowercase for comparison
      const argumentSide = this.side.text.toLowerCase();
      const aiWinnerSide = this.debate.winnerByAI?.toLowerCase();
      const audienceWinnerSide = this.debate.winnerByAudience?.toLowerCase();
      // Set the winner flags based on the comparison
      this.isWinnerByAI = aiWinnerSide === argumentSide;
      this.isWinnerByAudience = audienceWinnerSide === argumentSide;
    },
    async fetchArgument() {
      try {
        const { data } = await Api.get(`/debates/${this.debate._id}/arguments/${this.argument}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        this.content = data.content
        this.owner._id = data.owner
        this.commentsWithUserDetails = data.comments
        const isWith = data.side === 'with';
        // Set the side based on where the user is found
        if (isWith) {
          this.side.text = 'With'
          this.side.backgroundColor = '#007769'
        } else {
          this.side.text = 'Against'
          this.side.backgroundColor = '#a83737'
        }
      } catch (error) {
        console.error('Failed to fetch argument:', error)
      }
    },
    async fetchOwner() {
      try {
        const { data } = await Api.get(`/users/${this.owner._id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        this.owner = { ...this.owner, ...data.user }
      } catch (error) {
        console.error('Failed to fetch owner:', error)
      }
    },
    async deleteArgument() {
      try {
        const response = await Api.delete(`/debates/${this.debate._id}/arguments/${this.argument}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        if (response.status >= 200 && response.status < 300) {
          this.$emit('argument-deleted', this.argument)
          window.location.reload()
        }
      } catch (error) {
        console.error('Failed to delete argument:', error)
      }
    },
    async fetchCommentUserDetails() {
      this.commentsWithUserDetails = await Promise.all(
        this.commentsWithUserDetails.map(async (comment) => {
          try {
            const { data } = await Api.get(`/users/${comment.owner}`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            })
            return { ...comment, userDetails: data.user }
          } catch (error) {
            console.error('Failed to fetch comment owner details:', error)
            return comment
          }
        })
      )
    },
    async fetchUserSide() {
      try {
        const response = await Api.get(`/debates/${this.debate._id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })

        // Check if the user is in votesWith or votesAgainst
        const isWith = response.data.debate.votesWith.includes(this.owner._id)

        // Set the side based on where the user is found
        if (isWith) {
          this.side.text = 'With'
          this.side.backgroundColor = '#007769'
        } else {
          this.side.text = 'Against'
          this.side.backgroundColor = '#a83737'
        }
      } catch (error) {
        console.error('Failed to fetch user side:', error)
      }
    },
    async submitComment() {
      // Trim all spaces from the newComment
      const trimmedComment = this.newComment.replace(/[\r\n]+/g, '');

      if (!trimmedComment) {
        alert('Please enter a valid comment');
        return;
      }
      try {
        const { data } = await Api.post(`/debates/${this.debate._id}/arguments/${this.argument}/comments`,
          { content: trimmedComment },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        )
        const currentUser = await getLoggedInUser()
        this.commentsWithUserDetails.push({ ...data, userDetails: currentUser })
        this.newComment = ''
      } catch (error) {
        console.error('Error submitting comment:', error)
      }
    },


    async isCommentOwner(comment) {
      const currentUser = await getLoggedInUser()
      return currentUser && currentUser._id === comment.owner
    },

    startUpdateComment(comment) {
      this.updatingComment = comment
      this.updatedCommentContent = comment.content
    },

    cancelCommentUpdate() {
      this.updatingComment = null
      this.updatedCommentContent = ''
    },

    async submitCommentUpdate() {
      const trimmedComment = this.updatedCommentContent.replace(/[\r\n]+/g, '');

      if (!trimmedComment) {
        alert('Please enter a comment')
        return
      }
      try {
        const { data } = await Api.put(`/debates/${this.debate._id}/arguments/${this.argument}/comments/${this.updatingComment._id}`,
          { content: trimmedComment },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        )

        // Update the comment in the local state
        const index = this.commentsWithUserDetails.findIndex(c => c._id === this.updatingComment._id)
        if (index !== -1) {
          this.commentsWithUserDetails[index].content = data.updatedComment.content
        }

        this.cancelCommentUpdate()
      } catch (error) {
        console.error('Error updating comment:', error)
        alert('Failed to update comment. Please try again.')
      }
    }
  }
}

</script>

<style scoped>

/* Skeleton Loader Styles */
.skeleton {
  background-color: #e0e0e0;
  border-radius: 4px;
  animation: pulse 1.5s infinite;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.skeleton-tag {
  width: 50px;
  height: 20px;
  border-radius: 10px;
}

.skeleton-text {
  width: 100%;
  height: 40px;
}

.skeleton-comments {
  width: 30px;
  height: 20px;
  border-radius: 4px;
}

.skeleton-icon {
  width: 20px;
  height: 20px;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    opacity: 1;
  }
}

/* Regular Styles */

.argument-card {
  border: 0.5px solid #dad9d9;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.07);
}

.argument-content-text {
  font-size: 17px;
}

.tag {
  display: flex;
  justify-content: center;
  width: 70px;
}

.title-text {
  font-size: 17px;
}

.subtitle-text {
  font-size: 14px;
}

.comments-popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.comments-popup-content {
  background: white;
  padding: 20px;
  width: 500px;
  max-width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  border-radius: 20px;
}

.comments-list {
  flex-grow: 1;
  overflow-y: auto;
  margin-bottom: 20px;
}

textarea {
  width: 100%;
  height: 100px;
  margin-bottom: 10px;
}

.btn-primary {
  background-color: #007769;
  border-color: #007769;
}

.btn-primary:hover {
  background-color: #01675b;
  border-color: #01675b;
}

.comment-content {
  word-wrap: break-word;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}

@media (max-width: 576px) {
  .title-text {
    font-size: 15px;
  }

  .subtitle-text {
    font-size: 12px;
  }

  .argument-content-text {
    font-size: 14px;
  }
}
</style>
