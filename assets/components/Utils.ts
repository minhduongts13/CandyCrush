import { _decorator, Component, instantiate, log, Prefab, Tween, tween, Vec3, Node, Input } from 'cc'
import GameConfig from '../constants/GameConfig';
import { IBoard, ITile } from '../constants/global';
import AnimationManager from './AnimationManager';
import { GAMEKEY } from '../constants/GameKey';
import { Tile } from './Tile/Tile';
const { ccclass, property } = _decorator;

@ccclass('Utils')
export class Utils extends Component {
    start() {

    }


    public static getTilePosition(coords: { x: number; y: number }): { x: number; y: number } {
        return {
            x:
                (-GameConfig.GridWidth * GameConfig.TileWidth) / 2 +
                GameConfig.TileWidth / 2 +
                coords.x * GameConfig.TileWidth,
            y:
                // Invert y coordinate since game world coordinates are inverted (positive y is up)
                -(
                    (-GameConfig.GridHeight * GameConfig.TileHeight) / 2 +
                    GameConfig.TileHeight / 2 +
                    coords.y * GameConfig.TileHeight
                ),
        }
    }

    public static getTileCoords(tileGrid: (ITile | undefined)[][], tile: ITile): { x: number; y: number } {
        for (let y = 0; y < GameConfig.GridHeight; y++) {
            for (let x = 0; x < GameConfig.GridWidth; x++) {
                if (tileGrid[y][x] === tile) {
                    return { x, y }
                }
            }
        }

        throw new Error('Tile not found')
    }
}


