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
  // const peersRef = useRef([]);
  const { roomID, name } = useParams();
  const [isVerified, setIsVerified] = useState(false);
  const [pin, setPin] = useState("");
  const [toggle, setToggle] = useState(false);

  const { peersRef } = usePeerContext();


  useEffect(() => {
    socketRef.current = io.connect("http://localhost:4000");
    // socketRef.current = io.connect("https://screen-sharing-9zbo.onrender.com");
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
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
    console.log(socketRef.current);
    socketRef.current.emit("leave room",{ id:socketRef.current.id, roomID, name });
  }


  return (
    <div>
      <video playsInline autoPlay ref={userVideo} className="hidden" />
      { isVerified ? (
        <AdminScreen roomID={roomID} toggle={toggle}/>
      ) : (
        <div className="w-screen h-screen flex justify-center items-center">
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
        </div>
      )}
    </div>
  );
};

export default Room;
