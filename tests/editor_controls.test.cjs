// Test editor state transitions without a browser or third-party packages.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
class Element {
  constructor(){this.value='';this.checked=false;this.width=320;this.height=180;this.style={};this.validity={valid:true};this.listeners={};}
  addEventListener(name, fn){this.listeners[name]=fn;}
  replaceChildren(){}
  append(){}
  setAttribute(){}
  getContext(){return {clearRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},strokeRect(){},drawImage(){}};}
  getBoundingClientRect(){return {left:0,top:0,width:640,height:360};}
  setPointerCapture(){}
  focus(){}
  click(){}
}
const elements = new Map();
const element = id => {if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
element('zoom').value='2';element('grid').checked=true;
const requests=[];
const runtime=vm.createContext({
  document:{getElementById:element,createElement:()=>new Element()},
  performance:{now:()=>0},confirm:()=>true,
  fetch:async (_url, options)=>{requests.push(JSON.parse(options.body));return {ok:true,blob:async()=>new Blob()};},
  createImageBitmap:async()=>({close(){}}),Blob,URL,setTimeout,
});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../editor/editor.js'),'utf8'),runtime);
const run=source=>vm.runInContext(source,runtime);
const state=()=>JSON.parse(run('JSON.stringify(scene)'));
async function main(){
  assert.equal(state().sprites.length,3);
  element('add').onclick();
  assert.equal(state().sprites.length,4);
  element('x').value='72';element('x').listeners.input();
  assert.equal(state().sprites.at(-1).x,72);
  element('duplicate').onclick();
  assert.equal(state().sprites.length,5);
  assert.equal(state().sprites.at(-1).x,80);
  element('delete').onclick();
  assert.equal(state().sprites.length,4);
  element('overlay').onpointerdown({clientX:110,clientY:170,pointerId:1});
  element('overlay').onpointermove({clientX:130,clientY:190});
  element('overlay').onpointerup();
  assert.equal(state().sprites[0].x,60);
  assert.equal(state().sprites[0].y,90);
  element('overlay').onkeydown({key:'ArrowRight',shiftKey:true,preventDefault(){}});
  assert.equal(state().sprites[0].x,68);
  const loaded={version:1,width:100,height:80,background:'#000000',sprites:[]};
  element('file').files=[{size:100,text:async()=>JSON.stringify(loaded)}];
  await element('file').onchange();
  assert.deepEqual(state(),loaded);
  element('file').files=[{size:100,text:async()=>'{}'}];
  await element('file').onchange();
  assert.deepEqual(state(),loaded,'invalid files must leave the scene intact');
  await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(requests.at(-1),loaded,'latest scene must reach the renderer');
  console.log('Editor controls: add, edit, duplicate, delete, drag, keyboard, import, validation, and render payload passed.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
