// import * as test from 'ptk/utils';
// import * as test from './fontface.ts'
// import {drawGlyph} from './engine.ts';
// import {Kage} from 'kage-engine' 
console.time('loading');
const t=new Date();
import {CJKBMP} from './font/cjkbmp.mjs'
import {CJKEXT} from './font/cjkext.mjs' 
//import {GWCOMP} from './font/gwcomp.mjs'
console.timeEnd('loading');
const t2=new Date();
console.log(+t2-t);
//loadFont(GWCOMP,CJKBMP,CJKEXT);

//const svg=drawGlyph("һ",{size:64});
//console.log(svg);
