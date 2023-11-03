export const player = function (player: Player, serv: Server) {
  function sendHealthPacket () {
    player._client.write('update_health', {
      food: player.food,
      foodSaturation: player.foodSaturation,
      health: player.health
    })
  }

  player.updateHealth = (health) => {
    player.health = health
    sendHealthPacket()
  }

  player.updateFood = (food) => {
    player.food = food
    sendHealthPacket()
  }

  player.updateFoodSaturation = (foodSaturation) => {
    player.foodSaturation = foodSaturation
    sendHealthPacket()
  }
}
declare global {
  interface Player {
    health: number
    food: number
    foodSaturation: number

    "updateHealth": (health: number) => void
    "updateFood": (food: number) => void
    "updateFoodSaturation": (foodSaturation: number) => void
  }
}
