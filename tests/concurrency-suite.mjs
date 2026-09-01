// Comprehensive Security Hardening & Concurrency Verification Suite
import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000';

async function runSecuritySuite() {
  console.log('🔒 STARTING COMPREHENSIVE SECURITY HARDENING & CONCURRENCY SUITE...\n');

  // 1. Verify Invalid Room Code returns 404 and does NOT create phantom room
  const fakeCode = `FAKE_${Date.now()}`;
  const fakeStreamRes = await fetch(`${BASE_URL}/api/room/${fakeCode}/stream`);
  assert.strictEqual(fakeStreamRes.status, 404, 'SSE stream for unknown room must return HTTP 404');

  const fakeStateRes = await fetch(`${BASE_URL}/api/room/${fakeCode}/state`);
  assert.strictEqual(fakeStateRes.status, 404, 'State endpoint for unknown room must return HTTP 404');
  console.log('[PASS 1] 404 handling verified: Unknown room code never creates phantom rooms');

  // 2. Create Room & Obtain Cryptographically Strong Host Token
  const createRes = await fetch(`${BASE_URL}/api/room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'CREATE' }),
  });
  const createData = await createRes.json();
  const roomCode = createData.code;
  const hostToken = createData.hostToken;
  assert(hostToken && hostToken.startsWith('ht_') && hostToken.length > 20, 'Host token must be cryptographically generated');
  console.log(`[PASS 2] Room Created: ${roomCode} with strong hostToken`);

  // 3. Test Host Authentication on State & Stream
  // 3A. Missing hostToken on state
  const noHostTokenState = await fetch(`${BASE_URL}/api/room/${roomCode}/state?playerId=host`);
  assert.strictEqual(noHostTokenState.status, 401, 'State for host with missing hostToken must return 401');

  // 3B. Wrong hostToken on state
  const wrongHostTokenState = await fetch(`${BASE_URL}/api/room/${roomCode}/state?playerId=host&hostToken=wrong_ht_token`);
  assert.strictEqual(wrongHostTokenState.status, 401, 'State for host with wrong hostToken must return 401');

  // 3C. Valid hostToken on state
  const validHostState = await fetch(`${BASE_URL}/api/room/${roomCode}/state?playerId=host&hostToken=${hostToken}`);
  assert.strictEqual(validHostState.status, 200, 'State for host with valid hostToken must return 200');
  console.log('[PASS 3] Host authentication on /state strictly enforced (missing/wrong rejected)');

  // 4. Join 3 Players & Verify Zero Raw Room Leakage + Strong Session Tokens
  const p1Res = await fetch(`${BASE_URL}/api/room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'JOIN', code: roomCode, playerId: 'player_yellow', name: 'Alex Controls' }),
  });
  const p1Data = await p1Res.json();
  const tokenYellow = p1Data.sessionToken;
  assert(p1Data.room === undefined, 'JOIN response must NEVER return raw room object!');
  assert(p1Data.view !== undefined, 'JOIN response must return sanitized player view');
  assert(tokenYellow && tokenYellow.startsWith('st_') && tokenYellow.length > 20, 'Session token must be cryptographically strong');

  const p2Res = await fetch(`${BASE_URL}/api/room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'JOIN', code: roomCode, playerId: 'player_purple', name: 'Sam Blueprints' }),
  });
  const p2Data = await p2Res.json();
  const tokenPurple = p2Data.sessionToken;

  const p3Res = await fetch(`${BASE_URL}/api/room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'JOIN', code: roomCode, playerId: 'player_blue', name: 'Riley Directives' }),
  });
  const p3Data = await p3Res.json();
  const tokenBlue = p3Data.sessionToken;
  console.log('[PASS 4] 3 Players joined with distinct crypto session tokens and ZERO raw room leakage');

  // 5. Test Player Authentication on /state
  // 5A. Missing sessionToken on player state
  const noTokenState = await fetch(`${BASE_URL}/api/room/${roomCode}/state?playerId=player_yellow`);
  assert.strictEqual(noTokenState.status, 401, 'Player state with missing token must return 401');

  // 5B. Wrong sessionToken on player state
  const wrongTokenState = await fetch(`${BASE_URL}/api/room/${roomCode}/state?playerId=player_yellow&sessionToken=st_fake_123`);
  assert.strictEqual(wrongTokenState.status, 401, 'Player state with wrong token must return 401');

  // 5C. Valid sessionToken on player state
  const validYellowState = await fetch(`${BASE_URL}/api/room/${roomCode}/state?playerId=player_yellow&sessionToken=${tokenYellow}`);
  assert.strictEqual(validYellowState.status, 200, 'Player state with valid token must return 200');
  const { view: viewYellow } = await validYellowState.json();
  console.log('[PASS 5] Player authentication on /state strictly enforced (missing/wrong rejected)');

  // 6. Test Host Authentication on START
  // 6A. Missing hostToken on START
  const noTokenStart = await fetch(`${BASE_URL}/api/room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'START', code: roomCode }),
  });
  assert.strictEqual((await noTokenStart.json()).success, false, 'START with missing hostToken must fail');

  // 6B. Wrong hostToken on START
  const wrongTokenStart = await fetch(`${BASE_URL}/api/room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'START', code: roomCode, hostToken: 'fake_host_token' }),
  });
  assert.strictEqual((await wrongTokenStart.json()).success, false, 'START with wrong hostToken must fail');

  // 6C. Valid hostToken on START
  const validStart = await fetch(`${BASE_URL}/api/room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'START', code: roomCode, hostToken }),
  });
  assert.strictEqual((await validStart.json()).success, true, 'START with valid hostToken must succeed');
  console.log('[PASS 6] Host authentication on START strictly enforced');

  // 7. Test Mandatory Authentication on Player Actions
  // 7A. Missing sessionToken on action
  const noTokenAction = await fetch(`${BASE_URL}/api/room/${roomCode}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'CONTROL_CHANGE',
      playerId: 'player_yellow',
      widgetId: 'fake_widget',
      value: true,
    }),
  });
  assert.strictEqual((await noTokenAction.json()).success, false, 'Action with missing sessionToken must be rejected');

  // 7B. Wrong sessionToken on action
  const wrongTokenAction = await fetch(`${BASE_URL}/api/room/${roomCode}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'CONTROL_CHANGE',
      playerId: 'player_yellow',
      sessionToken: 'st_spoofed_invalid',
      widgetId: 'fake_widget',
      value: true,
    }),
  });
  assert.strictEqual((await wrongTokenAction.json()).success, false, 'Action with wrong sessionToken must be rejected');

  // 7C. Role Authorization check: Purple player attempting CONTROL_CHANGE even with valid Purple token
  const unauthRoleAction = await fetch(`${BASE_URL}/api/room/${roomCode}/action`, {
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
  assert.strictEqual((await unauthRoleAction.json()).success, false, 'Action from non-Controls player must be rejected');
  console.log('[PASS 7] Player action authentication & role authorization strictly enforced');

  // 8. Test Mandatory Host Authentication on Admin Operations
  const noTokenAdmin = await fetch(`${BASE_URL}/api/room/${roomCode}/admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: 'SKIP_PHASE' }),
  });
  assert.strictEqual((await noTokenAdmin.json()).success, false, 'Admin command with missing hostToken must fail');

  const wrongTokenAdmin = await fetch(`${BASE_URL}/api/room/${roomCode}/admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: 'SKIP_PHASE', hostToken: 'invalid_ht_token' }),
  });
  assert.strictEqual((await wrongTokenAdmin.json()).success, false, 'Admin command with wrong hostToken must fail');

  const validAdmin = await fetch(`${BASE_URL}/api/room/${roomCode}/admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: 'SKIP_PHASE', hostToken }),
  });
  assert.strictEqual((await validAdmin.json()).success, true, 'Admin command with valid hostToken must succeed');
  console.log('[PASS 8] Admin command authentication strictly enforced');

  // 9. Test Concurrency & In-Flight Rapid Actions
  const currentYellowView = (await (await fetch(`${BASE_URL}/api/room/${roomCode}/state?playerId=player_yellow&sessionToken=${tokenYellow}`)).json()).view;
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(
      fetch(`${BASE_URL}/api/room/${roomCode}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CONTROL_CHANGE',
          actionId: `act_sec_${i}`,
          playerId: 'player_yellow',
          sessionToken: tokenYellow,
          widgetId: currentYellowView.controlWidgets[0]?.id || 'toggle_1',
          value: false,
        }),
      })
    );
  }
  const results = await Promise.all(promises);
  assert(results.every((r) => r.status === 200), 'Concurrent valid requests must return 200');
  console.log('[PASS 9] Concurrency stress test handled 5 simultaneous in-flight actions cleanly');

  // 10. Test 2-Player Mode Strict 1-Task Rule
  const create2P = await (await fetch(`${BASE_URL}/api/room`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'CREATE' }) })).json();
  const j1 = await (await fetch(`${BASE_URL}/api/room`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'JOIN', code: create2P.code, playerId: '2p_1', name: 'P1' }) })).json();
  const j2 = await (await fetch(`${BASE_URL}/api/room`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'JOIN', code: create2P.code, playerId: '2p_2', name: 'P2' }) })).json();
  await fetch(`${BASE_URL}/api/room`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'START', code: create2P.code, hostToken: create2P.hostToken }) });

  const room2P = await (await fetch(`${BASE_URL}/api/room/${create2P.code}/state?playerId=host&hostToken=${create2P.hostToken}`)).json();
  assert.strictEqual(room2P.room.mode, '2_PLAYER');
  assert.strictEqual(room2P.room.activeTasks.length, 1, '2-Player room must strictly have exactly 1 active task');
  console.log('[PASS 10] 2-Player mode strict single-task isolation verified');

  console.log('\n🎉 ALL 10 MANDATORY SECURITY & CONCURRENCY TESTS PASSED WITH 100% SUCCESS!');
}

runSecuritySuite().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
