import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useContext, useEffect, useRef, useState } from "react";
import SignalRContext from "../SignalR/SignalRContext";

const Chat = ({Username, LobbyId} : {Username: string, LobbyId : string}) => {
    const [messages, setMessages] = useState<any>([]);
    const [username] = useState(Username);
    const [content, setContent] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const connection = useContext(SignalRContext);

    useEffect(() => {
        connection?.on("ReceiveMessage", handleReceiveMessage);
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
    
    return (<div className="flex-col relative m-10 ml-3 h-5/6 w-1/5 bg-gray-900 rounded-md">
        <div className="messages h-96 w-96 flex-1 p-10 overflow-scroll break-words no-scrollbar">
                    {messages.map((message: { username: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined; content: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined; }, index: Key | null | undefined) => (
                        <div key={index} className="message mb-1">
                            <strong>{message.username}:</strong> {message.content}
                        </div>
                    ))}
        <div className="mt-7" ref={messagesEndRef}></div>
        </div>

        <form onSubmit={sendMessage} className="InputArea border-t-2">
        <input className="bg-gray-950 border-r-2" value={content} onChange={(e) => setContent(e.target.value)} placeholder="say something nice" />
        <button className="ml-1" type="submit" disabled={!content}>Send</button>
        </form> 
   
    </div>
    )
}

export default Chat;