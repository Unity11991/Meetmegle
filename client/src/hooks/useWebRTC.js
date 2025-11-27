import { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';

import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
    ],
};

export const useWebRTC = (localVideoRef, remoteVideoRef) => {
    const [socket, setSocket] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, searching, connected
    const [partnerId, setPartnerId] = useState(null);

    const peerConnection = useRef(null);
    const localStream = useRef(null);

    // Initialize Socket
    useEffect(() => {
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    // Handle WebRTC and Socket Events
    useEffect(() => {
        if (!socket) return;

        const handlePartnerFound = async ({ partnerId, initiator }) => {
            console.log('Partner found:', partnerId, 'Initiator:', initiator);
            setPartnerId(partnerId);
            setStatus('connected');

            // Create PeerConnection
            peerConnection.current = new RTCPeerConnection(ICE_SERVERS);

            // Add local tracks
            if (localStream.current) {
                localStream.current.getTracks().forEach(track => {
                    peerConnection.current.addTrack(track, localStream.current);
                });
            }

            // Handle remote track
            peerConnection.current.ontrack = (event) => {
                console.log('Remote track received');
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
            };

            // Handle ICE candidates
            peerConnection.current.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('signal', { target: partnerId, signal: { type: 'candidate', candidate: event.candidate } });
                }
            };

            // If initiator, create offer
            if (initiator) {
                try {
                    const offer = await peerConnection.current.createOffer();
                    await peerConnection.current.setLocalDescription(offer);
                    socket.emit('signal', { target: partnerId, signal: { type: 'offer', sdp: offer } });
                } catch (err) {
                    console.error('Error creating offer:', err);
                }
            }
        };

        const handleSignal = async ({ sender, signal }) => {
            if (!peerConnection.current) return;

            try {
                if (signal.type === 'offer') {
                    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                    const answer = await peerConnection.current.createAnswer();
                    await peerConnection.current.setLocalDescription(answer);
                    socket.emit('signal', { target: sender, signal: { type: 'answer', sdp: answer } });
                } else if (signal.type === 'answer') {
                    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                } else if (signal.type === 'candidate') {
                    await peerConnection.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
                }
            } catch (err) {
                console.error('Error handling signal:', err);
            }
        };

        const handlePartnerDisconnected = () => {
            console.log('Partner disconnected');
            cleanupConnection();
            setStatus('searching');
            socket.emit('join-queue'); // Auto re-queue
        };

        socket.on('partner-found', handlePartnerFound);
        socket.on('signal', handleSignal);
        socket.on('partner-disconnected', handlePartnerDisconnected);

        return () => {
            socket.off('partner-found', handlePartnerFound);
            socket.off('signal', handleSignal);
            socket.off('partner-disconnected', handlePartnerDisconnected);
        };
    }, [socket, remoteVideoRef]);

    const cleanupConnection = useCallback(() => {
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
        setPartnerId(null);
    }, [remoteVideoRef]);

    const startSearch = useCallback(async () => {
        setStatus('searching');

        // Get User Media
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStream.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            if (socket) {
                socket.emit('join-queue');
            }
        } catch (err) {
            console.error('Error accessing media:', err);
            alert('Could not access camera/microphone');
            setStatus('idle');
        }
    }, [socket, localVideoRef]);

    const nextPartner = useCallback(() => {
        if (socket && partnerId) {
            socket.emit('next', { target: partnerId });
        }
        cleanupConnection();
        setStatus('searching');
        socket.emit('join-queue');
    }, [socket, partnerId, cleanupConnection]);

    const stop = useCallback(() => {
        cleanupConnection();
        if (localStream.current) {
            localStream.current.getTracks().forEach(track => track.stop());
            localStream.current = null;
        }
        if (socket && partnerId) {
            socket.emit('next', { target: partnerId }); // Notify partner
        }
        setStatus('idle');
    }, [cleanupConnection, socket, partnerId]);

    const sendMessage = useCallback((text) => {
        if (socket && partnerId) {
            socket.emit('message', { target: partnerId, message: text });
        }
    }, [socket, partnerId]);

    const toggleAudio = useCallback((enabled) => {
        if (localStream.current) {
            localStream.current.getAudioTracks().forEach(track => track.enabled = !enabled);
        }
    }, []);

    const toggleVideo = useCallback((enabled) => {
        if (localStream.current) {
            localStream.current.getVideoTracks().forEach(track => track.enabled = !enabled);
        }
    }, []);

    return {
        status,
        startSearch,
        nextPartner,
        stop,
        sendMessage,
        toggleAudio,
        toggleVideo,
        socket
    };
};
