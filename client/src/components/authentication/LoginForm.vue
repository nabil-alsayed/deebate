<template>
  <div class="form-container">
    <div
      style="
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 100%;
      "
    >
      <b-card-title style="color: #007769" class=".rubik-text fw-semibold"
        >Welcome back! 👋</b-card-title
      >
      <b-form @submit.prevent="login" class="form" style="width: 100%;">
        <b-input type="email" v-model="user.email" placeholder="Email" />
        <b-input
          type="password"
          v-model="user.password"
          placeholder="Password"
        />
        <b-button type="submit" class="button" :disabled="isLoading">
          <span v-if="isLoading">Logging in...</span>
          <span v-else>Log in</span>
        </b-button>
      </b-form>
      <div class="flex flex-column column-gap-4 text-center">
        <p class="small fw-medium">
          Don't have an account?
          <router-link to="/signup" style="text-decoration: none"
            >Sign up</router-link
          >
        </p>
        <div v-if="alertShown" :class="['alert-box', message.type]">
          {{ message.text }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Api } from '@/api/v1/Api.js'

export default {
  name: 'authentication',
  data() {
    return {
      user: {
        email: '',
        password: ''
      },
      message: {
        type: '',
        text: '',
      },
      alertShown: false,
      isLoading: false
    }
  },
  methods: {
    async login() {
      this.isLoading = true;
      try {
        const response = await Api.post('/auth/login/', {
          emailAddress: this.user.email,
          password: this.user.password
        });

        // Set success message and show alert
        this.message = {type: 'success', text: response.data.message || 'Login successful!'};

        // Save the token in local storage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        // Redirect the user to the home page
        this.$router.push('/');
      } catch (error) {
        // Set error message and show alert
        const errorMsg = error.response?.data?.message || 'Login failed, please try again.';
        this.message = {type: 'error', text: errorMsg};
        this.showAlert();
      } finally {
        this.isLoading = false;
      }
    },
    showAlert() {
      // Show the alert
      this.alertShown = true;
      // Hide the alert after 2 seconds
      setTimeout(() => {
        this.alertShown = false;
      }, 2000);
    }
  }
}
</script>

<style>
.form-container{
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.form {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: fit-content;
  width: 100%;
  padding: 20px;
  gap: 20px;
}

.button {
  width: 100%;
  background-color: #007769;
  font-weight: bold;
  border: none;
}

.button:hover {
  background-color: #014a4a;
}

.button:active {
  background-color: #007769;
}

.button:focus {
  background-color: #007769;
}

.alert-box {
  position: fixed;
  top: 0;
  margin-top: 30px;
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

</style>
