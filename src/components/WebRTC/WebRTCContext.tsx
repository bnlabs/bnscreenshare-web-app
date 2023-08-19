import { HubConnection } from "@microsoft/signalr";
import { createContext, ReactNode, useState } from "react";

interface WebRTCContextValues {
    getPeerConnection: () => Promise<RTCPeerConnection | null>;
    getLocalStream: () => Promise<MediaStream | null>;
    getRemoteStream: () => Promise<MediaStream | null>;
    createOffer: (uid:string, connection:HubConnection | null) => Promise<void>;
    createAnswer: (uid:string, offer: RTCSessionDescriptionInit, connection:HubConnection | null) => Promise<void>;
    addAnswer: (answer: RTCSessionDescriptionInit) => Promise<void>;
    toggleStream: () => Promise<void>;
    toggleAudio: () => Promise<void>;
  }

const WebRTCContext = createContext<WebRTCContextValues | null>(null);

interface WebRTCProviderProps {
  children: ReactNode;
}

const servers = {
    iceServers: [
        {
            urls: ["stun:stun4.l.google.com:19302", "stun:stun3.l.google.com:19302"]
        }
    ]
}
const streamSetting = {
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

let localStream : MediaStream;
let remoteStream : MediaStream;
let peerConnection : RTCPeerConnection;

export const WebRTCProvider: React.FC<WebRTCProviderProps> = ({ children }) => {
    // const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
    // const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    // const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

    const getPeerConnection = async () => {
        return peerConnection;
    };
    
    const createPeerConnection = async (uid:string, connection:HubConnection | null) => {
        peerConnection = new RTCPeerConnection(servers);
        remoteStream = new MediaStream();

        if(!localStream){
            localStream = await navigator.mediaDevices.getDisplayMedia(streamSetting);
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

    const createPeerConnectionAnswer = async (uid:string, connection:HubConnection | null) => {
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
    const createOffer = async (uid:string, connection:HubConnection | null) => {
        console.log("CREATING OFFER");
        console.log(uid);
        await createPeerConnection(uid, connection);
        if(peerConnection)
        {
            let offer = await peerConnection.createOffer();
            console.log(offer);
            await peerConnection.setLocalDescription(offer);
            const text = JSON.stringify({'type': 'offer', 'offer': offer});
            connection?.invoke("SendOffer", text, uid);
        }
    }
    const createAnswer = async (uid:string, offer: RTCSessionDescriptionInit, connection:HubConnection | null) => {
        console.log(uid);
        console.log(offer);

        await createPeerConnectionAnswer(uid, connection);
        await peerConnection.setRemoteDescription(offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        connection?.invoke("SendOffer", JSON.stringify({'type': 'answer', 'answer': answer}), uid);

    }

    const addAnswer = async (answer: RTCSessionDescriptionInit) => {
        if(peerConnection && !peerConnection.currentRemoteDescription){
            peerConnection.setRemoteDescription(answer)
        }
    }

    let toggleStream = async() => {
        console.log("stream button");
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

    const toggleAudio = async() => {
        let audioTrack;
        if(localStream)
        {
            audioTrack = localStream.getTracks().find(track => track.kind === 'audio');
        }
        if(audioTrack){
            console.log(audioTrack);
            audioTrack.enabled = !audioTrack.enabled;
        }
    }

    const getLocalStream = async () => {
        if(!localStream){
            localStream = await navigator.mediaDevices.getDisplayMedia(streamSetting);
        }
        return localStream;
    }

    const getRemoteStream = async () => {
        if(!remoteStream){
            remoteStream = new MediaStream();
        }
        return remoteStream;
    }
  return (
    <WebRTCContext.Provider value={{
        getPeerConnection,
        getLocalStream,
        getRemoteStream,
        createOffer,
        createAnswer,
        addAnswer,
        toggleStream,
        toggleAudio }}>
      {children}
    </WebRTCContext.Provider>
  );
};

export default WebRTCContext;
