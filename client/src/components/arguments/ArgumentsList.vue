<template>
  <div class="d-flex flex-column row-gap-2">
    <div v-if="arguments.length > 1"
         v-for="argument in arguments"
         :key="argument._id"
         class="d-flex flex-column row-gap-3"
    >
      <argument @argument-deleted="handleArgumentDeleted" :argument="argument" :debate="debate"/>
    </div>
    <div v-else-if="arguments.length === 1">
      <argument @argument-deleted="handleArgumentDeleted" :argument="arguments[0]" :debate="debate" />
    </div>
  </div>
</template>

<script>
import Argument from '@/components/arguments/Argument.vue'
import JoinDebate from '@/components/arguments/JoinDebate.vue'

export default {
  name: 'ArgumentsList',

  props: {
    arguments: {
      type: Array,
      required: true
    },
    debate: {
      type: Object,
      required: true
    },
  },

  components: {
    Argument,
    JoinDebate
  },

  data() {
    return {
      // Local copy of arguments to manage deletion without mutating the prop
      localArguments: [...this.arguments]
    }
  },

  watch: {
    // Ensure local copy stays in sync if parent updates arguments prop
    arguments(newArgs) {
      this.localArguments = [...newArgs]
    }
  },

  methods: {
    /**
     * Handles argument deletion and updates the local list
     * @param {String} deletedArgumentId - ID of the argument to remove
     */
    handleArgumentDeleted(deletedArgumentId) {
      this.localArguments = this.localArguments.filter(arg => arg._id !== deletedArgumentId)
      this.$emit('update-arguments', this.localArguments)
    }
  }
}
</script>

<style scoped>

</style>
