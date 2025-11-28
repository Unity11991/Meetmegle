import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './components/Landing';
import VideoRoom from './components/VideoRoom';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Profile from './components/Profile';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getMediaStream } from './utils/media';
import './App.css';

const Home = () => {
    const [inRoom, setInRoom] = useState(false);
    const [stream, setStream] = useState(null);
    const { user } = useAuth();

    const handleStart = async () => {
        try {
            const mediaStream = await getMediaStream();
            setStream(mediaStream);
            setInRoom(true);
        } catch (err) {
            console.error("Error accessing media:", err);
            alert(`Could not access camera/microphone: ${err.name}: ${err.message}`);
        }
    };

    const handleStop = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setInRoom(false);
    };

    const handleNext = () => {
        console.log("Next partner requested");
    };

    return (
        <div className="app">
            {inRoom && stream ? (
                <VideoRoom stream={stream} onStop={handleStop} onNext={handleNext} user={user} />
            ) : (
                <Landing onStart={handleStart} user={user} />
            )}
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
