import * as path from "node:path";
import * as fs from "node:fs";
import logger from "./logger";

export interface IDbEventData {
  discordId: string;
  eventHash: string;
}

export interface IDbData {
  events: Record<string, IDbEventData>;
}

export interface IDbParams {
  dbPath: string;
}

export class LocalDb {
  private _db: IDbData;
  private _filePath: string;

  public constructor({ dbPath }: IDbParams) {
    this._filePath = path.resolve(dbPath);
    const file = fs.readFileSync(this._filePath);
    try {
      this._db = JSON.parse(file.toString()) as IDbData;
      if (!this._db.events) {
        this._db.events = {};
      }
      logger.info(
        `Found ${
          Object.keys(this._db.events).length
        } events in ${this._filePath}`,
        { service: "LocalDb" },
      );
    } catch (e) {
      logger.error(`Failed to parse local db. Path: ${this._filePath}`, {
        service: "LocalDb",
      });
      throw e;
    }
  }

  public get() {
    return this._db.events;
  }

  public write(): void {
    try {
      fs.writeFileSync(this._filePath, JSON.stringify(this._db));
      logger.info(`Successfully written to ${this._filePath}`, {
        service: "LocalDb",
      });
    } catch (e) {
      logger.error(`Failed to write to local db. Path: ${this._filePath}`, {
        service: "LocalDb",
      });
    }
  }
}
