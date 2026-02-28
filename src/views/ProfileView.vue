<script setup lang="ts">
import { ref } from 'vue'
import { watchDebounced } from '@vueuse/core'
import { useUserStore } from '@stores/userStore'
import { useAuth } from '@composables/useAuth'
import type { TravelStyle, Interest, GroupType, BudgetLevel, TripType, AgeGroup, CourseInterest, DietaryRestriction } from '@/types'
import { countryOptions, filterCountry } from '@/data/countries'
import {
  UserOutlined,
  CheckCircleFilled,
  LoadingOutlined,
} from '@ant-design/icons-vue'

const userStore = useUserStore()
const { savePreferences } = useAuth()

// Local state for form
const formData = ref({
  nationality: userStore.profile.prefs.nationality,
  travelStyle: [...userStore.profile.prefs.travelStyle],
  interests: [...userStore.profile.prefs.interests],
  groupType: userStore.profile.prefs.groupType,
  budget: userStore.profile.prefs.budget,
  tripType: userStore.profile.prefs.tripType,
  ageGroup: userStore.profile.prefs.ageGroup,
  courseInterests: [...(userStore.profile.prefs.courseInterests || [])],
  dietaryRestrictions: [...(userStore.profile.prefs.dietaryRestrictions || [])],
})

// Auto-save status indicator
const saveStatus = ref<'idle' | 'saving' | 'saved'>('idle')

const travelStyles: { value: TravelStyle; label: string; icon: string }[] = [
  { value: 'party', label: 'Party', icon: '🎉' },
  { value: 'adventure', label: 'Adventure', icon: '🏔️' },
  { value: 'relaxation', label: 'Relaxation', icon: '🧘' },
  { value: 'culture', label: 'Culture', icon: '🏛️' },
]

const interests: { value: Interest; label: string; icon: string }[] = [
  { value: 'beach', label: 'Beaches', icon: '🏖️' },
  { value: 'nightlife', label: 'Nightlife', icon: '🌙' },
  { value: 'temples', label: 'Temples', icon: '🛕' },
  { value: 'food', label: 'Food', icon: '🍜' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'nature', label: 'Nature', icon: '🌿' },
  { value: 'wellness', label: 'Wellness', icon: '💆' },
]

const groupTypes: { value: GroupType; label: string; icon: string }[] = [
  { value: 'solo', label: 'Solo', icon: '🧍' },
  { value: 'couple', label: 'Couple', icon: '👫' },
  { value: 'family', label: 'Family', icon: '👨‍👩‍👧' },
  { value: 'friends', label: 'Friends', icon: '👯' },
]

const budgetLevels: { value: BudgetLevel; label: string; description: string }[] = [
  { value: 'budget', label: 'Budget', description: 'Hostels, street food' },
  { value: 'mid', label: 'Mid-range', description: 'Hotels, local restaurants' },
  { value: 'luxury', label: 'Luxury', description: 'Resorts, fine dining' },
]

const tripTypes: { value: TripType; label: string; icon: string }[] = [
  { value: 'holiday', label: 'Holiday', icon: '🌴' },
  { value: 'digital_nomad', label: 'Digital Nomad', icon: '💻' },
  { value: 'expat', label: 'Long-term Stay', icon: '🏠' },
]

const ageGroups: { value: AgeGroup; label: string }[] = [
  { value: 'young', label: '18-35' },
  { value: 'middle', label: '36-55' },
  { value: 'senior', label: '55+' },
]

const courseInterests: { value: CourseInterest; label: string; icon: string }[] = [
  { value: 'cooking', label: 'Cooking', icon: '🍳' },
  { value: 'meditation', label: 'Meditation', icon: '🧘' },
  { value: 'diving', label: 'Diving', icon: '🤿' },
  { value: 'massage', label: 'Massage', icon: '💆' },
  { value: 'muay_thai', label: 'Muay Thai', icon: '🥊' },
  { value: 'yoga', label: 'Yoga', icon: '🧘‍♀️' },
]

const dietaryRestrictions: { value: DietaryRestriction; label: string; icon: string }[] = [
  { value: 'vegetarian', label: 'Vegetarian', icon: '🥗' },
  { value: 'vegan', label: 'Vegan', icon: '🌱' },
  { value: 'halal', label: 'Halal', icon: '☪️' },
  { value: 'gluten_free', label: 'Gluten-free', icon: '🌾' },
]

