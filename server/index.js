const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/omegle-clone')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

let waitingQueue = [];

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-queue', () => {
        // If user is already in queue, ignore
        if (waitingQueue.includes(socket.id)) return;

        console.log('User joined queue:', socket.id);

        if (waitingQueue.length > 0) {
            // Match found
            const partnerId = waitingQueue.shift();

            // Check if partner is still connected
            if (io.sockets.sockets.get(partnerId)) {
                console.log(`Matching ${socket.id} with ${partnerId}`);

                // Notify both users
                io.to(socket.id).emit('partner-found', { partnerId, initiator: true });
                io.to(partnerId).emit('partner-found', { partnerId: socket.id, initiator: false });
            } else {
                // Partner disconnected, put current user in queue
                waitingQueue.push(socket.id);
            }
        } else {
            // No one waiting, add to queue
            waitingQueue.push(socket.id);
        }
    });

    socket.on('signal', ({ target, signal }) => {
        io.to(target).emit('signal', { sender: socket.id, signal });
    });

    socket.on('message', ({ target, message }) => {
        io.to(target).emit('message', { sender: socket.id, message });
    });

    socket.on('next', ({ target }) => {
        if (target) {
            io.to(target).emit('partner-disconnected');
        }
        // Logic to re-queue is handled by client sending 'join-queue' again
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Remove from queue if present
        waitingQueue = waitingQueue.filter(id => id !== socket.id);

        // Notify any active partners (this part is tricky without keeping state of active pairs, 
        // but for now relying on client to handle connection failures or we can track pairs)
        // For a simple implementation, we rely on WebRTC connection state or explicit 'next' events.
        // But to be safe, we can broadcast to everyone? No, that's bad.
        // Better: Client handles 'iceConnectionState' 'disconnected'.
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
