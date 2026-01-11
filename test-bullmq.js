// Quick BullMQ test
const { Queue, Worker } = require('bullmq');

const connection = {
  host: 'localhost',
  port: 6379,
  db: 0
};

async function test() {
  const queue = new Queue('test-queue', { connection });
  
  let processed = false;
  
  const worker = new Worker('test-queue', async (job) => {
    console.log('Processing job:', job.name, job.data);
    processed = true;
    return { success: true };
  }, { connection });

  await worker.waitUntilReady();
  console.log('Worker ready');

  const job = await queue.add('test-job', { message: 'hello' });
  console.log('Job added:', job.id);

  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('Processed:', processed);

  await worker.close();
  await queue.close();
  process.exit(0);
}

test().catch(console.error);
