<script setup lang="ts">
import { ref, computed } from 'vue'
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

// Accordion state — track which sections are open
const openSections = ref<Set<string>>(new Set())

// Section completion checks
const sectionComplete = computed(() => ({
  nationality: !!formData.value.nationality,
  tripType: !!formData.value.tripType,
  travelStyle: formData.value.travelStyle.length > 0,
  interests: formData.value.interests.length > 0,
  courseInterests: true, // optional
  dietaryRestrictions: true, // optional
  groupType: !!formData.value.groupType,
  budget: !!formData.value.budget,
  ageGroup: !!formData.value.ageGroup,
}))

const completedCount = computed(() =>
  Object.values(sectionComplete.value).filter(Boolean).length
)
const totalSections = computed(() => Object.keys(sectionComplete.value).length)

function toggleSection(key: string) {
  if (openSections.value.has(key)) {
    openSections.value.delete(key)
  } else {
    openSections.value.add(key)
  }
  // Trigger reactivity
  openSections.value = new Set(openSections.value)
}

function isSectionOpen(key: string): boolean {
  return openSections.value.has(key)
}

// Auto-open first incomplete section on load
const firstIncomplete = Object.entries(sectionComplete.value).find(([, done]) => !done)
if (firstIncomplete) {
  openSections.value.add(firstIncomplete[0])
} else {
  // All complete — open nothing (user can expand as needed)
}

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

        <!-- Value explanation + progress -->
        <div class="bg-gradient-to-r from-primary-50 to-accent-50/50 rounded-xl p-4 border border-primary-100">
          <div class="flex items-start gap-3">
            <span class="text-xl flex-shrink-0">✨</span>
            <div class="text-sm flex-1">
              <div class="flex items-center justify-between mb-1">
                <p class="font-medium text-gray-800">How personalization works</p>
                <span class="text-xs font-medium text-primary-600">{{ completedCount }}/{{ totalSections }} complete</span>
              </div>
              <p class="text-gray-600 mb-3">
                We match every destination against your interests, travel style, and budget.
                You'll see match scores (like "92% match") on places that fit you best.
              </p>
              <!-- Progress bar -->
              <div class="w-full h-1.5 bg-primary-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
                  :style="{ width: `${(completedCount / totalSections) * 100}%` }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Form (Accordion sections) -->
    <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div class="space-y-3">
        <!-- Nationality -->
        <div class="card-thai !p-0 overflow-hidden">
          <button @click="toggleSection('nationality')" class="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-gray-50 transition-colors">
            <div class="flex items-center gap-3">
              <span class="text-xl">🌍</span>
              <div>
                <h2 class="text-base font-semibold text-gray-900">Nationality</h2>
                <p class="text-xs text-gray-500">{{ formData.nationality || 'Determines visa requirements' }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <CheckCircleFilled v-if="sectionComplete.nationality" class="text-green-500" />
              <span class="text-gray-400 text-lg">{{ isSectionOpen('nationality') ? '−' : '+' }}</span>
            </div>
          </button>
          <div v-show="isSectionOpen('nationality')" class="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100 pt-4">
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
        </div>

        <!-- Trip Type -->
        <div class="card-thai !p-0 overflow-hidden">
          <button @click="toggleSection('tripType')" class="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-gray-50 transition-colors">
            <div class="flex items-center gap-3">
              <span class="text-xl">✈️</span>
              <div>
                <h2 class="text-base font-semibold text-gray-900">Type of Trip</h2>
                <p class="text-xs text-gray-500">{{ formData.tripType ? tripTypes.find(t => t.value === formData.tripType)?.label : 'Holiday, nomad, or long-term?' }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <CheckCircleFilled v-if="sectionComplete.tripType" class="text-green-500" />
              <span class="text-gray-400 text-lg">{{ isSectionOpen('tripType') ? '−' : '+' }}</span>
            </div>
          </button>
          <div v-show="isSectionOpen('tripType')" class="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100 pt-4">
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
        </div>

        <!-- Travel Style -->
        <div class="card-thai !p-0 overflow-hidden">
          <button @click="toggleSection('travelStyle')" class="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-gray-50 transition-colors">
            <div class="flex items-center gap-3">
              <span class="text-xl">🎯</span>
              <div>
                <h2 class="text-base font-semibold text-gray-900">Travel Style</h2>
                <p class="text-xs text-gray-500">{{ formData.travelStyle.length ? formData.travelStyle.map(s => travelStyles.find(ts => ts.value === s)?.label).join(', ') : 'Select all that apply' }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <CheckCircleFilled v-if="sectionComplete.travelStyle" class="text-green-500" />
              <span class="text-gray-400 text-lg">{{ isSectionOpen('travelStyle') ? '−' : '+' }}</span>
            </div>
          </button>
          <div v-show="isSectionOpen('travelStyle')" class="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100 pt-4">
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
        </div>

        <!-- Interests -->
        <div class="card-thai !p-0 overflow-hidden">
          <button @click="toggleSection('interests')" class="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-gray-50 transition-colors">
            <div class="flex items-center gap-3">
              <span class="text-xl">💡</span>
              <div>
                <h2 class="text-base font-semibold text-gray-900">Interests</h2>
                <p class="text-xs text-gray-500">{{ formData.interests.length ? formData.interests.map(i => interests.find(ii => ii.value === i)?.label).join(', ') : 'What do you want to experience?' }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <CheckCircleFilled v-if="sectionComplete.interests" class="text-green-500" />
              <span class="text-gray-400 text-lg">{{ isSectionOpen('interests') ? '−' : '+' }}</span>
            </div>
          </button>
          <div v-show="isSectionOpen('interests')" class="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100 pt-4">
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
        </div>

        <!-- Course Interests -->
        <div class="card-thai !p-0 overflow-hidden">
          <button @click="toggleSection('courseInterests')" class="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-gray-50 transition-colors">
            <div class="flex items-center gap-3">
              <span class="text-xl">🎓</span>
              <div>
                <h2 class="text-base font-semibold text-gray-900">Learning Interests</h2>
                <p class="text-xs text-gray-500">{{ formData.courseInterests.length ? formData.courseInterests.map(c => courseInterests.find(ci => ci.value === c)?.label).join(', ') : 'Courses & workshops (optional)' }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400">Optional</span>
              <span class="text-gray-400 text-lg">{{ isSectionOpen('courseInterests') ? '−' : '+' }}</span>
            </div>
          </button>
          <div v-show="isSectionOpen('courseInterests')" class="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100 pt-4">
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
        </div>

        <!-- Dietary Restrictions -->
        <div class="card-thai !p-0 overflow-hidden">
          <button @click="toggleSection('dietaryRestrictions')" class="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-gray-50 transition-colors">
            <div class="flex items-center gap-3">
              <span class="text-xl">🍽️</span>
              <div>
                <h2 class="text-base font-semibold text-gray-900">Dietary Preferences</h2>
                <p class="text-xs text-gray-500">{{ formData.dietaryRestrictions.length ? formData.dietaryRestrictions.map(d => dietaryRestrictions.find(dr => dr.value === d)?.label).join(', ') : 'For restaurant recommendations (optional)' }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400">Optional</span>
              <span class="text-gray-400 text-lg">{{ isSectionOpen('dietaryRestrictions') ? '−' : '+' }}</span>
            </div>
          </button>
          <div v-show="isSectionOpen('dietaryRestrictions')" class="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100 pt-4">
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
        </div>

        <!-- Group Type -->
        <div class="card-thai !p-0 overflow-hidden">
          <button @click="toggleSection('groupType')" class="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-gray-50 transition-colors">
            <div class="flex items-center gap-3">
              <span class="text-xl">👥</span>
              <div>
                <h2 class="text-base font-semibold text-gray-900">Who's traveling?</h2>
                <p class="text-xs text-gray-500">{{ formData.groupType ? groupTypes.find(g => g.value === formData.groupType)?.label : 'Solo, couple, family, or friends?' }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <CheckCircleFilled v-if="sectionComplete.groupType" class="text-green-500" />
              <span class="text-gray-400 text-lg">{{ isSectionOpen('groupType') ? '−' : '+' }}</span>
            </div>
          </button>
          <div v-show="isSectionOpen('groupType')" class="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100 pt-4">
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
        </div>

        <!-- Budget -->
        <div class="card-thai !p-0 overflow-hidden">
          <button @click="toggleSection('budget')" class="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-gray-50 transition-colors">
            <div class="flex items-center gap-3">
              <span class="text-xl">💰</span>
              <div>
                <h2 class="text-base font-semibold text-gray-900">Budget</h2>
                <p class="text-xs text-gray-500">{{ formData.budget ? budgetLevels.find(b => b.value === formData.budget)?.label : 'Your spending style' }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <CheckCircleFilled v-if="sectionComplete.budget" class="text-green-500" />
              <span class="text-gray-400 text-lg">{{ isSectionOpen('budget') ? '−' : '+' }}</span>
            </div>
          </button>
          <div v-show="isSectionOpen('budget')" class="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100 pt-4">
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
        </div>

        <!-- Age Group -->
        <div class="card-thai !p-0 overflow-hidden">
          <button @click="toggleSection('ageGroup')" class="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-gray-50 transition-colors">
            <div class="flex items-center gap-3">
              <span class="text-xl">🎂</span>
              <div>
                <h2 class="text-base font-semibold text-gray-900">Age Group</h2>
                <p class="text-xs text-gray-500">{{ formData.ageGroup ? ageGroups.find(a => a.value === formData.ageGroup)?.label : 'Helps tailor recommendations' }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <CheckCircleFilled v-if="sectionComplete.ageGroup" class="text-green-500" />
              <span class="text-gray-400 text-lg">{{ isSectionOpen('ageGroup') ? '−' : '+' }}</span>
            </div>
          </button>
          <div v-show="isSectionOpen('ageGroup')" class="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100 pt-4">
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
