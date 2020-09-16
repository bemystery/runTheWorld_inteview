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

const useMic = (client = baseClient): IMediaDevice[] => {
  const [microphoneList, setMicrophoneList] = useState<IMediaDevice[]>([]);

  useEffect(() => {
    let mounted = true;

    const onChange = () => {
      if (!client) {
        return;
      }
      client
        .getRecordingDevices()
        .then((microphones: IMediaDevice[]) => {
          if (mounted) {
            setMicrophoneList(microphones);
          }
        })
        .catch(() => {});
    };

    client && client.on("recording-device-changed", onChange);
    onChange();

    return () => {
      mounted = false;
      client &&
        (client as IClientWithPromise & {
          gatewayClient: any;
        }).gatewayClient.removeEventListener(
          "recordingDeviceChanged",
          onChange
        );
    };
  }, [client]);

  return microphoneList;
};

export default useMic;
