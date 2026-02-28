<script setup lang="ts">
const lastUpdated = 'January 2026'
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    <!-- Header -->
    <div class="bg-white border-b border-gray-100">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div class="text-center">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-4">
            🔒 Legal
          </div>
          <h1 class="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-3">
            Privacy Policy
          </h1>
          <p class="text-gray-500 text-sm">
            Last updated: {{ lastUpdated }}
          </p>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <div class="prose prose-gray max-w-none">
        <section class="mb-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
          <p class="text-gray-600 mb-4">
            When you use HappyRoam, we may collect the following types of information:
          </p>
          <ul class="list-disc pl-6 text-gray-600 space-y-2">
            <li>Account information (email, name) when you sign up</li>
            <li>Travel preferences you provide (nationality, travel style, budget)</li>
            <li>Usage data to improve our recommendations</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
          <p class="text-gray-600 mb-4">
            We use your information to:
          </p>
          <ul class="list-disc pl-6 text-gray-600 space-y-2">
            <li>Provide personalized travel recommendations</li>
            <li>Process visa eligibility assessments</li>
            <li>Improve our services and user experience</li>
            <li>Send relevant updates about Thailand travel (with your consent)</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Cookies</h2>
          <p class="text-gray-600">
            We use essential cookies to keep you signed in and remember your preferences.
            We do not use cookies for advertising purposes.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Third-Party Services</h2>
          <p class="text-gray-600">
            We use trusted third-party services for authentication (Clerk) and payments (Stripe).
            These services have their own privacy policies governing their use of your data.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Your Rights</h2>
          <p class="text-gray-600 mb-4">
            You have the right to:
          </p>
          <ul class="list-disc pl-6 text-gray-600 space-y-2">
            <li>Access your personal data</li>
            <li>Request correction of your data</li>
            <li>Delete your account and associated data</li>
            <li>Export your data</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Contact</h2>
          <p class="text-gray-600">
            For privacy-related questions, please visit our
            <RouterLink to="/contact" class="text-primary-600 hover:text-primary-700 underline">contact page</RouterLink>.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>
