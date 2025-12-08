
import React, { useState } from 'react';
import { BoardData } from '../types';
import { Plus, Save, Trash2, Eraser, ChevronDown, ChevronUp } from 'lucide-react';

interface BoardCarouselProps {
  boards: BoardData[];
  activeBoardId: string;
  isConnected: boolean;
  onSelectBoard: (id: string) => void;
  onNewBoard: () => void;
  onDeleteBoard: (id: string) => void;
  onClearBoard: (id: string) => void;
}

const BoardCarousel: React.FC<BoardCarouselProps> = ({ 
  boards, 
  activeBoardId, 
  isConnected,
  onSelectBoard, 
  onNewBoard,
  onDeleteBoard,
  onClearBoard
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`
      flex flex-col border-t border-slate-700 bg-slate-900/90 backdrop-blur-md transition-all duration-300 ease-in-out
      ${isCollapsed ? 'h-8' : 'h-40'}
    `}>
      {/* Collapse Toggle */}
      <div 
        className="h-8 flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors border-b border-slate-800"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <div className="flex items-center text-xs text-slate-400 space-x-2">
            <span className="font-semibold">Show Boards</span>
            <ChevronUp size={16} />
          </div>
        ) : (
          <ChevronDown size={16} className="text-slate-400" />
        )}
      </div>

      {/* Carousel Content */}
      <div className={`
        flex-1 flex items-center space-x-4 overflow-x-auto p-4 transition-opacity duration-200
        ${isCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100'}
      `}>
        <div className="flex space-x-3">
          {boards.map((board, index) => (
            <div
              key={board.id}
              className={`
                relative group w-32 h-20 sm:w-36 sm:h-24 rounded-md border-2 overflow-hidden transition-all flex-shrink-0
                ${board.id === activeBoardId ? 'border-blue-500 scale-100 sm:scale-105 shadow-lg shadow-blue-500/20' : 'border-slate-600 hover:border-slate-400 opacity-80 hover:opacity-100'}
              `}
            >
              {/* Board Selection Click Area */}
              <button
                onClick={() => onSelectBoard(board.id)}
                className="absolute inset-0 w-full h-full bg-slate-800 flex flex-col items-center justify-center text-xs text-slate-500 z-0"
              >
                <span className="font-bold mb-1">Board {index + 1}</span>
                {board.lastSaved && (
                  <span className="flex items-center text-[10px] text-green-500/80">
                     <Save size={10} className="mr-1" />
                     Saved
                  </span>
                )}
              </button>
              
              {/* Visual indicator for active editing */}
              {board.id === activeBoardId && (
                 <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-md shadow-green-500 z-10"></div>
              )}

              {/* Management Actions (Only visible if disconnected) */}
              {!isConnected && (
                <div className="absolute inset-x-0 bottom-0 h-8 bg-slate-900/90 flex items-center justify-around opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onClearBoard(board.id); }}
                    className="text-slate-400 hover:text-yellow-400 p-1"
                    title="Clear Board"
                  >
                    <Eraser size={14} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteBoard(board.id); }}
                    className="text-slate-400 hover:text-red-400 p-1"
                    title="Delete Board"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <button 
          onClick={onNewBoard}
          className="flex flex-col items-center justify-center w-32 h-20 sm:w-36 sm:h-24 flex-shrink-0 rounded-md border-2 border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 transition-colors bg-slate-800/50"
        >
          <Plus size={20} />
          <span className="text-xs mt-1 font-semibold">New Board</span>
        </button>
      </div>
    </div>
  );
};

export default BoardCarousel;
