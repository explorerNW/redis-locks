import { acquireSemaphore, releaseSemaphore } from "./acquire_semaphore";

import { countingSemaphore, releaseCountingSemaphore } from './countingSemaphore';

import { countingFairSemaphore, releaseFairSemaphore } from './countingFairSemaphore';

import { client } from './redis';
import { errorHandler } from './utils';
import { combineLatest, delay, filter, map, of, switchMap } from "rxjs";


const count = 100;
const start = Date.now();
const operatoinCost = 10 || Math.random() * 10000;

let quit = 0;
function test() {
  acquireSemaphore("test")
    .then(async (data) => {
      quit++;
      if (data) {
        const response0 = await client.incr('test');
        console.log(`AS: ${response0}`);
        setTimeout(() => {
          releaseSemaphore("test", data);
        }, operatoinCost);
      }
      if (quit === count) {
        console.log('acquireSemaphore: %s s', (Date.now() - start) / 1000);
        process.exit();
      }
    })
    .catch(err => {
      console.log(err);
    });
}

client.set('test', 0);
client.set('test1', 0);
client.set('test3', 0);

for (let i = 0; i < 100; i++) {
  const subscribe = countingFairSemaphore("test3", count).pipe(
    filter(([identifier]) => !!identifier),
    delay(operatoinCost),
    switchMap(([identifier]) => combineLatest([of(identifier), client.incr('test3')])),
    map(([identifier, res])=>{
      console.log("fairSemaphore: " + res);
      return combineLatest([releaseFairSemaphore("test3", res), of(res)]);
    }),
    switchMap(release=>release),
    map(([, res])=>{
      if (res % count === 0) {
        client.set('lock:test3:counter', '0');
        console.log('countingFairSemaphore: %s s', (Date.now() - start) / 1000);
      }
      subscribe?.unsubscribe();
    })
  ).subscribe({ error: (error)=>{errorHandler(error)} });

  countingSemaphore("test1", count).pipe(
    filter(([data]) => !!data),
    switchMap((data)=> combineLatest([client.incr('test1'), of(data)])),
    switchMap(([res, data])=> {
      console.log(`CS:${res}`);
      return combineLatest([releaseCountingSemaphore("test1", data), of(res)]);
    }),
    map(([, res])=>{
      if (res % count === 0) {
        console.log('countingSemaphore: %s s', (Date.now() - start) / 1000);
      }
    })
  ).subscribe({ error: (error)=>{errorHandler(error)} });

  test();
}
