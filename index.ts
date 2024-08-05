import {openPtk} from 'ptk/basket/openptk.ts'
import {LEMMA_DELIMITER,StringArray} from 'ptk/utils/stringarray.ts'
import Hzpx from './web.ts'
export * from'./web.ts'
import { setFontPtk } from './src/gwfont.ts'
export const loadPtkFont= async ()=>{
	const ptk=await openPtk('hzpx')
	await ptk.loadAll(); // recursive await is very slow 
	const [gid_starts]=ptk.sectionRange('gid');
	const gidarr=new StringArray(ptk.getLine(gid_starts), {sep:LEMMA_DELIMITER});
	const [bmp_starts]=ptk.sectionRange('bmp');
	const [ext_starts]=ptk.sectionRange('ext');
	const [gwcomp_starts]=ptk.sectionRange('gwcomp');	
	//const [ebag_starts]=ptk.sectionRange('ebag');
	setFontPtk(ptk,gidarr,gwcomp_starts,bmp_starts,ext_starts,0)
}

export default Hzpx;