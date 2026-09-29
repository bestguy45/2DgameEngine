'use strict';
const $ = id => document.getElementById(id);
const preview = $('preview'), overlay = $('overlay');
const context = preview.getContext('2d'), marks = overlay.getContext('2d');
let nextId = 4, selected = 1, dragging = null, rendering = false, pending = false, generation = 0;
const initial = () => ({version:1,width:320,height:180,background:'#18202b',sprites:[
  {id:1,name:'Player',x:50,y:80,width:24,height:24,color:'#bcf16d',alpha:255,visible:true},
  {id:2,name:'Platform',x:30,y:130,width:256,height:12,color:'#586f8a',alpha:255,visible:true},
  {id:3,name:'Collectible',x:210,y:62,width:12,height:12,color:'#ffd175',alpha:255,visible:true}]});
let scene = initial();
const current = () => scene.sprites.find(sprite => sprite.id === selected);
function validate(data) {
  const number = (n, low, high) => Number.isInteger(n) && n >= low && n <= high;
  const color = c => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c);
  if (!data || data.version !== 1 || !number(data.width,1,1920) || !number(data.height,1,1080) || !color(data.background) || !Array.isArray(data.sprites) || data.sprites.length > 1000) throw Error('Invalid Swift2D scene file.');
  data.sprites.forEach((s,i) => {
    if (!s || typeof s.name !== 'string' || s.name.length > 80 || !number(s.x,-10000,10000) || !number(s.y,-10000,10000) || !number(s.width,1,256) || !number(s.height,1,256) || !number(s.alpha,0,255) || !color(s.color) || typeof s.visible !== 'boolean') throw Error('Invalid sprite properties.');
    s.id = i + 1;
  });
  return data;
}
function sync() {
  $('scene-width').value = scene.width; $('scene-height').value = scene.height; $('background').value = scene.background;
  $('count').textContent = `${scene.sprites.length} sprites`;
  $('sprites').replaceChildren();
  scene.sprites.forEach(sprite => {
    const button = document.createElement('button'); button.className = `sprite-item${sprite.id === selected ? ' active' : ''}`;
    button.setAttribute('aria-pressed', sprite.id === selected);
    const swatch = document.createElement('span'); swatch.className = 'swatch'; swatch.style.background = sprite.color;
    const name = document.createElement('span'); name.textContent = sprite.name + (sprite.visible ? '' : ' · hidden');
    button.append(swatch,name); button.onclick = () => { selected = sprite.id; sync(); drawMarks(); };
    $('sprites').append(button);
  });
  const sprite = current(); $('properties').hidden = !sprite; $('empty').hidden = !!sprite;
  if (sprite) {
    ['name','x','y','width','height','color','alpha'].forEach(key => $(key).value = sprite[key]);
    $('visible').checked = sprite.visible; $('opacity').textContent = `${Math.round(sprite.alpha / 255 * 100)}%`;
  }
  resize();
}
function resize() {
  const zoom = Number($('zoom').value);
  [preview,overlay].forEach(canvas => {
    if (canvas.width !== scene.width) canvas.width = scene.width;
    if (canvas.height !== scene.height) canvas.height = scene.height;
    canvas.style.width = `${scene.width * zoom}px`; canvas.style.height = `${scene.height * zoom}px`;
  });
  $('dimensions').textContent = `${scene.width} × ${scene.height} px`;
  drawMarks();
}
function drawMarks() {
  marks.clearRect(0,0,overlay.width,overlay.height);
  if ($('grid').checked) {
    marks.strokeStyle = '#ffffff13'; marks.lineWidth = .5; marks.beginPath();
    for(let x=0;x<scene.width;x+=8){marks.moveTo(x,0);marks.lineTo(x,scene.height);}
    for(let y=0;y<scene.height;y+=8){marks.moveTo(0,y);marks.lineTo(scene.width,y);}
    marks.stroke();
  }
  const s=current(); if(s && s.visible){marks.strokeStyle='#ffffff';marks.lineWidth=1;marks.strokeRect(s.x-.5,s.y-.5,s.width+1,s.height+1);}
}
async function render() {
  pending = true; generation++;
  if(rendering) return;
  rendering = true;
  try {
    while(pending){
      pending=false; const requestGeneration=generation, start=performance.now();
      try {
        const response=await fetch('/api/render',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(scene)});
        if(!response.ok) throw Error('The renderer rejected this scene.');
        const image=await createImageBitmap(await response.blob());
        if(requestGeneration===generation){context.drawImage(image,0,0);$('status').textContent=`C++ renderer · ${(performance.now()-start).toFixed(0)} ms preview update`;}
        image.close();
      } catch(error){$('status').textContent=error.message;}
    }
  } finally {rendering=false;}
}
function changed(){sync();render();}
$('properties').onsubmit = event => event.preventDefault();
['name','x','y','width','height','color','alpha'].forEach(key=>$(key).addEventListener('input',()=>{
  const s=current();if(!s)return;
  if(['name','color'].includes(key))s[key]=$(key).value;
  else{if(!$(key).validity.valid || $(key).value==='')return;s[key]=Number($(key).value);}
  // Keep typing focus and selection intact; rebuild the list only on change.
  $('opacity').textContent=`${Math.round(s.alpha/255*100)}%`;drawMarks();render();
}));
['name','color'].forEach(key=>$(key).addEventListener('change',sync));
$('visible').onchange=()=>{const s=current();if(s){s.visible=$('visible').checked;changed();}};
['scene-width','scene-height'].forEach(id=>$(id).onchange=()=>{if($(id).validity.valid && $(id).value!==''){scene[id==='scene-width'?'width':'height']=Number($(id).value);changed();}});
$('background').oninput=()=>{scene.background=$('background').value;render();};
$('zoom').onchange=resize;$('grid').onchange=drawMarks;
$('add').onclick=()=>{if(scene.sprites.length>=1000){$('status').textContent='Scene limit: 1000 sprites.';return;}selected=nextId++;scene.sprites.push({id:selected,name:`Sprite ${selected}`,x:Math.floor(scene.width/2)-12,y:Math.floor(scene.height/2)-12,width:24,height:24,color:'#6cb7f1',alpha:255,visible:true});changed();};
$('duplicate').onclick=()=>{const s=current();if(!s || scene.sprites.length>=1000)return;selected=nextId++;scene.sprites.push({...s,id:selected,name:(s.name+' copy').slice(0,80),x:Math.min(10000,s.x+8),y:Math.min(10000,s.y+8)});changed();};
function remove(){if(!current())return;scene.sprites=scene.sprites.filter(s=>s.id!==selected);selected=scene.sprites.at(-1)?.id??null;changed();}
$('delete').onclick=remove;
$('new').onclick=()=>{if(!confirm('Start a new scene? Save your current scene first to keep it.'))return;scene=initial();nextId=4;selected=1;changed();};
$('save').onclick=()=>{const blob=new Blob([JSON.stringify(scene,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='swift2d-scene.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('status').textContent='Scene downloaded as JSON.';};
$('open').onclick=()=>$('file').click();
$('file').onchange=async()=>{const file=$('file').files[0];if(!file)return;try{if(file.size>512000)throw Error('Scene file is too large.');const data=validate(JSON.parse(await file.text()));scene=data;nextId=scene.sprites.length+1;selected=scene.sprites[0]?.id??null;changed();}catch(error){$('status').textContent=error.message;}finally{$('file').value='';}};
function point(event){const rect=overlay.getBoundingClientRect();return{x:(event.clientX-rect.left)*scene.width/rect.width,y:(event.clientY-rect.top)*scene.height/rect.height};}
overlay.onpointerdown=event=>{const p=point(event);const s=[...scene.sprites].reverse().find(s=>s.visible && s.alpha>0 && p.x>=s.x && p.x<s.x+s.width && p.y>=s.y && p.y<s.y+s.height);selected=s?.id??null;sync();if(s){dragging={id:s.id,dx:p.x-s.x,dy:p.y-s.y};overlay.setPointerCapture(event.pointerId);}overlay.focus();};
overlay.onpointermove=event=>{if(!dragging)return;const p=point(event),s=current();if(!s)return;const step=$('snap').checked?8:1;s.x=Math.max(-10000,Math.min(10000,Math.round((p.x-dragging.dx)/step)*step));s.y=Math.max(-10000,Math.min(10000,Math.round((p.y-dragging.dy)/step)*step));$('x').value=s.x;$('y').value=s.y;drawMarks();render();};
overlay.onpointerup=()=>{dragging=null;};overlay.onpointercancel=()=>{dragging=null;};
overlay.onkeydown=event=>{const s=current();if(!s)return;if(event.key==='Delete'){event.preventDefault();remove();return;}const directions={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};const d=directions[event.key];if(d){event.preventDefault();const n=event.shiftKey?8:1;s.x=Math.max(-10000,Math.min(10000,s.x+d[0]*n));s.y=Math.max(-10000,Math.min(10000,s.y+d[1]*n));changed();}};
sync();render();
