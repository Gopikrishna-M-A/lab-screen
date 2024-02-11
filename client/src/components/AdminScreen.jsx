import React, { useEffect, useRef, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./ui/resizable";

import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { usePeerContext } from "../PeerContextProvider"


const AdminScreen = ({ roomID, toggle }) => {
    const { peersRef } = usePeerContext();
    const [user, setUser] = useState(peersRef.current[0] || {});
    const ref = useRef();
    
  //   console.log("ref.current",ref.current);
    useEffect(() => {
    // This useEffect will be triggered whenever the toggle state changes
    // You can perform any actions here that need to be done when the toggle state changes
    // For example, you might want to refresh data or update the UI
    console.log("Toggle state changed:", toggle);
    // Add your logic here

  }, [peersRef.current]);

    useEffect(() => {
        if(user?.peer?._remoteStreams[0]){
          ref.current.srcObject = user.peer._remoteStreams[0];
        }
    }, [user]);

    const readablePeers = peersRef.current.filter((peer) => peer.peer.readable);

    useEffect(() => {}, [readablePeers]);
  return (
    <div className="h-screen p-20">
      <ResizablePanelGroup
        direction="horizontal"
        className="w-full h-full rounded-lg border"
      >
        <ResizablePanel defaultSize={25}>
          <div className="flex h-full items-center justify-center p-6">
              <ScrollArea className="h-full w-full">
                <div className="p-4">
                  <h4 className="mb-4 text-sm font-medium leading-none">
                    Room : {roomID} ({readablePeers.length})
                  </h4>
                  {peersRef.current.map((peer,index) => (
                    peer.peer.readable &&
                    <div key={peer.peerID} >
                       <div onClick={(e)=>{
                        setUser(peer)
                        console.log("peer",peer);
                        }}  className=" uppercase text-sm cursor-pointer p-y-2.5 px-5 rounded hover:font-bold transition-all">
                        {peer.name}
                      </div>
                      <Separator className="my-2" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={75}>
          <div className="flex flex-col h-full items-start gap-2 justify-center p-6">
            <div className="text-3xl font-bold uppercase">{user.name}</div>
             <video playsInline autoPlay ref={ref} className="w-full aspect-video border rounded bg-slate-300" ></video> 
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default AdminScreen;
