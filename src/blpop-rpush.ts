import { client } from './redis';

const errorHandler = (error) => {
    if (error) {
        console.log('err: '+error);
        process.exit();
    }
}

async function blpop(name, timeout=60){
    console.log('start receive message');
    try {
        const data =  client.blpop(name, timeout);
        if (data) {
            console.log('message: ' + data[1]);
            blpop(name);
        }
    } catch(error) {
        errorHandler(error);
    }
}

blpop('blpopTest');