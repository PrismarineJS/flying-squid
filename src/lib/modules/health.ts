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
    /** @internal */
    health: number
    /** @internal */
    food: number
    /** @internal */
    foodSaturation: number

    /** Updates the player's health and sends the relevant packet. */
    "updateHealth": (health: number) => void
    /** Updates the player's food and sends the relevant packet. */
    "updateFood": (food: number) => void
    /** Updates the player's food saturation and sends the relevant packet. */
    "updateFoodSaturation": (foodSaturation: number) => void
  }
}
