const {Hzpx,loadFont} = require('./index.js');
const PTK = require("ptk/nodebundle.cjs")
const JSZip = require("lazip");
global.Hzpx=Hzpx; //set to global, the font need to install by itself
/* load the font */

async function openzip(){
	const zip=new JSZip();
	const buffer=await fs.promises.readFile("dist/hzpx.ptk");
	await zip.loadAsync(buffer);//,{lazyfetch:true}); cannot use lazyfetch 
	return zip;	
}

const test=async ()=>{
	await PTK.nodefs;

	const zip=await openzip()
	const lbase=await loadFont(zip);

	const svg=await Hzpx.drawPinx("一");
	// const svg2=await Hzpx.drawPinx("邏羅寶貝𩀨從䞃致招"); //return array of svg
	// const svg2=await Hzpx.drawPinx("貝"); //return array of svg
	const svg2=await Hzpx.drawPinx("明");

	let test=0;pass=0;

	test++;
	if (svg&&svg.length) {
		console.log('one',svg) ;
		pass++;
	}
	else console.log('fail to draw one');
	test++;
	if (svg2&&svg2.length) {
		console.log('big fortune',svg2[0].slice(0,600));
		pass++;
	}
	else console.log('fail to draw fortune');

	console.log('test',test,'pass',pass)
	console.log('loaded page',lbase._pages.map(it=>!!it).length)
}
test()
//require('./dist/gwcomp.js'); //same script as browser
//require('./dist/cjkbmp.js');
//require('./dist/cjkext.js');

