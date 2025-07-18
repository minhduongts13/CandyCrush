import Board from "../components/Board"
import { _decorator, Component, instantiate, log, Prefab, Tween, tween, Vec3, Node, Input } from 'cc'
import { Tile } from "../components/Tile/Tile"

export type Movement = {
    tile: Tile,
    from: {
        x : number,
        y : number
    },
    to: {
        x : number,
        y : number
    },

}

export type Match = {
    horizontal : Tile[], 
    vertical : Tile[]
}

export interface IBoard {
    getCanMove(): boolean;
    showHint(): void;
    getTileGrid(): (Tile | undefined)[][];
    removeTileGroup(match: Tile[]): Promise<void>;
    getEffectLayer(): Node | null;
}

export interface ITile {
    addOnClickCallback(callback: (tile: Tile) => void): void;
    removeOnClickCallback(callback?: (tile: Tile) => void): void;
    emitOnClick(): void;
    getTileType(): string;
    getSpecialType(): string;
    setTileType(tileType: string): void;
    setSpecialType(type: string): void;
}