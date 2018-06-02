# Behaviors

Behaviors are what handle advanced events in flying-squid. They are editable and allow default actions to be cancellable so that they can take control of events and so that plugins can interact with each other. Three different events get called for a behavior in the following order:
- `EVENTNAME_cancel`
- `EVENTNAME`
- `EVENTNAME_done`

Default actions are actions an event normally takes. For example, the move event will normally set the player's position to the position they requested, and then send their position to all nearby players. Similarily, the defualt action of `placeBlock` includes putting the block in the world, removing 1 of that block from the player's hand, and playing the place block sound.

The `EVENTNAME_cancel` event passses the paramaters `data` (object of all info about the behavior; changing the data could have effects on the outcome) and `cancel`, a function. This event is run before the default action. If `cancel()` is called, it will cancel the default action.

The `EVENTNAME` event passes `data` as well as a boolean `cancelled` so that plugins can check if the default behavior has been cancelled. This is event is run before the default action.

The `EVENTNAME_done` event passes `data` and `cancelled`. This event is run after the default action.

## Example

One plugin wants to cancel a player's movement while another wants to say "HI" when they move

Plugin A:
```js
player.on('move_cancel', ({position}, cancel) => {
  cancel(); // If player tries to move, shoots them back where they came from
});
```

Plugin B:
```js
player.on('move', ({position}, cancelled) => {
  if (!cancelled) player.chat('You are moving!');
})
```

When a player normally moves, the server saves their position and sends it to all clients. Therefore, if a "move" behavior was truly cancelled, the player would be able to move freely while the server and other players would see the player stationary. This doesn't happen because behaviors can have "default cancel functions". In the case of a player's "move", the default cancel function sends them back where they came from. To prevent this from happening, use the "preventDefaultCancel" paramater: `cancel(false);`

Behaviors are listed in the doc with info about their default action and cancel action. If the behavior is not cancelled, their default action will take place. If any plugin cancels the behavior, their cancel action will take place. If any plugin cancels their default behavior with the "preventDefaultCancel" parameter, no further action will take place. `EVENTNAME_done` is still called regardless.

## Second Example

Plugin C
```js
player.on('move_cancel', ({position}, cancel) => {
  cancel(false); // Doesn't teleport the player back. They will stand still for everyone else.
});
```

If we keep Plugin B (say "You are moving!" on player move) and use Plugin C, we'll see that the player can move freely but will not receive the "You are moving" text (since, to the server, they are not moving) and other players will be unable to see their movements.

Finally, there is hidden cancel. This is the second parameter in cancel, and allows plugins to hide the fact that they cancelled 
the default action from other plugins. It's best practice to only use this when you are replacing the default action with your own action and the parameters for the event given are not enough to replicate this action.

Plugin D
```js
player.on('move_cancel', ({position}, cancel) => {
  cancel(false, true); // Player doesn't teleport back and now "cancelled" will be false
})
```

Using Plugin B and D together, the player will be able to move freely and will be spammed with "You are moving!", however the server will not store their position and other players will not see the player move. Since you don't know what plugins will be added with your own, unexpected behavior may arise, so avoid this if you can.

## Format in Docs

Definition of behavior.
- var1: Variable with value, can be changed (default: defaultValue)
- var2 (u): Variable with value. You can change it however it will not have any effect on the default action (and could screw with other plugins, watch out!). U stands for unused

Default: What happens if the havior isn't cancelled.

Cancelled: What happens if the behavior is cancelled and `preventDefaultCancel` is still false.