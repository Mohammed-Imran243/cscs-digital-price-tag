const fs = require('fs');
const txt = fs.readFileSync('zkong.js', 'utf8');
const matches = txt.match(/\/zk\/template\/[a-zA-Z0-9]+/g);
if (matches) {
    console.log(Array.from(new Set(matches)));
} else {
    console.log("No matches found");
}
