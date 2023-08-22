import { ChangeEvent, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Button } from '@mantine/core';

const Video = ({user} : {user:string}) => {
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState<number>(1);

    let id;
    if(user === "1")
    {
        id="user-1";
    }
    else{
        id="user-2";
    }

    const videoRef = useRef<HTMLVideoElement | null>(null);
    
    useEffect(() => {
        const video = videoRef.current;
    
        const handleVolumeChange = () => {
            if (video) {
                setVolume(video.volume);
            }
        };
    
        if (video) {
            video.addEventListener('volumechange', handleVolumeChange);
        }
    
        return () => {
            if (video) {
                video.removeEventListener('volumechange', handleVolumeChange);
            }
        };
    }, []);
    
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

    const changeVolume = (e: ChangeEvent<HTMLInputElement>) => {
        const video = videoRef.current;
        const newVolume = parseFloat(e.target.value);
        if (video) {
            video.volume = newVolume;
        }
        setVolume(newVolume);
    };
    
    return (<>
        <StyledVideo ref={videoRef} className="video-player" id={id} autoPlay playsInline onClick={handleFullScreen}>
        </StyledVideo>
        <div className='my-2'>
            <Button className='mx-2' variant="outline" color="gray" onClick={handleFullScreen}>Fullscreen</Button>
            <Button className='mx-2 items-center justify-center w-28' variant="outline" color="gray" onClick={toggleMute}>
                {isMuted ? 'Unmute' : 'Mute'}
            </Button>
            <input
                className='mx-2'
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={volume}
                onChange={changeVolume} 
            />
        </div>
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
