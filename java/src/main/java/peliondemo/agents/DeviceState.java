package swim.peliondemo.agents;

import swim.api.SwimLane;
import swim.api.agent.AbstractAgent;
import swim.api.lane.CommandLane;
import swim.api.lane.MapLane;
import swim.api.lane.ValueLane;
import swim.concurrent.TimerRef;
import swim.structure.Record;
import swim.structure.Value;
import swim.uri.Uri;
import java.util.Timer;
import java.util.TimerTask;

public class DeviceState extends AbstractAgent {

  @SwimLane("info")
  ValueLane<Value> info = this.<Value>valueLane();

  @SwimLane("resourceList")
  MapLane<String, Value> resourceList = this.<String, Value>mapLane();

  @SwimLane("createDevice")
  CommandLane<Value> createDevicelantCommand = this.<Value>commandLane()
    .onCommand(deviceInfo -> {
      // System.out.println("[DeviceState] New Device");
      // System.out.println(deviceInfo);
      this.info.set(deviceInfo);
      command("/deviceManager", "addDevice", this.info.get());
    });

  @SwimLane("addResource")
  CommandLane<Value> addResourceCommand = this.<Value>commandLane()
    .onCommand(resourceData -> {
      // System.out.println("[DeviceState] addResourceCommand");
      // System.out.println(resourceData);
      this.resourceList.put(resourceData.get("path").stringValue(), resourceData);
    });

  @Override
  public void didStart() {
     
  }  
  
}