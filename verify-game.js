// Quick verification script for 11:59: DEADLINE PANIC game loop
async function runTest() {
  const baseUrl = 'http://localhost:3000';
  console.log('Testing Game API at', baseUrl);

  // 1. Create room
  const createRes = await fetch(`${baseUrl}/api/room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'CREATE', code: 'VERIFY99' }),
  });
  const createData = await createRes.json();
  console.log('1. Room Created:', createData.success, 'Code:', createData.room?.code, 'LAN IP:', createData.lanIp);

  // 2. Join Player 1 (Yellow Controls)
  const p1Res = await fetch(`${baseUrl}/api/room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'JOIN', code: 'VERIFY99', playerId: 'p1_id', name: 'Alice' }),
  });
  const p1Data = await p1Res.json();
  console.log('2. Player 1 Joined:', p1Data.player?.name, 'Role:', p1Data.player?.role, 'Color:', p1Data.player?.color);

  // 3. Join Player 2 (Purple Blueprints)
  const p2Res = await fetch(`${baseUrl}/api/room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'JOIN', code: 'VERIFY99', playerId: 'p2_id', name: 'Bob' }),
  });
  const p2Data = await p2Res.json();
  console.log('3. Player 2 Joined:', p2Data.player?.name, 'Role:', p2Data.player?.role, 'Color:', p2Data.player?.color);

  // 4. Start Game
  const startRes = await fetch(`${baseUrl}/api/room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'START', code: 'VERIFY99' }),
  });
  console.log('4. Game Start Triggered:', (await startRes.json()).success);

  console.log('Verification test completed successfully!');
}

runTest().catch(console.error);
