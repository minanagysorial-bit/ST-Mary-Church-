const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('C:\\Users\\Mina\\.gemini\\antigravity\\brain\\ba597833-c874-498d-9ab3-7900f92536e3\\.system_generated\\logs\\transcript.jsonl'),
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    if (obj.type === 'USER_INPUT') {
      console.log(`[Step ${obj.step_index}] ${obj.created_at}:`);
      console.log(obj.content);
      console.log('------------------------------------------------');
    }
  } catch (e) {
    // Ignore invalid JSON lines
  }
});
