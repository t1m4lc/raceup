<template>
  <div class="container py-8 space-y-8">
    <!-- Loading state -->
    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <div class="text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p class="mt-4 text-muted-foreground">Loading organization...</p>
      </div>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="py-20">
      <div class="text-center">
        <AlertCircleIcon class="mx-auto h-12 w-12 text-destructive" />
        <h3 class="mt-4 text-lg font-medium">Organization not found</h3>
        <p class="mt-2 text-muted-foreground">
          We couldn't find an organization with that name.
        </p>
        <Button class="mt-4" @click="router.push('/')">Back to home</Button>
      </div>
    </div>
    
    <div v-else>
      <!-- Organization header -->
      <div class="relative">
        <div class="h-56 w-full bg-muted overflow-hidden rounded-lg">
          <img 
            v-if="organization?.banner_url" 
            :src="organization.banner_url" 
            class="w-full h-full object-cover"
            alt="Organization banner"
          />
          <div v-else class="flex items-center justify-center h-full">
            <ImageIcon class="h-20 w-20 text-muted-foreground/20" />
          </div>
        </div>
        
        <div class="absolute -bottom-16 left-8">
          <Avatar class="h-32 w-32 border-4 border-background">
            <AvatarImage v-if="organization?.logo_url" :src="organization.logo_url" alt="Organization logo" />
            <AvatarFallback class="text-3xl">
              {{ organization?.name?.charAt(0) || '?' }}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
      
      <!-- Organization details -->
      <div class="mt-20 space-y-6">
        <div>
          <h1 class="text-3xl font-bold">{{ organization?.name }}</h1>
          <p v-if="organization?.description" class="mt-2 text-muted-foreground">
            {{ organization.description }}
          </p>
        </div>
        
        <!-- Organization members -->
        <div>
          <h2 class="text-xl font-semibold mb-4">Team Members</h2>
          
          <div v-if="members.length === 0" class="text-muted-foreground">
            No team members found
          </div>
          
          <div v-else class="flex flex-wrap gap-4">
            <div v-for="member in members" :key="member.profile_id" class="flex items-center gap-2">
              <Avatar>
                <AvatarImage v-if="member.profile?.avatar_url" :src="member.profile.avatar_url" :alt="member.profile.full_name" />
                <AvatarFallback>{{ member.profile?.full_name?.charAt(0) || '?' }}</AvatarFallback>
              </Avatar>
              <div>
                <p class="text-sm font-medium">{{ member.profile?.full_name }}</p>
                <p class="text-xs text-muted-foreground capitalize">{{ member.role }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Events -->
        <div class="mt-8">
          <h2 class="text-xl font-semibold mb-4">Events</h2>
          
          <div v-if="events.length === 0" class="text-muted-foreground">
            No events yet
          </div>
          
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card v-for="event in events" :key="event.id" class="overflow-hidden flex flex-col">
              <CardHeader class="p-0">
                <div class="aspect-video w-full relative bg-muted">
                  <img 
                    v-if="event.image_url" 
                    :src="event.image_url" 
                    class="w-full h-full object-cover"
                    :alt="event.name"
                  />
                  <div v-else class="flex items-center justify-center h-full">
                    <CalendarIcon class="h-12 w-12 text-muted-foreground/20" />
                  </div>
                  
                  <!-- Latest edition badge -->
                  <div 
                    v-if="event.is_latest" 
                    class="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full"
                  >
                    Latest Edition
                  </div>
                </div>
              </CardHeader>
              
              <CardContent class="flex-grow pt-4">
                <h3 class="font-semibold text-lg line-clamp-1">{{ event.name }}</h3>
                <p class="text-muted-foreground text-sm mt-1">{{ formatDate(event.start_date) }}</p>
                <p class="line-clamp-2 text-sm mt-2">{{ event.description || 'No description available' }}</p>
              </CardContent>
              
              <CardFooter class="pt-0">
                <Button variant="outline" class="w-full" :to="`/event/${event.slug}`">
                  View Event
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertCircleIcon, CalendarIcon, ImageIcon } from 'lucide-vue-next';
import { useRoute, useRouter } from 'vue-router';
import { ref, computed } from 'vue';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader
} from '@/components/ui/card';

definePageMeta({
  layout: 'default',
});

const route = useRoute();
const router = useRouter();
const { $dayjs } = useNuxtApp();
const client = useSupabaseClient();

// Get organization slug from route params
const slug = computed(() => route.params.slug as string);

// Fetch state
const isLoading = ref(true);
const error = ref(null);
const organization = ref(null);
const members = ref([]);
const events = ref([]);

// Format date helper
const formatDate = (dateString) => {
  return $dayjs(dateString).format('MMM D, YYYY');
};

// Fetch organization data
async function fetchOrganizationData() {
  isLoading.value = true;
  error.value = null;
  
  try {
    // Fetch organization details
    const { data: orgData, error: orgError } = await client
      .from('organizations')
      .select('*')
      .eq('slug', slug.value)
      .maybeSingle();
      
    if (orgError) throw orgError;
    if (!orgData) throw new Error('Organization not found');
    organization.value = orgData;
    
    // Fetch organization members with profiles
    const { data: memberData, error: memberError } = await client
      .from('organization_members')
      .select(`
        id, role, profile_id,
        profile: profiles (
          id, full_name, avatar_url
        )
      `)
      .eq('organization_id', organization.value.id);
      
    if (memberError) throw memberError;
    members.value = memberData;
    
    // Fetch events (using new events table)
    const { data: eventData, error: eventError } = await client
      .from('events')
      .select(`
        id, slug, name, description, start_date, end_date, image_url
      `)
      .eq('organization_id', organization.value.id)
      .order('start_date', { ascending: false })
      .limit(6);
      
    if (eventError) throw eventError;
    
    events.value = eventData || [];
  } catch (err) {
    console.error('Error fetching organization data:', err);
    error.value = err;
  } finally {
    isLoading.value = false;
  }
}

// Fetch data on component mount
onMounted(() => {
  fetchOrganizationData();
});

// Watch for slug changes
watch(() => route.params.slug, () => {
  fetchOrganizationData();
});
</script>
