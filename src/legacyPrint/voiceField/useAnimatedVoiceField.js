// src/legacyPrint/voiceField/useAnimatedVoiceField.js

import { useEffect, useMemo, useRef, useState } from 'react';

const lerp = (from, to, amount) => from + (to - from) * amount;

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

export function useAnimatedVoiceField({

  nodes = [],

  activeNodeId = null,

  hoveredNodeId = null,

  enabled = true,

}) {

  const frameRef = useRef(null);

  const positionsRef = useRef(new Map());

  const [animatedNodes, setAnimatedNodes] = useState(nodes);

  const targetNodes = useMemo(() => {

    return nodes.map((node) => {

      const similarity = clamp01(node.gravity ?? node.similarityScore ?? 0.5);

      const isActive = activeNodeId && node.drumId === activeNodeId;

      const isHovered = hoveredNodeId && node.drumId === hoveredNodeId;

      let targetX = node.x;

      let targetY = node.y;

      if (activeNodeId && !isActive) {

        targetX = lerp(targetX, 0.5, similarity * 0.08);

        targetY = lerp(targetY, 0.5, similarity * 0.08);

      }

      if (isHovered) {

        targetY -= 0.018;

      }

      return {

        ...node,

        targetX: clamp01(targetX),

        targetY: clamp01(targetY),

        isActive,

        isHovered,

        motionScale: isHovered ? 1.18 : isActive ? 1.26 : 1,

        motionOpacity: hoveredNodeId && !isHovered ? 0.42 : node.gravity ?? 0.7,

      };

    });

  }, [nodes, activeNodeId, hoveredNodeId]);

  useEffect(() => {

    if (!enabled) {

      setAnimatedNodes(targetNodes);

      return undefined;

    }

    const tick = () => {

      const nextNodes = targetNodes.map((node) => {

        const previous = positionsRef.current.get(node.drumId) || {

          x: node.targetX,

          y: node.targetY,

        };

        const next = {

          x: lerp(previous.x, node.targetX, 0.085),

          y: lerp(previous.y, node.targetY, 0.085),

        };

        positionsRef.current.set(node.drumId, next);

        return {

          ...node,

          x: next.x,

          y: next.y,

        };

      });

      setAnimatedNodes(nextNodes);

      frameRef.current = requestAnimationFrame(tick);

    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {

      if (frameRef.current) cancelAnimationFrame(frameRef.current);

    };

  }, [targetNodes, enabled]);

  return animatedNodes;

}