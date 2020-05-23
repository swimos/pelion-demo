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

public class ResourceState extends AbstractAgent {

  private static final int HISTORY_SIZE = 1000;
  private static final int SHORT_HISTORY_SIZE = 100;
  private boolean isRegistered = false;

  @SwimLane("info")
  ValueLane<Value> info = this.<Value>valueLane();

  @SwimLane("latest")
  ValueLane<Float> latest = this.<Float>valueLane();

  @SwimLane("value")
  ValueLane<String> resourceValue = this.<String>valueLane();

  @SwimLane("history")
  MapLane<Long, Float> history = this.<Long, Float>mapLane()
    .didUpdate((key, newValue, oldValue) -> {
      if (this.history.size() > HISTORY_SIZE) {
        this.history.remove(this.history.getIndex(0).getKey());
      }
    });

  @SwimLane("shortHistory")
  MapLane<Long, Float> shortHistory = this.<Long, Float>mapLane()
    .didUpdate((key, newValue, oldValue) -> {
      if (this.shortHistory.size() > SHORT_HISTORY_SIZE) {
        this.shortHistory.remove(this.shortHistory.getIndex(0).getKey());
      }
    });

  @SwimLane("setResourceValue")
  CommandLane<Record> setResourceValueCommand = this.<Record>commandLane()
    .onCommand((newData) -> {
      // System.out.println("[ResourceState] setResourceValue");
      // System.out.println(newData);
      if(!isRegistered) {
        this.info.set(newData);
        String deviceNode = String.format("/device/%1$s", newData.get("endpoint").stringValue());
        // System.out.println(deviceNode);
        command(deviceNode, "addResource", newData);
        this.isRegistered = true;
      }
      String strVal = newData.get("data").stringValue();
      resourceValue.set(strVal);

      if(isNumeric(strVal)) {
        final long now = System.currentTimeMillis();

        Float newValue = newData.get("data").floatValue();
        latest.set(newValue);
        history.put(now, newValue);
        shortHistory.put(now, newValue);
      } 

    });    

  @Override
  public void didStart() {
    
  }  

  public static boolean isNumeric(String strNum) {
      if (strNum == null) {
          return false;
      }
      try {
          Float d = Float.parseFloat(strNum);
      } catch (NumberFormatException nfe) {
          return false;
      }
      return true;
  }  
  
}