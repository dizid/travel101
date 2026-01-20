#!/usr/bin/env node
/**
 * Batch AI Enrichment Script
 * Processes all pending places through the AI enrichment pipeline
 * Run with: node scripts/enrich-batch.mjs
 */

const BASE_URL = process.env.API_URL || 'http://localhost:8888';
const DELAY_MS = 2000; // 2 seconds between requests to avoid rate limiting

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getPendingPlaces() {
  const res = await fetch(`${BASE_URL}/api/enrich-place`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'get_pending', limit: 200 })
  });
  return res.json();
}

async function enrichPlace(placeId, name) {
  const res = await fetch(`${BASE_URL}/api/enrich-place`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'enrich_single', placeId })
  });
  return res.json();
}

async function main() {
  console.log('Fetching pending places...\n');

  const data = await getPendingPlaces();
  const pending = data.pending || [];

  console.log(`Found ${pending.length} pending places`);
  console.log(`Current counts: ${JSON.stringify(data.counts)}\n`);

  if (pending.length === 0) {
    console.log('No pending places to enrich!');
    return;
  }

  let success = 0;
  let failed = 0;

  for (let i = 0; i < pending.length; i++) {
    const place = pending[i];
    const progress = `[${i + 1}/${pending.length}]`;

    try {
      console.log(`${progress} Enriching: ${place.name}`);
      const result = await enrichPlace(place.id, place.name);

      if (result.status === 'ai_scored') {
        console.log(`  -> ${result.primary_category} (${result.confidence * 100}% confidence)`);
        success++;
      } else if (result.error) {
        console.log(`  -> ERROR: ${result.error}`);
        failed++;
      } else {
        console.log(`  -> Status: ${result.status || 'unknown'}`);
        failed++;
      }
    } catch (err) {
      console.log(`  -> FAILED: ${err.message}`);
      failed++;
    }

    // Rate limit delay (skip on last item)
    if (i < pending.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${pending.length}`);
}

main().catch(console.error);
