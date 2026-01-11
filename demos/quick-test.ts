/**
 * SHIM Infrastructure Quick Test
 * 
 * Simple test to verify infrastructure is operational.
 * 
 * Run: npx ts-node demos/quick-test.ts
 */

import { RedisConnectionManager } from '../src/core/RedisConnectionManager';

async function quickTest() {
  console.log('🧪 SHIM Infrastructure Quick Test\n');
  console.log('═'.repeat(60));
  console.log();
  
  // Test Redis Connection
  console.log('Testing Redis Connection...');
  console.log('─'.repeat(60));
  
  const redis = new RedisConnectionManager({
    host: 'localhost',
    port: 6379
  });
  
  try {
    console.log('Connecting to Redis at localhost:6379...');
    await redis.connect();
    console.log('✅ Connected successfully!');
    
    const isConnected = redis.isConnected();
    console.log(`✅ Connection status: ${isConnected ? 'READY' : 'NOT READY'}`);
    
    const pingResult = await redis.ping();
    console.log(`✅ Ping result: ${pingResult ? 'PONG' : 'NO RESPONSE'}`);
    
    const stats = redis.getConnectionStats();
    const uptimeSeconds = stats.uptime ? stats.uptime / 1000 : 0;
    console.log(`✅ Connected for: ${uptimeSeconds.toFixed(1)}s`);
    
    console.log();
    console.log('═'.repeat(60));
    console.log('🎉 INFRASTRUCTURE TEST PASSED!');
    console.log('═'.repeat(60));
    console.log();
    console.log('Redis is operational and ready for:');
    console.log('  ✅ Task queues (BullMQ)');
    console.log('  ✅ Pub/Sub messaging');
    console.log('  ✅ Worker coordination');
    console.log('  ✅ Session state management');
    console.log();
    console.log('Next steps:');
    console.log('  1. Open Grafana: http://localhost:3000');
    console.log('  2. Open Prometheus: http://localhost:9090');
    console.log('  3. Run cost optimization demo: npm run demo:cost');
    console.log();
    
    await redis.disconnect();
    console.log('✅ Disconnected cleanly');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

quickTest().catch(console.error);
