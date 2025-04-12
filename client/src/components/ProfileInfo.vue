<template>
  <div class="profile-info d-flex flex-row column-gap-3 align-items-center">
    <img :src="profileImgSrc || defaultAvatar"
         alt="Profile Image"
         class="profile-picture rounded-circle"
         width="110"
         height="110"
         style="object-fit: cover; border: 5px solid #007769"
    />
    <div>
      <div class="d-flex flex-row column-gap-2 align-items-center">
        <h2 class="m-0 fw-bold">{{ firstname }} {{ lastname }}</h2>
        <div v-if="isSameUser" class="edit-button" @click="editProfile">
          <i class="bi bi-pencil-fill" style="font-size: 15px"/>
        </div>
      </div>
      <p class="fw-semibold m-0" style="color: #a8a8a8">@{{ username }}</p>
      <div class="d-flex flex-row column-gap-1">
        <i class="bi bi-eye-fill" style="font-size: 13px;color: #0edc84"> </i>
        <p class="fw-semibold m-0" style="font-size: 13px;color: #0edc84"> {{ lastLogin }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from "vue";
import { Api } from "@/api/v1/Api.js";
import { useRoute } from "vue-router";
import defaultAvatar from "@/assets/avatars/user-avatar.svg";
import router from "@/router.js";

export default {
  name: "ProfileInfo",
  setup() {
    const user = ref(null);
    const username = ref("");
    const firstname = ref("");
    const lastname = ref("");
    const lastLogin = ref("");
    const token = localStorage.getItem("token");
    const route = useRoute();
    const isSameUser = ref(false);
    const userId = route.params.userId;
    const profileImgSrc = ref(null)

    const getUser = async () => {
      try {
        const response = await Api.get(`/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Set the user data
        user.value = response.data.user;

        // Set user information
        if (user.value) {
          username.value = user.value.username;
          firstname.value = user.value.firstName;
          lastname.value = user.value.lastName;
          lastLogin.value = new Date(user.value.lastLogin).toDateString();
          if (user.value.profileImg) {
            profileImgSrc.value = user.value.profileImg;
          } else {
            profileImgSrc.value = defaultAvatar;
          }
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    const editProfile = () => {
      // Redirect to edit profile page
      router.push({ name: "profile" });
    }

    const checkProfileOwner = () => {
      const loggedInUser = JSON.parse(localStorage.getItem("user"));
      isSameUser.value = loggedInUser._id === userId;
    }

    // Watch for changes in localStorage
    watch(() => localStorage.getItem("user"), (newValue) => {
      if (newValue) {
        const updatedUser = JSON.parse(newValue);
        if (updatedUser._id === userId) {
          user.value = updatedUser;
          username.value = updatedUser.username;
          firstname.value = updatedUser.firstName;
          lastname.value = updatedUser.lastName;
        }
      }
    });

    return {
      user,
      getUser,
      username,
      firstname,
      lastname,
      lastLogin,
      profileImgSrc,
      editProfile,
      isSameUser,
      checkProfileOwner,
      defaultAvatar
    };
  },
  created() {
    this.getUser();
    this.checkProfileOwner();
  },
};
</script>

<style scoped>
.edit-button {
  display: flex;
  font-size: 15px;
  color: #000000;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 100%;
  justify-content: center;
  align-items: center;
}

.edit-button:hover {
  background-color: #dadada;
}

@media (max-width: 576px) {
  .profile-picture {
    width: 80px;
    height: 80px;
  }
}
</style>
