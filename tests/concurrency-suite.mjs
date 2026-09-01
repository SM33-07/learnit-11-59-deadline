// Concurrency, Authorization, Token Security & Asymmetric Isolation Verification Suite
import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('🚀 STARTING FULL SECURITY, CONCURRENCY & ASYMMETRIC TEST SUITE...\n');

  // 1. Create Room & Obtain Host Token
  const createRes = await fetch(`${BASE_URL}/api/room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'CREATE' }),
  });
  const createData = await createRes.json();
  const roomCode = createData.code;
  const hostToken = createData.hostToken;
  assert(hostToken && hostToken.startsWith('ht_'), 'Must receive valid hostToken on CREATE');
  console.log(`[PASS 1] Room Created: ${roomCode} with Host Token: ${hostToken.substring(0, 8)}...`);

  // 2. Join 3 Players & Verify Zero Raw Room Leakage in JOIN Response
  const p1Res = await fetch(`${BASE_URL}/api/room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'JOIN', code: roomCode, playerId: 'player_yellow', name: 'Alex Controls' }),
  });
  const p1Data = await p1Res.json();
  const tokenYellow = p1Data.sessionToken;
  assert(p1Data.room === undefined, 'JOIN response must NEVER return raw room object to player!');
  assert(p1Data.view !== undefined, 'JOIN response must return sanitized player view');
  assert(tokenYellow && tokenYellow.startsWith('st_'), 'Player must receive valid sessionToken');

  const p2Res = await fetch(`${BASE_URL}/api/room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'JOIN', code: roomCode, playerId: 'player_purple', name: 'Sam Blueprints' }),
  });
  const p2Data = await p2Res.json();
  const tokenPurple = p2Data.sessionToken;
  assert(p2Data.room === undefined, 'JOIN response must NEVER return raw room to Purple!');

  const p3Res = await fetch(`${BASE_URL}/api/room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'JOIN', code: roomCode, playerId: 'player_blue', name: 'Riley Directives' }),
  });
  const p3Data = await p3Res.json();
  const tokenBlue = p3Data.sessionToken;
  assert(p3Data.room === undefined, 'JOIN response must NEVER return raw room to Blue!');

  console.log('[PASS 2] 3 Players joined with distinct session tokens and ZERO raw room leakage');

  // 3. Test Host Authentication on START
  const unauthStart = await fetch(`${BASE_URL}/api/room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'START', code: roomCode, hostToken: 'invalid_fake_token' }),
  });
  const unauthStartData = await unauthStart.json();
  assert(unauthStartData.success === false, 'START must reject invalid hostToken');

  await fetch(`${BASE_URL}/api/room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'START', code: roomCode, hostToken }),
  });
  console.log('[PASS 3] Host token validated on START into 90s gameplay');

  // 4. Test Authenticated /state Projections
  const unauthYellow = await fetch(`${BASE_URL}/api/room/${roomCode}/state?playerId=player_yellow&sessionToken=bad_token`);
  assert(unauthYellow.status === 401, 'state endpoint must return 401 for bad session token');

  const viewYellowRes = await fetch(`${BASE_URL}/api/room/${roomCode}/state?playerId=player_yellow&sessionToken=${tokenYellow}`);
  const { view: viewYellow } = await viewYellowRes.json();

  const viewPurpleRes = await fetch(`${BASE_URL}/api/room/${roomCode}/state?playerId=player_purple&sessionToken=${tokenPurple}`);
  const { view: viewPurple } = await viewPurpleRes.json();

  const viewBlueRes = await fetch(`${BASE_URL}/api/room/${roomCode}/state?playerId=player_blue&sessionToken=${tokenBlue}`);
  const { view: viewBlue } = await viewBlueRes.json();

  // Validate Yellow Projection:
  assert(viewYellow.controlWidgets !== undefined, 'Yellow must have controlWidgets');
  assert(viewYellow.directives === undefined, 'Yellow must NOT receive directives');
  assert(viewYellow.schematics === undefined, 'Yellow must NOT receive schematics');
  viewYellow.controlWidgets.forEach((w) => {
    assert(w.targetValue === undefined, 'Yellow widgets must NEVER expose targetValue');
    assert(w.expectedValue === undefined, 'Yellow widgets must NEVER expose expectedValue');
  });
  console.log('[PASS 4A] Yellow authenticated projection verified: Has widgets, ZERO secret solutions or directives');

  // Validate Purple Projection:
  assert(viewPurple.schematics !== undefined, 'Purple must have schematics');
  assert(viewPurple.controlWidgets === undefined, 'Purple must NOT receive controlWidgets');
  assert(viewPurple.directives === undefined, 'Purple must NOT receive directives');
  console.log('[PASS 4B] Purple authenticated projection verified: Has schematics, ZERO control widgets or directives');

  // Validate Blue Projection:
  assert(viewBlue.directives !== undefined, 'Blue must have directives');
  assert(viewBlue.controlWidgets === undefined, 'Blue must NOT receive controlWidgets');
  assert(viewBlue.schematics === undefined, 'Blue must NOT receive schematics');
  console.log('[PASS 4C] Blue authenticated projection verified: Has directives, ZERO control widgets or schematics');

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

  // 6. Test Admin Command Authentication
  const unauthAdmin = await fetch(`${BASE_URL}/api/room/${roomCode}/admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: 'SKIP_PHASE', hostToken: 'invalid_token' }),
  });
  const unauthAdminData = await unauthAdmin.json();
  assert(unauthAdminData.success === false, 'Admin commands must require valid hostToken');
  console.log('[PASS 6] Admin route verified: Rejects unauthorized admin commands');

  // 7. Test Concurrency & In-Flight Rapid Actions
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

  // 8. Test 2-Player Mode Strict 1-Task Rule
  const create2P = await (await fetch(`${BASE_URL}/api/room`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'CREATE' }) })).json();
  await fetch(`${BASE_URL}/api/room`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'JOIN', code: create2P.code, playerId: '2p_1', name: 'P1' }) });
  await fetch(`${BASE_URL}/api/room`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'JOIN', code: create2P.code, playerId: '2p_2', name: 'P2' }) });
  await fetch(`${BASE_URL}/api/room`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'START', code: create2P.code, hostToken: create2P.hostToken }) });

  const room2P = await (await fetch(`${BASE_URL}/api/room/${create2P.code}/state?playerId=host&hostToken=${create2P.hostToken}`)).json();
  assert(room2P.room.mode === '2_PLAYER', 'Room must be 2_PLAYER');
  assert(room2P.room.activeTasks.length === 1, '2-Player room must strictly have exactly 1 active task to avoid role ambiguity');
  console.log('[PASS 8] 2-Player mode strict single-task isolation verified');

  console.log('\n🎉 ALL 8 TESTS PASSED WITH 100% SUCCESS!');
}

runTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
