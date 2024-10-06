import React, { useState } from 'react';
import './Mixer.css'; // Import your CSS file for styles

const Mixer = () => {
    const [tracks, setTracks] = useState([
        { id: 1, name: 'Track 1', volume: 50, isMuted: false, isSolo: false },
        { id: 2, name: 'Track 2', volume: 50, isMuted: false, isSolo: false },
        { id: 3, name: 'Track 3', volume: 50, isMuted: false, isSolo: false },
        { id: 4, name: 'Track 4', volume: 50, isMuted: false, isSolo: false },
        { id: 5, name: 'Track 5', volume: 50, isMuted: false, isSolo: false },
        { id: 6, name: 'Track 6', volume: 50, isMuted: false, isSolo: false },
        { id: 7, name: 'Track 7', volume: 50, isMuted: false, isSolo: false },
        { id: 8, name: 'Track 8', volume: 50, isMuted: false, isSolo: false },
    ]);

    const handleMute = (index) => {
        const newTracks = [...tracks];
        newTracks[index].isMuted = !newTracks[index].isMuted;
        setTracks(newTracks); // Update the state with new tracks
    };

    const handleSolo = (index) => {
        const newTracks = [...tracks];
        newTracks.forEach((track, i) => {
            track.isSolo = i === index ? !track.isSolo : false; // Only allow one solo track
        });
        setTracks(newTracks); // Update the state with new tracks
    };

    const handleVolumeChange = (index, newVolume) => {
        const newTracks = [...tracks];
        newTracks[index].volume = newVolume;
        setTracks(newTracks); // Update the state with new tracks
    };

    return (
        <div className="mixer">
            <div className="controls">
                <button className="control-button">Play</button>
                <button className="control-button">Pause</button>
                <button className="control-button">Stop</button>
            </div>
            <div className="track-list">
                {tracks.map((track, index) => (
                    <div key={track.id} className="track">
                        <div className="signal-meter">
                            <div className="meter" style={{ height: `${track.volume}%`, backgroundColor: track.isMuted ? 'red' : 'green' }} />
                        </div>
                        <input
                            type="range"
                            className="fader"
                            min="0"
                            max="100"
                            value={track.isMuted ? 0 : track.volume}
                            onChange={(e) => handleVolumeChange(index, e.target.value)}
                        />
                        <div className="track-controls">
                            <button onClick={() => handleMute(index)}>{track.isMuted ? 'Unmute' : 'Mute'}</button>
                            <button onClick={() => handleSolo(index)}>{track.isSolo ? 'Un-Solo' : 'Solo'}</button>
                        </div>
                        <div className="track-name">{track.name}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Mixer;
