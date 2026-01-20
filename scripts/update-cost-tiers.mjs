#!/usr/bin/env node
/**
 * Update cost_tier for all existing places
 * Run AFTER migration: node scripts/update-cost-tiers.mjs
 */

const BASE_URL = process.env.API_URL || 'http://localhost:8888';
const DELAY_MS = 500;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchAllPlaces() {
  const res = await fetch(`${BASE_URL}/api/attractions?limit=1000`);
  const data = await res.json();
  return data.attractions || [];
}

async function enrichPlace(placeId) {
  const res = await fetch(`${BASE_URL}/api/enrich-place`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'enrich_single', placeId })
  });
  return res.json();
}

async function main() {
  console.log('Fetching all places...\n');
  const places = await fetchAllPlaces();

  // Filter to only places without cost_tier
  const needsUpdate = places.filter(p => !p.cost_tier);
  console.log(`Total places: ${places.length}`);
  console.log(`Need cost_tier update: ${needsUpdate.length}\n`);

  if (needsUpdate.length === 0) {
    console.log('All places already have cost_tier!');
    return;
  }

  let success = 0;
  let failed = 0;

  for (let i = 0; i < needsUpdate.length; i++) {
    const place = needsUpdate[i];
    const progress = `[${i + 1}/${needsUpdate.length}]`;

    try {
      console.log(`${progress} Updating: ${place.name}`);
      const result = await enrichPlace(place.id);

      if (result.cost_tier) {
        console.log(`  -> ${result.cost_tier} (${result.primary_category})`);
        success++;
      } else if (result.error) {
        console.log(`  -> ERROR: ${result.error}`);
        failed++;
      } else {
        console.log(`  -> No cost_tier returned`);
        failed++;
      }
    } catch (err) {
      console.log(`  -> FAILED: ${err.message}`);
      failed++;
    }

    if (i < needsUpdate.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${needsUpdate.length}`);
}

main().catch(console.error);
