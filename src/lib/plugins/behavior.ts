import { Behaviour } from "../.."

export const server = (serv) => {
  serv.behavior = Behaviour(serv)
}

export const entity = (entity) => {
  entity.behavior = Behaviour(entity)
}
