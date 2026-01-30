<script setup lang="ts">
// The diverse community of Chiang Mai

const peopleGroups = [
  {
    id: 'thai',
    emoji: '👩🏻',
    title: 'Thai Women',
    subtitle: 'The Heart of Chiang Mai',
    color: 'from-amber-400 to-orange-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    description: 'From morning market vendors to young entrepreneurs, Thai women are the soul of this city.',
    types: [
      { name: 'Marktdames', desc: 'Up at 4am, always smiling, selling the freshest produce' },
      { name: 'Temple Grandmas', desc: 'Daily offerings, keeping traditions alive' },
      { name: 'Young Entrepreneurs', desc: 'Running trendy cafés and boutiques' },
      { name: 'University Students', desc: 'CMU campus buzzing with ambition' },
    ],
    quote: '"Sabai sabai" – take it easy, no rush',
  },
  {
    id: 'expats',
    emoji: '🌍',
    title: 'Western Expats',
    subtitle: 'Found Their Paradise',
    color: 'from-teal-400 to-emerald-500',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    description: 'They came for a week, stayed for years. The mountains and lifestyle have a way of keeping people.',
    types: [
      { name: 'Digital Nomads', desc: 'Laptops open at Maya Mall, building online empires' },
      { name: 'Retirees', desc: 'Golf mornings, massage afternoons, living the dream' },
      { name: 'Artists & Creatives', desc: 'Studios in Nimmanhaemin, inspired by the North' },
      { name: 'Teachers', desc: 'Making a difference, one classroom at a time' },
    ],
    quote: '"Best decision I ever made"',
  },
  {
    id: 'tourists',
    emoji: '✈️',
    title: 'Tourists',
    subtitle: 'The Curious Travelers',
    color: 'from-rose-400 to-pink-500',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    description: 'From backpackers to luxury travelers, everyone finds their own Chiang Mai adventure.',
    types: [
      { name: 'Backpackers', desc: 'Old City hostels, pad thai for 50 baht' },
      { name: 'Cooking Class Fans', desc: 'Learning to make khao soi like a local' },
      { name: 'Temple Hoppers', desc: '300+ temples to discover, challenge accepted' },
      { name: 'Elephant Lovers', desc: 'Ethical sanctuaries, unforgettable moments' },
    ],
    quote: '"I need more time here!"',
  },
]
</script>

<template>
  <div class="min-h-screen">
    <!-- Hero Section -->
    <section class="relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-teal-50/30" />

      <!-- Decorative blobs -->
      <div class="absolute top-20 left-10 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl" />
      <div class="absolute top-40 right-20 w-48 h-48 bg-teal-200/30 rounded-full blur-3xl" />
      <div class="absolute bottom-10 left-1/3 w-56 h-56 bg-rose-200/30 rounded-full blur-3xl" />

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 md:pt-20 md:pb-24">
        <div class="text-center max-w-3xl mx-auto">
          <!-- Badge -->
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-full shadow-soft mb-6 animate-fade-in">
            <span class="text-xl">🌴</span>
            <span class="text-gray-600 text-sm font-medium">Chiang Mai Community</span>
          </div>

          <!-- Title -->
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-gray-900 mb-6 animate-slide-up">
            The People of
            <span class="text-gradient-thai block mt-2">Chiang Mai</span>
          </h1>

          <!-- Subtitle -->
          <p class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8 animate-slide-up animate-delay-100">
            A beautiful mix of cultures, lifestyles, and stories. Three worlds colliding in the mountains of Northern Thailand.
          </p>

          <!-- Emoji row -->
          <div class="flex items-center justify-center gap-6 text-4xl animate-fade-in animate-delay-200">
            <span class="hover:scale-125 transition-transform cursor-default">👩🏻</span>
            <span class="text-gray-300">+</span>
            <span class="hover:scale-125 transition-transform cursor-default">🌍</span>
            <span class="text-gray-300">+</span>
            <span class="hover:scale-125 transition-transform cursor-default">✈️</span>
            <span class="text-gray-300">=</span>
            <span class="hover:scale-125 transition-transform cursor-default">❤️</span>
          </div>
        </div>
      </div>

      <!-- Wave divider -->
      <div class="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full">
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>

    <!-- People Cards Section -->
    <section class="py-12 md:py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid md:grid-cols-3 gap-8">
          <div
            v-for="(group, index) in peopleGroups"
            :key="group.id"
            class="rounded-2xl border-2 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            :class="[group.bgColor, group.borderColor]"
            :style="{ animationDelay: `${index * 100}ms` }"
          >
            <!-- Card Header -->
            <div
              class="p-6 text-white bg-gradient-to-r"
              :class="group.color"
            >
              <div class="text-5xl mb-3">{{ group.emoji }}</div>
              <h2 class="text-2xl font-display font-bold">{{ group.title }}</h2>
              <p class="text-white/80 text-sm mt-1">{{ group.subtitle }}</p>
            </div>

            <!-- Card Body -->
            <div class="p-6">
              <p class="text-gray-600 mb-6">{{ group.description }}</p>

              <!-- Types list -->
              <ul class="space-y-4">
                <li
                  v-for="type in group.types"
                  :key="type.name"
                  class="flex items-start gap-3"
                >
                  <span class="text-lg mt-0.5">•</span>
                  <div>
                    <span class="font-semibold text-gray-900">{{ type.name }}</span>
                    <p class="text-sm text-gray-500">{{ type.desc }}</p>
                  </div>
                </li>
              </ul>

              <!-- Quote -->
              <div class="mt-6 pt-6 border-t border-gray-200">
                <p class="text-gray-500 italic text-center">{{ group.quote }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Fun Fact Section -->
    <section class="py-12 md:py-16 bg-gradient-to-b from-white to-gray-50">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div class="card-thai p-8">
          <div class="text-4xl mb-4">☕</div>
          <h3 class="text-xl font-display font-bold text-gray-900 mb-3">
            The Melting Pot
          </h3>
          <p class="text-gray-600">
            On any given day, you might find a Thai grandmother teaching a Dutch retiree
            how to make som tam, while a Australian digital nomad works on their startup
            next to Korean tourists practicing their Thai. This is the magic of Chiang Mai.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
