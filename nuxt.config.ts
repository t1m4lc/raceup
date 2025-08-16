import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: [
    "@nuxt/content",
    "@nuxt/eslint",
    "@nuxt/image",
    "shadcn-nuxt",
    "@nuxtjs/supabase",
    "@unlok-co/nuxt-stripe",
    "dayjs-nuxt",
    "@pinia/nuxt",
    "@vueuse/nuxt",
  ],
  css: ["~/assets/css/tailwind.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  shadcn: {
    prefix: "",
    componentDir: "./components/ui",
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
    redirectOptions: {
      login: "/login",
      callback: "/confirm",
      include: ["/admin(/*)?", "/onboarding"],
      exclude: [],
      saveRedirectToCookie: true,
    },
  },
  stripe: {
    server: {
      key: process.env.STRIPE_SECRET_KEY,
      options: {
        // your api options override for stripe server side
        // https://github.com/stripe/stripe-node?tab=readme-ov-file#configuration
      },
    },
    client: {
      key: process.env.STRIPE_PUBLIC_KEY,
      // manualClientLoad: true, // if you want to have control where you are going to load the client
      // your api options override for stripe client side https://stripe.com/docs/js/initializing#init_stripe_js-options
      options: {},
    },
  },
  dayjs: {
    locales: ["en", "fr"],
    plugins: ["relativeTime", "utc", "timezone"],
    defaultLocale: "fr",
    defaultTimezone: "Europe/Paris",
  },
});
