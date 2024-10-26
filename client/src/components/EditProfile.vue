<template>
  <div class="edit-profile bg-white">
    <transition>
      <div class="d-flex flex-column row-gap-4">
        <!-- User's First Name and Username -->
        <div class="d-flex flex-row justify-content-between align-items-center">
          <div class="d-flex flex-row column-gap-3 justify-content-start align-items-center">
            <div class="profile-user-container">
              <div class="profile-image-container">
                <img :src="profileImagePreview || defaultAvatar"
                     class="rounded-circle profile-image"
                     alt="profile image"/>
              </div>
              <!-- Pen icon for changing profile image -->
              <i v-if="editMode" @click="triggerFileInput" class="bi bi-pen-fill change-photo-btn"></i>
              <!-- Hidden file input -->
              <input ref="fileInput" type="file" @change="handleFileChange" style="display: none;" accept="image/*" />
            </div>
            <div>
              <h2 class="user-name">{{ user.firstName || 'User' }}</h2>
              <p class="username">@{{ user.username }}</p>
            </div>
          </div>
          <div v-if="!isWide"
               @click="toggleAccordion"
               class="chevron-container"
               style="width: 40px; height: 40px">
            <i :class="isOpen ? 'bi bi-chevron-up' : 'bi bi-chevron-down'" class="chevron"></i>
          </div>
        </div>

        <!-- Form to edit profile -->
        <form v-if="isOpen" class="d-flex flex-column row-gap-3" @submit.prevent="saveProfile">
          <div class="field">
            <label>First Name</label>
            <input type="text" v-model="editedUser.firstName" :disabled="!editMode" required />
          </div>
          <div class="field">
            <label>Last Name</label>
            <input type="text" v-model="editedUser.lastName" :disabled="!editMode" required />
          </div>
          <div class="field">
            <label>Username</label>
            <input type="text" v-model="editedUser.username" :disabled="!editMode" required />
          </div>
          <div class="field">
            <label>Email</label>
            <input type="email" v-model="editedUser.emailAddress" :disabled="!editMode" required />
          </div>
          <div class="field password-field">
            <label>Password</label>
            <input
              type="password"
              v-model="editedUser.password"
              :disabled="!editMode"
              :placeholder="passwordPlaceholder"
            />
          </div>
          <div class="button-group">
            <button
              v-if="editMode"
              type="submit"
              :disabled="!hasChanges || !isFormValid || isSaving"
              class="save-button d-flex flex-grow-1 justify-content-center"
            >
              {{ isSaving ? 'Saving...' : 'Save' }}
            </button>
            <button
              v-else
              type="button"
              @click="toggleEditMode"
              class="save-button d-flex flex-grow-1 justify-content-center"
            >
              Edit
            </button>
            <button
              v-if="editMode"
              type="button"
              @click="cancelEdit"
              class="cancel-button"
              :disabled="isSaving"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </transition>

    <!-- Alert for success/error messages -->
    <div v-if="alertShown" :class="['alert-box', message.type]">
      {{ message.text }}
    </div>
  </div>
</template>

<script>
import { Api } from '@/api/v1/Api.js';
import defaultAvatar from '@/assets/avatars/user-avatar.svg';

