import React, { useRef, useEffect, useState } from 'react'; // Import React hooks
import { io } from 'socket.io-client'; // Import socket.io-client for WebSocket connection
import { useSearchParams } from 'react-router-dom'; // Import hook to read URL query parameters

const socket = io('http://localhost:5001'); // Connect to WebSocket server at port 5001

const App = () => { // Define the main React functional component
  const canvasRef = useRef(null); // Create a ref to access the canvas DOM element
  const [isDrawing, setIsDrawing] = useState(false); // State to track if user is currently drawing
  const [color, setColor] = useState('black'); // State to track current drawing color
  const [searchParams] = useSearchParams(); // Hook to read query parameters from URL
  const canvasId = searchParams.get('canvasId') || 'canvas1'; // Get canvasId from URL or default to 'canvas1'
  const userId = searchParams.get('userId') || 'User-' + Math.floor(Math.random() * 1000); // Get userId from URL or generate a random one
  const [activeUsers, setActiveUsers] = useState([]); // State to store list of active users
  const [userDrawingMap, setUserDrawingMap] = useState({}); // State to store which users are currently drawing

  const drawLine = (x0, y0, x1, y1, strokeColor) => { // Function to draw a line on canvas
    const context = canvasRef.current.getContext('2d'); // Get 2D drawing context of canvas
    context.beginPath(); // Begin a new path
    context.moveTo(x0, y0); // Move to starting point
    context.lineTo(x1, y1); // Draw line to end point
    context.strokeStyle = strokeColor; // Set the color of the stroke
    context.lineWidth = 2; // Set the line width
    context.stroke(); // Actually draw the line
    context.closePath(); // Close the path
  };

  useEffect(() => { // Effect runs when component mounts or when canvasId/userId changes
    socket.emit('join-canvas', { canvasId, userId }); // Notify server that user joined a canvas

    socket.on('drawing', (data) => { // Listen for drawing events from server
      drawLine(data.x0, data.y0, data.x1, data.y1, data.color); // Draw received stroke
    });

    socket.on('users-update', (users) => { // Listen for updates on active users
      setActiveUsers(users); // Update the activeUsers state
    });

    socket.on('user-drawing', ({ userId, isDrawing }) => { // Listen for drawing status from server
      setUserDrawingMap(prev => ({ // Update drawing status of the user
        ...prev, // Keep previous entries
        [userId]: isDrawing // Set current user's drawing status
      }));
    });

    return () => { // Clean up event listeners on unmount
      socket.off('drawing'); // Remove drawing listener
      socket.off('users-update'); // Remove user update listener
      socket.off('user-drawing'); // Remove user drawing listener
    };
  }, [canvasId, userId]); // Rerun effect when canvasId or userId changes

  const handleMouseDown = (e) => { // Function runs when mouse button is pressed
    setIsDrawing(true); // Set drawing state to true
    const rect = canvasRef.current.getBoundingClientRect(); // Get canvas position and size
    canvasRef.current.lastX = e.clientX - rect.left; // Calculate X position relative to canvas
    canvasRef.current.lastY = e.clientY - rect.top; // Calculate Y position relative to canvas
    socket.emit('start-drawing', { userId, canvasId }); // Notify server that user started drawing
  };

  const handleMouseMove = (e) => { // Function runs when mouse moves
    if (!isDrawing) return; // Do nothing if not drawing
    const rect = canvasRef.current.getBoundingClientRect(); // Get canvas position and size
    const x = e.clientX - rect.left; // Calculate X coordinate
    const y = e.clientY - rect.top; // Calculate Y coordinate
    drawLine(canvasRef.current.lastX, canvasRef.current.lastY, x, y, color); // Draw line on canvas
    socket.emit('drawing', { // Emit drawing data to server
      canvasId, // Include canvas ID
      x0: canvasRef.current.lastX, // Start X
      y0: canvasRef.current.lastY, // Start Y
      x1: x, // End X
      y1: y, // End Y
      color, // Drawing color
      userId // User ID
    });
    canvasRef.current.lastX = x; // Update lastX for next draw
    canvasRef.current.lastY = y; // Update lastY for next draw
  };

  const handleMouseUp = () => { // Function runs when mouse button is released
    setIsDrawing(false); // Set drawing state to false
    socket.emit('stop-drawing', { userId, canvasId }); // Notify server that user stopped drawing
  };

  return ( // JSX to render the UI
    <div> {/* Container div */}
      <h2>Canvas ID: {canvasId} | Your ID: {userId}</h2> {/* Show current canvas and user ID */}

      <div style={{ marginBottom: '10px' }}> {/* Color picker section */}
        <label>Select Color: </label> {/* Label for color input */}
        <input type="color" value={color} onChange={e => setColor(e.target.value)} /> {/* Color input */}
      </div>

      <div style={{ marginBottom: '10px' }}> {/* Active user list section */}
        <strong>👥 Active Users:</strong> {/* Header text */}
        <ul> {/* List of users */}
          {activeUsers.map(u => ( // Loop through each user
            <li key={u}> {/* Each user is a list item */}
              {u} {/* Show user ID */}
              {userDrawingMap[u] ? ' ✍️ (drawing)' : ''} {/* Show drawing emoji if user is drawing */}
            </li>
          ))}
        </ul>
      </div>

      <canvas
        ref={canvasRef} // Reference to canvas element
        width={800} // Canvas width
        height={600} // Canvas height
        style={{ border: '2px solid black' }} // Canvas style
        onMouseDown={handleMouseDown} // Mouse down handler
        onMouseMove={handleMouseMove} // Mouse move handler
        onMouseUp={handleMouseUp} // Mouse up handler
      />
    </div>
  );
};

export default App; // Export component for use in other files
