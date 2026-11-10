const kiwi=require('kiwi-schema');const fs=require('fs');
const c=kiwi.compileSchema(kiwi.decodeBinarySchema(new Uint8Array(fs.readFileSync('schema.bin'))));
const msg=c.decodeMessage(new Uint8Array(fs.readFileSync('data.bin')));
const id=g=>g.sessionID+':'+g.localID;
const by={};const kids={};
for(const n of msg.nodeChanges){by[id(n.guid)]=n; if(n.parentIndex){const p=id(n.parentIndex.guid);(kids[p]=kids[p]||[]).push(n);}}
const I={m00:1,m01:0,m02:0,m10:0,m11:1,m12:0};
const mul=(a,b)=>({m00:a.m00*b.m00+a.m01*b.m10,m01:a.m00*b.m01+a.m01*b.m11,m02:a.m00*b.m02+a.m01*b.m12+a.m02,m10:a.m10*b.m00+a.m11*b.m10,m11:a.m10*b.m01+a.m11*b.m11,m12:a.m10*b.m02+a.m11*b.m12+a.m12});
function path(blob){const b=blob.bytes;const dv=new DataView(b.buffer,b.byteOffset,b.byteLength);let i=0,d='';const f=()=>{const v=dv.getFloat32(i,true);i+=4;return +v.toFixed(3)};
while(i<b.length){const cmd=b[i++];if(cmd===0)d+='Z';else if(cmd===1)d+='M'+f()+' '+f();else if(cmd===2)d+='L'+f()+' '+f();else if(cmd===3)d+='Q'+f()+' '+f()+' '+f()+' '+f();else if(cmd===4)d+='C'+f()+' '+f()+' '+f()+' '+f()+' '+f()+' '+f();else break;}return d;}
const want=process.argv.slice(2);
const out={};
for(const n of msg.nodeChanges){
  if(n.type!=='SYMBOL')continue;
  const name=n.name; if(!/^Iconly\/Regular\/(Light|Two-tone)\//.test(name))continue;
  const short=name.replace('Iconly/Regular/','');
  if(want.length && !want.includes(short.split('/')[1]))continue;
  const parts=[];
  (function walk(node,m,op,der){
    for(const k0 of (kids[id(node.guid)]||[])){
      const dv=der&&((k0.overrideKey&&der[id(k0.overrideKey)])||der[id(k0.guid)]);
      const k=dv?Object.assign({},k0,dv):k0;
      if(k.visible===false)continue;
      const mm=mul(m,k.transform||I); const o=op*(k.opacity===undefined?1:k.opacity);
      const geoms=[];
      const fp=(k.fillPaints||[]).find(p=>p.visible!==false);
      const sp=(k.strokePaints||[]).find(p=>p.visible!==false);
      if(fp&&k.fillGeometry) for(const g of k.fillGeometry) geoms.push([path(msg.blobs[g.commandsBlob]), o*(fp.opacity===undefined?1:fp.opacity)]);
      const spOk = sp || (dv && !fp && k.strokeGeometry && k.strokeGeometry.length);
      if(spOk&&k.strokeGeometry) for(const g of k.strokeGeometry) geoms.push([path(msg.blobs[g.commandsBlob]), o*(sp&&sp.opacity!==undefined?sp.opacity:1)]);
      for(const [d,oo] of geoms) if(d) parts.push({t:[mm.m00,mm.m10,mm.m01,mm.m11,mm.m02,mm.m12].map(v=>+v.toFixed(3)),d,o:+oo.toFixed(2),nome:k.name});
      if(k.type==='BOOLEAN_OPERATION') continue; // a geometria da união já representa os filhos
      if(k.type==='INSTANCE' && k.symbolData && k.symbolData.symbolID){
        const sym=by[id(k.symbolData.symbolID)];
        const d2={};
        for(const e of (k.derivedSymbolData||[])){ const g=e.guidPath&&e.guidPath.guids; if(g&&g.length) d2[id(g[g.length-1])]=e; }
        if(sym) walk(sym,mm,o,d2);
        continue;
      }
      walk(k,mm,o,der);
    }
  })(n,I,1,null);
  out[short]={w:n.size.x,h:n.size.y,parts};
}
fs.writeFileSync('icones.json',JSON.stringify(out));
console.log(Object.keys(out).length, Object.keys(out).slice(0,6));
