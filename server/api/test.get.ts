export default defineEventHandler(async (event) => {
  try {
    // Simple test to verify API is working
    return {
      status: "ok",
      message: "API is working",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      stripe_configured: !!(
        process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLIC_KEY
      ),
    };
  } catch (error: any) {
    return {
      status: "error",
      message: error.message,
      error: error,
    };
  }
});
