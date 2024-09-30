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
    const apiUrl = import.meta.env.VITE_BACKEND_URL; //getting the url of backend
    const [winningStatus, setWinningStatus] = useState({ status: false, info: '' });
    const [playAgain, setPlayAgain] = useState(false);
    const [opponentDisconnect, setOpponentDisconnect] = useState(false);

    //Timer resetting 
    const [resetTimer, setResetTimer] = useState(false);

    useEffect(() => {
        if (!start) return;

        const ws = new WebSocket(apiUrl);
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
            } else if (data.type === 'pendingUser') {
                setGameStatus('Waiting for opponent');
            } else if (data.type === 'move') {
                // setResetTimer(false);
                setFen(data.move.after);
                chessref.current.load(data.move.after);
            } else if (data.type === 'turn') {
                setTurn(data.turn);
                setHistory(data.history);
            } else if (data.type === 'error') {
                // alert(data.message);
            } else if (data.type === 'opponent disconnected!') {
                setOpponentDisconnect(true);
                // alert("you opponent disconnected")
            } else if (data.type === "gameOver") {
                setWinningStatus({ status: true, info: data.status })
            } else if (data.type === 'playAgain') {
                setPlayAgain(true);
            } else if (data.type === 'resetState') {
                setResetTimer(true);
                resetState(); //function to reset the board and other stuff
                setFen(data.fen);
                setTurn(data.turn);
                chessref.current.reset();
                setPlayAgain(false);
            }
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [start]);

    useEffect(() => {
        if (turn === identity && !playAgain) {
            setResetTimer(false);
            setOpponentTimerRunning(true);
        } else {
            setResetTimer(false);
            setOpponentTimerRunning(false);
        }
    }, [turn, identity]);


    const onDrop = (sourceSquare, targetSquare, piece) => {
        // console.log('piece: ',piece.split('')[1]);
        if (identity === turn) {
            // console.log(chessref.current.ascii());
            try {
                const move = chessref.current.move({
                    from: sourceSquare,
                    to: targetSquare,
                    promotion: piece.split('')[1].toLowerCase() // `piece` will be 'q', 'r', 'b', or 'n' for promotion
                });
                // console.log(move)
                if (move) {
                    setFen(move.after);
                    clientRef.current.send(JSON.stringify({
                        type: "move",
                        move: {
                            from: sourceSquare,
                            to: targetSquare,
                            promotion: piece.split('')[1].toLowerCase()
                        }
                    }));
                }
            } catch (error) {
                console.log("invalid move-", error);
            }
        }
    };


    // reset all the state because the player wants a rematch.


    const resetState = () => {
        // console.log("reset state is triggered !");
        setHistory('');
        setOpponentTimerRunning(false);
        setWinningStatus({ status: false, info: '' });
        setPlayAgain(false);
    }





    const rematch = () => {
        if (playAgain) {
            return clientRef.current.send(JSON.stringify({ type: "resetState" }));
        }
        clientRef.current.send(JSON.stringify({ type: "playAgain" }));
    }

    return (
        <div className="h-screen overflow-x-hidden bg-gray-900 ">

            {/* if opponent will disconnected */}
            {
                opponentDisconnect &&
                <div className='bg-white p-8 lg:p-20 absolute top-1/2 left-1/2 rounded-lg shadow-lg text-center text-2xl font-bold text-gray-800 transform -translate-x-1/2 -translate-y-1/2 z-20'>
                    <div className="mt-6 flex flex-col space-y-4 lg:space-y-0 lg:space-x-4 lg:flex-row justify-center">
                        <h2 className='bg-green-500 rounded-lg text-white p-3'>Your Opponent Disconnected!</h2>
                        <button
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300"
                            onClick={() => window.location.reload()}
                        >
                            New Game
                        </button>
                    </div>
                </div>
            }

            {/* block for gameOver or gameDraw  */}


            {<>
                {/* {console.log(winningStatus.status)} */}
                {winningStatus.status && (
                    <>

                        <div className="fixed inset-0 bg-black bg-opacity-50 z-10"></div>


                        <div
                            className="bg-white p-8 lg:p-20 absolute top-1/2 left-1/2 rounded-lg shadow-lg text-center text-2xl font-bold text-gray-800 transform -translate-x-1/2 -translate-y-1/2 z-20"
                        >
                            <div>{winningStatus.info}</div>

                            <div className="mt-6 flex flex-col space-y-4 lg:space-y-0 lg:space-x-4 lg:flex-row justify-center">

                                {/* if opponent wants a rematch  */}
                                {playAgain && (<div className='bg-green-500 rounded-lg text-white p-3'>
                                    Opponent Wants to Play Again
                                </div>)}

                                <button
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300"
                                    onClick={() => window.location.reload()}
                                >
                                    New Game
                                </button>


                                <button
                                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 transition-all duration-300"
                                    onClick={() => rematch()}
                                >
                                    Play Again
                                </button>

                            </div>
                        </div>
                    </>
                )}
            </>


            }

            {!start ? (
                <div className="w-full h-full flex items-center justify-center bg-[url('/chess.jpg')] bg-fixed bg-cover bg-center">
                    <button
                        onClick={() => setStart(true)}
                        className="bg-red-600 text-white font-semibold py-3 px-6 rounded-full shadow-lg transition-all duration-300 hover:ring-4 hover:ring-red-300 hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-400 hover:shadow-slate-500"
                    >
                        Find Opponent
                    </button>
                </div>
            ) : gameStatus === 'Waiting for opponent' ? (
                <div className="w-full h-full flex items-center justify-center bg-[url('/chess.jpg')] bg-fixed bg-cover bg-center">
                    <button
                        className="bg-red-600 text-white font-semibold py-3 px-6 rounded-full shadow-lg flex justify-center items-center"
                    >
                        Waiting For Opponent...
                    </button>
                </div>
            ) : (
                <div className="w-full h-full flex flex-col sm:flex-col md:flex-row items-center justify-center gap-6 md:gap-10 p-4">

                    {/* Turn and Timer Section */}
                    <div className='w-full md:w-1/3 h-2/6 md:h-full flex flex-col justify-center items-center gap-4'>
                        <div className="w-full h-4/6 md:h-full flex flex-col items-center justify-center text-2xl md:text-3xl text-orange-500 bg-black border border-orange-500 rounded-md shadow-lg p-4 gap-4 md:gap-6">
                            <div className="w-full text-center">
                                {turn === identity ? 'Your Turn' : 'Opponent Turn'}
                            </div>
                            <div className="w-full text-center flex items-center justify-center px-3 py-2 rounded-md">
                                Time left: <Time running={opponentTimerRunning} resetTimer={resetTimer} />
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
