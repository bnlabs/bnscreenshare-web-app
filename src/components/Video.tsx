import { useRef, useState } from 'react';
import styled from 'styled-components';
import { Button } from '@mantine/core';

const Video = ({user} : {user:string}) => {
    const [isMuted, setIsMuted] = useState(false);
    
    let id;
    if(user === "1")
    {
        id="user-1";
    }
    else{
        id="user-2";
    }

    const videoRef = useRef<HTMLVideoElement | null>(null);

    const toggleMute = () => {
        const video = videoRef.current;
        if(video)
        {
            video.muted = !video.muted;
            setIsMuted(video.muted);
        }
    };

    const handleFullScreen = () => {
        if (videoRef.current) {
            if (!document.fullscreenElement) {
                videoRef.current.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }
    }

    return (<>
        <Button variant="outline" color="gray" onClick={handleFullScreen}>Fullscreen</Button>
        <Button variant="outline" color="gray" onClick={toggleMute}>
            {isMuted ? 'Unmute' : 'Mute'}
        </Button>
        <StyledVideo ref={videoRef} className="video-player" id={id} autoPlay playsInline onClick={handleFullScreen}>
        </StyledVideo>
    </>)
}

const StyledVideo = styled.video`
    margin: 10px;
    display: grid;
    gap: 2em;
    background-color: rgb(40, 40, 40, .5);
    height: 70vh;
    overflow: hidden;
    border-style: solid;
    border-color: black;
`

export default Video;
