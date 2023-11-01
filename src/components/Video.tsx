import { ChangeEvent, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Button } from '@mantine/core';
import FullscreenOutlinedIcon from '@mui/icons-material/FullscreenOutlined';
import VolumeUpOutlinedIcon from '@mui/icons-material/VolumeUpOutlined';
import VolumeOffOutlinedIcon from '@mui/icons-material/VolumeOffOutlined';

const Video = ({user, defaultMuteValue} : {user:string, defaultMuteValue:boolean}) => {
    const [isMuted, setIsMuted] = useState(defaultMuteValue);
    const [volume, setVolume] = useState<number>(1);

    // Canvas states
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isPainting, setIsPainting] = useState(false);
    const [lineWidth, setLineWidth] = useState(5);
    const [strokeStyle, setStrokeStyle] = useState('#000000');

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
            video.muted = isMuted;
            video.addEventListener('volumechange', handleVolumeChange);
        }
    
        return () => {
            if (video) {
                video.removeEventListener('volumechange', handleVolumeChange);
            }
        };
    });

    
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
    

    const startPainting = (e: React.MouseEvent) => {
        const coordinates = getCoordinates(e.nativeEvent);
        if (coordinates) {
          setIsPainting(true);
        }
      };

    const endPainting = () => {
        if (isPainting) {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (ctx) {
                ctx.stroke();
                ctx.beginPath();
            }
            setIsPainting(false);
        
            // Set a timeout to clear the canvas after 3 seconds
            // setTimeout(() => {
            //     if (canvas && ctx) {
            //     ctx.clearRect(0, 0, canvas.width, canvas.height);
            //     }
            // }, 3000); // 3000 milliseconds = 3 seconds
            }
    };

    const paint = (e: React.MouseEvent) => {
        if (isPainting && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            const newCoordinates = getCoordinates(e.nativeEvent);
            if (ctx && newCoordinates) {
                // Adjust line width according to the scale factors
                const rect = canvasRef.current.getBoundingClientRect();
                const scaleX = canvasRef.current.width / rect.width;
                const scaleY = canvasRef.current.height / rect.height;

                ctx.lineWidth = lineWidth * Math.min(scaleX, scaleY);
                ctx.strokeStyle = strokeStyle;
                ctx.lineCap = 'round';
                ctx.lineTo(newCoordinates.x, newCoordinates.y);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(newCoordinates.x, newCoordinates.y);
            }
            }
    };

    const getCoordinates = (event: MouseEvent) => {
        if (!canvasRef.current) {
          return;
        }
      
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
      
        // Adjust coordinates with page scroll for absolute positioning
        const scaleX = canvas.width / rect.width;    // aspect ratio for width scale
        const scaleY = canvas.height / rect.height;  // aspect ratio for height scale
      
        // Compute the coordinates within the canvas taking scale into consideration
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;
      
        console.log("x,y offset", rect.left, rect.top);
        console.log("x,y", `${event.clientX},${event.clientY}`);
        console.log("Adjusted x,y", `${x},${y}`);
      
        return {
          x,
          y,
        };
      };


    const handleToolbar = (event:any) => {
        const { id, value } = event.target;
        switch (id) {
            case 'stroke':
            setStrokeStyle(value);
            break;
            case 'lineWidth':
            setLineWidth(value);
            break;
            default:
            break;
        }
    };

    const ClearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d')
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
    }

    return (<div className='relative'>
        <StyledVideo ref={videoRef} className="video-player" id={id} autoPlay playsInline onClick={handleFullScreen}>
        </StyledVideo>
        <canvas
                className='absolute h-73vh w-130vh top-2 left-2 bg-transparent rounded-lg border-solid border-gray-600 border-4'
                ref={canvasRef}
                onMouseDown={startPainting}
                onMouseUp={endPainting}
                onMouseMove={paint}
            />
        <div className='absolute buttons right-0'>
            <input
                className='mx-2'
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={volume}
                onChange={changeVolume} 
            />
            <Button className='items-center justify-center' variant="outline" color="gray" onClick={toggleMute}>
                {isMuted ? <VolumeOffOutlinedIcon/> : <VolumeUpOutlinedIcon/>}
            </Button>
            <Button variant="outline" color="gray" onClick={handleFullScreen}><FullscreenOutlinedIcon/></Button>
        </div>

        <div className="flex flex-row ml-3 p-5 bg-slate-500 rounded-lg w-96 gap-4 h-20" id="toolbar" onChange={handleToolbar}>
            <>
                <button className="p-2 border-white border hover:bg-slate-800 text-sm h-10" id="clear" onClick={()=>ClearCanvas()}>Clear</button>
            </>
            <div className='pt-2 flex flex-row gap-2'>
                <label className="text-sm">Stroke</label>
                <input className="w-12 h-5" type="color" id="stroke" defaultValue={strokeStyle}/>
            </div>
            <div className='pt-2 flex flex-row gap-2'>
                <label className="text-sm">LineWidth</label>
                <input className=" h-5 w-20 text-black" type="number" id="lineWidth" defaultValue={lineWidth} value={lineWidth} />
            </div>
        </div>
    </div>)
}

const StyledVideo = styled.video`
    margin: 10px;
    display: grid;
    gap: 2em;
    background-color: rgb(40, 40, 40, .5);
    height: 73vh;
    width: 130vh;
    overflow: hidden;
    border-style: solid;
    border-color: black;
    border-radius: 10px;
`

export default Video;
