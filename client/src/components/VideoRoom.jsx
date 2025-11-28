import React, { useState, useRef, useEffect } from 'react';
import { Send, SkipForward, StopCircle, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';

const VideoRoom = ({ stream, onStop, user }) => {
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [partnerInfo, setPartnerInfo] = useState(null);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const chatEndRef = useRef(null);

    const { status, nextPartner, stop, sendMessage, socket, toggleAudio, toggleVideo } = useWebRTC(localVideoRef, remoteVideoRef, stream);

    useEffect(() => {
        return () => {
            stop();
        }
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory]);

    useEffect(() => {
        if (!socket) return;

        const handleMessage = ({ sender, message }) => {
            setChatHistory(prev => [...prev, { sender: 'stranger', text: message }]);
        };

        const handlePartnerInfo = (info) => {
            setPartnerInfo(info);
        };

        socket.on('message', handleMessage);
        socket.on('partner-info', handlePartnerInfo);

        // Send our info when connected
        if (status === 'connected' && user) {
            socket.emit('send-info', { username: user.username, avatarUrl: user.avatarUrl });
        }

        return () => {
            socket.off('message', handleMessage);
            socket.off('partner-info', handlePartnerInfo);
        };
    }, [socket, status, user]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!message.trim() || status !== 'connected') return;

        setChatHistory(prev => [...prev, { sender: 'me', text: message }]);
        sendMessage(message);
        setMessage('');
    };

    const handleNext = () => {
        setChatHistory([]);
        setPartnerInfo(null);
        nextPartner();
    };

    const handleStopClick = () => {
        stop();
        onStop();
    };

    const handleToggleMute = () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        toggleAudio(newMuted);
    };

    const handleToggleVideo = () => {
        const newVideoOff = !isVideoOff;
        setIsVideoOff(newVideoOff);
        toggleVideo(newVideoOff);
    };

    return (
        <div className="room-container">
            <div className="video-area">
                <div className="remote-video-container">
                    <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
                    {status === 'searching' && <div className="status-overlay">Searching for partner...</div>}
                    {status === 'idle' && <div className="status-overlay">Disconnected</div>}
                    {status === 'connected' && partnerInfo && (
                        <div className="partner-info-overlay">
                            {partnerInfo.avatarUrl && <img src={`${import.meta.env.VITE_SERVER_URL}${partnerInfo.avatarUrl}`} alt="Avatar" className="partner-avatar" />}
                            <span>{partnerInfo.username}</span>
                        </div>
                    )}
                </div>
                <div className="local-video-container">
                    <video ref={localVideoRef} autoPlay playsInline muted className="local-video" />
                </div>
            </div>

            <div className="chat-area">
                <div className="chat-messages">
                    {chatHistory.map((msg, idx) => (
                        <div key={idx} className={`message ${msg.sender}`}>
                            <span className="sender-label">{msg.sender === 'me' ? 'You' : 'Stranger'}:</span>
                            <span className="text">{msg.text}</span>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
                <form className="chat-input" onSubmit={handleSend}>
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={status === 'connected' ? "Type a message..." : "Waiting for partner..."}
                        disabled={status !== 'connected'}
                    />
                    <button type="submit" disabled={status !== 'connected'}><Send size={20} /></button>
                </form>
                <div className="controls">
                    <button className="btn-control" onClick={handleToggleMute}>
                        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                    <button className="btn-control" onClick={handleToggleVideo}>
                        {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                    </button>
                    <button className="btn-control danger" onClick={handleStopClick}>
                        <StopCircle size={20} /> Stop
                    </button>
                    <button className="btn-control primary" onClick={handleNext}>
                        <SkipForward size={20} /> Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoRoom;
