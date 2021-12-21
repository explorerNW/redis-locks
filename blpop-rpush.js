const { client } = require("./redis");

const errorHandler = (error) => {
    if (error) {
        console.log('err: '+error);
        process.exit();
    }
}

function blpop(name, timeout=60){
    console.log('start receive message');
    client.blpop(name, timeout, (err, data)=>{
        errorHandler(err);
        if (data) {
            console.log('message: ' + data[1]);
            blpop(name);
        }
    });
}

blpop('blpopTest');