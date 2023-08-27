import { useContext, useEffect, useState } from "react";
import Video from "./Video";
import SignalRContext from "./SignalR/SignalRContext";
import { TextInput, Button, Group, Box } from '@mantine/core';
import WebRTCContext from "./WebRTC/WebRTCContext";
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import TvOutlinedIcon from '@mui/icons-material/TvOutlined';
import VolumeUpOutlinedIcon from '@mui/icons-material/VolumeUpOutlined';
import { useForm } from '@mantine/form';

const Interface = () => {
    const [lobbyId, setLobbyId] = useState("");
    const [isHost, setIsHost] = useState(false);

    const connection = useContext(SignalRContext);
    const webrtc = useContext(WebRTCContext);
    const form = useForm({
        initialValues: {
            lobbyId: '',
          },
          validate: {
            lobbyId: (value) => (/^.{5}$/.test(value) ? null : 'Invalid Id'),
          },
      });

    const handleJoinedGroup = async (lobbyId:string) => {
        console.log("LobbyId: ", lobbyId);
        setLobbyId(lobbyId);
    }
    const handleMemberJoined = async (uid: string) =>{
        console.log("A new user joined: ", uid);
        webrtc?.createOffer(uid, connection);
    }
    const handleJoinLobby = async ({ lobbyId } : { lobbyId:string }) => {
        console.log("lobbyId");
        connection?.invoke("JoinLobby", lobbyId);
        setIsHost(false);
    }
    const handleReceiveOffer = async (offer:string, uid:string) => {
        const message = JSON.parse(offer);
        if(message.type === "offer"){
            webrtc?.createAnswer(uid, message.offer, connection);
        }
        if(message.type === "answer"){
            webrtc?.addAnswer(message.answer);
        }
        if(message.type === "candidate"){
            let pc = await webrtc?.getPeerConnection();
            if(pc){
                pc.addIceCandidate(message.candidate);
            }
        }
    }
    const handleUserLeft = async (value:string) =>{
        console.log(value);
    }
    const createLobby = async () => {
        connection?.invoke("CreateLobby");
        setIsHost(true);
    }
    const leaveLobby = async () =>{
        connection?.invoke("LeaveLobby", lobbyId);
        setLobbyId("");
    }
    const handleCopy = async () => {
        try {
          await navigator.clipboard.writeText(lobbyId);
        } catch (err) {
          console.error('Failed to copy text: ', err);
        }
      };

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
                    (<div className="LobbyUI">
                        <div className="LobbyControl flex my-2">
                            <p className="mx-3 mt-1">Lobby ID: {lobbyId}</p>
                            <Button variant="outline" color="gray" onClick={handleCopy}>
                                Copy Lobby ID
                            </Button>
                            {isHost ? 
                                <>
                                    <Button variant="outline" color="gray" onClick={webrtc?.toggleStream}><TvOutlinedIcon/></Button>
                                    <Button variant="outline" color="gray" onClick={webrtc?.toggleAudio}><VolumeUpOutlinedIcon/></Button>
                                </>
                                :
                                    ""
                            }
                            <Button variant="outline" color="gray" onClick={leaveLobby}><LogoutOutlinedIcon/></Button>
                        </div>
                        <Video user={"1"}/>
                    </div>)
                    : 
                    (<div className="bg-transparent">
                        
                        <Box maw={300} mx="auto">
                        <form onSubmit={form.onSubmit((input) => handleJoinLobby(input))}>
                            <div className="text-lg font-semibold text-gray-500 p-1">Lobby Id</div>
                            <TextInput
                            placeholder="23a4e"
                            radius="xl"
                            size="xl"
                            {...form.getInputProps('lobbyId')}
                            />

                            <Group position="right" mt="md">
                            <div className="px-8">
                                <Button variant="outline" color="gray" onClick={createLobby}>Create Lobby</Button>
                                <Button variant="outline" color="gray" type="submit">Join Lobby</Button>
                            </div>
                            </Group>
                        </form>
                        </Box>
                    </div>)
                }
            </div>
        </>
    );
};

export default Interface;