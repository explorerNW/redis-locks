class Defer {
    promise;
    resolve;
    reject;

    constructor(){
        this.promise = new Promise((resolve,reject)=>{
            this.resolve =resolve;
            this.reject = reject;
        });
    }
}

  const errorHandler = err => {
    if (err) {
      console.log(err);
      process.exit();
    }
  };

  function timer(delay, callback) {
    let tick = setTimeout(() => {
      const result = callback();
      if (result) {
        clearTimeout(tick);
        process.exit();
      } else {
        timer(delay, callback);
      }
    }, delay);
  }
  
  export {
    Defer,
    errorHandler,
    timer
  }