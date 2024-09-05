import React, { useState, useEffect, useRef } from 'react';

const Timer = ({ running }) => {
    const [seconds, setSeconds] = useState(0);
    const [minutes, setMinutes] = useState(10);
    const intervalRef = useRef(null);

    useEffect(() => {
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
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        return () => clearInterval(intervalRef.current);
    }, [running, minutes]);

    return (
        <div>
            {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
        </div>
    );
};

export default Timer;
