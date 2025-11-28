export const createDummyStream = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    const draw = () => {
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#646cff';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No Camera', canvas.width / 2, canvas.height / 2);

        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText(new Date().toLocaleTimeString(), canvas.width / 2, canvas.height / 2 + 40);

        requestAnimationFrame(draw);
    };
    draw();

    const videoStream = canvas.captureStream(30);

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const dest = audioCtx.createMediaStreamDestination();
    const osc = audioCtx.createOscillator();
    osc.connect(dest);
    // osc.start(); // Don't start oscillator to avoid annoying noise, or maybe just silence?
    // Let's just return a silent audio track for now to satisfy the requirement of having an audio track.

    const audioStream = dest.stream;

    const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
    ]);

    return combinedStream;
};

export const getMediaStream = async () => {
    try {
        return await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (err) {
        console.warn("Failed to get real media stream, falling back to dummy stream", err);
        return createDummyStream();
    }
};
