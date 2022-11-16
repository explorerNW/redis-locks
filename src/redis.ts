import Redis from 'ioredis';
import * as uuid from 'uuid';

const client = new Redis({
    password: "www.niewang.com"
});

export {
    client,
    uuid
};