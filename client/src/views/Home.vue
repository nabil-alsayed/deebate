<template>
  <div class="main-container-home w-100 vh-100 column-gap-3 p-3">
    <!-- MENU -->
    <div class="menu-bar">
      <MenuBar />
    </div>

    <!-- MAIN CONTENT -->
    <div class="main-content flex-grow-1 flex-column row-gap-3">
      <!-- SEARCH AND USER INFO -->
      <SearchBar />

      <!-- DEBATE LIST AND WIDGETS -->
      <div class="main-body">
        <!-- DEBATE FORM AND CATEGORY SELECTOR (Mobile Layout) -->
        <div class="d-flex flex-column row-gap-3" id="debates-sections">
          <div class="debate-form d-flex flex-column row-gap-1">
            <h2 class="title">Post a Debate</h2>
            <DebateForm />
          </div>

          <!-- Category Selector -->
          <div v-if="isMobileLayout">
            <h2 class="title" style="margin: 0">Category</h2>
            <CategorySelector @category-selected="filterDebatesByCategory" />
          </div>

          <!-- Debate List -->
          <DebateList :filteredDebates="filteredDebates" />
        </div>

        <!-- Right side Widgets (CategorySelector or EditProfile) for Desktop -->
        <div v-if="!isMobileLayout" class="right-bar" style="min-width: 250px">
          <h2 class="title">Category</h2>
          <CategorySelector @category-selected="filterDebatesByCategory" />
        </div>
      </div>
    </div>
  </div>
</template>


<script>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { Api } from '@/api/v1/Api.js';
import MenuBar from '@/components/MenuBar.vue';
import DebateForm from '@/components/debates/DebateForm.vue';
import DebateList from '@/components/debates/DebateList.vue';
import CategorySelector from '@/components/CategorySelector.vue';
import SearchBar from '@/components/top-bar/SearchBar.vue';

export default {
  name: 'Home',
  components: {
    SearchBar,
    MenuBar,
    DebateForm,
    DebateList,
    CategorySelector,
  },
  setup() {
    const debates = ref([]);
    const selectedCategory = ref(localStorage.getItem('selectedCategory') || '');

    // Detect screen width for responsive layout
    const isMobileLayout = ref(window.innerWidth <= 992);

    // Method to check screen size and update isMobileLayout
    const updateLayout = () => {
      isMobileLayout.value = window.innerWidth <= 992;
    };

    // Add event listeners on mounted and clean up on unmounted
    onMounted(() => {
      window.addEventListener('resize', updateLayout);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('resize', updateLayout);
    });

    // Fetch debates from API
    const fetchDebates = async () => {
      try {
        const categoryQuery = selectedCategory.value ? `?category=${selectedCategory.value}` : '';
        const response = await Api.get(`/debates${categoryQuery}`);
        debates.value = response.data.debates;
      } catch (error) {
        console.error('Error fetching debates:', error);
        debates.value = [];
      }
    };

    // Filter debates based on selected category
    const filteredDebates = computed(() => {
      let filtered = debates.value;
      if (selectedCategory.value) {
        filtered = filtered.filter(debate => debate.category === selectedCategory.value);
      }
      return filtered;
    });

    // Watch for changes in selected category and fetch debates accordingly
    watch(selectedCategory, () => {
      localStorage.setItem('selectedCategory', selectedCategory.value);
      fetchDebates();
    });

    // Fetch all debates on component mount
    onMounted(fetchDebates);

    // Method to update category from CategorySelector
    const filterDebatesByCategory = (category) => {
      selectedCategory.value = category;
    };

    return {
      debates,
      filteredDebates,
      filterDebatesByCategory,
      isMobileLayout,
    };
  },
};
</script>



<style scoped>
.main-content {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
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

.main-body {
  display: flex;
  flex-direction: row;
  column-gap: 15px;
}

.main-container-home {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  row-gap: 15px;
}

/* Responsive */

@media (max-width: 992px) {
  .main-container-home {
    flex-direction: column;
    row-gap: 15px;
  }

  .main-body {
    flex-direction: column;
    row-gap: 15px;
  }

  .right-bar {
    display: none;
  }

  .debate-form {
    order: 0;
  }
}

@media (max-width: 576px) {
  .main-body {
    flex-direction: column;
  }
}
</style>

