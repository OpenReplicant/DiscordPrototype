// Written to convert Amazon intent dataset 
// node convert.js input.jsonl output.json

const fs = require('fs');

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
  console.error('Please specify input and output file names.');
  process.exit(1);
}

const data = [];

const input = fs.readFileSync(inputFile, 'utf8').trim().split('\n');

const output = input.reduce((acc, line) => {
  const obj = JSON.parse(line);

  const existingObj = acc.find((o) => o.intent === obj.label_text);

  if (existingObj) {
    existingObj.utterances.push(obj.text);
  } else {
    acc.push({
      intent: obj.label_text,
      utterances: [obj.text],
      answers: [`[${obj.label_text} intent.]`],  ////// MODIFY THIS STRING
    });
  }

  return acc;
}, data);

const existingData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));

existingData.data = [...existingData.data, ...output];

fs.writeFileSync(outputFile, JSON.stringify(existingData, null, 2));
console.log(`Output saved to ${outputFile}`);
