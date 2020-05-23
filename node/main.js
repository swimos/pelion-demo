const https = require('https')
const swimClient = require('@swim/client');
const commandLineArgs = process.argv

class Main {

    constructor() {
        console.info('[main] constructor');
        this.args = {};
        this.swimUrl = "ws://127.0.0.1:9001";

        this.authtoken = "Bearer ak_1MDE3MjI5MWVlZWVhN2ExZTNkYzEyYWU3MDAwMDAwMDA01722982f11bceef6448061800000000hHrp7q2Ow4TeYe9x5SkkOCJ28GBIRThK";
        this.apiUrl = "api.us-east-1.mbedcloud.com";

        this.loopInterval = 1000;
        this.loopTimeout = null;
        this.asyncIds = [];
        this.endpoints = [];
        this.queryTimeout = null;
    }

    start() {
        console.info('[main] start');
        this.getDeviceList();
        this.mainLoop();
    }

    mainLoop() {
        this.pullNotifications();

        this.loopTimeout = setTimeout(this.mainLoop.bind(this), this.loopInterval);
    }

    getDeviceList() {
        console.info('[main] getDeviceList');
        this.httpRequest('/v3/devices', '', 'GET', (result) => {
            const resultData = JSON.parse(result);
            this.deviceList = resultData.data;

            for(let device of this.deviceList) {
                swimClient.command(this.swimUrl, `/device/${device.endpoint_name}`, 'createDevice', device);
                if(device.state === "registered") {

                    this.deleteActiveSubscriptions(device.endpoint_name);
                    this.getEndPoints(device.endpoint_name);
                } else {
                    // console.info(`Device ${device.endpoint_name} not registered`);
                }
            }

        });

    }

    deleteActiveSubscriptions(endpointName) {
        console.info('[main] deleteActiveSubscriptions', endpointName);
        this.httpRequest(`/v2/subscriptions/${endpointName}`, '', 'DELETE', (result) => {
            console.info('subs', result);
        });
    }

    getEndPoints(endpointName) {
        console.info('[main] getEndPoints', endpointName);

        // get list of end points
        this.httpRequest(`/v2/endpoints/${endpointName}`, null, 'GET', (result) => {
            // console.info('end points')
            const endpointList = JSON.parse(result);
            for(let endpoint of endpointList) {
                // subscribe to all observable endpoints
                if(endpoint && ! endpoint.type) {
                    // console.info("sub to", endpoint);
                    swimClient.command(this.swimUrl, `/resource/${endpointName}/${endpoint.uri}`, 'setResourceValue', {});
                    this.subscribeToEndpoint(endpointName, endpoint);
                } else {
                    // console.info("No sub to", endpoint);
                }
            }
        });

        console.info('[main] getEndPoints done?');
    }

    subscribeToEndpoint(endpointName, endpoint) {
        // console.info('[main] subscribeToEndpoint', endpointName, endpoint);
        this.httpRequest(`/v2/subscriptions/${endpointName}${endpoint.uri}`, '', 'PUT', (result) => {
            if(result !== "NOT_CONNECTED" && result !== "QUEUE_IS_FULL") {
                const resultData = JSON.parse(result);
                const newId = resultData['async-response-id'];
                this.asyncIds[newId] = {
                    asyncId: newId,
                    deviceId: endpointName,
                    uri: endpoint.uri
                }

                if(endpoint) {
                    this.endpoints.push([endpointName, newId, endpoint.uri]);
                }
                
                clearTimeout(this.queryTimeout);

                this.queryTimeout = setTimeout(() => {
                    this.handleResourceQueryBuffer();
                }, 1000);
                
            } else {
                console.info(`Device ${endpointName} not connected`);
            }


        });

    }

    // buffer to prevent api query queue overload
    handleResourceQueryBuffer() {
        const end = this.endpoints.shift();
        this.getResourceValue(end[0], end[1], end[2]);

        if(this.endpoints.length > 0) {
            setTimeout(() => {
                this.handleResourceQueryBuffer();
            }, 500);
        }

    }

    getResourceValue(endpointName, asyncId, uri) {
        const msg = `{"method": "GET", "uri": "${uri}"}`;
        this.httpRequest(`/v2/device-requests/${endpointName}?async-id=${asyncId}`, msg, 'POST', (result) => {
            console.info(result);
        });
    }

    pullNotifications() {
        this.httpRequest(`/v2/notification/pull`, null, 'GET', (result) => {
            if(result !== "CONCURRENT_PULL_REQUEST_RECEIVED") {
                const resultData = JSON.parse(result);

                if(resultData.notifications) {
                    for(let msg of resultData.notifications) {
                        if(msg.path) {
                            // console.info(`node=/${msg.ep}${msg.path} lane=/setResourceValue value=${Buffer.from(msg.payload, 'base64').toString('utf-8')}`);
                            const returnMsg = {
                                data: Buffer.from(msg.payload, 'base64').toString('utf-8'),
                                endpoint: msg.ep,
                                path: msg.path
                            }

                            const resourceId = msg.path.split('/').join('');
                            swimClient.command(this.swimUrl, `/resource/${msg.ep}/${resourceId}`, 'setResourceValue', returnMsg);

                        } else {
                            // console.info('no receiver', msg);

                        }

                        // *** send swim command here of msg.path=Buffer.from(msg.payload, 'base64').toString('utf-8') ***
                    }
                } else if(resultData["async-responses"]) {
                    for(let msg of resultData["async-responses"]) {
                        if(msg.status === 200) {

                            const reciever = this.asyncIds[msg.id || msg.ep];
                            if(reciever) {
                                const payload = (msg.payload) ? Buffer.from(msg.payload, 'base64').toString('utf-8') : "";
                                if(payload) {
                                    // console.info(`node=/${reciever.deviceId}${reciever.uri} lane=/setResourceValue value=${payload}`);
                                    const returnMsg = {
                                        id: msg.id,
                                        data: payload,
                                        endpoint: reciever.deviceId,
                                        path: reciever.uri,
                                        asyncId: reciever.asyncId
                                    }
        
                                    const resourceId = reciever.uri.split('/').join('');
                                    // console.info(resultData);
                                    swimClient.command(this.swimUrl, `/resource/${reciever.deviceId}/${resourceId}`, 'setResourceValue', returnMsg);
        
                                } else {
                                    console.info('no payload async', msg);
                                }
                                
                            } else {
                                console.info('no receiver async', msg);

                            }
                            
    
                        } else {
                            // console.info("bad status code");
                            // console.info(msg);
    
                        }
                    }
                } else if(resultData["registrations"]) {
                    this.getDeviceList(); // start over
                } else {
                    console.info('no notif', result);
                }
                
                
            }
            

        });        
    }

    httpRequest(path, data, type, onComplete, onError) {

        const options = {
            hostname: this.apiUrl,
            path: path,
            method: type,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': this.authtoken
            }
        }

        const req = https.request(options, res => {
            // console.info(res.statusCode);
            this.httpRes = res;
            res.on('data', d => {
                // console.info(d);
                onComplete(d.toString())
            })
        })

        req.on('error', error => {
            console.error(error)
            if (onError) {
                onError(error);
            }

        })

        if (data) {
            req.write(data);
        }
        req.end()

    }

    /**
     * utility method to handle processing arguments from the command line
     * arguments will be stored in this.args
     */
    processCommandLineArgs() {
        commandLineArgs.forEach((val, index, arr) => {
            if (val.indexOf('=') > 0) {
                const rowValue = val.split('=');
                this.args[rowValue[0]] = rowValue[1];
            }
        })
    }

}

// create Main and kick everything off by calling start()
const main = new Main();
main.start();