import { test, expect } from '@playwright/test';
import { dinner } from '../../shared/recipe-fixture.js';
import { recipeView } from '../../shared/recipes.js';
const recipe = recipeView({ ...dinner, steps: [...dinner.steps, { text: 'Serve while hot.', ingredientIds: [] }] }, { id:'voice-recipe' });
test.beforeEach(async ({page}) => {
  await page.route('https://js.puter.com/**',route=>route.abort());
  await page.route('**/api/readiness',route=>route.fulfill({json:{ready:true,message:'The recipe service is ready.'}}));
  await page.addInitScript(({recipe}) => {
    localStorage.setItem('mise_active_chef_user_v3',JSON.stringify({id:'voice-chef',provider:'puter',name:'Voice chef'}));
    localStorage.setItem('mise_cookbook_v3:puter%3Avoice-chef',JSON.stringify({version:3,operations:[{type:'save',id:recipe.id,opId:'voice-save',at:1,recipe}]}));
    window.puter={authToken:'test'};
    window.__voice={instances:[],aborts:0,stops:0,spoken:[],cancels:0};
    window.SpeechRecognition=class {
      constructor(){window.__voice.instances.push(this);}
      start(){if(window.__voice.throwStart) throw new DOMException('Blocked','NotAllowedError');this.onstart?.();}
      stop(){window.__voice.stops++;this.onend?.();}
      abort(){window.__voice.aborts++;this.onend?.();}
    };
    window.__voice.emit=(transcript,index=0)=>{
      const instance=window.__voice.instances.at(-1), results=[Object.assign([{transcript}],{isFinal:true})];
      instance.onresult?.({resultIndex:index,results});
    };
    window.SpeechSynthesisUtterance=class {constructor(text){this.text=text;}};
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{
      getVoices:()=>[{lang:'en-US',default:true,name:'Test voice'}],
      speak(utterance){window.__voice.spoken.push(utterance);},
      cancel(){window.__voice.cancels++;},resume(){},paused:false,
    }});
  },{recipe});
});
test('dictation preserves existing food names, adds every ingredient and supports stopping',async({page})=>{
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await page.getByLabel('Ingredient 01',{exact:true}).fill('potato');
  await page.getByRole('button',{name:'Use voice',exact:true}).click();
  await expect(page.getByRole('button',{name:'Stop listening',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.evaluate(()=>{window.__voice.emit('I have coriander and mushrooms and rice and garlic');window.__voice.emit('I have coriander and mushrooms and rice and garlic');});
  for(const [i,value]of ['potato','coriander','mushrooms','rice','garlic'].entries()) await expect(page.getByLabel(`Ingredient ${String(i+1).padStart(2,'0')}`,{exact:true})).toHaveValue(value);
  await page.getByRole('button',{name:'Stop listening',exact:true}).click();
  await expect(page.getByRole('button',{name:'Use voice',exact:true})).toHaveAttribute('aria-pressed','false');
  await expect(page.getByText('Added 4 ingredients. Review the names before generating a recipe.')).toBeVisible();
  expect(await page.evaluate(()=>window.__voice.instances.length)).toBe(1);
  expect(await page.evaluate(()=>window.__voice.stops)).toBe(1);
});
test('permission and network errors are visible, preserve input and allow a retry',async({page})=>{
  await page.goto('/',{waitUntil:'domcontentloaded'});await page.getByLabel('Ingredient 01',{exact:true}).fill('potato');
  await page.getByRole('button',{name:'Use voice',exact:true}).click();
  await page.evaluate(()=>window.__voice.instances.at(-1).onerror({error:'not-allowed'}));
  await expect(page.getByRole('alert')).toContainText('Allow the microphone');
  await expect(page.getByLabel('Ingredient 01',{exact:true})).toHaveValue('potato');
  await page.getByRole('button',{name:'Use voice',exact:true}).click();
  await page.evaluate(()=>window.__voice.instances.at(-1).onerror({error:'network'}));
  await expect(page.getByRole('alert')).toContainText('speech service could not connect');
  await page.getByRole('button',{name:'Use voice',exact:true}).click();
  await page.evaluate(()=>window.__voice.emit('garlic'));await page.getByRole('button',{name:'Stop listening',exact:true}).click();
  await expect(page.getByLabel('Ingredient 02',{exact:true})).toHaveValue('garlic');await expect(page.getByRole('alert')).toHaveCount(0);
});
test('unsupported speech and synchronous start failures leave manual input usable',async({page})=>{
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{window.__voice.throwStart=true;});await page.getByRole('button',{name:'Use voice',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Allow the microphone');
  await page.evaluate(()=>{window.SpeechRecognition=undefined;window.webkitSpeechRecognition=undefined;});
  await page.getByRole('button',{name:'Use voice',exact:true}).click();await expect(page.getByRole('alert')).toContainText('unavailable in this browser');
  await page.getByLabel('Ingredient 01',{exact:true}).fill('potato');await expect(page.getByLabel('Ingredient 01',{exact:true})).toHaveValue('potato');
});
test('switching mode and leaving the kitchen release the microphone and ignore late results',async({page})=>{
  await page.goto('/',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Use voice',exact:true}).click();
  await page.evaluate(()=>{window.__voice.late=window.__voice.instances.at(-1).onresult;});
  await page.getByRole('button',{name:/Freeform Text/}).click();
  await page.evaluate(()=>window.__voice.late({resultIndex:0,results:[Object.assign([{transcript:'unwanted'}],{isFinal:true})]}));
  await expect(page.getByLabel('Pantry ingredients')).toHaveValue('');
  await page.getByLabel('Pantry ingredients').fill('potato');await page.getByRole('button',{name:'Use voice',exact:true}).click();
  await page.evaluate(()=>window.__voice.emit('coriander and rice'));await page.getByRole('button',{name:'Stop listening',exact:true}).click();
  await expect(page.getByLabel('Pantry ingredients')).toHaveValue('potato, coriander, rice');
  await page.getByRole('button',{name:'Use voice',exact:true}).click();await page.getByRole('button',{name:'Manage pantry'}).click();
  await expect.poll(()=>page.evaluate(()=>window.__voice.aborts)).toBe(2);
});
test('spoken steps finish, show playback errors and cancel on navigation and close',async({page})=>{
  await page.goto('/',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'View cookbook'}).click();await page.getByText('Skillet potatoes',{exact:true}).click();
  await page.getByRole('button',{name:'Open cooking mode'}).click();
  const read=page.getByRole('button',{name:/Read Step/});await read.click();
  await expect(page.getByRole('button',{name:/Stop Voice/})).toHaveAttribute('aria-pressed','true');
  expect(await page.evaluate(()=>window.__voice.spoken.at(-1).text)).toContain('Step 1.');
  await page.evaluate(()=>window.__voice.spoken.at(-1).onend());await expect(read).toBeVisible();
  await read.click();await page.evaluate(()=>window.__voice.spoken.at(-1).onerror({error:'audio-busy'}));await expect(page.getByRole('alert')).toContainText('Check your audio output');
  await read.click();await page.getByRole('button',{name:/Next/}).click();await expect(read).toBeVisible();
  await read.click();expect(await page.evaluate(()=>window.__voice.spoken.at(-1).text)).toContain('Step 2.');
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog',{name:'Cooking mode'})).toHaveCount(0);
  expect(await page.evaluate(()=>window.__voice.spoken.at(-1).onend)).toBeNull();
  await page.getByRole('button',{name:'Open cooking mode'}).click();
  await page.evaluate(()=>{window.SpeechSynthesisUtterance=undefined;});await read.click();
  await expect(page.getByRole('alert')).toContainText('Spoken instructions are unavailable');
});