export default {
  data() {
    return {
      isOpen: false,
      isWide: true,
      user: {
        emailAddress: '',
        username: '',
        password: '',
        firstName: '',
        lastName: '',
        profileImg: '',
      },
      editedUser: {},
      isSaving: false,
      token: localStorage.getItem('token'),
      message: {
        type: '',
        text: '',
      },
      editMode: false,
      alertShown: false,
      passwordPlaceholder: '********',
      profileImageFile: null,
      profileImagePreview: null,
      defaultAvatar
    };
  },
  created() {
    this.loadUser();
    this.checkScreenSize();
  },
  mounted() {
    window.addEventListener('resize', this.checkScreenSize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.checkScreenSize);
  },
  computed: {
    hasChanges() {
      return (
        this.user.firstName !== this.editedUser.firstName ||
        this.user.lastName !== this.editedUser.lastName ||
        this.user.username !== this.editedUser.username ||
        this.user.emailAddress !== this.editedUser.emailAddress ||
        (this.editedUser.password && this.editedUser.password !== '') ||
        this.profileImageFile !== null
      );
    },
    isEmailValid() {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailPattern.test(this.editedUser.emailAddress);
    },
    isFormValid() {
      return (
        this.editedUser.firstName &&
        this.editedUser.lastName &&
        this.editedUser.username &&
        this.isEmailValid
      );
    },
  },
  methods: {
    // Check screen size and update `isOpen` based on width
    checkScreenSize() {
      this.isOpen = window.innerWidth >= 992;
      this.isWide = window.innerWidth >= 992;
    },
    toggleAccordion() {
      // Only allow toggling for smaller screens
      if (window.innerWidth <= 992) {
        this.isOpen = !this.isOpen;
      }
    },
    loadUser() {
      const localUser = JSON.parse(localStorage.getItem('user'));
      if (localUser) {
        this.user = {...localUser};
        this.editedUser = {...this.user, password: ''};
        this.profileImagePreview = this.user.profileImg ? `${this.user.profileImg}` : this.defaultAvatar;
      }
    },
    toggleEditMode() {
      this.editMode = !this.editMode;
      if (!this.editMode) {
        this.cancelEdit();
      }
    },
    showAlert() {
      this.alertShown = true;
      setTimeout(() => {
        this.alertShown = false;
        if (this.message.type === 'success') {
          window.location.reload();
        }
      }, 1500);
    },
    cancelEdit() {
      this.editedUser = {...this.user};
      this.editMode = false;
      this.message.text = '';
      this.profileImageFile = null;
      this.profileImagePreview = this.user.profileImg ? `${this.user.profileImg}` : this.defaultAvatar;
    },
    // Trigger the hidden file input when the pen icon is clicked
    triggerFileInput() {
      this.$refs.fileInput.click();
    },

    // Handle file change and update preview
    handleFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.profileImageFile = file;
        this.profileImagePreview = URL.createObjectURL(file);  // Show a preview of the selected image
      }
    },

    async saveProfile() {
      this.isSaving = true;
      this.message.text = '';

      try {
        const localUser = JSON.parse(localStorage.getItem('user'));
        const formData = new FormData();

        Object.keys(this.editedUser).forEach(key => {
          if (this.editedUser[key] !== '' && this.editedUser[key] !== this.user[key]) {
            formData.append(key, this.editedUser[key]);
          }
        });

        if (this.profileImageFile) {
          formData.append('profileImg', this.profileImageFile);
        }

        const config = {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'multipart/form-data',
          },
        };

        const response = await Api.patch(`/users/${localUser._id}`, formData, config);

        localStorage.setItem('user', JSON.stringify(response.data));
        this.user = {...response.data};
        this.editedUser = {...this.user, password: ''};
        this.editMode = false;
        this.message = {type: 'success', text: 'Profile updated successfully!'};
        this.showAlert();
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to update profile.';
        this.message = {type: 'error', text: errorMsg};
        this.showAlert();
      } finally {
        this.isSaving = false;
      }
    }
  }
};
</script>

<style scoped>
.edit-profile {
  display: flex;
  flex-direction: column;
  row-gap: 5px;
  position: sticky;
  top: 0;
  border-radius: 15px;
  width: 100%;
  height: fit-content;
  z-index: 0;
  padding: 15px;
  border: 0.5px solid #dad9d9;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.07);
}

.alert-box {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px;
  border-radius: 5px;
  font-weight: bold;
  z-index: 1000;
  transition: opacity 0.3s ease, top 0.3s ease;
}

.alert-box.success {
  background-color: #d4edda;
  color: #398549;
}

.alert-box.error {
  background-color: #f8d7da;
  color: #a53d45;
}

.user-name {
  font-weight: bold;
  margin: 0;
}

.username {
  font-weight: bold;
  color: #808080;
  margin: 0;
}

label {
  display: block;
  color: #808080;
  font-weight: bold;
  text-align: left;
}

input {
  width: 100%;
  padding: 10px;
  border-radius: 10px;
  border: none;
  background-color: #e7e7e7;
  font-weight: bold;
}

input:disabled {
  background-color: #dfdfdf;
}

.button-group {
  display: flex;
  gap: 10px;
}

.save-button {
  background-color: #007769;
  color: white;
  padding: 10px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: bold;
}

.save-button:disabled {
  background-color: #818080;
  cursor: not-allowed;
}

.cancel-button {
  background-color: #a5a4a4;
  color: white;
  padding: 10px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: bold;
}

.field {
  display: flex;
  flex-direction: column;
  row-gap: 10px;
}

.profile-image-container {
  position: relative;
  width: 75px;
  height: 75px;
  border-radius: 50%;
  border: 3px solid #007769;
  overflow: visible;
}

.profile-user-container {
  position: relative;
  border-radius: 50%;
  overflow: visible;
}

.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.change-photo-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: #007769;
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 2px 5px;
  font-size: 14px;
  cursor: pointer;
  z-index: 2;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
}

.change-photo-btn:hover {
  background-color: #a89200;
}

.chevron-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #e6e6e6;
  border-radius: 10px;
  cursor: pointer;
}

.chevron-container:hover {
  background-color: #056149;
  color: white;
}

@media (max-width: 992px) {
  .edit-profile {
    margin: 0 10px;
    width: auto;
  }
}
</style>
