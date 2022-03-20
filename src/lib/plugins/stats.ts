export const player = function (player) {
  player._client.on('client_command', ({ payload } = { payload: null }) => {
    if (payload === 1) {
      // WIP: dummy
      player.system('WIP, press ESC')
    }
  })
}
