import { describe, it, expect } from 'vitest'
import { calculateMatchScore, getMatchReasons, type UserPrefs, type AttractionCategories } from './matching.mts'

describe('matching', () => {
  describe('calculateMatchScore', () => {
    it('should return 50 for users without preferences', () => {
      const score = calculateMatchScore({}, { beach: 0.8 })
      expect(score).toBe(50)
    })

    it('should return 50 for null preferences', () => {
      const score = calculateMatchScore(null as unknown as UserPrefs, { beach: 0.8 })
      expect(score).toBe(50)
    })

    it('should calculate score based on interests with 3x weight', () => {
      const prefs: UserPrefs = {
        interests: ['beach'],
      }
      const categories: AttractionCategories = {
        beach: 1.0,
      }

      const score = calculateMatchScore(prefs, categories)
      // Score should be high since interest matches perfectly
      expect(score).toBe(100)
    })

    it('should calculate score based on travel style with 2.5x weight', () => {
      const prefs: UserPrefs = {
        travelStyle: ['adventure'],
      }
      const categories: AttractionCategories = {
        adventure: 0.8,
      }

      const score = calculateMatchScore(prefs, categories)
      expect(score).toBe(80)
    })

    it('should calculate score based on budget with 2x weight', () => {
      const prefs: UserPrefs = {
        budget: 'budget',
      }
      const categories: AttractionCategories = {
        budget: 0.9,
      }

      const score = calculateMatchScore(prefs, categories)
      expect(score).toBe(90)
    })

    it('should penalize budget mismatch when budget user and luxury attraction', () => {
      const prefs: UserPrefs = {
        budget: 'budget',
      }
      const categories: AttractionCategories = {
        budget: 0.1,
        luxury: 0.9,
      }

      const score = calculateMatchScore(prefs, categories)
      // Should be lower due to penalty
      expect(score).toBeLessThan(50)
    })

    it('should penalize budget mismatch when luxury user and budget attraction', () => {
      const prefs: UserPrefs = {
        budget: 'luxury',
      }
      const categories: AttractionCategories = {
        luxury: 0.1,
        budget: 0.9,
      }

      const score = calculateMatchScore(prefs, categories)
      // Should have penalty applied
      expect(score).toBeLessThan(50)
    })

    it('should map temples interest to culture category', () => {
      const prefs: UserPrefs = {
        interests: ['temples'],
      }
      const categories: AttractionCategories = {
        culture: 0.9,
      }

      const score = calculateMatchScore(prefs, categories)
      expect(score).toBe(90)
    })

    it('should match couple group type to romantic category', () => {
      const prefs: UserPrefs = {
        groupType: 'couple',
      }
      const categories: AttractionCategories = {
        romantic: 0.8,
      }

      const score = calculateMatchScore(prefs, categories)
      expect(score).toBe(80)
    })

    it('should match family group type to family category', () => {
      const prefs: UserPrefs = {
        groupType: 'family',
      }
      const categories: AttractionCategories = {
        family: 0.7,
      }

      const score = calculateMatchScore(prefs, categories)
      expect(score).toBe(70)
    })

    it('should match digital_nomad trip type to nomad category', () => {
      const prefs: UserPrefs = {
        tripType: 'digital_nomad',
      }
      const categories: AttractionCategories = {
        nomad: 1.0,
      }

      const score = calculateMatchScore(prefs, categories)
      expect(score).toBe(100)
    })

    it('should combine multiple preferences for final score', () => {
      const prefs: UserPrefs = {
        interests: ['beach', 'food'],
        travelStyle: ['relaxation'],
        budget: 'mid-range',
        groupType: 'couple',
      }
      const categories: AttractionCategories = {
        beach: 0.9,
        food: 0.8,
        relaxation: 0.7,
        romantic: 0.6,
      }

      const score = calculateMatchScore(prefs, categories)
      // Should be a weighted combination
      expect(score).toBeGreaterThan(50)
      expect(score).toBeLessThan(100)
    })

    it('should return 50 when no categories match interests', () => {
      const prefs: UserPrefs = {
        interests: ['underwater-basket-weaving'],
      }
      const categories: AttractionCategories = {
        beach: 0.9,
        culture: 0.8,
      }

      const score = calculateMatchScore(prefs, categories)
      // No match for the interest, so totalWeight stays 0 → DEFAULT_SCORE (50)
      expect(score).toBe(50)
    })

    it('should return 50 when totalWeight is 0', () => {
      const prefs: UserPrefs = {
        interests: [],
        travelStyle: [],
      }
      const categories: AttractionCategories = {
        beach: 0.9,
      }

      const score = calculateMatchScore(prefs, categories)
      expect(score).toBe(50)
    })
  })

  describe('getMatchReasons', () => {
    it('should return empty array for users without preferences', () => {
      const reasons = getMatchReasons({}, { beach: 0.8 })
      expect(reasons).toEqual([])
    })

    it('should return empty array for null preferences', () => {
      const reasons = getMatchReasons(null as unknown as UserPrefs, { beach: 0.8 })
      expect(reasons).toEqual([])
    })

    it('should return reason for matching interest', () => {
      const prefs: UserPrefs = {
        interests: ['beach'],
      }
      const categories: AttractionCategories = {
        beach: 0.9,
      }

      const reasons = getMatchReasons(prefs, categories)
      expect(reasons).toContain('Perfect for beach lovers')
    })

    it('should return reason for matching travel style', () => {
      const prefs: UserPrefs = {
        travelStyle: ['nightlife'],
      }
      const categories: AttractionCategories = {
        nightlife: 0.8,
      }

      const reasons = getMatchReasons(prefs, categories)
      expect(reasons).toContain('Great nightlife scene')
    })

    it('should return up to 2 reasons only', () => {
      const prefs: UserPrefs = {
        interests: ['beach', 'food', 'culture', 'nature'],
      }
      const categories: AttractionCategories = {
        beach: 0.9,
        food: 0.9,
        culture: 0.9,
        nature: 0.9,
      }

      const reasons = getMatchReasons(prefs, categories)
      expect(reasons.length).toBeLessThanOrEqual(2)
    })

    it('should prioritize top matching categories (>= 0.7 score)', () => {
      const prefs: UserPrefs = {
        interests: ['beach', 'nature'],
      }
      const categories: AttractionCategories = {
        beach: 0.9,
        nature: 0.5, // Below threshold
      }

      const reasons = getMatchReasons(prefs, categories)
      expect(reasons).toContain('Perfect for beach lovers')
      expect(reasons).not.toContain('Beautiful natural setting')
    })

    it('should use highest category reason if no specific matches', () => {
      const prefs: UserPrefs = {
        interests: ['temples'],
      }
      const categories: AttractionCategories = {
        beach: 0.9,
        nightlife: 0.8,
      }

      const reasons = getMatchReasons(prefs, categories)
      // Should get reason for highest category (beach)
      expect(reasons).toContain('Perfect for beach lovers')
    })

    it('should return correct reason strings for all categories', () => {
      const reasonMap: Record<string, string> = {
        beach: 'Perfect for beach lovers',
        nightlife: 'Great nightlife scene',
        culture: 'Rich cultural experiences',
        food: 'Amazing food scene',
        nature: 'Beautiful natural setting',
        wellness: 'Ideal for wellness seekers',
        adventure: 'Exciting adventures await',
        party: 'Vibrant party atmosphere',
        relaxation: 'Perfect for unwinding',
        romantic: 'Romantic getaway spot',
        family: 'Family-friendly destination',
        budget: 'Easy on the wallet',
        luxury: 'Premium experience',
        nomad: 'Great for remote work',
        authentic: 'Authentic local experience',
      }

      for (const [category, expectedReason] of Object.entries(reasonMap)) {
        const prefs: UserPrefs = {
          interests: [category],
        }
        const categories: AttractionCategories = {
          [category]: 0.9,
        }

        const reasons = getMatchReasons(prefs, categories)
        expect(reasons).toContain(expectedReason)
      }
    })

    it('should map culture category back to temples for matching', () => {
      const prefs: UserPrefs = {
        interests: ['temples'],
      }
      const categories: AttractionCategories = {
        culture: 0.9,
      }

      const reasons = getMatchReasons(prefs, categories)
      expect(reasons).toContain('Rich cultural experiences')
    })
  })
})
