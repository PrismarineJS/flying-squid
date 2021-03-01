module.exports.player = function (player, serv) {
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
