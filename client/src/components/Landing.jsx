import React from 'react';
import { Video, User as UserIcon, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

const Landing = ({ onStart, user }) => {
    return (
        <div className="landing-container">
            <div className="landing-content">
                <div className="logo">
                    <Video size={48} color="#646cff" />
                    <h1>Meetmegle</h1>
                </div>
                <p className="tagline">Talk to strangers, make new friends!</p>

                <div className="user-actions">
                    {user ? (
                        <Link to="/profile" className="profile-link">
                            <div className="user-chip">
                                {user.avatarUrl ? (
                                    <img src={`${import.meta.env.VITE_SERVER_URL}${user.avatarUrl}`} alt="Avatar" className="chip-avatar" />
                                ) : (
                                    <UserIcon size={20} />
                                )}
                                <span>{user.username}</span>
                            </div>
                        </Link>
                    ) : (
                        <div className="auth-links">
                            <Link to="/login" className="btn-text"><LogIn size={16} /> Login</Link>
                            <Link to="/signup" className="btn-text">Sign Up</Link>
                        </div>
                    )}
                </div>

                <button className="btn-start" onClick={onStart}>
                    Start Video Chat
                </button>

                <div className="features">
                    <div className="feature-item">
                        <span className="emoji">🔒</span>
                        <span>Anonymous & Secure</span>
                    </div>
                    <div className="feature-item">
                        <span className="emoji">🌍</span>
                        <span>Global Community</span>
                    </div>
                    <div className="feature-item">
                        <span className="emoji">⚡</span>
                        <span>Fast Connections</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Landing;
