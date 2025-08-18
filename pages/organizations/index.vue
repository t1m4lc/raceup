<template>
  <div class="container py-8 space-y-8">
    <h1 class="text-3xl font-bold">Organizations</h1>
    
    <!-- Loading state -->
    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <div class="text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p class="mt-4 text-muted-foreground">Loading organizations...</p>
      </div>
    </div>
    
    <!-- Organizations grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card v-for="org in organizations" :key="org.id" class="overflow-hidden flex flex-col">
        <!-- Organization Logo/Banner -->
        <CardHeader class="p-0">
          <div class="aspect-video w-full relative bg-muted">
            <img 
              v-if="org.banner_url" 
              :src="org.banner_url" 
              class="w-full h-full object-cover"
              :alt="org.name"
            />
            <div v-else class="flex items-center justify-center h-full">
              <ImageIcon class="h-12 w-12 text-muted-foreground/20" />
            </div>
            
            <!-- Organization Logo -->
            <div class="absolute -bottom-6 left-4">
              <Avatar class="h-12 w-12 border-2 border-background">
                <AvatarImage v-if="org.logo_url" :src="org.logo_url" :alt="org.name" />
                <AvatarFallback>{{ org.name?.charAt(0) || '?' }}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </CardHeader>
        
        <CardContent class="flex-grow pt-8">
          <h3 class="font-semibold text-lg">{{ org.name }}</h3>
          <p class="line-clamp-2 text-sm text-muted-foreground mt-2">
            {{ org.description || 'No description available' }}
          </p>
          
          <!-- Member avatars -->
          <div class="mt-4 flex -space-x-2 overflow-hidden">
            <Avatar v-for="member in org.members?.slice(0, 3)" :key="member.id" class="inline-block h-8 w-8 rounded-full border-2 border-background">
              <AvatarImage v-if="member.profile?.avatar_url" :src="member.profile.avatar_url" :alt="member.profile?.full_name" />
              <AvatarFallback>{{ member.profile?.full_name?.charAt(0) || '?' }}</AvatarFallback>
            </Avatar>
            
            <!-- More count -->
            <Avatar v-if="org.members && org.members.length > 3" class="inline-block h-8 w-8 rounded-full border-2 border-background bg-muted">
              <AvatarFallback class="bg-muted text-xs">+{{ org.members?.length ? org.members.length - 3 : 0 }}</AvatarFallback>
            </Avatar>
          </div>
          
          <!-- Latest event -->
          <div v-if="org.latest_event" class="mt-4 p-3 bg-muted/50 rounded-md">
            <p class="text-sm font-medium">Latest Event</p>
            <p class="text-sm">{{ org.latest_event.name }}</p>
            <p class="text-xs text-muted-foreground">{{ formatDate(org.latest_event.start_date) }}</p>
          </div>
        </CardContent>
        
        <CardFooter class="pt-0">
          <Button class="w-full" :to="`/organization/${org.slug}`">
            View Organization
          </Button>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ImageIcon } from 'lucide-vue-next';
import { ref } from 'vue';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader
} from '@/components/ui/card';
import type { Organization } from '~/types/organization';

definePageMeta({
  layout: 'default',
});

const { $dayjs } = useNuxtApp();
const client = useSupabaseClient();

// Fetch state
const isLoading = ref(true);
const organizations = ref<Organization[]>([]);

// Format date helper
const formatDate = (dateString: string) => {
  return $dayjs(dateString).format('MMM D, YYYY');
};

// Fetch organizations
async function fetchOrganizations() {
  try {
    isLoading.value = true;
    
    const { data: orgs, error: orgsError } = await client
      .from('organizations')
      .select('*')
      .order('name');
      
    if (orgsError) throw orgsError;
    
    // For each organization, fetch members and latest event
    const orgsWithDetails = await Promise.all(
      orgs.map(async (org) => {
        // Fetch members
        const { data: members } = await client
          .from('organization_members')
          .select(`
            id, role,
            profile: profiles (
              id, full_name, avatar_url
            )
          `)
          .eq('organization_id', org.id);
          
        // Fetch latest event (using new events table)
        const { data: events } = await client
          .from('events')
          .select(`
            id, name, slug, start_date
          `)
          .eq('organization_id', org.id)
          .order('start_date', { ascending: false })
          .limit(1);
          
        return {
          ...org,
          members: members || [],
          latest_event: events && events.length > 0 ? events[0] : null
        };
      })
    );
    
    organizations.value = orgsWithDetails;
  } catch (err) {
    console.error('Error fetching organizations:', err);
  } finally {
    isLoading.value = false;
  }
}

// Fetch data on component mount
onMounted(() => {
  fetchOrganizations();
});
</script>
