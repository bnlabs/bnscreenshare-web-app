import { HubConnection } from "@microsoft/signalr";
import { createContext, ReactNode, useState } from "react";

interface WebRTCContextValues {
    getPeerConnection: () => Promise<RTCPeerConnection | null>;
    getLocalStream: () => Promise<MediaStream | null>;
    getRemoteStream: () => Promise<MediaStream | null>;
    createOffer: (uid:string, connection:HubConnection) => Promise<void>;
    createAnswer: (uid:string, offer: RTCSessionDescriptionInit, connection:HubConnection) => Promise<void>;
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

export const WebRTCProvider: React.FC<WebRTCProviderProps> = ({ children }) => {
    const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

    const getPeerConnection = async () => {
        if (!peerConnection) {
            setPeerConnection(new RTCPeerConnection(servers));
        }
        return peerConnection;
    };

    const createPeerConnection = async (uid:string, connection:HubConnection) => {
        const PC = await getPeerConnection();
        const LS = await getLocalStream();
        const RS = await getRemoteStream();

        if(LS && PC){
            LS.getTracks().forEach((track: MediaStreamTrack) => {
                PC.addTrack(track, LS)
            })
        }
    
        if(RS && PC)
        {
            PC.ontrack = (event) => {
                event.streams[0].getTracks().forEach((track)=>
                {
                    RS.addTrack(track);
                })
            }
        }
    
        if(PC)
        {
            PC.onicecandidate = async (event) => {
                if(event.candidate)
                {
                    connection?.invoke("SendOffer", JSON.stringify({'type': 'candidate', 'candidate': event.candidate}), uid);
                }
            }
        }
    }

    const createPeerConnectionAnswer = async (uid:string, connection:HubConnection) => {
        const PC = await getPeerConnection();
        const RS = await getRemoteStream();
    
        if(PC && RS)
        {
            PC.ontrack = (event) => {
                event.streams[0].getTracks().forEach((track)=>
                {
                    RS.addTrack(track);
                })
            }
        }
    
        if(PC)
        {
            PC.onicecandidate = async (event) => {
                if(event.candidate)
                {
                    connection?.invoke("SendOffer", JSON.stringify({'type': 'candidate', 'candidate': event.candidate}), uid);
                }
            }
        }
    }
    const createOffer = async (uid:string, connection:HubConnection) => {
        console.log("CREATING OFFER");
        console.log(uid);
        const PC = await getPeerConnection();
        await createPeerConnection(uid, connection);
        if(PC)
        {
            let offer = await PC.createOffer();
            console.log(offer);
            await PC.setLocalDescription(offer);
            const text = JSON.stringify({'type': 'offer', 'offer': offer});
            connection?.invoke("SendOffer", text, uid);
        }
    }
    const createAnswer = async (uid:string, offer: RTCSessionDescriptionInit, connection:HubConnection) => {
        console.log(uid);
        console.log(offer);
        const PC = await getPeerConnection();

        await createPeerConnectionAnswer(uid, connection);
        if(PC)
        {
            await PC.setRemoteDescription(offer);
            const answer = await PC.createAnswer();
            await PC.setLocalDescription(answer);
            connection?.invoke("SendOffer", JSON.stringify({'type': 'answer', 'answer': answer}), uid);
        }
    }

    const addAnswer = async (answer: RTCSessionDescriptionInit) => {
        const PC = await getPeerConnection();
        if(PC && !PC.currentRemoteDescription){
            PC.setRemoteDescription(answer)
        }
    }

    const toggleStream = async() => {
        let videoTrack;
        try{
            if(localStream)
            videoTrack = localStream.getTracks().find(track => track.kind === 'video');
        }
        catch{
            setLocalStream(await navigator.mediaDevices.getDisplayMedia(streamSetting));
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
            const lc = await navigator.mediaDevices.getDisplayMedia(streamSetting);
            setLocalStream(lc);
        }
        return localStream;
    }

    const getRemoteStream = async () => {
        if(!remoteStream){
            const lc = new MediaStream();
            setRemoteStream(lc);
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
