import { useRef } from 'react';
import styled from 'styled-components';

const Video = ({user} : {user:string}) => {
    let id;
    if(user === "1")
    {
        id="user-1";
    }
    else{
        id="user-2";
    }

    const videoRef = useRef<HTMLVideoElement | null>(null);

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
        <StyledVideo ref={videoRef} className="video-player" id={id} autoPlay playsInline onClick={handleFullScreen}></StyledVideo>
    </>)
}

const StyledVideo = styled.video`
    margin: 10px;
    display: grid;
    grid_template-columns: 1fr 1fr;
    gap: 2em;
    background-color: gray;
    height: 80vh;
    overflow: hidden;
    border-style: solid;
    border-color: gray;
`

export default Video;
