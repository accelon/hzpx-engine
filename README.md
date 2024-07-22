# hzpx
hzpx backend in Typescript

## prerequsite 
- esbuild
- [prebuild glyphwiki font](https://github.com/accelon/hzpx/) 
- put hzpx/.js or hzpx.ptk in dist
- put cjkbmp.mjs cjkext.mjs gwcomp.mjs in extension
- put accelon/kage-engine/dist/kage.mjs in src

## with svelte

import from hzpx-engine/src/web.ts

## index.cjs



create node.cjs for hzpxserver (commmon js )
    rollup -c

run esbuild background watch to test offline application

    npm run dev

to pack a minified bundle

    npm run build 


to create hzpx.ptk font ( need ptk/nodebundle.cjs)
   npm run build-bundle
   node gen-ptk.js

## usage

see dist/index.html

## API

 wait for font file ready, take up 8MB ram for 87000+ glyphs
    await Hzpx.ready();  

 replace entire element with a given `text` or innerText

    Hzpx.renderElement(e:HTMLElement, text?:string)

 inject glyphs into a HTML tree, normal text are intact

    Hzpx.inject(e:HTMLElement, options:InjectOptions );

 text enclosed by `pair` will be treated as Pinx, `cjk` to specify with code range to be replaced, case insensitive.

    InjectOptions={ pair?='︻︼', cjk?='CDEFG' } 

## license

ISC