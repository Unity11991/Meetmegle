import React from 'react';
import { Video, MessageSquare } from 'lucide-react';

const Landing = ({ onStart }) => {
    return (
        <div className="landing-container">
            <div className="hero">
                <h1>Omegle Clone</h1>
                <p>Talk to strangers!</p>

                <div className="actions">
                    <button className="btn-primary" onClick={onStart}>
                        <Video size={20} />
                        <span>Video Chat</span>
                    </button>
                    <button className="btn-secondary" disabled>
                        <MessageSquare size={20} />
                        <span>Text Chat (Coming Soon)</span>
                    </button>
                </div>

                <div className="disclaimer">
                    <p>18+ only. Moderated content. Be respectful.</p>
                </div>
            </div>
        </div>
    );
};

export default Landing;
