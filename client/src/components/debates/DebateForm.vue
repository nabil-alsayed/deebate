<template>
  <div id="main-container" class="bg-white">
    <form @submit.prevent="createDebate"
          class="d-flex flex-column row-gap-1 w-100 p-1 rounded-3"
          style="min-width: 200px"
    >
      <!-- Topic input -->
      <div class="subject">
        <b-input type="text" id="topic" name="topic" v-model="topic" class="input w-100" required placeholder="What is the debate about?"/>
      </div>

      <!-- Category Selector with Placeholder -->
      <div class="subject">
        <b-form-select
          v-model="selectedCategory"
          :options="categoryOptions"
          class="input"
          required
        >
          <option disabled>Select Category</option>
        </b-form-select>
      </div>

      <!-- Max Participants with min 2 and max 4 -->
      <div class="d-flex flex-row column-gap-3">
        <div class="subject w-50">
          <span>Max Participants</span>
          <b-form-spinbutton
            type="number"
            class="input"
            name="maxParticipants"
            v-model="maxParticipants"
            :min="2"
            :max="4"
            required
            placeholder="Max Participants"
          />
        </div>

        <!-- End Time in Days (min 1 day, max 7 days) -->
        <div class="subject w-50">
          <span>End Time (days)</span>
          <b-form-spinbutton
            v-model="endDays"
            :min="1"
            :max="7"
            required
            placeholder="End in days"
            label="End in Days"
            class="input"
          />
        </div>
      </div>
      <b-button type="submit">Create Debate</b-button>
    </form>

    <!-- Success or error message -->
    <div v-if="alertShown" :class="['alert-box', message.type]">
      {{ message.text }}
    </div>
  </div>
</template>

<script>
import { Api } from '@/api/v1/Api.js';
import { getLoggedInUser } from '@/api/v1/usersApi.js';
import {BButton} from "bootstrap-vue-next";

export default {
  name: "DebateForm",
  components: {BButton},
  data() {
    return {
      topic: "",
      maxParticipants: 2,
      selectedCategory: "Politics",
      categoryOptions: [
        { value: 'Politics', text: 'Politics' },
        { value: 'Technology', text: 'Technology' },
        { value: 'Sports', text: 'Sports' },
        { value: 'Health', text: 'Health' },
        { value: 'Education', text: 'Education' },
        { value: 'Social Issues', text: 'Social Issues' }
      ],
      endDays: 1,
      owner: "",
      message: {
        type: "",
        text: "",
      },
      alertShown: false,
    };
  },
  methods: {
    async createDebate() {
      try {
        // Await the result from getLoggedInUser
        const user = await getLoggedInUser();

        // Calculate the end time based on the number of days selected
        const endTime = new Date();
        endTime.setDate(endTime.getDate() + this.endDays);

        const response = await Api.post("/debates", {
          topic: this.topic,
          maxParticipants: this.maxParticipants,
          category: this.selectedCategory,
          endTime: endTime.toISOString(),
          owner: user._id,
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if ([200, 201, 204].includes(response.status)) {
          this.message.type = "success";
          this.message.text = "Debate created successfully!";
        } else {
          this.message.type = "error";
          this.message.text = response.data.message || "An error occurred while creating the debate!";
        }

        this.showAlert();

      } catch (error) {
        this.message = { type: "error", text: error.response?.data?.message || "An error occurred while creating the debate!" };
        this.showAlert();
      }
    },
    showAlert() {
      this.alertShown = true;
      setTimeout(() => {
        this.alertShown = false;
      }, 1500);
      window.location.reload();
    }
  }
}
</script>

<style scoped>
#main-container {
  display: flex;
  flex-direction: column;
  row-gap: 10px;
  border: 0.5px solid #dad9d9;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.07);
  border-radius: 20px;
  padding: 20px;
}

.subject {
  display: flex;
  flex-direction: column;
  row-gap: 10px;
  color: grey;
  border: 4px #cdcdcd;
  border-radius: 15px;
  text-align: start;
  margin-bottom: 10px;
  font-weight: 750;
}

button {
  background-color: #007769;
  width: 100%;
  font-weight: 750;
  border-radius: 12px;
}

button:hover {
  background-color: #01675b;
}

input::placeholder {
  color: grey;
}

.input {
  font-weight: bold;
  color: #0a3622;
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

#maxParticipants {
  font-weight: bolder;
}
</style>
