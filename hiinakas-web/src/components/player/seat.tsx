import { observer } from "mobx-react-lite";
import React from "react";
import { Front } from "./front";
import styles from "./seat.module.scss";
import { Hand } from "./hand";
  
 export const Seat = observer(() => {
    return (
      <>
        <Front />
        <Hand />
        </>
    );
  });