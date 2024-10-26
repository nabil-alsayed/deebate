<template>
<!--  Use Bootstrap Responsiveness for Profile Flex Styling-->
  <div class="main-body-profile flex-lg-row flex-column w-100 vh-100 column-gap-3 p-3">
    <div class="menu-bar">
      <MenuBar />
    </div>
    <div class="d-flex flex-column main-content flex-grow-1 row-gap-3">
      <!-- SEARCH -->
      <SearchBar />
      <!-- DEBATE LIST AND WIDGETS -->
      <div class="main-body-profile flex-lg-row flex-column">
        <!-- DEBATE LIST -->
        <div class="d-flex flex-column row-gap-3 w-100 h-100" id="debates-sections">
          <div class="d-flex flex-column row-gap-1">
            <h2 class="title">Post a Debate</h2>
            <DebateForm />
          </div>
          <DebateList :user="userId" page="profile"/>
        </div>
        <!-- WIDGETS -->
        <div class="right-bar" style="min-width: 250px">
          <h2 class="title">Edit Profile</h2>
          <EditProfile />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import DebateList from "@/components/debates/DebateList.vue";
import SearchBar from "@/components/top-bar/SearchBar.vue";
import EditProfile from '@/components/EditProfile.vue'
import MenuBar from "@/components/MenuBar.vue";
import DebateForm from "@/components/debates/DebateForm.vue";
import {ref, onMounted} from "vue";
import router from "@/router.js";

export default{
  name: 'Profile',
  components: {DebateForm, MenuBar, EditProfile, SearchBar, DebateList},
  setup() {
    const userId = ref('');

    const checkUserSession = async () => {
      const userData = localStorage.getItem('user');

      if (userData) {
        userId.value = JSON.parse(userData)._id;
      } else {
        // If no user data in localStorage, redirect to login page
        await router.replace('/login');
      }
    };

    return {
      userId,
      checkUserSession
    };
  },
  created() {
    this.checkUserSession();
  }
}
</script>

<style scoped>
.main-content {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.main-body-profile {
  display: flex;
  column-gap: 15px;
}

.title {
  color: grey;
  font-size: 18px;
  font-weight: 550;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

#debates-sections {
  width: 100%;
  padding: 0 8px;
}

@media (max-width: 992px) {
  .main-body-profile {
    row-gap: 15px;
  }

  .menu-bar {
    max-height: fit-content;
  }

  .right-bar {
    order: -1;
  }

}

</style>
