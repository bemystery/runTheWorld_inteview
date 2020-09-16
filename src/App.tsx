import React, { useReducer, useState, memo } from "react";
import StreamPlayer from "agora-stream-player";
import { Button, Layout, Card, Form, Input, message, Collapse, InputNumber, Select, Radio } from "antd";
import { useCamera, useMic, useMedia } from "./hooks";
import RTC from "./utils/RTC";

const { Header, Content } = Layout;
const { Panel } = Collapse;
const { Option } = Select;

const initState = {
  appId: "",
  channel: "",
  token: undefined,
  uid: "",
  cameraId: "",
  microphoneId: "",
  mode: "rtc",
  codec: "h264"
};

const reducer = (
  state: typeof initState,
  action: { type: string;[propName: string]: any }
) => {
  switch (action.type) {
    default:
      return state;
    case "changeAppId":
      return {
        ...state,
        appId: action.value
      };
    case "changeChannel":
      return {
        ...state,
        channel: action.value
      };
    case "changeToken":
      return {
        ...state,
        token: action.value
      };
    case "changeUid":
      return {
        ...state,
        uid: action.value
      };
    case "changeCamera":
      return {
        ...state,
        cameraId: action.value
      };
    case "changeMic":
      return {
        ...state,
        microphoneId: action.value
      };
    case "changeMode":
      return {
        ...state,
        mode: action.value
      };
    case "changeCodec":
      return {
        ...state,
        codec: action.value
      };
  }
};

const App = memo(() => {
  const [form] = Form.useForm();
  const [formAdvance] = Form.useForm();
  const cameraList = useCamera();
  const microphoneList = useMic();
  const [client, setClient] = useState<any>(undefined)
  let [localStream, remoteStreamList] = useMedia(client);
  const [isJoined, setisJoined] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [state, dispatch] = useReducer(reducer, initState);

  const update = (actionType: string, value: any) => {
    console.log(value)
    return dispatch({
      type: actionType,
      value
    });
  };

  const join = async () => {
    form.validateFields()
      .then(async () => {
        const client = RTC.createClient({ mode: state.mode, codec: state.codec })
        setClient(client)
        setIsLoading(true);
        try {
          const uid = isNaN(Number(state.uid)) ? null : Number(state.uid);
          await client.init(state.appId);
          await client.join(state.token, state.channel, uid);
          const stream = RTC.createStream({
            streamID: uid || 12345,
            video: true,
            audio: true,
            screen: false
          });
          await stream.init();
          await client.publish(stream);
          setIsPublished(true);
          setisJoined(true);
          message.info(`Joined channel ${state.channel}`);
        } catch (err) {
          message.error(`Failed to join, ${err}`);
        } finally {
          setIsLoading(false);
        }
      })
      .catch(errorInfo => {
        errorInfo.errorFields[0] && message.error(errorInfo.errorFields[0].errors[0])
      });
  };

  const publish = async () => {
    setIsLoading(true);
    try {
      if (localStream) {
        await client.publish(localStream);
        setIsPublished(true);
      }
      message.info("Stream published");
    } catch (err) {
      message.error(`Failed to publish, ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const leave = async () => {
    setIsLoading(true);
    try {
      if (localStream) {
        localStream.close();
        client.unpublish(localStream);
      }
      await client.leave();
      setIsPublished(false);
      setisJoined(false);
      message.info("Left channel");
    } catch (err) {
      message.error(`Failed to leave, ${err}`);
    } finally {
      setIsLoading(false);
    }
  };


  const unpublish = () => {
    if (localStream) {
      client.unpublish(localStream);
      setIsPublished(false);
      message.info("Stream unpublished");
    }
  };

  const JoinLeaveBtn = () => {
    return (
      <Button
        onClick={isJoined ? leave : join}
        disabled={isLoading}
      >
        {isJoined ? "Leave" : "Join"}
      </Button>
    );
  };

  const PubUnpubBtn = () => {
    return (
      <Button
        onClick={isPublished ? unpublish : publish}
        disabled={!isJoined || isLoading}
      >
        {isPublished ? "Unpublish" : "Publish"}
      </Button>
    );
  };

  return (<Layout style={{ height: "100%" }}>
    <Header style={{ marginBottom: 10 }}>
      <div style={{ color: '#ffffff' }}>
        Basic Communication
      </div>
    </Header>
    <Content style={{ padding: '0 50px' }}>
      <div style={{ display: "flex", justifyContent: 'space-between' }}>
        <div>
          <Card style={{ width: 300 }}>
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                appId: state.appId,
                channel: state.channel,
                token: state.token
              }}
            >
              <Form.Item name="appId" label="App ID" rules={[
                {
                  required: true, message: 'Please input your App ID!'
                }
              ]}>
                <Input placeholder="App ID" onChange={(e) => { update("changeAppId", e.target.value) }} />
              </Form.Item>
              <Form.Item name='channel' label="Channel" rules={[
                {
                  required: true, message: 'Please input your Channel!'
                }]
              }>
                <Input placeholder="Channel" onChange={(e) => { update("changeChannel", e.target.value) }} />
              </Form.Item>
              <Form.Item name="token" label="Token" >
                <Input placeholder="token" onChange={(e) => { update("changeToken", e.target.value) }} />
              </Form.Item>
            </Form>
            <div style={{ margin: '10px 0px', display: 'flex', justifyContent: 'space-around' }}>
              <JoinLeaveBtn />
              <PubUnpubBtn />
            </div>
            <Collapse>
              <Panel header="Advanced Settings" key="1">
                <Form
                  form={formAdvance}
                  layout="vertical"
                  initialValues={{
                    uid: state.uid,
                    cameraId: state.cameraId,
                    microphoneId: state.microphoneId,
                    mode: state.mode,
                    codec: state.codec,
                  }}
                >
                  <Form.Item name="uid" label="UID">
                    <InputNumber step={1} onChange={(v) => { update("changeUid", v) }} style={{ width: 216 }} />
                  </Form.Item>
                  <Form.Item name="cameraId" label="Camera">
                    <Select onChange={(v) => { update("changeCamera", v) }}>
                      {cameraList.map(item => (
                        <Option key={item.deviceId} value={item.deviceId}>{item.label}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item name="microphoneId" label="Microphone">
                    <Select onChange={(v) => { update("changeMic", v) }}>
                      {microphoneList.map(item => (
                        <Option key={item.deviceId} value={item.deviceId}>{item.label}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item name="mode" label="Mode" >
                    <Radio.Group onChange={(e) => { update("changeMode", e.target.value) }}>
                      <Radio value='live'>live</Radio>
                      <Radio value='rtc'>rtc</Radio></Radio.Group>
                  </Form.Item>
                  <Form.Item name="codec" label="Codec">
                    <Radio.Group onChange={(e) => { update("changeCodec", e.target.value) }}>
                      <Radio value='h264'>h264</Radio>
                      <Radio value='vp8'>vp8</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Form>
              </Panel>
            </Collapse>
          </Card>
        </div>
        <div>
          {localStream && (
            <StreamPlayer stream={localStream} fit="contain" label="local" />
          )}
          {remoteStreamList.map((stream: any) => (
            <StreamPlayer
              key={stream.getId()}
              stream={stream}
              fit="contain"
              label={stream.getId()}
            />
          ))}
        </div>
      </div>
    </Content>
  </Layout >
  );
})

export default App