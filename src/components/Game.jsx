import { useState, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
//set who turn feature

const Game = () => {
    const [start, setStart] = useState(false);
    const [turn, setTurn] = useState('white');
    const [identity, setIdentity] = useState('');
    const [gameStatus, setGameStatus] = useState('Waiting for opponent');
    const [orientation, setOrientation] = useState('');
    const [fen, setFen] = useState('');
    const clientRef = useRef(null);
    const chessref = useRef(new Chess());


    useEffect(() => {
        if (!start) return;

        const ws = new WebSocket('ws://localhost:8080');
        clientRef.current = ws;

        ws.onmessage = (message) => {
            const data = JSON.parse(message.data);
            console.log(data);

            if (data.type === 'start') {
                setGameStatus('');
                setTurn(data.turn);
                setIdentity(data.yourIdentity);
                setOrientation(data.orientation);
                setFen(data.fen);
                chessref.current.load(data.fen);
                console.log('The game has started');
            } else if (data.type === 'pendingUser') {
                setGameStatus('Waiting for opponent');
            } else if (data.type === 'move') {
                setFen(data.move.after);
                chessref.current.load(data.move.after)
                console.log("Result from backend:", data.move.before);
            } else if (data.type === 'turn') {
                setTurn(data.turn);
            } else if (data.type === 'error') {
                alert(data.message);
            }

        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [start]);



    const onDrop = (sourceSquare, targetSquare) => {
        if (turn === identity) {
            let move = chessref.current.move(sourceSquare + targetSquare);

            console.log("i am chessref ", move);
            if (move) {
                setFen(move.after)
                if (clientRef.current) {
                    clientRef.current.send(JSON.stringify({ type: "move", move: sourceSquare + targetSquare }));
                    console.log(sourceSquare, targetSquare);
                }
            }
        } else {
            alert('invalid move');
        }

    };

    return (
        <>
            {start === false ? (
                <div className='w-full min-h-screen bg-zinc-800'>
                    <button
                        onClick={() => setStart(true)}
                        className="
                          fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                          bg-red-600 text-white font-semibold py-3 px-6 
                          rounded-full shadow-lg transition-all duration-300 
                          hover:ring-4 hover:ring-red-300 hover:bg-red-700
                          focus:outline-none focus:ring-4 focus:ring-red-400
                          flex justify-center items-center"
                    >
                        Find Opponent
                    </button>
                </div>
            ) : (
                <div className='w-2/3 h-auto'>
                    {gameStatus === 'Waiting for opponent' ? (
                        <h1>Waiting for opponent</h1>
                    ) : (
                        <Chessboard
                            id="BasicBoard"
                            onPieceDrop={onDrop}
                            boardOrientation={orientation}
                            position={fen}
                            animationDuration={-10}
                        />
                    )}
                </div>
            )}
        </>
    );
};

export default Game;
