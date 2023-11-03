import { useContext, useEffect, useState } from "react";
import Video from "./Video";
import SignalRContext from "./SignalR/SignalRContext";
import { TextInput, Button, Box } from '@mantine/core';
import WebRTCContext from "./WebRTC/WebRTCContext";
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import TvOutlinedIcon from '@mui/icons-material/TvOutlined';
import { useForm } from '@mantine/form';
import Chat from "./Chat/Chat";

const Interface = () => {
    const [lobbyId, setLobbyId] = useState("");
    const [isHost, setIsHost] = useState(false);
    const [userName, setUsername] = useState<string>("");

    const connection = useContext(SignalRContext);
    const webrtc = useContext(WebRTCContext);
    const form = useForm({
        initialValues: {
            lobbyId: '',
            username: ''
          },
          validate: {
            lobbyId: (value) => (/^.{5}$/.test(value) ? null : 'Invalid Id'),
          },
      });

    const handleJoinedGroup = (lobbyId:string) => {
        console.log("LobbyId: ", lobbyId);
        setLobbyId(lobbyId);
    }
    
    const handleMemberJoined = (uid: string) =>{
        console.log("A new user joined: ", uid);
        webrtc?.createOffer(uid, connection);
    }
    const handleJoinLobby = ({ lobbyId, username } : { lobbyId:string, username:string }) => {
        console.log("lobbyId");
        connection?.invoke("JoinLobby", lobbyId);
        setIsHost(false);
        setUsername(username);
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
            const pc = await webrtc?.getPeerConnection();
            if(pc){
                pc.addIceCandidate(message.candidate);
            }
        }
    }
    
    const createLobby = () => {
        connection?.invoke("CreateLobby");
        setIsHost(true);
        setUsername("host");
    }
    const leaveLobby = () =>{
        connection?.invoke("LeaveLobby", lobbyId);
        webrtc?.endStream();
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
          })
          .catch((e) => console.log("Connection failed: ", e));
        }, [])
    window.addEventListener('beforeunload', leaveLobby);
    
    return (
        <>
            <div className="home-page-panel text-white p-3">
                {lobbyId ? 
                    (<div className="LobbyUI">
                        <div className="LobbyControl flex my-2">
                            <p className="ml-3 mt-1 font-bold text-slate-500">Lobby ID:</p>
                            <p className="mt-1 ml-1 mr-3">{lobbyId}</p>
                            
                            <p className="ml-3 mt-1 font-bold text-slate-500">Username:</p>
                            <p className="mt-1 ml-1 mr-3">{userName}</p>
                            <Button variant="outline" color="gray" onClick={handleCopy}>
                                Copy Lobby ID
                            </Button>
                            {isHost ? 
                                <>
                                    <Button variant="outline" color="gray" onClick={() => webrtc?.toggleStream(lobbyId, connection)}><TvOutlinedIcon/></Button>
                                </>
                                :
                                    ""
                            }
                            <Button variant="outline" color="gray" onClick={leaveLobby}><LogoutOutlinedIcon/></Button>
                        </div>
                        <div className="flex flex-row items-start">
                            <Video user={"1"} defaultMuteValue={isHost ? true : false}/>
                            <Chat Username={userName} LobbyId={lobbyId}/>
                        </div>
                    </div>)
                    : 
                    (<div className="bg-slate-700 rounded-lg w-2/4 h-3/6 left-1/4 right-1/4 absolute flex items-center justify-between mt-20">
                        <div className="Info text-xl m-10">
                            <h1 className="font-bold text-5xl drop-shadow-2xl">
                                No Hassle <br/>Screen Sharing
                            </h1>
                            <br/>
                                <ul>
                                    <li className="flex flex-row"><img className="h-5 mr-2" src="https://bucket.bn-chat.net/bnft.svg"/>Up to 1080p 60fps</li>
                                    <li className="flex flex-row"><img className="h-5 mr-2" src="https://bucket.bn-chat.net/bnft.svg"/>Includes lobby chat system</li>
                                    <li className="flex flex-row"><img className="h-5 mr-2" src="https://bucket.bn-chat.net/bnft.svg"/>No login necessary</li>
                                    <li className="flex flex-row"><img className="h-5 mr-2" src="https://bucket.bn-chat.net/bnft.svg"/>Nothing in the way</li>
                                </ul>
                        </div>
                        <Box className=" bg-gray-800 rounded-lg w-1/3 h-4/6 relative drop-shadow-lg m-10 mt-0 mb-0">
                            <div className="Join-Lobby border-b-2 border-slate-700">
                                <form onSubmit={form.onSubmit((input) => handleJoinLobby(input))}>
                                    <div className="mx-3">
                                        <div className="text-md font-semibold text-gray-500 p-1">Lobby Id</div>
                                        <TextInput
                                            placeholder="23a4e"
                                            radius="md"
                                            size="md"
                                            {...form.getInputProps('lobbyId')}
                                        />
                                    </div>

                                    <div className="mx-3">
                                        <div className="text-md font-semibold text-gray-500 p-1">Username</div>
                                                                    <TextInput
                                                                    placeholder="Varvalian"
                                                                    radius="md"
                                                                    size="md"
                                                                    {...form.getInputProps('username')}
                                                                    />
                                    </div>

                                    {/* <Group position="right" mt="md"> */}
                                    <div className="px-8 m-3 justify-center items-center flex flex-row">
                                        {/* <Button variant="outline" color="gray" onClick={createLobby}>Create Lobby</Button> */}
                                        <Button variant="outline" color="gray" type="submit">Join Lobby</Button>
                                    </div>
                                    {/* </Group> */}
                                </form>
                            </div>

                            <div className="Host-Lobby h-1/3">
                                    <div className="m-3 mt-8 justify-center items-center flex flex-row">
                                        <Button variant="outline" color="gray" onClick={createLobby}>Host Lobby</Button>
                                    </div>
                            </div>
                        </Box>
                    </div>)
                }
            </div>
        </>
    );
};

export default Interface;