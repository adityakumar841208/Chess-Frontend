import { useState, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import Time from './Timer';

const Game = () => {
    const [start, setStart] = useState(false);
    const [gameStatus, setGameStatus] = useState('Waiting for opponent');

    const [turn, setTurn] = useState('white');
    const [identity, setIdentity] = useState('');
    const [orientation, setOrientation] = useState('');
    const [fen, setFen] = useState('');
    const [history, setHistory] = useState('');
    const [opponentTimerRunning, setOpponentTimerRunning] = useState(false);
    const clientRef = useRef(null);
    const chessref = useRef(new Chess());
    const apiUrl = import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
        if (!start) return;

        const ws = new WebSocket(apiUrl);
        clientRef.current = ws;

        ws.onmessage = (message) => {
            const data = JSON.parse(message.data);

            if (data.type === 'start') {
                setGameStatus('');
                setTurn(data.turn);
                setIdentity(data.yourIdentity);
                setOrientation(data.orientation);
                setFen(data.fen);
                chessref.current.load(data.fen);
            } else if (data.type === 'pendingUser') {
                setGameStatus('Waiting for opponent');
            } else if (data.type === 'move') {
                setFen(data.move.after);
                chessref.current.load(data.move.after);
            } else if (data.type === 'turn') {
                setTurn(data.turn);
                setHistory(data.history);
            } else if (data.type === 'error') {
                alert(data.message);
            } else if (data.type === 'opponent disconnected!') {
                alert("opponent disconnected");
            }
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [start]);

    useEffect(() => {
        if (turn === identity) {
            setOpponentTimerRunning(true);
        } else {
            setOpponentTimerRunning(false);
        }
    }, [turn, identity]);

    const onDrop = (sourceSquare, targetSquare) => {
        if (turn === identity) {
            let move = chessref.current.move(sourceSquare + targetSquare);

            if (move) {
                setFen(move.after);
                if (clientRef.current) {
                    clientRef.current.send(JSON.stringify({ type: "move", move: sourceSquare + targetSquare }));
                }
            }
        } else {
            alert('invalid move');
        }
    };

    return (
        <div className="h-screen overflow-x-hidden bg-gray-900">
            {!start ? (
                <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                    <button
                        onClick={() => setStart(true)}
                        className="bg-red-600 text-white font-semibold py-3 px-6 rounded-full shadow-lg transition-all duration-300 hover:ring-4 hover:ring-red-300 hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-400 hover:shadow-slate-500"
                    >
                        Find Opponent
                    </button>
                </div>
            ) : gameStatus === 'Waiting for opponent' ? (
                <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                    <button
                        className="bg-red-600 text-white font-semibold py-3 px-6 rounded-full shadow-lg flex justify-center items-center"
                    >
                        Waiting For Opponent...
                    </button>
                </div>
            ) : (
                <div className="w-full h-full flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 p-4">

                    {/* Turn and Timer Section */}
                    <div className='w-full md:w-1/3 h-2/6 md:h-full flex flex-col justify-center items-center gap-4'>
                        <div className="w-full h-4/6 md:h-full flex flex-col items-center justify-center text-2xl md:text-3xl text-orange-500 bg-black border border-orange-500 rounded-md shadow-lg p-4 gap-4 md:gap-6">
                            <div className="w-full text-center">
                                {turn === identity ? 'Your Turn' : 'Opponent Turn'}
                            </div>
                            <div className="w-full text-center flex items-center justify-center px-3 py-2 rounded-md">
                                Time left: <Time running={opponentTimerRunning} />
                            </div>
                        </div>
                    </div>

                    {/* Chessboard Section */}
                    <div className="w-full md:w-2/3 h-1/2 md:h-full flex justify-center items-center">
                        <div className="w-full md:w-4/5 lg:w-2/3 flex justify-center">
                            <Chessboard
                                id="BasicBoard"
                                onPieceDrop={onDrop}
                                boardOrientation={orientation}
                                position={fen}
                                animationDuration={0}
                                className="shadow-lg rounded-md border border-gray-400"
                            />
                        </div>
                    </div>

                    {/* History Section for Desktop */}
                    <div className="w-full md:w-1/3 h-1/2 md:h-full sm:hidden hidden md:flex flex-col gap-4">
                        <div className="w-full flex align-middle justify-center h-full bg-black text-orange-500 border border-orange-400 rounded-md shadow-lg p-4 overflow-y-auto gap-4">
                            <div className="text-lg text-center">
                                <h2>{identity === 'white' ? 'White Moves' : 'Black Moves'}</h2>
                                {history &&
                                    history.map((item, i) => {
                                        if (identity === 'white' && i % 2 === 0) {
                                            return <div key={i}>{item}</div>;
                                        } else if (identity === 'black' && i % 2 !== 0) {
                                            return <div key={i}>{item}</div>;
                                        }
                                        return null;
                                    })}
                            </div>
                            <div className="text-lg text-center">
                                <h2>{identity === 'black' ? 'White Moves' : 'Black Moves'}</h2>
                                {history &&
                                    history.map((item, i) => {
                                        if (identity === 'black' && i % 2 === 0) {
                                            return <div key={i}>{item}</div>;
                                        } else if (identity === 'white' && i % 2 !== 0) {
                                            return <div key={i}>{item}</div>;
                                        }
                                        return null;
                                    })}
                            </div>
                        </div>
                    </div>

                    {/* History Section for Mobile */}
                    <div className="w-full md:hidden h-full sm:flex bg-black flex text-orange-500 overflow-x-auto justify-around gap-4 border border-orange-400 rounded-md p-4">
                        <div className="white">
                            <h2>{identity}</h2>
                            {history &&
                                history.map((item, i) => {
                                    if (identity === 'white' && i % 2 === 0) {
                                        return <div key={i}>{item}</div>;
                                    } else if (identity === 'black' && i % 2 !== 0) {
                                        return <div key={i}>{item}</div>;
                                    }
                                    return null;
                                })}
                        </div>
                        <div className="Black">
                            <h2>{identity === 'black' ? 'white' : 'black'}</h2>
                            {history &&
                                history.map((item, i) => {
                                    if (identity === 'black' && i % 2 === 0) {
                                        return <div key={i}>{item}</div>;
                                    } else if (identity === 'white' && i % 2 !== 0) {
                                        return <div key={i}>{item}</div>;
                                    }
                                    return null;
                                })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Game;
