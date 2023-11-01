import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useContext, useEffect, useRef, useState } from "react";
import SignalRContext from "../SignalR/SignalRContext";
import EmojiPickerButton from "./EmojiPickerButton";

type Message = 
{
    username : string;
    content: string;
}

const Chat = ({Username, LobbyId} : {Username: string, LobbyId : string}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [username] = useState(Username);
    const [content, setContent] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const connection = useContext(SignalRContext);

    useEffect(() => {
        connection?.on("ReceiveMessage", handleReceiveMessage);
        connection?.on("MemberJoined", handleMemberJoined);
        }, [])

    const sendMessage = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        if (username.trim() && content.trim()) {
            setContent('');
            connection?.invoke("SendMessage", username, content, LobbyId);
        }
       // Scroll to bottom
       messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    };

    const handleReceiveMessage = (username: string, content: string) =>
    {
        if (username.trim() && content.trim()) {
            const newMessage = { username, content };
            setMessages((prevMessages: any) => [...prevMessages, newMessage]);
        }
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleMemberJoined = (uid: string) => {
        connection?.invoke("SendMessage", "Notification", `A new user joined: ${ uid }`, LobbyId);
    }
    
    return (<div className="flex-col relative ml-3 h-75vh w-1/5 bg-gray-900 rounded-md overflow-hidden">
        <div className="messages h-5/6 w-full flex-1 p-10 overflow-scroll break-words no-scrollbar text-slate-500">
            {messages.map((message: { username: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined; content: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined; }, index: Key | null | undefined) => (
                <div key={index} className="message mb-1">
                    <strong>{message.username}:</strong> {message.content}
                </div>
            ))}
            <div className="h-1/5" ref={messagesEndRef}></div>
        </div>

        <form onSubmit={sendMessage} className="InputArea border-2 border-gray-700 bg-gray-900 absolute bottom-0 w-full h-auto">
            <input className="bg-gray-950 ml-1 w-full" value={content} onChange={(e) => setContent(e.target.value)} placeholder="say something nice" />
            <div className="absolute inset-y-0 right-2 inline-flex items-center bg-slate-700">
                <EmojiPickerButton
                    onEmojiPick={(emoji) =>
                        setContent((content) => content.concat(emoji))
                    }
                />
            </div>
        </form> 
   
    </div>
    )
}

export default Chat;