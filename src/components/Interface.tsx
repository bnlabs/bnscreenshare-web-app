import { SetStateAction, useContext, useEffect, useState } from "react";
import Video from "./Video";
import SignalRContext from "./SignalR/SignalRContext";
import { Button } from '@mantine/core';

let localStream : MediaStream;
let remoteStream : MediaStream;
let peerConnection : RTCPeerConnection;
let streamSetting = {
    video: {
        width: { ideal: 1920, max: 1920 },
        height: { ideal: 1080, max: 1080 },
        frameRate: { ideal: 60, max: 60 }
    }, 
    audio: {
        autoGainControl: false,
        channelCount: 2,
        echoCancellation: false,
        noiseSuppression: false,
        sampleRate: 48000,
        sampleSize: 16
}};

const servers = {
    iceServers: [
        {
            urls: ["stun:stun4.l.google.com:19302", "stun:stun3.l.google.com:19302"]
        }
    ]
}

const Interface = () => {
    const [lobbyId, setLobbyId] = useState("");
    const [value, setValue] = useState("");

    const connection = useContext(SignalRContext);
    const handleChange = (event: { target: { value: SetStateAction<string>; }; }) => {
        setValue(event.target.value);
    }
    const handleJoinedGroup = async (lobbyId:string) => {
        console.log("LobbyId: ", lobbyId);
        setLobbyId(lobbyId);
    }
    const handleMemberJoined = async (uid: string) =>{
        console.log("A new user joined: ", uid);
        createOffer(uid);
    }
    const handleJoinLobby = async () => {
        connection?.invoke("JoinLobby", value);
    }
    const handleReceiveOffer = async (offer:string, uid:string) => {
        const message = JSON.parse(offer);
        if(message.type === "offer"){
            createAnswer(uid, message.offer);
        }
        if(message.type === "answer"){
            addAnswer(message.answer);
        }
        if(message.type === "candidate"){
            if(peerConnection){
                peerConnection.addIceCandidate(message.candidate);
            }
        }
    }
    const handleUserLeft = async (value:string) =>{
        console.log(value);
    }
    let createLobby = async () => {
        connection?.invoke("CreateLobby");
    }
    let leaveLobby = async () =>{
        connection?.invoke("LeaveLobby", lobbyId);
        setLobbyId("");
    }

    
    let createPeerConnection = async (uid:string) => {
        peerConnection = new RTCPeerConnection(servers);
        remoteStream = new MediaStream();
    
        if(!localStream){
            localStream = await navigator.mediaDevices.getDisplayMedia(streamSetting)
        }

        localStream.getTracks().forEach((track: MediaStreamTrack) => {
            peerConnection.addTrack(track, localStream)
        })
    
        peerConnection.ontrack = (event) => {
            event.streams[0].getTracks().forEach((track)=>
            {
                remoteStream.addTrack(track);
            })
        }
    
        peerConnection.onicecandidate = async (event) => {
            if(event.candidate)
            {
                connection?.invoke("SendOffer", JSON.stringify({'type': 'candidate', 'candidate': event.candidate}), uid);
            }
        }
    }
    let createPeerConnectionAnswer = async (uid:string) => {
        peerConnection = new RTCPeerConnection(servers);
        remoteStream = new MediaStream();
        let user2 = document.getElementById('user-1') as HTMLMediaElement;
    
        if(user2) {
            user2.srcObject = remoteStream;
        }
    
        peerConnection.ontrack = (event) => {
            event.streams[0].getTracks().forEach((track)=>
            {
                remoteStream.addTrack(track);
            })
        }
    
        peerConnection.onicecandidate = async (event) => {
            if(event.candidate)
            {
                connection?.invoke("SendOffer", JSON.stringify({'type': 'candidate', 'candidate': event.candidate}), uid);
            }
        }
    }
    let createOffer = async (uid:string) => {
        console.log("CREATING OFFER");
        console.log(uid);
        await createPeerConnection(uid);
        let offer = await peerConnection.createOffer();
        console.log(offer);
        await peerConnection.setLocalDescription(offer);
        const text = JSON.stringify({'type': 'offer', 'offer': offer});
        connection?.invoke("SendOffer", text, uid);
    }
    let createAnswer = async (uid:string, offer: RTCSessionDescriptionInit) => {
        console.log(uid);
        console.log(offer);
        await createPeerConnectionAnswer(uid);
        await peerConnection.setRemoteDescription(offer);
        let answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        connection?.invoke("SendOffer", JSON.stringify({'type': 'answer', 'answer': answer}), uid);
    }
    let addAnswer = async (answer: RTCSessionDescriptionInit) => {
        if(!peerConnection.currentRemoteDescription){
            peerConnection.setRemoteDescription(answer)
        }
    }
    let toggleStream = async() => {
        let videoTrack;
        try{
            videoTrack = localStream.getTracks().find(track => track.kind === 'video');
        }
        catch{
            localStream = await navigator.mediaDevices.getDisplayMedia(streamSetting);
            let user1 = document.getElementById('user-1') as HTMLMediaElement;
            if(user1) {
                user1.srcObject = localStream;
            }
        }

        if(videoTrack){
            console.log(videoTrack);
            videoTrack.enabled = !videoTrack.enabled;
        }
    }
    let toggleAudio = async() => {
        let audioTrack = localStream.getTracks().find(track => track.kind === 'audio');
        if(audioTrack){
            console.log(audioTrack);
            audioTrack.enabled = !audioTrack.enabled;
        }
    }
    
    useEffect(() => {
        connection?.start()
          .then(() => {
            console.log("Connected!");
            connection.on("JoinedGroup", handleJoinedGroup);
            connection.on("MemberJoined", handleMemberJoined);
            connection.on("ReceivingOffer", handleReceiveOffer);
            connection.on("CallerLeft", handleUserLeft);
          })
          .catch((e) => console.log("Connection failed: ", e));
        }, [])
    window.addEventListener('beforeunload', leaveLobby);
    
    return (
        <>
            <div className="ControlPanel text-white p-3">
                {lobbyId ? 
                    (<div>
                        <Video user={"1"}/>
                        <Button variant="outline" color="gray" onClick={leaveLobby}>Leave Lobby</Button>
                        <Button variant="outline" color="gray" onClick={toggleStream}>Toggle Stream</Button>
                        <Button variant="outline" color="gray" onClick={toggleAudio}>Toggle Audio</Button>
                        <p className="ControlPanel m-5">Lobby ID: {lobbyId}</p>
                    </div>)
                    : 
                    (<div className="bg-transparent">
                        <Button variant="outline" color="gray" onClick={createLobby}>Create Lobby</Button>
                        <Button variant="outline" color="gray" onClick={handleJoinLobby}>Join Lobby</Button>
                        <input type="text" placeholder="LobbyId" className="bg-white text-black m-1" value={value} onChange={handleChange}/>
                    </div>)
                }
            </div>
        </>
    );
};

export default Interface;