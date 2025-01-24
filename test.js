console.log("Testing: X)")
import { createInterface } from 'readline';

// Create an interface for input and output
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});



import ("./commands/rps.js").then((rps) => {
    rl.question('String Input (blowjob): ', (input) => {
        const testData = {options: {getString: () => {
            return input
        }},
            reply: console.log
        }
        rl.close(); 

        rps.default.execute(testData)
    });
})
