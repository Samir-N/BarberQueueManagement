
import { useRef } from 'react';
import notificationSound from '../sounds/BarberNotification.mp3';

const useSoundNotification = () => {
    const audioRef = useRef(new Audio(notificationSound));

    const playSound = () => {
        audioRef.current.currentTime = 0;

        audioRef.current.play().catch((err) => {
            console.error('Could not play notification sound:', err);
        });
    };

    return playSound;
};

export default useSoundNotification;
