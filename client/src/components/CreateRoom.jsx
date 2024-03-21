import React, { useEffect, useState } from "react";
import { v1 as uuid } from "uuid";
import { useNavigate } from "react-router-dom";
import { Input, Form } from "antd";
import { Button } from "../components/ui/button";

const CreateRoom = () => {
  const navigate = useNavigate();
  const [room, setRoom] = useState("");

  const onFinish = (values) => {
    const { name, room } = values;
    const id = uuid();

    if (room) {
      navigate(`/room/${room}/${name}`);
    } else {
      navigate(`/room/${id}/${name}`);
    }
  };

  useEffect(() => {
    const systemInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      appName: navigator.appName,
      appVersion: navigator.appVersion,
      userAgent: navigator.userAgent,
    };
    console.log('System Information:', navigator);
  }, []);


  return (
    <div className="w-full h-screen flex justify-center items-center flex-col">
      <Form className="form border p-5 shadow-sm rounded-lg"  name="createRoomForm" onFinish={onFinish} layout="vertical">
      <Form.Item
        label="Name"
        name="name"
        style={{ width: "400px" }}
        rules={[{ required: true, message: "Please enter your name!" }]}
      >
        <Input />
      </Form.Item>

      <Form.Item 
        label="Room ID" 
        name="room" 
        style={{ width: "400px" }}>
        <Input 
            value={room}
            onChange={(e) => setRoom(e.target.value)}
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmltype="submit">
          {room ? "Join room" : "Create room"}
        </Button>
      </Form.Item>
    </Form>
    </div>
    
  );
};

export default CreateRoom;
