package swim.peliondemo.agents;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.IOException;

import swim.api.SwimLane;
import swim.api.agent.AbstractAgent;
import swim.api.lane.CommandLane;
import swim.api.lane.MapLane;
import swim.api.lane.ValueLane;
import swim.json.Json;
import swim.structure.Value;

public class DeviceManagerService extends AbstractAgent {

    @SwimLane("deviceList")
    MapLane<String, Value> deviceList = this.<String, Value>mapLane();
  
    @SwimLane("addDevice")
    CommandLane<Value> addDeviceCommand = this.<Value>commandLane().onCommand(deviceData -> {
      // System.out.println("[DeviceManagerService] add device");
      // System.out.println(deviceData);

      String deviceId = deviceData.get("id").stringValue("none");
      if (deviceId != "none") {
        deviceList.put(deviceId, deviceData);
      }  
    });


    @Override
    public void didStart() {
    }
  
}