function toggleStyle(style: TravelStyle) {
  const index = formData.value.travelStyle.indexOf(style)
  if (index > -1) {
    formData.value.travelStyle.splice(index, 1)
  } else {
    formData.value.travelStyle.push(style)
  }
}

function toggleInterest(interest: Interest) {
  const index = formData.value.interests.indexOf(interest)
  if (index > -1) {
    formData.value.interests.splice(index, 1)
  } else {
    formData.value.interests.push(interest)
  }
}

function toggleCourseInterest(course: CourseInterest) {
  const index = formData.value.courseInterests.indexOf(course)
  if (index > -1) {
    formData.value.courseInterests.splice(index, 1)
  } else {
    formData.value.courseInterests.push(course)
  }
}

function toggleDietaryRestriction(restriction: DietaryRestriction) {
  const index = formData.value.dietaryRestrictions.indexOf(restriction)
  if (index > -1) {
    formData.value.dietaryRestrictions.splice(index, 1)
  } else {
    formData.value.dietaryRestrictions.push(restriction)
  }
}

// Auto-save profile changes with debounce
watchDebounced(
  formData,
  async () => {
    saveStatus.value = 'saving'

    // Update store (triggers localStorage + Vue reactivity)
    userStore.updatePreferences({
      nationality: formData.value.nationality,
      travelStyle: formData.value.travelStyle,
      interests: formData.value.interests,
      groupType: formData.value.groupType,
      budget: formData.value.budget,
      tripType: formData.value.tripType,
      ageGroup: formData.value.ageGroup,
      courseInterests: formData.value.courseInterests,
      dietaryRestrictions: formData.value.dietaryRestrictions,
    })

    // Sync to backend if authenticated
    await savePreferences()

    saveStatus.value = 'saved'
    setTimeout(() => {
      saveStatus.value = 'idle'
    }, 2000)
  },
  { debounce: 500, deep: true }
)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    <!-- Header -->
    <div class="bg-white border-b border-gray-100">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white shadow-thai">
            <UserOutlined class="text-2xl" />
          </div>
          <div>
            <h1 class="text-2xl font-display font-bold text-gray-900">
              My Travel Profile
            </h1>
            <p class="text-gray-500">
              Your preferences power personalized recommendations across the site
            </p>
          </div>
        </div>

        <!-- Value explanation -->
        <div class="bg-gradient-to-r from-primary-50 to-accent-50/50 rounded-xl p-4 border border-primary-100">
          <div class="flex items-start gap-3">
            <span class="text-xl flex-shrink-0">✨</span>
            <div class="text-sm">
              <p class="font-medium text-gray-800 mb-1">How personalization works</p>
              <p class="text-gray-600">
                We match every destination against your interests, travel style, and budget.
                You'll see match scores (like "92% match") on places that fit you best.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Form -->
    <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div class="space-y-8">
        <!-- Nationality -->
        <div class="card-thai">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Nationality</h2>
          <a-select
            v-model:value="formData.nationality"
            placeholder="Type to search your country..."
            class="w-full"
            size="large"
            show-search
            :filter-option="filterCountry"
            :options="countryOptions"
            option-filter-prop="label"
          />
        </div>

        <!-- Trip Type -->
        <div class="card-thai">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Type of Trip</h2>
          <div class="grid sm:grid-cols-3 gap-3">
            <button
              v-for="type in tripTypes"
              :key="type.value"
              @click="formData.tripType = type.value"
              class="p-4 rounded-xl border-2 text-left transition-all"
              :class="formData.tripType === type.value
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'"
            >
              <span class="text-2xl block mb-2">{{ type.icon }}</span>
              <span class="font-medium text-gray-900">{{ type.label }}</span>
            </button>
          </div>
        </div>

        <!-- Travel Style -->
        <div class="card-thai">
          <h2 class="text-lg font-semibold text-gray-900 mb-2">Travel Style</h2>
          <p class="text-sm text-gray-500 mb-4">Select all that apply</p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              v-for="style in travelStyles"
              :key="style.value"
              @click="toggleStyle(style.value)"
              class="p-4 rounded-xl border-2 text-center transition-all"
              :class="formData.travelStyle.includes(style.value)
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'"
            >
              <span class="text-2xl block mb-2">{{ style.icon }}</span>
              <span class="font-medium text-gray-900 text-sm">{{ style.label }}</span>
            </button>
          </div>
        </div>

        <!-- Interests -->
        <div class="card-thai">
          <h2 class="text-lg font-semibold text-gray-900 mb-2">Interests</h2>
          <p class="text-sm text-gray-500 mb-4">What do you want to experience?</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="interest in interests"
              :key="interest.value"
              @click="toggleInterest(interest.value)"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all"
              :class="formData.interests.includes(interest.value)
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'"
            >
              <span>{{ interest.icon }}</span>
              {{ interest.label }}
            </button>
          </div>
        </div>

        <!-- Course Interests -->
        <div class="card-thai">
          <h2 class="text-lg font-semibold text-gray-900 mb-2">Learning Interests</h2>
          <p class="text-sm text-gray-500 mb-4">Want to take courses or workshops?</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="course in courseInterests"
              :key="course.value"
              @click="toggleCourseInterest(course.value)"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all"
              :class="formData.courseInterests.includes(course.value)
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'"
            >
              <span>{{ course.icon }}</span>
              {{ course.label }}
            </button>
          </div>
        </div>

        <!-- Dietary Restrictions -->
        <div class="card-thai">
          <h2 class="text-lg font-semibold text-gray-900 mb-2">Dietary Preferences</h2>
          <p class="text-sm text-gray-500 mb-4">Any dietary restrictions for restaurant recommendations?</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="restriction in dietaryRestrictions"
              :key="restriction.value"
              @click="toggleDietaryRestriction(restriction.value)"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all"
              :class="formData.dietaryRestrictions.includes(restriction.value)
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'"
            >
              <span>{{ restriction.icon }}</span>
              {{ restriction.label }}
            </button>
          </div>
        </div>

        <!-- Group Type -->
        <div class="card-thai">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Who's traveling?</h2>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              v-for="group in groupTypes"
              :key="group.value"
              @click="formData.groupType = group.value"
              class="p-4 rounded-xl border-2 text-center transition-all"
              :class="formData.groupType === group.value
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'"
            >
              <span class="text-2xl block mb-2">{{ group.icon }}</span>
              <span class="font-medium text-gray-900 text-sm">{{ group.label }}</span>
            </button>
          </div>
        </div>

        <!-- Budget -->
        <div class="card-thai">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Budget</h2>
          <div class="grid sm:grid-cols-3 gap-3">
            <button
              v-for="level in budgetLevels"
              :key="level.value"
              @click="formData.budget = level.value"
              class="p-4 rounded-xl border-2 text-left transition-all"
              :class="formData.budget === level.value
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'"
            >
              <span class="font-medium text-gray-900 block">{{ level.label }}</span>
              <span class="text-sm text-gray-500">{{ level.description }}</span>
            </button>
          </div>
        </div>

        <!-- Age Group -->
        <div class="card-thai">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Age Group</h2>
          <div class="flex gap-3">
            <button
              v-for="age in ageGroups"
              :key="age.value"
              @click="formData.ageGroup = age.value"
              class="px-6 py-3 rounded-xl border-2 transition-all"
              :class="formData.ageGroup === age.value
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'"
            >
              {{ age.label }}
            </button>
          </div>
        </div>

        <!-- Auto-save status indicator -->
        <div class="flex items-center justify-end pt-4">
          <Transition
            enter-active-class="transition duration-300"
            enter-from-class="opacity-0 translate-x-2"
            enter-to-class="opacity-100 translate-x-0"
            leave-active-class="transition duration-200"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
            mode="out-in"
          >
            <div
              v-if="saveStatus === 'saving'"
              key="saving"
              class="flex items-center gap-2 text-gray-500"
            >
              <LoadingOutlined class="animate-spin" />
              <span class="text-sm">Saving...</span>
            </div>
            <div
              v-else-if="saveStatus === 'saved'"
              key="saved"
              class="flex items-center gap-2 text-green-600"
            >
              <CheckCircleFilled />
              <span class="text-sm font-medium">All changes saved</span>
            </div>
            <div
              v-else
              key="idle"
              class="flex items-center gap-2 text-gray-400"
            >
              <span class="text-sm">Changes auto-save</span>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>
