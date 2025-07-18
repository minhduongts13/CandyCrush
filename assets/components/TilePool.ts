// TilePool.ts
import { _decorator, Component, instantiate, Prefab, Tween, Vec3, type Node } from 'cc'
const { ccclass, property } = _decorator
import GameConfig from '../constants/GameConfig'
import { Tile } from './Tile/Tile'
import { GAMEKEY } from '../constants/GameKey';
import Board from './Board';
@ccclass('TilePool')
export class TilePool extends Component {
    private tiles: Tile[] = [];

    @property(Prefab)
    private tilePrefab: Prefab | null = null

    __preload(): void {
        if (this.tilePrefab === null) throw new Error('Tile prefab is not set')
    }

    start(): void {

    }

    public getTile(x: number, y: number): Tile {
        let tile: Tile;

        if (this.tiles.length > 0) {
            tile = this.tiles.pop()!;
            const { x: xPos, y: yPos } = this.getTilePosition({ x, y });
            tile.node.setPosition(xPos, yPos);
            const randomTileType: string = GameConfig.CandyTypes[Math.floor(Math.random() * GameConfig.CandyTypes.length)]
            tile.setTileType(randomTileType)
            tile.node.active = true;
        } else {
            tile = this.creatileTile(x, y);
        }

        return tile;
    } 

    public release(tile: Tile): void {
        tile.node.active = false;
        tile.removeOnClickCallback();
        // Tween.stopAllByTarget(tile.node);
        tile.node.removeFromParent();
        tile.node.setPosition(GAMEKEY.TILE.INITIAL_POS.x, GAMEKEY.TILE.INITIAL_POS.y);
        this.tiles.push(tile);
    }

    private creatileTile(x: number, y: number): Tile {
        const randomTileType: string =
            GameConfig.CandyTypes[Math.floor(Math.random() * (GameConfig.CandyTypes.length))]
        const node = instantiate(this.tilePrefab) as Node | null
        if (node === null) throw new Error('Failed to instantiate tile prefab')
        const tile = node.getComponent(Tile) as Tile | null
        if (tile === null) throw new Error('Failed to get tile component')
        tile.setTileType(randomTileType)
        const { x: xPos, y: yPos } = this.getTilePosition({ x, y })
        node.setPosition(xPos, yPos)
        return tile
    }

    private getTilePosition(coords: { x: number; y: number }): { x: number; y: number } {
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
}