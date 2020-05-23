# Swim/Pelion Integration Example

notes:
* API host	https://api.us-east-1.mbedcloud.com
* key: ak_1MDE3MjI5MWVlZWVhN2ExZTNkYzEyYWU3MDAwMDAwMDA01722982f11bceef6448061800000000hHrp7q2Ow4TeYe9x5SkkOCJ28GBIRThK

curl -v -H "Authorization: Bearer ak_1MDE3MjI5MWVlZWVhN2ExZTNkYzEyYWU3MDAwMDAwMDA01722982f11bceef6448061800000000hHrp7q2Ow4TeYe9x5SkkOCJ28GBIRThK" https://api.us-east-1.mbedcloud.com/v3/devices

links:
* https://www.pelion.com/docs/device-management/current/introduction/index.html
* https://github.com/swimos/plant-monitor
* https://portal.mbedcloud.com/
* https://simulator.mbed.com/
* https://github.com/cvasilak/pelion-device-simulator
* https://www.pelion.com/docs/device-management/current/connecting/linux-on-pc.html
* https://www.pelion.com/docs/device-management/current/provisioning-process/provisioning-development-devices.html
* https://simulator.mbed.com/#temperature
* https://www.pelion.com/docs/device-management/current/service-api-references/using-the-apis.html
* https://www.pelion.com/docs/device-management/current/service-api-references/connect-api.html
* https://www.pelion.com/docs/device-management/current/connecting/using-the-device-management-api.html



curl calls

API key: <PELION_API_KEY>
API host:    https://api.us-east-1.mbedcloud.com

```
# list devices
curl -X GET https://api.us-east-1.mbedcloud.com/v3/devices?limit=8 -H "Authorization: Bearer ak_1MDE3MjI5MWVlZWVhN2ExZTNkYzEyYWU3MDAwMDAwMDA01722982f11bceef6448061800000000hHrp7q2Ow4TeYe9x5SkkOCJ28GBIRThK" | jq

# create websocket channel
curl -X PUT https://api.us-east-1.mbedcloud.com/v2/notification/websocket -H "Authorization: Bearer <PELION_API_KEY>"

# delete a websocket channel
curl -X DELETE https://api.us-east-1.mbedcloud.com/v2/notification/websocket -H "Authorization: Bearer <PELION_API_KEY>"

# delete a callback channel
curl -X DELETE https://api.us-east-1.mbedcloud.com/v2/notification/callback -H 'Authorization: Bearer <PELION_API_KEY>'

# get channel metadata
## dev channel
curl -X GET https://api.us-east-1.mbedcloud.com/v2/notification/channel -H "Authorization: Bearer <PELION_API_KEY>" | jq

# open websocket
websocat -v wss://api.us-east-1.mbedcloud.com/v2/notification/websocket-connect -H "Authorization: Bearer <PELION_API_KEY>"

# read a resource
curl -X POST -H "Authorization: Bearer <PELION_API_KEY>" -H "Content-Type: application/json" https://api.us-east-1.mbedcloud.com/v2/device-requests/<device_id>?async-id=my-async-id-read-resource -d '{"method": "GET", "uri": "/3201/0/5853"}'

# read a resource (simulator)
curl -X POST -H "Authorization: Bearer <PELION_API_KEY>" -H "Content-Type: application/json" https://api.us-east-1.mbedcloud.com/v2/device-requests/<device_id>?async-id=my-async-id-read-resource -d '{"method": "GET", "uri": "/3201/0/5853"}'

# write a resource (/3201/0/5853)(Digital Output): <any value>)
curl -X POST -H "Authorization: Bearer <PELION_API_KEY>" -H "Content-Type: application/json" https://api.us-east-1.mbedcloud.com/v2/device-requests/<device_id>?async-id=my-async-id-write-resource -d '{"method": "PUT", "uri": "/3201/0/5853", "accept": "text/plain", "content-type": "text/plain", "payload-b64": "OTk="}'

# write a resource (/3201/0/5853 (Led Pattern): 500:500:500:500:500:500:500:500) (simulator)
curl -X POST -H "Authorization: Bearer <PELION_API_KEY>" -H "Content-Type: application/json" https://api.us-east-1.mbedcloud.com/v2/device-requests/<device_id>?async-id=my-async-id-write-resource -d '{"method": "PUT", "uri": "/3201/0/5853", "accept": "text/plain", "content-type": "text/plain", "payload-b64": "MTAwOjEwMDoxMDA6MTAwOjEwMDoxMDA6MTAwOjEwMA=="}'

# execute resource
curl -X POST -H "Authorization: Bearer <PELION_API_KEY>" -H "Content-Type: application/json" https://api.us-east-1.mbedcloud.com/v2/device-requests/<device_id>?async-id=my-async-id-execute-resource -d '{"method": "POST", "uri": "/3201/0/5850"}'

# execute resource (simulator)
curl -X POST -H "Authorization: Bearer <PELION_API_KEY>" -H "Content-Type: application/json" https://api.us-east-1.mbedcloud.com/v2/device-requests/<device_id>?async-id=my-async-id-execute-resource -d '{"method": "POST", "uri": "/3201/0/5850"}'

# create subscription
curl -X PUT https://api.us-east-1.mbedcloud.com/v2/subscriptions/<device_id>/3200/0/5501 \
-H "Authorization: Bearer <PELION_API_KEY>"


# create subscription (simulator)
curl -X PUT https://api.us-east-1.mbedcloud.com/v2/subscriptions/<device_id>/3200/0/5501 \
-H "Authorization: Bearer <PELION_API_KEY>"


# delete subscription
curl -X DELETE https://api.us-east-1.mbedcloud.com/v2/subscriptions/<device_id>/3200/0/5501 \
-H "Authorization: Bearer <PELION_API_KEY>"


# delete subscription (simulator)
curl -X DELETE https://api.us-east-1.mbedcloud.com/v2/subscriptions/<device_id>/3200/0/5501 \
-H "Authorization: Bearer <PELION_API_KEY>"
```