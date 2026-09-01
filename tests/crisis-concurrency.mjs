import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000';

async function testCrisis() {
  console.log('🚨 TESTING EXACT 3-SECOND SIMULTANEOUS CRISIS HOLD...\n');

  const createRes = await fetch(`${BASE_URL}/api/room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'CREATE' }),
  });
  const { code, hostToken } = await createRes.json();

  const p1 = (await (await fetch(`${BASE_URL}/api/room`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'JOIN', code, playerId: 'p1', name: 'P1' }) })).json()).player;
  const p2 = (await (await fetch(`${BASE_URL}/api/room`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'JOIN', code, playerId: 'p2', name: 'P2' }) })).json()).player;
  const p3 = (await (await fetch(`${BASE_URL}/api/room`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'JOIN', code, playerId: 'p3', name: 'P3' }) })).json()).player;

  await fetch(`${BASE_URL}/api/room`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'START', code, hostToken }) });

  // Trigger Crisis via Admin
  await fetch(`${BASE_URL}/api/room/${code}/admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: 'TRIGGER_CRISIS', hostToken }),
  });

  // Test 1: P1 and P2 hold, P3 doesn't -> Not all holding
  await fetch(`${BASE_URL}/api/room/${code}/action`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'CRISIS_HOLD_START', playerId: 'p1', sessionToken: p1.sessionToken }) });
  await fetch(`${BASE_URL}/api/room/${code}/action`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'CRISIS_HOLD_START', playerId: 'p2', sessionToken: p2.sessionToken }) });

  let state = (await (await fetch(`${BASE_URL}/api/room/${code}/state?playerId=host&hostToken=${hostToken}`)).json()).room;
  assert(!state.activeCrisis.resolved, 'Crisis must not resolve with only 2/3 holding');
  console.log('[PASS 1] Crisis not resolved when only 2 of 3 players hold');

  // Test 2: P3 joins hold -> All 3 holding!
  await fetch(`${BASE_URL}/api/room/${code}/action`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'CRISIS_HOLD_START', playerId: 'p3', sessionToken: p3.sessionToken }) });
  
  // Test 3: Release early after 1 second (1000ms < 3000ms)
  await new Promise((r) => setTimeout(r, 1000));
  await fetch(`${BASE_URL}/api/room/${code}/action`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'CRISIS_HOLD_END', playerId: 'p3', sessionToken: p3.sessionToken }) });

  state = (await (await fetch(`${BASE_URL}/api/room/${code}/state?playerId=host&hostToken=${hostToken}`)).json()).room;
  assert(!state.activeCrisis.resolved, 'Crisis must not resolve if released early at 1000ms');
  console.log('[PASS 2] Early release at 1000ms correctly aborted the hold without resolving');

  // Test 4: All 3 hold continuously for full 3000ms
  await fetch(`${BASE_URL}/api/room/${code}/action`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'CRISIS_HOLD_START', playerId: 'p3', sessionToken: p3.sessionToken }) });
  console.log('Holding for 3100ms continuous...');
  await new Promise((r) => setTimeout(r, 3300));

  state = (await (await fetch(`${BASE_URL}/api/room/${code}/state?playerId=host&hostToken=${hostToken}`)).json()).room;
  assert(state.activeCrisis.resolved === true, 'Crisis MUST resolve after 3000ms continuous hold');
  assert(state.uploadPercent >= 20, 'Upload percent must increase by +20% on crisis resolution');
  console.log(`[PASS 3] Exact 3-second simultaneous hold succeeded! Upload is now ${state.uploadPercent}%`);

  console.log('\n🎉 CRISIS SIMULTANEOUS HOLD SUITE PASSED 100%!');
}

testCrisis().catch((err) => {
  console.error('❌ Crisis test failed:', err);
  process.exit(1);
});
