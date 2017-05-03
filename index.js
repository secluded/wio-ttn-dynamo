var ttn = require('ttn')
var fs = require('fs')

var AWS = require('aws-sdk')
AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: 'wio'})
AWS.config.region = 'ap-southeast-2'


var secrets = require('./secrets')
// var dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

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

  var params = {
      TableName:'wio',
      Item:{
          "DeviceId": deviceId,
          "Timestamp": new Date().getTime(),
          "Temperature": temperature,
          "Humidity": humidity,
          "Pressure": pressure,
          "Rainfall": rainfall,
          "DeviceTimestamp": message.metadata.time
      }
  }

  console.log("Adding a new item...", JSON.stringify(params, null, 2))
  docClient.put(params, function(err, data) {
      if (err) {
          console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2))
      } else {
          console.log("Added item:", JSON.stringify(data, null, 2))
      }
  })
});
