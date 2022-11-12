import { client, uuid } from './redis';
import { Subject, map, catchError, switchMap, of, combineLatest } from 'rxjs';

function countingFairSemaphore(name, limit = 10, timeout = 100000) {
    const identifier: string = uuid.v4();
    const semaphore = "lock:" + name;
    const owner = semaphore + ":owner";
    const counter = semaphore + ":counter";
    const now = Date.now();
    const observer = new Subject();    
    observer.pipe(
        switchMap(() => client.zremrangebyscore(semaphore, "-inf", Date.now() - timeout)),
        switchMap(() => client.zinterstore(owner, 2, owner, semaphore, "weights", 1, 0,)),
        switchMap(() => client.incr(counter)),
        switchMap((counterValue: number)=> client.zadd(semaphore, now, identifier) && of(counterValue)),
        switchMap((counterValue: number) => client.zadd(owner, counterValue, identifier)),
        switchMap(() => client.zrank(owner, identifier)),
        map((rank: number)=>{
            if (rank < limit) {
                return identifier;
            } else {
                return;
            }
        }),
        switchMap((res) => combineLatest([client.zrem(semaphore, identifier), of(res)])),
        switchMap(([, res1]) => combineLatest([client.zrem(owner, identifier), of(res1)])),
        catchError((error)=> { throw error })
    );
    return observer;
}

function refreshFairSemaphore(name, sema) {
    const lock = "lock:" + name;
    const observer = new Subject();    
    observer.pipe(
        switchMap(() => client.zadd(lock, sema)),
        switchMap((res) => {
            if (res) {
                return client.zrem(lock, sema);
            }
        }),
        map((res)=>res)
    );
    return observer;
}

function releaseFairSemaphore(name, sema) {
    const lock = "lock:" + name;
    const owner = lock + ":owner";
    const observer = new Subject();    
    observer.pipe(
        map(()=>{
            switchMap(() => client.zrem(owner, sema)),
            switchMap(() => client.zrem(lock, sema))
        })
    );
    return observer;
}

export {
    countingFairSemaphore,
    refreshFairSemaphore,
    releaseFairSemaphore
}