import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const { user, updateAvatar, logout } = useAuth();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/api/user/avatar`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            updateAvatar(res.data.avatarUrl);
            setFile(null);
        } catch (err) {
            console.error('Upload failed', err);
            alert('Upload failed');
        }
        setUploading(false);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (!user) return <div>Loading...</div>;

    return (
        <div className="profile-container">
            <div className="profile-card">
                <h2>{user.username}'s Profile</h2>
                <div className="avatar-section">
                    <img
                        src={user.avatarUrl ? `${API_URL}${user.avatarUrl}` : 'https://via.placeholder.com/150'}
                        alt="Avatar"
                        className="profile-avatar"
                    />
                    <div className="upload-controls">
                        <input type="file" onChange={handleFileChange} accept="image/*" />
                        <button onClick={handleUpload} disabled={!file || uploading} className="btn-primary">
                            {uploading ? 'Uploading...' : 'Update Avatar'}
                        </button>
                    </div>
                </div>
                <div className="info-section">
                    <p><strong>Email:</strong> {user.email}</p>
                </div>
                <button onClick={handleLogout} className="btn-secondary logout-btn">Logout</button>
                <button onClick={() => navigate('/')} className="btn-primary back-btn">Back to Home</button>
            </div>
        </div>
    );
};

export default Profile;
