import { useState, useEffect } from "react";
import { IClientWithPromise } from "agoran-awe/types/promisify";
import RTC from "../utils/RTC";

const baseClient = RTC.createClient({
  mode: "live",
  codec: "vp8",
});

interface IMediaDevice {
  label: string;
  deviceId: string;
}

const useCamera = (client = baseClient): IMediaDevice[] => {
  const [cameraList, setCameraList] = useState<IMediaDevice[]>([]);

  useEffect(() => {
    let mounted = true;
    const onChange = () => {
      if (!client) {
        return;
      }
      client
        .getCameras()
        .then((cameras: IMediaDevice[]) => {
          if (mounted) {
            setCameraList(cameras);
          }
        })
        .catch(() => {});
    };
    client && client.on("camera-changed", onChange);
    onChange();
    return () => {
      mounted = false;
      client &&
        (client as IClientWithPromise & {
          gatewayClient: any;
        }).gatewayClient.removeEventListener("cameraChanged", onChange);
    };
  }, [client]);

  return cameraList;
};

export default useCamera;
