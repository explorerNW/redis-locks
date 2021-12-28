const Defer = (() => {
    function defer() {
      const _this = this;
      this.promise = new Promise((resolve, reject) => {
        _this.resolve = resolve;
        _this.reject = reject;
      });
    }
    return defer;
  })();

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
        tick = timer(delay, callback);
      }
    }, delay);
  }
  
  module.exports = {
    Defer,
    errorHandler,
    timer
  }