import React, { useState } from "react";
import { v1 as uuid } from "uuid";
import { useNavigate } from "react-router-dom";
import { Input, Button, Form } from "antd";

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

  return (
    <Form className="form" name="createRoomForm" onFinish={onFinish} layout="vertical">
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
        <Button type="primary" htmlType="submit">
          {room ? "Join room" : "Create room"}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default CreateRoom;
