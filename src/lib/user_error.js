class ExtendableError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    Error.captureStackTrace(this, this.constructor.name)
  }
}

class UserError extends ExtendableError {
  constructor(message) {
    this.userError=1;
    super(message);
  }
}

module.exports = UserError;