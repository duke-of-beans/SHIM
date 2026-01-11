/**
 * Simple Infrastructure Validation
 * 
 * Validates that production infrastructure is accessible
 * 
 * Run: npx ts-node tests/validate-infrastructure.ts
 */

import Redis from 'ioredis';

async function validateInfrastructure() {
  console.log('🧪 Validating Production Infrastructure\n');
  console.log('═'.repeat(60));
  
  let allPassed = true;
  
  // Test 1: Redis Connection
  console.log('\n1️⃣ Testing Redis Connection (localhost:6379)...');
  const redis = new Redis({
    host: 'localhost',
    port: 6379,
    retryStrategy: () => null // Don't retry on failure
  });
  
  try {
    const pong = await redis.ping();
    if (pong === 'PONG') {
      console.log('   ✅ Redis: CONNECTED');
    } else {
      console.log('   ❌ Redis: Unexpected response');
      allPassed = false;
    }
  } catch (error) {
    console.log(`   ❌ Redis: FAILED - ${error}`);
    allPassed = false;
  }
  
  // Test 2: Redis Write/Read
  console.log('\n2️⃣ Testing Redis Write/Read...');
  try {
    await redis.set('shim:test', 'Hello SHIM!');
    const value = await redis.get('shim:test');
    
    if (value === 'Hello SHIM!') {
      console.log('   ✅ Write/Read: WORKING');
    } else {
      console.log('   ❌ Write/Read: FAILED');
      allPassed = false;
    }
    
    await redis.del('shim:test');
  } catch (error) {
    console.log(`   ❌ Write/Read: FAILED - ${error}`);
    allPassed = false;
  }
  
  // Test 3: Redis Pub/Sub
  console.log('\n3️⃣ Testing Redis Pub/Sub...');
  const subscriber = new Redis({
    host: 'localhost',
    port: 6379
  });
  
  const publisher = new Redis({
    host: 'localhost',
    port: 6379
  });
  
  try {
    let messageReceived = false;
    
    subscriber.on('message', (channel, message) => {
      if (channel === 'shim:test' && message === 'test-message') {
        messageReceived = true;
      }
    });
    
    await subscriber.subscribe('shim:test');
    await publisher.publish('shim:test', 'test-message');
    
    // Wait for message
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (messageReceived) {
      console.log('   ✅ Pub/Sub: WORKING');
    } else {
      console.log('   ❌ Pub/Sub: No message received');
      allPassed = false;
    }
    
    await subscriber.quit();
    await publisher.quit();
  } catch (error) {
    console.log(`   ❌ Pub/Sub: FAILED - ${error}`);
    allPassed = false;
  }
  
  // Test 4: Prometheus
  console.log('\n4️⃣ Testing Prometheus (localhost:9090)...');
  try {
    const response = await fetch('http://localhost:9090/-/healthy');
    if (response.ok) {
      console.log('   ✅ Prometheus: HEALTHY');
    } else {
      console.log(`   ❌ Prometheus: Status ${response.status}`);
      allPassed = false;
    }
  } catch (error) {
    console.log(`   ❌ Prometheus: UNREACHABLE`);
    allPassed = false;
  }
  
  // Test 5: Grafana
  console.log('\n5️⃣ Testing Grafana (localhost:3000)...');
  try {
    const response = await fetch('http://localhost:3000/api/health');
    if (response.ok) {
      console.log('   ✅ Grafana: HEALTHY');
    } else {
      console.log(`   ❌ Grafana: Status ${response.status}`);
      allPassed = false;
    }
  } catch (error) {
    console.log(`   ❌ Grafana: UNREACHABLE`);
    allPassed = false;
  }
  
  await redis.quit();
  
  console.log('\n═'.repeat(60));
  
  if (allPassed) {
    console.log('✅ ALL INFRASTRUCTURE TESTS PASSED!\n');
    console.log('Production infrastructure is fully operational:');
    console.log('  • Redis: Connection, Read/Write, Pub/Sub ✅');
    console.log('  • Prometheus: Health check ✅');
    console.log('  • Grafana: Health check ✅\n');
    console.log('Ready for SHIM production deployment!');
    process.exit(0);
  } else {
    console.log('❌ SOME TESTS FAILED\n');
    console.log('Check Docker services are running:');
    console.log('  docker-compose -f docker-compose.simple.yml ps');
    process.exit(1);
  }
}

validateInfrastructure().catch(console.error);
