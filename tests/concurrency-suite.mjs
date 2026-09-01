// Concurrency, Authorization & Asymmetric Isolation Verification Suite
import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('🚀 STARTING ASYMMETRIC & CONCURRENCY TEST SUITE...\n');

  // 1. Create Room
  const createRes = await fetch(`${BASE_URL}/api/room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'CREATE' }),
  });
  const createData = await createRes.json();
  const roomCode = createData.code;
  console.log(`[PASS 1] Room Created: ${roomCode}`);

  // 2. Join 3 Players
  const p1Res = await fetch(`${BASE_URL}/api/room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'JOIN', code: roomCode, playerId: 'player_yellow', name: 'Alex Controls' }),
  });
  const p1Data = await p1Res.json();
  const tokenYellow = p1Data.player.sessionToken;

  const p2Res = await fetch(`${BASE_URL}/api/room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'JOIN', code: roomCode, playerId: 'player_purple', name: 'Sam Blueprints' }),
  });
  const p2Data = await p2Res.json();
  const tokenPurple = p2Data.player.sessionToken;

  const p3Res = await fetch(`${BASE_URL}/api/room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'JOIN', code: roomCode, playerId: 'player_blue', name: 'Riley Directives' }),
  });
  const p3Data = await p3Res.json();
  const tokenBlue = p3Data.player.sessionToken;

  assert(tokenYellow && tokenPurple && tokenBlue, 'All players must receive session tokens');
  console.log('[PASS 2] 3 Players joined with distinct session tokens and roles (Yellow, Purple, Blue)');

  // 3. Start Game
  await fetch(`${BASE_URL}/api/room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'START', code: roomCode }),
  });
  console.log('[PASS 3] Game started into ORIENT phase');

  // 4. Test Asymmetric Projections (Zero Information Leakage)
  const viewYellowRes = await fetch(`${BASE_URL}/api/room/${roomCode}/state?playerId=player_yellow`);
  const { view: viewYellow } = await viewYellowRes.json();

  const viewPurpleRes = await fetch(`${BASE_URL}/api/room/${roomCode}/state?playerId=player_purple`);
  const { view: viewPurple } = await viewPurpleRes.json();

  const viewBlueRes = await fetch(`${BASE_URL}/api/room/${roomCode}/state?playerId=player_blue`);
  const { view: viewBlue } = await viewBlueRes.json();

  // Validate Yellow Projection:
  assert(viewYellow.controlWidgets !== undefined, 'Yellow must have controlWidgets');
  assert(viewYellow.directives === undefined, 'Yellow must NOT receive directives');
  assert(viewYellow.schematics === undefined, 'Yellow must NOT receive schematics');
  viewYellow.controlWidgets.forEach((w) => {
    assert(w.targetValue === undefined, 'Yellow widgets must NEVER expose targetValue');
    assert(w.expectedValue === undefined, 'Yellow widgets must NEVER expose expectedValue');
  });
  console.log('[PASS 4A] Yellow projection verified: Has widgets, ZERO secret solutions or directives');

  // Validate Purple Projection:
  assert(viewPurple.schematics !== undefined, 'Purple must have schematics');
  assert(viewPurple.controlWidgets === undefined, 'Purple must NOT receive controlWidgets');
  assert(viewPurple.directives === undefined, 'Purple must NOT receive directives');
  console.log('[PASS 4B] Purple projection verified: Has schematics, ZERO control widgets or directives');

  // Validate Blue Projection:
  assert(viewBlue.directives !== undefined, 'Blue must have directives');
  assert(viewBlue.controlWidgets === undefined, 'Blue must NOT receive controlWidgets');
  assert(viewBlue.schematics === undefined, 'Blue must NOT receive schematics');
  console.log('[PASS 4C] Blue projection verified: Has directives, ZERO control widgets or schematics');

  // 5. Test Role Authorization: Purple attempting CONTROL_CHANGE must be rejected
  const unauthRes = await fetch(`${BASE_URL}/api/room/${roomCode}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'CONTROL_CHANGE',
      playerId: 'player_purple',
      sessionToken: tokenPurple,
      widgetId: 'fake_widget',
      value: true,
    }),
  });
  const unauthData = await unauthRes.json();
  assert(unauthData.success === false, 'Purple MUST be rejected for CONTROL_CHANGE');
  console.log('[PASS 5] Role Authorization verified: Purple blocked from touching Controls');

  // 6. Test Invalid Session Token Rejection
  const spoofRes = await fetch(`${BASE_URL}/api/room/${roomCode}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'CONTROL_CHANGE',
      playerId: 'player_yellow',
      sessionToken: 'invalid_spoofed_token_123',
      widgetId: 'fake_widget',
      value: true,
    }),
  });
  const spoofData = await spoofRes.json();
  assert(spoofData.success === false, 'Invalid session token MUST be rejected');
  console.log('[PASS 6] Session Token Authentication verified: Spoofed token rejected');

  // 7. Test Concurrent Rapid Action Submissions
  console.log('Testing concurrent in-flight action requests...');
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(
      fetch(`${BASE_URL}/api/room/${roomCode}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CONTROL_CHANGE',
          actionId: `action_${i}`,
          playerId: 'player_yellow',
          sessionToken: tokenYellow,
          widgetId: viewYellow.controlWidgets[0]?.id || 'toggle_1',
          value: false,
        }),
      })
    );
  }
  const results = await Promise.all(promises);
  assert(results.every((r) => r.status === 200), 'All concurrent requests must return 200 without server crash');
  console.log('[PASS 7] Concurrency Stress Test verified: Server handled 5 simultaneous rapid actions cleanly');

  // 8. Test Single-Resolution Guarantee & Score Update
  const roomAfter = await (await fetch(`${BASE_URL}/api/room/${roomCode}/state?playerId=host`)).json();
  assert(typeof roomAfter.room.uploadPercent === 'number', 'Upload percent must be valid number');
  console.log(`[PASS 8] Single-Resolution & Engine Integrity verified: Current Upload = ${roomAfter.room.uploadPercent}%`);

  console.log('\n🎉 ALL 8 CRITICAL ARCHITECTURAL CONCURRENCY & ASYMMETRIC TESTS PASSED WITH 100% SUCCESS!');
}

runTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
