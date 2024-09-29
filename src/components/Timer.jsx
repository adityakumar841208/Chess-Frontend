import React, { useState, useEffect, useRef } from 'react';

const Timer = ({ running, resetTimer }) => {
    const [seconds, setSeconds] = useState(0);
    const [minutes, setMinutes] = useState(10);
    const intervalRef = useRef(null);

    useEffect(() => {
        //resetting the timer for rematch
        if (resetTimer) {
            setMinutes(10);
            setSeconds(0);
            clearInterval(intervalRef.current);
            return;
        }

        if (running) {
            intervalRef.current = setInterval(() => {
                setSeconds(prev => {
                    if (prev === 0) {
                        if (minutes === 0) {
                            clearInterval(intervalRef.current);
                            return 0;
                        }
                        setMinutes(min => min - 1);
                        return 59;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }

        return () => clearInterval(intervalRef.current);
    }, [running, resetTimer, minutes]);

    return (
        <div>
            {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
        </div>
    );
};

export default Timer;
