class DevicesPage {

  swimUrl = null;
  tween = swim.Transition.duration(300);

  links = {};

  deviceList = {}
  deviceListLink = null;

  resourceList = {};
  resourceLinks = {};
  deviceLinks = {};

  deviceDropdown = null;
  resourceListPanel = null;
  resourceDataPanel = null;
  resourceChartPanel = null;

  selectedDeviceId = null;
  selectedResourceInfo = null;
  

  constructor(swimUrl) {
    this.swimUrl = swimUrl;
    this.deviceDropdown = null;
  }

  initialize() {

    this.deviceDropdown = document.getElementById("deviceDropDown");
    this.resourceListPanel = document.getElementById('resourceList');
    this.resourceDataPanel = document.getElementById("resourceData");
    this.resourceChartPanel = document.getElementById("resourceCharts");
    this.gaugePanel = new swim.HtmlAppView(document.getElementById("resourceGauge"));
    this.gaugeCanvas = this.gaugePanel.append("canvas");
    this.chartPanel = new swim.HtmlAppView(document.getElementById(`resourceChart`));
    this.chartCanvas = this.chartPanel.append("canvas");

    this.chartColor = swim.Color.rgb(255,255,55,1);

    this.links['deviceList'] = swim.nodeRef(this.swimUrl, '/deviceManager').downlinkMap().laneUri('deviceList')
      .didUpdate((key, value) => {
        this.deviceList[key.stringValue()] = value.toObject();
      })
      .didRemove((key) => {
        delete this.deviceList[key.stringValue()];
      })
      .didSync(() => {
        this.renderDeviceList();
      });

    this.start();
  }

  start() {


      
    for (let linkKey in this.links) {
      this.links[linkKey].open();
    }

  }

  renderDeviceList() {

    if (this.deviceDropdown.children.length > 1) {
      return; // list already rendered
    }

    this.deviceDropdown.onchange = (evt) => {
      this.selectDevice(evt.target.value);
    }

    for (const deviceId in this.deviceList) {
      const device = this.deviceList[deviceId];
      const optionTag = document.createElement("option");
      optionTag.value = device.id;
      optionTag.innerText = device.name;

      this.deviceDropdown.appendChild(optionTag);

    }
  }

  renderResourceList() {

    this.resourceListPanel.innerHTML = "";


    for (const resourceId in this.resourceList) {
      const resource = this.resourceList[resourceId];
      const resourceDiv = document.createElement("div");
      resourceDiv.className = "resourceListItem";
      resourceDiv.innerText = resource.path;

      resourceDiv.onclick = () => {
        this.selectResource(resourceId);
      }

      this.resourceListPanel.appendChild(resourceDiv);

    }
  }  

  removeCharts() {
    if(this.resourceGauge) {
      this.resourceDial.remove();
      this.resourceGauge.remove();
      // this.gaugePanel.remove(this.resourceGauge);
      this.resourceDial = null;
      this.resourceGauge = null;
  
    }

    if(this.resourceChart) {
      this.resourcePlot.remove();
      this.resourceChart.remove();
      // this.chartPanel.remove(this.resourceChart);
      this.resourcePlot = null
      this.resourceChart = null;
  
    }
  }

  renderCharts() {

    // Create a new gauge view
    this.resourceGauge = new swim.GaugeView()
      .innerRadius(swim.Length.pct(20))
      .outerRadius(swim.Length.pct(50))
      .dialColor(swim.Color.rgb(100, 100, 100, 0.2))
      .font("14px sans-serif")
      .textColor("#ffffff")
      .cornerRadius(4)
    // and append it to the canvas.
    this.gaugeCanvas.append(this.resourceGauge);

    this.resourceDial = new swim.DialView()
      .total(1000)
      .value(0) // initialize to zero so the dial will tween in
      .meterColor(this.chartColor);
      
    this.resourceGauge.append(this.resourceDial);

    const clr = "#fff";
    this.resourceChart = new swim.ChartView()
      .bottomAxis("time")
      .leftAxis("linear")
      .bottomGesture(false)
      .leftDomainPadding([0, 0])
      .topGutter(0)
      .bottomGutter(20)
      .leftGutter(25)
      .rightGutter(0)
      .font("12px \"Open Sans\"")
      .domainColor(clr)
      .tickMarkColor(clr)
      .textColor(clr);

    this.resourcePlot = new swim.LineGraphView()
      .strokeWidth(2)
      .stroke(this.chartColor);


    this.resourceChart.addPlot(this.resourcePlot);

    this.chartCanvas.append(this.resourceChart);        

  }

