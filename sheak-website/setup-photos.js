// Run:  node setup-photos.js
// Reads your places from data.js and creates every photo folder + numbered placeholder file
// (1.jpg, 2.jpg ...). It NEVER overwrites a file that already exists, so your real photos are safe.
// Then just replace each placeholder with your photo (same name) in VS Code.
const fs=require('fs'),path=require('path');
const code=fs.readFileSync(path.join(__dirname,'data.js'),'utf8');
const D=new Function(code+';return {TRAVEL_BD,TRAVEL_WORLD}')();
const slug=t=>String(t).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const ph=path.join(__dirname,'images','_placeholder.jpg');
let made=0,kept=0;
const go=(root,key,list)=>list.forEach(g=>g.spots.forEach(sp=>{
  const base=sp.folder||`images/travel/${root}/${slug(g[key])}/${slug(sp.name)}`;
  fs.mkdirSync(path.join(__dirname,base),{recursive:true});
  for(let i=1;i<=Math.max(1,+sp.photos||10);i++){
    const f=path.join(__dirname,base,i+'.jpg'),others=['jpeg','png','webp'].some(e=>fs.existsSync(path.join(__dirname,base,i+'.'+e)));
    if(fs.existsSync(f)||others){kept++;continue}
    fs.copyFileSync(ph,f);made++}
  console.log('  '+base+'  ('+sp.photos+' photos)');}));
go('bangladesh','district',D.TRAVEL_BD);go('world','country',D.TRAVEL_WORLD);
console.log(`\nDone. Created ${made} placeholder files, kept ${kept} existing photos.`);
