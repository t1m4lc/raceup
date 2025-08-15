<template>
  <div>
    <header class="border-b py-2 sticky top-0 bg-background z-40">
      <div class="container mx-auto flex items-center justify-between">
        <NuxtLink to="/" class="font-bold text-xl">RaceUp</NuxtLink>
        
        <div class="flex items-center gap-4">
          <CartSheet />
          <UserProfileButton />
        </div>
      </div>
    </header>
    
    <slot />
  </div>
</template>

<script setup>
import CartSheet from '@/components/cart/CartSheet.vue'
import UserProfileButton from '@/components/UserProfileButton.vue'
</script>
