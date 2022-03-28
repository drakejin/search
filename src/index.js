const lineReader = require('line-reader');

console.log('11')

lineReader.eachLine('broadband.sql', function(line, last) {
  console.log(`Line from file: ${line}`);
  if(last) {
    console.log('Last line printed.');
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
  }
});

console.log('11')
