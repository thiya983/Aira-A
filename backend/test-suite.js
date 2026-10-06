/**
 * Comprehensive Automated Test Suite for Aira AI Backend & Ollama Integration
 */

async function runTests() {
  console.log('🚀 Starting Aira AI Test Suite...\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // 1. Health Endpoint Test
  await test('GET /api/health returns 200 and Ollama status', async () => {
    const res = await fetch('http://localhost:5000/api/health');
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error(`Unexpected status: ${data.status}`);
    if (typeof data.ollamaConnected !== 'boolean') throw new Error('Missing ollamaConnected');
  });

  // 2. Models Endpoint Test
  await test('GET /api/models returns 200 and models array', async () => {
    const res = await fetch('http://localhost:5000/api/models');
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error(`Unexpected status: ${data.status}`);
    if (!Array.isArray(data.models)) throw new Error('Models is not an array');
  });

  // 3. Validation Test: Missing messages array
  await test('POST /api/chat rejects missing messages with 400', async () => {
    const res = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 4. Validation Test: Empty messages array
  await test('POST /api/chat rejects empty messages with 400', async () => {
    const res = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] })
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 5. Error handling for non-installed model
  await test('POST /api/chat shows friendly message for uninstalled model', async () => {
    const res = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hi' }],
        model: 'non_existent_model_xyz'
      })
    });
    const data = await res.json();
    if (!data.error.includes('The selected Ollama model is not installed')) {
      throw new Error(`Unexpected error message: ${data.error}`);
    }
  });

  // 6. Frontend Dev Server Check
  await test('Frontend Vite dev server is serving index.html on port 5173', async () => {
    const res = await fetch('http://localhost:5173');
    if (!res.ok) throw new Error(`Vite returned status ${res.status}`);
    const text = await res.text();
    if (!text.includes('Aira AI')) throw new Error('Index HTML missing Aira AI branding');
  });

  // 7. Frontend Proxy Check
  await test('Frontend proxy forwards /api/health to backend', async () => {
    const res = await fetch('http://localhost:5173/api/health');
    if (!res.ok) throw new Error(`Proxy returned status ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error(`Proxy unexpected data: ${JSON.stringify(data)}`);
  });

  console.log(`\n=========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`=========================================\n`);
}

runTests();
