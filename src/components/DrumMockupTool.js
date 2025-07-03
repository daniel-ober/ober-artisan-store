import React, { useState } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import './App.css';

const WIDTH = 1536;
const HEIGHT = 1024;

const OverlayImage = ({ src, x, y, width, height }) => {
  const [image] = useImage(src);
  return <KonvaImage image={image} x={x} y={y} width={width} height={height} />;
};

const DrumMockupTool = () => {
  const [veneerImage, setVeneerImage] = useState(null);
  const [acrylicColor, setAcrylicColor] = useState('#3DFFD8');

  const handleVeneerUpload = (e) => {
    const file = e.target.files[0];
    if (file) setVeneerImage(URL.createObjectURL(file));
  };

  return (
    <div className="mockup-container">
      <div className="controls">
        <label>Upload Veneer Image:
          <input type="file" accept="image/*" onChange={handleVeneerUpload} />
        </label>

        <label>Acrylic HEX Color:
          <input type="color" value={acrylicColor} onChange={(e) => setAcrylicColor(e.target.value)} />
        </label>
      </div>

      <Stage width={WIDTH} height={HEIGHT} className="mockup-stage">
        <Layer>
          {veneerImage && <OverlayImage src={veneerImage} x={0} y={0} width={WIDTH} height={HEIGHT} />}

          {/* Hoops (gold sample) */}
          <OverlayImage src="/assets/hoops/brass.png" x={0} y={0} width={WIDTH} height={HEIGHT} />

          {/* Lugs for 10-lug config */}
          <OverlayImage src="/assets/lugs/tube10.png" x={0} y={0} width={WIDTH} height={HEIGHT} />

          {/* Acrylic accents overlay (tinted) */}
          <OverlayImage src="/assets/acrylic/speckle-overlay.png" x={0} y={0} width={WIDTH} height={HEIGHT} />
        </Layer>
      </Stage>
    </div>
  );
};

export default DrumMockupTool;