  selectDevice(deviceId) {
    this.removeCharts()
    this.selectedDeviceId = deviceId;

    for (let linkKey in this.resourceLinks) {
      this.resourceLinks[linkKey].close();
    }    
    for (let linkKey in this.deviceLinks) {
      this.deviceLinks[linkKey].close();
    }    
    this.resourceListPanel.innerHTML = "";
    this.resourceDataPanel.innerHTML = "";
    this.resourceList = {};
    this.resourceInfo = "";

    this.deviceLinks['details'] = swim.nodeRef(this.swimUrl, `/device/${deviceId}`).downlinkValue().laneUri('info')
      .didSet((details) => {
        details = details.toObject();
        const detailPanel = document.getElementById("deviceDetailPanel");
        detailPanel.innerHTML = "";

        for (let detailId in details) {
          const nameDiv = document.createElement("div");
          const valueDiv = document.createElement("div");
          nameDiv.innerHTML = detailId;
          valueDiv.innerHTML = details[detailId];
          detailPanel.appendChild(nameDiv);
          detailPanel.appendChild(valueDiv);
        }

      })

    this.deviceLinks['resources'] = swim.nodeRef(this.swimUrl, `/device/${deviceId}`).downlinkMap().laneUri('resourceList')
      .didUpdate((resourceKey, resourceValue) => {
        this.resourceList[resourceKey.stringValue()] = resourceValue.toObject();
      })
      .didSync(() => {
        this.renderResourceList();
      })


    for (let linkKey in this.resourceLinks) {
      this.resourceLinks[linkKey].opem();
    }    
    for (let linkKey in this.deviceLinks) {
      this.deviceLinks[linkKey].open();
    }    
  
  }

  selectResource(resourceId) {
    this.removeCharts()
    const resourceInfo = this.resourceList[resourceId];
    this.resourceDataPanel.innerHTML = `ID: ${resourceInfo.id} <br>Data: ${resourceInfo.data}`;
    for (let linkKey in this.resourceLinks) {
      this.resourceLinks[linkKey].close();
    }
    resourceId = resourceId.split('/').join('');
    this.resourceLinks['latest'] = swim.nodeRef(this.swimUrl, `/resource/${this.selectedDeviceId}/${resourceId}`).downlinkValue().laneUri('value')
      .didSet((resourceValue) => {
        if(this.resourceDial) {
          this.resourceDial.value(resourceValue.numberValue(), this.tween);
        }
        if(this.resourceGauge) {
          this.resourceGauge.title(new swim.TextRunView(resourceValue.stringValue()).font("20px sans-serif"));
        }
        
      })

      this.resourceLinks['info'] = swim.nodeRef(this.swimUrl, `/resource/${this.selectedDeviceId}/${resourceId}`).downlinkValue().laneUri('info')
      .didSet((resourceValue) => {
        this.resourceInfo = resourceValue;
        
      })      
    
    this.resourceLinks['history'] = swim.nodeRef(this.swimUrl, `/resource/${this.selectedDeviceId}/${resourceId}`).downlinkMap().laneUri('history')
      .didUpdate((timestamp, resourceValue) => {
        if(!this.resourceChart || this.resourceChart === null) {
          this.renderCharts();
        }
        if(this.resourcePlot) {
          this.resourcePlot.insertDatum({ x: timestamp.numberValue(), y: resourceValue.numberValue(), opacity: 1 });
        }
        
      })
      .didRemove((timestamp) => {
        if(this.resourcePlot) {
          this.resourcePlot.removeDatum(timestamp.numberValue());
        }
        
      })

    for (let linkKey in this.resourceLinks) {
      this.resourceLinks[linkKey].open();
    }

  }

  blinkLed() {
    if(this.selectedDeviceId) {
      var xhttp = new XMLHttpRequest();
      let aid = this.resourceList["/3201/0/5853"].asyncId
      let ep = this.resourceList["/3201/0/5853"].endpoint
      let msg = JSON.stringify({"method": "POST", "uri": "/3201/0/5850"});
      let str = `https://api.us-east-1.mbedcloud.com/v2/device-requests/${ep}?async-id=${aid}`

      xhttp.open('POST',str,true)
      xhttp.setRequestHeader("Content-type", "application/json");
      xhttp.setRequestHeader("Authorization", "Bearer ak_1MDE3MjI5MWVlZWVhN2ExZTNkYzEyYWU3MDAwMDAwMDA01722982f11bceef6448061800000000hHrp7q2Ow4TeYe9x5SkkOCJ28GBIRThK");
      xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
          if(this.status == 202) {
            console.info("Command sent");
          } else {
            console.info("could not send command", this)
          }
        } 
      };      
      xhttp.send(msg);
    } else {
      alert("Select a device");
    }
  }

  changePattern() {
    if(this.selectedDeviceId) {
      const newPattern = prompt("Enter new pattern");

      var xhttp = new XMLHttpRequest();
      let aid = this.resourceList["/3201/0/5853"].asyncId
      let ep = this.resourceList["/3201/0/5853"].endpoint
      let msg = `{"method": "PUT", "uri": "/3201/0/5853", "accept": "text/plain", "content-type": "text/plain", "payload-b64": "${btoa(newPattern)}"}`;
      let str = `https://api.us-east-1.mbedcloud.com/v2/device-requests/${ep}?async-id=${aid}`

      xhttp.open('POST',str,true)
      xhttp.setRequestHeader("Content-type", "application/json");
      xhttp.setRequestHeader("Authorization", "Bearer ak_1MDE3MjI5MWVlZWVhN2ExZTNkYzEyYWU3MDAwMDAwMDA01722982f11bceef6448061800000000hHrp7q2Ow4TeYe9x5SkkOCJ28GBIRThK");
      xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
          if(this.status == 202) {
            console.info("Command sent");
          } else {
            console.info("could not send command", this)
          }
        } 
      };      
      xhttp.send(msg);
    } else {
      alert("Select a device");
    }
  }  

}
