#!/usr/bin/env node
/**
 * Place Data Quality Verification Script
 * Run with: node scripts/verify-places.mjs
 */

const BASE_URL = process.env.API_URL || 'http://localhost:8888';

async function fetchPlaces() {
  const res = await fetch(`${BASE_URL}/api/attractions`);
  const data = await res.json();
  return data.attractions || [];
}

async function main() {
  console.log('Fetching all places...\n');
  const places = await fetchPlaces();

  console.log(`Total places: ${places.length}\n`);

  // 1. Verification status distribution
  console.log('=== Verification Status ===');
  const statusCounts = {};
  places.forEach(p => {
    statusCounts[p.verification_status] = (statusCounts[p.verification_status] || 0) + 1;
  });
  Object.entries(statusCounts).sort((a,b) => b[1] - a[1]).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });

  // 2. Cost tier distribution
  console.log('\n=== Cost Tier Distribution ===');
  const tierCounts = { free: 0, budget: 0, mid_range: 0, luxury: 0, null: 0 };
  places.forEach(p => {
    const tier = p.cost_tier || 'null';
    tierCounts[tier] = (tierCounts[tier] || 0) + 1;
  });
  Object.entries(tierCounts).forEach(([tier, count]) => {
    const pct = ((count / places.length) * 100).toFixed(1);
    console.log(`  ${tier}: ${count} (${pct}%)`);
  });

  // 3. Primary category distribution
  console.log('\n=== Primary Categories (top 15) ===');
  const categoryCounts = {};
  places.forEach(p => {
    const cats = typeof p.categories === 'string' ? JSON.parse(p.categories) : p.categories;
    if (cats) {
      const entries = Object.entries(cats).filter(([,v]) => v > 0);
      entries.sort((a,b) => b[1] - a[1]);
      if (entries[0]) {
        const primary = entries[0][0];
        categoryCounts[primary] = (categoryCounts[primary] || 0) + 1;
      }
    }
  });
  Object.entries(categoryCounts)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });

  // 4. Place type distribution
  console.log('\n=== Place Types ===');
  const typeCounts = {};
  places.forEach(p => {
    typeCounts[p.place_type] = (typeCounts[p.place_type] || 0) + 1;
  });
  Object.entries(typeCounts).sort((a,b) => b[1] - a[1]).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  // 5. Province distribution
  console.log('\n=== Top Provinces ===');
  const provinceCounts = {};
  places.forEach(p => {
    const prov = p.province || 'unknown';
    provinceCounts[prov] = (provinceCounts[prov] || 0) + 1;
  });
  Object.entries(provinceCounts)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([prov, count]) => {
      console.log(`  ${prov}: ${count}`);
    });

  // 6. Quality issues
  console.log('\n=== Quality Issues ===');

  // Places with very short descriptions
  const shortDesc = places.filter(p => !p.description || p.description.length < 50);
  console.log(`  Short/missing descriptions: ${shortDesc.length}`);
  if (shortDesc.length > 0 && shortDesc.length <= 10) {
    shortDesc.forEach(p => console.log(`    - ${p.name}`));
  }

  // Places without categories
  const noCats = places.filter(p => !p.categories);
  console.log(`  Missing categories: ${noCats.length}`);

  // Places without cost_tier
  const noTier = places.filter(p => !p.cost_tier);
  console.log(`  Missing cost_tier: ${noTier.length}`);

  // 7. Sample places for manual review
  console.log('\n=== Sample Places (random 5) ===');
  const shuffled = [...places].sort(() => Math.random() - 0.5);
  shuffled.slice(0, 5).forEach(p => {
    const cats = typeof p.categories === 'string' ? JSON.parse(p.categories) : p.categories;
    const topCats = cats ? Object.entries(cats)
      .filter(([,v]) => v > 0.5)
      .sort((a,b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k,v]) => `${k}:${v}`)
      .join(', ') : 'none';

    console.log(`\n  ${p.name} (${p.place_type})`);
    console.log(`    Province: ${p.province || 'unknown'}`);
    console.log(`    Cost: ${p.cost_tier || 'unset'}`);
    console.log(`    Categories: ${topCats}`);
    console.log(`    Description: ${(p.description || '').slice(0, 80)}...`);
  });

  console.log('\n=== Done ===\n');
}

main().catch(console.error);
