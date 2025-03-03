import React from 'react';
import { useSpring, animated } from '@react-spring/web';
import styles from './floatingtext.module.scss';

interface FloatingTextProps {
    text: string;
    onFinish?: () => void;
}

export const FloatingText: React.FC<FloatingTextProps> = ({ text, onFinish }) => {
    const spring = useSpring({
        from: { 
            opacity: 1, 
            transform: 'translateY(0px)',
        },
        to: { 
            opacity: 0, 
            transform: 'translateY(-60px)',
        },
        config: { 
            tension: 1220, 
            friction: 14,
            duration: 1500,
        },
        onRest: onFinish,
    });

    return (
        <animated.div className={styles.floatingText} style={spring}>
            {text}
        </animated.div>
    );
};