// src/components/AudioPlayer/Track.js
import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import './Track.css';


const Track = ({ track }) => {
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);

  useEffect(() => {
    // Initialize WaveSurfer
    wavesurferRef.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'violet',
      progressColor: 'purple',
      responsive: true,
      height: 100,
      normalize: true,
    });

    // Load the audio file
    wavesurferRef.current.load(track.file);

    // Cleanup on unmount
    return () => {
      wavesurferRef.current.destroy();
    };
  }, [track.file]);

  const play = () => {
    wavesurferRef.current.play();
  };

  const pause = () => {
    wavesurferRef.current.pause();
  };

  return (
    <div className="track">
      <h4>{track.name}</h4>
      <div ref={waveformRef} />
      <button onClick={play}>Play</button>
      <button onClick={pause}>Pause</button>
    </div>
  );
};

export default Track;
