import Behavior from '../behavior'

export const server = function (serv: Server) {
  serv.behavior = Behavior(serv)
}

export const entity = function (entity) {
  entity.behavior = Behavior(entity)
}
declare global {
  interface Server {
    behavior: ReturnType<typeof Behavior>
  }
  interface Entity {
    behavior: ReturnType<typeof Behavior>
  }
}
