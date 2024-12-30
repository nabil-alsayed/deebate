<template>
  <div class="d-flex flex-column full-width" style="width: 100%">
    <div class="d-flex flex-row justify-content-between align-items-center" style="color: grey">
      <h2 class="title">{{ debates.length }} Debates</h2>
      <div class="d-flex flex-row column-gap-2 align-items-center justify-content-center" style="font-size: 20px">
        <div class="d-flex flex-row column-gap-2 justify-content-center align-items-center" @click="toggleSort" style="cursor: pointer;">
          <h2 class="title">End Time</h2>
          <i :class="['bi', sortOrder === 'asc' ? 'bi-sort-up' : 'bi-sort-up inactive']"></i>
          <i :class="['bi', sortOrder === 'desc' ? 'bi-sort-down' : 'bi-sort-down inactive']"></i>
        </div>
      </div>
    </div>

    <!-- Skeleton loader while fetching debates -->
    <ul v-if="loading">
      <li v-for="n in 5" :key="n" class="debate-item skeleton-debate">
        <div class="skeleton skeleton-header"></div>
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-tag"></div>
        <div class="skeleton skeleton-argument"></div>
        <div class="skeleton skeleton-button"></div>
      </li>
    </ul>

    <!-- Display actual debates if not loading -->
    <ul v-if="!loading && debates.length">
      <li v-for="debate in debates" :key="debate._id" class="debate-item">
        <debate-item :debateObj="debate" :key="debate._id" />
      </li>
    </ul>

    <!-- Empty state -->
    <div v-if="!loading && !debates.length" class="empty-list">
      <img :src="EmptyListIllustration" alt="empty" style="width: 300px; height: 300px" />
      <p>Wooopsy. No debates yet!</p>
    </div>
  </div>
</template>

<script>
import { Api } from '@/api/v1/Api.js';
import DebateItem from '@/components/debates/DebateItem.vue';
import EmptyListIllustration from '@/assets/illustrations/debate-list-empty.svg';

export default {
  name: 'DebateList',
  components: { DebateItem },
  props: {
    filteredDebates: {
      type: Array,
      default: () => [],
    },
    user: {
      type: [String, null],
      default: null,
    },
  },
  data() {
    return {
      debates: [],
      error: null,
      sortOrder: 'desc',
      loading: true,
      selectedCategory: localStorage.getItem('selectedCategory') || null,
      EmptyListIllustration,
    };
  },
  watch: {
    filteredDebates(newResults) {
      this.debates = newResults;
    },
  },
  created() {
    this.selectedCategory = '';
    localStorage.removeItem('selectedCategory');
    this.getDebates();
  },
  updated() {
    this.selectedCategory = localStorage.getItem('selectedCategory');
  },
  methods: {
    getDebates() {
      this.loading = true;

      // Build the query parameters dynamically
      const queryParams = [];

      // Add user query if exists
      if (this.user) {
        queryParams.push(`user=${this.user}`);
      }

      // Add sort query (it's always present)
      queryParams.push(`sort=${this.sortOrder}`);

      // Add category filter query if exists
      if (this.selectedCategory) {
        queryParams.push(`category=${this.selectedCategory}`);
      }

      // Join the query params with '&'
      const queryString = queryParams.length ? `?${queryParams.join('&')}` : '';

      // Make the API call
      Api.get(`/debates${queryString}`)
        .then((response) => {
          this.debates = response.data.debates;
        })
        .catch((error) => {
          console.error(error);
          this.error = 'An error occurred while fetching debates. Please try again later.';
        })
        .finally(() => {
          this.loading = false;
        });
    },

    toggleSort() {
      // Toggle the sort order
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';

      // Fetch debates again with new sort order
      this.getDebates();
    },

    updateCategory(newCategory) {
      // Update the selected category and store it in local storage
      this.selectedCategory = newCategory;
      localStorage.setItem('selectedCategory', newCategory);

      // Fetch debates again with the updated category
      this.getDebates();
    }
  }
};
</script>

<style scoped>
ul,
li {
  list-style-type: none;
  margin: 0;
  padding: 0;
}

.full-width {
  width: 100%;
}

.empty-list {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 400px;
  font-weight: 650;
  font-size: 25px;
  color: grey;
}

.debate-item {
  background-color: white;
  border: 0.5px solid #dad9d9;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.07);
  border-radius: 15px;
  padding: 15px;
  margin-bottom: 15px;
}

.title {
  color: grey;
  font-size: 18px;
  font-weight: 550;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.inactive {
  display: none;
}

/* Skeleton Loader Styles */
.skeleton-debate {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton {
  background-color: #e0e0e0;
  border-radius: 4px;
  animation: pulse 0.3s infinite;
}

.skeleton-header {
  width: 100px;
  height: 20px;
}

.skeleton-title {
  width: 70%;
  height: 30px;
}

.skeleton-tag {
  width: 60px;
  height: 20px;
  border-radius: 10px;
}

.skeleton-argument {
  width: 100%;
  height: 40px;
}

.skeleton-button {
  width: 100px;
  height: 30px;
  border-radius: 5px;
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
</style>
