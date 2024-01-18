export const player = function (player) {
  player._client.on('client_command', ({ payload }: any = {}) => {
    if (payload === 1) {
      // WIP: dummy
      player.system('WIP, press ESC')
    }
  })
}
declare global {
}
