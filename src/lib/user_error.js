class ExtendableError extends Error {
  constructor (message) {
    super(message)
    this.name = this.constructor.name
    this.message = message
    Error.captureStackTrace(this, this.constructor.name)
  }
}

class UserError extends ExtendableError {
  constructor (message) {
    super(message)
    this.userError = 1
  }
}

export default UserError
