import React, { useRef, useState, useEffect } from 'react';

const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPainting, setIsPainting] = useState(false);
  const [lineWidth, setLineWidth] = useState(5);
  const [strokeStyle, setStrokeStyle] = useState('#000000');

  useEffect(() => {
    if (canvasRef.current) {
        const canvas = canvasRef.current;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
  }, []);

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
        setTimeout(() => {
          if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }, 3000); // 3000 milliseconds = 3 seconds
      }
  };

  const paint = (e: React.MouseEvent) => {
    if (isPainting && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        const newCoordinates = getCoordinates(e.nativeEvent);
        if (ctx && newCoordinates) {
          ctx.lineWidth = lineWidth;
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
    console.log("x offset", canvas.offsetLeft)
    console.log("y offset", canvas.offsetTop)
    console.log("x coordinate", event.pageX)
    console.log("y coordinate", event.pageY)
    return {
      x: (event.pageX - canvas.offsetLeft),
      y: (event.pageY - canvas.offsetTop),
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

  return (
    <div className="bg-slate-500 text-black flex h-full">

      <div className="flex flex-col p-5 w-72" id="toolbar" onChange={handleToolbar}>
        <button className="p-2 border-white border hover:bg-slate-800" id="clear" onClick={()=>ClearCanvas()}>Clear</button>
        <label className="text-xl">Stroke</label>
        <input className="w-full" type="color" id="stroke" defaultValue={strokeStyle} />
        <label className="text-xl">Line Width</label>
        <input className="" type="number" id="lineWidth" defaultValue={lineWidth} value={lineWidth} />
      </div>

      <canvas
        className='bg-slate-900 h-5/6 w-4/6 rounded-lg'
        ref={canvasRef}
        onMouseDown={startPainting}
        onMouseUp={endPainting}
        onMouseMove={paint}
      />

    </div>
  );
}

export default Canvas;
