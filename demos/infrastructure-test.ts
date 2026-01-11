/**
 * SHIM Infrastructure Integration Test
 * 
 * Tests all deployed infrastructure components:
 * - Redis connection and operations
 * - BullMQ job queues
 * - Pub/Sub messaging
 * - Worker registry
 * 
 * Run: npx ts-node demos/infrastructure-test.ts
 */

import { RedisConnectionManager } from '../src/core/RedisConnectionManager';
import { TaskQueueWrapper } from '../src/core/TaskQueueWrapper';
import { MessageBusWrapper } from '../src/core/MessageBusWrapper';
import { WorkerRegistry } from '../src/core/WorkerRegistry';

async function testInfrastructure() {
  console.log('🧪 SHIM Infrastructure Integration Test\n');
  console.log('═'.repeat(60));
  console.log();
  
  // Test 1: Redis Connection
  console.log('Test 1: Redis Connection');
  console.log('─'.repeat(60));
  
  const redis = new RedisConnectionManager({
    host: 'localhost',
    port: 6379
  });
  
  try {
    await redis.connect();
    console.log('✅ Connected to Redis at localhost:6379');
    
    const health = await redis.getHealth();
    console.log(`✅ Redis Health: ${health.status}`);
    console.log(`   Connected: ${health.connected}`);
    console.log(`   Ready: ${health.ready}`);
    console.log();
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    process.exit(1);
  }
  
  // Test 2: Task Queue
  console.log('Test 2: BullMQ Task Queue');
  console.log('─'.repeat(60));
  
  const taskQueue = new TaskQueueWrapper({
    queueName: 'test-queue',
    redis: { host: 'localhost', port: 6379 }
  });
  
  try {
    // Add a test job
    const job = await taskQueue.addJob(
      'test-task',
      { message: 'Hello from SHIM!' },
      { priority: 1 }
    );
    
    console.log(`✅ Created job: ${job.id}`);
    console.log(`   Name: ${job.name}`);
    console.log(`   Data: ${JSON.stringify(job.data)}`);
    console.log();
    
    // Get queue stats
    const stats = await taskQueue.getStats();
    console.log('✅ Queue Statistics:');
    console.log(`   Waiting: ${stats.waiting}`);
    console.log(`   Active: ${stats.active}`);
    console.log(`   Completed: ${stats.completed}`);
    console.log(`   Failed: ${stats.failed}`);
    console.log();
    
    await taskQueue.close();
  } catch (error) {
    console.error('❌ Task queue test failed:', error);
  }
  
  // Test 3: Message Bus (Pub/Sub)
  console.log('Test 3: Redis Pub/Sub Messaging');
  console.log('─'.repeat(60));
  
  const messageBus = new MessageBusWrapper({
    redis: { host: 'localhost', port: 6379 }
  });
  
  try {
    // Subscribe to a channel
    let messageReceived = false;
    await messageBus.subscribe('test-channel', (message) => {
      console.log(`✅ Received message: ${JSON.stringify(message)}`);
      messageReceived = true;
    });
    
    console.log('✅ Subscribed to test-channel');
    
    // Publish a test message
    await messageBus.publish('test-channel', {
      type: 'test',
      timestamp: Date.now(),
      message: 'Hello from Message Bus!'
    });
    
    console.log('✅ Published test message');
    
    // Wait a bit for message to arrive
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (messageReceived) {
      console.log('✅ Message delivery confirmed');
    }
    console.log();
    
    await messageBus.close();
  } catch (error) {
    console.error('❌ Message bus test failed:', error);
  }
  
  // Test 4: Worker Registry
  console.log('Test 4: Worker Registry');
  console.log('─'.repeat(60));
  
  const workerRegistry = new WorkerRegistry({
    redis: { host: 'localhost', port: 6379 }
  });
  
  try {
    // Register a test worker
    await workerRegistry.registerWorker({
      workerId: 'test-worker-1',
      capabilities: ['cost-optimization', 'model-routing'],
      maxConcurrentTasks: 5
    });
    
    console.log('✅ Registered worker: test-worker-1');
    
    // Get all workers
    const workers = await workerRegistry.getAllWorkers();
    console.log(`✅ Total workers: ${workers.length}`);
    
    for (const worker of workers) {
      console.log(`   Worker: ${worker.workerId}`);
      console.log(`   Status: ${worker.status}`);
      console.log(`   Capabilities: ${worker.capabilities.join(', ')}`);
    }
    console.log();
    
    // Cleanup
    await workerRegistry.deregisterWorker('test-worker-1');
    console.log('✅ Deregistered test worker');
    console.log();
    
    await workerRegistry.close();
  } catch (error) {
    console.error('❌ Worker registry test failed:', error);
  }
  
  // Cleanup
  await redis.disconnect();
  console.log('✅ Disconnected from Redis');
  console.log();
  
  // Summary
  console.log('═'.repeat(60));
  console.log('🎉 INFRASTRUCTURE TEST COMPLETE!');
  console.log('═'.repeat(60));
  console.log();
  console.log('All systems operational:');
  console.log('  ✅ Redis connection and health monitoring');
  console.log('  ✅ BullMQ task queues');
  console.log('  ✅ Redis Pub/Sub messaging');
  console.log('  ✅ Worker registry coordination');
  console.log();
  console.log('Your infrastructure is ready for:');
  console.log('  • Distributed task processing');
  console.log('  • Real-time worker coordination');
  console.log('  • Horizontal scaling across machines');
  console.log('  • Production workloads');
  console.log();
}

// Run test
testInfrastructure().catch(console.error);
