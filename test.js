const {Hzpx} = require('./index.js');
global.Hzpx=Hzpx; //set to global, the font need to install by itself
/* load the font */
require('./dist/gwcomp.js'); //same script as browser
require('./dist/cjkbmp.js');
require('./dist/cjkext.js');

const svg=Hzpx.drawPinx("一");
const svg2=Hzpx.drawPinx("邏羅寶貝𩀨從䞃致招"); //return array of svg

let test=0;pass=0;

test++;
if (svg&&svg.length) {
	console.log('one',svg) ;
	pass++;
}
else console.log('fail to draw one');
test++;
if (svg2&&svg2.length) {
	console.log('big fortune',svg2[0].slice(0,100));
	pass++;
}
else console.log('fail to draw fortune');

console.log('test',test,'pass',pass)