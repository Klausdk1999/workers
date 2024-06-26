const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("worker_threads");
const { generatePrimes } = require("./prime");
const { performance } = require("perf_hooks");

const threads = new Set();
const number = 9999999;
const startTime = performance.now();

const breakIntoParts = (number, threadCount = 1) => {
  const parts = [];
  const chunkSize = Math.ceil(number / threadCount);

  for (let i = 0; i < number; i += chunkSize) {
    const end = Math.min(i + chunkSize, number);
    parts.push({ start: i, end });
  }

  return parts;
};

if (isMainThread) {
  const parts = breakIntoParts(number, 1);
  parts.forEach((part) => {
    threads.add(
      new Worker(__filename, {
        workerData: {
          start: part.start,
          end: part.end,
        },
      })
    );
  });

  threads.forEach((thread) => {
    thread.on("error", (err) => {
      throw err;
    });
    thread.on("exit", () => {
      threads.delete(thread);
      console.log(`Thread exiting, ${threads.size} running...`);
      if (threads.size === 0) {
        const endTime = performance.now();
        console.log(`Execution time: ${endTime - startTime} milliseconds`);
      }
    });
  });
} else {
  const primes = generatePrimes(workerData.start, workerData.end);
  parentPort.postMessage(
    `Primes from - ${workerData.start} to ${workerData.end}: ${primes}`
  );
}
