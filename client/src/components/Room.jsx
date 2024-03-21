import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
// import Peer from "simple-peer";
import * as Peer from 'simple-peer'
import { useParams } from "react-router-dom";

import AdminScreen from "./AdminScreen";
import { Result } from "antd";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

import { usePeerContext } from "../PeerContextProvider"

const Room = (props) => {
  const [peers, setPeers] = useState([]);
  const socketRef = useRef();
  const userVideo = useRef();
  const { roomID, name } = useParams();
  const [isVerified, setIsVerified] = useState(false);
  const [pin, setPin] = useState("");
  const [toggle, setToggle] = useState(false);
  const [messages, setMessages] = useState([]); // State to hold messages

  const { peersRef } = usePeerContext();


  useEffect(() => {
    // socketRef.current = io.connect("http://localhost:4000");
    socketRef.current = io.connect("https://lab-screen-server.onrender.com");
    navigator.mediaDevices
      .getDisplayMedia({ video: true, audio: false })
      .then((stream) => {
        userVideo.current.srcObject = stream;
        socketRef.current.emit("join room", roomID, name);
        socketRef.current.on("all users", (users) => {
          const peers = [];
          users.forEach((user) => {
            const peer = createPeer(user.id, socketRef.current.id, stream);
            peersRef.current.push({
              peerID: user.id,
              peer,
              name: user.name,
            });
            peers.push(peer);
          });
          setPeers(peers);
        });




        socketRef.current.on("user joined", (payload) => {
          const peer = addPeer(payload.signal, payload.callerID, stream);
          peersRef.current.push({
            peerID: payload.callerID,
            peer,
            name: payload.callerName,
          });

          setPeers((users) => [...users, peer]);
        });

        socketRef.current.on("receiving returned signal", (payload) => {
          const item = peersRef.current.find((p) => p.peerID === payload.id);
          item.peer.signal(payload.signal);
        });
      });

      socketRef.current.on("user left", ({ id, name }) => {
        setToggle((toggle) => !toggle)
        const peerObj = peersRef.current.find(p => p.peerID === id);

        peersRef.current = peersRef.current.filter(p => p.peerID !== id);
        // peersRef.current = peers;
        // console.log("room left",peersRef.current);
        if (peerObj) {
           peerObj.peer.destroy();
        }

        setPeers(peers.map(p => peersRef.current));
      })

      window.addEventListener('beforeunload', function(event) {
        // Check if peerObj is defined and has a destroy method
        setToggle((toggle) => !toggle)
        const peerObj = peersRef.current.find(p => p.peerID === socketRef.current.id);
        if (peerObj) {
          peerObj.peer.destroy();
        }
        peersRef.current = peersRef.current.filter(p => p.peerID !== socketRef.current.id);
      })

      return () => {
        window.removeEventListener("beforeunload", function(event) {
          // Check if peerObj is defined and has a destroy method
  
          const peerObj = peersRef.current.find(p => p.peerID === socketRef.current.id);
          if (peerObj) {
            peerObj.peer.destroy();
          }
          peersRef.current = peersRef.current.filter(p => p.peerID !== socketRef.current.id);
        });
      };
      
  }, []);

  function formatTime(date) {
    const options = { hour: 'numeric', minute: '2-digit', hour12: true };
    return new Intl.DateTimeFormat('en-US', options).format(date);
  }

  useEffect(() => {
    // Listen for incoming messages
    socketRef.current.on("message", (data) => {
      // Update messages state with the new message
      setMessages(prevMessages => [
        ...prevMessages,
        {
          message: data.message,
          time: formatTime(new Date()) // Assuming 'formatTime' function formats the time as "2:00 pm"
        }
      ]);
    });

    return () => {
      // Clean up the socket event listener when the component unmounts
      socketRef.current.off("message");
    };
  }, []);


    


  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
      name
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("sending signal", {
        userToSignal,
        callerID,
        roomID,
        signal,
      });
    });

    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
      name
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("returning signal", { signal, callerID });
    });

    peer.signal(incomingSignal);

    return peer;
  }

  const handleVerification = () => {
    // console.log("import.meta.env",import.meta.env);
    if (pin === '1234') {
      console.log("verified");
      setIsVerified(true);
    } else {
      console.log(" not verified");
      setIsVerified(false);
    }
  };

  const leaveRoom = () => { 
    console.log(socketRef.current.id);
    socketRef.current.emit("leave room",{ id:socketRef.current.id, roomID, name });
  }

  const removeFromRoom = (user) => {
    socketRef.current.emit("leave room",{ id:user.peerID, roomID, name:user.name });
  }


  const sendMessage = (user, message) => {
    // Emit the message to the server
    socketRef.current.emit("send message", { user, message });
  };

  return (
    <div>
      <video playsInline autoPlay ref={userVideo} className="hidden" />
      { isVerified ? (
        <AdminScreen roomID={roomID} toggle={toggle} sendMessage={sendMessage} removeFromRoom={removeFromRoom}/>
      ) : (
        <div className="w-screen h-screen flex flex-col justify-center items-center">
          <Result
            status="warning"
            title="You are being monitored"
            subTitle="Be cautious about the information you share. Your screen activity is currently being monitored."
            extra={
              <Dialog>
                <div className="flex gap-10 justify-center" >
                <DialogTrigger>Are you an admin?</DialogTrigger>
                <Button onClick={leaveRoom} variant="destructive" className="gap-2" >Exit Room</Button>
                </div>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Admin Verification</DialogTitle>
                    <DialogDescription>
                      Please enter your PIN to verify yourself.
                    </DialogDescription>
                  </DialogHeader>
                  <div>
                    <Input
                      type="password"
                      placeholder="Enter PIN"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                    />
                    <Button className="mt-2" onClick={handleVerification}>
                      Verify
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            }
          />
          <div className="border w-1/2 border-gray-300 rounded-md h-40 overflow-y-auto p-3">
            {messages.map((message, index) => (
              <div key={index} className="mb-3">
                <div className="bg-gray-100 p-2 rounded-md shadow-sm flex justify-between">
                  <p className="text-sm">{message.message}</p>
                  <p className="text-xs text-gray-400">{message.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Room;
