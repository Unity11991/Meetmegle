import { useState } from 'react';
import Landing from './components/Landing';
import VideoRoom from './components/VideoRoom';
import './App.css';

function App() {
    const [inRoom, setInRoom] = useState(false);

    const handleStart = () => {
        setInRoom(true);
    };

    const handleStop = () => {
        setInRoom(false);
    };

    const handleNext = () => {
        // Logic to reconnect will be inside VideoRoom or a hook, 
        // but here we might just remount or signal
        console.log("Next partner requested");
    };

    return (
        <div className="app">
            {inRoom ? (
                <VideoRoom onStop={handleStop} onNext={handleNext} />
            ) : (
                <Landing onStart={handleStart} />
            )}
        </div>
    );
}

export default App;
