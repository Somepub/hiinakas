import sqlite3 from "sqlite3";
import { User } from "../user/userhandler";
import { v4 } from "uuid";


export class SqliteDatabase {
  private db: sqlite3.Database;
  constructor() {
    this.db = new sqlite3.Database("hiinakas.db");
    this.serialize();
  }

  serialize() {
    this.db.run(
      "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, userUid TEXT UNIQUE, publicUid TEXT, gameUid TEXT, name TEXT, createdAt TEXT, friends TEXT, friendsRequests TEXT)"
    );
  }

  getUserExists(userUid: string): Promise<boolean> {
    const query = `SELECT EXISTS(SELECT 1 FROM users WHERE userUid = ?)`;

    return new Promise((resolve, reject) => {
      this.db.get(query, [userUid], (err, row) => {
        if (err) {
          console.error(err)
          reject(err);
          return;
        }
        
        const existRow = row as { [key: string]: number };
        const exists = Object.values(existRow)[0] > 0;
        resolve(exists);
      });
    });
  }

  getUser(userUid: string): Promise<User> {
    return new Promise((resolve, reject) => {
      this.db.all(
        "SELECT userUid, gameUid, publicUid, name, createdAt, friends, friendsRequests FROM users WHERE userUid=$userUid",
        { $userUid: userUid },
        (error, rows) => {
          const user = rows[0] as User;
          resolve(user);
        }
      );
  });
  }

  createUser(userUid: string, publicUid: string, name: string) {
    this.db.run(
      "INSERT INTO users (userUid, gameUid, publicUid, name, createdAt, friends, friendsRequests) VALUES ($userUid, $gameUid, $publicUid, $name, $createdAt, $friends, $friendsRequests)",
      {
        $userUid: userUid,
        $publicUid: publicUid,
        $name: name,
        $createdAt: String(Date.now()),
        $friends: JSON.stringify([]),
        $friendsRequests: JSON.stringify([]),
        $gameUid: "",
      }
    );
  }

}
