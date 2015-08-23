var util = require('util')
var zlib = require('zlib')
var Buffers = require('buffers');

module.exports = World;

function BiomeData() {
  this.data = null;
}

BiomeData.prototype.fill = function() {
  if (!this.data) {
    this.data = new Buffer(256);
    for (var i = 0;i < 256;i++) {
      this.data[i] = 0;
    }
  }
}

BiomeData.prototype.unpack = function(buf) {
  this.data = buf.slice(0, 256);
}

BiomeData.prototype.pack = function() {
  this.fill();
  return this.data;
}

BiomeData.prototype.get = function(x, y, z) {
  this.fill();
  return this.data[x + ((y * 16) + z) * 16];
}

BiomeData.prototype.put = function(x, y, z, data) {
  this.fill();
  this.data[x + ((y * 16) + z) * 16] = data;
}

function ChunkData() {
  this.length = 16*16*16;
  this.data = null;
}

ChunkData.prototype.fill = function() {
  if (!this.data) {
    this.data = new Buffer(this.length);
    for (var i = 0;i < this.length;i++) {
      this.data[i] = 0;
    }
  }
}

ChunkData.prototype.unpack = function(buff) {
  this.data = buff.slice(0, this.length);
}

ChunkData.prototype.pack = function() {
  this.fill();
  return this.data;
}

ChunkData.prototype.get = function(x, y, z) {
  this.fill();
  return this.data[x + ((y * 16) + z) * 16];
}

ChunkData.prototype.put = function(x, y, z, data) {
  this.fill();
  this.data[x + ((y * 16) + z) * 16] = data;
}

function ChunkDataNibble() {
  this.length = 16*16*8;
  this.data = null;
}

util.inherits(ChunkDataNibble, ChunkData);

ChunkDataNibble.prototype.get = function(x, y, z) {
  this.fill();
  var r = x % 2;
  x = Math.floor(x/2);
  var i = x + ((y * 16) + z) * 16;
  
  if (r === 0) {
    return this.data[i] >>> 4;
  } else {
    return this.data[i] & 0x0F;
  }
}

ChunkDataNibble.prototype.put = function(x, y, z, data) {
  this.fill();
  var r = x % 2;
  x = Math.floor(x/2);
  var i = x + ((y * 16) + z) * 16;
  
  if (r === 0) {
    this.data[i] = (this.data[i] & 0x0F) | ((data & 0x0F) << 4);
  } else {
    this.data[i] = (this.data[i] & 0xF0) | (this.data & 0x0F);
  }
}

function Chunk() {
  this.block_data = new ChunkData();
  this.block_meta = new ChunkDataNibble();
  this.block_add = new ChunkDataNibble();
  this.light_block = new ChunkDataNibble();
  this.light_sky = new ChunkDataNibble();
}

function ChunkColumn() {
  this.chunks = new Array(16);
  for (var i = 0;i < 16;i++) this.chunks[i] = null;
  
  this.biome = new BiomeData();
}

ChunkColumn.prototype.unpack = function(buff, mask1, mask2, skylight) {
  if (typeof skylight == "undefined") skylight = true;
  
  this.unpack_section(buff, "block_data", mask1);
  this.unpack_section(buff, "block_meta", mask1);
  this.unpack_section(buff, "light_block", mask1);
  if (skylight)
    this.unpack_section(buff, "light_sky", mask1);
  this.unpack_section(buff, "block_add", mask2);
  this.biome.unpack(buff);
}

ChunkColumn.prototype.unpack_section = function(buff, section, mask) {
  for (var i = 0; i < 16; i++) {
    if (mask & (1 << i)) {
      if (this.chunks[i] === null) {
        this.chunks[i] = new Chunk();
      }
      this.chunks[i][section].unpack(buff);
    }
  }
}

ChunkColumn.prototype.pack = function() {
  var bufs = [];
  var mask1 = 0;
  for (var i = 0; i < 16; i++) {
    if (this.chunks[i] !== null) {
      mask1 |= 1 << i;
    }
  }
  var block_data = this.pack_section("block_data");
  var block_meta = this.pack_section("block_meta");
  var light_block = this.pack_section("light_block");
  var light_sky = this.pack_section("light_sky");
  var mask2 = 0;
  bufs.push(block_data, block_meta, light_block, light_sky);
  return {
    data: Buffer.concat(bufs),
    mask1: mask1,
    mask2: mask2,
    skylight: true
  };
}

