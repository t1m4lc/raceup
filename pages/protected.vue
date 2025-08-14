<template>
  <div>
    <h1>Protected Page</h1>
    <p>This page is only accessible to authenticated users.</p>
  </div>
</template>


<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})
</script>
