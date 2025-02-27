import React, { useState, useEffect } from "react";
import styles from "./hand.module.scss";
import { useStore } from "@stores/stores";
import Card from "@components/card/card";
import { observer } from "mobx-react-lite";
import { useSprings, animated, to as interpolate } from "@react-spring/web";
import useMeasure from "react-use-measure";
import { isMobile as _isMobile } from "is-mobile";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons/faChevronLeft';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons/faChevronRight';

const CARD_WIDTH = 150; // Adjust based on your card width
let CARD_OVERLAP = 55;

if (_isMobile({ tablet: false })) {
  CARD_OVERLAP = 70;
}
else if (_isMobile({ tablet: true })) {
  CARD_OVERLAP = 65;
}

const trans = (r: number, s: number) =>
  `perspective(1500px) rotateX(10deg) rotateY(0deg) rotateZ(${r}deg) scale(${s})`;

export const Hand = observer(() => {
  const [ref, bounds] = useMeasure();
  const store = useStore();
  const cards = store.gameInstance.hand.getCards();
  const [currentPage, setCurrentPage] = useState(0);

  // Calculate how many cards can fit in the available width
  const cardsPerPage = Math.max(1, Math.floor((bounds.width - 100) / (CARD_WIDTH - CARD_OVERLAP))); // -100 for navigation buttons
  const totalPages = Math.ceil(cards.length / cardsPerPage);
  const showNavigation = cards.length > cardsPerPage;

  // Reset current page if it's out of bounds after a resize
  useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [cardsPerPage, totalPages]);

  const visibleCards = cards.slice(
    currentPage * cardsPerPage,
    (currentPage + 1) * cardsPerPage
  );

  const deckBounds = store.gameInstance.zones.deckZone!;
  const startY = deckBounds?.bottom - bounds.bottom;
  const deckCenterX = (deckBounds?.left + deckBounds?.right) / 2;
  const handCenterX = (bounds.left + bounds.right) / 2;
  const startX = deckCenterX - handCenterX - 100;

  const from = (_i: number) => ({
    x: startX,
    rot: 0,
    scale: 1,
    y: startY,
  });

  const to = (i: number) => {
    
    return {
      x: 0,
      y: 0,
      rot: Math.random() * 6 - Math.random() * 6,
      scale: 1,
      delay: i * 50,
    };
  };

  const [props] = useSprings(visibleCards.length, (i) => ({
    ...to(i),
    from: from(i),
  }));

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <div ref={ref} id={styles.hand}>
      {showNavigation && currentPage > 0 && (
        <div 
          className={`${styles.navButton} ${styles.prevButton}`}
          onClick={handlePrevPage}
          style={{ transform: 'translateY(-50%)' }}
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </div>
      )}
      
      <div id={styles.handCards}>
        {props.map(({ x, y, rot, scale }, i) => {
          const card = visibleCards[i];
          const zIndex = i > 15 ? 100 + i : i > 8 ? 200 + i : 300 + i;
          
          return (
            <animated.div
              key={card.uid}
              style={{
                x,
                y,
                zIndex,
              }}
            >
              <Card
                deck={false}
                opponent={false}
                isDraggable={true}
                card={card}
                floorCard={false}
                // @ts-ignore idc
                style={{
                  transform: interpolate([rot, scale], trans),
                }}
              />
            </animated.div>
          );
        })}
      </div>

      {showNavigation && currentPage < totalPages - 1 && (
        <div 
          className={`${styles.navButton} ${styles.nextButton}`}
          onClick={handleNextPage}
          style={{transform: 'translateY(-50%)' }}
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </div>
      )}
    </div>
  );
});