ChunkColumn.prototype.pack_section = function(section) {
  var bufs = [];
  for (var i = 0; i < 16; i++) {
    if (this.chunks[i] !== null)
      bufs.push(this.chunks[i][section].pack());
  }
  return Buffer.concat(bufs);
}

function World() {
  this.columns = {};
}

World.prototype.unpack = function(packetData) {
  var data = zlib.inflate(packetData.compressedChunkData);
  packetData.meta.forEach(function (meta) {
    var key = [meta.x, meta.z];
    var column;
    if (key in this.columns) {
      column = this.columns[key];
    } else {
      column = new ChunkColumn();
      this.columns[key] = column;
    }
    
    column.unpack(data, meta.bitMap, meta.addMap, packetData.skyLightSent);
  });
}

World.prototype.packMapChunkBulk = function() {
  var bufs = [];
  var metadatas = [];
  var cb = arguments[arguments.length - 1];
  
  // First pass, get all the metadatas and buffers.
  for (var i = 0;i < arguments.length - 1; i++) {
    var arg = arguments[i];
    var data = this.columns[arg];
    if (this.columns === null) {
      continue;
    }
    
    var packetContent = data.pack();
    bufs.push(packetContent.data);
    var metadata = {
      x: arg[0],
      z: arg[1],
      bitMap: packetContent.mask1,
      addBitMap: packetContent.mask2
    }
    metadatas.push(metadata);
  }
  
  // Deflate/compress the buffers
  var deflate = zlib.createDeflate();
  var deflateBuffer = new Buffer(0);
  deflate.on('data', function(data) {
    deflateBuffer = Buffer.concat([deflateBuffer, data]);
  });
  deflate.on('end', function() {
    cb(null, {
      data: {
      skyLightSent: true,
      meta: metadatas,
      compressedChunkData: deflateBuffer
    }});
  });
  deflate.on('error', function(err) {
    console.log("error");
    cb(err);
  });
  deflate.write(Buffer.concat(bufs));
  deflate.end();
}

World.prototype.get = function(x, y, z, key) {
  var rx = x % 16;
  x = Math.floor(x / 16);
  var ry = y % 16;
  y = Math.floor(y / 16);
  var rz = z % 16;
  z = Math.floor(z / 16);
  
  if (!([x,z] in this.columns)) {
    return 0;
  }
  
  var column = this.columns[[x,z]];
  var chunk = column.chunks[y];
  
  if (chunk == null) {
    return 0;
  }
  
  return chunk[key].get(rx, ry, rz);
}

World.prototype.put = function(x, y, z, key, data) {
  var rx = x % 16;
  x = Math.floor(x / 16);
  var ry = y % 16;
  y = Math.floor(y / 16);
  var rz = z % 16;
  z = Math.floor(z / 16);
  
  var column;
  if ([x,z] in this.columns) {
    column = this.columns[[x,z]];
  } else {
    column = new ChunkColumn();
    this.columns[[x,z]] = column;
  }
  
  var chunk = column.chunks[y];  
  if (chunk == null) {
    chunk = new Chunk();
    column.chunks[y] = chunk;
  }
  
  chunk[key].put(rx, ry, rz, data);
}

World.prototype.get_biome = function(x, z) {
  var rx = x % 16;
  x = Math.floor(x / 16);
  var rz = z % 16;
  z = Math.floor(z / 16);
  
  if (!([x,z] in this.columns)) {
    return 0;
  }
  
  return this.columns[[x,z]].biome.get(rx, rz);
}

World.prototype.put_biome = function(x, z, data) {
  var rx = x % 16;
  x = Math.floor(x / 16);
  var rz = z % 16;
  z = Math.floor(z / 16);
  
  var column;
  if ([x,z] in this.columns) {
    column = this.columns[[x,z]];
  } else {
    column = new ChunkColumn();
    this.columns[[x,z]] = column;
  }
  
  return column.biome.put(rx, rz, data);
}