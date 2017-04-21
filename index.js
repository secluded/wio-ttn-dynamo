var ttn = require('ttn');
var fs = require('fs');
var secrets = require('./secrets')

var options = {
  protocol: 'mqtts',
  // Assuming that the mqtt-ca certificate (https://www.thethingsnetwork.org/docs/applications/mqtt/quick-start.html) is in the same folder
  ca: [ fs.readFileSync('mqtt-ca.pem') ],
}

var client = new ttn.data.MQTT(secrets.region, secrets.appId, secrets.accessKey);

client.on('connect', function(connack) {
  console.log('[DEBUG]', 'Connect:', connack);
  console.log('[DEBUG]', 'Protocol:', client.mqtt.options.protocol);
  console.log('[DEBUG]', 'Host:', client.mqtt.options.host);
  console.log('[DEBUG]', 'Port:', client.mqtt.options.port);
});

client.on('error', function(err) {
  console.error('[ERROR]', err.message);
});

client.on('activation', function(deviceId, data) {
  console.log('[INFO] ', 'Activation:', deviceId, JSON.stringify(data, null, 2));
});

client.on('device', null, 'down/scheduled', function(deviceId, data) {
  console.log('[INFO] ', 'Scheduled:', deviceId, JSON.stringify(data, null, 2));
});

client.on('message', function(deviceId, message) {
  var buf = message.payload_raw.toString();
  var temp_int, humid_int, pressure_int, rain_count;
  var tokens = buf.split(',');

  [temp_int, pressure_int, humid_int, rain_count] = tokens

  var temperature = temp_int / 100
  var humidity = humid_int / 100
  var pressure = pressure_int / 100
  var rainfall = rain_count * 0.28

  console.info(deviceId, temperature, humidity, pressure, rainfall)
});
