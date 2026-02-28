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
            📜 Legal
          </div>
          <h1 class="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-3">
            Terms of Service
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
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Acceptance of Terms</h2>
          <p class="text-gray-600">
            By accessing and using HappyRoam, you agree to be bound by these Terms of Service.
            If you do not agree to these terms, please do not use our service.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Service Description</h2>
          <p class="text-gray-600">
            HappyRoam provides travel information, visa guidance, and trip planning tools for Thailand.
            Our service includes both free features and premium Pro features available through subscription.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">User Responsibilities</h2>
          <p class="text-gray-600 mb-4">
            As a user, you agree to:
          </p>
          <ul class="list-disc pl-6 text-gray-600 space-y-2">
            <li>Provide accurate information in your profile</li>
            <li>Use the service for lawful purposes only</li>
            <li>Not attempt to circumvent any security features</li>
            <li>Respect the intellectual property of HappyRoam</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Disclaimer</h2>
          <p class="text-gray-600">
            The information provided on HappyRoam is for general guidance only.
            Visa requirements and travel regulations change frequently.
            Always verify current requirements with official government sources and embassies before traveling.
            We are not responsible for decisions made based on our information.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Pro Subscription</h2>
          <p class="text-gray-600">
            Pro subscriptions are billed according to the plan selected.
            Cancellations take effect at the end of the current billing period.
            Refunds are handled on a case-by-case basis.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
          <p class="text-gray-600">
            HappyRoam and its creators shall not be liable for any indirect, incidental,
            or consequential damages arising from your use of the service.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Contact</h2>
          <p class="text-gray-600">
            For questions about these terms, please visit our
            <RouterLink to="/contact" class="text-primary-600 hover:text-primary-700 underline">contact page</RouterLink>.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>
