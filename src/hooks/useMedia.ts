import { useState, useEffect } from "react";

const useMedia = (client: any, omit?: (id: number) => boolean): any[] => {
  const [local, setLocal] = useState<any>(undefined);
  const [remoteList, setRemoteList] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    const addRemote = (evt: any) => {
      if (!mounted) {
        return;
      }
      const { stream } = evt;
      setRemoteList((streamList) => [...streamList, stream]);
    };

    const removeRemote = (evt: any) => {
      const { stream } = evt;
      if (stream) {
        const id = stream.getId();
        const index = remoteList.findIndex((item) => item.getId() === id);
        if (index !== -1) {
          setRemoteList((streamList) => {
            streamList.splice(index, 1);
            return streamList;
          });
        }
      }
    };

    const doSub = (evt: any) => {
      const { stream } = evt;
      if (!mounted) {
        return;
      }
      if (omit) {
        if (omit(stream.getId())) {
          client.subscribe(stream);
        }
      } else {
        client.subscribe(stream);
      }
    };

    const addLocal = (evt: any) => {
      if (!mounted) {
        return;
      }
      const { stream } = evt;
      const stop = stream.stop;
      const close = stream.close;
      stream.close = ((func) => () => {
        func();
        setLocal(undefined);
      })(close);
      stream.stop = ((func) => () => {
        func();
        setLocal(undefined);
      })(stop);
      setLocal(stream);
    };

    if (client) {
      client.on("stream-published", addLocal);
      client.on("stream-added", doSub);
      client.on("stream-subscribed", addRemote);
      client.on("peer-leave", removeRemote);
      client.on("stream-removed", removeRemote);
    }

    return () => {
      mounted = false;
      if (client) {
        const { gatewayClient } = client;
        gatewayClient.removeEventListener("stream-published", addLocal);
        gatewayClient.removeEventListener("stream-added", doSub);
        gatewayClient.removeEventListener("stream-subscribed", addRemote);
        gatewayClient.removeEventListener("peer-leave", removeRemote);
        gatewayClient.removeEventListener("stream-removed", removeRemote);
      }
    };
  }, [client, omit]);

  return [local, remoteList, [local].concat(remoteList)];
};

export default useMedia;
