flying-squid is a Node.js Minecraft server implementation in the PrismarineJS ecosystem.

It relies on PrismarineJS/node-minecraft-protocol as the protocol lib, and PrismarineJS/minecraft-data which holds protocol data, block, item, entity, data and more.

### File structure
- src/ — implementation and library code.
- test/ — unit and integration tests.
- examples/basic.js — use flying-squid over node.js api
- app.js — start a basic server over cli
- docs/ — api doc and other doc (you should help to keep it up to date for any api changes you do)

### Tips
- Prefer small, targetted changes to solve the task. If a refactor is needed, please notify the user.
- Avoid adding non-PrismarineJS deps unless the relevant lib logic would be hard to replicate internally, unless the dep is just required for testing purposes.

### Testing
flying-squid uses mocha for tests and standardjs for linting. The list of supported minecraft versions is in `src/lib/version.js`.

To run linter and auto fix errors, run `npm run fix`. To run only the linter, run `npm run lint`.

flying-squid supports many versions of Minecraft, which means tests are run multiple times, once per version. This can be slow
for fast iteration, so you can run a specific version with `npx mocha -g 1.9.4v` for example to run only the `1.9.4` tests and then
once you are happy with your changes, run the full suite with `npm test`.

### Debugging

Add as much console logging as you need to debug any issues. If you have issues with a specific packet, adding logging in the event handlers
for that packet can help you debug to see what deserialized data the client is sending.

If you need to understand inbound/outbound packets, you can add packet logging via monkey patching on the minecraft-protocol client instance:
```js
// inbound
player._client.on('packet', function (data, meta) {
  console.log('<-', meta.name, /* data for packet fields (may be large) */)
})
// outbound
const write = player._client.write
player._client.write = function (name, packet) {
  console.log('->', name)
  write.call(this, name, packet)
}
```

You can add whatever filtering logic there you need to only log specific packets or fields.

If you need to know a packet's structure, you can check the minecraft-data protocol schema for the version you are using.

See `node_modules/minecraft-data/data/pc/1.19.4/proto.yml` for example for the `1.19.4` protocol schema.
Or, for the latest version, you can check the protocol data in `node_modules/minecraft-data/data/pc/latest/proto.yml`.
Note: since these files are quite large, you may want to `grep -C 10` for the packet name you are interested in.
The packets are seperated by state, and then by direction (toClient/toServer).

### Completion checklist

Before you are done, check that:

- [ ] Tests added / updated
  - Sometimes it's hard to add a test if you need a specific packet to be sent by the client.
    In that case, please explain how you manually tested your changes and perhaps write an example script in the examples/ folder that maintainers can use to manually test your changes.
- [ ] I checked that for any new packet `._client.write`'s or `._client.on`'s I added, I ensured the schema was correct by checking some relevant .yml files.
- [ ] Linter passes locally (with `npm run lint`)
- [ ] Documentation updated if needed

If you get stuck, ask maintainers for help and be precise the steps you took and where you got stuck.
