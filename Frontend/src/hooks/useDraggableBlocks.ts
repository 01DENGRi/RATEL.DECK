import { useState, useEffect, useCallback } from "react";

export interface BlockConfig {
  id: string;
  order: number;
}

const STORAGE_KEY = "ctf-blocks-order";

const defaultOrder: BlockConfig[] = [
  { id: "terminal", order: 0 },
  { id: "target-terminal", order: 1 },
  { id: "notes", order: 2 },
];

export function useDraggableBlocks() {
  const [blocks, setBlocks] = useState<BlockConfig[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultOrder;
      }
    }
    return defaultOrder;
  });

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Save to localStorage whenever order changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
  }, [blocks]);

  const getBlockOrder = useCallback((id: string) => {
    return blocks.find((b) => b.id === id)?.order ?? 0;
  }, [blocks]);

  const getSortedBlockIds = useCallback(() => {
    return [...blocks].sort((a, b) => a.order - b.order).map((b) => b.id);
  }, [blocks]);

  const handleDragStart = useCallback((id: string) => {
    setDraggedId(id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedId && draggedId !== id) {
      setDragOverId(id);
    }
  }, [draggedId]);

  const handleDragLeave = useCallback(() => {
    setDragOverId(null);
  }, []);

  const handleDrop = useCallback((targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    setBlocks((prev) => {
      const draggedIndex = prev.findIndex((b) => b.id === draggedId);
      const targetIndex = prev.findIndex((b) => b.id === targetId);
      
      if (draggedIndex === -1 || targetIndex === -1) return prev;

      const newBlocks = [...prev];
      const [removed] = newBlocks.splice(draggedIndex, 1);
      newBlocks.splice(targetIndex, 0, removed);

      // Update order values
      return newBlocks.map((block, index) => ({
        ...block,
        order: index,
      }));
    });

    setDraggedId(null);
    setDragOverId(null);
  }, [draggedId]);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
  }, []);

  return {
    blocks,
    draggedId,
    dragOverId,
    getBlockOrder,
    getSortedBlockIds,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  };
}
